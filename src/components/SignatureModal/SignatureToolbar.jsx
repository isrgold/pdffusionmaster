// components/SignatureModal/SignatureToolbar.jsx
import React, { useRef } from 'react';
import { PenTool, Type, Palette, Upload } from 'lucide-react';

const SignatureToolbar = ({ mode, setMode, signatureColor, setSignatureColor, fontSize, setFontSize, strokeWidth, setStrokeWidth, onUploadImage }) => {
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
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-6">
                {/* Mode Selection */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('draw')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${mode === 'draw'
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md transform scale-105'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                            }`}
                    >
                        <PenTool size={16} />
                        Draw
                    </button>
                    <button
                        onClick={() => setMode('text')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${mode === 'text'
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md transform scale-105'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                            }`}
                    >
                        <Type size={16} />
                        Text
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,.png"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all duration-200 hover:scale-105"
                        title="Upload PNG image signature"
                    >
                        <Upload size={16} />
                        Upload PNG
                    </button>
                </div>

                {/* Color Picker */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                    <Palette size={16} className="text-gray-600" />
                    <label className="text-sm font-medium text-gray-700">Color</label>
                    <div className="relative">
                        <input
                            type="color"
                            value={signatureColor}
                            onChange={(e) => setSignatureColor(e.target.value)}
                            className="w-10 h-8 rounded border-2 border-gray-300 cursor-pointer hover:border-blue-400 transition-colors duration-200"
                        />
                    </div>
                </div>

                {/* Font Size / Stroke Width */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                    <Type size={16} className="text-gray-600" />
                    <label className="text-sm font-medium text-gray-700">{mode === 'text' ? "size" : "stroke width"}</label>
                    <input
                        type="range"
                        min={mode === 'text' ? "12" : "2"}
                        max={mode === 'text' ? "48" : "10"}
                        value={mode === 'text' ? fontSize : strokeWidth}
                        onChange={mode === 'text' ? (e) => setFontSize(Number(e.target.value)) : (e) => setStrokeWidth(Number(e.target.value))}
                        className="w-20 accent-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-600 min-w-[2rem]">{mode === 'text' ? fontSize : strokeWidth / 2}px</span>
                </div>
            </div>
        </div>
    );
};

export default SignatureToolbar;