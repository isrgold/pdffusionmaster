// components/SignatureModal/SignatureModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Download, Save, Eraser, Sparkles } from 'lucide-react';
import SignatureCanvas from './SignatureCanvas';
import SignatureToolbar from './SignatureToolbar';
import SavedSignatures from './SavedSignatures';
import { createSignaturePNG, loadSavedSignatures } from './signatureUtils';

const SignatureModal = ({ show, onClose, onSubmit, clickPosition }) => {
    const [signaturePaths, setSignaturePaths] = useState([]);
    const [textElements, setTextElements] = useState([]);
    const [signatureColor, setSignatureColor] = useState('#000000');
    const [fontSize, setFontSize] = useState(18);
    const [mode, setMode] = useState('draw');
    const [savedSignatures, setSavedSignatures] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);
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

    const showSuccessMessage = () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    const handleSavePNG = () => {
        const signatureData = createSignaturePNG(signaturePaths, textElements, signatureColor);
        if (!signatureData) return;
        const link = document.createElement('a');
        link.href = signatureData.dataUrl;
        link.download = 'signature.png';
        link.click();
        showSuccessMessage();
    };

    const handleSaveToStorage = () => {
        const signatureData = createSignaturePNG(signaturePaths, textElements, signatureColor);
        if (!signatureData) return;
        const key = `signature_${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(signatureData));
        setSavedSignatures(loadSavedSignatures());
        showSuccessMessage();
    };

    const handleDeleteSavedSignature = (key) => {
        localStorage.removeItem(key);
        setSavedSignatures(loadSavedSignatures());
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

    const hasContent = signaturePaths.length > 0 || textElements.some(el => el.text.length > 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto border border-gray-200 sm:rounded-2xl sm:mx-0">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6 rounded-t-2xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold">Create Signature</h3>
                            <p className="text-blue-100 text-xs sm:text-sm">Design your perfect signature</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 space-y-6">
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
                            onDelete={handleDeleteSavedSignature}
                        />
                    )}

                    {/* Success Message */}
                    {showSuccess && (
                        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform animate-bounce z-50">
                            ✅ Signature saved successfully!
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 p-4 sm:p-6 rounded-b-2xl border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                        <button
                            onClick={clearAll}
                            disabled={!hasContent}
                            className="flex items-center gap-2 justify-center px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Eraser size={16} />
                            Clear All
                        </button>

                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSavePNG}
                                disabled={!hasContent}
                                className="flex items-center gap-2 justify-center px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                            >
                                <Download size={16} />
                                Download PNG
                            </button>
                            <button
                                onClick={handleSaveToStorage}
                                disabled={!hasContent}
                                className="flex items-center gap-2 justify-center px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                            >
                                <Save size={16} />
                                Save to Browser
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!hasContent}
                                className="flex items-center gap-2 justify-center px-8 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
                            >
                                <Check size={16} />
                                Add Signature
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignatureModal;
