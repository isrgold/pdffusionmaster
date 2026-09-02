// components/Toolbar.jsx
import React from 'react';
import { Move, Type, PenTool, Trash2, Download, Eraser, PanelLeft, RotateCw, Zap } from 'lucide-react';

const ToolButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`group relative flex flex-col items-center justify-center p-2.5 rounded-xl transition-all duration-200 ${active
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-500 ring-offset-1'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
      }`}
    title={label}
  >
    <Icon size={20} strokeWidth={active ? 2 : 1.5} className="transition-transform group-hover:scale-110" />
    <span className={`text-[10px] font-bold mt-1 ${active ? 'text-blue-50' : 'text-slate-600'}`}>{label}</span>
    {active && <span className="absolute -bottom-1 w-1 h-1 bg-white rounded-full opacity-50" />}
  </button>
);

const ActionButton = ({ onClick, disabled, icon: Icon, label, color = 'gray' }) => {
  const colorClasses = {
    red: 'text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100',
    gray: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-200',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex flex-col items-center justify-center p-2.5 rounded-xl transition-all duration-200 border border-transparent ${disabled ? 'opacity-30 cursor-not-allowed' : colorClasses[color] || colorClasses.gray
        } hover:shadow-2xs`}
      title={label}
    >
      <Icon size={20} strokeWidth={1.5} className="transition-transform group-hover:scale-110" />
      <span className="text-[10px] font-bold mt-1 text-slate-600 whitespace-nowrap">{label}</span>
    </button>
  );
};

const Toolbar = ({
  tool,
  setTool,
  selectedElement,
  deleteSelectedElement,
  clearPageElements,
  downloadPDF,
  onOpenCompress,
  hasElements,
  isDownloading,
  showSidebar,
  setShowSidebar,
  onRotatePage
}) => {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-[95%] sm:w-auto max-w-full overflow-x-auto custom-scrollbar">
      <div className="flex items-center gap-1 sm:gap-2 px-3 py-2 bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-xl shadow-slate-900/10 rounded-2xl ring-1 ring-slate-900/5 min-w-max">

        {/* View Actions */}
        <div className="flex items-center gap-1 pl-2 sm:pl-3 border-l border-slate-200">
          <ActionButton
            onClick={() => setShowSidebar(!showSidebar)}
            icon={PanelLeft}
            label={showSidebar ? "הסתר עמודים" : "סרגל עמודים"}
            color="gray"
          />
          <ActionButton
            onClick={onRotatePage}
            icon={RotateCw}
            label="סובב עמוד"
          />
        </div>

        {/* Primary Tools */}
        <div className="flex items-center gap-1 px-2 sm:px-3 border-l border-slate-200">
          <ToolButton
            active={tool === 'move'}
            onClick={() => setTool('move')}
            icon={Move}
            label="הזזה"
          />
          <ToolButton
            active={tool === 'text'}
            onClick={() => setTool('text')}
            icon={Type}
            label="טקסט"
          />
          <ToolButton
            active={tool === 'signature'}
            onClick={() => setTool('signature')}
            icon={PenTool}
            label="חתימה"
          />
        </div>

        {/* Edit Actions */}
        <div className="flex items-center gap-1 px-2 sm:px-3 border-l border-slate-200">
          <ActionButton
            onClick={deleteSelectedElement}
            disabled={!selectedElement}
            icon={Trash2}
            label="מחק רכיב"
            color="red"
          />
          <ActionButton
            onClick={clearPageElements}
            icon={Eraser}
            label="נקה עמוד"
            color="red"
          />
        </div>

        {/* Main Actions */}
        <div className="pr-2 sm:pr-3 whitespace-nowrap flex items-center gap-2">
          <button
            onClick={onOpenCompress}
            disabled={!hasElements || isDownloading}
            className={`
              flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all border
              ${(!hasElements || isDownloading)
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 active:scale-[0.98]'
              }
            `}
            title="דחיסה והקטנת נפח ה-PDF"
          >
            <Zap size={16} className="text-amber-600" />
            <span>דחוס PDF</span>
          </button>

          <button
            onClick={downloadPDF}
            disabled={!hasElements || isDownloading}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md
              ${(!hasElements || isDownloading)
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]'
              }
            `}
          >
            <Download size={18} strokeWidth={2.5} />
            {isDownloading ? 'שומר...' : 'ייצוא PDF'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Toolbar;