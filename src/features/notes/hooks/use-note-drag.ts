import { useState, useEffect, useCallback } from 'react';

export interface DragState {
  isDragging: boolean;
  dragOffset: { x: number; y: number };
}

export const useNoteDrag = (
  onDrag: (position: { x: number; y: number }) => void,
  onDragEnd?: (position: { x: number; y: number }) => void,
  isEditing: boolean = false
) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragOffset: { x: 0, y: 0 }
  });

  const handleMouseDown = useCallback((e: React.MouseEvent, cardRef: React.RefObject<HTMLDivElement>) => {
    // Don't start dragging if we're in editing mode
    if (isEditing) return;
    
    // Prevent default to avoid text selection during drag
    e.preventDefault();
    
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      setDragState({
        isDragging: true,
        dragOffset: {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        }
      });
    }
  }, [isEditing]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.isDragging) return;
      
      // Use requestAnimationFrame for smoother dragging
      requestAnimationFrame(() => {
        const newPosition = {
          x: e.clientX - dragState.dragOffset.x,
          y: e.clientY - dragState.dragOffset.y
        };
        
        onDrag(newPosition);
      });
    };

    const handleMouseUp = () => {
      if (dragState.isDragging && onDragEnd) {
        // Calculate final position and call onDragEnd
        const finalPosition = {
          x: window.event ? (window.event as MouseEvent).clientX - dragState.dragOffset.x : 0,
          y: window.event ? (window.event as MouseEvent).clientY - dragState.dragOffset.y : 0,
        };
        onDragEnd(finalPosition);
      }
      setDragState(prev => ({ ...prev, isDragging: false }));
    };

    if (dragState.isDragging) {
      // Use passive event listeners for better performance
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.isDragging, dragState.dragOffset, onDrag]);

  return {
    isDragging: dragState.isDragging,
    handleMouseDown
  };
};
