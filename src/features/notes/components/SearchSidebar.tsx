import { useState, useMemo } from 'react';
import { Search, X, Calendar, FileText } from 'lucide-react';
import { Note } from '@/domains/note';
import { NoteTask } from '@/domains/noteTask';
import { formatDateShort } from '@/helpers/date-helper';

interface SearchSidebarProps {
  allNotes: Note[];
  isOpen: boolean;
  onClose: () => void;
  onNoteSelect?: (note: Note) => void;
}

export const SearchSidebar = ({ allNotes, isOpen, onClose, onNoteSelect }: SearchSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to normalize text for search (removes diacritics/accents)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD') // Normalize to decomposed form
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritic marks
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show top 10 most recent notes by creation date when no search query
      return allNotes
        .filter(note => !note.isDeleted)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 10);
    }
    
    const normalizedQuery = normalizeText(searchQuery);
    
    return allNotes
      .filter(note => {
        // First, exclude deleted notes
        if (note.isDeleted) return false;
        
        const normalizedTitle = normalizeText(note.title);
        const normalizedContent = normalizeText(note.content);
        
        // Search in title and content
        let matches = normalizedTitle.includes(normalizedQuery) || 
                     normalizedContent.includes(normalizedQuery);
        
        // Search in tasks if available
        if (!matches && note.noteTasks) {
          matches = note.noteTasks.some((task: NoteTask) => 
            normalizeText(task.text).includes(normalizedQuery)
          );
        }
        
        return matches;
      })
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()); // Sort by most recent
  }, [allNotes, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-xs"
        onClick={handleClose}
      />
      
      {/* Sidebar */}
      <div className="relative w-96 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Search size={20} />
            Notes
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes and tasks..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Search Results List */}
          <div className="w-full">
            {!searchQuery && searchResults.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Notes Yet</p>
                <p className="text-sm">Create your first note to see it here</p>
              </div>
            ) : !searchQuery ? (
              <div className="overflow-y-auto">
                <div className="p-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  Recent Notes ({searchResults.length})
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {searchResults.map((note) => (
                    <div
                      key={note.uuid}
                      className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => onNoteSelect?.(note)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">
                          {note.title}
                        </h3>
                        <div 
                          className="w-3 h-3 rounded-full ml-2 flex-shrink-0" 
                          style={{ backgroundColor: note.color }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                        {truncateContent(note.content)}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar size={12} />
                          <span>{formatDateShort(note.date)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Notes Found</p>
                <p className="text-sm">No notes match "{searchQuery}"</p>
              </div>
            ) : (
              <div className="overflow-y-auto">
                <div className="p-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {searchResults.map((note) => (
                    <div
                      key={note.uuid}
                      className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => onNoteSelect?.(note)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">
                          {note.title}
                        </h3>
                        <div 
                          className="w-3 h-3 rounded-full ml-2 flex-shrink-0" 
                          style={{ backgroundColor: note.color }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                        {truncateContent(note.content)}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar size={12} />
                          <span>{formatDateShort(note.date)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
