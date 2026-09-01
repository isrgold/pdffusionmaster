import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Download, Save, Eraser, Sparkles, FileSignature, Plus, Upload } from 'lucide-react';
import SignatureCanvas from './SignatureCanvas';
import SignatureToolbar from './SignatureToolbar';
import SavedSignatures from './SavedSignatures';
import { createSignaturePNG, loadSavedSignatures, compressImageForStorage, safeSaveToStorage } from './signatureUtils';

// Modal Header Component
const ModalHeader = ({ onClose, activeSection }) => (
    <div className="flex-shrink-0 bg-white border-b border-slate-200 p-4 sm:p-5" dir="rtl">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                    <FileSignature size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">ניהול חתימות</h3>
                    <p className="text-slate-500 text-xs hidden sm:block">
                        {activeSection === 'saved' ? 'בחר מתוך חתימות שמורות' : 'עצב חתימה בכתב יד, טקסט מודפס או תמונת PNG'}
                    </p>
                </div>
            </div>
            <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="סגור חלון"
            >
                <X size={18} />
            </button>
        </div>
    </div>
);

// Section Tabs Component
const SectionTabs = ({ activeSection, setActiveSection, savedSignatures }) => (
    <div className="flex-shrink-0 bg-slate-50 border-b border-slate-200" dir="rtl">
        <div className="flex">
            <button
                onClick={() => setActiveSection('saved')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold transition-all ${activeSection === 'saved'
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                    }`}
            >
                <FileSignature size={15} />
                חתימות שמורות
                {savedSignatures.length > 0 && (
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold">
                        {savedSignatures.length}
                    </span>
                )}
            </button>
            <button
                onClick={() => setActiveSection('create')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold transition-all ${activeSection === 'create'
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                    }`}
            >
                <Plus size={15} />
                יצירת חתימה חדשה
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
    <div className="flex-shrink-0 bg-slate-50 p-4 border-t border-slate-200" dir="rtl">
        {activeSection === 'saved' ? (
            <div className="flex justify-between items-center">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors text-xs font-medium"
                >
                    ביטול
                </button>
                <button
                    onClick={() => setActiveSection('create')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-xs font-semibold shadow-xs"
                >
                    <Plus size={15} />
                    צור חתימה חדשה
                </button>
            </div>
        ) : (
            <div className="flex flex-wrap justify-between items-center gap-3">
                <button
                    onClick={clearAll}
                    disabled={!hasContent}
                    className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Eraser size={15} />
                    נקה הכל
                </button>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors text-xs font-medium"
                    >
                        ביטול
                    </button>
                    <button
                        onClick={handleSavePNG}
                        disabled={!hasContent}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold"
                    >
                        <Download size={14} />
                        הורד PNG
                    </button>
                    <button
                        onClick={handleSaveToStorage}
                        disabled={!hasContent}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-200/70 hover:bg-slate-200 text-slate-800 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold"
                    >
                        <Save size={14} />
                        שמור בדפדפן
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!hasContent}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold shadow-xs"
                    >
                        <Check size={16} strokeWidth={2.5} />
                        הוסף חתימה למסמך
                    </button>
                </div>
            </div>
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
    const emptyFileInputRef = useRef(null);

    const [backgroundImage, setBackgroundImage] = useState(null);

    const refreshSavedSignatures = async () => {
        try {
            const sigs = await loadSavedSignatures();
            setSavedSignatures(sigs);
        } catch (err) {
            console.error('Failed to load saved signatures:', err);
        }
    };

    useEffect(() => {
        if (show) {
            refreshSavedSignatures();
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

    const isPngFile = (file) => {
        if (!file) return false;
        return file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
    };

    const handleUploadSignatureFile = (file) => {
        if (!file) return;
        if (!isPngFile(file)) {
            alert('ניתן להעלות קבצי תמונה בפורמט PNG בלבד.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = async () => {
                const compressed = compressImageForStorage(img, 400);
                const key = `signature_${Date.now()}`;
                const sigData = {
                    dataUrl: compressed.dataUrl,
                    width: compressed.width,
                    height: compressed.height,
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    bg: compressed.dataUrl
                };
                const saved = await safeSaveToStorage(key, sigData);
                if (saved) {
                    await refreshSavedSignatures();
                    showSuccessMessage();
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleImageUploadInCreate = (file) => {
        if (!file) return;
        if (!isPngFile(file)) {
            alert('ניתן להעלות קבצי תמונה בפורמט PNG בלבד.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = async () => {
                setBackgroundImage(img);
                const compressed = compressImageForStorage(img, 400);
                const key = `signature_${Date.now()}`;
                const sigData = {
                    dataUrl: compressed.dataUrl,
                    width: compressed.width,
                    height: compressed.height,
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    bg: compressed.dataUrl
                };
                const saved = await safeSaveToStorage(key, sigData);
                if (saved) {
                    await refreshSavedSignatures();
                    showSuccessMessage();
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    const preventZoom = (e) => {
        if (e.touches && e.touches.length > 1) {
            e.preventDefault();
        }
    };

    const clearAll = () => {
        setSignaturePaths([]);
        setTextElements([]);
        setBackgroundImage(null);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
    };

    const showSuccessMessage = () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    const handleSavePNG = () => {
        const signatureData = createSignaturePNG(signaturePaths, textElements, signatureColor, backgroundImage);
        if (!signatureData) return;
        const link = document.createElement('a');
        link.href = signatureData.dataUrl;
        link.download = 'signature.png';
        link.click();
        showSuccessMessage();
    };

    const handleSaveToStorage = async () => {
        const signatureData = createSignaturePNG(signaturePaths, textElements, signatureColor, backgroundImage);
        if (!signatureData) return;
        const key = `signature_${Date.now()}`;

        // Save full state for re-editing
        const fullState = {
            dataUrl: signatureData.dataUrl, // The preview image
            width: signatureData.width,
            height: signatureData.height,
            paths: signaturePaths,
            text: textElements,
            bg: backgroundImage ? backgroundImage.src : null, // Save BG source
            color: signatureColor,
            name: 'Saved Signature'
        };

        const saved = await safeSaveToStorage(key, fullState);
        if (saved) {
            await refreshSavedSignatures();
            showSuccessMessage();
        }
    };

    const handleDeleteSavedSignature = async (key) => {
        localStorage.removeItem(key);
        await refreshSavedSignatures();
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

    const handleEditSavedSignature = (sig) => {
        setSignaturePaths(sig.paths || []);
        setTextElements(sig.text || []);
        setSignatureColor(sig.color || '#000000');

        if (sig.bg) {
            const img = new Image();
            img.src = sig.bg;
            img.onload = () => setBackgroundImage(img);
        } else if (!sig.paths && !sig.text) {
            // Handling legacy/uploaded images as background for markup
            const img = new Image();
            img.src = sig.dataUrl;
            img.onload = () => setBackgroundImage(img);
        } else {
            setBackgroundImage(null);
        }

        setActiveSection('create');
    };

    const handleSubmit = () => {
        const signatureData = createSignaturePNG(signaturePaths, textElements, signatureColor, backgroundImage);
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

    const hasContent = signaturePaths.length > 0 || textElements.some((el) => el.text.length > 0) || backgroundImage;

    return (
        <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans" dir="rtl">
            {/* Mobile / Responsive Modal Container */}
            <div className="bg-white w-full h-full sm:h-auto sm:rounded-2xl shadow-2xl sm:max-w-4xl sm:mx-auto sm:max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <ModalHeader onClose={onClose} activeSection={activeSection} />
                <SectionTabs
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    savedSignatures={savedSignatures}
                />
                <div className="flex-1 overflow-y-auto">
                    {activeSection === 'saved' ? (
                        <div className="p-4 sm:p-6">
                            {savedSignatures.length > 0 ? (
                                <SavedSignatures
                                    savedSignatures={savedSignatures}
                                    onInsert={handleInsertSavedSignature}
                                    onDelete={handleDeleteSavedSignature}
                                    onUpload={handleUploadSignatureFile}
                                    onRename={async (key, newName) => {
                                        try {
                                            const item = localStorage.getItem(key);
                                            if (item) {
                                                const data = JSON.parse(item);
                                                data.name = newName;
                                                localStorage.setItem(key, JSON.stringify(data));
                                                const sigs = await loadSavedSignatures();
                                                setSavedSignatures(sigs);
                                            }
                                        } catch (e) {
                                            console.error("Error renaming signature", e);
                                        }
                                    }}
                                    onEdit={handleEditSavedSignature}
                                />
                            ) : (
                                <div className="text-center py-10 sm:py-14 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 my-2">
                                    <input
                                        type="file"
                                        ref={emptyFileInputRef}
                                        accept="image/png,.png"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) handleUploadSignatureFile(e.target.files[0]);
                                            e.target.value = null;
                                        }}
                                    />
                                    <div className="mx-auto w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                                        <FileSignature size={24} />
                                    </div>
                                    <h4 className="text-base font-bold text-slate-800 mb-1">אין חתימות שמורות</h4>
                                    <p className="text-slate-500 text-xs mb-5 max-w-xs mx-auto">תוכל להעלות קובץ תמונה בפורמט PNG או לעצב חתימה חדשה בכתב יד / טקסט</p>
                                    <div className="flex flex-wrap justify-center items-center gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => emptyFileInputRef.current?.click()}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-colors text-xs font-semibold"
                                        >
                                            <Upload size={14} />
                                            העלאת תמונת PNG
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveSection('create')}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-xs font-semibold shadow-xs"
                                        >
                                            <Plus size={14} />
                                            צור חתימה חדשה
                                        </button>
                                    </div>
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
                                onUploadImage={handleImageUploadInCreate}
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
                                backgroundImage={backgroundImage}
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