// components/SignatureModal/SignatureToolbar.jsx
import React from 'react';
import { Type } from 'lucide-react';

const SignatureToolbar = ({ mode, setMode, signatureColor, setSignatureColor, fontSize, setFontSize }) => (
    <div className="space-y-4">
        <div className="flex gap-2">
            <button onClick={() => setMode('draw')} className={`px-4 py-2 rounded ${mode === 'draw' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
                ✏️ Draw
            </button>
            <button onClick={() => setMode('text')} className={`px-4 py-2 rounded flex items-center gap-2 ${mode === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
                <Type size={16} />
                Text
            </button>
        </div>
        <div className="flex gap-4 items-end">
            <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <input type="color" value={signatureColor} onChange={(e) => setSignatureColor(e.target.value)} className="border rounded h-8 w-20" />
            </div>
            {mode === 'text' && (
                <div>
                    <label className="block text-sm font-medium mb-1">Font Size</label>
                    <input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="border rounded px-3 py-1 w-20" />
                </div>
            )}
        </div>
    </div>
);

export default SignatureToolbar;
