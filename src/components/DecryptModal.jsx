import React, { useState } from 'react';
import { Lock, Eye, EyeOff, KeyRound, AlertCircle, ShieldCheck, X } from 'lucide-react';

const DecryptModal = ({ show, fileName, onSubmit, onClose, error }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setIsSubmitting(true);
    try {
      await onSubmit(password);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">פענוח קובץ PDF מוצפן</h3>
              <p className="text-xs text-slate-500 font-mono truncate max-w-[240px]">{fileName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            הקובץ נשמר עם הגנת סיסמה. הכנס את הסיסמה כדי לפתוח אותו ולטעון אותו לעריכה.
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <KeyRound size={14} className="text-slate-400" />
              סיסמת המסמך:
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הכנס סיסמה..."
                autoFocus
                className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all pl-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50/80 text-emerald-800 text-[11px] p-2.5 rounded-xl border border-emerald-200/60 mt-1">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
            <span>הפענוח מתבצע 100% במחשב שלך (אבטחה מקומית ללא העלאה לשרת).</span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={!password || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs px-5 py-2 rounded-xl transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? 'מפענח...' : 'שחרר נעילה ופתח'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DecryptModal;
