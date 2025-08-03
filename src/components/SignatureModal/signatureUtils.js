// components/SignatureModal/utils/signatureUtils.js

// Draw a smooth quadratic curve between points
const drawQuadraticCurve = (ctx, points, color) => {
    if (points.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (points.length === 2) {
        // For two points, draw a simple line
        ctx.lineWidth = points[0].width || 2;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.stroke();
        return;
    }

    // For multiple points, use quadratic curves
    for (let i = 1; i < points.length - 1; i++) {
        const prevPoint = points[i - 1];
        const currentPoint = points[i];
        const nextPoint = points[i + 1];

        // Calculate control point (midpoint between current and next)
        const controlPoint = {
            x: (currentPoint.x + nextPoint.x) / 2,
            y: (currentPoint.y + nextPoint.y) / 2
        };

        // Set line width based on stored width
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

    // Draw the last segment
    const secondLast = points[points.length - 2];
    const last = points[points.length - 1];
    
    ctx.lineWidth = last.width || 2;
    ctx.beginPath();
    
    const controlPoint = {
        x: (secondLast.x + last.x) / 2,
        y: (secondLast.y + last.y) / 2
    };
    ctx.moveTo(controlPoint.x, controlPoint.y);
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
};

export const createSignaturePNG = (signaturePaths, textElements, color) => {
    if (signaturePaths.length === 0 && textElements.length === 0) return null;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // Calculate bounds for signature paths
    signaturePaths.forEach(path =>
        path.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        })
    );

    // Calculate bounds for text elements
    if (textElements.length > 0) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        textElements.forEach(({ x, y, text, fontSize }) => {
            tempCtx.font = `${fontSize}px Arial`;
            const width = tempCtx.measureText(text).width;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y - fontSize);
            maxX = Math.max(maxX, x + width);
            maxY = Math.max(maxY, y);
        });
    }

    if (minX === Infinity) return null;

    const padding = 20; // Increased padding for smoother curves
    const width = Math.ceil(maxX - minX) + padding * 2;
    const height = Math.ceil(maxY - minY) + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Set canvas background to transparent
    ctx.clearRect(0, 0, width, height);

    // Draw signature paths with smooth curves
    signaturePaths.forEach(path => {
        if (path.length > 1) {
            // Adjust path coordinates relative to bounds
            const adjustedPath = path.map(point => ({
                ...point,
                x: point.x - minX + padding,
                y: point.y - minY + padding
            }));
            drawQuadraticCurve(ctx, adjustedPath, color);
        } else if (path.length === 1) {
            // Draw single point as a dot
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(
                path[0].x - minX + padding, 
                path[0].y - minY + padding, 
                (path[0].width || 2) / 2, 
                0, 
                2 * Math.PI
            );
            ctx.fill();
        }
    });

    // Draw text elements
    textElements.forEach(({ text, x, y, color, fontSize }) => {
        ctx.fillStyle = color;
        ctx.font = `${fontSize}px Arial`;
        ctx.fillText(text, x - minX + padding, y - minY + padding);
    });

    return {
        dataUrl: canvas.toDataURL('image/png'),
        width,
        height
    };
};

export const loadSavedSignatures = () => {
    return Object.keys(localStorage)
        .filter(k => k.startsWith('signature_'))
        .map(k => {
            try {
                return { key: k, ...JSON.parse(localStorage.getItem(k)) };
            } catch {
                return null;
            }
        })
        .filter(Boolean);
};

export const getMousePos = (e, canvasRef) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
};

export const getTextElementAt = (x, y, textElements, canvasRef) => {
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