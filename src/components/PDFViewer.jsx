// components/PDFViewer.jsx
import React, { useRef, useEffect } from 'react';

const PDFViewer = ({
  page,
  elements,
  selectedElement,
  tool,
  onToolClick,
  onElementSelect,
  onElementMove,
  onElementRelease
}) => {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  useEffect(() => {
    if (page) {
      renderPage();
    }
  }, [page]); // Re-render when page object changes

  const renderPage = async () => {
    if (!page || !page.pdfPage) return;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pdfPage = page.pdfPage;

    // Use rotation from page object if available (not fully implemented in edit yet, but ready)
    const viewport = pdfPage.getViewport({ scale: 1.5, rotation: page.rotation || 0 });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };

    try {
      renderTaskRef.current = pdfPage.render(renderContext);
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
      .slice() // Copy to avoid mutating
      .reverse() // Check top-most elements first
      .find(el => {
        return pos.x >= el.x && pos.x <= el.x + el.width &&
          pos.y >= el.y && pos.y <= el.y + el.height;
      });
  };

  const handleCanvasMouseDown = (e) => {
    const pos = getMousePos(e);

    if (tool === 'text' || tool === 'signature') {
      onToolClick(pos);
    } else if (tool === 'move') {
      const clickedElement = getElementAt(pos);
      if (clickedElement) {
        onElementSelect(clickedElement, pos);
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    const pos = getMousePos(e);
    onElementMove(pos);
  };

  const getCursorStyle = () => {
    switch (tool) {
      case 'move': return 'move';
      case 'text': return 'text';
      case 'signature': return 'crosshair';
      default: return 'default';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* Canvas Container */}
      <div className="border-2 border-gray-200 rounded-lg overflow-auto relative">
        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={onElementRelease}
          onMouseLeave={onElementRelease}
          className="block relative"
          style={{ cursor: getCursorStyle() }}
        />

        {/* Elements Overlay */}
        {elements.map(element => (
          <img
            key={element.id}
            src={element.dataUrl}
            alt={element.type}
            className={`absolute pointer-events-none select-none ${selectedElement?.id === element.id ? 'ring-2 ring-blue-500' : ''
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
          <li><strong>Move:</strong> Click and drag elements to reposition</li>
          <li><strong>Text:</strong> Click to add text</li>
          <li><strong>Signature:</strong> Click to draw signature</li>
          <li><strong>Delete:</strong> Select element and press Delete or use button</li>
        </ul>
      </div>
    </div>
  );
};

export default PDFViewer;