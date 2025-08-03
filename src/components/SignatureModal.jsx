// components/SignatureModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Type } from 'lucide-react';

const SignatureModal = ({ show, onClose, onSubmit, clickPosition }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [signaturePaths, setSignaturePaths] = useState([]);
  const [signatureColor, setSignatureColor] = useState('#000000');
  const [textElements, setTextElements] = useState([]);
  const [mode, setMode] = useState('draw'); // 'draw' or 'text'
  const [draggedElement, setDraggedElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeTextElement, setActiveTextElement] = useState(null);
  const [fontSize, setFontSize] = useState(16);
  
  const canvasRef = useRef(null);

  useEffect(() => {
    if (show) {
      redrawCanvas();
    }
  }, [signaturePaths, signatureColor, textElements, show]);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw signature paths
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
    
    // Draw text elements
    textElements.forEach(textEl => {
      ctx.fillStyle = textEl.color;
      ctx.font = `${textEl.fontSize}px Arial`;
      ctx.fillText(textEl.text, textEl.x, textEl.y);
      
      // Draw selection border if dragging or active
      if ((draggedElement && draggedElement.id === textEl.id) || 
          (activeTextElement && activeTextElement.id === textEl.id)) {
        const metrics = ctx.measureText(textEl.text);
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          textEl.x - 2, 
          textEl.y - textEl.fontSize - 2, 
          metrics.width + 4, 
          textEl.fontSize + 4
        );
        ctx.setLineDash([]);
        
        // Draw cursor if active
        if (activeTextElement && activeTextElement.id === textEl.id) {
          const cursorX = textEl.x + metrics.width;
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(cursorX, textEl.y - textEl.fontSize);
          ctx.lineTo(cursorX, textEl.y);
          ctx.stroke();
        }
      }
    });
  };

  const getTextElementAt = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    for (let i = textElements.length - 1; i >= 0; i--) {
      const textEl = textElements[i];
      ctx.font = `${textEl.fontSize}px Arial`;
      const metrics = ctx.measureText(textEl.text);
      
      if (x >= textEl.x && 
          x <= textEl.x + metrics.width && 
          y >= textEl.y - textEl.fontSize && 
          y <= textEl.y) {
        return textEl;
      }
    }
    return null;
  };

  const createSignaturePNG = () => {
    if (signaturePaths.length === 0 && textElements.length === 0) return null;
    
    // Find bounds including both paths and text
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    // Check signature paths
    signaturePaths.forEach(path => {
      path.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });
    
    // Check text elements
    if (textElements.length > 0) {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      textElements.forEach(textEl => {
        tempCtx.font = `${textEl.fontSize}px Arial`;
        const metrics = tempCtx.measureText(textEl.text);
        
        minX = Math.min(minX, textEl.x);
        minY = Math.min(minY, textEl.y - textEl.fontSize);
        maxX = Math.max(maxX, textEl.x + metrics.width);
        maxY = Math.max(maxY, textEl.y);
      });
    }
    
    // If no elements, return null
    if (minX === Infinity) return null;
    
    const padding = 10;
    const width = Math.ceil(maxX - minX) + padding * 2;
    const height = Math.ceil(maxY - minY) + padding * 2;
    
    // Create new canvas for cropped signature
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = width;
    cropCanvas.height = height;
    const cropCtx = cropCanvas.getContext('2d');
    
    // Draw signature paths
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
    
    // Draw text elements
    textElements.forEach(textEl => {
      cropCtx.fillStyle = textEl.color;
      cropCtx.font = `${textEl.fontSize}px Arial`;
      cropCtx.fillText(
        textEl.text, 
        textEl.x - minX + padding, 
        textEl.y - minY + padding
      );
    });
    
    return {
      dataUrl: cropCanvas.toDataURL('image/png'),
      width,
      height
    };
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    const pos = getMousePos(e);
    
    if (mode === 'text') {
      // Check if clicking on existing text element
      const textElement = getTextElementAt(pos.x, pos.y);
      if (textElement) {
        setDraggedElement(textElement);
        setDragOffset({
          x: pos.x - textElement.x,
          y: pos.y - textElement.y
        });
        setActiveTextElement(null);
      } else {
        // Create new text element
        const newTextElement = {
          id: Date.now(),
          text: '',
          x: pos.x,
          y: pos.y,
          fontSize: fontSize,
          color: signatureColor
        };
        
        setTextElements(prev => [...prev, newTextElement]);
        setActiveTextElement(newTextElement);
        setDraggedElement(null);
      }
    } else if (mode === 'draw') {
      setActiveTextElement(null);
      setIsDrawing(true);
      setSignaturePaths(prev => [...prev, [pos]]);
    }
  };

  const handleMouseMove = (e) => {
    e.preventDefault();
    const pos = getMousePos(e);
    
    if (draggedElement) {
      // Update text element position
      setTextElements(prev => prev.map(textEl => 
        textEl.id === draggedElement.id 
          ? { ...textEl, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
          : textEl
      ));
      setDraggedElement(prev => prev ? { ...prev, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y } : null);
    } else if (isDrawing && mode === 'draw') {
      setSignaturePaths(prev => {
        const newPaths = [...prev];
        if (newPaths.length > 0) {
          newPaths[newPaths.length - 1].push(pos);
        }
        return newPaths;
      });
    }
  };

  const handleMouseUp = (e) => {
    e.preventDefault();
    setIsDrawing(false);
    setDraggedElement(null);
  };

  const handleCanvasClick = (e) => {
    // This is now handled in handleMouseDown
  };

  const handleKeyDown = (e) => {
    if (activeTextElement) {
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (activeTextElement.text.length > 0) {
          const updatedText = activeTextElement.text.slice(0, -1);
          setTextElements(prev => prev.map(textEl => 
            textEl.id === activeTextElement.id 
              ? { ...textEl, text: updatedText }
              : textEl
          ));
          setActiveTextElement(prev => ({ ...prev, text: updatedText }));
        } else {
          // Remove empty text element
          setTextElements(prev => prev.filter(textEl => textEl.id !== activeTextElement.id));
          setActiveTextElement(null);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setActiveTextElement(null);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setActiveTextElement(null);
      } else if (e.key.length === 1) {
        e.preventDefault();
        const updatedText = activeTextElement.text + e.key;
        setTextElements(prev => prev.map(textEl => 
          textEl.id === activeTextElement.id 
            ? { ...textEl, text: updatedText }
            : textEl
        ));
        setActiveTextElement(prev => ({ ...prev, text: updatedText }));
      }
    }
  };

  // Add keyboard event listener
  useEffect(() => {
    if (show && activeTextElement) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [show, activeTextElement]);

  const clearAll = () => {
    setSignaturePaths([]);
    setTextElements([]);
    setActiveTextElement(null);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = () => {
    const signatureData = createSignaturePNG();
    if (signatureData) {
      const newElement = {
        id: Date.now(),
        type: 'signature',
        x: clickPosition.x - signatureData.width / 2,
        y: clickPosition.y - signatureData.height / 2,
        width: signatureData.width,
        height: signatureData.height,
        dataUrl: signatureData.dataUrl
      };
      
      onSubmit(newElement);
    }
    
    onClose();
    setSignaturePaths([]);
    setTextElements([]);
    setActiveTextElement(null);
    
    // Clear the canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Create Signature</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('draw')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                mode === 'draw' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ✏️ Draw
            </button>
            <button
              onClick={() => setMode('text')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                mode === 'text' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Type size={16} />
              Text
            </button>
          </div>

          {/* Controls */}
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <input
                type="color"
                value={signatureColor}
                onChange={(e) => setSignatureColor(e.target.value)}
                className="border rounded h-8 w-20"
              />
            </div>
            
            {mode === 'text' && (
              <div>
                <label className="block text-sm font-medium mb-1">Font Size</label>
                <input
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value) || 16)}
                  min="8"
                  max="72"
                  className="border rounded px-3 py-1 w-20"
                />
              </div>
            )}
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-2">
            <canvas
              ref={canvasRef}
              width={700}
              height={250}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={handleCanvasClick}
              className={`w-full bg-white rounded border ${
                mode === 'draw' ? 'cursor-crosshair' : 'cursor-pointer'
              }`}
              style={{ touchAction: 'none' }}
            />
          </div>
          
          <p className="text-sm text-gray-600 text-center">
            {mode === 'draw' 
              ? 'Draw your signature above' 
              : 'Enter text and click on the canvas to add it. Click and drag existing text to move it.'
            }
          </p>
          
          <div className="flex gap-2 justify-end">
            <button
              onClick={clearAll}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={signaturePaths.length === 0 && textElements.length === 0}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              <Check size={16} />
              Add Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;