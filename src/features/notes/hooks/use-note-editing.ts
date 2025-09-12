import { useState, useEffect, useRef } from 'react';
import { Note } from '@/types/note';

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
    
    // Don't save empty content (except for placeholder text)
    if (trimmedContent === '' && note.content !== 'Click to add content...') {
      // Reset to original content if user tries to save empty
      setContent(note.content);
      setIsEditing(false);
      return;
    }
    
    // Only update if content actually changed
    if (trimmedContent !== note.content && trimmedContent !== '') {
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
    // Clear placeholder text when starting to edit
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
