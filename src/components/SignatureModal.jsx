// components/SignatureModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const SignatureModal = ({ show, onClose, onSubmit, clickPosition }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [signaturePaths, setSignaturePaths] = useState([]);
  const [signatureColor, setSignatureColor] = useState('#000000');
  
  const canvasRef = useRef(null);

  useEffect(() => {
    if (show && signaturePaths.length > 0) {
      drawSignatureOnCanvas();
    }
  }, [signaturePaths, signatureColor, show]);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const drawSignatureOnCanvas = () => {
    const canvas = canvasRef.current;
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

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getMousePos(e);
    setSignaturePaths(prev => [...prev, [pos]]);
  };

  const handleMouseMove = (e) => {
    if (isDrawing) {
      e.preventDefault();
      const pos = getMousePos(e);
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
  };

  const clearSignature = () => {
    setSignaturePaths([]);
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
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Draw Signature</h3>
          <button
            onClick={onClose}
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
              ref={canvasRef}
              width={600}
              height={200}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
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
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
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
  );
};

export default SignatureModal;