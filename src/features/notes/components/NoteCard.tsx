import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { cn } from '@/styles/utils';
import { Note } from '@/domains/note';
import { Tag } from '@/domains/tag';
import { useNoteDrag } from '../hooks/use-note-drag';
import { useNoteEditing } from '../hooks/use-note-editing';
import { getContrastTextColor } from '@/helpers/color-generator';
import { formatDateDisplay } from '@/helpers/date-helper';
import { getTaskProgressDisplay } from '@/helpers/task-manager';
import { getTaskColors } from '@/helpers/task-colors';
import { ContextMenu } from './ContextMenu';
import { NoteDetail } from './NoteDetail';
import { NoteTitle } from './NoteTitle';
import { NoteTaskMode } from './NoteTaskMode';
import { NoteContentMode } from './NoteContentMode';
import { TEXT, NOTE_CARD, LIMITS } from '@/constants/ui-constants';
import '../styles/note-card.css';

interface NoteCardProps {
  note: Note;
  onUpdate: (note: Note) => void;
  onDelete: (uuid: string) => void;
  onDrag: (uuid: string, position: { x: number; y: number }) => void;
  onDragEnd?: (uuid: string, position: { x: number; y: number }) => void;
  onMoveToDate?: (noteUuid: string, newDate: Date) => void;
  onRefreshFromStorage?: (noteUuid: string) => void;
  isSelected?: boolean;
  onClearSelection?: () => void;
  onNoteDetailStateChange?: (noteUuid: string, isOpen: boolean) => void;
  zIndex: number;
  onBringToFront: () => void;
}

export const NoteCard = ({ note, onUpdate, onDelete, onDrag, onDragEnd, onMoveToDate, onRefreshFromStorage, isSelected, onClearSelection, onNoteDetailStateChange, zIndex, onBringToFront }: NoteCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; isOpen: boolean }>({
    x: 0,
    y: 0,
    isOpen: false,
  });
  const [showNoteDetail, setShowNoteDetail] = useState(false);
  const [displayContent, setDisplayContent] = useState(note.content);
  const [isContentTooLong, setIsContentTooLong] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const taskTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  
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
    togglePin,
    updateTags
  } = useNoteEditing(note, onUpdate, setSelectedTags);


  const { isDragging, handleMouseDown } = useNoteDrag(
    (position) => onDrag(note.uuid, position),
    (position) => onDragEnd?.(note.uuid, position),
    isEditingTitle || isEditingContent
  );

  const onMouseDown = (e: React.MouseEvent) => {
    // Bring note to front when clicked
    onBringToFront();
    
    // Only prevent dragging if clicking on interactive elements or input fields
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.tagName === 'BUTTON' || 
                                target.tagName === 'TEXTAREA' || 
                                target.tagName === 'INPUT' ||
                                target.closest('button') ||
                                target.closest('.add-task-button') ||
                                target.closest('.task-item') ||
                                target.closest('.task-item-container');
    
    if (isInteractiveElement || isEditingTitle || isEditingContent) {
      return;
    }
    
    handleMouseDown(e, cardRef);
  };

  const textColor = getContrastTextColor(note.color);
  const taskColors = getTaskColors(note.color, textColor);

  const MAX_TITLE_LENGTH = TEXT.MAX_TITLE_LENGTH;

  // Calculate effective content length considering line breaks as full lines
  const calculateEffectiveLength = (text: string) => {
    const lines = text.split('\n');
    const avgCharsPerLine = TEXT.AVG_CHARS_PER_LINE; // Average characters per line in the card
    let effectiveLength = 0;
    
    for (const line of lines) {
      effectiveLength += line.length;
      if (line !== lines[lines.length - 1]) { // Not the last line
        effectiveLength += avgCharsPerLine;
      }
    }
    
    return effectiveLength;
  };

  // Calculate maximum characters based on current card dimensions
  const calculateMaxCharacters = () => {
    if (!contentRef.current) return TEXT.FALLBACK_CHAR_LIMIT; // Fallback limit
    
    const cardElement = contentRef.current.closest('.note-card');
    if (!cardElement) return TEXT.FALLBACK_CHAR_LIMIT;
    
    const rect = cardElement.getBoundingClientRect();
    const cardWidth = rect.width;
    const cardHeight = NOTE_CARD.MAX_HEIGHT;
    
    // Account for padding (p-4 = 16px on each side)
    const contentWidth = cardWidth - NOTE_CARD.TOTAL_HORIZONTAL_PADDING; // 16px padding on each side
    const contentHeight = cardHeight - NOTE_CARD.CONTENT_HEIGHT_OFFSET; // Account for title, date, and padding with max fixed height of 600px in css
    
    // Estimate characters per line based on card width
    const avgCharWidth = TEXT.AVG_CHAR_WIDTH; // Average character width in pixels
    const charsPerLine = Math.floor(contentWidth / avgCharWidth);
    
    // Estimate lines based on card height
    const lineHeight = TEXT.LINE_HEIGHT; // Line height in pixels
    const maxLines = Math.floor(contentHeight / lineHeight);
    
    // Calculate total character capacity
    const totalCapacity = charsPerLine * maxLines;
    
    return Math.max(TEXT.MIN_CHAR_LIMIT, totalCapacity); // Minimum 100 characters
  };

  // Clean content for display
  const cleanContent = useMemo(() => {
    return isEditingContent ? content : note.content;
  }, [note.content, content, isEditingContent]);

  // Dynamic overflow detection based on actual card dimensions and character limits
  useEffect(() => {
    if (isEditingContent) {
      setDisplayContent(content);
      setIsContentTooLong(false);
      return;
    }
    
    if (!cleanContent || cleanContent === '') {
      setDisplayContent('Click to add content...');
      setIsContentTooLong(false);
      return;
    }
    
    // Calculate effective length considering line breaks as full line characters
    const effectiveLength = calculateEffectiveLength(cleanContent);
    const maxCharacters = calculateMaxCharacters();
    
    if (effectiveLength <= maxCharacters) {
      setDisplayContent(cleanContent);
      setIsContentTooLong(false);
    } else {
      // Find truncation point that keeps effective length under limit
      let truncateAt = 0;
      let currentEffectiveLength = 0;
      const avgCharsPerLine = TEXT.AVG_CHARS_PER_LINE_TRUNCATION; // Average characters per line
      
      for (let i = 0; i < cleanContent.length; i++) {
        const char = cleanContent[i];
        if (char === '\n') {
          // Line break adds full line worth of characters
          currentEffectiveLength += avgCharsPerLine;
        } else {
          currentEffectiveLength += 1;
        }
        
        // Reserve 3 characters for "..."
        if (currentEffectiveLength + 3 > maxCharacters) {
          break;
        }
        truncateAt = i + 1;
      }
      
      const truncatedContent = cleanContent.substring(0, truncateAt) + '...';
      setDisplayContent(truncatedContent);
      setIsContentTooLong(true);
    }
  }, [cleanContent, isEditingContent, content]);

  // Truncated title for display
  const displayTitle = useMemo(() => {
    if (isEditingTitle) return title;
    if (!note.title) return 'Untitled';
    if (note.title.length <= MAX_TITLE_LENGTH) return note.title;
    return note.title.substring(0, MAX_TITLE_LENGTH) + '...';
  }, [note.title, isEditingTitle, title]);

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
      updatedAt: new Date()
    });
  };

  // Use tags from hook for display
  const contentTags = tags.length > 0 ? tags : selectedTags;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      isOpen: true,
    });
  };

  const handleMoveToTomorrow = () => {
    if (onMoveToDate) {
      const currentDate = new Date(note.date);
      currentDate.setDate(currentDate.getDate() + 1);
      onMoveToDate(note.uuid, currentDate);
    }
  };

  const handleMoveToYesterday = () => {
    if (onMoveToDate) {
      const currentDate = new Date(note.date);
      currentDate.setDate(currentDate.getDate() - 1);
      onMoveToDate(note.uuid, currentDate);
    }
  };

  const handleViewDetail = () => {
    onBringToFront();
    setShowNoteDetail(true);
    onNoteDetailStateChange?.(note.uuid, true);
  };

  const handleCloseNoteDetail = () => {
    setShowNoteDetail(false);
    onNoteDetailStateChange?.(note.uuid, false);
  };

  // Auto-resize textarea to fit content
  const autoResizeTextarea = useCallback(() => {
    if (textareaRef.current && isEditingContent) {
      const textarea = textareaRef.current;
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight to fit content, with min and max constraints
      const minHeight = LIMITS.MIN_CONTENT_HEIGHT; // Minimum height
      const maxHeight = LIMITS.MAX_CONTENT_HEIGHT; // Maximum height before scrolling
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
      textarea.style.height = `${newHeight}px`;
    }
  }, [isEditingContent]);

  // Custom edit handlers
  const handleStartEditingTitle = () => {
    onBringToFront();
    startEditingTitle();
  };

  const handleStartEditingContent = () => {
    onBringToFront();
    startEditingContent();
  };

  // Auto-resize textarea when content changes or editing starts
  useEffect(() => {
    if (isEditingContent) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(autoResizeTextarea, 0);
      return () => clearTimeout(timer);
    }
  }, [isEditingContent, content, autoResizeTextarea]);

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

  const handleTaskEditKeyDown = (e: React.KeyboardEvent, taskUuid: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      handleEditTask(taskUuid, target.value);
    } else if (e.key === 'Escape') {
      setEditingTaskId(null);
    }
  };


  return (
    <>
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        onMoveToTomorrow={handleMoveToTomorrow}
        onMoveToYesterday={handleMoveToYesterday}
        onViewDetail={isContentTooLong ? handleViewDetail : undefined}
        showViewDetail={isContentTooLong}
      />
    <div
      ref={cardRef}
      data-note-uuid={note.uuid}
      className={cn(
        'note-card',
        isDragging && 'dragging',
        isSelected && 'selected',
        (isEditingTitle || isEditingContent) && 'editing'
      )}
      style={{
        position: 'absolute',
        left: note.position.x,
        top: note.position.y,
        userSelect: isDragging ? 'none' : 'auto',
        backgroundColor: note.color,
        color: textColor,
        zIndex: zIndex,
        ...(isSelected && {
          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)',
          transform: 'scale(1.02)',
        }),
        ...(note.isPinned && !isSelected && {
          boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(59, 130, 246, 0.15)',
        }),
      }}
      onMouseDown={onMouseDown}
      onContextMenu={handleContextMenu}
      onDoubleClick={(e) => e.stopPropagation()}
      onClick={(e) => {
        if (isSelected && onClearSelection) {
          e.stopPropagation();
          onClearSelection();
        }
      }}
    >
      <div className="w-full h-full flex flex-col p-1">
        {/* Title section */}
        <NoteTitle
          title={title}
          displayTitle={displayTitle}
          isEditingTitle={isEditingTitle}
          titleRef={titleRef}
          isPinned={note.isPinned || false}
          tags={contentTags}
          userId={note.userId || -1}
          onTitleChange={setTitle}
          onTitleSubmit={handleTitleSubmit}
          onTitleKeyDown={handleTitleKeyDown}
          onStartEditingTitle={handleStartEditingTitle}
          onTogglePin={togglePin}
          onDelete={() => onDelete(note.uuid)}
          onTagsChange={handleTagsChange}
        />
        
        {/* Date display with task progress */}
        <div className="flex items-center justify-between text-xs opacity-70 mb-2">
          <span>{formatDateDisplay(note.date)}</span>
          <div className="flex items-center gap-2">
            {note.noteTasks && note.noteTasks.length > 0 && !note.isTaskMode && (
              <span className="task-progress-display">
                {getTaskProgressDisplay(note.noteTasks)}
              </span>
            )}
            <button
              className="task-mode-toggle"
              onClick={(e) => {
                e.stopPropagation();
                toggleTaskMode();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title={note.isTaskMode ? 'Switch to note mode' : 'Switch to task mode'}
            >
              {note.isTaskMode ? '📝' : '📋'}
            </button>
          </div>
        </div>
        
        {/* Content section */}
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
            onTaskEditKeyDown={handleTaskEditKeyDown}
          />
        ) : (
          <NoteContentMode
            content={content}
            displayContent={displayContent}
            isEditingContent={isEditingContent}
            isContentTooLong={isContentTooLong}
            contentRef={contentRef}
            textareaRef={textareaRef}
            onContentChange={setContent}
            onContentSubmit={handleContentSubmit}
            onContentKeyDown={handleContentKeyDown}
            onContentPaste={handleContentPaste}
            onStartEditingContent={handleStartEditingContent}
            onAutoResizeTextarea={autoResizeTextarea}
          />
        )}
      </div>
    </div>

    {/* Note Detail Modal */}
    <NoteDetail
      note={note}
      isOpen={showNoteDetail}
      onClose={handleCloseNoteDetail}
      onUpdate={onUpdate}
      onMoveToDate={onMoveToDate}
      onRefreshFromStorage={onRefreshFromStorage}
    />
    </>
  );
};
