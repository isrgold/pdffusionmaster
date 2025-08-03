// utils/downloadUtils.js
export const downloadPDF = async ({
  pdfData,
  pdfDocRef,
  elements,
  fileName,
  setIsDownloading
}) => {
  if (!window.PDFLib || !pdfData || elements.length === 0) {
    if (!window.PDFLib) {
      alert('PDF-lib is still loading. Please try again in a moment.');
      return;
    }
    if (elements.length === 0) {
      alert('No elements to add to PDF. Add some text or signatures first.');
      return;
    }
    if (!pdfData) {
      alert('PDF data not available. Please reload the PDF.');
      return;
    }
    return;
  }

  setIsDownloading(true);

  try {
    const { PDFDocument } = window.PDFLib;
    
    // Load the original PDF directly from the stored Uint8Array
    const pdfDoc = await PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();

    // Process each page that has elements
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const pageElements = elements.filter(el => el.page === pageIndex);
      
      if (pageElements.length > 0) {
        const page = pages[pageIndex];
        const { width: pageWidth, height: pageHeight } = page.getSize();
        
        // Get the original page viewport for scaling calculations
        const pdfPage = await pdfDocRef.getPage(pageIndex + 1);
        const viewport = pdfPage.getViewport({ scale: 1.5 });
        
        // Calculate scaling factors
        const scaleX = pageWidth / viewport.width;
        const scaleY = pageHeight / viewport.height;

        for (const element of pageElements) {
          try {
            // Convert data URL to bytes more reliably
            const base64Data = element.dataUrl.split(',')[1];
            const binaryString = atob(base64Data);
            const imageBytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              imageBytes[i] = binaryString.charCodeAt(i);
            }
            
            // Embed the image
            const image = await pdfDoc.embedPng(imageBytes);
            
            // Calculate position and size
            // PDF coordinates start from bottom-left, canvas from top-left
            const x = element.x * scaleX;
            const y = pageHeight - (element.y * scaleY) - (element.height * scaleY);
            const width = element.width * scaleX;
            const height = element.height * scaleY;
            
            // Draw the image on the page
            page.drawImage(image, {
              x,
              y,
              width,
              height,
            });
          } catch (error) {
            console.error(`Error adding element ${element.id} to page ${pageIndex}:`, error);
          }
        }
      }
    }

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    
    // Create download link
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName.replace('.pdf', '')}_edited.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error creating PDF:', error);
    alert(`Error creating PDF: ${error.message}. Please try uploading the PDF again.`);
  } finally {
    setIsDownloading(false);
  }
};