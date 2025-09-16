import { useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { Note } from '@/domains/note';
import { cn } from '@/styles/utils';
import { useNoteDrag } from '../hooks/use-note-drag';
import { useNoteEditing } from '../hooks/use-note-editing';
import { getContrastTextColor } from '@/helpers/color-generator';
import '../styles/note-card.css';

interface NoteCardProps {
  note: Note;
  onUpdate: (note: Note) => void;
  onDelete: (id: string) => void;
  onDrag: (id: string, position: { x: number; y: number }) => void;
  onDragEnd?: (id: string, position: { x: number; y: number }) => void;
}

export const NoteCard = ({ note, onUpdate, onDelete, onDrag, onDragEnd }: NoteCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const {
    isEditing,
    content,
    textareaRef,
    setContent,
    handleContentSubmit,
    handleKeyDown,
    startEditing
  } = useNoteEditing(note, onUpdate);

  const { isDragging, handleMouseDown } = useNoteDrag(
    (position) => onDrag(note.id, position),
    (position) => onDragEnd?.(note.id, position),
    isEditing
  );

  const onMouseDown = (e: React.MouseEvent) => {
    // Only prevent dragging if clicking on interactive elements
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.tagName === 'BUTTON' || 
                                target.tagName === 'TEXTAREA' || 
                                target.closest('button');
    
    if (isInteractiveElement) {
      return;
    }
    
    handleMouseDown(e, cardRef);
  };

  const textColor = getContrastTextColor(note.color);

  return (
    <div
      ref={cardRef}
      className={cn(
        'note-card',
        isDragging && 'dragging',
        !isEditing && 'cursor-move'
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
    >
      <button
        onClick={() => onDelete(note.id)}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-colors opacity-0 group-hover:opacity-100"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Trash2 size={14} />
      </button>

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleContentSubmit}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-transparent border-none outline-none resize-none font-medium"
          placeholder="Type your note..."
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="w-full h-full font-medium whitespace-pre-wrap break-words cursor-text"
          onClick={startEditing}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className={
            note.content === 'Click to add content...' || note.content === '' 
              ? 'text-gray-500 italic' 
              : ''
          }>
            {note.content === '' 
              ? 'Empty note - Click to edit...' 
              : note.content || 'Click to edit...'
            }
          </span>
        </div>
      )}
    </div>
  );
};
