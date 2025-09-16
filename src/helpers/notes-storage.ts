import { Note } from '@/domains/note';

// Storage keys
const STORAGE_PREFIX = 'draggy-notes';
const NOTES_LIST_KEY = `${STORAGE_PREFIX}-list`;

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
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
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
  static getNote(noteId: string): Note | null {
    try {
      const key = `${STORAGE_PREFIX}-${noteId}`;
      const noteData = localStorage.getItem(key);
      
      if (!noteData) return null;
      
      const parsed = JSON.parse(noteData);
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
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
  static deleteNote(noteId: string): void {
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
  private static getNotesList(): string[] {
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
  private static updateNotesList(noteId: string, action: 'add' | 'remove'): void {
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
}

// Export individual functions for convenience
export const {
  saveNote,
  getNote,
  getAllNotes,
  deleteNote,
  clearAllNotes,
  isStorageAvailable,
} = NotesStorage;
