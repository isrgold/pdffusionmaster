// components/TextModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Check, FileText, Type, Palette } from 'lucide-react';

export const FONT_OPTIONS = [
  { id: 'Heebo', label: 'היבו (Heebo) - נקי ומודרני', fontFamily: 'Heebo, sans-serif' },
  { id: 'Rubik', label: 'רוביק (Rubik) - עגלגל', fontFamily: 'Rubik, sans-serif' },
  { id: 'Assistant', label: 'אסיסטנט (Assistant) - היי-טק', fontFamily: 'Assistant, sans-serif' },
  { id: 'Frank Ruhl Libre', label: 'פרנק רוהל (Frank Ruhl) - קלאסי', fontFamily: "'Frank Ruhl Libre', serif" },
  { id: 'David Libre', label: 'דוד (David Libre) - רשמי', fontFamily: "'David Libre', serif" },
  { id: 'Alef', label: 'אלף (Alef) - אלגנטי', fontFamily: 'Alef, serif' },
  { id: 'Courier Prime', label: 'קורייר (Courier) - מכונת כתיבה', fontFamily: "'Courier Prime', monospace" }
];

const PRESET_COLORS = [
  '#000000', // Black
  '#1E3A8A', // Navy Blue
  '#2563EB', // Royal Blue
  '#DC2626', // Red
  '#16A34A', // Green
  '#4B5563', // Gray
];

const PRESET_SIZES = [14, 18, 24, 32, 48];

const TextModal = ({ show, onClose, onSubmit, clickPosition }) => {
  const [textInput, setTextInput] = useState('');
  const [fontSize, setFontSize] = useState(18);
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
    <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans" dir="rtl">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">הוספת טקסט למסמך</h3>
              <p className="text-xs text-slate-500">הקלד את הטקסט והתאם גופן, גודל וצבע</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Text Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">תוכן הטקסט</label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              dir="auto"
              style={{ fontFamily: getSelectedFontFamily() }}
              className="w-full border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-3.5 py-2.5 h-24 resize-none text-slate-800 leading-relaxed text-base transition-all bg-slate-50/50 focus:bg-white"
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
              className="w-full border border-slate-300 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium bg-white text-sm outline-none transition-all"
            >
              {FONT_OPTIONS.map(font => (
                <option key={font.id} value={font.id}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size & Presets */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Type size={14} className="text-slate-400" />
                גודל גופן ({fontSize}px)
              </label>
              <div className="flex gap-1">
                {PRESET_SIZES.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setFontSize(size)}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border transition-all ${
                      fontSize === size
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="range"
              min="10"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Color Selection & Swatches */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Palette size={14} className="text-slate-400" />
              צבע טקסט
            </label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 flex-1">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setTextColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-lg border transition-transform ${
                      textColor.toLowerCase() === c.toLowerCase()
                        ? 'ring-2 ring-blue-500 ring-offset-2 scale-110'
                        : 'border-slate-300 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-9 h-8 border border-slate-300 rounded-lg cursor-pointer p-0.5 bg-white shrink-0"
              />
            </div>
          </div>

          {/* Live Text Preview Box */}
          {textInput ? (
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/80">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-600">תצוגה מקדימה:</span>
                <span className="text-[11px] text-slate-400 font-mono">{fontSize}px | {fontFamily}</span>
              </div>
              <div className="overflow-x-auto flex justify-center items-center min-h-[60px] bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div
                  dir="auto"
                  style={{
                    fontFamily: getSelectedFontFamily(),
                    fontSize: `${fontSize}px`,
                    color: textColor,
                    lineHeight: '1.2',
                    wordBreak: 'break-word',
                    textAlign: 'center'
                  }}
                  className="transition-all"
                >
                  {textInput}
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400 bg-slate-50/40">
              תצוגה מקדימה תופיע כאן ברגע שתקליד טקסט
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-xs transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={handleSubmit}
              disabled={!textInput.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-medium text-xs shadow-xs disabled:opacity-40 flex items-center gap-2 transition-all"
            >
              <Check size={16} strokeWidth={2.5} />
              הוסף למסמך
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextModal;