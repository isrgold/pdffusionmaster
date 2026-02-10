// components/SignatureModal/utils/signatureUtils.js

// Draw a smooth quadratic curve between points
const drawQuadraticCurve = (ctx, points, color) => {
    if (points.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (points.length === 2) {
        ctx.beginPath();
        ctx.lineWidth = points[0].width;
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.stroke();
        return;
    }

    // Loop through points and draw quadratic curves
    // To make it smoother with variable width, we might need to draw small segments
    // But for performance, we'll rely on the browser's stroke with the starting width of the segment
    // A better approach for variable width is to fill a polygon, but that's complex.
    // We will stick to stroking but average the widths.

    ctx.beginPath();
    // Move to the first point
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        const midPoint = {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        };

        // We set the line width to the current point's width
        // Note: Canvas stroke doesn't interpolate width along a single path.
        // To strictly follow the "pressure" look, we should draw segments.
        // However, drawing many small paths is expensive.
        // Let's try drawing each quadratic curve segment as a separate path to vary width.
    }

    // Actually, let's redraw using the component approach:
    // We need to iterate and stroke each segment individually to change lineWidth

    for (let i = 1; i < points.length - 1; i++) {
        ctx.beginPath();

        const p0 = points[i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];

        // Start from the previous midpoint
        if (i === 1) {
            ctx.moveTo(p0.x, p0.y);
        } else {
            ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
        }

        const midPoint = {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        };

        ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);

        // Use average width for this segment
        ctx.lineWidth = p1.width;
        ctx.stroke();
    }

    // Draw last segment
    const secondLast = points[points.length - 2];
    const last = points[points.length - 1];

    ctx.beginPath();
    ctx.moveTo((secondLast.x + last.x) / 2, (secondLast.y + last.y) / 2);
    ctx.lineTo(last.x, last.y);
    ctx.lineWidth = last.width;
    ctx.stroke();
};

export const createSignaturePNG = (signaturePaths, textElements, color, backgroundImage) => {
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

    // Draw background image if exists
    if (backgroundImage) {
        const imgAspectRatio = backgroundImage.width / backgroundImage.height;
        // Determine how it was rendered on canvas to approximate scale, 
        // OR just draw it to fit bounds. 
        // For simplicity in export, we scale it to fit the bounds we calculated + padding
        ctx.drawImage(backgroundImage, 0, 0, width, height);
    }

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