import '../styles/notes-canvas.css';
import { Plus, Trash2, Calendar, Search, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { NoteCard } from './NoteCard';
import { SearchSidebar } from './SearchSidebar';
import { ConfirmationDialog } from './ConfirmationDialog';
import { useNotes, formatDateKey, formatDateDisplay } from '../hooks/use-notes';
import { useState, useEffect, useRef } from 'react';
import { DatePicker } from '@mantine/dates';
import { NotesStorage } from '@/helpers/notes-storage';

export const NotesCanvas = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSearchSidebar, setShowSearchSidebar] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  
  const user = {
    name: 'Fthu',
  };
  
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
    moveNoteToDate,
    refreshNoteFromStorage,
    isCreating,
    isUpdating,
    isDeleting 
  } = useNotes(selectedDate);

  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

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

  const handleSearchToggle = () => {
    setShowSearchSidebar(!showSearchSidebar);
    if (showDatePicker) {
      setShowDatePicker(false);
    }
  };

  // Save canvas data and recent view when notes change or date changes
  useEffect(() => {
    if (!isLoading && selectedDate) {
      const dateKey = formatDateKey(selectedDate);
      const noteCount = NotesStorage.getNotesCountByDate(dateKey);
      
      NotesStorage.saveCanvasData(dateKey, noteCount);
      NotesStorage.saveRecentCanvasDate(dateKey);
      
      console.log(`Canvas data updated for ${dateKey}: ${noteCount} notes`);
    }
  }, [notes.length, selectedDate, isLoading, isCreating, isUpdating, isDeleting]);

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (showDatePicker) {
      setShowDatePicker(false);
      return;
    }
    
    // Disable canvas interactions when SearchSidebar is open
    if (showSearchSidebar) {
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left - 100, // Center the note
      y: e.clientY - rect.top - 75
    };
    createNote(position);
  };

  const formatHeaderDate = (date: Date): string => {
    const dayName = date.toLocaleDateString('vi-VN', { weekday: 'long' });
    const formattedDate = formatDateDisplay(date); // DD-MM-YYYY
    return `${dayName}, ${formattedDate}`;
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

  const goToPreviousDay = () => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    setSelectedDate(previousDay);
    if (showDatePicker) {
      setShowDatePicker(false);
    }
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
    if (showDatePicker) {
      setShowDatePicker(false);
    }
  };

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
      {/* Username in top right */}
      {user && (
        <div className="absolute top-8 right-8 z-10">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <User size={16} className="text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {user.name}
            </span>
          </div>
        </div>
      )}
      
      <div className="absolute top-8 left-8 z-10">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold text-foreground">
            {formatHeaderDate(selectedDate)}
          </h1>
          <div className="flex items-center gap-2">
            {/* Date Picker Button */}
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Select date"
              >
                <Calendar size={20} />
              </button>
                {showDatePicker && (
                 <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
                   <DatePicker
                     value={selectedDate}
                     onChange={(date: string | null) => {
                       if (date) {
                         setSelectedDate(new Date(date));
                         setShowDatePicker(false);
                       }
                     }}
                     size="sm"
                     styles={{
                       day: {
                         color: 'var(--mantine-color-text)',
                         '&[dataSelected]': {
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

      <div className={showSearchSidebar ? 'pointer-events-none' : ''}>
        {notes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            onUpdate={updateNote}
            onDelete={deleteNote}
            onDrag={showSearchSidebar ? undefined : dragNote}
            onDragEnd={showSearchSidebar ? undefined : finalizeDrag}
            onMoveToDate={moveNoteToDate}
            onRefreshFromStorage={refreshNoteFromStorage}
          />
        ))}
      </div>

      {/* Date Navigation Arrows */}
      <div className="fixed bottom-8 left-8 flex items-center gap-2 z-20">
        <button
          onClick={goToPreviousDay}
          className="date-nav-btn text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
          title={`Go to ${formatDateDisplay(new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000))}`}
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-sm text-gray-500 dark:text-gray-400 px-2 py-1 bg-white/80 dark:bg-gray-800/80 rounded-md backdrop-blur-sm border border-gray-200 dark:border-gray-700">
          {formatDateDisplay(selectedDate)}
        </div>
        <button
          onClick={goToNextDay}
          className="date-nav-btn text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
          title={`Go to ${formatDateDisplay(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000))}`}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-20">
        {/* Search Button */}
        <button
          onClick={handleSearchToggle}
          className={`floating-search-btn text-white hover:text-white transition-colors ${
            showSearchSidebar ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
          }`}
          title="Search notes"
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

      {/* No notes message */}
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
      <ConfirmationDialog
        isOpen={showClearConfirmation}
        title="Clear All Notes"
        message={`Are you sure you want to clear all ${displayedNotesCount} displayed note${displayedNotesCount !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Clear All"
        cancelText="Cancel"
        isLoading={isDeleting}
        loadingText="Clearing..."
        onConfirm={handleConfirmClear}
        onCancel={handleCancelClear}
        variant="danger"
      />

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
