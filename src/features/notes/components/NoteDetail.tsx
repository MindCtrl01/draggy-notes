import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { X, Edit3, Calendar } from 'lucide-react';
import { DatePicker } from '@mantine/dates';
import { Note } from '@/domains/note';
import { Tag } from '@/domains/tag';
import { getContrastTextColor } from '@/helpers/color-generator';
import { formatDateDisplay } from '@/helpers/date-helper';
import { getTaskProgressDisplay } from '@/helpers/task-manager';
import { getTaskColors } from '@/helpers/task-colors';
import { useNoteEditing } from '../hooks/use-note-editing';
import { NoteTitle } from './NoteTitle';
import { NoteTaskMode } from './NoteTaskMode';
import { NoteContentMode } from './NoteContentMode';
import { ANIMATION } from '@/constants/ui-constants';
import '../styles/note-card.css';

interface NoteDetailProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (note: Note) => void;
  onMoveToDate?: (noteUuid: string, newDate: Date) => void;
  onRefreshFromStorage?: (noteUuid: string) => void;
}

export const NoteDetail: React.FC<NoteDetailProps> = ({
  note,
  isOpen,
  onClose,
  onUpdate,
  onMoveToDate,
  onRefreshFromStorage,
}) => {
  const [selectedDate, setSelectedDate] = useState(note.date);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const taskTextareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const textColor = getContrastTextColor(note.color);
  const taskColors = getTaskColors(note.color, textColor);

  // Use the same note editing hooks as NoteCard
  const {
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
    toggleTaskMode,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    updateTags
  } = useNoteEditing(note, onUpdate, setSelectedTags);


  // Initialize selected tags from note's existing tags
  useEffect(() => {
    if (note.tags && note.tags.length > 0) {
      setSelectedTags(note.tags);
      updateTags(note.tags);
    } else {
      setSelectedTags([]);
      updateTags([]);
    }
  }, [note.uuid, note.tags, note.userId, updateTags]);

  // Handle tag changes
  const handleTagsChange = (newTags: Tag[]) => {
    setSelectedTags(newTags);
    updateTags(newTags);
    onUpdate({
      ...note,
      tags: newTags,
      updatedAt: new Date(),
      clientUpdatedAt: new Date() // Track client update for sync
    });
  };

  // Use tags from hook for display
  const contentTags = tags.length > 0 ? tags : selectedTags;

  // Clean content for display
  const cleanDisplayContent = useMemo(() => {
    return isEditingContent ? content : note.content;
  }, [note.content, content, isEditingContent]);

  // Reset state when note changes
  useEffect(() => {
    setSelectedDate(note.date);
    setShowDatePicker(false);
    setNewTaskText('');
    setEditingTaskId(null);
  }, [note.uuid, note.date]);

  // Save any remaining unsaved changes when closing
  const saveAllChanges = useCallback(() => {
    // Check for unsaved changes in title, content, tags, and date
    const hasUnsavedChanges = title !== note.title || 
                             content !== note.content || 
                             selectedDate.getTime() !== note.date.getTime() ||
                             JSON.stringify(tags) !== JSON.stringify(note.tags);
    
    if (hasUnsavedChanges) {
      const updatedNote = {
        ...note,
        title: title.trim() || 'Untitled',
        content: content,
        tags: tags,
        date: selectedDate,
        updatedAt: new Date(),
        clientUpdatedAt: new Date() // Track client update for sync
      };
      
      // If date changed, use onMoveToDate, otherwise use onUpdate
      if (selectedDate.getTime() !== note.date.getTime()) {
        if (onMoveToDate) {
          onMoveToDate(note.uuid, selectedDate);
        }
        if (title !== note.title || content !== note.content || JSON.stringify(tags) !== JSON.stringify(note.tags)) {
          onUpdate({ ...updatedNote, date: note.date }); // Keep original date for onUpdate
        }
      } else {
        // Only title/content/tags changed
        onUpdate(updatedNote);
      }
      
      setTimeout(() => {
        if (onRefreshFromStorage) {
          onRefreshFromStorage(note.uuid);
        }
      }, ANIMATION.SCROLL_TO_NOTE_DELAY);
    }
  }, [title, content, selectedDate, tags, note, onUpdate, onMoveToDate, onRefreshFromStorage]);

  // Handle escape key and click outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isEditingTitle && !isEditingContent) {
        saveAllChanges();
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        saveAllChanges();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isEditingTitle, isEditingContent, title, content, tags, selectedDate, note, onUpdate, onMoveToDate, onRefreshFromStorage, saveAllChanges]);

  // Auto-focus when starting to edit
  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [isEditingTitle, titleRef]);

  useEffect(() => {
    if (isEditingContent && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditingContent, textareaRef]);

  // Handle click outside datepicker to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);


  const handleDateChange = (value: string | null) => {
    if (value) {
      const newDate = new Date(value);
      setSelectedDate(newDate);
      setShowDatePicker(false);
      // Don't save immediately - will save when modal closes
    }
  };

  // Task handlers
  const handleAddTask = () => {
    if (newTaskText.trim()) {
      addTask(newTaskText);
      setNewTaskText('');
    }
  };

  const handleTaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTask();
    }
  };

  const handleEditTask = (taskUuid: string, newText: string) => {
    updateTask(taskUuid, { text: newText.trim() });
    setEditingTaskId(null);
  };

  const handleTaskEditKeyDown = (e: React.KeyboardEvent, taskUuid: string, _currentText: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      handleEditTask(taskUuid, target.value);
    } else if (e.key === 'Escape') {
      setEditingTaskId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-[60%] h-[85%] rounded-xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: note.color,
          color: textColor,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-black/10">
          <div className="flex items-center gap-3 flex-1 mr-4">
            <Edit3 size={24} />
            {/* Title in header */}
            <div className="flex-1">
              <NoteTitle
                title={title}
                displayTitle={note.title || 'Untitled Note'}
                isEditingTitle={isEditingTitle}
                titleRef={titleRef}
                isPinned={false} // Pin button not shown in detail view
                tags={contentTags}
                userId={note.userId || -1}
                onTitleChange={setTitle}
                onTitleSubmit={handleTitleSubmit}
                onTitleKeyDown={handleTitleKeyDown}
                onStartEditingTitle={startEditingTitle}
                onTogglePin={() => {}} // No-op in detail view
                onDelete={() => {}} // No delete button in detail view
                onTagsChange={handleTagsChange}
                className="note-detail-title"
              />
            </div>
          </div>
          
          {/* Task progress and date in top right */}
          <div className="flex items-center gap-3 flex-shrink-0 mr-4">
            {note.noteTasks && note.noteTasks.length > 0 && !note.isTaskMode && (
              <span className="text-sm opacity-70">
                {getTaskProgressDisplay(note.noteTasks)}
              </span>
            )}
            <button
              className="task-mode-toggle"
              onClick={(e) => {
                e.stopPropagation();
                toggleTaskMode();
              }}
              title={note.isTaskMode ? 'Switch to note mode' : 'Switch to task mode'}
            >
              {note.isTaskMode ? '📝' : '📋'}
            </button>
            <Calendar size={20} />
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="text-base cursor-pointer hover:bg-black/5 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
              >
                {formatDateDisplay(selectedDate)}
              </button>
              {showDatePicker && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
                  <DatePicker
                    value={selectedDate}
                    onChange={handleDateChange}
                    size="sm"
                    styles={{
                      day: {
                        color: 'var(--mantine-color-text)',
                        '&[data-selected]': {
                          backgroundColor: 'var(--mantine-color-blue-6)',
                          color: 'white',
                        },
                        '&:hover': {
                          backgroundColor: 'var(--mantine-color-gray-1)',
                        },
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => {
              saveAllChanges();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-black/10 transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-140px)] note-detail-content">
          {note.isTaskMode ? (
            <NoteTaskMode
              tasks={note.noteTasks || []}
              newTaskText={newTaskText}
              editingTaskId={editingTaskId}
              taskTextareaRef={taskTextareaRef}
              taskColors={taskColors}
              onNewTaskTextChange={setNewTaskText}
              onAddTask={handleAddTask}
              onTaskKeyDown={handleTaskKeyDown}
              onToggleTask={toggleTask}
              onEditTask={handleEditTask}
              onDeleteTask={deleteTask}
              onStartEditingTask={setEditingTaskId}
              onTaskEditKeyDown={(e, taskUuid) => handleTaskEditKeyDown(e, taskUuid, '')}
              isDetail={true}
            />
          ) : (
            <NoteContentMode
              content={content}
              displayContent={cleanDisplayContent}
              isEditingContent={isEditingContent}
              isContentTooLong={false} // No truncation in detail view
              contentRef={useRef<HTMLDivElement>(null)} // Not used in detail view
              textareaRef={textareaRef}
              onContentChange={setContent}
              onContentSubmit={handleContentSubmit}
              onContentKeyDown={handleContentKeyDown}
              onContentPaste={handleContentPaste}
              onStartEditingContent={startEditingContent}
              isDetail={true}
              className="h-full"
            />
          )}
        </div>
      </div>
    </div>
  );
};
