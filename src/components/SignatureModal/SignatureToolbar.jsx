// components/SignatureModal/SignatureToolbar.jsx
import React from 'react';
import { PenTool, Type, Palette } from 'lucide-react';

const SignatureToolbar = ({ mode, setMode, signatureColor, setSignatureColor, fontSize, setFontSize }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
            {/* Mode Selection */}
            <div className="flex gap-2">
                <button 
                    onClick={() => setMode('draw')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        mode === 'draw' 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md transform scale-105' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                    }`}
                >
                    <PenTool size={16} />
                    Draw
                </button>
                <button 
                    onClick={() => setMode('text')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        mode === 'text' 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md transform scale-105' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                    }`}
                >
                    <Type size={16} />
                    Text
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

            {/* Font Size (Text Mode) */}
            {mode === 'text' && (
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                    <Type size={16} className="text-gray-600" />
                    <label className="text-sm font-medium text-gray-700">Size</label>
                    <input 
                        type="range"
                        min="12"
                        max="48"
                        value={fontSize} 
                        onChange={(e) => setFontSize(Number(e.target.value))} 
                        className="w-20 accent-blue-500" 
                    />
                    <span className="text-sm font-medium text-gray-600 min-w-[2rem]">{fontSize}px</span>
                </div>
            )}
        </div>
    </div>
);

export default SignatureToolbar;