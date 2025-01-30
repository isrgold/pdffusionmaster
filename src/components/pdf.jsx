import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DragDropArea from './DragDropArea';
import FileList from './FileList';
import MergeButton from './MergeButton';
import StatusAlert from './StatusAlert';

const PDFMerger = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [mergePDFs, setMergePDFs] = useState(null); // state for the dynamically imported function
  const [isMerging, setIsMerging] = useState(false); // Track merge state for loading indicator

  // Dynamically load the mergePDFs function after the component renders
  useEffect(() => {
    const loadMergePDFs = async () => {
      try {
        const { mergePDFs } = await import('@/mergePDFs');
        setMergePDFs(() => mergePDFs); // Set the mergePDFs function once it's loaded
      } catch (error) {
        setStatus({ type: 'error', message: 'Failed to load merge function.' });
      }
    };

    loadMergePDFs();
  }, []); // This effect runs only once after the component mounts

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
    if (!mergePDFs) {
      setStatus({ type: 'error', message: 'Merge function not loaded yet.' });
      return;
    }

    setIsMerging(true);
    try {
      await mergePDFs(files, setStatus, setFiles);
    } catch (error) {
      setStatus({ type: 'error', message: 'An error occurred while merging PDFs.' });
    } finally {
      setIsMerging(false);
    }
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
          <MergeButton
            files={files}
            mergePDFs={handleMergePDFs}
            disabled={isMerging || files.length === 0 || !mergePDFs} // Disable button if merging is in progress or no files
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFMerger;
