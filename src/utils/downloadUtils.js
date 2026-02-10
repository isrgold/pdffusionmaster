// utils/downloadUtils.js

export const downloadPDF = async ({
  documents,
  pages,
  elements,
  setIsDownloading
}) => {
  if (pages.length === 0) {
    alert('No pages to save.');
    return;
  }

  setIsDownloading(true);

  try {
    const { PDFDocument, degrees } = await import('pdf-lib');


    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    // Cache for loaded PDF-lib documents: { [docId]: PDFDocument }
    const loadedDocs = {};

    for (const page of pages) {
      // Load source document if not already loaded
      if (!loadedDocs[page.originalDocId]) {
        const docData = documents[page.originalDocId].data;
        loadedDocs[page.originalDocId] = await PDFDocument.load(docData);
      }

      const sourceDoc = loadedDocs[page.originalDocId];
      // Copy page from source
      const [copiedPage] = await mergedPdf.copyPages(sourceDoc, [page.pageIndex]);

      // Add page to merged document
      const newPage = mergedPdf.addPage(copiedPage);

      // Handle rotation if it was changed in the UI
      if (page.rotation) {
        const currentRotation = newPage.getRotation().angle;
        newPage.setRotation(degrees((currentRotation + page.rotation) % 360));
      }

      // Find elements for this page (using current pageId)
      const pageElements = elements.filter(el => el.pageId === page.id);

      if (pageElements.length > 0) {
        const { width: pageWidth, height: pageHeight } = newPage.getSize();

        // PDFViewer uses scale 1.5
        // We need to map coordinates from the 1.5x canvas to the actual PDF page size
        // The canvas dimensions in viewer were: page.getViewport({ scale: 1.5 })
        // So the factor is largely just 1/1.5, BUT rotation swaps dimensions!
        // However, pdf-lib handles rotation on the page object itself mostly.
        // Let's rely on standard scaling:

        // Fetch Hebrew-supporting font (Rubik) if we have any text elements
        const hasText = pageElements.some(el => el.type === 'text');
        let customFont = null;

        if (hasText) {
          try {
            // Using a CDN for Rubik (Google Fonts)
            const fontBytes = await fetch('https://cdn.jsdelivr.net/npm/@fontsource/rubik/files/rubik-latin-400-normal.woff').then(res => res.arrayBuffer())
              .catch(async () => {
                // Fallback to standard Helvetica if fetch fails (won't support Hebrew well)
                return null;
              });

            if (fontBytes) {
              customFont = await mergedPdf.embedFont(fontBytes);
            } else {
              customFont = await mergedPdf.embedFont(await mergedPdf.embedStandardFont('Helvetica'));
            }
          } catch (e) {
            console.warn("Could not load custom font, falling back", e);
            customFont = await mergedPdf.embedFont(await mergedPdf.embedStandardFont('Helvetica'));
          }
        }

        const scaleFactor = 1 / 1.5;

        for (const element of pageElements) {
          try {
            // Calculate PDF coordinates
            const pdfX = element.x * scaleFactor;
            const pdfY = pageHeight - (element.y * scaleFactor) - (element.height * scaleFactor);
            const pdfWidth = element.width * scaleFactor;
            const pdfHeight = element.height * scaleFactor;

            if (element.type === 'text') {
              // Draw Text
              const { text, color, baseFontSize, baseHeight } = element;

              // Calculate font size scaling
              // The font size in the PDF should be proportional to the visual scaling
              const scaleY = element.height / baseHeight;
              const scaledFontSize = baseFontSize * scaleY * scaleFactor;

              // Parse color hex to RGB
              const r = parseInt(color.slice(1, 3), 16) / 255;
              const g = parseInt(color.slice(3, 5), 16) / 255;
              const b = parseInt(color.slice(5, 7), 16) / 255;

              // Adjust position for text baseline/padding
              // The visual padding was 10px. 
              const paddingOffset = 10 * scaleFactor * scaleY;

              newPage.drawText(text, {
                x: pdfX + paddingOffset,
                y: pdfY + pdfHeight - (scaledFontSize) - paddingOffset, // Approximate baseline
                size: scaledFontSize,
                font: customFont,
                color: { type: 'RGB', r, g, b },
                maxWidth: pdfWidth - (paddingOffset * 2) // Basic wrapping
              });

            } else {
              // Draw Image (Signature)
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
                width: pdfWidth,
                height: pdfHeight
              });
            }
          } catch (err) {
            console.error(`Error adding element to page ${page.id}:`, err);
          }
        }
      }
    }

    // Save the PDF
    const pdfBytes = await mergedPdf.save();

    // Create download link
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `merged_document.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error creating PDF:', error);
    alert(`Error creating PDF: ${error.message}`);
  } finally {
    setIsDownloading(false);
  }
};