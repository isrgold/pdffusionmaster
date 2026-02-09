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
import { Trash2, Plus, GripVertical, RotateCw } from 'lucide-react';

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
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group bg-white border-2 rounded-lg p-2 flex flex-col items-center gap-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-blue-300'
                } ${isDragging ? 'opacity-50' : ''}`}
            onClick={() => onSelect(index)}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 left-2 p-1 bg-gray-100 rounded opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing hover:bg-gray-200"
                title="Drag to reorder"
            >
                <GripVertical size={14} className="text-gray-500" />
            </div>

            {/* Page Preview / Thumbnail */}
            {/* Note: In a real implementation we would render a thumbnail here. 
            For now we use a placeholder or the actual page number from the original doc. */}
            <div className="w-24 h-32 bg-gray-50 flex items-center justify-center border border-gray-100 rounded overflow-hidden">
                {page.thumbnail ? (
                    <img
                        src={page.thumbnail}
                        alt={`Page ${index + 1}`}
                        className="object-contain w-full h-full transition-transform duration-200"
                        style={{ transform: `rotate(${page.rotation}deg)` }}
                    />
                ) : (
                    <span className="text-gray-400 font-medium text-lg">{index + 1}</span>
                )}
            </div>

            <div className="flex items-center gap-1 w-full justify-center">
                <span className="text-xs text-gray-500 truncate max-w-[80px]" title={page.fileName}>
                    {page.fileName || `Page ${index + 1}`}
                </span>
            </div>

            {/* Actions (Rotate / Delete) */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded p-0.5">
                <button
                    onClick={(e) => { e.stopPropagation(); onRotate(page.id); }}
                    className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-blue-600"
                    title="Rotate Page"
                >
                    <RotateCw size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(page.id); }}
                    className="p-1 hover:bg-red-100 rounded text-gray-600 hover:text-red-500"
                    title="Delete Page"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Page Number Indicator */}
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 rounded-full">
                {index + 1}
            </div>
        </div>
    );
};

const PageManager = ({ pages, setPages, selectedPageIndex, onSelectPage, onAddFiles }) => {
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

                // If the selected page is moved, we need to update the selection index potentially
                // For simplicity, we might just keep the selection on the same *content* or same *index*.
                // Let's keep selection on the same *content* (id).

                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this page?')) {
            setPages(prev => prev.filter(p => p.id !== id));
        }
    };

    const handleRotate = (id) => {
        setPages(prev => prev.map(p =>
            p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
        ));
    };

    return (
        <div className="bg-white border-r border-gray-200 w-full md:w-80 flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-700">Pages ({pages.length})</h3>
                <button
                    onClick={onAddFiles}
                    className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm transition-colors"
                >
                    <Plus size={16} />
                    Add
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={pages.map(p => p.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-2 gap-3">
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
                    <div className="text-center py-10 text-gray-400">
                        <p>No pages</p>
                        <p className="text-sm">Click Add to upload</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageManager;
