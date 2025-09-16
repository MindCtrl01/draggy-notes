import { useState, useEffect, useRef } from 'react';
import { Note } from '@/domains/note';

export const useNoteEditing = (
  note: Note,
  onUpdate: (note: Note) => void
) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const titleRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.setSelectionRange(title.length, title.length);
    }
  }, [isEditingTitle, title.length]);

  useEffect(() => {
    if (isEditingContent && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(content.length, content.length);
    }
  }, [isEditingContent, content.length]);

  const handleTitleSubmit = () => {
    const trimmedTitle = title.trim();
    
    if (trimmedTitle !== note.title) {
      onUpdate({
        ...note,
        title: trimmedTitle || 'Untitled',
        updatedAt: new Date()
      });
    }
    setIsEditingTitle(false);
  };

  const handleContentSubmit = () => {
    const trimmedContent = content.trim();
    
    if (trimmedContent !== note.content) {
      onUpdate({
        ...note,
        content: trimmedContent,
        updatedAt: new Date()
      });
    }
    setIsEditingContent(false);
  };

  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      return; // Allow line breaks with Shift+Enter
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleContentSubmit();
    }
    if (e.key === 'Escape') {
      setContent(note.content);
      setIsEditingContent(false);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSubmit();
    }
    if (e.key === 'Escape') {
      setTitle(note.title);
      setIsEditingTitle(false);
    }
  };

  const startEditingTitle = () => {
    setIsEditingTitle(true);
  };

  const startEditingContent = () => {
    if (note.content === 'Click to add content...' || note.content === 'Double-click to add content...') {
      setContent('');
    }
    setIsEditingContent(true);
  };

  return {
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
  };
};
