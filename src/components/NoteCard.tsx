import { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Note } from '@/types/note';
import { cn } from '@/lib/utils';

interface NoteCardProps {
  note: Note;
  onUpdate: (note: Note) => void;
  onDelete: (id: string) => void;
  onDrag: (id: string, position: { x: number; y: number }) => void;
}

export const NoteCard = ({ note, onUpdate, onDelete, onDrag }: NoteCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(content.length, content.length);
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newPosition = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      };
      
      onDrag(note.id, newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, note.id, onDrag]);

  const handleContentSubmit = () => {
    if (content.trim() !== note.content) {
      onUpdate({
        ...note,
        content: content.trim(),
        updatedAt: new Date()
      });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      return; // Allow line breaks with Shift+Enter
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleContentSubmit();
    }
    if (e.key === 'Escape') {
      setContent(note.content);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'note-card',
        `note-${note.color}`,
        isDragging && 'dragging'
      )}
      style={{
        position: 'absolute',
        left: note.position.x,
        top: note.position.y,
        userSelect: isDragging ? 'none' : 'auto'
      }}
      onMouseDown={handleMouseDown}
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
          onClick={() => setIsEditing(true)}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {note.content || 'Click to edit...'}
        </div>
      )}
    </div>
  );
};