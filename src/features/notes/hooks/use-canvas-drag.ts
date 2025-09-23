import { useRef, useState, useCallback, useEffect } from 'react';

export const useCanvasDrag = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [startScrollPosition, setStartScrollPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start dragging if clicking on empty canvas area (not on notes or buttons)
    const target = e.target as HTMLElement;
    if (target.closest('.note-card') || target.closest('button') || target.closest('[role="button"]')) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    setIsDragging(true);
    setStartPosition({ x: e.clientX, y: e.clientY });
    setStartScrollPosition({ 
      x: container.scrollLeft, 
      y: container.scrollTop 
    });

    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const deltaX = e.clientX - startPosition.x;
    const deltaY = e.clientY - startPosition.y;

    // Only allow horizontal dragging, ignore vertical
    containerRef.current.scrollLeft = startScrollPosition.x - deltaX;
    // Keep vertical scroll position unchanged
  }, [isDragging, startPosition, startScrollPosition]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, [isDragging]);

  // Attach global mouse events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    containerRef,
    isDragging,
    handleMouseDown
  };
};
