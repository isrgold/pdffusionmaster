
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
import { loadPDFLibraries, renderPageThumbnail, getPdfJs } from './utils/pdfUtils';
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
  const [showSidebar, setShowSidebar] = useState(false);

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
        const pdfjsLib = await getPdfJs();
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
            setShowSidebar(true);
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

  const handleElementResize = (id, newBounds) => {
    setElements(prev => prev.map(el =>
      el.id === id
        ? { ...el, ...newBounds }
        : el
    ));
  };

  const handleElementRelease = () => {
    setIsDragging(false);
  };

  const addElement = (element) => {
    if (!currentPageId) return;
    const newElement = { ...element, pageId: currentPageId };
    setElements(prev => [...prev, newElement]);

    // Auto-switch to move tool and select the new element
    setTool('move');
    setSelectedElement(newElement);
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
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      {/* Sidebar - Page Manager (Floating) */}
      {pages.length > 0 && showSidebar && (
        <div className="absolute left-0 top-0 h-full w-80 bg-white/95 backdrop-blur shadow-2xl z-50 transition-transform duration-300 ease-in-out border-r border-gray-200">
          <PageManager
            pages={pages}
            setPages={setPages}
            selectedPageIndex={getCurrentPageIndex()}
            onSelectPage={handlePageSelect}
            onAddFiles={() => fileInputRef.current?.click()}
            onClose={() => setShowSidebar(false)}
          />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">


        <div className="flex-1 overflow-auto p-8 relative flex justify-center bg-gray-50/50">
          {!pages.length ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300 h-fit my-auto max-w-md text-center">
              <div className="bg-blue-50 p-4 rounded-full mb-6">
                <Upload className="text-blue-500" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload PDF</h2>
              <p className="text-gray-500 mb-8">Upload a PDF file to start editing, signing, and rearranging pages.</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Choose PDF Files
              </button>
            </div>
          ) : (
            <>
              <Toolbar
                tool={tool}
                setTool={setTool}
                selectedElement={selectedElement}
                deleteSelectedElement={deleteSelectedElement}
                clearPageElements={clearPageElements}
                downloadPDF={handleDownloadPDF}
                hasElements={elements.length > 0 || pages.length > 0}
                isDownloading={isDownloading}
                showSidebar={showSidebar}
                setShowSidebar={setShowSidebar}
              />

              <div className="mt-20 w-fit max-w-full">
                <div className="bg-white shadow-2xl shadow-gray-200/50 rounded-lg p-1 min-h-[600px] flex justify-center items-start border border-gray-100">
                  {currentPageObj && (
                    <PDFViewer
                      page={currentPageObj}
                      elements={elements.filter(e => e.pageId === currentPageId)}
                      selectedElement={selectedElement}
                      tool={tool}
                      onToolClick={handleToolClick}
                      onElementSelect={handleElementSelect}
                      onElementMove={handleElementMove}
                      onElementResize={handleElementResize}
                      onElementRelease={handleElementRelease}
                    />
                  )}
                </div>
              </div>
            </>
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