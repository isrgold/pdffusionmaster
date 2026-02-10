// hooks/useCanvasDrawing.js
import { useState, useCallback } from 'react';

export const useCanvasDrawing = (signatureColor, width) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState([]);
    const [lastPoint, setLastPoint] = useState(null);
    const [lastVelocity, setLastVelocity] = useState(0);

    const distance = (point1, point2) => {
        return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    };

    const getLineWidth = useCallback((velocity, pressure) => {
        const minWidth = width * 0.5;
        const maxWidth = width * 2.5;

        // If pressure is available and valid (not default 0.5 for mouse sometimes), use it
        if (pressure !== undefined && pressure !== 0.5 && pressure > 0) {
            return Math.max(minWidth, Math.min(maxWidth, width * pressure * 2));
        }

        // Fallback to velocity-based width for mouse
        const velocityFilterWeight = 0.7;
        const filteredVelocity = velocityFilterWeight * velocity + (1 - velocityFilterWeight) * lastVelocity;
        setLastVelocity(filteredVelocity);

        const normalizedVelocity = Math.min(filteredVelocity / 5, 1); // Reduced divisor for more sensitivity
        // Slower = thicker, Faster = thinner
        return Math.max(maxWidth - (maxWidth - minWidth) * normalizedVelocity, minWidth);
    }, [lastVelocity, width]);

    const drawQuadraticCurve = useCallback((ctx, points) => {
        if (points.length < 2) return;

        ctx.strokeStyle = signatureColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Helper to draw a segment
        const drawSegment = (p0, p1, p2) => {
            ctx.beginPath();
            ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
            ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
            ctx.lineWidth = p1.width;
            ctx.stroke();
        };

        if (points.length === 2) {
            ctx.beginPath();
            ctx.lineWidth = points[0].width;
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[1].x, points[1].y);
            ctx.stroke();
            return;
        }

        // Draw segments
        ctx.beginPath();
        // Move to start
        ctx.moveTo(points[0].x, points[0].y);

        // We need to handle the first segment specifically if we use the mid-point logic
        // But simply: consistency with signatureUtils is key.

        for (let i = 1; i < points.length - 1; i++) {
            const p0 = points[i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];

            ctx.beginPath();
            if (i === 1) {
                ctx.moveTo(p0.x, p0.y);
            } else {
                ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
            }

            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
            ctx.lineWidth = p1.width;
            ctx.stroke();
        }

        // Last segment
        const secondLast = points[points.length - 2];
        const last = points[points.length - 1];

        ctx.beginPath();
        ctx.moveTo((secondLast.x + last.x) / 2, (secondLast.y + last.y) / 2);
        ctx.lineTo(last.x, last.y);
        ctx.lineWidth = last.width;
        ctx.stroke();

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