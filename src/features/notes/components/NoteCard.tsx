import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Note } from '@/domains/note';
import { cn } from '@/styles/utils';
import { useNoteDrag } from '../hooks/use-note-drag';
import { useNoteEditing } from '../hooks/use-note-editing';
import { getContrastTextColor } from '@/helpers/color-generator';
import { formatDateDisplay } from '@/helpers/date-helper';
import { ContextMenu } from './ContextMenu';
import '../styles/note-card.css';

interface NoteCardProps {
  note: Note;
  onUpdate: (note: Note) => void;
  onDelete: (id: string) => void;
  onDrag: (id: string, position: { x: number; y: number }) => void;
  onDragEnd?: (id: string, position: { x: number; y: number }) => void;
  onMoveToDate?: (noteId: string, newDate: Date) => void;
}

export const NoteCard = ({ note, onUpdate, onDelete, onDrag, onDragEnd, onMoveToDate }: NoteCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; isOpen: boolean }>({
    x: 0,
    y: 0,
    isOpen: false,
  });
  
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
      const tomorrow = new Date(note.date);
      tomorrow.setDate(tomorrow.getDate() + 1);
      onMoveToDate(note.id, tomorrow);
    }
  };

  const handleMoveToYesterday = () => {
    if (onMoveToDate) {
      const yesterday = new Date(note.date);
      yesterday.setDate(yesterday.getDate() - 1);
      onMoveToDate(note.id, yesterday);
    }
  };

  return (
    <>
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        onMoveToTomorrow={handleMoveToTomorrow}
        onMoveToYesterday={handleMoveToYesterday}
      />
    <div
      ref={cardRef}
      className={cn(
        'note-card',
        isDragging && 'dragging',
        !(isEditingTitle || isEditingContent) && 'cursor-move'
      )}
      style={{
        position: 'absolute',
        left: note.position.x,
        top: note.position.y,
        userSelect: isDragging ? 'none' : 'auto',
        backgroundColor: note.color,
        color: textColor
      }}
      onMouseDown={onMouseDown}
      onContextMenu={handleContextMenu}
      onDoubleClick={(e) => e.stopPropagation()}
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
                startEditingTitle();
              }}
            >
              {note.title || 'Untitled'}
            </div>
          )}
        </div>
        
        {/* Date display */}
        <div className="text-xs opacity-70 mb-2">
          {formatDateDisplay(note.date)}
        </div>
        
        {/* Content section */}
        <div className="flex-1">
          {isEditingContent ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleContentSubmit}
              onKeyDown={handleContentKeyDown}
              className="w-full h-full bg-transparent border-none outline-none resize-none text-sm"
              placeholder="Note content..."
              onMouseDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div 
              className="w-full h-full text-sm whitespace-pre-wrap break-words overflow-hidden cursor-move hover:cursor-pointer hover:bg-black/5 rounded px-1 py-0.5 -mx-1 -my-0.5"
              onDoubleClick={(e) => {
                e.stopPropagation();
                startEditingContent();
              }}
            >
              <span className={
                note.content === 'Click to add content...' || note.content === 'Double-click to add content...' || note.content === '' 
                  ? 'text-gray-500 italic' 
                  : ''
              }>
                {note.content === '' 
                  ? 'Double-click to add content...' 
                  : note.content || 'Double-click to add content...'
                }
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};
