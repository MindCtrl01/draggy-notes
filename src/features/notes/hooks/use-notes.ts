import { useCallback, useState, useEffect } from 'react';
import { Note } from '@/domains/note';
import { NotesSyncService } from '@/services/notes-sync-service';
import { NotesStorage } from '@/helpers/notes-storage';
import { generateRandomNoteColor } from '@/helpers/color-generator';
import { formatDateKey, formatDateDisplay, formatDateInput, formatDateShort, isSameDay } from '@/helpers/date-helper';
import { LIMITS, ANIMATION } from '@/constants/ui-constants';
import { v7 as uuidv7 } from 'uuid';
import { API } from '@/constants/ui-constants';


export const useNotes = (selectedDate?: Date, isAuthenticated?: boolean) => {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load notes from API and localStorage on initialization and when authentication changes
  useEffect(() => {
    const loadNotes = async () => {
      setIsLoading(true);
      try {
        const notes = await NotesSyncService.loadAllNotes();
        setAllNotes(notes);
        console.log(`Loaded ${notes.length} notes (authenticated: ${isAuthenticated})`);
      } catch (error) {
        console.error('Failed to load notes:', error);
        // Fallback to localStorage only
        try {
          if (NotesStorage.isStorageAvailable()) {
            const savedNotes = NotesStorage.getAllNotes();
            setAllNotes(savedNotes);
            console.log(`Fallback: Loaded ${savedNotes.length} notes from localStorage`);
          }
        } catch (localError) {
          console.error('Failed to load notes from localStorage:', localError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, [isAuthenticated]); // Add isAuthenticated as dependency

  const notes = selectedDate
    ? allNotes.filter(note => 
        !note.isDeleted && (isSameDay(note.date, selectedDate) || note.isPinned)
      )
    : allNotes.filter(note => !note.isDeleted);

  const [draggedNotes, setDraggedNotes] = useState<Record<string, { x: number; y: number }>>({});

  const createNote = useCallback(async (position?: { x: number; y: number }, content?: string) => {
    setIsCreating(true);
    
    const noteContent = content !== undefined ? content.trim() : 'Click to add content...';
    const randomColor = generateRandomNoteColor(); // Generate random hex color
    const defaultPosition = position || { 
      x: Math.random() * (window.innerWidth - LIMITS.DEFAULT_POSITION_RANGE.X_MAX_OFFSET), 
      y: Math.random() * (window.innerHeight - LIMITS.DEFAULT_POSITION_RANGE.Y_MAX_OFFSET) + LIMITS.DEFAULT_POSITION_RANGE.Y_MIN_OFFSET 
    };

    const newNote: Note = {
      id: API.DEFAULT_IDS.NEW_ENTITY,
      uuid: uuidv7(),
      title: 'New Note',
      content: noteContent,
      date: selectedDate || new Date(),
      color: randomColor,
      isDisplayed: true,
      position: defaultPosition,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: API.DEFAULT_IDS.TEMPORARY_USER, // Temporary userId
      tags: [], // Empty tags initially
      isTaskMode: true, // Default to task mode
      noteTasks: [], // Initialize empty tasks array
      isDeleted: false, // New notes are not deleted by default
      isPinned: false,
      // sync properties - initialize for tracking
      syncVersion: 1, // Start with version 1 for new notes
      lastSyncedAt: new Date(), // Will be updated by server after first sync
      clientUpdatedAt: new Date(), // Set when client creates the note
    };

    // Optimistically add to UI
    setAllNotes(prevNotes => [...prevNotes, newNote]);
    
    try {
      // Sync with API and localStorage
      const syncedNote = await NotesSyncService.createNote(newNote);
      
      // Update with synced version (may have server-generated ID)
      setAllNotes(prevNotes => 
        prevNotes.map(note => 
          note.uuid === newNote.uuid ? syncedNote : note
        )
      );
    } catch (error) {
      console.error('Failed to sync created note:', error);
      // Note is already in the UI and localStorage, so we continue
    } finally {
      // Simulate API delay for smooth UX
      setTimeout(() => {
        setIsCreating(false);
      }, ANIMATION.CREATE_NOTE_DELAY);
    }
  }, [selectedDate]);

  const updateNote = useCallback(async (updatedNote: Note) => {
    setIsUpdating(true);
    
    const noteToUpdate = { 
      ...updatedNote, 
      updatedAt: new Date(),
      clientUpdatedAt: new Date() // Update client timestamp for sync tracking
    };
    
    // Optimistically update UI
    setAllNotes(prevNotes => 
      prevNotes.map(note => 
        note.uuid === updatedNote.uuid ? noteToUpdate : note
      )
    );
    
    try {
      // Sync with API and localStorage
      const syncedNote = await NotesSyncService.updateNote(noteToUpdate);
      
      // Update with synced version
      setAllNotes(prevNotes => 
        prevNotes.map(note => 
          note.uuid === updatedNote.uuid ? syncedNote : note
        )
      );
    } catch (error) {
      console.error('Failed to sync updated note:', error);
      // Note is already updated in UI and localStorage, so we continue
    } finally {
      // Simulate API delay for smooth UX
      setTimeout(() => {
        setIsUpdating(false);
      }, ANIMATION.UPDATE_NOTE_DELAY);
    }
  }, []);

  const deleteNote = useCallback(async (id: number, uuid: string) => {
    setIsDeleting(true);
    
    // Optimistically remove from UI
    setAllNotes(prevNotes => prevNotes.filter(note => note.uuid !== uuid));
    
    try {
      // Sync with API and localStorage
      await NotesSyncService.deleteNote(id, uuid);
    } catch (error) {
      console.error('Failed to sync deleted note:', error);
      // Note is already removed from UI and localStorage, so we continue
    } finally {
      // Simulate API delay for smooth UX
      setTimeout(() => {
        setIsDeleting(false);
      }, ANIMATION.UPDATE_NOTE_DELAY);
    }
  }, []);

  const clearAllDisplayedNotes = useCallback(async () => {
    setIsDeleting(true);
    
    const displayedNotes = notes.filter(note => note.isDisplayed);
    
    // Optimistically remove from UI
    setAllNotes(prevNotes => prevNotes.filter(note => !displayedNotes.some(dn => dn.uuid === note.uuid)));
    
    try {
      // Sync deletions with API and localStorage
      await Promise.all(
        displayedNotes.map(note => NotesSyncService.deleteNote(note.id, note.uuid))
      );
    } catch (error) {
      console.error('Failed to sync batch delete:', error);
      // Notes are already removed from UI and localStorage, so we continue
    } finally {
      // Simulate API delay for smooth UX
      setTimeout(() => {
        setIsDeleting(false);
      }, ANIMATION.CREATE_NOTE_DELAY);
    }
  }, [notes]);

  const dragNote = useCallback((uuid: string, position: { x: number; y: number }) => {
    // Optimistic update for smooth dragging
    setDraggedNotes(prev => ({
      ...prev,
      [uuid]: position
    }));
  }, []);

  const finalizeDrag = useCallback(async (uuid: string, position: { x: number; y: number }) => {
    // Update UI immediately
    setAllNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => {
        if (note.uuid === uuid) {
          return { ...note, position, updatedAt: new Date() };
        }
        return note;
      });
      return updatedNotes;
    });
    
    setDraggedNotes(prev => {
      const { [uuid]: _, ...rest } = prev;
      return rest;
    });

    try {
      // Find the note to sync
      const noteToUpdate = allNotes.find(note => note.uuid === uuid);
      if (noteToUpdate) {
        const updatedNote = { ...noteToUpdate, position, updatedAt: new Date() };
        await NotesSyncService.updateNote(updatedNote);
      }
    } catch (error) {
      console.error('Failed to sync drag position:', error);
      // Position is already updated in UI and localStorage, so we continue
    }
  }, [allNotes]);

  const moveNoteToDate = useCallback(async (uuid: string, newDate: Date) => {
    setIsUpdating(true);
    
    // Update UI immediately
    setAllNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => {
        if (note.uuid === uuid) {
          return { ...note, date: newDate, updatedAt: new Date() };
        }
        return note;
      });
      return updatedNotes;
    });
    
    try {
      // Find the note to sync
      const noteToUpdate = allNotes.find(note => note.uuid === uuid);
      if (noteToUpdate) {
        const updatedNote = { ...noteToUpdate, date: newDate, updatedAt: new Date() };
        await NotesSyncService.updateNote(updatedNote);
      }
    } catch (error) {
      console.error('Failed to sync note date move:', error);
      // Date is already updated in UI and localStorage, so we continue
    } finally {
      // Simulate API delay for smooth UX
      setTimeout(() => {
        setIsUpdating(false);
      }, ANIMATION.UPDATE_NOTE_DELAY);
    }
  }, [allNotes]);

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

