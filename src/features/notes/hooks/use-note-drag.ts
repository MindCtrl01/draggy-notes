import { useState, useEffect, useCallback, useRef } from 'react';

export interface DragState {
  isDragging: boolean;
  isPending: boolean;
  dragOffset: { x: number; y: number };
}

export const useNoteDrag = (
  onDrag: (position: { x: number; y: number }) => void,
  onDragEnd?: (position: { x: number; y: number }) => void,
  isEditing: boolean = false
) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isPending: false,
    dragOffset: { x: 0, y: 0 }
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
      
      // Set pending state first
      setDragState({
        isDragging: false,
        isPending: true,
        dragOffset
      });
      
      // Start dragging after 100ms delay
      dragTimeoutRef.current = setTimeout(() => {
        setDragState(prev => ({
          ...prev,
          isDragging: true,
          isPending: false
        }));
      }, 100);
    }
  }, [isEditing]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.isDragging) return;
      
      // Use requestAnimationFrame for smoother dragging
      requestAnimationFrame(() => {
        const newPosition = {
          x: e.clientX - dragState.dragOffset.x - 280, // Account for left sidebar width
          y: e.clientY - dragState.dragOffset.y
        };
        
        onDrag(newPosition);
      });
    };

    const handleMouseUp = () => {
      // Clear the timeout if mouse is released before drag starts
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
        dragTimeoutRef.current = null;
      }
      
      if (dragState.isDragging && onDragEnd) {
        // Calculate final position and call onDragEnd
        const finalPosition = {
          x: window.event ? (window.event as MouseEvent).clientX - dragState.dragOffset.x - 280 : 0, // Account for left sidebar width
          y: window.event ? (window.event as MouseEvent).clientY - dragState.dragOffset.y : 0,
        };
        onDragEnd(finalPosition);
      }
      
      setDragState(prev => ({ 
        ...prev, 
        isDragging: false,
        isPending: false
      }));
    };

    if (dragState.isDragging || dragState.isPending) {
      // Use passive event listeners for better performance
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.isDragging, dragState.isPending, dragState.dragOffset, onDrag]);

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
