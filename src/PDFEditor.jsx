// PDFEditor.jsx - Main component
import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle, ShieldCheck, Sparkles, PenTool, FileText, Layers } from 'lucide-react';
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
            /* Welcome / Upload Hero */
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10 max-w-4xl mx-auto text-center my-auto">
              
              {/* Large Animated Logo */}
              <div className="mb-8 scale-110 sm:scale-125">
                <Logo size="xl" showText={true} />
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4 max-w-2xl">
                עריכה, מיזוג וחתימה על <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">PDF</span> ברמה מקצועית
              </h1>
              
              <p className="text-slate-600 text-base sm:text-lg mb-8 max-w-xl leading-relaxed font-normal">
                מערכת מתקדמת למיזוג מסמכים, סידור עמודים, הוספת טקסטים וחתימה אלקטרונית - במהירות שיא ובאבטחה מלאה <strong>ללא העלאה לשרת</strong>.
              </p>

              {/* Upload Dropzone Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-xl bg-white/90 backdrop-blur-xl border-2 border-dashed border-blue-300 hover:border-blue-500 p-8 sm:p-10 rounded-3xl shadow-xl hover:shadow-2xl shadow-blue-500/10 transition-all cursor-pointer group flex flex-col items-center justify-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-indigo-50/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-5 rounded-2xl mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                  <Upload size={36} strokeWidth={2} />
                </div>

                <span className="relative text-xl font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                  לחץ כאן להעלאת קבצי PDF
                </span>
                <span className="relative text-sm text-slate-500">
                  ניתן לבחור קובץ אחד או מספר קבצים למיזוג ועריכה
                </span>
              </div>

              {/* Feature Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-12 text-right">
                <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">פרטיות 100%</h3>
                    <p className="text-xs text-slate-500 mt-0.5">המידע נשאר במחשב שלך בלבד</p>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start gap-3">
                  <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">ביצועים מהירים</h3>
                    <p className="text-xs text-slate-500 mt-0.5">טעינת Canvas מואצת אופליין</p>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start gap-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
                    <PenTool size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">חתימה ועריכה</h3>
                    <p className="text-xs text-slate-500 mt-0.5">חתימה אישית והוספת טקסטים</p>
                  </div>
                </div>
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