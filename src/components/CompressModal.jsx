// components/CompressModal.jsx
import React, { useState } from 'react';
import { X, Zap, Download, CheckCircle2, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';
import { COMPRESSION_LEVELS, compressPDFDocument } from '../utils/compressUtils';
import { savePDFBytes } from '../utils/downloadUtils';

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const CompressModal = ({ show, onClose, pdfBytes, fileName, originalFileSize, onSaveSuccess }) => {
  const [selectedLevel, setSelectedLevel] = useState('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ pageNum: 0, totalPages: 0, percent: 0 });
  const [result, setResult] = useState(null);

  if (!show) return null;

  const effectiveOriginalSize = originalFileSize || (pdfBytes ? pdfBytes.byteLength : 0);

  const handleStartCompression = async () => {
    if (!pdfBytes) return;
    setIsProcessing(true);
    setResult(null);

    try {
      const res = await compressPDFDocument({
        pdfBytes,
        qualityLevel: selectedLevel,
        onProgress: (p) => setProgress(p),
        overrideOriginalSize: effectiveOriginalSize
      });
      setResult(res);
    } catch (err) {
      console.error('Error compressing PDF:', err);
      alert(`שגיאה בדחיסת הקובץ: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!result || !result.compressedBytes) return;

    let downloadName = fileName || 'document.pdf';
    downloadName = downloadName.replace(/\.pdf$/i, '') + '_compressed.pdf';

    await savePDFBytes(result.compressedBytes, downloadName, () => {
      if (onSaveSuccess) onSaveSuccess();
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans" dir="rtl">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">דחיסת קובץ PDF</h3>
              <p className="text-xs text-slate-500">הקטן את נפח הקובץ ישירות בדפדפן בפרטיות מלאה</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-30"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        {!result ? (
          <div className="space-y-5">
            {/* Original File Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">קובץ מקור:</span>
                <span className="text-sm font-bold text-slate-800 truncate max-w-[220px] block">{fileName || 'מסמך PDF'}</span>
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-slate-500 block">גודל נוכחי:</span>
                <span className="text-sm font-bold text-blue-600 font-mono">{effectiveOriginalSize ? formatFileSize(effectiveOriginalSize) : '-'}</span>
              </div>
            </div>

            {/* Level Selector */}
            {!isProcessing && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">בחר רמת דחיסה</label>
                <div className="grid grid-cols-1 gap-2.5">
                  {Object.values(COMPRESSION_LEVELS).map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setSelectedLevel(lvl.id)}
                      className={`p-3.5 text-right rounded-xl border transition-all flex items-center justify-between ${
                        selectedLevel === lvl.id
                          ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-800 mb-0.5">{lvl.label}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedLevel === lvl.id ? 'border-amber-600 bg-amber-600' : 'border-slate-300'
                      }`}>
                        {selectedLevel === lvl.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Section */}
            {isProcessing && (
              <div className="space-y-3 py-4 text-center">
                <div className="flex items-center justify-center gap-2 text-amber-600 font-bold text-sm">
                  <Loader2 className="animate-spin" size={18} />
                  <span>מעבד ומדחוס עמודים... ({progress.pageNum}/{progress.totalPages})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-200"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 font-mono">{progress.percent}% הושלם</span>
              </div>
            )}

            {/* Footer Buttons */}
            {!isProcessing && (
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-xs transition-colors"
                >
                  ביטול
                </button>
                <button
                  type="button"
                  onClick={handleStartCompression}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-2 transition-all"
                >
                  <Zap size={16} />
                  התחל דחיסה
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Compression Result Section */
          <div className="space-y-5 py-2">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
              <CheckCircle2 size={36} className="text-emerald-600 mx-auto animate-in zoom-in-50 duration-300" />
              <h4 className="font-bold text-base text-emerald-900">הדחיסה הושלמה בהצלחה!</h4>
              <p className="text-xs text-emerald-700 font-medium">הקובץ מוכן להורדה בנפח מופחת</p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <div>
                <span className="text-xs text-slate-500 font-medium block mb-1">גודל מקורי</span>
                <span className="text-sm font-bold text-slate-700 font-mono">{formatFileSize(result.originalSize)}</span>
              </div>
              <div className="border-r border-slate-200">
                <span className="text-xs text-emerald-600 font-semibold block mb-1">גודל חדש (חיסכון {result.savingsPercent}%)</span>
                <span className="text-base font-extrabold text-emerald-600 font-mono">{formatFileSize(result.compressedSize)}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-xs transition-colors"
              >
                סגור
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-2 transition-all"
              >
                <Download size={16} />
                הורד קובץ דחוס
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CompressModal;
