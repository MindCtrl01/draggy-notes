import React, { useEffect, useRef } from 'react';
import { ChevronRightIcon, ChevronLeftIcon, Eye } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  onMoveToTomorrow: () => void;
  onMoveToYesterday: () => void;
  onViewDetail?: () => void;
  showViewDetail?: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  isOpen,
  onClose,
  onMoveToTomorrow,
  onMoveToYesterday,
  onViewDetail,
  showViewDetail = false,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Adjust position to keep menu within viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 100);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-[180px]"
      style={{
        left: adjustedX,
        top: adjustedY,
        zIndex: 10001, // Always higher than any note
      }}
    >
      {showViewDetail && onViewDetail && (
        <button
          onClick={() => {
            onViewDetail();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <Eye size={16} />
          View Detail
        </button>
      )}
      {showViewDetail && <div className="border-t border-gray-200 dark:border-gray-600 my-1" />}
      <button
        onClick={() => {
          onMoveToTomorrow();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
      >
        <ChevronRightIcon size={16} />
        Move to tomorrow
      </button>
      <button
        onClick={() => {
          onMoveToYesterday();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
      >
        <ChevronLeftIcon size={16} />
        Move to yesterday
      </button>
    </div>
  );
};
