import { useCallback, useState, useEffect } from 'react';
import { Note } from '@/domains/note';
// import { useNotesApi } from './use-notes-api'; // Temporarily disabled
import { useDebounce } from '@/hooks/common/use-debounce';
import { NotesStorage } from '@/helpers/notes-storage';
import { generateRandomNoteColor } from '@/helpers/color-generator';
import { formatDateKey, formatDateDisplay, formatDateInput, formatDateShort, isSameDay } from '@/helpers/date-helper';


export const useNotes = (selectedDate?: Date) => {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
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
          setAllNotes(savedNotes);
        }
      } catch (error) {
        console.error('Failed to load notes from localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, []);

  const notes = selectedDate
    ? allNotes.filter(note => isSameDay(note.date, selectedDate))
    : allNotes;

  const [draggedNotes, setDraggedNotes] = useState<Record<string, { x: number; y: number }>>({});

  const createNote = useCallback((position?: { x: number; y: number }, content?: string) => {
    setIsCreating(true);
    
    const newId = `note-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    const noteContent = content !== undefined ? content.trim() : 'Double-click to add content...';
    const randomColor = generateRandomNoteColor(); // Generate random hex color
    const defaultPosition = position || { 
      x: Math.random() * (window.innerWidth - 250), 
      y: Math.random() * (window.innerHeight - 200) + 100 
    };

    const newNote: Note = {
      id: newId,
      title: 'New Note',
      content: noteContent,
      date: selectedDate || new Date(),
      color: randomColor,
      isDisplayed: true,
      position: defaultPosition,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    NotesStorage.saveNote(newNote);
    setAllNotes(prevNotes => [...prevNotes, newNote]);
    
    // Simulate API delay
    setTimeout(() => {
      setIsCreating(false);
    }, 300);
  }, [selectedDate]);

  const updateNote = useCallback((updatedNote: Note) => {
    setIsUpdating(true);
    
    const noteToUpdate = { ...updatedNote, updatedAt: new Date() };
    
    NotesStorage.saveNote(noteToUpdate);
    
    setAllNotes(prevNotes => 
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
    
    NotesStorage.deleteNote(id);
    
    setAllNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    
    // Simulate API delay
    setTimeout(() => {
      setIsDeleting(false);
    }, 200);
  }, []);

  const clearAllDisplayedNotes = useCallback(() => {
    setIsDeleting(true);
    
    const displayedNotes = notes.filter(note => note.isDisplayed);
    
    displayedNotes.forEach(note => {
      NotesStorage.deleteNote(note.id);
    });
    
    setAllNotes(prevNotes => prevNotes.filter(note => !displayedNotes.some(dn => dn.id === note.id)));
    
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
    setAllNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => {
        if (note.id === id) {
          const updatedNote = { ...note, position, updatedAt: new Date() };
          NotesStorage.saveNote(updatedNote);
          return updatedNote;
        }
        return note;
      });
      return updatedNotes;
    });
    
    setDraggedNotes(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const moveNoteToDate = useCallback((id: string, newDate: Date) => {
    setIsUpdating(true);
    
    setAllNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => {
        if (note.id === id) {
          const updatedNote = { ...note, date: newDate, updatedAt: new Date() };
          NotesStorage.saveNote(updatedNote);
          return updatedNote;
        }
        return note;
      });
      return updatedNotes;
    });
    
    // Simulate API delay
    setTimeout(() => {
      setIsUpdating(false);
    }, 200);
  }, []);

  // Function to refresh a specific note from localStorage
  const refreshNoteFromStorage = useCallback((noteId: string) => {
    try {
      const updatedNote = NotesStorage.getNote(noteId);
      if (updatedNote) {
        setAllNotes(prevNotes => 
          prevNotes.map(note => 
            note.id === noteId ? updatedNote : note
          )
        );
      }
    } catch (error) {
      console.error('Failed to refresh note from localStorage:', error);
    }
  }, []);

  // Merge notes with dragged positions for display
  const displayNotes = notes.map(note => ({
    ...note,
    position: draggedNotes[note.id] || note.position
  }));

    return {
      notes: displayNotes,
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
      
      // Loading states for UI feedback
      isCreating,
      isUpdating,
      isDeleting,
      
      // Helper functions
      formatDateKey,
      formatDateDisplay,
      formatDateInput,
      formatDateShort,
      isSameDay,
    };
  };

  export { formatDateKey, formatDateDisplay, formatDateInput, formatDateShort, isSameDay };

