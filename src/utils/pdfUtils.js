// utils/pdfUtils.js

let pdfjsLibInstance = null;

export const getPdfJs = async () => {
  if (pdfjsLibInstance) return pdfjsLibInstance;

  const pdfjsLib = await import('pdfjs-dist');
  const pdfWorker = await import('pdfjs-dist/build/pdf.worker.mjs?url');

  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker.default;

  pdfjsLibInstance = pdfjsLib;
  return pdfjsLib;
};

export const loadPDFLibraries = async () => {
  // Preload
  await getPdfJs();
};

export const renderPageThumbnail = async (page) => {
  const viewport = page.getViewport({ scale: 0.2 }); // Small scale for thumbnail
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  return canvas.toDataURL();
};