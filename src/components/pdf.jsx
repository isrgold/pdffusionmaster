import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DragDropArea from './DragDropArea';
import FileList from './FileList';
import MergeButton from './MergeButton';
import StatusAlert from './StatusAlert';

const PDFMerger = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
    setFiles(prevFiles => [...prevFiles, ...droppedFiles]);
  }, []);

  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
  }, []);

  const removeFile = useCallback((indexToRemove) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleMergePDFs = async () => {
    const { mergePDFs } = await import('./mergePDFs'); // Lazy load merge function
    await mergePDFs(files, setStatus, setFiles);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">PDF Merger</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropArea
            isDragging={isDragging}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            handleFileSelect={handleFileSelect}
          />
          {files.length > 0 && <FileList files={files} removeFile={removeFile} />}
          <StatusAlert status={status} />
          <MergeButton files={files} mergePDFs={handleMergePDFs} />
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFMerger;
