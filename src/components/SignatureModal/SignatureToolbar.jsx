// components/SignatureModal/SignatureToolbar.jsx
import React, { useRef } from 'react';
import { PenTool, Type, Palette, Upload } from 'lucide-react';

const PRESET_COLORS = ['#000000', '#1E3A8A', '#2563EB', '#DC2626', '#16A34A'];

const SignatureToolbar = ({
  mode,
  setMode,
  signatureColor,
  setSignatureColor,
  fontSize,
  setFontSize,
  strokeWidth,
  setStrokeWidth,
  onUploadImage
}) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onUploadImage) {
      const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
      if (!isPng) {
        alert('ניתן להעלות קבצי תמונה בפורמט PNG בלבד.');
        e.target.value = null;
        return;
      }
      onUploadImage(file);
    }
    e.target.value = null;
  };

  return (
    <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-3 sm:p-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Mode Selection */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              mode === 'draw'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <PenTool size={15} />
            ציור בכתב יד
          </button>

          <button
            type="button"
            onClick={() => setMode('text')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              mode === 'text'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Type size={15} />
            טקסט מודפס
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,.png"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 transition-colors"
            title="העלאת תמונת חתימה בפורמט PNG"
          >
            <Upload size={15} />
            העלאת תמונת PNG
          </button>
        </div>

        {/* Controls: Color Swatches & Stroke/Font Size */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Color Selection */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            <Palette size={15} className="text-slate-400" />
            <div className="flex items-center gap-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSignatureColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    signatureColor.toLowerCase() === c.toLowerCase()
                      ? 'ring-2 ring-blue-500 ring-offset-1 scale-110'
                      : 'border-slate-300 hover:scale-105'
                  }`}
                />
              ))}
            </div>
            <input
              type="color"
              value={signatureColor}
              onChange={(e) => setSignatureColor(e.target.value)}
              className="w-6 h-6 rounded border border-slate-300 cursor-pointer p-0 bg-transparent shrink-0 mr-1"
            />
          </div>

          {/* Size / Stroke Width */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            <label className="text-xs font-semibold text-slate-700">
              {mode === 'text' ? 'גודל:' : 'עובי:'}
            </label>
            <input
              type="range"
              min={mode === 'text' ? '14' : '2'}
              max={mode === 'text' ? '48' : '10'}
              value={mode === 'text' ? fontSize : strokeWidth}
              onChange={
                mode === 'text'
                  ? (e) => setFontSize(Number(e.target.value))
                  : (e) => setStrokeWidth(Number(e.target.value))
              }
              className="w-20 accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-600 min-w-[24px] text-center">
              {mode === 'text' ? `${fontSize}px` : `${strokeWidth / 2}px`}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SignatureToolbar;