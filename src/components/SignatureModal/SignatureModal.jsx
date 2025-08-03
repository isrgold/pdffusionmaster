// components/SignatureModal/SignatureModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Type } from 'lucide-react';
import SignatureCanvas from './SignatureCanvas';
import SignatureToolbar from './SignatureToolbar';
import SavedSignatures from './SavedSignatures';
import { createSignaturePNG, loadSavedSignatures } from './signatureUtils';

const SignatureModal = ({ show, onClose, onSubmit, clickPosition }) => {
    const [signaturePaths, setSignaturePaths] = useState([]);
    const [textElements, setTextElements] = useState([]);
    const [signatureColor, setSignatureColor] = useState('#000000');
    const [fontSize, setFontSize] = useState(16);
    const [mode, setMode] = useState('draw');
    const [savedSignatures, setSavedSignatures] = useState([]);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (show) {
            setSavedSignatures(loadSavedSignatures());
        }
    }, [show]);

    const clearAll = () => {
        setSignaturePaths([]);
        setTextElements([]);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleSavePNG = () => {
        const signatureData = createSignaturePNG(signaturePaths, textElements, signatureColor);
        if (!signatureData) return;
        const link = document.createElement('a');
        link.href = signatureData.dataUrl;
        link.download = 'signature.png';
        link.click();
    };

    const handleSaveToStorage = () => {
        const signatureData = createSignaturePNG(signaturePaths, textElements, signatureColor);
        if (!signatureData) return;
        const key = `signature_${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(signatureData));
        alert('Signature saved to browser storage.');
    };

    const handleInsertSavedSignature = (sig) => {
        const newElement = {
            id: Date.now(),
            type: 'signature',
            x: clickPosition.x - sig.width / 2,
            y: clickPosition.y - sig.height / 2,
            width: sig.width,
            height: sig.height,
            dataUrl: sig.dataUrl
        };
        onSubmit(newElement);
        onClose();
    };

    const handleSubmit = () => {
        const signatureData = createSignaturePNG(signaturePaths, textElements, signatureColor);
        if (signatureData) {
            onSubmit({
                id: Date.now(),
                type: 'signature',
                x: clickPosition.x - signatureData.width / 2,
                y: clickPosition.y - signatureData.height / 2,
                width: signatureData.width,
                height: signatureData.height,
                dataUrl: signatureData.dataUrl
            });
        }
        onClose();
        clearAll();
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Create Signature</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <SignatureToolbar
                    mode={mode}
                    setMode={setMode}
                    signatureColor={signatureColor}
                    setSignatureColor={setSignatureColor}
                    fontSize={fontSize}
                    setFontSize={setFontSize}
                />

                <SignatureCanvas
                    mode={mode}
                    canvasRef={canvasRef}
                    signaturePaths={signaturePaths}
                    setSignaturePaths={setSignaturePaths}
                    textElements={textElements}
                    setTextElements={setTextElements}
                    signatureColor={signatureColor}
                    fontSize={fontSize}
                />

                {savedSignatures.length > 0 && (
                    <SavedSignatures
                        savedSignatures={savedSignatures}
                        onInsert={handleInsertSavedSignature}
                    />
                )}

                <div className="flex gap-2 justify-end mt-4">
                    <button onClick={clearAll} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Clear All</button>
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                    <button onClick={handleSavePNG} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Save PNG</button>
                    <button onClick={handleSaveToStorage} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">Save to Browser</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"><Check size={16} />Add Signature</button>
                </div>
            </div>
        </div>
    );
};

export default SignatureModal;
