import React, { useState, useRef, useEffect } from 'react';
import { X, Edit3, Calendar } from 'lucide-react';
import { DatePicker } from '@mantine/dates';
import { Note } from '@/domains/note';
import { getContrastTextColor } from '@/helpers/color-generator';
import { formatDateDisplay } from '@/helpers/date-helper';
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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [selectedDate, setSelectedDate] = useState(note.date);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const textColor = getContrastTextColor(note.color);

  // Reset state when note changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setSelectedDate(note.date);
    setIsEditingTitle(false);
    setIsEditingContent(false);
    setShowDatePicker(false);
  }, [note.id, note.title, note.content, note.date]);

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
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
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

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    // Save immediately when user finishes editing title
    if (title !== note.title) {
      const updatedNote = { ...note, title: title.trim() || 'Untitled', updatedAt: new Date() };
      onUpdate(updatedNote);
      // Refresh the note on canvas after update
      setTimeout(() => {
        if (onRefreshFromStorage) {
          onRefreshFromStorage(note.id);
        }
      }, 100);
    }
  };

  const handleContentSubmit = () => {
    setIsEditingContent(false);
    // Save immediately when user finishes editing content
    if (content !== note.content) {
      const updatedNote = { ...note, content: content, updatedAt: new Date() };
      onUpdate(updatedNote);
      // Refresh the note on canvas after update
      setTimeout(() => {
        if (onRefreshFromStorage) {
          onRefreshFromStorage(note.id);
        }
      }, 100);
    }
  };

  const handleDateChange = (value: string | null) => {
    if (value) {
      const newDate = new Date(value);
      setSelectedDate(newDate);
      setShowDatePicker(false);
      // Don't save immediately - will save when modal closes
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTitle(note.title);
      setIsEditingTitle(false);
    }
  };

  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setContent(note.content);
      setIsEditingContent(false);
    }
    // Allow Ctrl+Enter to save and exit
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleContentSubmit();
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
        className="relative w-[60%] max-w-4xl max-h-[80vh] rounded-xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: note.color,
          color: textColor,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-black/10">
          <div className="flex items-center gap-3">
            <Edit3 size={24} />
            <h2 className="text-xl font-semibold">Note Detail</h2>
          </div>
          <button
            onClick={() => {
              saveAllChanges();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-black/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)] note-detail-content">
          {/* Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium opacity-70 mb-2">Date</label>
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-3 w-full px-4 py-3 text-base cursor-pointer hover:bg-black/5 rounded-lg border-2 border-transparent hover:border-black/10 transition-colors"
              >
                <Calendar size={20} />
                <span>{formatDateDisplay(selectedDate)}</span>
              </button>
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
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

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium opacity-70 mb-2">Title</label>
            {isEditingTitle ? (
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleTitleKeyDown}
                className="w-full bg-transparent border-2 border-black/20 rounded-lg px-4 py-3 text-2xl font-bold focus:border-black/40 focus:outline-none"
                placeholder="Enter note title..."
              />
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                className="w-full px-4 py-3 text-2xl font-bold cursor-pointer hover:bg-black/5 rounded-lg border-2 border-transparent hover:border-black/10 transition-colors"
              >
                {note.title || 'Untitled Note'}
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium opacity-70 mb-2">Content</label>
            {isEditingContent ? (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={handleContentSubmit}
                onKeyDown={handleContentKeyDown}
                className="w-full h-64 bg-transparent border-2 border-black/20 rounded-lg px-4 py-3 text-base resize-none focus:border-black/40 focus:outline-none note-detail-textarea"
                placeholder="Enter note content... (Ctrl+Enter to save)"
              />
            ) : (
              <div
                onClick={() => setIsEditingContent(true)}
                className="w-full min-h-64 px-4 py-3 text-base cursor-pointer hover:bg-black/5 rounded-lg border-2 border-transparent hover:border-black/10 transition-colors whitespace-pre-wrap break-words note-detail-content-view"
              >
                {note.content || 'Click to add content...'}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
