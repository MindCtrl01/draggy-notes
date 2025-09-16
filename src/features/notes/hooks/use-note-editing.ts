import { useState, useEffect, useRef } from 'react';
import { Note } from '@/domains/note';

export const useNoteEditing = (
  note: Note,
  onUpdate: (note: Note) => void
) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(content.length, content.length);
    }
  }, [isEditing, content.length]);

  const handleContentSubmit = () => {
    const trimmedContent = content.trim();
    
    // Always allow content updates, including empty content
    if (trimmedContent !== note.content) {
      onUpdate({
        ...note,
        content: trimmedContent,
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

  const startEditing = () => {
    if (note.content === 'Click to add content...') {
      setContent('');
    }
    setIsEditing(true);
  };

  return {
    isEditing,
    content,
    textareaRef,
    setContent,
    handleContentSubmit,
    handleKeyDown,
    startEditing
  };
};
