// components/Toolbar.jsx
import React from 'react';
import { Move, Type, PenTool, Trash2, Download, Eraser, PanelLeft } from 'lucide-react';

const ToolButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${active
      ? 'bg-blue-100 text-blue-600 shadow-sm'
      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 ring-1 ring-transparent hover:ring-gray-200'
      }`}
    title={label}
  >
    <Icon size={20} />
    <span className="text-[10px] font-medium mt-1">{label}</span>
  </button>
);

const ActionButton = ({ onClick, disabled, icon: Icon, label, color = 'gray' }) => {
  const colorClasses = {
    red: 'text-red-500 hover:bg-red-50 hover:text-red-600',
    gray: 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-lg transition-colors ${disabled ? 'opacity-30 cursor-not-allowed' : colorClasses[color] || colorClasses.gray
        }`}
      title={label}
    >
      <Icon size={20} />
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
  setShowSidebar
}) => {
  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl ring-1 ring-black/5">

        {/* View Actions */}
        <div className="flex items-center gap-1 pr-4 border-r border-gray-200/60">
          <ToolButton
            active={showSidebar}
            onClick={() => setShowSidebar(!showSidebar)}
            icon={PanelLeft}
            label="Pages"
          />
        </div>

        {/* Primary Tools */}
        <div className="flex items-center gap-1 pr-4 border-r border-gray-200/60">
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
        <div className="flex items-center gap-1 px-4 border-r border-gray-200/60">
          <ActionButton
            onClick={deleteSelectedElement}
            disabled={!selectedElement}
            icon={Trash2}
            label="Delete Selected"
            color="red"
          />
          <ActionButton
            onClick={clearPageElements}
            icon={Eraser}
            label="Clear Page"
            color="red"
          />
        </div>

        {/* Main Actions */}
        <div className="pl-2">
          <button
            onClick={downloadPDF}
            disabled={!hasElements || isDownloading}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all shadow-sm
              ${(!hasElements || isDownloading)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
              }
            `}
          >
            <Download size={18} />
            {isDownloading ? 'Saving...' : 'Export PDF'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Toolbar;