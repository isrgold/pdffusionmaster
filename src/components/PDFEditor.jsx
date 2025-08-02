import React, { useState, useRef, useEffect } from 'react';
import { Upload, Type, PenTool, Download, Trash2, Move, X, Check } from 'lucide-react';

const PDFEditor = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [pdfPages, setPdfPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [tool, setTool] = useState('move');
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Modal states
  const [showTextModal, setShowTextModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#000000');
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  
  // Signature drawing
  const [isDrawing, setIsDrawing] = useState(false);
  const [signaturePaths, setSignaturePaths] = useState([]);
  const [signatureColor, setSignatureColor] = useState('#000000');
  
  const canvasRef = useRef(null);
  const textCanvasRef = useRef(null);
  const signatureCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Load PDF.js and PDF-lib
  useEffect(() => {
    const loadLibraries = async () => {
      // Load PDF.js
      const pdfScript = document.createElement('script');
      pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      pdfScript.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      };
      document.head.appendChild(pdfScript);
      
      // Load PDF-lib
      const pdfLibScript = document.createElement('script');
      pdfLibScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
      document.head.appendChild(pdfLibScript);
    };
    
    loadLibraries();
    
    return () => {
      // Cleanup scripts if needed
    };
  }, []);

  const createTextOnCanvas = () => {
    const canvas = textCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (textInput.trim()) {
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = textColor;
      ctx.textBaseline = 'top';
      
      // Calculate text dimensions
      const metrics = ctx.measureText(textInput);
      const textWidth = metrics.width;
      const textHeight = fontSize;
      
      // Resize canvas to fit text with padding
      const padding = 10;
      canvas.width = textWidth + padding * 2;
      canvas.height = textHeight + padding * 2;
      
      // Redraw text (canvas resize clears it)
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = textColor;
      ctx.textBaseline = 'top';
      ctx.fillText(textInput, padding, padding);
    }
  };

  const createTextPNG = () => {
    const canvas = textCanvasRef.current;
    return canvas.toDataURL('image/png');
  };

  const drawSignatureOnCanvas = () => {
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (signaturePaths.length > 0) {
      ctx.strokeStyle = signatureColor;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      signaturePaths.forEach(path => {
        if (path.length > 1) {
          ctx.beginPath();
          ctx.moveTo(path[0].x, path[0].y);
          for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
          }
          ctx.stroke();
        }
      });
    }
  };

  const createSignaturePNG = () => {
    if (signaturePaths.length === 0) return null;
    
    // Find bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    signaturePaths.forEach(path => {
      path.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });
    
    const padding = 10;
    const width = Math.ceil(maxX - minX) + padding * 2;
    const height = Math.ceil(maxY - minY) + padding * 2;
    
    // Create new canvas for cropped signature
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = width;
    cropCanvas.height = height;
    const cropCtx = cropCanvas.getContext('2d');
    
    cropCtx.strokeStyle = signatureColor;
    cropCtx.lineWidth = 2;
    cropCtx.lineCap = 'round';
    cropCtx.lineJoin = 'round';
    
    signaturePaths.forEach(path => {
      if (path.length > 1) {
        cropCtx.beginPath();
        cropCtx.moveTo(path[0].x - minX + padding, path[0].y - minY + padding);
        for (let i = 1; i < path.length; i++) {
          cropCtx.lineTo(path[i].x - minX + padding, path[i].y - minY + padding);
        }
        cropCtx.stroke();
      }
    });
    
    return {
      dataUrl: cropCanvas.toDataURL('image/png'),
      width,
      height
    };
  };

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
      renderPage(0, pages);
    }
  };

  const renderPage = async (pageNum, pages = pdfPages) => {
    if (pages.length === 0) return;
    
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const page = pages[pageNum];
    
    const viewport = page.getViewport({ scale: 1.5 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    
    try {
      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;
      renderTaskRef.current = null;
    } catch (error) {
      if (error.name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', error);
      }
    }
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const getSignatureMousePos = (e) => {
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getElementAt = (pos) => {
    return elements
      .filter(el => el.page === currentPage)
      .reverse()
      .find(el => {
        return pos.x >= el.x && pos.x <= el.x + el.width &&
               pos.y >= el.y && pos.y <= el.y + el.height;
      });
  };

  const handleCanvasMouseDown = (e) => {
    const pos = getMousePos(e);
    
    if (tool === 'text') {
      setClickPosition(pos);
      setShowTextModal(true);
      setTextInput('');
    } else if (tool === 'signature') {
      setClickPosition(pos);
      setShowSignatureModal(true);
      setSignaturePaths([]);
    } else if (tool === 'move') {
      const clickedElement = getElementAt(pos);
      if (clickedElement) {
        setSelectedElement(clickedElement);
        setIsDragging(true);
        setDragOffset({
          x: pos.x - clickedElement.x,
          y: pos.y - clickedElement.y
        });
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isDragging && selectedElement && tool === 'move') {
      const pos = getMousePos(e);
      const newX = pos.x - dragOffset.x;
      const newY = pos.y - dragOffset.y;
      
      setElements(prev => prev.map(el => 
        el.id === selectedElement.id 
          ? { ...el, x: newX, y: newY }
          : el
      ));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setSelectedElement(null);
  };

  // Text modal handlers
  const handleTextSubmit = () => {
    if (textInput.trim()) {
      createTextOnCanvas();
      
      setTimeout(() => {
        const dataUrl = createTextPNG();
        const canvas = textCanvasRef.current;
        
        const newElement = {
          id: Date.now(),
          type: 'text',
          text: textInput,
          x: clickPosition.x - canvas.width / 2,
          y: clickPosition.y - canvas.height / 2,
          width: canvas.width,
          height: canvas.height,
          page: currentPage,
          dataUrl
        };
        
        setElements(prev => [...prev, newElement]);
        setShowTextModal(false);
        setTextInput('');
      }, 100);
    }
  };

  // Signature modal handlers
  const handleSignatureMouseDown = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getSignatureMousePos(e);
    setSignaturePaths(prev => [...prev, [pos]]);
  };

  const handleSignatureMouseMove = (e) => {
    if (isDrawing) {
      e.preventDefault();
      const pos = getSignatureMousePos(e);
      setSignaturePaths(prev => {
        const newPaths = [...prev];
        if (newPaths.length > 0) {
          newPaths[newPaths.length - 1].push(pos);
        }
        return newPaths;
      });
    }
  };

  const handleSignatureMouseUp = (e) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const handleSignatureSubmit = () => {
    const signatureData = createSignaturePNG();
    if (signatureData) {
      const newElement = {
        id: Date.now(),
        type: 'signature',
        x: clickPosition.x - signatureData.width / 2,
        y: clickPosition.y - signatureData.height / 2,
        width: signatureData.width,
        height: signatureData.height,
        page: currentPage,
        dataUrl: signatureData.dataUrl
      };
      
      setElements(prev => [...prev, newElement]);
    }
    
    setShowSignatureModal(false);
    setSignaturePaths([]);
    
    // Clear the canvas
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const clearSignature = () => {
    setSignaturePaths([]);
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const clearElements = () => {
    setElements(prev => prev.filter(el => el.page !== currentPage));
  };

  const deleteSelectedElement = () => {
    if (selectedElement) {
      setElements(prev => prev.filter(el => el.id !== selectedElement.id));
      setSelectedElement(null);
    }
  };

  const downloadPDF = async () => {
    if (!window.PDFLib || !pdfData || elements.length === 0) {
      if (!window.PDFLib) {
        alert('PDF-lib is still loading. Please try again in a moment.');
        return;
      }
      if (elements.length === 0) {
        alert('No elements to add to PDF. Add some text or signatures first.');
        return;
      }
      if (!pdfData) {
        alert('PDF data not available. Please reload the PDF.');
        return;
      }
      return;
    }

    setIsDownloading(true);

    try {
      const { PDFDocument } = window.PDFLib;
      
      // Load the original PDF directly from the stored Uint8Array
      const pdfDoc = await PDFDocument.load(pdfData);
      const pages = pdfDoc.getPages();

      // Process each page that has elements
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const pageElements = elements.filter(el => el.page === pageIndex);
        
        if (pageElements.length > 0) {
          const page = pages[pageIndex];
          const { width: pageWidth, height: pageHeight } = page.getSize();
          
          // Get the original page viewport for scaling calculations
          const pdfPage = await pdfDocRef.current.getPage(pageIndex + 1);
          const viewport = pdfPage.getViewport({ scale: 1.5 });
          
          // Calculate scaling factors
          const scaleX = pageWidth / viewport.width;
          const scaleY = pageHeight / viewport.height;

          for (const element of pageElements) {
            try {
              // Convert data URL to bytes more reliably
              const base64Data = element.dataUrl.split(',')[1];
              const binaryString = atob(base64Data);
              const imageBytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                imageBytes[i] = binaryString.charCodeAt(i);
              }
              
              // Embed the image
              const image = await pdfDoc.embedPng(imageBytes);
              
              // Calculate position and size
              // PDF coordinates start from bottom-left, canvas from top-left
              const x = element.x * scaleX;
              const y = pageHeight - (element.y * scaleY) - (element.height * scaleY);
              const width = element.width * scaleX;
              const height = element.height * scaleY;
              
              // Draw the image on the page
              page.drawImage(image, {
                x,
                y,
                width,
                height,
              });
            } catch (error) {
              console.error(`Error adding element ${element.id} to page ${pageIndex}:`, error);
            }
          }
        }
      }

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Create download link
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pdfFile.name.replace('.pdf', '')}_edited.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error creating PDF:', error);
      alert(`Error creating PDF: ${error.message}. Please try uploading the PDF again.`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Update text preview
  useEffect(() => {
    if (showTextModal && textInput) {
      createTextOnCanvas();
    }
  }, [textInput, fontSize, textColor, showTextModal]);

  // Update signature preview
  useEffect(() => {
    if (showSignatureModal && signaturePaths.length > 0) {
      drawSignatureOnCanvas();
    }
  }, [signaturePaths, signatureColor, showSignatureModal]);

  useEffect(() => {
    if (pdfPages.length > 0) {
      renderPage(currentPage);
    }
  }, [currentPage]);

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
            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow-lg p-4 h-fit">
              <h3 className="font-semibold mb-4">Tools</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setTool('move')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded ${
                    tool === 'move' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  <Move size={16} />
                  Move
                </button>
                <button
                  onClick={() => setTool('text')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded ${
                    tool === 'text' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  <Type size={16} />
                  Text
                </button>
                <button
                  onClick={() => setTool('signature')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded ${
                    tool === 'signature' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  <PenTool size={16} />
                  Signature
                </button>
              </div>
              
              <hr className="my-4" />
              
              <div className="space-y-2">
                {selectedElement && (
                  <button
                    onClick={deleteSelectedElement}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-red-50 text-red-600"
                  >
                    <Trash2 size={16} />
                    Delete Selected
                  </button>
                )}
                <button
                  onClick={clearElements}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-red-50 text-red-600"
                >
                  <Trash2 size={16} />
                  Clear Page
                </button>
                <button
                  onClick={downloadPDF}
                  disabled={elements.length === 0 || isDownloading}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-green-50 text-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={16} />
                  {isDownloading ? 'Creating PDF...' : 'Download PDF'}
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-lg p-4">
                {/* Page Navigation */}
                {pdfPages.length > 1 && (
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="font-medium">
                      Page {currentPage + 1} of {pdfPages.length}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(pdfPages.length - 1, currentPage + 1))}
                      disabled={currentPage === pdfPages.length - 1}
                      className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
                
                {/* Canvas Container */}
                <div className="border-2 border-gray-200 rounded-lg overflow-auto relative">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    className="block relative"
                    style={{
                      cursor: tool === 'move' ? 'move' : tool === 'text' ? 'text' : 'crosshair'
                    }}
                  />
                  
                  {/* PNG Elements Overlay */}
                  {elements
                    .filter(el => el.page === currentPage)
                    .map(element => (
                      <img
                        key={element.id}
                        src={element.dataUrl}
                        alt={element.type}
                        className={`absolute pointer-events-none select-none ${
                          selectedElement?.id === element.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        style={{
                          left: `${(element.x / canvasRef.current?.width) * 100}%`,
                          top: `${(element.y / canvasRef.current?.height) * 100}%`,
                          width: `${(element.width / canvasRef.current?.width) * 100}%`,
                          height: `${(element.height / canvasRef.current?.height) * 100}%`,
                        }}
                      />
                    ))}
                </div>
                
                {/* Instructions */}
                <div className="mt-4 text-sm text-gray-600">
                  <p className="font-medium mb-2">Instructions:</p>
                  <ul className="space-y-1">
                    <li><strong>Move:</strong> Click and drag PNG elements to reposition</li>
                    <li><strong>Text:</strong> Click to open text editor modal</li>
                    <li><strong>Signature:</strong> Click to open signature drawing pad</li>
                    <li><strong>Delete:</strong> Select element and press Delete or use button</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Canvases for Creating PNGs */}
        <canvas ref={textCanvasRef} className="hidden" width={400} height={100} />
        
        {/* Text Modal */}
        {showTextModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add Text</h3>
                <button
                  onClick={() => setShowTextModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Text</label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="w-full border rounded px-3 py-2 h-20 resize-none"
                    placeholder="Enter your text..."
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Font Size</label>
                    <input
                      type="number"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full border rounded px-3 py-2"
                      min="8"
                      max="72"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Color</label>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-full border rounded h-10"
                    />
                  </div>
                </div>
                
                {/* Preview */}
                {textInput && (
                  <div className="border rounded p-3 bg-gray-50">
                    <p className="text-sm font-medium mb-2">Preview:</p>
                    <canvas ref={textCanvasRef} className="border bg-white" />
                  </div>
                )}
                
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowTextModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTextSubmit}
                    disabled={!textInput.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Check size={16} />
                    Add Text
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Signature Modal */}
        {showSignatureModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Draw Signature</h3>
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <input
                    type="color"
                    value={signatureColor}
                    onChange={(e) => setSignatureColor(e.target.value)}
                    className="border rounded h-8 w-20"
                  />
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-2">
                  <canvas
                    ref={signatureCanvasRef}
                    width={600}
                    height={200}
                    onMouseDown={handleSignatureMouseDown}
                    onMouseMove={handleSignatureMouseMove}
                    onMouseUp={handleSignatureMouseUp}
                    onMouseLeave={handleSignatureMouseUp}
                    className="w-full cursor-crosshair bg-white rounded border"
                    style={{ touchAction: 'none' }}
                  />
                </div>
                
                <p className="text-sm text-gray-600 text-center">
                  Draw your signature above
                </p>
                
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={clearSignature}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowSignatureModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSignatureSubmit}
                    disabled={signaturePaths.length === 0 || signaturePaths.every(path => path.length === 0)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Check size={16} />
                    Add Signature
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFEditor;