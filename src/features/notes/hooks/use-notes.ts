import { useCallback, useState } from 'react';
import { Note, NoteColor } from '@/types/note';
import { useNotesApi } from './use-notes-api';
import { useDebounce } from '@/hooks/common/use-debounce';

const NOTE_COLORS: NoteColor[] = ['yellow', 'pink', 'blue', 'green', 'purple', 'orange'];

export const useNotes = () => {
  const {
    notes,
    isLoading,
    createNote: apiCreateNote,
    updateNote: apiUpdateNote,
    deleteNote: apiDeleteNote,
    isCreating,
    isUpdating,
    isDeleting,
  } = useNotesApi();

  // Local state for optimistic updates during drag
  const [draggedNotes, setDraggedNotes] = useState<Record<string, { x: number; y: number }>>({});

  // Debounced API calls to reduce spam
  const debouncedUpdateNote = useDebounce(apiUpdateNote, 500); // 500ms debounce for content updates
  const debouncedPositionUpdate = useDebounce(apiUpdateNote, 200); // 200ms debounce for position updates

  const createNote = useCallback((position?: { x: number; y: number }, content?: string) => {
    // Only create note if content is provided and not empty
    const noteContent = content?.trim() || '';
    if (!noteContent) {
      return;
    }

    // Create note with actual content
    const randomColor = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
    const defaultPosition = position || { 
      x: Math.random() * (window.innerWidth - 250), 
      y: Math.random() * (window.innerHeight - 200) + 100 
    };

    apiCreateNote({
      content: noteContent,
      color: randomColor,
      position: defaultPosition,
    });
  }, [apiCreateNote]);

  const updateNote = useCallback((updatedNote: Note) => {
    // Only update if content is not empty (unless it's a placeholder)
    if (updatedNote.content.trim() === '' && updatedNote.content !== 'Click to add content...') {
      return; // Don't save empty content
    }

    // Use debounced API call for content updates
    debouncedUpdateNote(updatedNote.id, {
      content: updatedNote.content,
      color: updatedNote.color,
      position: updatedNote.position,
    });
  }, [debouncedUpdateNote]);

  const deleteNote = useCallback((id: string) => {
    // Call API to delete note
    apiDeleteNote(id);
  }, [apiDeleteNote]);

  const dragNote = useCallback((id: string, position: { x: number; y: number }) => {
    // Optimistic update for smooth dragging
    setDraggedNotes(prev => ({
      ...prev,
      [id]: position
    }));
  }, []);

  const finalizeDrag = useCallback((id: string, position: { x: number; y: number }) => {
    // Update the note position via API when drag ends (with shorter debounce for position updates)
    const note = notes.find(n => n.id === id);
    if (note) {
      debouncedPositionUpdate(id, { position });
    }
    
    // Clear the dragged state
    setDraggedNotes(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, [notes, debouncedPositionUpdate]);

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
