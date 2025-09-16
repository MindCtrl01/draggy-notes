import { useCallback, useState, useEffect } from 'react';
import { Note, NoteColor } from '@/domains/note';
// import { useNotesApi } from './use-notes-api'; // Temporarily disabled
import { useDebounce } from '@/hooks/common/use-debounce';
import { NotesStorage } from '@/helpers/notes-storage';
import { generateRandomNoteColor } from '@/helpers/color-generator';

export const useNotes = () => {
  // Local state management (API temporarily disabled)
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load notes from localStorage on initialization
  useEffect(() => {
    const loadNotes = () => {
      try {
        if (NotesStorage.isStorageAvailable()) {
          const savedNotes = NotesStorage.getAllNotes();
          setNotes(savedNotes);
        }
      } catch (error) {
        console.error('Failed to load notes from localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, []);

  // Disabled API integration
  // const {
  //   notes,
  //   isLoading,
  //   createNote: apiCreateNote,
  //   updateNote: apiUpdateNote,
  //   deleteNote: apiDeleteNote,
  //   isCreating,
  //   isUpdating,
  //   isDeleting,
  // } = useNotesApi();

  // Local state for optimistic updates during drag
  const [draggedNotes, setDraggedNotes] = useState<Record<string, { x: number; y: number }>>({});

  // Local functions (API temporarily disabled)
  // const debouncedUpdateNote = useDebounce(apiUpdateNote, 500); // 500ms debounce for content updates
  // const debouncedPositionUpdate = useDebounce(apiUpdateNote, 200); // 200ms debounce for position updates

  const createNote = useCallback((position?: { x: number; y: number }, content?: string) => {
    setIsCreating(true);
    
    // Generate a unique ID for the new note
    const newId = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create note with provided content or default placeholder
    const noteContent = content !== undefined ? content.trim() : 'Click to add content...';
    const randomColor = generateRandomNoteColor(); // Generate random hex color
    const defaultPosition = position || { 
      x: Math.random() * (window.innerWidth - 250), 
      y: Math.random() * (window.innerHeight - 200) + 100 
    };

    const newNote: Note = {
      id: newId,
      content: noteContent,
      color: randomColor,
      isDisplayed: true,
      position: defaultPosition,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to localStorage
    NotesStorage.saveNote(newNote);
    
    // Add note to local state
    setNotes(prevNotes => [...prevNotes, newNote]);
    
    // Simulate API delay
    setTimeout(() => {
      setIsCreating(false);
    }, 300);
  }, []);

  const updateNote = useCallback((updatedNote: Note) => {
    setIsUpdating(true);
    
    const noteToUpdate = { ...updatedNote, updatedAt: new Date() };
    
    // Save to localStorage
    NotesStorage.saveNote(noteToUpdate);
    
    // Update note in local state
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === updatedNote.id ? noteToUpdate : note
      )
    );
    
    // Simulate API delay
    setTimeout(() => {
      setIsUpdating(false);
    }, 200);
  }, []);

  const deleteNote = useCallback((id: string) => {
    setIsDeleting(true);
    
    // Remove from localStorage
    NotesStorage.deleteNote(id);
    
    // Remove note from local state
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    
    // Simulate API delay
    setTimeout(() => {
      setIsDeleting(false);
    }, 200);
  }, []);

  const clearAllDisplayedNotes = useCallback(() => {
    setIsDeleting(true);
    
    // Find all displayed notes
    const displayedNotes = notes.filter(note => note.isDisplayed);
    
    // Remove each displayed note from localStorage
    displayedNotes.forEach(note => {
      NotesStorage.deleteNote(note.id);
    });
    
    // Remove displayed notes from local state
    setNotes(prevNotes => prevNotes.filter(note => !note.isDisplayed));
    
    // Simulate API delay
    setTimeout(() => {
      setIsDeleting(false);
    }, 300);
  }, [notes]);

  const dragNote = useCallback((id: string, position: { x: number; y: number }) => {
    // Optimistic update for smooth dragging
    setDraggedNotes(prev => ({
      ...prev,
      [id]: position
    }));
  }, []);

  const finalizeDrag = useCallback((id: string, position: { x: number; y: number }) => {
    // Update the note position in local state when drag ends
    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => {
        if (note.id === id) {
          const updatedNote = { ...note, position, updatedAt: new Date() };
          // Save updated position to localStorage
          NotesStorage.saveNote(updatedNote);
          return updatedNote;
        }
        return note;
      });
      return updatedNotes;
    });
    
    // Clear the dragged state
    setDraggedNotes(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Merge notes with dragged positions for display
  const displayNotes = notes.map(note => ({
    ...note,
    position: draggedNotes[note.id] || note.position
  }));

  return {
    notes: displayNotes,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    clearAllDisplayedNotes,
    dragNote,
    finalizeDrag,
    
    // Loading states for UI feedback
    isCreating,
    isUpdating,
    isDeleting,
  };
};
