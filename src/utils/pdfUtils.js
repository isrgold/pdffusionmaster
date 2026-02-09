// utils/pdfUtils.js
import * as pdfjsLib from 'pdfjs-dist';
// Set up the worker
// Using valid URL for Vite to handle the worker file correctly
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const loadPDFLibraries = async () => {
  // No-op or removed, as we import directly now.
  // Keeping it as no-op to avoid breaking existing calls immediately,
  // though we should remove calls to it.
  return Promise.resolve();
};

export { pdfjsLib };

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