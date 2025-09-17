import { useRef, useState, useMemo, useEffect } from 'react';
import { Trash2, CheckSquare, Square, Plus, X } from 'lucide-react';
import { Note, Task, Tag } from '@/domains/note';
import { cn } from '@/styles/utils';
import { useNoteDrag } from '../hooks/use-note-drag';
import { useNoteEditing } from '../hooks/use-note-editing';
import { useTagSuggestions } from '@/hooks/common/use-tag-suggestions';
import { TagSuggestion, TagDisplay } from '@/components/common';
import { TagManager } from '@/helpers/tag-manager';
import { getContrastTextColor } from '@/helpers/color-generator';
import { formatDateDisplay } from '@/helpers/date-helper';
import { getTaskProgressDisplay, getTaskProgress } from '@/helpers/task-manager';
import { getTaskColors } from '@/helpers/task-colors';
import { ContextMenu } from './ContextMenu';
import { NoteDetail } from './NoteDetail';
import '../styles/note-card.css';

interface NoteCardProps {
  note: Note;
  onUpdate: (note: Note) => void;
  onDelete: (id: string) => void;
  onDrag: (id: string, position: { x: number; y: number }) => void;
  onDragEnd?: (id: string, position: { x: number; y: number }) => void;
  onMoveToDate?: (noteId: string, newDate: Date) => void;
  onRefreshFromStorage?: (noteId: string) => void;
  isSelected?: boolean;
  onClearSelection?: () => void;
}

export const NoteCard = ({ note, onUpdate, onDelete, onDrag, onDragEnd, onMoveToDate, onRefreshFromStorage, isSelected, onClearSelection }: NoteCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; isOpen: boolean }>({
    x: 0,
    y: 0,
    isOpen: false,
  });
  const [showNoteDetail, setShowNoteDetail] = useState(false);
  const [currentDimensions, setCurrentDimensions] = useState<{ width: number; height: number } | null>(null);
  const [displayContent, setDisplayContent] = useState(note.content);
  const [isContentTooLong, setIsContentTooLong] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const taskTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  
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

  // Tag suggestions integration
  const handleTagInsert = (tag: Tag, position: number) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const currentText = textarea.value;
    const beforeTag = currentText.substring(0, position);
    const afterTag = currentText.substring(textarea.selectionStart);
    
    // Replace the # and partial text with the complete tag
    const newText = beforeTag + `#${tag.name} ` + afterTag;
    setContent(newText);
    
    // Immediately add tag to display (if not already present)
    setSelectedTags(prevTags => {
      const tagExists = prevTags.some(t => t.id === tag.id);
      if (!tagExists) {
        return [...prevTags, tag];
      }
      return prevTags;
    });
    
    // Increment tag usage count and update note
    TagManager.incrementTagUsage(tag.id, note.userId || -1);
    
    // Update the note with the new content and tags
    const detectedTagIds = TagManager.findOrCreateTagsFromText(newText, note.userId || -1);
    onUpdate({
      ...note,
      content: newText,
      tagIds: detectedTagIds,
      updatedAt: new Date()
    });
    
    // Set cursor position after the inserted tag
    setTimeout(() => {
      const newCursorPosition = position + tag.name.length + 2; // +2 for # and space
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const {
    suggestionState,
    handleTextChange,
    handleTagSelect,
    closeSuggestions,
  } = useTagSuggestions(textareaRef, note.userId || -1, handleTagInsert);

  // Task tag suggestions
  const handleTaskTagInsert = (tag: Tag, position: number) => {
    if (!taskTextareaRef.current) return;
    
    const textarea = taskTextareaRef.current;
    const currentText = textarea.value;
    const beforeTag = currentText.substring(0, position);
    const afterTag = currentText.substring(textarea.selectionStart);
    
    // Replace the # and partial text with the complete tag
    const newText = beforeTag + `#${tag.name} ` + afterTag;
    setNewTaskText(newText);
    
    // Increment tag usage count
    TagManager.incrementTagUsage(tag.id, note.userId || -1);
    
    // Set cursor position after the inserted tag
    setTimeout(() => {
      const newCursorPosition = position + tag.name.length + 2; // +2 for # and space
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const {
    suggestionState: taskSuggestionState,
    handleTextChange: handleTaskTextChange,
    handleTagSelect: handleTaskTagSelect,
    closeSuggestions: closeTaskSuggestions,
  } = useTagSuggestions(taskTextareaRef, note.userId || -1, handleTaskTagInsert);

  const { isDragging, handleMouseDown } = useNoteDrag(
    (position) => onDrag(note.id, position),
    (position) => onDragEnd?.(note.id, position),
    isEditingTitle || isEditingContent
  );

  const onMouseDown = (e: React.MouseEvent) => {
    // Only prevent dragging if clicking on interactive elements or input fields
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.tagName === 'BUTTON' || 
                                target.tagName === 'TEXTAREA' || 
                                target.tagName === 'INPUT' ||
                                target.closest('button');
    
    if (isInteractiveElement || isEditingTitle || isEditingContent) {
      return;
    }
    
    handleMouseDown(e, cardRef);
  };

  const textColor = getContrastTextColor(note.color);
  const taskColors = getTaskColors(note.color, textColor);

  const MAX_TITLE_LENGTH = 50;

  // Calculate effective content length considering line breaks as full lines
  const calculateEffectiveLength = (text: string) => {
    const lines = text.split('\n');
    const avgCharsPerLine = 40; // Average characters per line in the card
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

  // Calculate maximum characters based on current card dimensions
  const calculateMaxCharacters = () => {
    if (!contentRef.current) return 1000; // Fallback limit
    
    const cardElement = contentRef.current.closest('.note-card');
    if (!cardElement) return 1000;
    
    const rect = cardElement.getBoundingClientRect();
    const cardWidth = rect.width;
    const cardHeight = rect.height;
    
    // Account for padding (p-4 = 16px on each side)
    const contentWidth = cardWidth - 32; // 16px padding on each side
    const contentHeight = cardHeight - 100; // Account for title, date, and padding
    
    // Estimate characters per line based on card width
    const avgCharWidth = 8; // Average character width in pixels
    const charsPerLine = Math.floor(contentWidth / avgCharWidth);
    
    // Estimate lines based on card height
    const lineHeight = 21; // Line height in pixels
    const maxLines = Math.floor(contentHeight / lineHeight);
    
    // Calculate total character capacity
    const totalCapacity = charsPerLine * maxLines;
    
    return Math.max(100, totalCapacity); // Minimum 100 characters
  };

  // Clean content without tags for display
  const cleanContent = useMemo(() => {
    const currentContent = isEditingContent ? content : note.content;
    return TagManager.removeTagsFromText(currentContent);
  }, [note.content, content, isEditingContent]);

  // Dynamic overflow detection based on actual card dimensions and character limits
  useEffect(() => {
    if (isEditingContent) {
      setDisplayContent(TagManager.removeTagsFromText(content));
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
      const avgCharsPerLine = 45; // Average characters per line
      
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
    if (note.tagIds && note.tagIds.length > 0) {
      const existingTags = TagManager.getTagsByIds(note.tagIds, note.userId || -1);
      setSelectedTags(existingTags);
    } else {
      // Fallback: extract existing tags from saved content
      const extractedTags = TagManager.extractTagsFromText(note.content, note.userId || -1);
      setSelectedTags(extractedTags);
    }
  }, [note.id, note.tagIds, note.content, note.userId]);

  // Use selectedTags for display instead of parsing content
  const contentTags = selectedTags;

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
      onMoveToDate(note.id, currentDate);
    }
  };

  const handleMoveToYesterday = () => {
    if (onMoveToDate) {
      const currentDate = new Date(note.date);
      currentDate.setDate(currentDate.getDate() - 1);
      onMoveToDate(note.id, currentDate);
    }
  };

  const handleViewDetail = () => {
    setShowNoteDetail(true);
  };

  // Capture current dimensions when starting to edit
  const captureCurrentDimensions = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setCurrentDimensions({
        width: rect.width,
        height: rect.height
      });
    }
  };

  // Custom edit handlers that preserve dimensions
  const handleStartEditingTitle = () => {
    captureCurrentDimensions();
    startEditingTitle();
  };

  const handleStartEditingContent = () => {
    captureCurrentDimensions();
    startEditingContent();
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

  // Clear dimensions when editing finishes
  useEffect(() => {
    if (!isEditingTitle && !isEditingContent) {
      setCurrentDimensions(null);
    }
  }, [isEditingTitle, isEditingContent]);

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
      data-note-id={note.id}
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
        ...(isSelected && {
          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)',
          transform: 'scale(1.02)',
          zIndex: 1000
        }),
        // Preserve dimensions when editing
        ...(currentDimensions && (isEditingTitle || isEditingContent) && {
          width: currentDimensions.width,
          height: currentDimensions.height,
          minWidth: currentDimensions.width,
          minHeight: currentDimensions.height
        })
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onContextMenu={handleContextMenu}
      onDoubleClick={(e) => e.stopPropagation()}
      onClick={(e) => {
        if (isSelected && onClearSelection) {
          e.stopPropagation();
          onClearSelection();
        }
      }}
    >
      <button
        onClick={() => onDelete(note.id)}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Trash2 size={14} />
      </button>

      <div className="w-full h-full flex flex-col p-1">
        {/* Title section */}
        <div className="mb-2">
          {isEditingTitle ? (
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleTitleKeyDown}
              className="w-full bg-transparent border-none outline-none font-bold text-lg placeholder-gray-400"
              placeholder="Note title..."
              onMouseDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div 
              className="font-bold text-lg hover:bg-black/5 rounded px-1 py-0.5 -mx-1 -my-0.5 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleStartEditingTitle();
              }}
            >
              {displayTitle}
            </div>
          )}

          {/* Tags display */}
          <TagDisplay tags={contentTags} className="mt-1 mb-2" />
        </div>
        
        {/* Date display with task progress */}
        <div className="flex items-center justify-between text-xs opacity-70 mb-2">
          <span>{formatDateDisplay(note.date)}</span>
          <div className="flex items-center gap-2">
            {note.tasks && note.tasks.length > 0 && !note.isTaskMode && (
              <span className="task-progress-display">
                {getTaskProgressDisplay(note.tasks)}
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
        <div className="flex-1 overflow-hidden">
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
                  <div className="task-header-text">
                    <span className="text-sm font-medium">Progress</span>
                  </div>
                  <div className="task-progress-container">
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
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                    
                    <div className="task-item">
                      <div className={cn('task-text', task.completed && 'completed')}>
                        {editingTaskId === task.id ? (
                          <textarea
                            defaultValue={task.text}
                            onBlur={(e) => handleEditTask(task.id, e.target.value)}
                            onKeyDown={(e) => handleTaskEditKeyDown(e, task.id, task.text)}
                            onMouseDown={(e) => e.stopPropagation()}
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
                      onMouseDown={(e) => e.stopPropagation()}
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
                      handleTaskTextChange(e.target.value, e.target.selectionStart);
                    }}
                    onKeyDown={handleTaskKeyDown}
                    onMouseDown={(e) => e.stopPropagation()}
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
                      onMouseDown={(e) => e.stopPropagation()}
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
            <>
              {isEditingContent ? (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    handleTextChange(e.target.value, e.target.selectionStart);
                  }}
                  onBlur={handleContentSubmit}
                  onKeyDown={handleContentKeyDown}
                  onPaste={handleContentPaste}
                  className="w-full h-full bg-transparent border-none outline-none resize-none text-sm note-content-textarea"
                  placeholder="Note content..."
                  onMouseDown={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div 
                  ref={contentRef}
                  className="w-full h-full text-sm whitespace-pre-wrap break-words hover:bg-black/5 rounded px-1 py-0.5 -mx-1 -my-0.5 note-content-view cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEditingContent();
                  }}
                >
                  <span className={
                    note.content === 'Click to add content...' || note.content === 'Double-click to add content...' || note.content === '' 
                      ? 'text-gray-500 italic' 
                      : ''
                  }>
                    {note.content === '' 
                      ? 'Click to add content...' 
                      : displayContent
                    }
                  </span>
                  {isContentTooLong && (
                    <div className="mt-1 text-xs opacity-60 italic">
                      Right-click → View Detail for full content
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    
    {/* Tag Suggestions */}
    <TagSuggestion
      isVisible={suggestionState.isVisible}
      position={suggestionState.position}
      query={suggestionState.query}
      userId={note.userId || -1}
      onTagSelect={handleTagSelect}
      onClose={closeSuggestions}
    />

    {/* Task Tag Suggestions */}
    <TagSuggestion
      isVisible={taskSuggestionState.isVisible}
      position={taskSuggestionState.position}
      query={taskSuggestionState.query}
      userId={note.userId || -1}
      onTagSelect={handleTaskTagSelect}
      onClose={closeTaskSuggestions}
    />

    {/* Note Detail Modal */}
    <NoteDetail
      note={note}
      isOpen={showNoteDetail}
      onClose={() => setShowNoteDetail(false)}
      onUpdate={onUpdate}
      onMoveToDate={onMoveToDate}
      onRefreshFromStorage={onRefreshFromStorage}
    />
    </>
  );
};
