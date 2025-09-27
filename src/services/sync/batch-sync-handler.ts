import { QueueItem } from '@/types/sync.types';
import { notesApi } from '../api/notes-api';
import { NotesStorage } from '@/helpers/notes-storage';
import { 
  transformNoteToCreateRequest, 
  transformNoteToUpdateRequest, 
  transformNoteResponseToNote 
} from '../api/transformers/note-transformers';
import { API } from '@/constants/ui-constants';
import { BatchCreateRequest, BatchUpdateRequest } from '../api/models/notes.model';

export class BatchSyncHandler {
  /**
   * Batch sync create items
   */
  async batchSyncCreateItems(items: QueueItem[]): Promise<{ successful: string[], failed: Array<{ noteUuid: string, error: string }> }> {
    if (items.length === 0) return { successful: [], failed: [] };

    const notes = [];
    const itemMap = new Map<number, string>(); // index -> noteUuid mapping
    const failed: Array<{ noteUuid: string, error: string }> = [];

    // Prepare notes for batch creation
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const note = NotesStorage.getNote(item.noteUuid);
      
      if (!note) {
        failed.push({ noteUuid: item.noteUuid, error: `Note ${item.noteUuid} not found in localStorage` });
        continue;
      }

      // Log version information for debugging
      console.log(`Processing create for note ${item.noteUuid}: queuedLocal=${item.localVersion}, queuedSync=${item.syncVersion}, currentLocal=${note.localVersion}, currentSync=${note.syncVersion}`);
      
      // Check if note has been modified since queuing (optional validation)
      if (item.localVersion && note.localVersion && item.localVersion !== note.localVersion) {
        console.warn(`Note ${item.noteUuid} localVersion changed since queuing: ${item.localVersion} -> ${note.localVersion}`);
      }

      notes.push(transformNoteToCreateRequest(note));
      itemMap.set(notes.length - 1, item.noteUuid);
    }

    if (notes.length === 0) return { successful: [], failed };

    try {
      const batchRequest: BatchCreateRequest = { notes };
      const batchResponse = await notesApi.batchCreateNotes(batchRequest);
      
      const successful: string[] = [];
      
      // Process successful creations - save to localStorage
      batchResponse.successful.forEach((noteResponse) => {
        const syncedNote = transformNoteResponseToNote(noteResponse);
        successful.push(syncedNote.uuid);
        
        // Update version fields after successful sync
        const updatedNote = {
          ...syncedNote,
          // Sync localVersion with server's syncVersion after successful sync
          localVersion: syncedNote.syncVersion,
          lastSyncedAt: new Date() // Update sync timestamp
        };
        
        // Save successful note to localStorage with updated versions
        NotesStorage.saveNote(updatedNote);
        console.log(`Synced note ${syncedNote.uuid}: localVersion=${updatedNote.localVersion}, syncVersion=${syncedNote.syncVersion}`);
      });

      // Process failed creations - extract UUIDs from failed notes
      batchResponse.failed.forEach((failedNoteResponse) => {
        failed.push({ 
          noteUuid: failedNoteResponse.uuid, 
          error: 'Note creation failed on server' 
        });
        
        // For failed sync, preserve local note and increment localVersion to ensure retry
        const localNote = NotesStorage.getNote(failedNoteResponse.uuid);
        if (localNote) {
          const updatedNote = {
            ...localNote,
            localVersion: (localNote.localVersion || 1) + 1, // Increment to indicate sync failure
            clientUpdatedAt: new Date() // Update client timestamp
          };
          NotesStorage.saveNote(updatedNote);
          console.log(`Failed sync for note ${failedNoteResponse.uuid}: incremented localVersion to ${updatedNote.localVersion}`);
        }
      });

      // Process general errors
      batchResponse.errors.forEach(error => {
        // For general errors, we might not have specific note UUIDs
        // These are typically validation or system errors
        console.error('Batch create error:', error);
      });

      console.log(`Batch create completed: ${successful.length} successful, ${failed.length} failed`);
      return { successful, failed };
      
    } catch (error) {
      // If batch operation fails entirely, mark all as failed
      const allFailed = Array.from(itemMap.values()).map(noteUuid => ({
        noteUuid,
        error: (error as Error).message
      }));
      return { successful: [], failed: allFailed };
    }
  }

  /**
   * Batch sync update items
   */
  async batchSyncUpdateItems(items: QueueItem[]): Promise<{ successful: string[], failed: Array<{ noteUuid: string, error: string }> }> {
    if (items.length === 0) return { successful: [], failed: [] };

    const notes = [];
    const itemMap = new Map<number, string>(); // index -> noteUuid mapping
    const failed: Array<{ noteUuid: string, error: string }> = [];

    // Prepare notes for batch update
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const note = NotesStorage.getNote(item.noteUuid);
      
      if (!note) {
        failed.push({ noteUuid: item.noteUuid, error: `Note ${item.noteUuid} not found in localStorage` });
        continue;
      }

      // if (!note.id || note.id === API.DEFAULT_IDS.NEW_ENTITY) {
      //   failed.push({ noteUuid: item.noteUuid, error: `Note ${item.noteUuid} has invalid server ID for update` });
      //   continue;
      // }

      // Log version information for debugging
      console.log(`Processing update for note ${item.noteUuid}: queuedLocal=${item.localVersion}, queuedSync=${item.syncVersion}, currentLocal=${note.localVersion}, currentSync=${note.syncVersion}`);
      
      // Check if note has been modified since queuing (optional validation)
      if (item.localVersion && note.localVersion && item.localVersion !== note.localVersion) {
        console.warn(`Note ${item.noteUuid} localVersion changed since queuing: ${item.localVersion} -> ${note.localVersion}`);
      }

      notes.push(transformNoteToUpdateRequest(note));
      itemMap.set(notes.length - 1, item.noteUuid);
    }

    if (notes.length === 0) return { successful: [], failed };

    try {
      const batchRequest: BatchUpdateRequest = { notes };
      const batchResponse = await notesApi.batchUpdateNotes(batchRequest);
      
      const successful: string[] = [];
      
      // Process successful updates - save updated notes to localStorage
      batchResponse.successful.forEach((noteResponse) => {
        const syncedNote = transformNoteResponseToNote(noteResponse);
        successful.push(syncedNote.uuid);
        
        // Update version fields after successful sync
        const updatedNote = {
          ...syncedNote,
          lastSyncedAt: new Date() // Update sync timestamp
        };
        
        // Save successful note to localStorage with updated versions
        NotesStorage.saveNote(updatedNote);
        console.log(`Synced note ${syncedNote.uuid}: localVersion=${updatedNote.localVersion}, syncVersion=${syncedNote.syncVersion}`);
      });

      // Process failed updates - extract UUIDs from failed notes
      batchResponse.failed.forEach((failedNoteResponse) => {
        failed.push({ 
          noteUuid: failedNoteResponse.uuid, 
          error: 'Note update failed on server' 
        });
        
        // For failed sync, preserve local note and increment localVersion to ensure retry
        const localNote = NotesStorage.getNote(failedNoteResponse.uuid);
        if (localNote) {
          const updatedNote = {
            ...localNote,
            lastSyncedAt: new Date() // Update sync timestamp
          };
          NotesStorage.saveNote(updatedNote);
          console.log(`Failed sync for note ${failedNoteResponse.uuid}: incremented localVersion to ${updatedNote.localVersion}`);
        }
      });

      batchResponse.errors.forEach(error => {
        console.error('Batch update error:', error);
      });

      // Handle conflicts if any
      if (batchResponse.conflicts && batchResponse.conflicts.length > 0) {
        console.warn(`Batch update has ${batchResponse.conflicts.length} conflicts that need resolution`);
        batchResponse.conflicts.forEach(conflict => {
          console.warn(`Conflict for note ${conflict.noteUuid}: ${conflict.conflictType}`);
        });
      }

      console.log(`Batch update completed: ${successful.length} successful, ${failed.length} failed`);
      return { successful, failed };
      
    } catch (error) {
      // If batch operation fails entirely, mark all as failed
      const allFailed = Array.from(itemMap.values()).map(noteUuid => ({
        noteUuid,
        error: (error as Error).message
      }));
      return { successful: [], failed: allFailed };
    }
  }

  /**
   * Batch sync delete items
   */
  async batchSyncDeleteItems(items: QueueItem[]): Promise<{ successful: string[], failed: Array<{ noteUuid: string, error: string }> }> {
    if (items.length === 0) return { successful: [], failed: [] };

    const deleteRequests = [];
    const itemMap = new Map<number, string>(); // server ID -> noteUuid mapping
    const failed: Array<{ noteUuid: string, error: string }> = [];

    // Prepare delete requests for batch deletion
    for (const item of items) {
      const note = NotesStorage.getNote(item.noteUuid);
      
      if (note && note.id && note.id !== API.DEFAULT_IDS.NEW_ENTITY) {
        // Log version information for debugging
        console.log(`Processing delete for note ${item.noteUuid}: queuedLocal=${item.localVersion}, queuedSync=${item.syncVersion}, currentLocal=${note.localVersion}, currentSync=${note.syncVersion}`);
        
        const deleteRequest = {
          id: note.id,
          localVersion: note.localVersion || 1,
          clientUpdatedAt: note.clientUpdatedAt?.toISOString()
        };
        
        deleteRequests.push(deleteRequest);
        itemMap.set(note.id, item.noteUuid);
      } else {
        failed.push({ noteUuid: item.noteUuid, error: `Note ${item.noteUuid} has no valid server ID for deletion` });
      }
    }

    if (deleteRequests.length === 0) return { successful: [], failed };

    try {
      const batchResponse = await notesApi.batchDeleteNotes({ notes: deleteRequests });
      
      const successful: string[] = [];
      
      // Process successful deletions
      batchResponse.successful.forEach((noteResponse) => {
        successful.push(noteResponse.uuid);
        // Remove the successfully deleted note from localStorage
        NotesStorage.deleteNote(noteResponse.uuid);
      });

      // Process failed deletions - extract UUIDs from failed notes
      batchResponse.failed.forEach((failedNoteResponse) => {
        failed.push({ 
          noteUuid: failedNoteResponse.uuid, 
          error: 'Note deletion failed on server' 
        });
        
        // For failed deletion, the note should remain in localStorage
        // We don't increment localVersion for deletions since the note is already marked as deleted
        console.log(`Failed deletion for note ${failedNoteResponse.uuid}: note remains in localStorage`);
      });

      // Process general errors
      batchResponse.errors.forEach(error => {
        console.error('Batch delete error:', error);
      });

      console.log(`Batch delete completed: ${successful.length} successful, ${failed.length} failed`);
      return { successful, failed };
      
    } catch (error) {
      // If batch operation fails entirely, mark all as failed
      const allFailed = Array.from(itemMap.values()).map(noteUuid => ({
        noteUuid,
        error: (error as Error).message
      }));
      return { successful: [], failed: allFailed };
    }
  }
}
