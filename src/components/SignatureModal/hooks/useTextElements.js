// hooks/useTextElements.js
import { useState, useEffect } from 'react';

export const useTextElements = (activeTextElement, setActiveTextElement, setTextElements) => {
    const [draggedElement, setDraggedElement] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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
        if (activeTextElement) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [activeTextElement]);

    return {
        draggedElement,
        setDraggedElement,
        dragOffset,
        setDragOffset
    };
};