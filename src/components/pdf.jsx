import React, { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
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

  const mergePDFs = async () => {
    if (files.length < 2) {
      setStatus({ type: 'error', message: 'Please select at least 2 PDF files to merge' });
      return;
    }
    try {
      setStatus({ type: 'loading', message: 'Merging PDFs...' });
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const fileArrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileArrayBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'merged.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatus({ type: 'success', message: 'PDFs merged successfully!' });
      setFiles([]);
    } catch (error) {
      console.error('PDF merge error:', error);
      setStatus({ type: 'error', message: 'Failed to merge PDFs. Please try again.' });
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
          <MergeButton files={files} mergePDFs={mergePDFs} />
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFMerger;
