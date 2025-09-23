import { useState } from 'react';
import { Note } from '@/domains/note';
import { formatDateDisplay } from '@/helpers/date-helper';
import { Eye, EyeOff } from 'lucide-react';

interface QuickNoteTabsProps {
  notes: Note[];
  onNoteSelect: (note: Note) => void;
  selectedNoteId?: number | null;
}

export const QuickNoteTabs = ({ notes, onNoteSelect, selectedNoteId }: QuickNoteTabsProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter to only displayed notes and sort by creation time (newest first)
  const displayedNotes = notes
    .filter(note => note.isDisplayed)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (displayedNotes.length === 0) {
    return null;
  }

  const truncateTitle = (title: string, maxLength: number = 20) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-sidebar-accent dark:bg-gray-800 border-b border-sidebar-border dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
          Quick Notes ({displayedNotes.length})
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-sidebar-accent dark:hover:bg-gray-700 rounded transition-colors"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {/* Note Tabs */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto">
          {displayedNotes.map((note) => {
            const isSelected = selectedNoteId === note.id;
            
            return (
              <button
                key={note.id}
                onClick={() => onNoteSelect(note)}
                className={`w-full p-2 text-left border-b border-gray-100 dark:border-gray-700 hover:bg-sidebar-accent dark:hover:bg-gray-800 transition-colors ${
                  isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                }`}
                title={`${note.title} - ${formatDateDisplay(note.date)}`}
              >
                <div className="flex items-center gap-2">
                  {/* Color indicator */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: note.color }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {truncateTitle(note.title || 'Untitled')}
                    </div>
                    
                    {/* Task/Note indicator and date */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{note.isTaskMode ? '📋' : '📝'}</span>
                      {note.noteTasks && note.noteTasks.length > 0 && (
                        <span>
                          {note.noteTasks.filter(t => t.completed).length}/{note.noteTasks.length}
                        </span>
                      )}
                      <span className="truncate">{formatDateDisplay(note.date)}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
