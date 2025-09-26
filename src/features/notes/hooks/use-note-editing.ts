import { useState, useEffect, useRef, useCallback } from 'react';
import { Note } from '@/domains/note';
import { NoteTask } from '@/domains/noteTask';
import { Tag } from '@/domains/tag';
import { createTask, toggleTaskCompletion } from '@/helpers/task-manager';

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
  
  // Undo functionality for content
  const [contentHistory, setContentHistory] = useState<string[]>([note.content]);
  const [historyIndex, setHistoryIndex] = useState(0);

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
    
    if (trimmedTitle !== note.title || JSON.stringify(tags) !== JSON.stringify(note.tags)) {
      onUpdate({
        ...note,
        title: trimmedTitle || 'Untitled',
        tags: tags,
        updatedAt: new Date(),
        clientUpdatedAt: new Date() // Track client update for sync
      });
    }
    setIsEditingTitle(false);
  };

  const handleContentSubmit = () => {
    const trimmedContent = content.trim();
    
    if (trimmedContent !== note.content || JSON.stringify(tags) !== JSON.stringify(note.tags)) {
      onUpdate({
        ...note,
        content: trimmedContent,
        tags: tags,
        updatedAt: new Date(),
        clientUpdatedAt: new Date() // Track client update for sync
      });
    }
    setIsEditingContent(false);
  };

  // Add content to history for undo functionality
  const addToContentHistory = useCallback((newContent: string) => {
    setContentHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newContent);
      return newHistory.slice(-50); // Keep last 50 changes
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Handle undo functionality
  const handleContentUndo = useCallback(() => {
    if (historyIndex > 0) {
      const previousIndex = historyIndex - 1;
      setHistoryIndex(previousIndex);
      setContent(contentHistory[previousIndex]);
    }
  }, [historyIndex, contentHistory]);

  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setContent(note.content);
      setIsEditingContent(false);
      // Reset history when canceling
      setContentHistory([note.content]);
      setHistoryIndex(0);
    } else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault();
      handleContentUndo();
    }
  };

  // Custom setContent that tracks history
  const setContentWithHistory = useCallback((newContent: string) => {
    if (newContent !== content) {
      addToContentHistory(newContent);
    }
    setContent(newContent);
  }, [content, addToContentHistory]);

  const handleContentPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    const textarea = e.target as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newContent = content.substring(0, start) + pastedText + content.substring(end);
    
    // No truncation during editing - allow full content
    setContentWithHistory(newContent);
    
    // Set cursor position after the pasted text
    setTimeout(() => {
      textarea.setSelectionRange(start + pastedText.length, start + pastedText.length);
    }, 0);
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
    // Initialize history with current content
    setContentHistory([note.content]);
    setHistoryIndex(0);
    
    if (note.content === 'Click to add content...' || note.content === 'Double-click to add content...') {
      setContent('');
    } else {
      setContent(note.content);
    }
    setIsEditingContent(true);
  };

  // Task management functions
  const toggleTaskMode = () => {
    onUpdate({
      ...note,
      isTaskMode: !note.isTaskMode,
      noteTasks: note.noteTasks || [],
      updatedAt: new Date(),
      clientUpdatedAt: new Date() // Track client update for sync
    });
  };

  const addTask = (text: string) => {
    if (!text.trim()) return;
    
    const newTask = {
      ...createTask(text, note.id),
    };
    const updatedTasks = [...(note.noteTasks || []), newTask];
    
    onUpdate({
      ...note,
      noteTasks: updatedTasks,
      updatedAt: new Date(),
      clientUpdatedAt: new Date() // Track client update for sync
    });
  };

  const updateTask = (taskUuid: string, updates: Partial<NoteTask>) => {
    if (!note.noteTasks) return;
    
    const updatedTasks = note.noteTasks.map(task => {
      if (task.uuid === taskUuid) {
        return { ...task, ...updates };
      }
      return task;
    });
    
    onUpdate({
      ...note,
      noteTasks: updatedTasks,
      updatedAt: new Date(),
      clientUpdatedAt: new Date() // Track client update for sync
    });
  };

  const deleteTask = (taskUuid: string) => {
    if (!note.noteTasks) return;
    
    const updatedTasks = note.noteTasks.filter(task => task.uuid !== taskUuid);
    
    onUpdate({
      ...note,
      noteTasks: updatedTasks,
      updatedAt: new Date(),
      clientUpdatedAt: new Date() // Track client update for sync
    });
  };

  const toggleTask = (taskUuid: string) => {
    if (!note.noteTasks) return;
    
    const task = note.noteTasks.find(t => t.uuid === taskUuid);
    if (!task) return;
    
    const updatedTask = toggleTaskCompletion(task);
    updateTask(taskUuid, updatedTask);
  };

  // Pin management function
  const togglePin = () => {
    onUpdate({
      ...note,
      isPinned: !note.isPinned,
      updatedAt: new Date(),
      clientUpdatedAt: new Date() // Track client update for sync
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
    setContent: setContentWithHistory,
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
