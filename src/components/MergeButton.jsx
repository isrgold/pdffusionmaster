import React from 'react';

const MergeButton = ({ files, mergePDFs }) => (
  <button
    onClick={mergePDFs}
    disabled={files.length < 2}
    className={`w-full py-2 px-4 rounded ${
      files.length < 2
        ? 'bg-gray-300 cursor-not-allowed'
        : 'bg-blue-500 hover:bg-blue-600 text-white'
    }`}
  >
    Merge PDFs
  </button>
);

export default MergeButton;
