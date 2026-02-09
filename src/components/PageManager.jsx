import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    horizontalListSortingStrategy,
    verticalListSortingStrategy,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Plus, GripVertical, RotateCw, FileText, Layers, ChevronLeft } from 'lucide-react';

// Sortable Page Item Component
const SortablePage = ({ page, index, onDelete, onSelect, isSelected, onRotate }) => {
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
        zIndex: isDragging ? 20 : 1,
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
                ${isDragging ? 'opacity-50 scale-95 shadow-xl' : ''}
            `}
            onClick={() => onSelect(index)}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 left-2 z-10 p-1 bg-white/90 backdrop-blur rounded-md shadow-sm opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-opacity"
                title="Drag to reorder"
            >
                <GripVertical size={14} className="text-gray-400" />
            </div>

            {/* Page Preview / Thumbnail */}
            <div className="w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border border-gray-100 relative shadow-inner flex items-center justify-center">
                {page.thumbnail ? (
                    <img
                        src={page.thumbnail}
                        alt={`Page ${index + 1}`}
                        className="object-contain w-full h-full transition-transform duration-200"
                        style={{ transform: `rotate(${page.rotation}deg)` }}
                    />
                ) : (
                    <div className="flex flex-col items-center text-gray-300">
                        <FileText size={24} />
                        <span className="text-xs mt-1 font-medium">{index + 1}</span>
                    </div>
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

            {/* Hover Actions Overlay */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                <button
                    onClick={(e) => { e.stopPropagation(); onRotate(page.id); }}
                    className="p-1.5 bg-white/90 backdrop-blur rounded-md shadow-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-100/50"
                    title="Rotate"
                >
                    <RotateCw size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(page.id); }}
                    className="p-1.5 bg-white/90 backdrop-blur rounded-md shadow-sm text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-100/50"
                    title="Delete"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

const PageManager = ({ pages, setPages, selectedPageIndex, onSelectPage, onAddFiles, onClose }) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setPages((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Delete this page?')) {
            setPages(prev => prev.filter(p => p.id !== id));
        }
    };

    const handleRotate = (id) => {
        setPages(prev => prev.map(p =>
            p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
        ));
    };

    return (
        <div className="bg-gray-50/50 border-r border-gray-200 w-full md:w-80 flex flex-col h-full z-20">
            {/* Header */}
            <div className="p-5 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 text-gray-800">
                        <Layers size={20} className="text-blue-600" />
                        <h3 className="font-bold text-base tracking-wide text-gray-700">PAGES ({pages.length})</h3>
                    </div>

                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-all shadow-sm hover:shadow active:scale-95"
                            title="Collapse Sidebar"
                        >
                            <ChevronLeft size={20} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
                <button
                    onClick={onAddFiles}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm group"
                >
                    <Plus size={16} className="text-blue-500 group-hover:scale-110 transition-transform" />
                    <span>Add Pages</span>
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
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
                                    onRotate={handleRotate}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                {pages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                            <Layers size={24} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">No pages yet</p>
                        <p className="text-xs mt-1 max-w-[150px]">Upload a PDF to see pages here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageManager;
