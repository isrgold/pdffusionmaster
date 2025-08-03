// utils/pdfUtils.js
export const loadPDFLibraries = async () => {
  // Load PDF.js
  const pdfScript = document.createElement('script');
  pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  pdfScript.onload = () => {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  };
  document.head.appendChild(pdfScript);
  
  // Load PDF-lib
  const pdfLibScript = document.createElement('script');
  pdfLibScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
  document.head.appendChild(pdfLibScript);
};