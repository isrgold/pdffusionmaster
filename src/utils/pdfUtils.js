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
  await getPdfJs();
};

export const renderPageThumbnail = async (page) => {
  const dpr = Math.max(window.devicePixelRatio || 1, 2);
  const viewport = page.getViewport({ scale: 0.3 * dpr });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.height = Math.floor(viewport.height);
  canvas.width = Math.floor(viewport.width);

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  return canvas.toDataURL('image/jpeg', 0.85);
};