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

  // Interaction state: { type: 'move'|'resize', handle: string, startX, startY, initialEl: {...} }
  const [interactionState, setInteractionState] = React.useState(null);

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

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate scale factors (canvas pixels per screen pixel)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Visual handle size is 16px (w-4 h-4)
    // We use a slightly larger hit area (24px) for better usability
    const screenHandleSize = 24;

    // Convert screen size to canvas units
    const handleWidth = screenHandleSize * scaleX;
    const handleHeight = screenHandleSize * scaleY;

    // Use current dimensions from interactions state if available, else element
    let elX = element.x;
    let elY = element.y;
    let elW = element.width;
    let elH = element.height;

    if (interactionState && interactionState.initialEl.id === element.id) {
      // Actually, for getResizeHandleAt, we usually check *before* interaction starts, 
      // so we use the element's committed state. 
      // During interaction, we don't strictly need to hover handles accurately until release.
    }

    const handles = {
      nw: { x: elX, y: elY },
      ne: { x: elX + elW, y: elY },
      sw: { x: elX, y: elY + elH },
      se: { x: elX + elW, y: elY + elH },
    };

    for (const handle in handles) {
      const h = handles[handle];
      // Check if pos is within handle bounds centered at h.x, h.y
      if (pos.x >= h.x - handleWidth / 2 && pos.x <= h.x + handleWidth / 2 &&
        pos.y >= h.y - handleHeight / 2 && pos.y <= h.y + handleHeight / 2) {
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
        // Select the element first (calls parent to update selectedElement)
        onElementSelect(clickedElement, pos);

        const handle = getResizeHandleAt(pos, clickedElement);

        // Initialize local interaction state
        setInteractionState({
          type: handle ? 'resize' : 'move',
          handle: handle,
          startX: pos.x,
          startY: pos.y,
          initialEl: { ...clickedElement },
          // Current deltas
          deltaX: 0,
          deltaY: 0
        });
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    const pos = getMousePos(e);

    // 1. Handle Active Interaction (Local State Update)
    if (interactionState) {
      const deltaX = pos.x - interactionState.startX;
      const deltaY = pos.y - interactionState.startY;

      setInteractionState(prev => ({
        ...prev,
        deltaX,
        deltaY
      }));
      return;
    }

    // 2. Hover / Cursor Logic (No active interaction)
    if (tool === 'move') {
      // Check for handles on SELECTED element
      if (selectedElement) {
        const handle = getResizeHandleAt(pos, selectedElement);
        if (handle) {
          const cursorMap = {
            nw: 'nw-resize',
            ne: 'ne-resize',
            sw: 'sw-resize',
            se: 'se-resize'
          };
          canvasRef.current.style.cursor = cursorMap[handle];
          return;
        }
      }

      // Check for hover over any element
      if (getElementAt(pos)) {
        canvasRef.current.style.cursor = 'move';
      } else {
        canvasRef.current.style.cursor = 'default';
      }
    }
  };

  const handleMouseUp = () => {
    if (interactionState) {
      const { type, initialEl, deltaX, deltaY, handle } = interactionState;

      // Calculate Final Bounds
      let newX = initialEl.x;
      let newY = initialEl.y;
      let newWidth = initialEl.width;
      let newHeight = initialEl.height;

      if (type === 'move') {
        newX += deltaX;
        newY += deltaY;
      } else if (type === 'resize') {
        switch (handle) {
          case 'se':
            newWidth = Math.max(20, initialEl.width + deltaX);
            newHeight = Math.max(20, initialEl.height + deltaY);
            break;
          case 'sw':
            newWidth = Math.max(20, initialEl.width - deltaX);
            newX = initialEl.x + (initialEl.width - newWidth);
            newHeight = Math.max(20, initialEl.height + deltaY);
            break;
          case 'ne':
            newWidth = Math.max(20, initialEl.width + deltaX);
            newHeight = Math.max(20, initialEl.height - deltaY);
            newY = initialEl.y + (initialEl.height - newHeight);
            break;
          case 'nw':
            newWidth = Math.max(20, initialEl.width - deltaX);
            newX = initialEl.x + (initialEl.width - newWidth);
            newHeight = Math.max(20, initialEl.height - deltaY);
            newY = initialEl.y + (initialEl.height - newHeight);
            break;
        }
      }

      // Commit changes to parent
      // We use onElementResize for both move/resize since it accepts bounds
      onElementResize(initialEl.id, { x: newX, y: newY, width: newWidth, height: newHeight });

      setInteractionState(null);
    }

    // onElementRelease(); // Optional, if parent does cleanup
  };

  const getCursorStyle = () => {
    switch (tool) {
      case 'move': return 'default'; // managed dynamically in mouseMove
      case 'text': return 'text';
      case 'signature': return 'crosshair';
      default: return 'default';
    }
  };

  // Helper to get current display props for an element
  const getDisplayProps = (element) => {
    // If this element is currently being interacted with, calculate its temporary state
    if (interactionState && interactionState.initialEl.id === element.id) {
      const { type, initialEl, deltaX, deltaY, handle } = interactionState;

      if (type === 'move') {
        return {
          ...initialEl,
          x: initialEl.x + deltaX,
          y: initialEl.y + deltaY
        };
      } else if (type === 'resize') {
        let newX = initialEl.x;
        let newY = initialEl.y;
        let newWidth = initialEl.width;
        let newHeight = initialEl.height;

        switch (handle) {
          case 'se':
            newWidth = Math.max(20, initialEl.width + deltaX);
            newHeight = Math.max(20, initialEl.height + deltaY);
            break;
          case 'sw':
            newWidth = Math.max(20, initialEl.width - deltaX);
            newX = initialEl.x + (initialEl.width - newWidth);
            newHeight = Math.max(20, initialEl.height + deltaY);
            break;
          case 'ne':
            newWidth = Math.max(20, initialEl.width + deltaX);
            newHeight = Math.max(20, initialEl.height - deltaY);
            newY = initialEl.y + (initialEl.height - newHeight);
            break;
          case 'nw':
            newWidth = Math.max(20, initialEl.width - deltaX);
            newX = initialEl.x + (initialEl.width - newWidth);
            newHeight = Math.max(20, initialEl.height - deltaY);
            newY = initialEl.y + (initialEl.height - newHeight);
            break;
        }
        return { ...initialEl, x: newX, y: newY, width: newWidth, height: newHeight };
      }
    }
    return element;
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
        {elements.map(baseElement => {
          const element = getDisplayProps(baseElement);
          const isSelected = selectedElement?.id === element.id;

          return (
            <div
              key={element.id}
              className={`absolute select-none group ${isSelected ? 'z-20' : 'z-10'}`}
              style={{
                left: `${(element.x / canvasRef.current?.width) * 100}%`,
                top: `${(element.y / canvasRef.current?.height) * 100}%`,
                width: `${(element.width / canvasRef.current?.width) * 100}%`,
                height: `${(element.height / canvasRef.current?.height) * 100}%`,
                pointerEvents: 'none' // Allow click-through to parent for selection logic, handled via overlay/parent
              }}
            >
              {/* Element Container */}
              <div className={`w-full h-full relative ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 border border-blue-300 border-dashed' : ''}`}>

                {element.type === 'text' ? (
                  <div
                    style={{
                      // Structure: we render the text at its *original* captured size (baseWidth/baseHeight)
                      // and then simple scale it to fit the current element bounds.
                      // This ensures it behaves exactly like an image/vector object during resize.
                      width: `${element.baseWidth}px`,
                      height: `${element.baseHeight}px`,
                      transform: `scale(${element.width / element.baseWidth}, ${element.height / element.baseHeight})`,
                      transformOrigin: 'top left',
                      fontSize: `${element.baseFontSize}px`,
                      fontFamily: 'Inter, system-ui, sans-serif',
                      lineHeight: '1.2',
                      color: element.color,
                      padding: '10px',
                      whiteSpace: 'pre-wrap',
                      display: 'flex',
                      alignItems: 'flex-start', // Top aligned usually
                      justifyContent: 'flex-start',
                    }}
                    className="leading-tight font-sans"
                  >
                    {element.text}
                  </div>
                ) : (
                  <img
                    src={element.dataUrl}
                    alt={element.type}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Resize Handles (Only for selected) */}
              {isSelected && (
                <>
                  {/* NW */}
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md z-30 cursor-nw-resize" style={{ pointerEvents: 'auto' }} />
                  {/* NE */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md z-30 cursor-ne-resize" style={{ pointerEvents: 'auto' }} />
                  {/* SW */}
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md z-30 cursor-sw-resize" style={{ pointerEvents: 'auto' }} />
                  {/* SE */}
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md z-30 cursor-se-resize" style={{ pointerEvents: 'auto' }} />
                </>
              )}
            </div>
          )
        })}
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
