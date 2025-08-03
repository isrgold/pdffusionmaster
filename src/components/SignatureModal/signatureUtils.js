// components/SignatureModal/utils/signatureUtils.js

export const createSignaturePNG = (signaturePaths, textElements, color) => {
    if (signaturePaths.length === 0 && textElements.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    signaturePaths.forEach(path =>
        path.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        })
    );

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

    const padding = 10;
    const width = Math.ceil(maxX - minX) + padding * 2;
    const height = Math.ceil(maxY - minY) + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    signaturePaths.forEach(path => {
        if (path.length > 1) {
            ctx.beginPath();
            ctx.moveTo(path[0].x - minX + padding, path[0].y - minY + padding);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x - minX + padding, path[i].y - minY + padding);
            }
            ctx.stroke();
        }
    });

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
