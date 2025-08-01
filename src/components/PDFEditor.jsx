import React, { useState, useRef, useEffect } from 'react';
import { Upload, Type, PenTool, Download, Trash2, Move } from 'lucide-react';

const PDFEditor = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfPages, setPdfPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [tool, setTool] = useState('move');
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentSignature, setCurrentSignature] = useState(null);
  
  const canvasRef = useRef(null);
  const signatureCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Load PDF.js
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    };
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const createTextPNG = (text, fontSize = 16, color = '#000000') => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    ctx.font = `${fontSize}px Arial`;
    const metrics = ctx.measureText(text);
    
    canvas.width = Math.ceil(metrics.width) + 10;
    canvas.height = fontSize + 10;
    
    // Clear and set font again (canvas resize clears context)
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    ctx.fillText(text, 5, 5);
    
    return canvas.toDataURL('image/png');
  };

  const createSignaturePNG = (paths) => {
    if (!paths || paths.length === 0) return null;
    
    // Find bounds of the signature
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    paths.forEach(path => {
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
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    paths.forEach(path => {
      if (path.length > 1) {
        ctx.beginPath();
        ctx.moveTo(path[0].x - minX + padding, path[0].y - minY + padding);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x - minX + padding, path[i].y - minY + padding);
        }
        ctx.stroke();
      }
    });
    
    return {
      dataUrl: canvas.toDataURL('image/png'),
      bounds: { minX, minY, width, height }
    };
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setElements([]);
      setCurrentPage(0);
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
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

  const getElementAt = (pos) => {
    return elements
      .filter(el => el.page === currentPage)
      .reverse() // Check from top to bottom
      .find(el => {
        return pos.x >= el.x && pos.x <= el.x + el.width &&
               pos.y >= el.y && pos.y <= el.y + el.height;
      });
  };

  const handleCanvasMouseDown = (e) => {
    const pos = getMousePos(e);
    
    if (tool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const fontSize = 16;
        const textPNG = createTextPNG(text, fontSize);
        const tempImg = new Image();
        tempImg.onload = () => {
          const newElement = {
            id: Date.now(),
            type: 'text',
            text,
            x: pos.x,
            y: pos.y,
            width: tempImg.width,
            height: tempImg.height,
            page: currentPage,
            dataUrl: textPNG,
            fontSize
          };
          setElements(prev => [...prev, newElement]);
        };
        tempImg.src = textPNG;
      }
    } else if (tool === 'signature') {
      setIsDrawing(true);
      setCurrentSignature([[pos]]);
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
    const pos = getMousePos(e);
    
    if (isDrawing && tool === 'signature') {
      setCurrentSignature(prev => {
        if (!prev || prev.length === 0) return [[pos]];
        const newPaths = [...prev];
        newPaths[newPaths.length - 1].push(pos);
        return newPaths;
      });
      
      // Draw on temporary canvas
      const canvas = signatureCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        if (currentSignature) {
          currentSignature.forEach(path => {
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
      }
    } else if (isDragging && selectedElement && tool === 'move') {
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
    if (isDrawing && currentSignature) {
      const signatureData = createSignaturePNG(currentSignature);
      if (signatureData) {
        const newElement = {
          id: Date.now(),
          type: 'signature',
          x: signatureData.bounds.minX,
          y: signatureData.bounds.minY,
          width: signatureData.bounds.width,
          height: signatureData.bounds.height,
          page: currentPage,
          dataUrl: signatureData.dataUrl
        };
        setElements(prev => [...prev, newElement]);
      }
      
      // Clear signature canvas
      const canvas = signatureCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    
    setIsDrawing(false);
    setCurrentSignature(null);
    setIsDragging(false);
    setSelectedElement(null);
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

  useEffect(() => {
    if (pdfPages.length > 0) {
      renderPage(currentPage);
    }
  }, [currentPage]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedElement) {
        deleteSelectedElement();
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
                  onClick={() => alert('Download functionality would require PDF-lib library for full implementation.')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-green-50 text-green-600"
                >
                  <Download size={16} />
                  Download
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
                  {/* PDF Canvas */}
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
                  
                  {/* Signature Drawing Canvas Overlay */}
                  <canvas
                    ref={signatureCanvasRef}
                    width={canvasRef.current?.width || 800}
                    height={canvasRef.current?.height || 600}
                    className="absolute top-0 left-0 pointer-events-none"
                    style={{ display: isDrawing ? 'block' : 'none' }}
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
                    <li><strong>Move:</strong> Click and drag PNG elements to reposition them</li>
                    <li><strong>Text:</strong> Click anywhere to add text as PNG</li>
                    <li><strong>Signature:</strong> Draw your signature - it will be converted to PNG</li>
                    <li><strong>Delete:</strong> Select an element and press Delete key or use the button</li>
                  </ul>
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