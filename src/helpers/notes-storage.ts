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
      const key = `${STORAGE_PREFIX}-${note.uuid}`;
      const noteData = {
        ...note,
        id: note.id || 0,
        uuid: note.uuid,
        date: note.date.toISOString(),
        createdAt: note.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: note.updatedAt?.toISOString() || new Date().toISOString(),
        userId: note.userId || -1, // Default to -1 if not set
        tags: note.tags || [], // Default to empty array if not set
        isPinned: note.isPinned || false, // Default to false if not set
        // sync properties - preserve tracking fields
        syncVersion: note.syncVersion || 1,
        localVersion: note.localVersion || 1,
        lastSyncedAt: note.lastSyncedAt?.toISOString() || new Date().toISOString(),
        clientUpdatedAt: note.clientUpdatedAt?.toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(noteData));
      
      // Update the notes list
      this.updateNotesList(note.uuid, 'add');
    } catch (error) {
      console.error('Failed to save note to localStorage:', error);
    }
  }

  /**
   * Retrieve a note from localStorage by UUID
   * @param noteUuid - The UUID of the note to retrieve
   * @returns The note or null if not found
   */
  static getNote(noteUuid: string): Note | null {
    try {
      const key = `${STORAGE_PREFIX}-${noteUuid}`;
      const noteData = localStorage.getItem(key);
      
      if (!noteData) return null;
      
      const parsed = JSON.parse(noteData);
      return {
        ...parsed,
        id: parsed.id || 0,
        uuid: parsed.uuid,
        date: new Date(parsed.date),
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
        userId: parsed.userId || -1, // Default to -1 if not set
        tags: parsed.tags || [], // Default to empty array if not set
        isPinned: parsed.isPinned || false, // Default to false if not set
        // sync properties - restore tracking fields
        syncVersion: parsed.syncVersion || 1,
        localVersion: parsed.localVersion || 1,
        lastSyncedAt: new Date(parsed.lastSyncedAt || parsed.updatedAt || new Date()),
        clientUpdatedAt: parsed.clientUpdatedAt ? new Date(parsed.clientUpdatedAt) : undefined,
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
      const noteUuids = this.getNotesList();
      const notes: Note[] = [];
      
      for (const noteUuid of noteUuids) {
        const note = this.getNote(noteUuid);
        if (note) {
          notes.push(note);
        }
      }
      
      // Sort by creation date (newest first)
      return notes.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    } catch (error) {
      console.error('Failed to retrieve all notes from localStorage:', error);
      return [];
    }
  }

  /**
   * Delete a note from localStorage
   * @param noteUuid - The UUID of the note to delete
   */
  static deleteNote(noteUuid: string): void {
    try {
      const key = `${STORAGE_PREFIX}-${noteUuid}`;
      localStorage.removeItem(key);
      
      // Update the notes list
      this.updateNotesList(noteUuid, 'remove');
    } catch (error) {
      console.error('Failed to delete note from localStorage:', error);
    }
  }

  /**
   * Clear all notes from localStorage
   */
  static clearAllNotes(): void {
    try {
      const noteUuids = this.getNotesList();
      
      // Remove each note
      for (const noteUuid of noteUuids) {
        const key = `${STORAGE_PREFIX}-${noteUuid}`;
        localStorage.removeItem(key);
      }

    } catch (error) {
      console.error('Failed to clear all notes from localStorage:', error);
    }
  }

  /**
   * Get the list of note UUIDs from localStorage
   * @returns Array of note UUIDs
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
   * @param noteUuid - The note UUID to add or remove
   * @param action - Whether to add or remove the note UUID
   */
  private static updateNotesList(noteUuid: string, action: 'add' | 'remove'): void {
    try {
      let noteUuids = this.getNotesList();
      
      if (action === 'add') {
        if (!noteUuids.includes(noteUuid)) {
          noteUuids.push(noteUuid);
        }
      } else if (action === 'remove') {
        noteUuids = noteUuids.filter(uuid => uuid !== noteUuid);
      }
      
      localStorage.setItem(NOTES_LIST_KEY, JSON.stringify(noteUuids));
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

  /**
   * Force reload all notes from localStorage (fresh read)
   * This method bypasses any caching and reads directly from localStorage
   * @returns Array of all notes freshly loaded from localStorage
   */
  static forceReloadAllNotes(): Note[] {
    try {
      console.log('Force reloading all notes from localStorage...');
      
      // Get fresh list of note UUIDs from localStorage
      const noteUuids = this.getNotesList();
      const notes: Note[] = [];
      
      for (const noteUuid of noteUuids) {
        // Force fresh read of each note
        const note = this.getNote(noteUuid);
        if (note) {
          notes.push(note);
        } else {
          console.warn(`Note ${noteUuid} found in list but not in storage - cleaning up`);
          // Clean up orphaned UUID from list
          this.updateNotesList(noteUuid, 'remove');
        }
      }
      
      // Sort by creation date (newest first)
      const sortedNotes = notes.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      
      console.log(`Force reloaded ${sortedNotes.length} notes from localStorage`);
      return sortedNotes;
    } catch (error) {
      console.error('Failed to force reload notes from localStorage:', error);
      return [];
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
  forceReloadAllNotes,
} = NotesStorage;
