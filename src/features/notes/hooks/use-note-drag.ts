import { useState, useEffect, useCallback, useRef } from 'react';
import { DRAG, LAYOUT } from '@/constants/ui-constants';

export interface DragState {
  isDragging: boolean;
  isPending: boolean;
  dragOffset: { x: number; y: number };
  currentPosition: { x: number; y: number };
}

export const useNoteDrag = (
  onDrag: (position: { x: number; y: number }) => void,
  onDragEnd?: (position: { x: number; y: number }) => void,
  isEditing: boolean = false
) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isPending: false,
    dragOffset: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 }
  });
  
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, cardRef: React.RefObject<HTMLDivElement>) => {
    // Don't start dragging if we're in editing mode
    if (isEditing) return;
    
    // Prevent default to avoid text selection during drag
    e.preventDefault();
    
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      const dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      // Get the canvas container to account for scroll position
      const canvasContainer = document.querySelector('.canvas-scrollable-area')?.parentElement;
      const scrollLeft = canvasContainer?.scrollLeft || 0;
      
      // Set pending state first
      setDragState({
        isDragging: false,
        isPending: true,
        dragOffset,
        currentPosition: { 
          x: e.clientX - dragOffset.x - LAYOUT.SIDEBAR_WIDTH + scrollLeft, 
          y: e.clientY - dragOffset.y 
        }
      });
      
      // Start dragging after delay
      dragTimeoutRef.current = setTimeout(() => {
        setDragState(prev => ({
          ...prev,
          isDragging: true,
          isPending: false
        }));
      }, DRAG.START_DELAY);
    }
  }, [isEditing]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.isDragging) return;
      
      // Use requestAnimationFrame for smoother dragging
      requestAnimationFrame(() => {
        // Get the current scroll position of the canvas container
        const canvasContainer = document.querySelector('.canvas-scrollable-area')?.parentElement;
        const scrollLeft = canvasContainer?.scrollLeft || 0;
        
        const newPosition = {
          x: e.clientX - dragState.dragOffset.x - LAYOUT.SIDEBAR_WIDTH + scrollLeft, // Account for left sidebar width and scroll position
          y: e.clientY - dragState.dragOffset.y
        };
        
        setDragState(prev => ({
          ...prev,
          currentPosition: newPosition
        }));
        
        onDrag(newPosition);
      });
    };

    const handleMouseUp = () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
        dragTimeoutRef.current = null;
      }
      
      if (dragState.isDragging && onDragEnd) {
        onDragEnd(dragState.currentPosition);
      }
      
      setDragState(prev => ({ 
        ...prev, 
        isDragging: false,
        isPending: false
      }));
    };

    if (dragState.isDragging || dragState.isPending) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.isDragging, dragState.isPending, dragState.dragOffset, dragState.currentPosition, onDrag, onDragEnd]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

  return {
    isDragging: dragState.isDragging,
    handleMouseDown
  };
};
