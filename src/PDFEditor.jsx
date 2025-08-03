// PDFEditor.jsx - Main component
import React, { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';
import Toolbar from './components/Toolbar';
import PDFViewer from './components/PDFViewer';
import TextModal from './components/TextModal';
import SignatureModal from './components/SignatureModal/SignatureModal';
import { loadPDFLibraries } from './utils/pdfUtils';
import { downloadPDF } from './utils/downloadUtils';

const PDFEditor = () => {
  // File and PDF states
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [pdfPages, setPdfPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Tool and interaction states
  const [tool, setTool] = useState('move');
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Modal states
  const [showTextModal, setShowTextModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  
  // Refs
  const fileInputRef = useRef(null);
  const pdfDocRef = useRef(null);

  // Load PDF.js and PDF-lib on component mount
  useEffect(() => {
    loadPDFLibraries();
  }, []);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedElement) {
        deleteSelectedElement();
      }
      if (e.key === 'Escape') {
        setShowTextModal(false);
        setShowSignatureModal(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setElements([]);
      setCurrentPage(0);
      
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Store as Uint8Array immediately to prevent detachment
      const pdfBytes = new Uint8Array(arrayBuffer);
      setPdfData(pdfBytes);
      
      // Use a copy for PDF.js to avoid conflicts
      const pdfJsBuffer = pdfBytes.buffer.slice(0);
      const pdf = await window.pdfjsLib.getDocument(pdfJsBuffer).promise;
      pdfDocRef.current = pdf;
      
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        pages.push(page);
      }
      setPdfPages(pages);
    }
  };

  const handleToolClick = (pos) => {
    if (tool === 'text') {
      setClickPosition(pos);
      setShowTextModal(true);
    } else if (tool === 'signature') {
      setClickPosition(pos);
      setShowSignatureModal(true);
    }
  };

  const handleElementSelect = (element, pos) => {
    if (tool === 'move' && element) {
      setSelectedElement(element);
      setIsDragging(true);
      setDragOffset({
        x: pos.x - element.x,
        y: pos.y - element.y
      });
    }
  };

  const handleElementMove = (pos) => {
    if (isDragging && selectedElement && tool === 'move') {
      const newX = pos.x - dragOffset.x;
      const newY = pos.y - dragOffset.y;
      
      setElements(prev => prev.map(el => 
        el.id === selectedElement.id 
          ? { ...el, x: newX, y: newY }
          : el
      ));
    }
  };

  const handleElementRelease = () => {
    setIsDragging(false);
    // setSelectedElement(null);
  };

  const addElement = (element) => {
    setElements(prev => [...prev, { ...element, page: currentPage }]);
  };

  

  const deleteSelectedElement = () => {
    if (selectedElement) {
      setElements(prev => prev.filter(el => el.id !== selectedElement.id));
      setSelectedElement(null);
    }
  };

  const clearPageElements = () => {
    setElements(prev => prev.filter(el => el.page !== currentPage));
  };

  const handleDownloadPDF = async () => {
    await downloadPDF({
      pdfData,
      pdfDocRef: pdfDocRef.current,
      elements,
      fileName: pdfFile.name,
      setIsDownloading
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">PDF Editor</h1>
        
        {!pdfFile ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Upload className="mx-auto mb-4 text-gray-400" size={64} />
            <h2 className="text-xl font-semibold mb-4">Upload a PDF to get started</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Choose PDF File
            </button>
          </div>
        ) : (
          <div className="flex gap-6">
            <Toolbar
              tool={tool}
              setTool={setTool}
              selectedElement={selectedElement}
              deleteSelectedElement={deleteSelectedElement}
              clearPageElements={clearPageElements}
              downloadPDF={handleDownloadPDF}
              hasElements={elements.length > 0}
              isDownloading={isDownloading}
            />

            <div className="flex-1">
              <PDFViewer
                pdfPages={pdfPages}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                elements={elements}
                selectedElement={selectedElement}
                tool={tool}
                onToolClick={handleToolClick}
                onElementSelect={handleElementSelect}
                onElementMove={handleElementMove}
                onElementRelease={handleElementRelease}
              />
            </div>
          </div>
        )}

        <TextModal
          show={showTextModal}
          onClose={() => setShowTextModal(false)}
          onSubmit={addElement}
          clickPosition={clickPosition}
        />

        <SignatureModal
          show={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onSubmit={addElement}
          clickPosition={clickPosition}
        />
      </div>
    </div>
  );
};

export default PDFEditor;