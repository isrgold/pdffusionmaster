// utils/compressUtils.js
import { getPdfJs } from './pdfUtils';

export const COMPRESSION_LEVELS = {
  high: { label: 'דחיסה קלה (איכות גבוהה - ~85%)', quality: 0.85, scale: 1.4, id: 'high' },
  medium: { label: 'דחיסה מאוזנת (איכות בינונית - מומלץ ~60%)', quality: 0.60, scale: 1.1, id: 'medium' },
  low: { label: 'דחיסה מרבית (גודל קטן מאוד - ~35%)', quality: 0.35, scale: 0.85, id: 'low' }
};

export const compressPDFDocument = async ({ pdfBytes, qualityLevel = 'medium', onProgress, overrideOriginalSize }) => {
  const pdfjsLib = await getPdfJs();
  const { PDFDocument } = await import('pdf-lib');

  const levelConfig = COMPRESSION_LEVELS[qualityLevel] || COMPRESSION_LEVELS.medium;

  // Load document into PDF.js
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdfjsDoc = await loadingTask.promise;
  const numPages = pdfjsDoc.numPages;

  // Create new PDFDocument
  const compressedPdf = await PDFDocument.create();

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (onProgress) {
      onProgress({
        pageNum,
        totalPages: numPages,
        percent: Math.round(((pageNum - 1) / numPages) * 100)
      });
    }

    const page = await pdfjsDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: levelConfig.scale });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise;

    const jpegDataUrl = canvas.toDataURL('image/jpeg', levelConfig.quality);
    const base64Data = jpegDataUrl.split(',')[1];
    const binaryString = atob(base64Data);
    const imageBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      imageBytes[i] = binaryString.charCodeAt(i);
    }

    const embeddedImage = await compressedPdf.embedJpg(imageBytes);
    const originalWidth = viewport.width / levelConfig.scale;
    const originalHeight = viewport.height / levelConfig.scale;

    const newPage = compressedPdf.addPage([originalWidth, originalHeight]);

    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: originalWidth,
      height: originalHeight
    });
  }

  if (onProgress) {
    onProgress({ pageNum: numPages, totalPages: numPages, percent: 100 });
  }

  const compressedBytes = await compressedPdf.save();
  const originalSize = overrideOriginalSize || pdfBytes.byteLength;
  const compressedSize = compressedBytes.byteLength;
  const savingsPercent = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

  return {
    compressedBytes,
    originalSize,
    compressedSize,
    savingsPercent
  };
};
