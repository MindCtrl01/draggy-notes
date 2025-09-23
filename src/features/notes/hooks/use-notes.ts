import { useCallback, useState, useEffect } from 'react';
import { Note } from '@/domains/note';
// import { useNotesApi } from './use-notes-api'; // Temporarily disabled
import { NotesStorage } from '@/helpers/notes-storage';
import { generateRandomNoteColor } from '@/helpers/color-generator';
import { formatDateKey, formatDateDisplay, formatDateInput, formatDateShort, isSameDay } from '@/helpers/date-helper';
import { LIMITS, ANIMATION } from '@/constants/ui-constants';
import { v7 as uuidv7 } from 'uuid';


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
    ? allNotes.filter(note => 
        isSameDay(note.date, selectedDate) || note.isPinned
      )
    : allNotes;

  const [draggedNotes, setDraggedNotes] = useState<Record<string, { x: number; y: number }>>({});

  const createNote = useCallback((position?: { x: number; y: number }, content?: string) => {
    setIsCreating(true);
    
    const noteContent = content !== undefined ? content.trim() : 'Click to add content...';
    const randomColor = generateRandomNoteColor(); // Generate random hex color
    const defaultPosition = position || { 
      x: Math.random() * (window.innerWidth - LIMITS.DEFAULT_POSITION_RANGE.X_MAX_OFFSET), 
      y: Math.random() * (window.innerHeight - LIMITS.DEFAULT_POSITION_RANGE.Y_MAX_OFFSET) + LIMITS.DEFAULT_POSITION_RANGE.Y_MIN_OFFSET 
    };

    const newNote: Note = {
      uuid: uuidv7(),
      title: 'New Note',
      content: noteContent,
      date: selectedDate || new Date(),
      color: randomColor,
      isDisplayed: true,
      position: defaultPosition,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: -1, // Temporary userId
      tagUuids: [], // Empty tagUuids initially
      isTaskMode: true, // Default to task mode
      noteTasks: [], // Initialize empty tasks array
    };

    NotesStorage.saveNote(newNote);
    setAllNotes(prevNotes => [...prevNotes, newNote]);
    
    // Simulate API delay
    setTimeout(() => {
      setIsCreating(false);
    }, ANIMATION.CREATE_NOTE_DELAY);
  }, [selectedDate]);

  const updateNote = useCallback((updatedNote: Note) => {
    setIsUpdating(true);
    
    const noteToUpdate = { ...updatedNote, updatedAt: new Date() };
    
    NotesStorage.saveNote(noteToUpdate);
    
    setAllNotes(prevNotes => 
      prevNotes.map(note => 
        note.uuid === updatedNote.uuid ? noteToUpdate : note
      )
    );
    
    // Simulate API delay
    setTimeout(() => {
      setIsUpdating(false);
    }, ANIMATION.UPDATE_NOTE_DELAY);
  }, []);

  const deleteNote = useCallback((uuid: string) => {
    setIsDeleting(true);
    
    NotesStorage.deleteNote(uuid);
    
    setAllNotes(prevNotes => prevNotes.filter(note => note.uuid !== uuid));
    
    // Simulate API delay
    setTimeout(() => {
      setIsDeleting(false);
    }, ANIMATION.UPDATE_NOTE_DELAY);
  }, []);

  const clearAllDisplayedNotes = useCallback(() => {
    setIsDeleting(true);
    
    const displayedNotes = notes.filter(note => note.isDisplayed);
    
    displayedNotes.forEach(note => {
      NotesStorage.deleteNote(note.uuid);
    });
    
    setAllNotes(prevNotes => prevNotes.filter(note => !displayedNotes.some(dn => dn.uuid === note.uuid)));
    
    // Simulate API delay
    setTimeout(() => {
      setIsDeleting(false);
    }, ANIMATION.CREATE_NOTE_DELAY);
  }, [notes]);

  const dragNote = useCallback((uuid: string, position: { x: number; y: number }) => {
    // Optimistic update for smooth dragging
    setDraggedNotes(prev => ({
      ...prev,
      [uuid]: position
    }));
  }, []);

  const finalizeDrag = useCallback((uuid: string, position: { x: number; y: number }) => {
    setAllNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => {
        if (note.uuid === uuid) {
          const updatedNote = { ...note, position, updatedAt: new Date() };
          NotesStorage.saveNote(updatedNote);
          return updatedNote;
        }
        return note;
      });
      return updatedNotes;
    });
    
    setDraggedNotes(prev => {
      const { [uuid]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const moveNoteToDate = useCallback((uuid: string, newDate: Date) => {
    setIsUpdating(true);
    
    setAllNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => {
        if (note.uuid === uuid) {
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
    }, ANIMATION.UPDATE_NOTE_DELAY);
  }, []);

  // Function to refresh a specific note from localStorage
  const refreshNoteFromStorage = useCallback((noteUuid: string) => {
    try {
      const updatedNote = NotesStorage.getNote(noteUuid);
      if (updatedNote) {
        setAllNotes(prevNotes => 
          prevNotes.map(note => 
            note.uuid === noteUuid ? updatedNote : note
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
    position: draggedNotes[note.uuid] || note.position
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

