import { useCallback, useState } from 'react';
import { Note, NoteColor } from '@/domains/note';
// import { useNotesApi } from './use-notes-api'; // Temporarily disabled
import { useDebounce } from '@/hooks/common/use-debounce';

const NOTE_COLORS: NoteColor[] = ['yellow', 'pink', 'blue', 'green', 'purple', 'orange'];

export const useNotes = () => {
  // Local state management (API temporarily disabled)
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    
    // Create note with default content or provided content
    const noteContent = content?.trim() || 'Click to add content...';
    const randomColor = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
    const defaultPosition = position || { 
      x: Math.random() * (window.innerWidth - 250), 
      y: Math.random() * (window.innerHeight - 200) + 100 
    };

    const newNote: Note = {
      id: newId,
      content: noteContent,
      color: randomColor,
      position: defaultPosition,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add note to local state
    setNotes(prevNotes => [...prevNotes, newNote]);
    
    // Simulate API delay
    setTimeout(() => {
      setIsCreating(false);
    }, 300);
  }, []);

  const updateNote = useCallback((updatedNote: Note) => {
    setIsUpdating(true);
    
    // Update note in local state
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === updatedNote.id 
          ? { ...updatedNote, updatedAt: new Date() }
          : note
      )
    );
    
    // Simulate API delay
    setTimeout(() => {
      setIsUpdating(false);
    }, 200);
  }, []);

  const deleteNote = useCallback((id: string) => {
    setIsDeleting(true);
    
    // Remove note from local state
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    
    // Simulate API delay
    setTimeout(() => {
      setIsDeleting(false);
    }, 200);
  }, []);

  const dragNote = useCallback((id: string, position: { x: number; y: number }) => {
    // Optimistic update for smooth dragging
    setDraggedNotes(prev => ({
      ...prev,
      [id]: position
    }));
  }, []);

  const finalizeDrag = useCallback((id: string, position: { x: number; y: number }) => {
    // Update the note position in local state when drag ends
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === id 
          ? { ...note, position, updatedAt: new Date() }
          : note
      )
    );
    
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
    dragNote,
    finalizeDrag,
    
    // Loading states for UI feedback
    isCreating,
    isUpdating,
    isDeleting,
  };
};
