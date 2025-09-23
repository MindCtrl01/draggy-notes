import React from 'react';

interface NoteContentModeProps {
  content: string;
  displayContent: string;
  isEditingContent: boolean;
  isContentTooLong: boolean;
  contentRef: React.RefObject<HTMLDivElement>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onContentChange: (value: string) => void;
  onContentSubmit: () => void;
  onContentKeyDown: (e: React.KeyboardEvent) => void;
  onContentPaste: (e: React.ClipboardEvent) => void;
  onStartEditingContent: () => void;
  onAutoResizeTextarea?: () => void;
  isDetail?: boolean;
  className?: string;
}

export const NoteContentMode: React.FC<NoteContentModeProps> = ({
  content,
  displayContent,
  isEditingContent,
  isContentTooLong,
  contentRef,
  textareaRef,
  onContentChange,
  onContentSubmit,
  onContentKeyDown,
  onContentPaste,
  onStartEditingContent,
  onAutoResizeTextarea,
  isDetail = false,
  className = '',
}) => {
  return (
    <div className={`note-content-mode ${className}`}>
      {isEditingContent ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            onContentChange(e.target.value);
          }}
          onInput={onAutoResizeTextarea}
          onBlur={onContentSubmit}
          onKeyDown={onContentKeyDown}
          onPaste={onContentPaste}
          className={isDetail ? 'note-detail-textarea' : 'note-content-textarea'}
          placeholder={isDetail ? 'Enter note content...' : 'Note content...'}
          onMouseDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          style={
            isDetail 
              ? { minHeight: '24rem' } // 96 * 0.25rem = 24rem
              : { minHeight: '100px', overflow: 'hidden' }
          }
        />
      ) : (
        <div 
          ref={contentRef}
          className={isDetail ? 'note-detail-content-view' : 'note-content-view'}
          onClick={(e) => {
            e.stopPropagation();
            onStartEditingContent();
          }}
        >
          <span className={
            content === 'Click to add content...' || content === 'Double-click to add content...' || content === '' 
              ? 'text-gray-500 italic' 
              : ''
          }>
            {content === '' 
              ? 'Click to add content...' 
              : displayContent
            }
          </span>
          {!isDetail && isContentTooLong && (
            <div className="mt-1 text-xs opacity-60 italic">
              Right-click → View Detail for full content
            </div>
          )}
        </div>
      )}
    </div>
  );
};
