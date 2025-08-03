// components/SignatureModal/SavedSignatures.jsx
import React from 'react';
import { Trash2 } from 'lucide-react';

const SavedSignatures = ({ savedSignatures, onInsert, onDelete }) => (
    <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Saved Signatures
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {savedSignatures.map(sig => (
                <div 
                    key={sig.key} 
                    className="group relative bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                    <div 
                        className="p-3 cursor-pointer flex items-center justify-center min-h-[80px] hover:bg-blue-50 transition-colors duration-200"
                        onClick={() => onInsert(sig)}
                    >
                        <img 
                            src={sig.dataUrl} 
                            alt="Saved Signature" 
                            className="max-h-16 max-w-full object-contain filter group-hover:scale-105 transition-transform duration-200" 
                        />
                    </div>
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(sig.key);
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-all duration-200 transform scale-90 hover:scale-100"
                        >
                            <Trash2 size={12} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    </div>
);

export default SavedSignatures;
