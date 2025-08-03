import { useCallback } from 'react';

export const useCanvasRenderer = (canvasRef, signaturePaths, textElements, signatureColor, draggedElement, activeTextElement, currentPath, drawQuadraticCurve) => {
    return useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Draw text elements
        textElements.forEach(el => {
            ctx.fillStyle = el.color;
            ctx.font = `${el.fontSize}px Arial`;
            ctx.fillText(el.text, el.x, el.y);

            const isActive = (draggedElement && draggedElement.id === el.id) || (activeTextElement && activeTextElement.id === el.id);
            if (isActive) {
                const metrics = ctx.measureText(el.text);
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 4]);
                ctx.strokeRect(
                    el.x - 4,
                    el.y - el.fontSize - 4,
                    metrics.width + 8,
                    el.fontSize + 8
                );
                ctx.setLineDash([]);

                if (activeTextElement && activeTextElement.id === el.id) {
                    const cursorX = el.x + metrics.width;
                    ctx.strokeStyle = '#3b82f6';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(cursorX, el.y - el.fontSize);
                    ctx.lineTo(cursorX, el.y);
                    ctx.stroke();
                }
            }
        });

        // Draw all completed signature paths with smooth curves
        signaturePaths.forEach(path => {
            if (path.length > 1) {
                drawQuadraticCurve(ctx, path);
            } else if (path.length === 1) {
                ctx.fillStyle = signatureColor;
                ctx.beginPath();
                ctx.arc(path[0].x, path[0].y, 1, 0, 2 * Math.PI);
                ctx.fill();
            }
        });

        // Draw current path being drawn
        if (currentPath.length > 0) {
            if (currentPath.length === 1) {
                ctx.fillStyle = signatureColor;
                ctx.beginPath();
                ctx.arc(currentPath[0].x, currentPath[0].y, 1, 0, 2 * Math.PI);
                ctx.fill();
            } else {
                drawQuadraticCurve(ctx, currentPath);
            }
        }
    }, [signaturePaths, textElements, signatureColor, draggedElement, activeTextElement, currentPath, drawQuadraticCurve, canvasRef]);
};