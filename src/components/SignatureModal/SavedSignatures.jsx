// components/SignatureModal/SavedSignatures.jsx
import React from 'react';
import { Trash2 } from 'lucide-react';

const SavedSignatures = ({ savedSignatures, onInsert, onDelete, onUpload, onRename, onEdit }) => {
    const fileInputRef = React.useRef(null);
    const [editingId, setEditingId] = React.useState(null);
    const [editName, setEditName] = React.useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onUpload(file);
        }
        e.target.value = null; // Reset input
    };

    const startEditing = (e, sig) => {
        e.stopPropagation();
        setEditingId(sig.key);
        setEditName(sig.name || 'Signature');
    };

    const saveEditing = (e, key) => {
        e.stopPropagation();
        onRename(key, editName);
        setEditingId(null);
    };

    return (
        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Saved Signatures
                </h4>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                    >
                        + Upload PNG
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {savedSignatures.map(sig => (
                    <div
                        key={sig.key}
                        className="group relative bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
                    >
                        <div
                            className="p-3 cursor-pointer flex items-center justify-center min-h-[80px] flex-1 hover:bg-blue-50 transition-colors duration-200"
                            onClick={() => onInsert(sig)}
                        >
                            <img
                                src={sig.dataUrl}
                                alt={sig.name || "Saved Signature"}
                                className="max-h-16 max-w-full object-contain filter group-hover:scale-105 transition-transform duration-200"
                            />
                        </div>

                        {/* Footer with Name/Edit */}
                        <div className="bg-gray-50 p-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                            {editingId === sig.key ? (
                                <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full border rounded px-1 py-0.5"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveEditing(e, sig.key);
                                            if (e.key === 'Escape') setEditingId(null);
                                        }}
                                    />
                                    <button onClick={(e) => saveEditing(e, sig.key)} className="text-green-600">✓</button>
                                </div>
                            ) : (
                                <span className="truncate max-w-[80px]" title={sig.name}>{sig.name || 'Signature'}</span>
                            )}
                        </div>


                        {/* Action Buttons */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (typeof onEdit === 'function') {
                                        onEdit(sig);
                                    } else {
                                        console.error('onEdit is not a function', onEdit);
                                    }
                                }}
                                className="bg-white hover:bg-gray-100 text-blue-600 rounded-full p-1 shadow-sm border border-gray-200"
                                title="Edit Content"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                            </button>
                            <button
                                onClick={(e) => startEditing(e, sig)}
                                className="bg-white hover:bg-gray-100 text-gray-600 rounded-full p-1 shadow-sm border border-gray-200"
                                title="Rename"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            {onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(sig.key);
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm"
                                    title="Delete"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SavedSignatures;
