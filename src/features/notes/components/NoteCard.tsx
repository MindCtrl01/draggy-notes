import { useRef, useState, useMemo, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Note } from '@/domains/note';
import { cn } from '@/styles/utils';
import { useNoteDrag } from '../hooks/use-note-drag';
import { useNoteEditing } from '../hooks/use-note-editing';
import { getContrastTextColor } from '@/helpers/color-generator';
import { formatDateDisplay } from '@/helpers/date-helper';
import { ContextMenu } from './ContextMenu';
import { NoteDetail } from './NoteDetail';
import '../styles/note-card.css';

interface NoteCardProps {
  note: Note;
  onUpdate: (note: Note) => void;
  onDelete: (id: string) => void;
  onDrag: (id: string, position: { x: number; y: number }) => void;
  onDragEnd?: (id: string, position: { x: number; y: number }) => void;
  onMoveToDate?: (noteId: string, newDate: Date) => void;
  onRefreshFromStorage?: (noteId: string) => void;
  isSelected?: boolean;
  onClearSelection?: () => void;
}

export const NoteCard = ({ note, onUpdate, onDelete, onDrag, onDragEnd, onMoveToDate, onRefreshFromStorage, isSelected, onClearSelection }: NoteCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; isOpen: boolean }>({
    x: 0,
    y: 0,
    isOpen: false,
  });
  const [showNoteDetail, setShowNoteDetail] = useState(false);
  const [currentDimensions, setCurrentDimensions] = useState<{ width: number; height: number } | null>(null);
  
  const {
    isEditingTitle,
    isEditingContent,
    title,
    content,
    titleRef,
    textareaRef,
    setTitle,
    setContent,
    handleTitleSubmit,
    handleContentSubmit,
    handleContentKeyDown,
    handleTitleKeyDown,
    startEditingTitle,
    startEditingContent
  } = useNoteEditing(note, onUpdate);

  const { isDragging, handleMouseDown } = useNoteDrag(
    (position) => onDrag(note.id, position),
    (position) => onDragEnd?.(note.id, position),
    isEditingTitle || isEditingContent
  );

  const onMouseDown = (e: React.MouseEvent) => {
    // Only prevent dragging if clicking on interactive elements or input fields
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.tagName === 'BUTTON' || 
                                target.tagName === 'TEXTAREA' || 
                                target.tagName === 'INPUT' ||
                                target.closest('button');
    
    if (isInteractiveElement || isEditingTitle || isEditingContent) {
      return;
    }
    
    handleMouseDown(e, cardRef);
  };


  const textColor = getContrastTextColor(note.color);

  // Constants for content truncation
  const MAX_CONTENT_LENGTH = 400;
  const MAX_TITLE_LENGTH = 50;

  // Check if content is too long and needs truncation
  const isContentTooLong = useMemo(() => {
    return note.content.length > MAX_CONTENT_LENGTH;
  }, [note.content]);

  // Truncated content for display
  const displayContent = useMemo(() => {
    if (isEditingContent) return content;
    if (note.content.length <= MAX_CONTENT_LENGTH) return note.content;
    return note.content.substring(0, MAX_CONTENT_LENGTH) + '...';
  }, [note.content, isEditingContent, content]);

  // Truncated title for display
  const displayTitle = useMemo(() => {
    if (isEditingTitle) return title;
    if (!note.title) return 'Untitled';
    if (note.title.length <= MAX_TITLE_LENGTH) return note.title;
    return note.title.substring(0, MAX_TITLE_LENGTH) + '...';
  }, [note.title, isEditingTitle, title]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      isOpen: true,
    });
  };

  const handleMoveToTomorrow = () => {
    if (onMoveToDate) {
      const currentDate = new Date(note.date);
      currentDate.setDate(currentDate.getDate() + 1);
      onMoveToDate(note.id, currentDate);
    }
  };

  const handleMoveToYesterday = () => {
    if (onMoveToDate) {
      const currentDate = new Date(note.date);
      currentDate.setDate(currentDate.getDate() - 1);
      onMoveToDate(note.id, currentDate);
    }
  };

  const handleViewDetail = () => {
    setShowNoteDetail(true);
  };

  // Capture current dimensions when starting to edit
  const captureCurrentDimensions = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setCurrentDimensions({
        width: rect.width,
        height: rect.height
      });
    }
  };

  // Custom edit handlers that preserve dimensions
  const handleStartEditingTitle = () => {
    captureCurrentDimensions();
    startEditingTitle();
  };

  const handleStartEditingContent = () => {
    captureCurrentDimensions();
    startEditingContent();
  };

  // Clear dimensions when editing finishes
  useEffect(() => {
    if (!isEditingTitle && !isEditingContent) {
      setCurrentDimensions(null);
    }
  }, [isEditingTitle, isEditingContent]);

  return (
    <>
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        onMoveToTomorrow={handleMoveToTomorrow}
        onMoveToYesterday={handleMoveToYesterday}
        onViewDetail={isContentTooLong ? handleViewDetail : undefined}
        showViewDetail={isContentTooLong}
      />
    <div
      ref={cardRef}
      data-note-id={note.id}
      className={cn(
        'note-card',
        isDragging && 'dragging',
        isSelected && 'selected',
        !(isEditingTitle || isEditingContent) && 'cursor-move'
      )}
      style={{
        position: 'absolute',
        left: note.position.x,
        top: note.position.y,
        userSelect: isDragging ? 'none' : 'auto',
        backgroundColor: note.color,
        color: textColor,
        // Add selection highlighting
        ...(isSelected && {
          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)',
          transform: 'scale(1.02)',
          zIndex: 1000
        }),
        // Preserve dimensions when editing
        ...(currentDimensions && (isEditingTitle || isEditingContent) && {
          width: currentDimensions.width,
          height: currentDimensions.height,
          minWidth: currentDimensions.width,
          minHeight: currentDimensions.height
        })
      }}
      onMouseDown={onMouseDown}
      onContextMenu={handleContextMenu}
      onDoubleClick={(e) => e.stopPropagation()}
      onClick={(e) => {
        // Clear selection when clicking on the note
        if (isSelected && onClearSelection) {
          e.stopPropagation();
          onClearSelection();
        }
      }}
    >
      <button
        onClick={() => onDelete(note.id)}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-colors opacity-0 group-hover:opacity-100"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Trash2 size={14} />
      </button>

      <div className="w-full h-full flex flex-col p-1">
        {/* Title section */}
        <div className="mb-2">
          {isEditingTitle ? (
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleTitleKeyDown}
              className="w-full bg-transparent border-none outline-none font-bold text-lg placeholder-gray-400"
              placeholder="Note title..."
              onMouseDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div 
              className="font-bold text-lg cursor-move hover:cursor-pointer hover:bg-black/5 rounded px-1 py-0.5 -mx-1 -my-0.5"
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleStartEditingTitle();
              }}
            >
              {displayTitle}
            </div>
          )}
        </div>
        
        {/* Date display */}
        <div className="text-xs opacity-70 mb-2">
          {formatDateDisplay(note.date)}
        </div>
        
        {/* Content section */}
        <div className="flex-1 overflow-hidden">
          {isEditingContent ? (
            <textarea
              
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleContentSubmit}
              onKeyDown={handleContentKeyDown}
              className="w-full h-full bg-transparent border-none outline-none resize-none text-sm note-content-textarea"
              placeholder="Note content..."
              onMouseDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div 
              className="w-full h-full text-sm whitespace-pre-wrap break-words cursor-move hover:cursor-pointer hover:bg-black/5 rounded px-1 py-0.5 -mx-1 -my-0.5 note-content-view"
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleStartEditingContent();
              }}
            >
              <span className={
                note.content === 'Click to add content...' || note.content === 'Double-click to add content...' || note.content === '' 
                  ? 'text-gray-500 italic' 
                  : ''
              }>
                {note.content === '' 
                  ? 'Double-click to add content...' 
                  : displayContent || 'Double-click to add content...'
                }
              </span>
              {isContentTooLong && (
                <div className="mt-1 text-xs opacity-60 italic">
                  Right-click → View Detail for full content
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    
    {/* Note Detail Modal */}
    <NoteDetail
      note={note}
      isOpen={showNoteDetail}
      onClose={() => setShowNoteDetail(false)}
      onUpdate={onUpdate}
      onMoveToDate={onMoveToDate}
      onRefreshFromStorage={onRefreshFromStorage}
    />
    </>
  );
};
