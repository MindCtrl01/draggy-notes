import React from 'react';
import { Pin, Trash2 } from 'lucide-react';
import { Tag } from '@/domains/tag';
import { TagDisplay } from '@/components/common';

interface NoteTitleProps {
  title: string;
  displayTitle: string;
  isEditingTitle: boolean;
  titleRef: React.RefObject<HTMLInputElement>;
  isPinned: boolean;
  tags: Tag[];
  userId: number;
  onTitleChange: (value: string) => void;
  onTitleSubmit: () => void;
  onTitleKeyDown: (e: React.KeyboardEvent) => void;
  onStartEditingTitle: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onTagsChange: (tags: Tag[]) => void;
  className?: string;
}

export const NoteTitle: React.FC<NoteTitleProps> = ({
  title,
  displayTitle,
  isEditingTitle,
  titleRef,
  isPinned,
  tags,
  userId,
  onTitleChange,
  onTitleSubmit,
  onTitleKeyDown,
  onStartEditingTitle,
  onTogglePin,
  onDelete,
  onTagsChange,
  className = '',
}) => {
  return (
    <div className={`note-title-container ${className}`}>
      <div className="flex items-center justify-between gap-2">
        {isEditingTitle ? (
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onTitleSubmit}
            onKeyDown={onTitleKeyDown}
            className="note-title-input"
            placeholder="Note title..."
            onMouseDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div 
            className="note-title-display"
            onClick={(e) => {
              e.stopPropagation();
              onStartEditingTitle();
            }}
          >
            {displayTitle}
          </div>
        )}
        
        <div className="note-title-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className={`note-pin-button ${isPinned ? 'pinned' : ''}`}
            onMouseDown={(e) => e.stopPropagation()}
            title={isPinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin size={14} />
          </button>
          
          <button
            onClick={onDelete}
            className="note-delete-button"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Tags display */}
      <TagDisplay 
        tags={tags} 
        className="note-tags-display" 
        onTagsChange={onTagsChange}
        userId={userId}
      />
    </div>
  );
};
