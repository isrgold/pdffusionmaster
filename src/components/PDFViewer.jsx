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
  onElementResize,
  onElementRelease
}) => {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Resize state
  const [resizeState, setResizeState] = React.useState(null); // { handle: string, startX: number, startY: number, startWidth: number, startHeight: number, startLeft: number, startTop: number }

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

  // Helper to check if mouse is over a resize handle
  const getResizeHandleAt = (pos, element) => {
    if (!element || !canvasRef.current) return null;

    const handleSize = 16; // Corresponds to w-4 h-4 (16px)
    const halfHandleSize = handleSize / 2;

    const elementX = element.x;
    const elementY = element.y;
    const elementWidth = element.width;
    const elementHeight = element.height;

    const handles = {
      nw: { x: elementX - halfHandleSize, y: elementY - halfHandleSize },
      ne: { x: elementX + elementWidth - halfHandleSize, y: elementY - halfHandleSize },
      sw: { x: elementX - halfHandleSize, y: elementY + elementHeight - halfHandleSize },
      se: { x: elementX + elementWidth - halfHandleSize, y: elementY + elementHeight - halfHandleSize },
    };

    for (const handle in handles) {
      const h = handles[handle];
      if (pos.x >= h.x && pos.x <= h.x + handleSize &&
        pos.y >= h.y && pos.y <= h.y + handleSize) {
        return handle;
      }
    }
    return null;
  };

  const handleCanvasMouseDown = (e) => {
    const pos = getMousePos(e);

    if (tool === 'text' || tool === 'signature') {
      onToolClick(pos);
    } else if (tool === 'move') {
      const clickedElement = getElementAt(pos);
      if (clickedElement) {
        const handle = getResizeHandleAt(pos, clickedElement);
        if (handle) {
          setResizeState({
            handle: handle,
            startX: pos.x,
            startY: pos.y,
            startWidth: clickedElement.width,
            startHeight: clickedElement.height,
            startLeft: clickedElement.x,
            startTop: clickedElement.y
          });
          onElementSelect(clickedElement, pos); // Select the element if a handle is clicked
        } else {
          onElementSelect(clickedElement, pos);
        }
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    const pos = getMousePos(e);

    // Update cursor for resize handles
    if (selectedElement && tool === 'move' && !resizeState) {
      const handle = getResizeHandleAt(pos, selectedElement);
      if (handle) {
        const cursorMap = {
          nw: 'nw-resize',
          ne: 'ne-resize',
          sw: 'sw-resize',
          se: 'se-resize'
        };
        canvasRef.current.style.cursor = cursorMap[handle];
      } else if (getElementAt(pos)) {
        canvasRef.current.style.cursor = 'move';
      } else {
        canvasRef.current.style.cursor = 'default';
      }
    } else if (resizeState) {
      // ... resizing logic same as before ...
      const deltaX = pos.x - resizeState.startX;
      const deltaY = pos.y - resizeState.startY;

      let newX = resizeState.startLeft;
      let newY = resizeState.startTop;
      let newWidth = resizeState.startWidth;
      let newHeight = resizeState.startHeight;

      switch (resizeState.handle) {
        case 'se':
          newWidth = Math.max(20, resizeState.startWidth + deltaX);
          newHeight = Math.max(20, resizeState.startHeight + deltaY);
          break;
        case 'sw':
          newWidth = Math.max(20, resizeState.startWidth - deltaX);
          newX = resizeState.startLeft + (resizeState.startWidth - newWidth);
          newHeight = Math.max(20, resizeState.startHeight + deltaY);
          break;
        case 'ne':
          newWidth = Math.max(20, resizeState.startWidth + deltaX);
          newHeight = Math.max(20, resizeState.startHeight - deltaY);
          newY = resizeState.startTop + (resizeState.startHeight - newHeight);
          break;
        case 'nw':
          newWidth = Math.max(20, resizeState.startWidth - deltaX);
          newX = resizeState.startLeft + (resizeState.startWidth - newWidth);
          newHeight = Math.max(20, resizeState.startHeight - deltaY);
          newY = resizeState.startTop + (resizeState.startHeight - newHeight);
          break;
      }

      onElementResize(selectedElement.id, { x: newX, y: newY, width: newWidth, height: newHeight });
      return;
    } else if (tool === 'move') {
      // Fallback cursor update if no element selected
      if (getElementAt(pos)) {
        canvasRef.current.style.cursor = 'move';
      } else {
        canvasRef.current.style.cursor = 'default';
      }
    }

    onElementMove(pos);
  };

  const handleMouseUp = () => {
    if (resizeState) {
      setResizeState(null);
    }
    onElementRelease();
  };

  const getCursorStyle = () => {
    switch (tool) {
      case 'move': return 'default';
      case 'text': return 'text';
      case 'signature': return 'crosshair';
      default: return 'default';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* Canvas Container */}
      <div
        className="border-2 border-gray-200 rounded-lg overflow-hidden relative"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          className="block relative"
          style={{ cursor: getCursorStyle() }}
        />

        {/* Elements Overlay */}
        {elements.map(element => (
          <div
            key={element.id}
            className={`absolute select-none group ${selectedElement?.id === element.id ? 'z-20' : 'z-10'}`}
            style={{
              left: `${(element.x / canvasRef.current?.width) * 100}%`,
              top: `${(element.y / canvasRef.current?.height) * 100}%`,
              width: `${(element.width / canvasRef.current?.width) * 100}%`,
              height: `${(element.height / canvasRef.current?.height) * 100}%`,
              pointerEvents: 'none'
            }}
          >
            {/* Selection Border */}
            <div className={`w-full h-full ${selectedElement?.id === element.id ? 'ring-2 ring-blue-500 ring-offset-2 border border-blue-300 border-dashed' : ''}`}>
              <img
                src={element.dataUrl}
                alt={element.type}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Resize Handles (Only for selected) */}
            {selectedElement?.id === element.id && (
              <>
                {/* NW */}
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md z-30" style={{ pointerEvents: 'auto' }} />
                {/* NE */}
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md z-30" style={{ pointerEvents: 'auto' }} />
                {/* SW */}
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md z-30" style={{ pointerEvents: 'auto' }} />
                {/* SE */}
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md z-30" style={{ pointerEvents: 'auto' }} />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-xs text-center text-gray-500 font-medium">
        {tool === 'move' && "Click an element to select it • Drag blue corners to resize • Drag the element to move"}
        {tool !== 'move' && `Click on page to place ${tool} • Switch to 'Move' tool to resize`}
      </div>
    </div>
  );
};

export default PDFViewer;
