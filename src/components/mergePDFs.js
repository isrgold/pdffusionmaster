export async function mergePDFs(files, setStatus, setFiles) {
    const { PDFDocument } = await import('pdf-lib'); // Lazy load pdf-lib
  
    if (files.length < 2) {
      setStatus({ type: 'error', message: 'Please select at least 2 PDF files to merge' });
      return;
    }
  
    try {
      setStatus({ type: 'loading', message: 'Merging PDFs...' });
  
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const fileArrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileArrayBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }
  
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'merged.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  
      setStatus({ type: 'success', message: 'PDFs merged successfully!' });
      setFiles([]);
    } catch (error) {
      console.error('PDF merge error:', error);
      setStatus({ type: 'error', message: 'Failed to merge PDFs. Please try again.' });
    }
  }
  