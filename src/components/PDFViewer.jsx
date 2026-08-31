// components/PDFViewer.jsx
import React, { useRef, useEffect, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';

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
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  const [isVisible, setIsVisible] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [interactionState, setInteractionState] = useState(null);

  // Calculate target page dimensions
  const rotation = page.rotation || 0;
  const isRotated90or270 = rotation === 90 || rotation === 270;

  const rawWidth = page.originalWidth || 595.28;
  const rawHeight = page.originalHeight || 841.89;

  const scaledWidth = (isRotated90or270 ? rawHeight : rawWidth) * 1.5;
  const scaledHeight = (isRotated90or270 ? rawWidth : rawHeight) * 1.5;
  const aspectRatio = scaledWidth / scaledHeight;

  // 1. Intersection Observer for Virtualization
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '300px 0px 300px 0px' // Render 300px ahead/behind viewport
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 2. Render or Cleanup Canvas on Visibility / Page / Rotation changes
  useEffect(() => {
    if (isVisible && page && page.pdfPage) {
      renderPage();
    } else {
      cleanupCanvas();
    }

    return () => {
      cleanupCanvas();
    };
  }, [isVisible, page, rotation]);

  const cleanupCanvas = () => {
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (e) {
        // Ignore cancel errors
      }
      renderTaskRef.current = null;
    }
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      // Setting width/height to 0 immediately releases GPU/RAM pixel buffers
      canvas.width = 0;
      canvas.height = 0;
    }
    setIsRendering(false);
  };

  const renderPage = async () => {
    if (!page || !page.pdfPage || !canvasRef.current || !containerRef.current) return;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (e) {}
    }

    setIsRendering(true);
    const canvas = canvasRef.current;
    // Opaque 2d context enables OS subpixel ClearType font anti-aliasing
    const ctx = canvas.getContext('2d', { alpha: false });
    const pdfPage = page.pdfPage;

    // Get exact CSS pixel width of the display container on user screen
    const containerWidth = containerRef.current.clientWidth || scaledWidth;
    const dpr = window.devicePixelRatio || 1;

    // Calculate exact viewport scale for 1-to-1 hardware pixel alignment
    const basePageWidth = isRotated90or270 ? rawHeight : rawWidth;
    const renderScale = (containerWidth / basePageWidth) * dpr;

    const viewport = pdfPage.getViewport({ scale: renderScale, rotation: rotation });

    // Match canvas pixel buffer to exact physical screen pixels (1-to-1 mapping)
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);

    // Set explicit CSS dimensions matching container to avoid GPU resampling blur
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${Math.round(containerWidth / aspectRatio)}px`;

    // Pre-fill white background to activate ClearType subpixel text smoothing
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };

    try {
      const renderTask = pdfPage.render(renderContext);
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      renderTaskRef.current = null;
      setIsRendering(false);
    } catch (error) {
      if (error.name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', error);
      }
      setIsRendering(false);
    }
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (scaledWidth / rect.width),
        y: (e.clientY - rect.top) * (scaledHeight / rect.height)
      };
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const getElementAt = (pos) => {
    return elements
      .slice()
      .reverse()
      .find(el => {
        return pos.x >= el.x && pos.x <= el.x + el.width &&
          pos.y >= el.y && pos.y <= el.y + el.height;
      });
  };

  const getResizeHandleAt = (pos, element) => {
    if (!element) return null;

    const canvas = canvasRef.current;
    const rect = canvas ? canvas.getBoundingClientRect() : containerRef.current.getBoundingClientRect();

    const scaleX = scaledWidth / rect.width;
    const scaleY = scaledHeight / rect.height;

    const screenHandleSize = 24;
    const handleWidth = screenHandleSize * scaleX;
    const handleHeight = screenHandleSize * scaleY;

    let elX = element.x;
    let elY = element.y;
    let elW = element.width;
    let elH = element.height;

    const handles = {
      nw: { x: elX, y: elY },
      ne: { x: elX + elW, y: elY },
      sw: { x: elX, y: elY + elH },
      se: { x: elX + elW, y: elY + elH },
    };

    for (const handle in handles) {
      const h = handles[handle];
      if (pos.x >= h.x - handleWidth / 2 && pos.x <= h.x + handleWidth / 2 &&
        pos.y >= h.y - handleHeight / 2 && pos.y <= h.y + handleHeight / 2) {
        return handle;
      }
    }
    return null;
  };

  const handleCanvasMouseDown = (e) => {
    if (!isVisible) return;
    const pos = getMousePos(e);

    if (tool === 'text' || tool === 'signature') {
      onToolClick(pos);
    } else if (tool === 'move') {
      const clickedElement = getElementAt(pos);

      if (clickedElement) {
        onElementSelect(clickedElement, pos);
        const handle = getResizeHandleAt(pos, clickedElement);

        setInteractionState({
          type: handle ? 'resize' : 'move',
          handle: handle,
          startX: pos.x,
          startY: pos.y,
          initialEl: { ...clickedElement },
          deltaX: 0,
          deltaY: 0
        });
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isVisible) return;
    const pos = getMousePos(e);

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

    if (tool === 'move') {
      if (selectedElement) {
        const handle = getResizeHandleAt(pos, selectedElement);
        if (handle && canvasRef.current) {
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

      if (getElementAt(pos)) {
        if (canvasRef.current) canvasRef.current.style.cursor = 'move';
      } else {
        if (canvasRef.current) canvasRef.current.style.cursor = 'default';
      }
    }
  };

  const handleMouseUp = () => {
    if (interactionState) {
      const { type, initialEl, deltaX, deltaY, handle } = interactionState;

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

      onElementResize(initialEl.id, { x: newX, y: newY, width: newWidth, height: newHeight });
      setInteractionState(null);
    }
  };

  const getCursorStyle = () => {
    switch (tool) {
      case 'move': return 'default';
      case 'text': return 'text';
      case 'signature': return 'crosshair';
      default: return 'default';
    }
  };

  const getDisplayProps = (element) => {
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
    <div className="bg-white rounded-lg shadow-lg p-4" ref={containerRef} dir="ltr" style={{ direction: 'ltr' }}>
      {/* Canvas Container */}
      <div
        className="border-2 border-gray-200 rounded-lg overflow-hidden relative flex items-center justify-center bg-gray-50/80 transition-colors"
        dir="ltr"
        style={{
          direction: 'ltr',
          width: `${scaledWidth}px`,
          maxWidth: '100%',
          aspectRatio: `${aspectRatio}`
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          dir="ltr"
          className={`block relative w-full h-full object-contain ${!isVisible ? 'hidden' : ''}`}
          style={{ cursor: getCursorStyle(), direction: 'ltr' }}
        />

        {/* Unrendered Skeleton / Placeholder */}
        {!isVisible && (
          <div className="flex flex-col items-center justify-center text-gray-400 select-none animate-pulse" dir="ltr">
            <FileText size={48} strokeWidth={1.5} className="text-gray-300 mb-2" />
            <span className="text-sm font-semibold text-gray-600">Page {page.pageIndex + 1}</span>
            <span className="text-xs text-gray-400 mt-1">Scroll to view</span>
          </div>
        )}

        {/* Render Spinner overlay */}
        {isVisible && isRendering && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10" dir="ltr">
            <Loader2 size={32} className="text-blue-600 animate-spin" />
          </div>
        )}

        {/* Elements Overlay - Enforce LTR positioning */}
        {isVisible && elements.map(baseElement => {
          const element = getDisplayProps(baseElement);
          const isSelected = selectedElement?.id === element.id;

          return (
            <div
              key={element.id}
              className={`absolute select-none group ${isSelected ? 'z-20' : 'z-10'}`}
              dir="ltr"
              style={{
                direction: 'ltr',
                left: `${(element.x / scaledWidth) * 100}%`,
                top: `${(element.y / scaledHeight) * 100}%`,
                width: `${(element.width / scaledWidth) * 100}%`,
                height: `${(element.height / scaledHeight) * 100}%`,
                pointerEvents: 'none'
              }}
            >
              {/* Element Container */}
              <div className={`w-full h-full relative ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 border border-blue-300 border-dashed' : ''}`}>

                {element.type === 'text' ? (() => {
                  const isHebrew = /[\u0590-\u05FF]/.test(element.text || '');
                  return (
                    <div
                      style={{
                        width: `${element.baseWidth}px`,
                        height: `${element.baseHeight}px`,
                        transform: `scale(${element.width / element.baseWidth}, ${element.height / element.baseHeight})`,
                        transformOrigin: 'top left',
                        fontSize: `${element.baseFontSize}px`,
                        fontFamily: element.fontFamilyCss || 'Heebo, Rubik, Arial, sans-serif',
                        lineHeight: '1.2',
                        color: element.color,
                        padding: '10px',
                        whiteSpace: 'pre-wrap',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: isHebrew ? 'flex-end' : 'flex-start',
                        direction: isHebrew ? 'rtl' : 'ltr',
                        textAlign: isHebrew ? 'right' : 'left',
                        unicodeBidi: 'plaintext'
                      }}
                      className="leading-tight font-sans"
                    >
                      {element.text}
                    </div>
                  );
                })() : (
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
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md z-30 cursor-nw-resize" style={{ pointerEvents: 'auto' }} />
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md z-30 cursor-ne-resize" style={{ pointerEvents: 'auto' }} />
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md z-30 cursor-sw-resize" style={{ pointerEvents: 'auto' }} />
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md z-30 cursor-se-resize" style={{ pointerEvents: 'auto' }} />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-xs text-center text-gray-500 font-medium" dir="rtl">
        {tool === 'move' && "לחץ על רכיב כדי לבחור אותו • גרירת פינות כחולות לשינוי גודל • גרירת הרכיב להזזה"}
        {tool !== 'move' && `לחץ על העמוד למיקום ${tool === 'text' ? 'טקסט' : 'חתימה'} • עבור לכלי 'הזזה' לשינוי גודל`}
      </div>
    </div>
  );
};

export default PDFViewer;
