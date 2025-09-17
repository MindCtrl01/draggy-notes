import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Edit3, Calendar, Plus } from 'lucide-react';
import { DatePicker } from '@mantine/dates';
import { Note, Task, Tag } from '@/domains/note';
import { TagDisplay } from '@/components/common';
import { TagManager } from '@/helpers/tag-manager';
import { getContrastTextColor } from '@/helpers/color-generator';
import { formatDateDisplay } from '@/helpers/date-helper';
import { getTaskProgressDisplay, getTaskProgress } from '@/helpers/task-manager';
import { getTaskColors } from '@/helpers/task-colors';
import { useNoteEditing } from '../hooks/use-note-editing';
import { cn } from '@/styles/utils';
import '../styles/note-card.css';

interface NoteDetailProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (note: Note) => void;
  onMoveToDate?: (noteId: string, newDate: Date) => void;
  onRefreshFromStorage?: (noteId: string) => void;
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
    toggleTask
  } = useNoteEditing(note, onUpdate, setSelectedTags);


  // Initialize selected tags from note's existing tags
  useEffect(() => {
    if (note.tagIds && note.tagIds.length > 0) {
      const existingTags = note.tagIds.map(id => {
        const allTags = [...TagManager.getAllTags(note.userId || -1)];
        return allTags.find(tag => tag.id === id);
      }).filter(Boolean) as Tag[];
      setSelectedTags(existingTags);
    } else {
      setSelectedTags([]);
    }
  }, [note.id, note.tagIds, note.userId]);

  // Handle tag changes
  const handleTagsChange = (newTags: Tag[]) => {
    setSelectedTags(newTags);
    const newTagIds = newTags.map(tag => tag.id);
    onUpdate({
      ...note,
      tagIds: newTagIds,
      updatedAt: new Date()
    });
  };

  // Use selectedTags for display
  const contentTags = selectedTags;

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
  }, [note.id, note.date]);

  // Save any remaining unsaved changes when closing
  const saveAllChanges = () => {
    // Check for unsaved changes in title, content, and date
    const hasUnsavedChanges = title !== note.title || content !== note.content || selectedDate.getTime() !== note.date.getTime();
    
    if (hasUnsavedChanges) {
      const updatedNote = {
        ...note,
        title: title.trim() || 'Untitled',
        content: content,
        date: selectedDate,
        updatedAt: new Date()
      };
      
      // If date changed, use onMoveToDate, otherwise use onUpdate
      if (selectedDate.getTime() !== note.date.getTime()) {
        if (onMoveToDate) {
          onMoveToDate(note.id, selectedDate);
        }
        // Also update other fields if they changed
        if (title !== note.title || content !== note.content) {
          onUpdate({ ...updatedNote, date: note.date }); // Keep original date for onUpdate
        }
      } else {
        // Only title/content changed
        onUpdate(updatedNote);
      }
      
      // Refresh the note on canvas after update
      setTimeout(() => {
        if (onRefreshFromStorage) {
          onRefreshFromStorage(note.id);
        }
      }, 100);
    }
  };

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
  }, [isOpen, onClose, isEditingTitle, isEditingContent, title, content, selectedDate, note, onUpdate, onMoveToDate, onRefreshFromStorage]);

  // Auto-focus when starting to edit
  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingContent && textareaRef.current) {
      textareaRef.current.focus();
      // Don't automatically move cursor to end - preserve user's click position
    }
  }, [isEditingContent]);

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

  const handleEditTask = (taskId: string, newText: string) => {
    updateTask(taskId, { text: newText.trim() });
    setEditingTaskId(null);
  };

  const handleTaskEditKeyDown = (e: React.KeyboardEvent, taskId: string, currentText: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      handleEditTask(taskId, target.value);
    } else if (e.key === 'Escape') {
      setEditingTaskId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-[60%] max-w-4xl max-h-[100vh] rounded-xl shadow-2xl overflow-hidden"
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
              {isEditingTitle ? (
                <input
                  ref={titleRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={handleTitleKeyDown}
                  className="w-full bg-transparent border-none outline-none text-xl font-semibold placeholder-gray-400"
                  placeholder="Enter note title..."
                />
              ) : (
                <div
                  onClick={() => startEditingTitle()}
                  className="text-xl font-semibold cursor-pointer hover:bg-black/5 rounded px-2 py-1 -mx-2 -my-1"
                >
                  {note.title || 'Untitled Note'}
                </div>
              )}

              {/* Tags display */}
              <TagDisplay 
                tags={contentTags} 
                className="mt-2" 
                onTagsChange={handleTagsChange}
                userId={note.userId || -1}
              />
            </div>
          </div>
          
          {/* Task progress and date in top right */}
          <div className="flex items-center gap-3 flex-shrink-0 mr-4">
            {note.tasks && note.tasks.length > 0 && !note.isTaskMode && (
              <span className="text-sm opacity-70">
                {getTaskProgressDisplay(note.tasks)}
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
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-140px)] note-detail-content">
          {note.isTaskMode ? (
            // Task Mode
            <div 
              className="w-full h-full"
              style={{
                ['--task-bg-color' as any]: taskColors.taskBgColor,
                ['--task-bg-hover-color' as any]: taskColors.taskBgHoverColor,
                ['--task-border-color' as any]: taskColors.taskBorderColor,
                ['--add-task-bg-color' as any]: taskColors.addTaskBgColor,
                ['--add-task-bg-hover-color' as any]: taskColors.addTaskBgHoverColor,
                ['--add-task-border-color' as any]: taskColors.addTaskBorderColor,
                ['--add-task-border-hover-color' as any]: taskColors.addTaskBorderHoverColor,
                ['--progress-bar-bg-color' as any]: taskColors.progressBarBgColor,
                ['--progress-bar-fill-color' as any]: taskColors.progressBarFillColor,
              }}
            >
              {note.tasks && note.tasks.length > 0 && (
                <>
                  <div className="task-header-text mb-3">
                    <span className="text-lg font-medium">Tasks</span>
                  </div>
                  <div className="task-progress-container mb-6">
                    <div className="task-progress-bar">
                      <div 
                        className="task-progress-fill"
                        style={{ width: `${getTaskProgress(note.tasks).percentage}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div className="task-list">
                {note.tasks?.map((task) => (
                  <div key={task.id} className="task-item-container">
                    <button
                      className={cn('task-checkbox', task.completed && 'checked')}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTask(task.id);
                      }}
                    />
                    
                    <div className="task-item">
                      <div className={cn('task-text', task.completed && 'completed')}>
                        {editingTaskId === task.id ? (
                          <textarea
                            defaultValue={task.text}
                            onBlur={(e) => handleEditTask(task.id, e.target.value)}
                            onKeyDown={(e) => handleTaskEditKeyDown(e, task.id, task.text)}
                            autoFocus
                            rows={1}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = Math.min(target.scrollHeight, 1.4 * 16 * 3) + 'px';
                            }}
                          />
                        ) : (
                          <span
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTaskId(task.id);
                            }}
                            title={task.text.length > 100 ? task.text : undefined}
                          >
                            {task.text}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      className="task-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                {/* Add new task */}
                <div className="add-task-button">
                  <textarea
                    ref={taskTextareaRef}
                    placeholder="Add new task..."
                    value={newTaskText}
                    onChange={(e) => {
                      setNewTaskText(e.target.value);
                    }}
                    onKeyDown={handleTaskKeyDown}
                    className="w-full bg-transparent border-none outline-none resize-none"
                    rows={1}
                    style={{ minHeight: '1.4em', maxHeight: 'calc(1.4em * 3)' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 1.4 * 16 * 3) + 'px';
                    }}
                  />
                  {newTaskText && (
                    <button
                      onClick={handleAddTask}
                      className="ml-2 p-1 hover:bg-black/10 rounded flex-shrink-0"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Normal Mode
            <div>
              {isEditingContent ? (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                  }}
                  onBlur={handleContentSubmit}
                  onKeyDown={handleContentKeyDown}
                  onPaste={handleContentPaste}
                  className="w-full h-64 bg-transparent border-2 border-black/20 rounded-lg px-4 py-3 text-base resize-none focus:border-black/40 focus:outline-none note-detail-textarea"
                  placeholder="Enter note content..."
                />
              ) : (
                <div
                  onClick={() => startEditingContent()}
                  className="w-full min-h-64 px-4 py-3 text-base cursor-pointer hover:bg-black/5 rounded-lg border-2 border-transparent hover:border-black/10 transition-colors whitespace-pre-wrap break-words note-detail-content-view"
                >
                  {cleanDisplayContent || 'Click to add content...'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
