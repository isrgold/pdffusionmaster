// components/SignatureModal/SavedSignatures.jsx
import React, { useRef, useState } from 'react';
import { Trash2, Edit3, Check, Upload, FileSignature } from 'lucide-react';

const SavedSignatures = ({ savedSignatures, onInsert, onDelete, onUpload, onRename, onEdit }) => {
  const fileInputRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
      if (!isPng) {
        alert('ניתן להעלות קבצי תמונה בפורמט PNG בלבד.');
        e.target.value = null;
        return;
      }
      onUpload(file);
    }
    e.target.value = null;
  };

  const startEditing = (e, sig) => {
    e.stopPropagation();
    setEditingId(sig.key);
    setEditName(sig.name || 'חתימה שמורה');
  };

  const saveEditing = (e, key) => {
    e.stopPropagation();
    onRename(key, editName);
    setEditingId(null);
  };

  return (
    <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 sm:p-5" dir="rtl">
      
      {/* Gallery Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <FileSignature size={18} className="text-blue-600" />
          <h4 className="text-sm font-bold text-slate-800">
            חתימות שמורות בדפדפן ({savedSignatures.length})
          </h4>
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,.png"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
          >
            <Upload size={14} className="text-emerald-600" />
            + העלאת PNG
          </button>
        </div>
      </div>

      {/* Signatures Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {savedSignatures.map((sig) => (
          <div
            key={sig.key}
            className="group relative bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
          >
            {/* Clickable Image Box */}
            <div
              className="p-4 cursor-pointer flex items-center justify-center min-h-[90px] flex-1 bg-white hover:bg-blue-50/30 transition-colors"
              onClick={() => onInsert(sig)}
              title="לחץ להוספת החתימה למסמך"
            >
              <img
                src={sig.dataUrl}
                alt={sig.name || 'חתימה שמורה'}
                className="max-h-16 max-w-full object-contain filter group-hover:scale-105 transition-transform"
              />
            </div>

            {/* Footer with Title / Edit */}
            <div className="bg-slate-50 p-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-600">
              {editingId === sig.key ? (
                <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2 py-0.5 text-xs bg-white focus:outline-none focus:border-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditing(e, sig.key);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => saveEditing(e, sig.key)}
                    className="text-emerald-600 p-1 hover:bg-emerald-50 rounded"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <span className="truncate font-medium text-[11px]" title={sig.name}>
                  {sig.name || 'חתימה שמורה'}
                </span>
              )}
            </div>

            {/* Hover Action Overlay */}
            <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {typeof onEdit === 'function' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(sig);
                  }}
                  className="bg-white/90 hover:bg-white text-blue-600 rounded-lg p-1.5 shadow-xs border border-slate-200 transition-all"
                  title="עריכת חתימה"
                >
                  <Edit3 size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => startEditing(e, sig)}
                className="bg-white/90 hover:bg-white text-slate-600 rounded-lg p-1.5 shadow-xs border border-slate-200 transition-all"
                title="שינוי שם"
              >
                <Edit3 size={13} />
              </button>
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(sig.key);
                  }}
                  className="bg-red-50 hover:bg-red-100 text-red-600 rounded-lg p-1.5 shadow-xs border border-red-200 transition-all"
                  title="מחק חתימה"
                >
                  <Trash2 size={13} />
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
