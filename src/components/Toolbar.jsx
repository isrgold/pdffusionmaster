// components/Toolbar.jsx
import React from 'react';
import { Move, Type, PenTool, Trash2, Download, Eraser, PanelLeft, RotateCw } from 'lucide-react';

const ToolButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`group relative flex flex-col items-center justify-center p-2.5 rounded-xl transition-all duration-200 ${active
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-500 ring-offset-1'
      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
      }`}
    title={label}
  >
    <Icon size={20} strokeWidth={active ? 2 : 1.5} className="transition-transform group-hover:scale-110" />
    <span className={`text-[10px] font-medium mt-1 ${active ? 'text-blue-50' : 'text-gray-500'}`}>{label}</span>
    {active && <span className="absolute -bottom-1 w-1 h-1 bg-white rounded-full opacity-50" />}
  </button>
);

const ActionButton = ({ onClick, disabled, icon: Icon, label, color = 'gray' }) => {
  const colorClasses = {
    red: 'text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100',
    gray: 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-200',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex flex-col items-center justify-center p-2.5 rounded-xl transition-all duration-200 border border-transparent ${disabled ? 'opacity-30 cursor-not-allowed' : colorClasses[color] || colorClasses.gray
        } hover:shadow-sm`}
      title={label}
    >
      <Icon size={20} strokeWidth={1.5} className="transition-transform group-hover:scale-110" />
      <span className="text-[10px] font-medium mt-1 text-gray-500 whitespace-nowrap">{label}</span>
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
  hasElements,
  isDownloading,
  showSidebar,
  setShowSidebar,
  onRotatePage
}) => {
  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] sm:w-auto max-w-full overflow-x-auto custom-scrollbar">
      <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-gray-900/5 rounded-2xl ring-1 ring-black/5 min-w-max">

        {/* View Actions */}
        <div className="flex items-center gap-1 pr-2 sm:pr-3 border-r border-gray-200/50">
          <ActionButton
            onClick={() => setShowSidebar(!showSidebar)}
            icon={PanelLeft}
            label={showSidebar ? "Hide Pages" : "Show Pages"}
            color="gray"
          />
          <ActionButton
            onClick={onRotatePage}
            icon={RotateCw}
            label="Rotate"
          />
        </div>

        {/* Primary Tools */}
        <div className="flex items-center gap-2 px-2 sm:px-3 border-r border-gray-200/50">
          <ToolButton
            active={tool === 'move'}
            onClick={() => setTool('move')}
            icon={Move}
            label="Move"
          />
          <ToolButton
            active={tool === 'text'}
            onClick={() => setTool('text')}
            icon={Type}
            label="Text"
          />
          <ToolButton
            active={tool === 'signature'}
            onClick={() => setTool('signature')}
            icon={PenTool}
            label="Sign"
          />
        </div>

        {/* Edit Actions */}
        <div className="flex items-center gap-1 px-2 sm:px-3 border-r border-gray-200/50">
          <ActionButton
            onClick={deleteSelectedElement}
            disabled={!selectedElement}
            icon={Trash2}
            label="Delete"
            color="red"
          />
          <ActionButton
            onClick={clearPageElements}
            icon={Eraser}
            label="Clear"
            color="red"
          />
        </div>

        {/* Main Actions */}
        <div className="pl-2 sm:pl-3 whitespace-nowrap">
          <button
            onClick={downloadPDF}
            disabled={!hasElements || isDownloading}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md
              ${(!hasElements || isDownloading)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-gray-900 text-white hover:bg-black hover:shadow-lg hover:shadow-gray-900/20 active:scale-[0.98]'
              }
            `}
          >
            <Download size={18} strokeWidth={2} />
            {isDownloading ? 'Saving...' : 'Export'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Toolbar;