import React from 'react';

const Logo = ({ size = 'md', showText = true, className = '' }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Icon Badge */}
      <div className={`relative ${iconSizes[size]} flex items-center justify-center shrink-0`}>
        {/* Glowing backdrop */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 rounded-2xl blur-md opacity-45 animate-pulse" />

        {/* SVG Emblem Container */}
        <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-1.5 rounded-2xl border border-white/20 shadow-xl flex items-center justify-center overflow-hidden">
          <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-md"
          >
            <defs>
              <linearGradient id="docGrad1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3B82F6" />
                <stop offset="1" stopColor="#1D4ED8" />
              </linearGradient>
              <linearGradient id="docGrad2" x1="10" y1="0" x2="40" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#06B6D4" />
                <stop offset="1" stopColor="#4F46E5" />
              </linearGradient>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F59E0B" />
                <stop offset="1" stopColor="#EF4444" />
              </linearGradient>
            </defs>

            {/* Back Page */}
            <rect x="6" y="10" width="20" height="26" rx="3" fill="url(#docGrad1)" opacity="0.85" transform="rotate(-6 16 23)" />
            
            {/* Front Page */}
            <rect x="14" y="5" width="20" height="26" rx="3" fill="url(#docGrad2)" />

            {/* Document lines */}
            <line x1="18" y1="11" x2="28" y2="11" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
            <line x1="18" y1="16" x2="26" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <line x1="18" y1="21" x2="24" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />

            {/* Fusion Spark */}
            <circle cx="28" cy="24" r="5" fill="url(#sparkGrad)" />
            <path d="M28 21.5V26.5M25.5 24H30.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className={`font-black tracking-tight ${textSizes[size]} text-slate-900 flex items-center gap-1.5`}>
            <span className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 bg-clip-text text-transparent">
              PDF Fusion
            </span>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              Master
            </span>
          </div>
          {size !== 'sm' && (
            <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600/90 -mt-0.5 font-sans">
              עריכה, מיזוג וחתימה מתקדמים
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
