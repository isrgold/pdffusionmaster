import React from 'react';
import { Upload } from 'lucide-react';

const DragDropArea = ({ isDragging, handleDragOver, handleDragLeave, handleDrop, handleFileSelect }) => (
  <div
    className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 
      ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
  >
    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
    <p className="mb-2">Drag and drop PDF files here, or</p>
    <label className="inline-block bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600">
      Browse Files
      <input
        type="file"
        multiple
        accept=".pdf"
        className="hidden"
        onChange={handleFileSelect}
      />
    </label>
  </div>
);

export default DragDropArea;
