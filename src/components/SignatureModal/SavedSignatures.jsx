// components/SignatureModal/SavedSignatures.jsx
import React from 'react';

const SavedSignatures = ({ savedSignatures, onInsert }) => (
    <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Saved Signatures</h4>
        <div className="flex flex-wrap gap-3">
            {savedSignatures.map(sig => (
                <div key={sig.key} className="border rounded p-1 hover:shadow cursor-pointer" onClick={() => onInsert(sig)}>
                    <img src={sig.dataUrl} alt="Saved Signature" className="h-16" />
                </div>
            ))}
        </div>
    </div>
);

export default SavedSignatures;
