import React, { useEffect, useState } from 'react';

const SignatureCanvas = ({
    mode,
    canvasRef,
    signaturePaths,
    setSignaturePaths,
    textElements,
    setTextElements,
    signatureColor,
    fontSize
}) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [draggedElement, setDraggedElement] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [activeTextElement, setActiveTextElement] = useState(null);

    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const getTextElementAt = (x, y) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        for (let i = textElements.length - 1; i >= 0; i--) {
            const el = textElements[i];
            ctx.font = `${el.fontSize}px Arial`;
            const metrics = ctx.measureText(el.text);
            if (
                x >= el.x && x <= el.x + metrics.width &&
                y >= el.y - el.fontSize && y <= el.y
            ) return el;
        }

        return null;
    };

    const redrawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw signature paths
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

        // Draw text elements
        textElements.forEach(el => {
            ctx.fillStyle = el.color;
            ctx.font = `${el.fontSize}px Arial`;
            ctx.fillText(el.text, el.x, el.y);

            const isActive = (draggedElement && draggedElement.id === el.id) || (activeTextElement && activeTextElement.id === el.id);
            if (isActive) {
                const metrics = ctx.measureText(el.text);
                ctx.strokeStyle = '#007bff';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(
                    el.x - 2,
                    el.y - el.fontSize - 2,
                    metrics.width + 4,
                    el.fontSize + 4
                );
                ctx.setLineDash([]);

                if (activeTextElement && activeTextElement.id === el.id) {
                    const cursorX = el.x + metrics.width;
                    ctx.strokeStyle = '#000';
                    ctx.beginPath();
                    ctx.moveTo(cursorX, el.y - el.fontSize);
                    ctx.lineTo(cursorX, el.y);
                    ctx.stroke();
                }
            }
        });
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        const pos = getMousePos(e);

        if (mode === 'text') {
            const textEl = getTextElementAt(pos.x, pos.y);
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
            setSignaturePaths(prev => [...prev, [pos]]);
        }
    };

    const handleMouseMove = (e) => {
        e.preventDefault();
        const pos = getMousePos(e);

        if (draggedElement) {
            setTextElements(prev =>
                prev.map(el =>
                    el.id === draggedElement.id
                        ? { ...el, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
                        : el
                )
            );
            setDraggedElement(prev =>
                prev ? { ...prev, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y } : null
            );
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

    const handleKeyDown = (e) => {
        if (!activeTextElement) return;

        if (e.key === 'Backspace') {
            e.preventDefault();
            const updatedText = activeTextElement.text.slice(0, -1);
            if (updatedText === '') {
                setTextElements(prev => prev.filter(el => el.id !== activeTextElement.id));
                setActiveTextElement(null);
            } else {
                setTextElements(prev =>
                    prev.map(el =>
                        el.id === activeTextElement.id
                            ? { ...el, text: updatedText }
                            : el
                    )
                );
                setActiveTextElement(prev => ({ ...prev, text: updatedText }));
            }
        } else if (e.key === 'Enter' || e.key === 'Escape') {
            e.preventDefault();
            setActiveTextElement(null);
        } else if (e.key.length === 1) {
            e.preventDefault();
            const updatedText = activeTextElement.text + e.key;
            setTextElements(prev =>
                prev.map(el =>
                    el.id === activeTextElement.id
                        ? { ...el, text: updatedText }
                        : el
                )
            );
            setActiveTextElement(prev => ({ ...prev, text: updatedText }));
        }
    };

    useEffect(() => {
        if (canvasRef.current && (signaturePaths || textElements)) {
            redrawCanvas();
        }
    }, [signaturePaths, textElements, signatureColor, draggedElement, activeTextElement]);

    useEffect(() => {
        if (activeTextElement) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [activeTextElement]);

    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-2">
            <canvas
                ref={canvasRef}
                width={700}
                height={250}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`w-full bg-white rounded border ${mode === 'draw' ? 'cursor-crosshair' : 'cursor-pointer'}`}
                style={{ touchAction: 'none' }}
            />
            <p className="text-sm text-gray-600 text-center mt-2">
                {mode === 'draw'
                    ? 'Draw your signature above'
                    : 'Enter text and click on the canvas to add it. Click and drag existing text to move it.'}
            </p>
        </div>
    );
};

export default SignatureCanvas;
