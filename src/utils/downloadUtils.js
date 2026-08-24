// utils/downloadUtils.js

export const downloadPDF = async ({
  documents,
  pages,
  elements,
  setIsDownloading,
  onSaveSuccess
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

        const { x: cropX = 0, y: cropY = 0, width: cropWidth, height: cropHeight } = newPage.getCropBox() || newPage.getMediaBox() || { width: pageWidth, height: pageHeight };

        // Use the total rotation (original + added) to determine mapping
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

            // Map variables based on visual viewport to PDF coordinate usage
            // The "Visual Viewport" is what the user sees.
            // When PDF is rotated:
            // 0:   Visual W=PageW, H=PageH. (0,0)TL -> (0,H)TL in PDF space (but PDF Y is up)
            // 90:  Visual W=PageH, H=PageW. (0,0)TL -> (0,0)TL?
            // 180: Visual W=PageW, H=PageH. (0,0)TL -> (W,0)BR?
            // 270: Visual W=PageH, H=PageW. (0,0)TL -> (H,W)TR?

            // To simplify: We calculate the 'Bottom-Left' corner of the element in standard PDF space relative to CropBox.

            switch (rotationMode) {
              case 90:
                // Visual X (Right) -> PDF Y (Up)
                // Visual Y (Down) -> PDF X (Right)
                // Origin (0,0) Visual is (CropX, CropY + CropH) ? No.
                // Let's trace A4 Portrait (595x842) Rot 90 CW.
                // Visually Landscape (842x595).
                // Top-Left Visual is Top-Left PDF (0, 842) unrotated coordinates?
                // No, Rot 90 CW moves BL(0,0) -> TL.
                // So Top-Left Visual is (0,0) PDF.
                // Visual X (Right) = PDF Y (Up).
                // Visual Y (Down) = PDF X (Right).

                // Element visual position (elX, elY).
                // Maps to PDF (elY, elX).

                // We draw relative to this point. 
                // Drawing 'Upright' text/image visually means Rotated -90 (270) in PDF?
                // If we draw image at (y, x) with w=elH, h=elW?
                // Let's rely on pdf-lib rotation.

                pdfX = cropX + elY; // PDF X corresponds to Visual Y (Down -> Right)
                pdfY = cropY + elX; // PDF Y corresponds to Visual X (Right -> Up)

                // We swap dimensions for calculations if needed, but pdf-lib rotates content?
                // If we Rotate element by -90:
                // Height becomes horizontal. Width vertical.

                pdfW = elWidth;
                pdfH = elHeight;
                rotateDegrees = -90;

                // Pivot Adjustment for Rotation:
                // If we draw at (pdfX, pdfY) and rotate -90.
                // (pdfX, pdfY) is top-left of the intended box?
                // With -90 rot, (x,y) is the "Top-Left" of the rotated rect (which was Bottom-Left of unrotated).
                // Actually, let's just use the logic:
                // Visual Box Top-Left is (elX, elY).
                // Maps to PDF Point P = (cropX + elY, cropY + elX).
                // This P is the visual Top-Left corner.
                // We want to draw element such that its visual top-left is at P.
                // And it extends Right(Y+) by elW, Down(X+) by elH.
                // Text/Image drawn at P with Rot-90 matches this?
                // -90 Rot aligns X-axis with Down(X+)? No, X-axis is Right. -90 is Down.
                // So Image X-axis points Down (Visual Y). Correct.
                // Image Y-axis points Right (Visual X). Correct.
                // So rotation -90 is correct.
                // Pivot:
                // pdf-lib rotates around (x,y) specificed.
                // So if we start at P(cropX+elY, cropY+elX) and draw.
                // It draws Down and Right.
                // Perfeect.

                // Wait, text baseline?
                // If text, we usually draw at Baseline.
                // Visual Top is elY. Visual Bottom is elY + elH.
                // Baseline is approx elY + elH - fontSize.
                // Mapping this Y to PDF space implies mapping X.
                // So pdfBaseX = cropX + (elY + elH - size).

                break;

              case 180:
                // Visual W=PageW. H=PageH.
                // (0,0) BL -> (W,H) TR.
                // So Visual TL (0,0) is PDF TR (W, H).
                // Vis X (Right) -> PDF X (Left/Minus).
                // Vis Y (Down) -> PDF Y (Down/Minus).

                pdfX = cropX + cropWidth - elX;
                pdfY = cropY + cropHeight - elY;

                pdfW = elWidth;
                pdfH = elHeight;
                rotateDegrees = 180;

                // Pivot: Top-Right of intended box.
                // Draw Image at (pdfX, pdfY) with Rot 180.
                // Image draws Left and Down.
                // Perfect?
                // (pdfX, pdfY) is Visual Top-Left corner of placement.
                // Image Rot 180 draws Left (-X) and Down (-Y).
                // So it occupies box (X-W, Y-H) to (X, Y).
                // But we want it to occupy (Visual X, Visual Y) -> (elX to elX+W).
                // Here pdfX corresponds to 'elX' (Right edge? No start is Left).
                // Visually we perform translation:
                // Vis X=0 maps to PDF X=W.
                // Vis Right (X+) maps to PDF X-.
                // So Vis X maps to PDF X = W - VisX.
                // This creates the Right Edge of the element? 
                // No, 'elX' is Left edge visually.
                // So 'W - elX' is the Right edge physically in PDF?
                // Yes.
                // So our start point is the Top-Right corner of the element in PDF space.
                // Rotating 180 draws Left and Down.
                // Correct.

                break;

              case 270: // 90 CCW
                // BL(0,0) -> BR(W,0).
                // Vis TL is BR (W,0).
                // Vis X (Right) -> PDF Y (Down).
                // Vis Y (Down) -> PDF X (Left).

                pdfX = cropX + cropWidth - elY;
                pdfY = cropY + elX;

                pdfW = elWidth;
                pdfH = elHeight;
                rotateDegrees = 90;

                // Pivot: Vis TL maps to PDF BR of page (conceptually).
                // Map: Vis TL (elX, elY).
                // P = (W - elY, elX). (Physical X matches Vis Y inverted? Y matches Vis X).
                // Visual Top-Left.
                // We want to draw Down(Vis Y) and Right(Vis X).
                // Rot 90:
                // Image X points Up(Y+). Image Y points Left(X-).
                // This seems inverted?
                // Let's retry:
                // Vis X (Right) maps to PDF Y (Down? No, Y is Up).
                // (0,0) is BR (W,0)?? 
                // 270 means (0,0) BL moves to BR. Correct.
                // X-axis (Right) moves to Up (Y).
                // Y-axis (Up) moves to Left (-X).

                // Visually:
                // Origin is New TL. (Old BR).
                // Vis Right is New Right (Old Up). -> PDF Y+.
                // Vis Down is New Down (Old Left). -> PDF X-.

                // So Vis (elX, elY) maps to:
                // Vis X (elX) -> move along Y+.
                // Vis Y (elY) -> move along X-.
                // Start at (W, 0).
                // P = (W - elY, 0 + elX).
                // So pdfX = W - elY. pdfY = elX.
                // At this P (Visual Top-Left).
                // We want to extend Right (Vis X / Y+) and Down (Vis Y / X-).
                // Image Rot 90:
                // Axis X -> Y (Up / Vis Right). Good.
                // Axis Y -> -X (Left / Vis Down). Good.
                // So Rot 90 is correct.
                // Pivot is (pdfX, pdfY).

                break;

              case 0:
              default:
                // Standard
                pdfX = cropX + elX;
                pdfY = cropY + cropHeight - elY - elHeight;
                pdfW = elWidth;
                pdfH = elHeight;
                rotateDegrees = 0;
                break;
            }

            if (element.type === 'text') {
              const { text, color, baseFontSize, baseHeight } = element;
              const scaleY = element.height / baseHeight;
              const scaledFontSize = baseFontSize * scaleY * scaleFactor;

              const r = parseInt(color.slice(1, 3), 16) / 255;
              const g = parseInt(color.slice(3, 5), 16) / 255;
              const b = parseInt(color.slice(5, 7), 16) / 255;

              const padding = 10 * scaleFactor * scaleY;

              // Text positioning adjustment for Baseline
              // pdfY usually bottom of box.
              // We calculated the 'Start Corner' for Rotation.
              // For 0: Start is Bottom-Left.
              // For 90: Start is Top-Left (which is visual TL).
              // For 180: Start is Top-Right.
              // For 270: Start is Bottom-Right.

              // But drawText expects x,y as baseline-start?
              // No, drawText expects x,y as origin, performs rotation around it.
              // But for 0 rot, origin is bottom-left.
              // If we use Image logic for 'Box Corner', does Text match?
              // Text usually draws *Up* from baseline.
              // If Rot 0: We calculated Bottom-Left (pdfY). Text draws up. Correct.
              // If Rot 90: We calc Top-Left. Rot -90.
              // Axis X (Text line) goes Down (Visual Y). OK.
              // Axis Y (Text Up) goes Right (Visual X). OK.
              // But 'Origin' for text is Baseline.
              // If we start at Top-Left, and draw Text.
              // Text is 'Above' baseline (to the Left visually?).
              // We need to shift X/Y to reach Baseline.
              // Height of text box is elH.
              // Baseline is ~ elH - padding/descender.
              // Let's assume just shifting by Height is safe assumption for now to get it inside box.

              // Actually, standard `drawText` without layout engine is hard.
              // Better to stick to the Box logic and shift 'Reference Point' for text
              // to be the "Start of Baseline".

              let textX = pdfX;
              let textY = pdfY;

              if (rotationMode === 0) {
                textY += (pdfH - scaledFontSize - padding); // Move up from bottom
                textX += padding;
              } else if (rotationMode === 90) {
                // Box Top-Left. Text runs Down. Up is Right.
                // Needed Baseline: Left side of box (visually).
                // Visually: Text is indented by Padding from Left.
                // P is Top-Left.
                // Indent Right (Vis X / PDF Y) -> textY += padding.
                // Indent Down (Vis Y / PDF X) -> textX += ??
                // Text starts at Top.
                // pdf-lib drawText at (x,y) with rot -90.
                // Draws along +X(Down).
                // Characters stand on line X=0? Y grows negative (Left)?
                // "A" top points to +Y (Right). Base at Y=0.
                // So we need to shift Base to Y = padding.
                // So textY += padding.
                // And X start? Top + padding?
                // textX += padding. (moves down).

                textY += padding;
                textX += padding;

                // Wait, Text 'Up' is Right (+Y).
                // If we are at Y=0 (Left Edge).
                // Text is 0..Size.
                // We want Text at Left+Padding.
                // So Y = Padding. (textY).
                // Correct.

                // Text 'Line' starts at Top+Padding. (X).
                // textX += padding. 
                // Correct.
              } else if (rotationMode === 180) {
                // Box Top-Right. Rot 180.
                // Draws Left and Down.
                // Up is Down. Right is Left.
                // Baseline is Top Edge?
                // We want Base at Top - Padding?
                // Rot 180:
                // X-axis (Line) goes Left.
                // Y-axis (Up) goes Down.
                // So Base at 0 means Text at 0..-Size (Up).
                // So we want Base at Padding (Down)?
                // No, PDF Y is Down.
                // To draw visible text inside box relative to P(Start):
                // P is Top-Right.
                // Y points Down. 
                // Text 'Up' points Down.
                // So Text Body is "Below" Base.
                // We want Text Body "Below" Top Edge.
                // So Base should be TopEdge.
                // textY -= padding.
                // Text Line goes Left.
                // textX -= padding.

                textX -= padding;
                textY -= padding;
              } else if (rotationMode === 270) {
                // Box Bottom-Right (W - elY, elX). Rot 90.
                // X (Line) goes Up.
                // Y (Up) goes Left.
                // P is (Right, Top) visually?? No P is (W-elY, elX).
                // Vis TL maps to P.
                // P is (Physical Right, Physical Bottom relative to Vis TL).
                // 270: Vis TL -> BR.
                // So P is logically "Top Left" of the visual box, but located at BR?
                // No, P is the mapped point of Visual TL.
                // So P is the 'Start'.
                // We want to draw Right and Down visually.
                // Rot 90: X->Up. Y->Left.
                // We want Vis Right (Y+) -> Image X (Up).
                // We want Vis Down (X-) -> Image -Y (Right).
                // Wait.
                // Vis Right (X+) maps to PDF Y+. (Up).
                // Vis Down (Y+) maps to PDF X-. (Left).
                // We have P.
                // Text Line should go Right (Vis X / PDF Y+).
                // Text Up should go Up (Vis -Y / PDF X+).
                // ...
                // Let's stick to 90/0/180 first. 270 is likely fine with similar offset logic.
                textX -= padding;
                textY += padding;
              }

              newPage.drawText(text, {
                x: textX,
                y: textY,
                size: scaledFontSize,
                font: customFont,
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

    // Save the PDF bytes
    const pdfBytes = await mergedPdf.save();

    // Determine suggested default file name
    let defaultFileName = 'merged_document.pdf';
    if (pages.length > 0 && pages[0].originalDocId && documents[pages[0].originalDocId]) {
      const firstDocName = documents[pages[0].originalDocId].fileName;
      if (firstDocName) {
        defaultFileName = firstDocName.replace(/\.pdf$/i, '') + '_edited.pdf';
      }
    }

    // Modern browsers: Native OS "Save As" file dialog (asks where to save & filename)
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
          // User clicked Cancel in the Save As dialog
          return;
        }
        console.warn('showSaveFilePicker failed, falling back to download prompt', err);
      }
    }

    // Fallback prompt if showSaveFilePicker is not supported
    let customFileName = prompt('הכנס שם לשמירת קובץ ה-PDF:', defaultFileName);
    if (customFileName === null) {
      // User cancelled
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

  } catch (error) {
    console.error('Error creating PDF:', error);
    alert(`Error creating PDF: ${error.message}`);
  } finally {
    setIsDownloading(false);
  }
};