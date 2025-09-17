import '../styles/notes-canvas.css';
import { Plus, Trash2, Search, User, LogIn } from 'lucide-react';
import { NoteCard } from './NoteCard';
import { SearchSidebar } from './SearchSidebar';
import { CalendarSidebar } from './CalendarSidebar';
import { ConfirmationDialog } from './ConfirmationDialog';
import { LoginModal } from '@/components/auth';
import { useNotes, formatDateKey } from '../hooks/use-notes';
import { useAuthContext } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { NotesStorage } from '@/helpers/notes-storage';
import { Note } from '@/domains/note';
import { isSameDay, formatHeaderDate } from '@/helpers/date-helper';

export const NotesCanvas = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showSearchSidebar, setShowSearchSidebar] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const { user, isAuthenticated, logout } = useAuthContext();
  
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


  const handleSearchToggle = () => {
    setShowSearchSidebar(!showSearchSidebar);
  };

  // Save canvas data and recent view when notes change or date changes
  useEffect(() => {
    if (!isLoading && selectedDate) {
      const dateKey = formatDateKey(selectedDate);
      const noteCount = NotesStorage.getNotesCountByDate(dateKey);
      
      NotesStorage.saveCanvasData(dateKey, noteCount);
      NotesStorage.saveRecentCanvasDate(dateKey);
    }
  }, [notes.length, selectedDate, isLoading, isCreating, isUpdating, isDeleting]);

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    // Disable canvas interactions when SearchSidebar is open
    if (showSearchSidebar) {
      return;
    }
    
    // Note: No need to prevent note creation in left region since the canvas area 
    // now starts at 280px from left due to ml-[280px] class
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left - 100, // Center the note
      y: e.clientY - rect.top - 75
    };
    createNote(position);
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

  const handleNoteSelect = (note: Note) => {
    if (!isSameDay(note.date, selectedDate)) {
      setSelectedDate(new Date(note.date));
    }
    
    setSelectedNoteId(note.id);
    
    setShowSearchSidebar(false);
    
    setTimeout(() => {
      const noteElement = document.querySelector(`[data-note-id="${note.id}"]`);
      if (noteElement) {
        noteElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
      }
    }, 100);
  };

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
    <div className="canvas-container group flex" onDoubleClick={handleCanvasDoubleClick}>
      {/* Left Sidebar Region */}
      <div className="fixed left-0 top-0 w-[280px] h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40">
        {/* Date Title */}
        <div className="pt-4 pr-4 pb-4 pl-8 border-b border-gray-200 dark:border-gray-600">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {formatHeaderDate(selectedDate)}
          </h1>
        </div>
        
        {/* Calendar Sidebar */}
        <CalendarSidebar
          allNotes={allNotes}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 ml-[280px] relative">
      {/* User section in top right */}
      <div className="absolute top-8 right-8 z-10">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
              <User size={16} className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {user.name || user.email}
              </span>
            </div>
            <button
              onClick={logout}
              className="px-3 py-2 bg-red-500/80 hover:bg-red-600/80 backdrop-blur-sm border border-red-300 dark:border-red-700 rounded-lg shadow-sm text-white text-sm font-medium transition-colors"
              title="Logout"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-sm border border-blue-300 dark:border-blue-700 rounded-lg shadow-sm text-white text-sm font-medium transition-colors"
            title="Login to sync your notes"
          >
            <LogIn size={16} />
            <span>Login</span>
          </button>
        )}
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
            isSelected={selectedNoteId === note.id}
            onClearSelection={() => setSelectedNoteId(null)}
          />
        ))}
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
        onNoteSelect={handleNoteSelect}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
      </div>
    </div>
  );
};
