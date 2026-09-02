// utils/downloadUtils.js

const FONT_URLS = {
  'Heebo': 'https://cdn.jsdelivr.net/npm/@fontsource/heebo/files/heebo-hebrew-400-normal.woff',
  'Rubik': 'https://cdn.jsdelivr.net/npm/@fontsource/rubik/files/rubik-latin-400-normal.woff',
  'Assistant': 'https://cdn.jsdelivr.net/npm/@fontsource/assistant/files/assistant-hebrew-400-normal.woff',
  'Frank Ruhl Libre': 'https://cdn.jsdelivr.net/npm/@fontsource/frank-ruhl-libre/files/frank-ruhl-libre-hebrew-400-normal.woff',
  'David Libre': 'https://cdn.jsdelivr.net/npm/@fontsource/david-libre/files/david-libre-hebrew-400-normal.woff',
  'Alef': 'https://cdn.jsdelivr.net/npm/@fontsource/alef/files/alef-hebrew-400-normal.woff',
  'Courier Prime': 'https://cdn.jsdelivr.net/npm/@fontsource/courier-prime/files/courier-prime-latin-400-normal.woff'
};

const fontBytesCache = {};

const getFontBytes = async (fontName) => {
  const name = fontName || 'Heebo';
  if (fontBytesCache[name]) return fontBytesCache[name];

  const url = FONT_URLS[name] || FONT_URLS['Heebo'];
  try {
    const res = await fetch(url);
    if (res.ok) {
      fontBytesCache[name] = await res.arrayBuffer();
      return fontBytesCache[name];
    }
  } catch (e) {
    console.warn(`Could not fetch font ${name}:`, e);
  }

  if (name !== 'Heebo') {
    return getFontBytes('Heebo');
  }
  return null;
};

export const generateMergedPDFBytes = async ({ documents, pages, elements }) => {
  if (!pages || pages.length === 0) {
    throw new Error('אין עמודים לשמירה.');
  }

  const { PDFDocument, degrees } = await import('pdf-lib');
  const mergedPdf = await PDFDocument.create();
  const loadedDocs = {};
  const embeddedFontsMap = {};

  const getEmbeddedFont = async (fontName) => {
    const name = fontName || 'Heebo';
    if (embeddedFontsMap[name]) return embeddedFontsMap[name];

    const fontBytes = await getFontBytes(name);
    if (fontBytes) {
      try {
        embeddedFontsMap[name] = await mergedPdf.embedFont(fontBytes);
        return embeddedFontsMap[name];
      } catch (e) {
        console.warn(`Could not embed font ${name}:`, e);
      }
    }

    const fallback = await mergedPdf.embedFont(await mergedPdf.embedStandardFont('Helvetica'));
    embeddedFontsMap[name] = fallback;
    return fallback;
  };

  for (const page of pages) {
    if (!loadedDocs[page.originalDocId]) {
      const docData = documents[page.originalDocId].data;
      loadedDocs[page.originalDocId] = await PDFDocument.load(docData);
    }

    const sourceDoc = loadedDocs[page.originalDocId];
    const [copiedPage] = await mergedPdf.copyPages(sourceDoc, [page.pageIndex]);

    const newPage = mergedPdf.addPage(copiedPage);

    if (page.rotation) {
      const currentRotation = newPage.getRotation().angle;
      newPage.setRotation(degrees((currentRotation + page.rotation) % 360));
    }

    const pageElements = elements.filter(el => el.pageId === page.id);

    if (pageElements.length > 0) {
      const { width: pageWidth, height: pageHeight } = newPage.getSize();
      const scaleFactor = 1 / 1.5;

      const { x: cropX = 0, y: cropY = 0, width: cropWidth, height: cropHeight } = newPage.getCropBox() || newPage.getMediaBox() || { width: pageWidth, height: pageHeight };

      const totalRotation = newPage.getRotation().angle;
      const normalizeRotation = (r) => ((r % 360) + 360) % 360;
      const rotationMode = normalizeRotation(totalRotation);

      for (const element of pageElements) {
        try {
          const elWidth = element.width * scaleFactor;
          const elHeight = element.height * scaleFactor;
          const elX = element.x * scaleFactor;
          const elY = element.y * scaleFactor;

          let pdfX, pdfY, pdfW, pdfH, rotateDegrees;

          switch (rotationMode) {
            case 90:
              pdfX = cropX + elY;
              pdfY = cropY + elX + elWidth;
              pdfW = elWidth;
              pdfH = elHeight;
              rotateDegrees = -90;
              break;

            case 180:
              pdfX = cropX + cropWidth - elX;
              pdfY = cropY + elY + elHeight;
              pdfW = elWidth;
              pdfH = elHeight;
              rotateDegrees = 180;
              break;

            case 270:
              pdfX = cropX + cropWidth - elY;
              pdfY = cropY + cropHeight - elX - elWidth;
              pdfW = elWidth;
              pdfH = elHeight;
              rotateDegrees = 90;
              break;

            case 0:
            default:
              pdfX = cropX + elX;
              pdfY = cropY + cropHeight - elY - elHeight;
              pdfW = elWidth;
              pdfH = elHeight;
              rotateDegrees = 0;
              break;
          }

          if (element.type === 'text') {
            const { text, color, baseFontSize, baseHeight, fontFamily } = element;
            const fontToUse = await getEmbeddedFont(fontFamily);

            const scaleY = element.height / baseHeight;
            const scaledFontSize = baseFontSize * scaleY * scaleFactor;

            const r = parseInt(color.slice(1, 3), 16) / 255;
            const g = parseInt(color.slice(3, 5), 16) / 255;
            const b = parseInt(color.slice(5, 7), 16) / 255;

            const padding = 10 * scaleFactor * scaleY;

            let textX = pdfX;
            let textY = pdfY;

            if (rotationMode === 0) {
              textY += (pdfH - scaledFontSize - padding);
              textX += padding;
            } else if (rotationMode === 90) {
              textY += padding;
              textX += padding;
            } else if (rotationMode === 180) {
              textX -= padding;
              textY -= padding;
            } else if (rotationMode === 270) {
              textX -= padding;
              textY += padding;
            }

            newPage.drawText(text, {
              x: textX,
              y: textY,
              size: scaledFontSize,
              font: fontToUse,
              color: { type: 'RGB', r, g, b },
              maxWidth: pdfW - (padding * 2),
              rotate: degrees(rotateDegrees)
            });

          } else {
            // Draw Image
            const base64Data = element.dataUrl.split(',')[1];
            const binaryString = atob(base64Data);
            const imageBytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              imageBytes[i] = binaryString.charCodeAt(i);
            }

            const image = await mergedPdf.embedPng(imageBytes);

            newPage.drawImage(image, {
              x: pdfX,
              y: pdfY,
              width: pdfW,
              height: pdfH,
              rotate: degrees(rotateDegrees)
            });
          }
        } catch (err) {
          console.error(`Error adding element to page ${page.id}:`, err);
        }
      }
    }
  }

  const pdfBytes = await mergedPdf.save();

  let defaultFileName = 'merged_document.pdf';
  if (pages.length > 0 && pages[0].originalDocId && documents[pages[0].originalDocId]) {
    const firstDocName = documents[pages[0].originalDocId].fileName;
    if (firstDocName) {
      defaultFileName = firstDocName.replace(/\.pdf$/i, '') + '_edited.pdf';
    }
  }

  return { pdfBytes, fileName: defaultFileName };
};

export const savePDFBytes = async (pdfBytes, defaultFileName = 'document.pdf', onSaveSuccess) => {
  if (typeof window.showSaveFilePicker === 'function') {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: defaultFileName,
        types: [{
          description: 'PDF Document',
          accept: { 'application/pdf': ['.pdf'] }
        }]
      });

      const writableStream = await fileHandle.createWritable();
      await writableStream.write(pdfBytes);
      await writableStream.close();
      if (onSaveSuccess) onSaveSuccess();
      return;
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.warn('showSaveFilePicker failed, falling back to download prompt', err);
    }
  }

  let customFileName = prompt('הכנס שם לשמירת קובץ ה-PDF:', defaultFileName);
  if (customFileName === null) {
    return;
  }
  customFileName = customFileName.trim();
  if (!customFileName) {
    customFileName = defaultFileName;
  }
  if (!customFileName.toLowerCase().endsWith('.pdf')) {
    customFileName += '.pdf';
  }

  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = customFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  if (onSaveSuccess) onSaveSuccess();
};

export const downloadPDF = async ({
  documents,
  pages,
  elements,
  setIsDownloading,
  onSaveSuccess
}) => {
  if (pages.length === 0) {
    alert('אין עמודים לשמירה.');
    setIsDownloading(false);
    return;
  }

  try {
    const { pdfBytes, fileName: defaultFileName } = await generateMergedPDFBytes({
      documents,
      pages,
      elements
    });

    await savePDFBytes(pdfBytes, defaultFileName, onSaveSuccess);

  } catch (error) {
    console.error('Error creating PDF:', error);
    alert(`Error creating PDF: ${error.message}`);
  } finally {
    setIsDownloading(false);
  }
};