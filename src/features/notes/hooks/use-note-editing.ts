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
      // Don't automatically move cursor to end - preserve user's click position
    }
  }, [isEditingContent]);

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
      e.preventDefault();
      handleContentSubmit();
    }
    if (e.key === 'Enter') {
      return; // Allow line breaks with Enter
    }
    if (e.key === 'Escape') {
      setContent(note.content);
      setIsEditingContent(false);
    }
  };

  // Calculate effective content length considering line breaks as full lines
  const calculateEffectiveLength = (text: string) => {
    const lines = text.split('\n');
    const avgCharsPerLine = 45; // Average characters per line in the card
    let effectiveLength = 0;
    
    for (const line of lines) {
      // Each line contributes its character count
      effectiveLength += line.length;
      // Each line break adds the equivalent of a full line
      if (line !== lines[lines.length - 1]) { // Not the last line
        effectiveLength += avgCharsPerLine;
      }
    }
    
    return effectiveLength;
  };

  const handleContentPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    // Get current cursor position
    const textarea = e.target as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Calculate new content length after paste
    const newContent = content.substring(0, start) + pastedText + content.substring(end);
    
    // Calculate effective length considering line breaks as full line characters
    const effectiveLength = calculateEffectiveLength(newContent);
    
    // Estimate maximum characters based on card dimensions
    // This is a simplified calculation - the main logic is in NoteCard component
    const estimatedMaxChars = 500; // Conservative estimate
    
    if (effectiveLength <= estimatedMaxChars) {
      setContent(newContent);
      
      // Set cursor position after the pasted text
      setTimeout(() => {
        textarea.setSelectionRange(start + pastedText.length, start + pastedText.length);
      }, 0);
    } else {
      // Find truncation point that keeps effective length under limit
      let truncateAt = 0;
      let currentEffectiveLength = 0;
      const avgCharsPerLine = 45; // Average characters per line
      
      for (let i = 0; i < newContent.length; i++) {
        const char = newContent[i];
        if (char === '\n') {
          // Line break adds full line worth of characters
          currentEffectiveLength += avgCharsPerLine;
        } else {
          currentEffectiveLength += 1;
        }
        
        // Reserve 3 characters for "..."
        if (currentEffectiveLength + 3 > estimatedMaxChars) {
          break;
        }
        truncateAt = i + 1;
      }
      
      const truncatedContent = newContent.substring(0, truncateAt);
      setContent(truncatedContent);
      
      // Set cursor position at the end
      setTimeout(() => {
        textarea.setSelectionRange(truncateAt, truncateAt);
      }, 0);
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
    handleContentPaste,
    handleTitleKeyDown,
    startEditingTitle,
    startEditingContent
  };
};
