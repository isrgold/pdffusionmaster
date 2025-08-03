// components/SignatureModal/SignatureModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Download, Save, Eraser, Sparkles, ChevronDown, Menu } from 'lucide-react';
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
    const [showToolbar, setShowToolbar] = useState(false);
    const [showSavedSignatures, setShowSavedSignatures] = useState(false);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (show) {
            setSavedSignatures(loadSavedSignatures());
            // Prevent body scroll and handle viewport
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.top = '0';
            
            // Set viewport meta for mobile
            const viewport = document.querySelector('meta[name=viewport]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            }
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
        }
        
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
        };
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
        <>
            {/* Desktop version */}
            <div className="hidden sm:fixed sm:inset-0 sm:bg-black sm:bg-opacity-60 sm:flex sm:items-center sm:justify-center sm:z-50 sm:backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-4xl mx-auto max-h-[90vh] overflow-y-auto border border-gray-200">
                    {/* Desktop Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Create Signature</h3>
                                <p className="text-blue-100 text-sm">Design your perfect signature</p>
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

                    {/* Desktop Content */}
                    <div className="p-6 space-y-6">
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
                    </div>

                    {/* Desktop Footer */}
                    <div className="bg-gray-50 p-6 rounded-b-2xl border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <button
                                onClick={clearAll}
                                disabled={!hasContent}
                                className="flex items-center gap-2 justify-center px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Eraser size={16} />
                                Clear All
                            </button>

                            <div className="flex gap-3">
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

            {/* Mobile version - Full screen app-like experience */}
            <div className="sm:hidden fixed inset-0 bg-white z-50 flex flex-col">
                {/* Mobile Header - Minimal and sticky */}
                <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <div className="flex items-center justify-between p-4 min-h-[60px]">
                        <div className="flex items-center gap-2">
                            <Sparkles size={20} />
                            <h3 className="text-lg font-semibold">Create Signature</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors duration-200"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    
                    {/* Mobile toolbar toggle */}
                    <div className="px-4 pb-3">
                        <button
                            onClick={() => setShowToolbar(!showToolbar)}
                            className="flex items-center gap-2 text-blue-100 text-sm"
                        >
                            <Menu size={16} />
                            Tools & Settings
                            <ChevronDown size={16} className={`transform transition-transform ${showToolbar ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Collapsible Toolbar */}
                {showToolbar && (
                    <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 p-4">
                        <SignatureToolbar
                            mode={mode}
                            setMode={setMode}
                            signatureColor={signatureColor}
                            setSignatureColor={setSignatureColor}
                            fontSize={fontSize}
                            setFontSize={setFontSize}
                        />
                    </div>
                )}

                {/* Canvas Area - Takes most space */}
                <div className="flex-1 min-h-0 p-4 bg-gray-50">
                    <div className="h-full">
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
                    </div>
                </div>

                {/* Saved signatures toggle */}
                {savedSignatures.length > 0 && (
                    <>
                        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-2">
                            <button
                                onClick={() => setShowSavedSignatures(!showSavedSignatures)}
                                className="flex items-center gap-2 text-gray-600 text-sm w-full justify-center"
                            >
                                Saved Signatures ({savedSignatures.length})
                                <ChevronDown size={16} className={`transform transition-transform ${showSavedSignatures ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                        
                        {showSavedSignatures && (
                            <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4 max-h-32 overflow-y-auto">
                                <SavedSignatures
                                    savedSignatures={savedSignatures}
                                    onInsert={handleInsertSavedSignature}
                                    onDelete={handleDeleteSavedSignature}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Mobile Action Bar - Always visible */}
                <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4 safe-area-inset-bottom">
                    {/* Primary action - most prominent */}
                    <div className="space-y-3">
                        <button
                            onClick={handleSubmit}
                            disabled={!hasContent}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95 transition-all duration-200"
                        >
                            <Check size={20} />
                            Add Signature
                        </button>
                        
                        {/* Secondary actions in grid */}
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={handleSavePNG}
                                disabled={!hasContent}
                                className="flex flex-col items-center justify-center py-3 px-2 bg-emerald-500 text-white rounded-lg disabled:opacity-50 text-xs font-medium active:scale-95 transition-all duration-200"
                            >
                                <Download size={18} />
                                <span className="mt-1">Download</span>
                            </button>
                            <button
                                onClick={handleSaveToStorage}
                                disabled={!hasContent}
                                className="flex flex-col items-center justify-center py-3 px-2 bg-amber-500 text-white rounded-lg disabled:opacity-50 text-xs font-medium active:scale-95 transition-all duration-200"
                            >
                                <Save size={18} />
                                <span className="mt-1">Save</span>
                            </button>
                            <button
                                onClick={clearAll}
                                disabled={!hasContent}
                                className="flex flex-col items-center justify-center py-3 px-2 bg-red-500 text-white rounded-lg disabled:opacity-50 text-xs font-medium active:scale-95 transition-all duration-200"
                            >
                                <Eraser size={18} />
                                <span className="mt-1">Clear</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {showSuccess && (
                <div className="fixed top-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-[60] text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                        <Check size={18} />
                        <span>Signature saved successfully!</span>
                    </div>
                </div>
            )}
        </>
    );
};

export default SignatureModal;