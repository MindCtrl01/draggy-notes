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
        
        // Save successful note to localStorage
        NotesStorage.saveNote(syncedNote);
      });

      // Process failed creations - extract UUIDs from failed notes
      batchResponse.failed.forEach((failedNoteResponse) => {
        failed.push({ 
          noteUuid: failedNoteResponse.uuid, 
          error: 'Note creation failed on server' 
        });
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

      if (!note.id || note.id === API.DEFAULT_IDS.NEW_ENTITY) {
        failed.push({ noteUuid: item.noteUuid, error: `Note ${item.noteUuid} has invalid server ID for update` });
        continue;
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
        
        // Save successful note to localStorage
        NotesStorage.saveNote(syncedNote);
      });

      // Process failed updates - extract UUIDs from failed notes
      batchResponse.failed.forEach((failedNoteResponse) => {
        failed.push({ 
          noteUuid: failedNoteResponse.uuid, 
          error: 'Note update failed on server' 
        });
      });

      // Process general errors
      batchResponse.errors.forEach(error => {
        // For general errors, we might not have specific note UUIDs
        // These are typically validation or system errors
        console.error('Batch update error:', error);
      });

      // Handle conflicts if any
      if (batchResponse.conflicts && batchResponse.conflicts.length > 0) {
        console.warn(`Batch update has ${batchResponse.conflicts.length} conflicts that need resolution`);
        batchResponse.conflicts.forEach(conflict => {
          // For now, log conflicts - in future we might want to handle them
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

    const noteIds = [];
    const itemMap = new Map<number, string>(); // server ID -> noteUuid mapping
    const failed: Array<{ noteUuid: string, error: string }> = [];

    // Prepare note IDs for batch deletion
    for (const item of items) {
      const note = NotesStorage.getNote(item.noteUuid);
      
      if (note && note.id && note.id !== API.DEFAULT_IDS.NEW_ENTITY) {
        noteIds.push(note.id);
        itemMap.set(note.id, item.noteUuid);
      } else {
        failed.push({ noteUuid: item.noteUuid, error: `Note ${item.noteUuid} has no valid server ID for deletion` });
      }
    }

    if (noteIds.length === 0) return { successful: [], failed };

    try {
      const batchResponse = await notesApi.batchDeleteNotes({ ids: noteIds });
      
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
