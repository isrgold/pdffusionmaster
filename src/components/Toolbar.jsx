// components/Toolbar.jsx
import React from 'react';
import { Move, Type, PenTool, Trash2, Download } from 'lucide-react';

const Toolbar = ({
  tool,
  setTool,
  selectedElement,
  deleteSelectedElement,
  clearPageElements,
  downloadPDF,
  hasElements,
  isDownloading
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-fit">
      <h3 className="font-semibold mb-4">Tools</h3>
      
      <div className="space-y-2">
        <button
          onClick={() => setTool('move')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded ${
            tool === 'move' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
        >
          <Move size={16} />
          Move
        </button>
        
        <button
          onClick={() => setTool('text')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded ${
            tool === 'text' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
        >
          <Type size={16} />
          Text
        </button>
        
        <button
          onClick={() => setTool('signature')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded ${
            tool === 'signature' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
        >
          <PenTool size={16} />
          Signature
        </button>
      </div>
      
      <hr className="my-4" />
      
      <div className="space-y-2">
        {selectedElement && (
          <button
            onClick={deleteSelectedElement}
            className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-red-50 text-red-600"
          >
            <Trash2 size={16} />
            Delete Selected
          </button>
        )}
        
        <button
          onClick={clearPageElements}
          className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-red-50 text-red-600"
        >
          <Trash2 size={16} />
          Clear Page
        </button>
        
        <button
          onClick={downloadPDF}
          disabled={!hasElements || isDownloading}
          className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-green-50 text-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          {isDownloading ? 'Creating PDF...' : 'Download PDF'}
        </button>
      </div>
    </div>
  );
};

export default Toolbar;