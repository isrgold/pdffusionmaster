import { PDFDocument } from 'pdf-lib';

export async function mergePDFs(files, setStatus, setFiles) {
  // Input validation
  if (!Array.isArray(files)) {
    setStatus({ type: 'error', message: 'Invalid input: files must be an array' });
    return;
  }

  if (files.length < 2) {
    setStatus({ type: 'error', message: 'Please select at least 2 PDF files to merge' });
    return;
  }

  // Validate file types
  const invalidFiles = files.filter(file => file.type !== 'application/pdf');
  if (invalidFiles.length > 0) {
    setStatus({ type: 'error', message: 'All files must be PDFs' });
    return;
  }

  try {
    setStatus({ type: 'loading', message: 'Merging PDFs...' });

    const mergedPdf = await PDFDocument.create();
    let totalPages = 0;

    // Process files with progress tracking
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setStatus({
        type: 'loading',
        message: `Processing file ${i + 1} of ${files.length}...`
      });

      const fileArrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(fileArrayBuffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
      totalPages += pages.length;
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `merged-${timestamp}.pdf`;

    // Save and download
    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

    // Use more modern download approach
    try {
      // Try using the modern showSaveFilePicker API if available
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'PDF Document',
          accept: { 'application/pdf': ['.pdf'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (e) {
      // Fall back to traditional download if showSaveFilePicker is not available
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }

    setStatus({
      type: 'success',
      message: `PDFs merged successfully! Total pages: ${totalPages}`
    });
    setFiles([]);

  } catch (error) {
    console.error('PDF merge error:', error);
    setStatus({
      type: 'error',
      message: `Failed to merge PDFs: ${error.message}. Please try again.`
    });
  }
}