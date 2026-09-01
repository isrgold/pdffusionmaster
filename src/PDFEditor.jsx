// PDFEditor.jsx - Main component
import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import Toolbar from './components/Toolbar';
import PDFViewer from './components/PDFViewer';
import PageManager from './components/PageManager';
import TextModal from './components/TextModal';
import SignatureModal from './components/SignatureModal/SignatureModal';
import Header from './components/Header';
import Logo from './components/Logo';
import { loadPDFLibraries, getPdfJs } from './utils/pdfUtils';
import { downloadPDF } from './utils/downloadUtils';

const PDFEditor = () => {
  // Documents state: { [docId]: { data: Uint8Array, fileName: string } }
  const [documents, setDocuments] = useState({});
  // Pages state: Array of { id: string, pdfPage: Proxy, originalDocId: string, pageIndex: number, rotation: 0 }
  const [pages, setPages] = useState([]);
  const [currentPageId, setCurrentPageId] = useState(null);

  // Interaction states
  const [tool, setTool] = useState('move');
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Modal states
  const [showTextModal, setShowTextModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });

  // Refs
  const fileInputRef = useRef(null);

  // Load PDF.js and PDF-lib
  useEffect(() => {
    loadPDFLibraries();
  }, []);

  // Intersection Observer for Current Page tracking
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const pageId = entry.target.dataset.pageId;
          if (pageId) {
            setCurrentPageId(pageId);
          }
        }
      });
    }, options);

    pages.forEach(page => {
      const element = document.getElementById(`page-${page.id}`);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [pages]);

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
          const password = prompt(reason === 1 ? 'הכנס סיסמה:' : 'סיסמה שגויה, נסה שוב:');
          if (password) updatePassword(password);
        };

        const pdf = await loadingTask.promise;
        const newPages = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: 1.0 });

          newPages.push({
            id: generateId(),
            pdfPage: page,
            originalDocId: docId,
            pageIndex: i - 1,
            rotation: 0,
            fileName: file.name,
            thumbnail: null,
            aspectRatio: vp.width / vp.height,
            originalWidth: vp.width,
            originalHeight: vp.height
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
        alert(`שגיאה שטעינת הקובץ ${file.name}`);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    if (droppedFiles.length > 0) {
      handleFileUpload({ target: { files: droppedFiles } });
    }
  };

  const updatePageThumbnail = (pageId, thumbnail) => {
    setPages(prev => prev.map(p =>
      p.id === pageId ? { ...p, thumbnail } : p
    ));
  };

  const handleToolClick = (pos, pageId) => {
    if (tool === 'text') {
      setClickPosition(pos);
      if (pageId && pageId !== currentPageId) {
        setCurrentPageId(pageId);
      }
      setShowTextModal(true);
    } else if (tool === 'signature') {
      setClickPosition(pos);
      if (pageId && pageId !== currentPageId) {
        setCurrentPageId(pageId);
      }
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

  const handleDownloadPDF = () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setTimeout(async () => {
      await downloadPDF({
        documents,
        pages,
        elements,
        setIsDownloading,
        onSaveSuccess: () => {
          setShowSaveSuccess(true);
          setTimeout(() => setShowSaveSuccess(false), 3500);
        }
      });
    }, 20);
  };

  const handlePageSelect = (index) => {
    if (pages[index]) {
      const pageId = pages[index].id;
      setCurrentPageId(pageId);

      const pageElement = document.getElementById(`page-${pageId}`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const getCurrentPageIndex = () => {
    return pages.findIndex(p => p.id === currentPageId);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100/80 overflow-hidden relative font-sans" dir="rtl">
      {/* App Top Header Bar */}
      <Header pageCount={pages.length} />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar - Page Manager (Floating Drawer) */}
        {pages.length > 0 && showSidebar && (
          <div className="absolute right-0 top-0 h-full w-80 bg-white/95 backdrop-blur-xl shadow-2xl z-50 transition-transform duration-300 ease-in-out border-l border-slate-200">
            <PageManager
              pages={pages}
              setPages={setPages}
              selectedPageIndex={getCurrentPageIndex()}
              onSelectPage={handlePageSelect}
              onAddFiles={() => fileInputRef.current?.click()}
              onClose={() => setShowSidebar(false)}
              onUpdateThumbnail={updatePageThumbnail}
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

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative overflow-auto">

          {/* Glowing Background Art */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-500/10 rounded-full blur-[140px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-indigo-500/10 rounded-full blur-[140px]" />
          </div>

          {!pages.length ? (
            /* Clean Minimalist Application Workspace Upload */
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10 max-w-3xl mx-auto text-center my-auto">
              
              {/* Clean App Logo & Header */}
              <div className="mb-6 flex flex-col items-center">
                <Logo size="lg" showText={true} />
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-2">
                עריכה, מיזוג וחתימה על מסמכי PDF
              </h1>
              
              <p className="text-slate-500 text-sm sm:text-base mb-8 max-w-md">
                בחר קבצים מהמחשב או גרור אותם ישירות לכאן כדי להתחיל
              </p>

              {/* Professional Upload Dropzone Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full max-w-lg p-10 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center relative bg-white shadow-xs ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50/40 shadow-md scale-[1.01]'
                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'
                }`}
              >
                <div className={`p-4 rounded-full mb-4 transition-colors ${isDragOver ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                  <Upload size={28} strokeWidth={1.75} />
                </div>

                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm px-6 py-2.5 rounded-xl transition-colors shadow-xs"
                  >
                    בחירת קבצים מהמחשב
                  </button>
                  <span className="text-xs text-slate-400 mt-2">
                    או גרור קבצי PDF ישירות לכאן
                  </span>
                </div>
              </div>

              {/* Supported formats info */}
              <div className="mt-8 text-xs text-slate-400 flex items-center justify-center gap-4">
                <span>תומך בפורמט PDF</span>
                <span>•</span>
                <span>בחירת קבצים מרובים למיזוג</span>
              </div>

            </div>
          ) : (
            /* Active PDF Workspace */
            <div className="flex-1 overflow-auto p-4 sm:p-8 relative flex justify-center z-10">
              <div className="flex flex-col items-center w-full">
                <Toolbar
                  tool={tool}
                  setTool={setTool}
                  selectedElement={selectedElement}
                  deleteSelectedElement={deleteSelectedElement}
                  clearPageElements={clearPageElements}
                  downloadPDF={handleDownloadPDF}
                  onRotatePage={() => {
                    if (currentPageId) {
                      setPages(prev => prev.map(p =>
                        p.id === currentPageId ? { ...p, rotation: (p.rotation + 90) % 360 } : p
                      ));
                    }
                  }}
                  hasElements={elements.length > 0 || pages.length > 0}
                  isDownloading={isDownloading}
                  showSidebar={showSidebar}
                  setShowSidebar={setShowSidebar}
                />

                <div className="mt-24 w-fit max-w-full pb-20">
                  <div className="bg-white/95 backdrop-blur-sm shadow-2xl shadow-slate-900/10 rounded-2xl overflow-hidden border border-slate-200/80 transition-all duration-300">
                    <div className="flex flex-col gap-8 items-center py-8" id="pdf-scroll-container" dir="ltr" style={{ direction: 'ltr' }}>
                      {pages.map((page) => (
                        <div
                          key={page.id}
                          id={`page-${page.id}`}
                          className="relative shadow-lg rounded-lg"
                          data-page-id={page.id}
                        >
                          <PDFViewer
                            page={page}
                            elements={elements.filter(e => e.pageId === page.id)}
                            selectedElement={selectedElement}
                            tool={tool}
                            onToolClick={(pos) => {
                              setCurrentPageId(page.id);
                              handleToolClick(pos, page.id);
                            }}
                            onElementSelect={handleElementSelect}
                            onElementMove={handleElementMove}
                            onElementResize={handleElementResize}
                            onElementRelease={handleElementRelease}
                          />
                          {/* Page Number Badge */}
                          <div className="absolute top-3 left-[-44px] bg-slate-800 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-md">
                            {page.pageIndex + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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

      {/* Success Save Toast Notification */}
      {showSaveSuccess && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-900/30 border border-emerald-400/40 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle size={22} className="text-emerald-100" />
          <span className="font-semibold text-base tracking-wide">המסמך נשמר בהצלחה!</span>
        </div>
      )}
    </div>
  );
};

export default PDFEditor;