import '../styles/notes-canvas.css';
import { Plus, Trash2, Search, User, LogIn } from 'lucide-react';
import { NoteCard } from './NoteCard';
import { SearchSidebar } from './SearchSidebar';
import { CalendarSidebar } from './CalendarSidebar';
import { QuickNoteTabs } from './QuickNoteTabs';
import { ConfirmationDialog } from './ConfirmationDialog';
import { LoginModal } from '@/components/auth';
import { ThemeToggle } from '@/components/common';
import { useNotes, formatDateKey } from '../hooks/use-notes';
import { useCanvasDrag } from '../hooks/use-canvas-drag';
import { useAuthContext } from '@/components/common/contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { NotesStorage } from '@/helpers/notes-storage';
import { Note } from '@/domains/note';
import { isSameDay, formatHeaderDate } from '@/helpers/date-helper';
import { LAYOUT, DRAG, NOTE_CARD, Z_INDEX, ANIMATION } from '@/constants/ui-constants';
import { NotesSyncService } from '@/services/notes-sync-service';

export const NotesCanvas = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showSearchSidebar, setShowSearchSidebar] = useState(false);
  const [selectedNoteUuid, setSelectedNoteUuid] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAnyNoteDetailOpen, setIsAnyNoteDetailOpen] = useState(false);
  
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
    forceReloadAllNotes,
    isCreating,
    isUpdating,
    isDeleting 
  } = useNotes(selectedDate, isAuthenticated);

  const { containerRef, isDragging, handleMouseDown } = useCanvasDrag();

  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  
  // Z-index management
  const [noteZIndices, setNoteZIndices] = useState<Record<string, number>>({});
  const [maxZIndex, setMaxZIndex] = useState<number>(Z_INDEX.NOTE_BASE);

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

  // Set up force reload event handler for SignalR events
  useEffect(() => {
    const handleForceReload = (data: any) => {
      console.log(`Force reloading notes after ${data.reason} event, affected notes: ${data.affectedNotes}`);
      forceReloadAllNotes();
    };

    // Add event handler for force reload events
    NotesSyncService.addRealTimeEventHandler('forceReloadNotes', handleForceReload);

    return () => {
      // Clean up event handler
      NotesSyncService.removeRealTimeEventHandler('forceReloadNotes', handleForceReload);
    };
  }, [forceReloadAllNotes]);

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    // Prevent default double-click behavior (text selection)
    e.preventDefault();
    e.stopPropagation();
    
    // Disable note creation when login modal is open
    if (showLoginModal || showSearchSidebar || isAnyNoteDetailOpen) {
      return;
    }
    
    // Clear any existing text selection that might have occurred
    if (window.getSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
    }
    
    // Note: No need to prevent note creation in left region since the canvas area 
    // now starts at 280px from left due to ml-[280px] class
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left - DRAG.CENTER_NOTE_X_OFFSET, // Center the note
      y: e.clientY - rect.top - DRAG.CENTER_NOTE_Y_OFFSET
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
    
    setSelectedNoteUuid(note.uuid);
    
    setShowSearchSidebar(false);
    
    setTimeout(() => {
      const noteElement = document.querySelector(`[data-note-uuid="${note.uuid}"]`);
      if (noteElement) {
        noteElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
      }
    }, ANIMATION.SCROLL_TO_NOTE_DELAY);
  };

  const handleQuickNoteSelect = (note: Note) => {
    // If the note is from a different date, switch to that date first
    if (!isSameDay(note.date, selectedDate)) {
      setSelectedDate(new Date(note.date));
    }
    
    setSelectedNoteUuid(note.uuid);
    
    // Use setTimeout to ensure the date change has been processed
    setTimeout(() => {
      const noteElement = document.querySelector(`[data-note-uuid="${note.uuid}"]`);
      if (noteElement && containerRef.current) {
        // Get the note's position relative to the canvas
        const noteRect = noteElement.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Calculate the horizontal center position only
        const centerX = note.position.x - (containerRect.width / 2) + (noteRect.width / 2);
        
        // Scroll to center the note horizontally only
        containerRef.current.scrollTo({
          left: Math.max(0, centerX),
          behavior: 'smooth'
        });
      }
    }, ANIMATION.SCROLL_TO_NOTE_DELAY);
  };

  const handleNoteDetailStateChange = useCallback((_noteUuid: string, isOpen: boolean) => {
    setIsAnyNoteDetailOpen(isOpen);
  }, []);

  // Initialize z-indices for notes when notes list changes
  useEffect(() => {
    const newZIndices: Record<string, number> = {};
    let currentZIndex: number = Z_INDEX.NOTE_BASE;
    
    notes.forEach((note) => {
      // Keep existing z-index if note already has one, otherwise assign new incremental z-index
      if (noteZIndices[note.uuid]) {
        newZIndices[note.uuid] = noteZIndices[note.uuid];
        currentZIndex = Math.max(currentZIndex, (noteZIndices[note.uuid] || Z_INDEX.NOTE_BASE) + 1);
      } else {
        newZIndices[note.uuid] = currentZIndex++;
      }
    });
    
    // Only update if the new indices are actually different
    const hasChanges = notes.some(note => !noteZIndices[note.uuid]) || 
                       Object.keys(noteZIndices).length !== notes.length;
    
    if (hasChanges) {
      setNoteZIndices(newZIndices);
      setMaxZIndex(currentZIndex);
    }
  }, [notes, noteZIndices]);

  // Function to bring a note to the front
  const bringNoteToFront = useCallback((noteUuid: string) => {
    setNoteZIndices(prev => ({
      ...prev,
      [noteUuid]: maxZIndex
    }));
    setMaxZIndex(prev => prev + 1);
  }, [maxZIndex]);

  const displayedNotesCount = notes.filter(note => note.isDisplayed).length;

  // Calculate dynamic canvas dimensions based on note positions
  const calculateCanvasDimensions = useCallback(() => {
    if (notes.length === 0) {
      return {
        width: LAYOUT.DEFAULT_CANVAS_WIDTH, // Default width when no notes
        height: LAYOUT.DEFAULT_CANVAS_HEIGHT // Default height when no notes
      };
    }

    // Calculate the farthest note positions
    const noteWidth = NOTE_CARD.MIN_WIDTH; // From note-card.css min-width
    const noteHeight = NOTE_CARD.MIN_HEIGHT; // From note-card.css min-height
    const padding = LAYOUT.CANVAS_PADDING; // Extra padding around notes

    let maxX = 0;
    let maxY = 0;

    notes.forEach(note => {
      const noteRightEdge = note.position.x + noteWidth;
      const noteBottomEdge = note.position.y + noteHeight;
      
      maxX = Math.max(maxX, noteRightEdge);
      maxY = Math.max(maxY, noteBottomEdge);
    });

    // Ensure minimum size and add padding
    const minWidth = window.innerWidth - LAYOUT.SIDEBAR_WIDTH; // Subtract sidebar width
    const minHeight = window.innerHeight;
    
    return {
      width: Math.max(maxX + padding, minWidth) + 'px',
      height: Math.max(maxY + padding, minHeight) + 'px'
    };
  }, [notes]);

  const canvasDimensions = calculateCanvasDimensions();

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
    <div className="canvas-container group flex">
      {/* Left Sidebar Region */}
      <div className="fixed left-0 top-0 w-[280px] h-full z-40 flex flex-col">
        {/* Calendar Section */}
        <div className="bg-sidebar dark:bg-gray-800 border-r border-sidebar-border dark:border-gray-700 flex-shrink-0">
          {/* Date Title */}
          <div className="pt-4 pr-4 pb-4 pl-8 border-b border-gray-200 dark:border-gray-600">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {formatHeaderDate(selectedDate)}
            </h1>
          </div>
          
          {/* Calendar Widget Container */}
          <div className="p-4 relative">
            <CalendarSidebar
              allNotes={allNotes}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>
        </div>
        
        {/* Quick Note Tabs - Below Calendar */}
        <div className="bg-sidebar-secondary dark:bg-gray-900 border-r border-sidebar-border dark:border-gray-700 flex-1 overflow-hidden">
          <QuickNoteTabs
            notes={notes}
            onNoteSelect={handleQuickNoteSelect}
            selectedNoteUuid={selectedNoteUuid}
          />
        </div>
      </div>

      {/* Main Canvas Area */}
      <div 
        ref={containerRef}
        className={`flex-1 ml-[280px] relative overflow-x-auto overflow-y-hidden`}
        style={{ cursor: notes.length === 0 ? 'default' : (isDragging ? 'grabbing' : 'grab') }}
      >
        {/* Fixed Header Buttons */}
        <div className="fixed top-8 right-8 z-[9999] flex items-center gap-2">
          

          {/* Hide theme toggle and auth buttons when search sidebar is open */}
          {!showSearchSidebar && (
            <>
              {/* Search button */}
              <button
                onClick={handleSearchToggle}
                className={`flex items-center gap-2 px-3 py-2 backdrop-blur-sm border rounded-lg shadow-lg text-sm font-medium transition-colors ${
                  showSearchSidebar 
                    ? 'bg-blue-500/90 hover:bg-blue-600/90 border-blue-300 dark:border-blue-700 text-white' 
                    : 'bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100/90 dark:hover:bg-gray-700/90'
                }`}
                title="Search notes and tasks"
              >
                <Search size={16} />
                <span>Search</span>
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <User size={16} className="text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {user.username || user.email}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="px-3 py-2 bg-red-500/90 hover:bg-red-600/90 backdrop-blur-sm border border-red-300 dark:border-red-700 rounded-lg shadow-lg text-white text-sm font-medium transition-colors"
                    title="Logout"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500/90 hover:bg-blue-600/90 backdrop-blur-sm border border-blue-300 dark:border-blue-700 rounded-lg shadow-lg text-white text-sm font-medium transition-colors"
                  title="Login to sync your notes"
                >
                  <LogIn size={16} />
                  <span>Login</span>
                </button>
              )}
            </>
          )}
        </div>
        
        <div 
          className="canvas-scrollable-area relative" 
          onDoubleClick={handleCanvasDoubleClick}
          onMouseDown={notes.length > 0 ? handleMouseDown : undefined}
          style={{ 
            cursor: notes.length === 0 ? 'default' : (isDragging ? 'grabbing' : 'grab'),
            width: canvasDimensions.width,
            height: canvasDimensions.height,
            minWidth: canvasDimensions.width,
            minHeight: canvasDimensions.height
          }}
        >

          <div className={showSearchSidebar ? 'pointer-events-none' : ''}>
            {notes.map(note => (
              <NoteCard
                key={note.uuid}
                note={note}
                onUpdate={updateNote}
                onDelete={deleteNote}
                onDrag={showSearchSidebar ? () => {} : dragNote}
                onDragEnd={showSearchSidebar ? undefined : finalizeDrag}
                onMoveToDate={moveNoteToDate}
                onRefreshFromStorage={refreshNoteFromStorage}
                isSelected={selectedNoteUuid === note.uuid}
                onClearSelection={() => setSelectedNoteUuid(null)}
                onNoteDetailStateChange={handleNoteDetailStateChange}
                zIndex={noteZIndices[note.uuid] || 1}
                onBringToFront={() => bringNoteToFront(note.uuid)}
              />
            ))}
          </div>

          {/* Floating Action Buttons */}
          <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-20">
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
              disabled={showLoginModal || isCreating}
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
                <h2 className="text-2xl font-semibold mb-2">No notes for {formatDateKey(selectedDate)}</h2>
                <p className="text-lg">Double-click anywhere to add a note!</p>
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
    </div>
  );
};
