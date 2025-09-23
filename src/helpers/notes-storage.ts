import { Note } from '@/domains/note';

// Storage keys
const STORAGE_PREFIX = 'draggy-notes';
const NOTES_LIST_KEY = `${STORAGE_PREFIX}-list`;
const CANVAS_PREFIX = 'canvas';
const RECENT_CANVAS_KEY = 'recent-canvas-date';

/**
 * Helper functions for managing notes in localStorage
 */
export class NotesStorage {
  /**
   * Save a note to localStorage
   * @param note - The note to save
   */
  static saveNote(note: Note): void {
    try {
      const key = `${STORAGE_PREFIX}-${note.id}`;
      const noteData = {
        ...note,
        date: note.date.toISOString(),
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
        userId: note.userId || -1, // Default to -1 if not set
        tagIds: note.tagIds || [], // Default to empty array if not set
        isPinned: note.isPinned || false, // Default to false if not set
      };
      localStorage.setItem(key, JSON.stringify(noteData));
      
      // Update the notes list
      this.updateNotesList(note.id, 'add');
    } catch (error) {
      console.error('Failed to save note to localStorage:', error);
    }
  }

  /**
   * Retrieve a note from localStorage by ID
   * @param noteId - The ID of the note to retrieve
   * @returns The note or null if not found
   */
  static getNote(noteId: number): Note | null {
    try {
      const key = `${STORAGE_PREFIX}-${noteId}`;
      const noteData = localStorage.getItem(key);
      
      if (!noteData) return null;
      
      const parsed = JSON.parse(noteData);
      return {
        ...parsed,
        date: new Date(parsed.date),
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
        userId: parsed.userId || -1, // Default to -1 if not set
        tagIds: parsed.tagIds || [], // Default to empty array if not set
        isPinned: parsed.isPinned || false, // Default to false if not set
      };
    } catch (error) {
      console.error('Failed to retrieve note from localStorage:', error);
      return null;
    }
  }

  /**
   * Retrieve all notes from localStorage
   * @returns Array of all notes
   */
  static getAllNotes(): Note[] {
    try {
      const noteIds = this.getNotesList();
      const notes: Note[] = [];
      
      for (const noteId of noteIds) {
        const note = this.getNote(noteId);
        if (note) {
          notes.push(note);
        }
      }
      
      // Sort by creation date (newest first)
      return notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Failed to retrieve all notes from localStorage:', error);
      return [];
    }
  }

  /**
   * Delete a note from localStorage
   * @param noteId - The ID of the note to delete
   */
  static deleteNote(noteId: number): void {
    try {
      const key = `${STORAGE_PREFIX}-${noteId}`;
      localStorage.removeItem(key);
      
      // Update the notes list
      this.updateNotesList(noteId, 'remove');
    } catch (error) {
      console.error('Failed to delete note from localStorage:', error);
    }
  }

  /**
   * Clear all notes from localStorage
   */
  static clearAllNotes(): void {
    try {
      const noteIds = this.getNotesList();
      
      // Remove each note
      for (const noteId of noteIds) {
        const key = `${STORAGE_PREFIX}-${noteId}`;
        localStorage.removeItem(key);
      }
      
      // Clear the notes list
      localStorage.removeItem(NOTES_LIST_KEY);
    } catch (error) {
      console.error('Failed to clear all notes from localStorage:', error);
    }
  }

  /**
   * Get the list of note IDs from localStorage
   * @returns Array of note IDs
   */
  private static getNotesList(): number[] {
    try {
      const listData = localStorage.getItem(NOTES_LIST_KEY);
      return listData ? JSON.parse(listData) : [];
    } catch (error) {
      console.error('Failed to get notes list from localStorage:', error);
      return [];
    }
  }

  /**
   * Update the notes list in localStorage
   * @param noteId - The note ID to add or remove
   * @param action - Whether to add or remove the note ID
   */
  private static updateNotesList(noteId: number, action: 'add' | 'remove'): void {
    try {
      let noteIds = this.getNotesList();
      
      if (action === 'add') {
        if (!noteIds.includes(noteId)) {
          noteIds.push(noteId);
        }
      } else if (action === 'remove') {
        noteIds = noteIds.filter(id => id !== noteId);
      }
      
      localStorage.setItem(NOTES_LIST_KEY, JSON.stringify(noteIds));
    } catch (error) {
      console.error('Failed to update notes list in localStorage:', error);
    }
  }

  /**
   * Check if localStorage is available
   * @returns True if localStorage is available
   */
  static isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Save canvas data to localStorage with note count for the date
   * @param date - The date to save canvas data for
   * @param noteCount - Number of notes for this date
   */
  static saveCanvasData(date: string, noteCount: number): void {
    try {
      const canvasKey = `${CANVAS_PREFIX}_${date}`;
      if (noteCount > 0) {
        localStorage.setItem(canvasKey, noteCount.toString());
      } else {
        // Remove canvas data when no notes exist for this date
        localStorage.removeItem(canvasKey);
      }
    } catch (error) {
      console.error('Failed to save canvas data to localStorage:', error);
    }
  }

  /**
   * Get canvas data from localStorage
   * @param date - The date to get canvas data for
   * @returns Number of notes for the date or null if not found
   */
  static getCanvasData(date: string): number | null {
    try {
      const canvasKey = `${CANVAS_PREFIX}_${date}`;
      const data = localStorage.getItem(canvasKey);
      return data ? parseInt(data, 10) : null;
    } catch (error) {
      console.error('Failed to get canvas data from localStorage:', error);
      return null;
    }
  }

  /**
   * Save the most recent viewed canvas date
   * @param date - The date key to save as most recent
   */
  static saveRecentCanvasDate(date: string): void {
    try {
      const canvasKey = `${CANVAS_PREFIX}_${date}`;
      localStorage.setItem(RECENT_CANVAS_KEY, canvasKey);
    } catch (error) {
      console.error('Failed to save recent canvas date to localStorage:', error);
    }
  }

  /**
   * Get the most recent viewed canvas date
   * @returns The most recent canvas key or null if not found
   */
  static getRecentCanvasDate(): string | null {
    try {
      return localStorage.getItem(RECENT_CANVAS_KEY);
    } catch (error) {
      console.error('Failed to get recent canvas date from localStorage:', error);
      return null;
    }
  }

  /**
   * Get notes count by date
   * @param date - The date to count notes for
   * @returns Number of notes for the specified date
   */
  static getNotesCountByDate(date: string): number {
    try {
      const allNotes = this.getAllNotes();
      const dateKey = date;
      return allNotes.filter(note => {
        const noteDate = note.date.toISOString().split('T')[0];
        return noteDate === dateKey;
      }).length;
    } catch (error) {
      console.error('Failed to get notes count by date:', error);
      return 0;
    }
  }
}

// Export individual functions for convenience
export const {
  saveNote,
  getNote,
  getAllNotes,
  deleteNote,
  clearAllNotes,
  isStorageAvailable,
  saveCanvasData,
  getCanvasData,
  saveRecentCanvasDate,
  getRecentCanvasDate,
  getNotesCountByDate,
} = NotesStorage;
