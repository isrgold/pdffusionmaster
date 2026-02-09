
// PDFEditor.jsx - Main component
import React, { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Toolbar from './components/Toolbar';
import PDFViewer from './components/PDFViewer';
import PageManager from './components/PageManager';
import TextModal from './components/TextModal';
import SignatureModal from './components/SignatureModal/SignatureModal';
import { PDFDocument } from 'pdf-lib';
import { loadPDFLibraries, renderPageThumbnail, pdfjsLib } from './utils/pdfUtils';
import { downloadPDF } from './utils/downloadUtils';

const PDFEditor = () => {
  // Documents state: { [docId]: { data: Uint8Array, fileName: string } }
  const [documents, setDocuments] = useState({});
  // Pages state: Array of { id: string, pdfPage: Proxy, originalDocId: string, pageIndex: number, rotation: 0 }
  const [pages, setPages] = useState([]);
  const [currentPageId, setCurrentPageId] = useState(null);

  // Interaction states
  const [tool, setTool] = useState('move');
  const [elements, setElements] = useState([]); // elements now use pageId instead of page index
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
  // We no longer need a single pdfDocRef as we manage multiple docs

  // Load PDF.js and PDF-lib
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

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    for (const file of files) {
      if (file.type !== 'application/pdf') continue;

      const arrayBuffer = await file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);
      const docId = generateId();

      try {
        const loadingTask = pdfjsLib.getDocument({
          data: pdfBytes.slice(0)
        });

        loadingTask.onPassword = (updatePassword, reason) => {
          const password = prompt(reason === 1 ? 'Enter password:' : 'Wrong password, try again:');
          if (password) updatePassword(password);
        };

        const pdf = await loadingTask.promise;
        const newPages = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const thumbnail = await renderPageThumbnail(page);
          newPages.push({
            id: generateId(),
            pdfPage: page,
            originalDocId: docId,
            pageIndex: i - 1,
            rotation: 0,
            fileName: file.name,
            thumbnail
          });
        }

        setDocuments(prev => ({
          ...prev,
          [docId]: { data: pdfBytes, fileName: file.name }
        }));

        setPages(prev => {
          const updated = [...prev, ...newPages];
          if (!currentPageId && updated.length > 0) {
            setCurrentPageId(updated[0].id);
          }
          return updated;
        });

      } catch (error) {
        console.error('Error loading PDF:', error);
        alert(`Error loading ${file.name}`);
      }
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
  };

  const addElement = (element) => {
    if (!currentPageId) return;
    setElements(prev => [...prev, { ...element, pageId: currentPageId }]);
  };

  const deleteSelectedElement = () => {
    if (selectedElement) {
      setElements(prev => prev.filter(el => el.id !== selectedElement.id));
      setSelectedElement(null);
    }
  };

  const clearPageElements = () => {
    if (!currentPageId) return;
    setElements(prev => prev.filter(el => el.pageId !== currentPageId));
  };

  const handleDownloadPDF = async () => {
    await downloadPDF({
      documents,
      pages,
      elements,
      setIsDownloading
    });
  };

  // Page Management Handlers
  const handlePageSelect = (index) => {
    if (pages[index]) setCurrentPageId(pages[index].id);
  };

  const getCurrentPageIndex = () => {
    return pages.findIndex(p => p.id === currentPageId);
  };

  const currentPageObj = pages.find(p => p.id === currentPageId);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar - Page Manager */}
      <div className="w-80 h-full border-r bg-white shadow-lg z-10">
        <PageManager
          pages={pages}
          setPages={setPages}
          selectedPageIndex={getCurrentPageIndex()}
          onSelectPage={handlePageSelect}
          onAddFiles={() => fileInputRef.current?.click()}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 bg-white shadow-sm z-[5]">
          <h1 className="text-xl font-bold text-gray-800 text-center">PDF Editor</h1>
        </div>

        <div className="flex-1 overflow-auto p-8 flex justify-center">
          {!pages.length ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow h-fit my-auto">
              <Upload className="text-gray-400 mb-4" size={64} />
              <h2 className="text-xl font-semibold mb-4">Upload PDFs to get started</h2>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Choose PDF Files
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
              <Toolbar
                tool={tool}
                setTool={setTool}
                selectedElement={selectedElement}
                deleteSelectedElement={deleteSelectedElement}
                clearPageElements={clearPageElements}
                downloadPDF={handleDownloadPDF}
                hasElements={elements.length > 0 || pages.length > 0}
                isDownloading={isDownloading}
              />

              <div className="w-full bg-white shadow-lg rounded-lg p-1 min-h-[600px] flex justify-center items-start">
                {currentPageObj && (
                  <PDFViewer
                    page={currentPageObj}
                    elements={elements.filter(e => e.pageId === currentPageId)}
                    selectedElement={selectedElement}
                    tool={tool}
                    onToolClick={handleToolClick}
                    onElementSelect={handleElementSelect}
                    onElementMove={handleElementMove}
                    onElementRelease={handleElementRelease}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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
  );
};

export default PDFEditor;