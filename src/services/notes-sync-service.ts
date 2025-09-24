import { Note } from '@/domains/note';
import { notesApi } from './api/notes-api';
import { authApi } from './api/auth-api';
import { NotesStorage } from '@/helpers/notes-storage';
import { 
  transformNoteToCreateRequest, 
  transformNoteToUpdateRequest, 
  transformNoteResponseToNote 
} from './api/transformers/note-transformers';
import { API } from '@/constants/ui-constants';
// Note: ApiError is available but not used directly in this service

/**
 * Service that handles synchronization between API and localStorage
 * For authenticated users: tries API first, falls back to localStorage-only operations
 * For unauthenticated users: uses localStorage only, no API calls
 */
export class NotesSyncService {
  /**
   * Check if user is authenticated
   */
  private static isAuthenticated(): boolean {
    return authApi.isAuthenticated();
  }
  /**
   * Create a note both in API and localStorage (authenticated) or localStorage only (unauthenticated)
   */
  static async createNote(note: Note): Promise<Note> {
    // Always save to localStorage first for immediate UI feedback
    NotesStorage.saveNote(note);
    
    // If user is not authenticated, only use localStorage
    if (!this.isAuthenticated()) {
      console.log('User not authenticated, using localStorage only for note creation');
      return note;
    }
    
    try {
      // Try to sync with API
      const createRequest = transformNoteToCreateRequest(note);
      const apiResponse = await notesApi.createNote(createRequest);
      
      // Transform API response back to domain model
      const syncedNote = transformNoteResponseToNote(apiResponse);
      
      // Update localStorage with the synced version (includes server-generated ID)
      NotesStorage.saveNote(syncedNote);
      
      return syncedNote;
    } catch (error) {
      console.warn('Failed to create note via API, using localStorage only:', error);
      
      // If API fails, return the original note (already saved to localStorage)
      return note;
    }
  }

  /**
   * Update a note both in API and localStorage (authenticated) or localStorage only (unauthenticated)
   */
  static async updateNote(note: Note): Promise<Note> {
    // Always save to localStorage first for immediate UI feedback
    NotesStorage.saveNote(note);
    
    // If user is not authenticated, only use localStorage
    if (!this.isAuthenticated()) {
      console.log('User not authenticated, using localStorage only for note update');
      return note;
    }
    
    // If note has id = 0, it's not synced yet - only update localStorage
    if (note.id === API.DEFAULT_IDS.NEW_ENTITY) {
      console.log('Note has id = 0, updating localStorage only (not synced yet)');
      return note;
    }
    
    try {
      // Try to sync with API
      const updateRequest = transformNoteToUpdateRequest(note);
      const apiResponse = await notesApi.updateNote(updateRequest);
      
      // Transform API response back to domain model
      const syncedNote = transformNoteResponseToNote(apiResponse);
      
      // Update localStorage with the synced version
      NotesStorage.saveNote(syncedNote);
      
      return syncedNote;
    } catch (error) {
      console.warn('Failed to update note via API, using localStorage only:', error);
      
      // If API fails, return the original note (already saved to localStorage)
      return note;
    }
  }

  /**
   * Delete a note both from API and localStorage (authenticated) or localStorage only (unauthenticated)
   */
  static async deleteNote(id: number, uuid: string): Promise<void> {
    // If user is not authenticated, only delete from localStorage
    if (!this.isAuthenticated()) {
      console.log('User not authenticated, deleting from localStorage only');
      NotesStorage.deleteNote(uuid);
      return;
    }
    
    // If note has id = 0, it's not synced yet - only delete from localStorage
    if (id === API.DEFAULT_IDS.NEW_ENTITY) {
      console.log('Note has id = 0, deleting from localStorage only (not synced yet)');
      NotesStorage.deleteNote(uuid);
      return;
    }
    
    try {
      // Try to delete from API first
      await notesApi.deleteNote({ id });
      
      // If API succeeds, remove from localStorage
      NotesStorage.deleteNote(uuid);
    } catch (error) {
      console.warn('Failed to delete note via API, deleting from localStorage only:', error);
      
      // If API fails, still remove from localStorage
      NotesStorage.deleteNote(uuid);
    }
  }

  /**
   * Load all notes, preferring API but falling back to localStorage (authenticated) or localStorage only (unauthenticated)
   */
  static async loadAllNotes(): Promise<Note[]> {
    // If user is not authenticated, only use localStorage
    if (!this.isAuthenticated()) {
      console.log('User not authenticated, loading notes from localStorage only');
      return NotesStorage.getAllNotes();
    }
    
    try {
      // Try to load from API first
      const apiResponse = await notesApi.getAllNotes();
      const apiNotes = apiResponse.map(transformNoteResponseToNote);
      
      // Sync API notes to localStorage
      apiNotes.forEach(note => {
        NotesStorage.saveNote(note);
      });
      
      return apiNotes;
    } catch (error) {
      console.warn('Failed to load notes from API, using localStorage:', error);
      
      // Fall back to localStorage
      return NotesStorage.getAllNotes();
    }
  }

  /**
   * Sync localStorage notes to API (useful for offline-first scenarios)
   * Only works for authenticated users
   */
  static async syncLocalNotesToApi(): Promise<void> {
    // If user is not authenticated, skip sync
    if (!this.isAuthenticated()) {
      console.log('User not authenticated, skipping sync to API');
      return;
    }
    
    try {
      const localNotes = NotesStorage.getAllNotes();
      
      for (const note of localNotes) {
        try {
          // Try to create or update each note in the API
          if (note.id && note.id > API.DEFAULT_IDS.NEW_ENTITY) {
            // Note has a valid server ID, try to update
            const updateRequest = transformNoteToUpdateRequest(note);
            await notesApi.updateNote(updateRequest);
          } else {
            // Note doesn't have a server ID (id = 0 or undefined), create it
            console.log(`Syncing note ${note.uuid} with id=${note.id} to API (creating new)`);
            const createRequest = transformNoteToCreateRequest(note);
            const apiResponse = await notesApi.createNote(createRequest);
            const syncedNote = transformNoteResponseToNote(apiResponse);
            
            // Update localStorage with the synced version (now has server ID)
            NotesStorage.saveNote(syncedNote);
          }
        } catch (error) {
          console.warn(`Failed to sync note ${note.uuid} to API:`, error);
          // Continue with other notes
        }
      }
    } catch (error) {
      console.error('Failed to sync local notes to API:', error);
    }
  }

  /**
   * Check if API is available (only for authenticated users)
   */
  static async isApiAvailable(): Promise<boolean> {
    // If user is not authenticated, consider API unavailable
    if (!this.isAuthenticated()) {
      return false;
    }
    
    try {
      await notesApi.getHealth();
      return true;
    } catch (error) {
      return false;
    }
  }
}
