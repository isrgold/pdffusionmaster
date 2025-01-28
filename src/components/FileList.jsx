import React from 'react';

const FileList = ({ files, removeFile }) => (
  <div className="space-y-2 mb-4">
    {files.map((file, index) => (
      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
        <span className="truncate">{file.name}</span>
        <button
          onClick={() => removeFile(index)}
          className="text-red-500 hover:text-red-700 ml-2"
        >
          Remove
        </button>
      </div>
    ))}
  </div>
);

export default FileList;