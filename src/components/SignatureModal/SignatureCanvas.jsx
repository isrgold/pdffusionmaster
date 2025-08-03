import React, { useEffect, useState } from 'react';
import { useCanvasDrawing } from './hooks/useCanvasDrawing';
import { useTextElements } from './hooks/useTextElements';
import { useCanvasRenderer } from './hooks/useCanvasRenderer';
import { useTouchEvents } from './hooks/useTouchEvents';
import { getMousePos, getTextElementAt } from './signatureUtils';

const CANVAS_CONFIG = {
    width: 700,
    height: 280
};

const SignatureCanvas = ({
    mode,
    canvasRef,
    signaturePaths,
    setSignaturePaths,
    textElements,
    setTextElements,
    signatureColor,
    fontSize,
    strokeWidth,
}) => {
    const [activeTextElement, setActiveTextElement] = useState(null);
    
    const {
        isDrawing,
        setIsDrawing,
        currentPath,
        setCurrentPath,
        lastPoint,
        setLastPoint,
        lastVelocity,
        setLastVelocity,
        distance,
        getLineWidth,
        drawQuadraticCurve
    } = useCanvasDrawing(signatureColor, strokeWidth);

    const {
        draggedElement,
        setDraggedElement,
        dragOffset,
        setDragOffset
    } = useTextElements(activeTextElement, setActiveTextElement, setTextElements);

    const redrawCanvas = useCanvasRenderer(
        canvasRef,
        signaturePaths,
        textElements,
        signatureColor,
        draggedElement,
        activeTextElement,
        currentPath,
        drawQuadraticCurve
    );

    const handleMouseDown = (e) => {
        e.preventDefault();
        const pos = getMousePos(e, canvasRef);

        if (mode === 'text') {
            const textEl = getTextElementAt(pos.x, pos.y, textElements, canvasRef);
            if (textEl) {
                setDraggedElement(textEl);
                setDragOffset({ x: pos.x - textEl.x, y: pos.y - textEl.y });
                setActiveTextElement(null);
            } else {
                const newText = {
                    id: Date.now(),
                    text: '',
                    x: pos.x,
                    y: pos.y,
                    fontSize,
                    color: signatureColor
                };
                setTextElements(prev => [...prev, newText]);
                setActiveTextElement(newText);
                setDraggedElement(null);
            }
        } else if (mode === 'draw') {
            setActiveTextElement(null);
            setIsDrawing(true);
            setLastPoint(pos);
            setLastVelocity(0);
            
            const pointWithWidth = {
                ...pos,
                width: 2,
                timestamp: Date.now()
            };
            
            setCurrentPath([pointWithWidth]);
        }
    };

    const handleMouseMove = (e) => {
        e.preventDefault();
        const pos = getMousePos(e, canvasRef);

        if (draggedElement) {
            const newX = pos.x - dragOffset.x;
            const newY = pos.y - dragOffset.y;
            
            setTextElements(prev =>
                prev.map(el =>
                    el.id === draggedElement.id
                        ? { ...el, x: newX, y: newY }
                        : el
                )
            );
            setDraggedElement(prev =>
                prev ? { ...prev, x: newX, y: newY } : null
            );
        } else if (isDrawing && mode === 'draw' && lastPoint) {
            const currentTime = Date.now();
            const timeDelta = currentTime - (lastPoint.timestamp || currentTime);
            const dist = distance(lastPoint, pos);
            
            const velocity = timeDelta > 0 ? dist / Math.max(timeDelta, 1) : 0;
            const lineWidth = getLineWidth(velocity);

            const pointWithWidth = {
                ...pos,
                width: lineWidth,
                timestamp: currentTime
            };

            setCurrentPath(prev => [...prev, pointWithWidth]);
            setLastPoint(pointWithWidth);
        }
    };

    const handleMouseUp = (e) => {
        e.preventDefault();
        
        if (isDrawing && currentPath.length > 0) {
            setSignaturePaths(prev => [...prev, currentPath]);
            setCurrentPath([]);
        }
        
        setIsDrawing(false);
        setDraggedElement(null);
        setLastPoint(null);
        setLastVelocity(0);
    };

    const {
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd
    } = useTouchEvents(handleMouseDown, handleMouseMove, handleMouseUp);

    useEffect(() => {
        redrawCanvas();
    }, [redrawCanvas]);

    return (
        <div className="relative">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-blue-300 p-4 shadow-inner">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_CONFIG.width}
                    height={CANVAS_CONFIG.height}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={`w-full bg-white rounded-lg border-2 border-gray-200 shadow-sm ${
                        mode === 'draw' ? 'cursor-crosshair' : 'cursor-pointer'
                    } hover:border-blue-400 transition-colors duration-200`}
                    style={{ touchAction: 'none' }}
                />
                <div className="flex items-center justify-center mt-3">
                    <p className="text-sm text-gray-600 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                        {mode === 'draw'
                            ? '✏️ Draw your signature above • Pressure-sensitive strokes'
                            : '📝 Click to add text • Drag to move existing text'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignatureCanvas;