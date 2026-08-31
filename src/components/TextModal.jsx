// components/TextModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export const FONT_OPTIONS = [
  { id: 'Heebo', label: 'היבו (Heebo) - נקי ומודרני', fontFamily: 'Heebo, sans-serif' },
  { id: 'Rubik', label: 'רוביק (Rubik) - עגלגל', fontFamily: 'Rubik, sans-serif' },
  { id: 'Assistant', label: 'אסיסטנט (Assistant) - היי-טק', fontFamily: 'Assistant, sans-serif' },
  { id: 'Frank Ruhl Libre', label: 'פרנק רוהל (Frank Ruhl) - קלאסי', fontFamily: "'Frank Ruhl Libre', serif" },
  { id: 'David Libre', label: 'דוד (David Libre) - רשמי', fontFamily: "'David Libre', serif" },
  { id: 'Alef', label: 'אלף (Alef) - אלגנטי', fontFamily: 'Alef, serif' },
  { id: 'Courier Prime', label: 'קורייר (Courier) - מכונת כתיבה', fontFamily: "'Courier Prime', monospace" }
];

const TextModal = ({ show, onClose, onSubmit, clickPosition }) => {
  const [textInput, setTextInput] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#000000');
  const [fontFamily, setFontFamily] = useState('Heebo');

  const canvasRef = useRef(null);

  useEffect(() => {
    if (show && textInput) {
      createTextOnCanvas();
    }
  }, [textInput, fontSize, textColor, fontFamily, show]);

  const getSelectedFontFamily = () => {
    const selected = FONT_OPTIONS.find(f => f.id === fontFamily);
    return selected ? selected.fontFamily : 'Heebo, sans-serif';
  };

  const createTextOnCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (textInput.trim()) {
      const selectedFont = getSelectedFontFamily();
      ctx.font = `${fontSize}px ${selectedFont}`;
      ctx.fillStyle = textColor;
      ctx.textBaseline = 'top';

      const metrics = ctx.measureText(textInput);
      const textWidth = metrics.width;
      const textHeight = fontSize;

      const padding = 10;
      canvas.width = textWidth + padding * 2;
      canvas.height = textHeight + padding * 2;

      ctx.font = `${fontSize}px ${selectedFont}`;
      ctx.fillStyle = textColor;
      ctx.textBaseline = 'top';
      ctx.fillText(textInput, padding, padding);
    }
  };

  const handleSubmit = () => {
    if (textInput.trim()) {
      const isHebrew = /[\u0590-\u05FF]/.test(textInput);
      const selectedFont = getSelectedFontFamily();

      const tempSpan = document.createElement('div');
      tempSpan.style.position = 'absolute';
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.whiteSpace = 'pre-wrap';
      tempSpan.style.fontFamily = selectedFont;
      tempSpan.style.fontSize = `${fontSize}px`;
      tempSpan.style.lineHeight = '1.2';
      tempSpan.style.direction = isHebrew ? 'rtl' : 'ltr';
      tempSpan.style.unicodeBidi = 'plaintext';
      tempSpan.style.width = 'auto';
      tempSpan.style.height = 'auto';
      tempSpan.innerText = textInput;

      document.body.appendChild(tempSpan);
      const rect = tempSpan.getBoundingClientRect();
      document.body.removeChild(tempSpan);

      const padding = 10;
      const finalWidth = Math.ceil(rect.width) + (padding * 2) + 6;
      const finalHeight = Math.ceil(rect.height) + (padding * 2);

      const newElement = {
        id: Date.now(),
        type: 'text',
        text: textInput,
        fontSize: fontSize,
        color: textColor,
        fontFamily: fontFamily,
        fontFamilyCss: selectedFont,
        x: clickPosition.x - finalWidth / 2,
        y: clickPosition.y - finalHeight / 2,
        width: finalWidth,
        height: finalHeight,
        baseWidth: finalWidth,
        baseHeight: finalHeight,
        baseFontSize: fontSize
      };

      onSubmit(newElement);
      onClose();
      setTextInput('');
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">הוספת טקסט למסמך</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">תוכן הטקסט</label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              dir="auto"
              style={{ fontFamily: getSelectedFontFamily() }}
              className="w-full border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-3.5 py-2.5 h-24 resize-none text-slate-800 leading-relaxed text-base transition-all"
              placeholder="הקלד כאן את הטקסט..."
              autoFocus
            />
          </div>

          {/* Font Family Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">סגנון גופן (Font Family)</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full border border-slate-300 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium bg-white text-sm"
            >
              {FONT_OPTIONS.map(font => (
                <option key={font.id} value={font.id}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">גודל גופן (px)</label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full border border-slate-300 focus:border-blue-500 rounded-xl px-3.5 py-2 text-slate-800 font-medium"
                min="8"
                max="72"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">צבע טקסט</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl h-10 cursor-pointer p-1"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {textInput && (
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/80">
              <p className="text-xs font-bold text-slate-600 mb-2">תצוגה מקדימה:</p>
              <div className="overflow-x-auto flex justify-center bg-white p-2 rounded-lg border border-slate-200">
                <canvas ref={canvasRef} />
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-sm transition-all"
            >
              ביטול
            </button>
            <button
              onClick={handleSubmit}
              disabled={!textInput.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Check size={18} strokeWidth={2.5} />
              הוסף טקסט
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextModal;