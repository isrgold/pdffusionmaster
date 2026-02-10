import React, { useState } from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Plus, GripVertical, FileText, Layers, ChevronLeft } from 'lucide-react';

// Sortable Page Item Component
const SortablePage = ({ page, index, onDelete, onSelect, isSelected, onUpdateThumbnail }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: page.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 5 : 1, // Lower z-index for the placeholder
        opacity: isDragging ? 0.3 : 1, // Make placeholder transparent
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                relative group rounded-xl p-2 flex flex-col items-center gap-2 cursor-pointer transition-all duration-200
                ${isSelected
                    ? 'bg-blue-50 ring-2 ring-blue-500 shadow-sm'
                    : 'bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md'
                } 
            `}
            onClick={() => onSelect(index)}
        >
            <PageContent
                page={page}
                index={index}
                onDelete={onDelete}
                isOverlay={false}
                dragHandleProps={{ ...attributes, ...listeners }}
                onUpdateThumbnail={onUpdateThumbnail}
            />
        </div>
    );
};

import { renderPageThumbnail } from '../utils/pdfUtils';

// Lazy Thumbnail Component
const LazyThumbnail = ({ page, index, onUpdateThumbnail }) => {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '100px' } // Start loading 100px before it enters viewport
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    React.useEffect(() => {
        if (isVisible && !page.thumbnail && page.pdfPage) {
            renderPageThumbnail(page.pdfPage).then(thumbnail => {
                onUpdateThumbnail(page.id, thumbnail);
            });
        }
    }, [isVisible, page, onUpdateThumbnail]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center bg-gray-50"
        >
            {page.thumbnail ? (
                <img
                    src={page.thumbnail}
                    alt={`Page ${index + 1}`}
                    className="object-contain w-full h-full transition-transform duration-200"
                    style={{ transform: `rotate(${page.rotation}deg)` }}
                />
            ) : (
                <div className="flex flex-col items-center text-gray-300 animate-pulse">
                    {/* Placeholder / Loading State */}
                    <FileText size={24} />
                    <span className="text-xs mt-1 font-medium">{index + 1}</span>
                    <span className="text-[9px] text-gray-400 mt-1">Loading...</span>
                </div>
            )}
        </div>
    );
};

// Extracted Page Content for Reuse in Overlay
const PageContent = ({ page, index, onDelete, isOverlay, dragHandleProps, onUpdateThumbnail }) => (
    <>
        {/* Drag Handle - Always visible on overlay, hover on normal */}
        <div
            {...dragHandleProps}
            className={`absolute top-2 left-2 z-10 p-1 bg-white/90 backdrop-blur rounded-md shadow-sm 
            ${isOverlay ? 'opacity-100 cursor-grabbing' : 'opacity-0 group-hover:opacity-100 cursor-grab'} 
            transition-opacity`}
        >
            <GripVertical size={14} className="text-gray-400" />
        </div>

        {/* Page Preview / Thumbnail */}
        <div className={`w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border border-gray-100 relative shadow-inner flex items-center justify-center ${isOverlay ? 'shadow-2xl' : ''}`}>
            {isOverlay ? (
                // For drag overlay, plain render or fast placeholder if no thumbnail yet
                page.thumbnail ? (
                    <img
                        src={page.thumbnail}
                        alt={`Page ${index + 1}`}
                        className="object-contain w-full h-full"
                        style={{ transform: `rotate(${page.rotation}deg)` }}
                    />
                ) : (
                    <div className="flex flex-col items-center text-gray-300">
                        <FileText size={24} />
                        <span className="text-xs mt-1 font-medium">{index + 1}</span>
                    </div>
                )
            ) : (
                <LazyThumbnail page={page} index={index} onUpdateThumbnail={onUpdateThumbnail} />
            )}

            {/* Page Number Badge */}
            <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-[2px] text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                {index + 1}
            </div>
        </div>

        {/* Filename Label */}
        <div className="w-full px-1">
            <p className="text-[10px] text-center text-gray-500 truncate select-none" title={page.fileName}>
                {page.fileName || `Page ${index + 1}`}
            </p>
        </div>

        {/* Hover Actions Overlay (Hidden on DragOverlay) */}
        {!isOverlay && (
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(page.id); }}
                    className="p-1.5 bg-white/90 backdrop-blur rounded-md shadow-sm text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-100/50"
                    title="Delete"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        )}
    </>
);


const PageManager = ({ pages, setPages, selectedPageIndex, onSelectPage, onAddFiles, onClose, onUpdateThumbnail }) => {
    const [activeId, setActiveId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require movement of 8px to start drag (prevents accidental drags on click)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setPages((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setActiveId(null);
    };

    const handleDelete = (id) => {
        if (confirm('Delete this page?')) {
            setPages(prev => prev.filter(p => p.id !== id));
        }
    };

    const activePage = activeId ? pages.find(p => p.id === activeId) : null;
    const activePageIndex = activePage ? pages.indexOf(activePage) : -1;

    return (
        <div className="bg-white/80 backdrop-blur-xl border-r border-gray-200/60 w-full md:w-80 flex flex-col h-full z-20 shadow-xl shadow-gray-200/40">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-30">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2.5 text-gray-800">
                        <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                            <Layers size={18} strokeWidth={2.5} />
                        </div>
                        <h3 className="font-bold text-sm tracking-wide text-gray-800 uppercase">Pages ({pages.length})</h3>
                    </div>

                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 bg-transparent hover:bg-gray-100 text-gray-500 rounded-lg transition-all"
                            title="Collapse Sidebar"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                </div>
                <button
                    onClick={onAddFiles}
                    className="mt-2 w-full flex items-center justify-center gap-2 bg-gray-900 border border-transparent hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-gray-900/10 active:scale-[0.98] group"
                >
                    <Plus size={16} className="text-white/70 group-hover:text-white transition-colors" />
                    <span>Add Pages</span>
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/30">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    <SortableContext
                        items={pages.map(p => p.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-2 gap-3 pb-8">
                            {pages.map((page, index) => (
                                <SortablePage
                                    key={page.id}
                                    page={page}
                                    index={index}
                                    isSelected={index === selectedPageIndex}
                                    onSelect={onSelectPage}
                                    onDelete={handleDelete}
                                    onUpdateThumbnail={onUpdateThumbnail}
                                />
                            ))}
                        </div>
                    </SortableContext>

                    <DragOverlay>
                        {activeId && activePage ? (
                            <div className="bg-white rounded-xl p-2 flex flex-col items-center gap-2 shadow-2xl ring-2 ring-blue-500 scale-105 rotate-2 cursor-grabbing">
                                <PageContent page={activePage} index={activePageIndex} isOverlay={true} />
                            </div>
                        ) : null}
                    </DragOverlay>

                </DndContext>

                {pages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                            <Layers size={24} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">No pages yet</p>
                        <p className="text-xs text-gray-500 mt-1 max-w-[150px]">Upload a PDF to see pages here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageManager;
