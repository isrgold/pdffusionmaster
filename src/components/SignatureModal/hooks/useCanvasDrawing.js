// hooks/useCanvasDrawing.js
import { useState, useCallback } from 'react';

export const useCanvasDrawing = (signatureColor) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState([]);
    const [lastPoint, setLastPoint] = useState(null);
    const [lastVelocity, setLastVelocity] = useState(0);

    const distance = (point1, point2) => {
        return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    };

    const getLineWidth = useCallback((velocity) => {
        const minWidth = 0.5;
        const maxWidth = 3;
        const velocityFilterWeight = 0.7;
        
        const filteredVelocity = velocityFilterWeight * velocity + (1 - velocityFilterWeight) * lastVelocity;
        setLastVelocity(filteredVelocity);
        
        const normalizedVelocity = Math.min(filteredVelocity / 10, 1);
        return Math.max(maxWidth - (maxWidth - minWidth) * normalizedVelocity, minWidth);
    }, [lastVelocity]);

    const drawQuadraticCurve = useCallback((ctx, points) => {
        if (points.length < 3) return;

        ctx.strokeStyle = signatureColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < points.length - 1; i++) {
            const prevPoint = points[i - 1];
            const currentPoint = points[i];
            const nextPoint = points[i + 1];

            const controlPoint = {
                x: (currentPoint.x + nextPoint.x) / 2,
                y: (currentPoint.y + nextPoint.y) / 2
            };

            ctx.lineWidth = currentPoint.width || 2;
            ctx.beginPath();
            
            if (i === 1) {
                ctx.moveTo(prevPoint.x, prevPoint.y);
            } else {
                const prevControlPoint = {
                    x: (prevPoint.x + currentPoint.x) / 2,
                    y: (prevPoint.y + currentPoint.y) / 2
                };
                ctx.moveTo(prevControlPoint.x, prevControlPoint.y);
            }
            
            ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, controlPoint.x, controlPoint.y);
            ctx.stroke();
        }

        if (points.length >= 2) {
            const secondLast = points[points.length - 2];
            const last = points[points.length - 1];
            
            ctx.lineWidth = last.width || 2;
            ctx.beginPath();
            
            if (points.length === 2) {
                ctx.moveTo(secondLast.x, secondLast.y);
                ctx.lineTo(last.x, last.y);
            } else {
                const controlPoint = {
                    x: (secondLast.x + last.x) / 2,
                    y: (secondLast.y + last.y) / 2
                };
                ctx.moveTo(controlPoint.x, controlPoint.y);
                ctx.lineTo(last.x, last.y);
            }
            ctx.stroke();
        }
    }, [signatureColor]);

    return {
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
    };
};