import '../styles/notes-canvas.css';
import { Plus, Trash2, Calendar, Search } from 'lucide-react';
import { NoteCard } from './NoteCard';
import { SearchSidebar } from './SearchSidebar';
import { useNotes, formatDateKey } from '../hooks/use-notes';
import { useState, useEffect } from 'react';
import { NotesStorage } from '@/helpers/notes-storage';

export const NotesCanvas = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSearchSidebar, setShowSearchSidebar] = useState(false);
  
  const { 
    notes, 
    allNotes,
    isLoading,
    createNote, 
    updateNote, 
    deleteNote, 
    clearAllDisplayedNotes,
    dragNote, 
    finalizeDrag,
    isCreating,
    isUpdating,
    isDeleting 
  } = useNotes(selectedDate);

  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  const handleSearchToggle = () => {
    setShowSearchSidebar(!showSearchSidebar);
    // Close date picker if open
    if (showDatePicker) {
      setShowDatePicker(false);
    }
  };

  // Save canvas data and recent view when notes change or date changes
  useEffect(() => {
    if (!isLoading && selectedDate) {
      const dateKey = formatDateKey(selectedDate);
      const noteCount = NotesStorage.getNotesCountByDate(dateKey);
      
      // Save canvas data if more than 1 note
      NotesStorage.saveCanvasData(dateKey, noteCount);
      
      // Save as most recent viewed canvas date
      NotesStorage.saveRecentCanvasDate(dateKey);
    }
  }, [notes.length, selectedDate, isLoading]);

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    // Close date picker if open
    if (showDatePicker) {
      setShowDatePicker(false);
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left - 100, // Center the note
      y: e.clientY - rect.top - 75
    };
    createNote(position);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
    setShowDatePicker(false);
  };

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  };

  const handleClearAllClick = () => {
    setShowClearConfirmation(true);
  };

  const handleConfirmClear = () => {
    clearAllDisplayedNotes();
    setShowClearConfirmation(false);
  };

  const handleCancelClear = () => {
    setShowClearConfirmation(false);
  };

  // Count displayed notes for the confirmation dialog
  const displayedNotesCount = notes.filter(note => note.isDisplayed).length;

  if (isLoading) {
    return (
      <div className="canvas-container flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="canvas-container group" onDoubleClick={handleCanvasDoubleClick}>
      <div className="absolute top-8 left-8 z-10">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold text-foreground">
            {formatDisplayDate(selectedDate)}
          </h1>
          <div className="flex items-center gap-2">
            {/* Date Picker Button */}
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Select date"
              >
                <Calendar size={20} />
              </button>
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
                  <input
                    type="date"
                    value={formatDateKey(selectedDate)}
                    onChange={handleDateChange}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <p className="text-muted-foreground">
          {(isCreating || isUpdating || isDeleting) && (
            <span className="ml-2 text-xs text-primary">
              {isCreating && "Creating..."}
              {isUpdating && "Saving..."}
              {isDeleting && "Deleting..."}
            </span>
          )}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Showing {notes.length} note{notes.length !== 1 ? 's' : ''} for this date
        </p>
      </div>

      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onUpdate={updateNote}
          onDelete={deleteNote}
          onDrag={dragNote}
          onDragEnd={finalizeDrag}
        />
      ))}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-20">
        {/* Search Button */}
        <button
          onClick={handleSearchToggle}
          className={`floating-search-btn text-white hover:text-white transition-colors ${
            showSearchSidebar ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
          }`}
          title="Search notes"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Search size={24} />
        </button>

        {/* Clear All Button */}
        <button
          onClick={handleClearAllClick}
          disabled={isDeleting || displayedNotesCount === 0}
          className="floating-clear-btn text-white hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            displayedNotesCount === 0 
              ? "No displayed notes to clear" 
              : isDeleting 
                ? "Clearing notes..." 
                : `Clear ${displayedNotesCount} displayed note${displayedNotesCount !== 1 ? 's' : ''}`
          }
        >
          {isDeleting ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            <Trash2 size={24} />
          )}
        </button>

        {/* Add Note Button */}
        <button
          onClick={() => createNote()}
          disabled={isCreating}
          className="floating-add-btn text-white hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          title={isCreating ? "Creating note..." : "Add new note"}
        >
          {isCreating ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            <Plus size={24} />
          )}
        </button>
      </div>

      {notes.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-muted-foreground">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-semibold mb-2">No notes yet</h2>
            <p className="text-lg">Double-click anywhere to create your first note!</p>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showClearConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Clear All Notes
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to clear all {displayedNotesCount} displayed note{displayedNotesCount !== 1 ? 's' : ''}? 
              This action cannot be undone.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelClear}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Clear All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Sidebar */}
      <SearchSidebar
        allNotes={allNotes}
        isOpen={showSearchSidebar}
        onClose={() => setShowSearchSidebar(false)}
        onNoteSelect={(note) => {
          // Optional: Handle note selection (e.g., scroll to note, highlight it)
          console.log('Selected note:', note);
        }}
      />
    </div>
  );
};
