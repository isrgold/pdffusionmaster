import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Download, Save, Eraser, Sparkles, FileSignature, Plus } from 'lucide-react';
import SignatureCanvas from './SignatureCanvas';
import SignatureToolbar from './SignatureToolbar';
import SavedSignatures from './SavedSignatures';
import { createSignaturePNG, loadSavedSignatures } from './signatureUtils';

// Modal Header Component
const ModalHeader = ({ onClose, activeSection }) => (
    <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 sm:p-4 md:p-6">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-white bg-opacity-20 rounded-lg">
                    <Sparkles size={16} className="sm:w-5 sm:h-5" />
                </div>
                <div>
                    <h3 className="text-sm sm:text-lg md:text-xl font-bold">Signature Manager</h3>
                    <p className="text-blue-100 text-xs sm:text-sm hidden sm:block">
                        {activeSection === 'saved' ? 'Use saved signatures' : 'Design your perfect signature'}
                    </p>
                </div>
            </div>
            <button
                onClick={onClose}
                className="p-1.5 sm:p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
                aria-label="Close modal"
            >
                <X size={16} className="sm:w-5 sm:h-5" />
            </button>
        </div>
    </div>
);

// Section Tabs Component
const SectionTabs = ({ activeSection, setActiveSection, savedSignatures }) => (
    <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200">
        <div className="flex">
            <button
                onClick={() => setActiveSection('saved')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-colors duration-200 ${activeSection === 'saved'
                        ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
            >
                <FileSignature size={14} className="sm:w-4 sm:h-4" />
                Saved Signatures
                {savedSignatures.length > 0 && (
                    <span className="bg-blue-100 text-blue-600 text-xs px-1.5 sm:px-2 py-0.5 rounded-full">
                        {savedSignatures.length}
                    </span>
                )}
            </button>
            <button
                onClick={() => setActiveSection('create')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-colors duration-200 ${activeSection === 'create'
                        ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
            >
                <Plus size={14} className="sm:w-4 sm:h-4" />
                Create New
            </button>
        </div>
    </div>
);

// Modal Footer Component
const ModalFooter = ({
    activeSection,
    setActiveSection,
    onClose,
    handleSubmit,
    handleSavePNG,
    handleSaveToStorage,
    clearAll,
    hasContent,
}) => (
    <div className="flex-shrink-0 bg-gray-50 p-3 sm:p-4 md:p-6 border-t border-gray-200">
        {activeSection === 'saved' ? (
            <div className="flex justify-between items-center">
                <button
                    onClick={onClose}
                    className="px-4 sm:px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-sm sm:text-base"
                >
                    Cancel
                </button>
                <button
                    onClick={() => setActiveSection('create')}
                    className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base"
                >
                    <Plus size={14} className="sm:w-4 sm:h-4" />
                    Create New Signature
                </button>
            </div>
        ) : (
            <>
                {/* Mobile: Stack buttons vertically */}
                <div className="flex flex-col space-y-3 sm:hidden">
                    <button
                        onClick={handleSubmit}
                        disabled={!hasContent}
                        className="flex items-center gap-2 justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                        <Check size={16} />
                        Add Signature
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleSavePNG}
                            disabled={!hasContent}
                            className="flex items-center gap-2 justify-center px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                        >
                            <Download size={14} />
                            Download
                        </button>
                        <button
                            onClick={handleSaveToStorage}
                            disabled={!hasContent}
                            className="flex items-center gap-2 justify-center px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                        >
                            <Save size={14} />
                            Save
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={clearAll}
                            disabled={!hasContent}
                            className="flex items-center gap-2 justify-center px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs border border-gray-300"
                        >
                            <Eraser size={14} />
                            Clear
                        </button>
                        <button
                            onClick={onClose}
                            className="px-3 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-xs border border-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Desktop: Horizontal layout */}
                <div className="hidden sm:flex justify-between items-center">
                    <button
                        onClick={clearAll}
                        disabled={!hasContent}
                        className="flex items-center gap-2 justify-center px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        <Eraser size={14} />
                        Clear All
                    </button>
                    <div className="flex gap-2 sm:gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 sm:px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSavePNG}
                            disabled={!hasContent}
                            className="flex items-center gap-2 justify-center px-4 sm:px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm transform hover:scale-105"
                        >
                            <Download size={14} />
                            Download PNG
                        </button>
                        <button
                            onClick={handleSaveToStorage}
                            disabled={!hasContent}
                            className="flex items-center gap-2 justify-center px-4 sm:px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm transform hover:scale-105"
                        >
                            <Save size={14} />
                            Save to Browser
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!hasContent}
                            className="flex items-center gap-2 justify-center px-6 sm:px-8 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm transform hover:scale-105"
                        >
                            <Check size={14} />
                            Add Signature
                        </button>
                    </div>
                </div>
            </>
        )}
    </div>
);

const SignatureModal = ({ show, onClose, onSubmit, clickPosition }) => {
    const [signaturePaths, setSignaturePaths] = useState([]);
    const [textElements, setTextElements] = useState([]);
    const [signatureColor, setSignatureColor] = useState('#000000');
    const [fontSize, setFontSize] = useState(18);
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [mode, setMode] = useState('draw');
    const [savedSignatures, setSavedSignatures] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [activeSection, setActiveSection] = useState('saved');
    const canvasRef = useRef(null);

    useEffect(() => {
        if (show) {
            setSavedSignatures(loadSavedSignatures());
            setActiveSection(loadSavedSignatures().length > 0 ? 'saved' : 'create');
            document.body.style.overflow = 'hidden';
            // Prevent zoom on iOS
            document.addEventListener('touchmove', preventZoom, { passive: false });
            document.addEventListener('gesturestart', preventZoom);
            document.addEventListener('gesturechange', preventZoom);
            document.addEventListener('gestureend', preventZoom);
        } else {
            document.body.style.overflow = 'unset';
            document.removeEventListener('touchmove', preventZoom);
            document.removeEventListener('gesturestart', preventZoom);
            document.removeEventListener('gesturechange', preventZoom);
            document.removeEventListener('gestureend', preventZoom);
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('touchmove', preventZoom);
            document.removeEventListener('gesturestart', preventZoom);
            document.removeEventListener('gesturechange', preventZoom);
            document.removeEventListener('gestureend', preventZoom);
        };
    }, [show]);

    const preventZoom = (e) => {
        if (e.touches && e.touches.length > 1) {
            e.preventDefault();
        }
    };

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
            dataUrl: sig.dataUrl,
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
                dataUrl: signatureData.dataUrl,
            });
        }
        onClose();
        clearAll();
    };

    if (!show) return null;

    const hasContent = signaturePaths.length > 0 || textElements.some((el) => el.text.length > 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
            {/* Mobile: Full screen */}
            <div className="bg-white w-full h-full sm:h-auto sm:rounded-2xl shadow-2xl sm:max-w-4xl sm:mx-auto sm:max-h-[90vh] overflow-hidden border-0 sm:border border-gray-200 flex flex-col">
                <ModalHeader onClose={onClose} activeSection={activeSection} />
                <SectionTabs
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    savedSignatures={savedSignatures}
                />
                <div className="flex-1 overflow-y-auto">
                    {activeSection === 'saved' ? (
                        <div className="p-3 sm:p-4 md:p-6">
                            {savedSignatures.length > 0 ? (
                                <SavedSignatures
                                    savedSignatures={savedSignatures}
                                    onInsert={handleInsertSavedSignature}
                                    onDelete={handleDeleteSavedSignature}
                                />
                            ) : (
                                <div className="text-center py-8 sm:py-12">
                                    <div className="mx-auto w-12 sm:w-16 h-12 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <FileSignature size={20} className="sm:w-6 sm:h-6 text-gray-400" />
                                    </div>
                                    <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No saved signatures</h4>
                                    <p className="text-gray-500 text-sm mb-4 sm:mb-6">Create your first signature to save it for future use</p>
                                    <button
                                        onClick={() => setActiveSection('create')}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
                                    >
                                        <Plus size={14} />
                                        Create Signature
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
                            <SignatureToolbar
                                mode={mode}
                                setMode={setMode}
                                signatureColor={signatureColor}
                                setSignatureColor={setSignatureColor}
                                fontSize={fontSize}
                                setFontSize={setFontSize}
                                strokeWidth={strokeWidth}
                                setStrokeWidth={setStrokeWidth}
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
                                strokeWidth={strokeWidth}
                            />
                        </div>
                    )}
                </div>
                <ModalFooter
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    onClose={onClose}
                    handleSubmit={handleSubmit}
                    handleSavePNG={handleSavePNG}
                    handleSaveToStorage={handleSaveToStorage}
                    clearAll={clearAll}
                    hasContent={hasContent}
                />
                {showSuccess && (
                    <div className="fixed top-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg transform animate-bounce z-50 text-center sm:text-left text-sm">
                        ✅ Signature saved successfully!
                    </div>
                )}
            </div>
        </div>
    );
};

export default SignatureModal;