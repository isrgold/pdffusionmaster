// hooks/useTouchEvents.js
export const useTouchEvents = (handleMouseDown, handleMouseMove, handleMouseUp) => {
    const handleTouchStart = (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        handleMouseDown(mouseEvent);
    };

    const handleTouchMove = (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        handleMouseMove(mouseEvent);
    };

    const handleTouchEnd = (e) => {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        handleMouseUp(mouseEvent);
    };

    return {
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd
    };
};