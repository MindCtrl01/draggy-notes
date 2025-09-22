import { useState, useEffect, useRef, useCallback } from 'react';
import { Note } from '@/domains/note';
import { NoteTask } from '@/domains/noteTask';
import { Tag } from '@/domains/tag';
import { createTask, toggleTaskCompletion, updateTaskText } from '@/helpers/task-manager';

export const useNoteEditing = (
  note: Note,
  onUpdate: (note: Note) => void,
  onTagsUpdate?: (tags: Tag[]) => void
) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState<Tag[]>([]);
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
    }
  }, [isEditingContent]);

  const handleTitleSubmit = () => {
    const trimmedTitle = title.trim();
    const tagIds = tags.map(tag => tag.id);
    
    if (trimmedTitle !== note.title || JSON.stringify(tagIds) !== JSON.stringify(note.tagIds)) {
      onUpdate({
        ...note,
        title: trimmedTitle || 'Untitled',
        tagIds: tagIds,
        updatedAt: new Date()
      });
    }
    setIsEditingTitle(false);
  };

  const handleContentSubmit = () => {
    const trimmedContent = content.trim();
    const tagIds = tags.map(tag => tag.id);
    
    if (trimmedContent !== note.content || JSON.stringify(tagIds) !== JSON.stringify(note.tagIds)) {
      onUpdate({
        ...note,
        content: trimmedContent,
        tagIds: tagIds,
        updatedAt: new Date()
      });
    }
    setIsEditingContent(false);
  };

  const handleContentKeyDown = (e: React.KeyboardEvent) => {
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
      effectiveLength += line.length;
      if (line !== lines[lines.length - 1]) { // Not the last line
        effectiveLength += avgCharsPerLine;
      }
    }
    
    return effectiveLength;
  };

  const handleContentPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    const textarea = e.target as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newContent = content.substring(0, start) + pastedText + content.substring(end);
    
    const effectiveLength = calculateEffectiveLength(newContent);
    
    // Estimate maximum characters based on card dimensions
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
          currentEffectiveLength += avgCharsPerLine;
        } else {
          currentEffectiveLength += 1;
        }
        
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

  // Task management functions
  const toggleTaskMode = () => {
    onUpdate({
      ...note,
      isTaskMode: !note.isTaskMode,
      noteTasks: note.noteTasks || [],
      updatedAt: new Date()
    });
  };

  const addTask = (text: string) => {
    if (!text.trim()) return;
    
    const newTask = {
      ...createTask(text),
      userId: note.userId,
    };
    const updatedTasks = [...(note.noteTasks || []), newTask];
    
    onUpdate({
      ...note,
      noteTasks: updatedTasks,
      updatedAt: new Date()
    });
  };

  const updateTask = (taskId: number, updates: Partial<NoteTask>) => {
    if (!note.noteTasks) return;
    
    const updatedTasks = note.noteTasks.map(task => {
      if (task.id === taskId) {
        return { ...task, ...updates };
      }
      return task;
    });
    
    onUpdate({
      ...note,
      noteTasks: updatedTasks,
      updatedAt: new Date()
    });
  };

  const deleteTask = (taskId: number) => {
    if (!note.noteTasks) return;
    
    const updatedTasks = note.noteTasks.filter(task => task.id !== taskId);
    
    onUpdate({
      ...note,
      noteTasks: updatedTasks,
      updatedAt: new Date()
    });
  };

  const toggleTask = (taskId: number) => {
    if (!note.noteTasks) return;
    
    const task = note.noteTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const updatedTask = toggleTaskCompletion(task);
    updateTask(taskId, updatedTask);
  };

  // Pin management function
  const togglePin = () => {
    onUpdate({
      ...note,
      isPinned: !note.isPinned,
      updatedAt: new Date()
    });
  };

  // Tag management functions
  const updateTags = useCallback((newTags: Tag[]) => {
    setTags(newTags);
    if (onTagsUpdate) {
      onTagsUpdate(newTags);
    }
  }, [onTagsUpdate]);

  return {
    isEditingTitle,
    isEditingContent,
    title,
    content,
    tags,
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
    startEditingContent,
    // Task functions
    toggleTaskMode,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    // Pin functions
    togglePin,
    // Tag functions
    updateTags
  };
};
