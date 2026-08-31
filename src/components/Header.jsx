import React from 'react';
import Logo from './Logo';
import { ShieldCheck, Zap, Sparkles } from 'lucide-react';

const Header = ({ pageCount = 0 }) => {
  return (
    <header className="w-full bg-white/85 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-40 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs transition-all">
      {/* Brand Logo */}
      <Logo size="md" />

      {/* Badges & Status */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Privacy Pill */}
        <div className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-emerald-200/70 shadow-2xs">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>100% עיבוד מקומי פרטי בדפדפן</span>
        </div>

        {/* Dynamic Status / Pages Badge */}
        {pageCount > 0 ? (
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-bold border border-blue-200/80 shadow-2xs">
            <Sparkles size={15} className="text-blue-600 animate-spin" style={{ animationDuration: '4s' }} />
            <span>{pageCount} עמודים טעונים</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium border border-slate-200">
            <Zap size={14} className="text-amber-500 shrink-0" />
            <span>מערכת מוכנה לפעולה</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
