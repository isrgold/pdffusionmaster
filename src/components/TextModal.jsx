// components/TextModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const TextModal = ({ show, onClose, onSubmit, clickPosition }) => {
  const [textInput, setTextInput] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#000000');
  
  const canvasRef = useRef(null);

  useEffect(() => {
    if (show && textInput) {
      createTextOnCanvas();
    }
  }, [textInput, fontSize, textColor, show]);

  const createTextOnCanvas = () => {
    const canvas = canvasRef.current;
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
    const canvas = canvasRef.current;
    return canvas.toDataURL('image/png');
  };

  const handleSubmit = () => {
    if (textInput.trim()) {
      createTextOnCanvas();
      
      setTimeout(() => {
        const dataUrl = createTextPNG();
        const canvas = canvasRef.current;
        
        const newElement = {
          id: Date.now(),
          type: 'text',
          text: textInput,
          x: clickPosition.x - canvas.width / 2,
          y: clickPosition.y - canvas.height / 2,
          width: canvas.width,
          height: canvas.height,
          dataUrl
        };
        
        onSubmit(newElement);
        onClose();
        setTextInput('');
      }, 100);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Text</h3>
          <button
            onClick={onClose}
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
              <canvas ref={canvasRef} className="border bg-white" />
            </div>
          )}
          
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
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
  );
};

export default TextModal;