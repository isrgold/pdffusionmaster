import { PDFDocument, degrees } from 'pdf-lib';

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

        const scaleFactor = 1 / 1.5;

        for (const element of pageElements) {
          try {
            // Convert data URL to bytes
            const base64Data = element.dataUrl.split(',')[1];
            const binaryString = atob(base64Data);
            const imageBytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              imageBytes[i] = binaryString.charCodeAt(i);
            }

            const image = await mergedPdf.embedPng(imageBytes);

            // Calculate position constraints
            // PDF coordinates: (0,0) is bottom-left. Canvas: (0,0) is top-left.
            // We need to flip Y.

            // Element x/y are relative to the canvas (which is 1.5x scaled)
            const pdfX = element.x * scaleFactor;

            // For Y: The visual top in PDF is at y = height.
            // The element.y is distance from top of canvas.
            // So y distance from bottom of PDF page = pageHeight - (element.y * scaleFactor) - (elementHeight * scale)
            const pdfY = pageHeight - (element.y * scaleFactor) - (element.height * scaleFactor);

            const pdfWidth = element.width * scaleFactor;
            const pdfHeight = element.height * scaleFactor;

            newPage.drawImage(image, {
              x: pdfX,
              y: pdfY,
              width: pdfWidth,
              height: pdfHeight
            });
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