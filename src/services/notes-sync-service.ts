import { Note } from '@/domains/note';
import { notesApi } from './api/notes-api';
import { NotesStorage } from '@/helpers/notes-storage';
import { TokenManager } from '@/helpers/token-manager';
import { transformNoteResponseToNote } from './api/transformers/note-transformers';
import { QueueManager } from './sync/queue-manager';
import { BatchSyncHandler } from './sync/batch-sync-handler';
import { QueueItem } from '@/types/sync.types';
import { SYNC } from '@/constants/ui-constants';

/**
 * Enhanced service that handles synchronization between API and localStorage
 * Features: Queue-based sync, retry mechanisms, batch processing, and 5-minute auto-sync
 */
export class NotesSyncService {
  private static syncTimer: NodeJS.Timeout | null = null;
  private static isSyncing = false;

  /**
   * Start automatic sync timer
   */
  static startSyncTimer(): void {
    this.stopSyncTimer(); // Clear existing timer
    
    this.syncTimer = setInterval(() => {
      this.performScheduledSync();
    }, SYNC.AUTO_SYNC_INTERVAL);
    
    console.log('Sync timer started - will sync every 5 minutes');
  }

  /**
   * Stop automatic sync timer
   */
  static stopSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('Sync timer stopped');
    }
  }

  /**
   * Check if sync conditions are met
   */
  private static canSync(): boolean {
    return (
      this.isAuthenticated() &&
      navigator.onLine &&
      !this.isSyncing
    );
  }

  /**
   * Perform scheduled sync with retry queue processing
   */
  static async performScheduledSync(): Promise<void> {
    if (!this.canSync()) {
      console.log('Sync conditions not met, skipping sync');
      return;
    }

    this.isSyncing = true;
    console.log('Starting scheduled sync...');

    try {
      // First, process retry queue to move eligible items back to primary
      QueueManager.processRetryQueue();
      
      // Then sync all items from primary queue
      await this.syncAllQueuedItems();
      
      console.log('Scheduled sync completed successfully');
    } catch (error) {
      console.error('Scheduled sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync all items from primary queue in batches
   */
  static async syncAllQueuedItems(): Promise<void> {
    const queueByAction = QueueManager.getPrimaryQueueByAction();
    const batchHandler = new BatchSyncHandler();

    // Process in order: creates, updates, deletes
    await this.processBatch('create', queueByAction.create, batchHandler);
    await this.processBatch('update', queueByAction.update, batchHandler);
    await this.processBatch('delete', queueByAction.delete, batchHandler);
  }

  /**
   * Process a batch of queue items using batch API operations
   */
  private static async processBatch(
    action: 'create' | 'update' | 'delete',
    items: QueueItem[],
    batchHandler: BatchSyncHandler
  ): Promise<void> {
    if (items.length === SYNC.EMPTY_QUEUE_LENGTH) return;

    console.log(`Processing ${items.length} ${action} operations using batch API...`);

    try {
      let result: { successful: string[], failed: Array<{ noteUuid: string, error: string }> };

      // Use batch operations instead of individual item processing
      switch (action) {
        case 'create':
          result = await batchHandler.batchSyncCreateItems(items);
          break;
        case 'update':
          result = await batchHandler.batchSyncUpdateItems(items);
          break;
        case 'delete':
          result = await batchHandler.batchSyncDeleteItems(items);
          break;
      }

      // Handle batch sync results using the new queue management method
      QueueManager.handleBatchSyncResult(result.successful, result.failed);
      
      // Log results
      result.successful.forEach(noteUuid => {
        if (action === 'delete') {
          NotesStorage.deleteNote(noteUuid);
        }
        console.log(`Successfully synced ${action} for note ${noteUuid}`);
      });

      result.failed.forEach(({ noteUuid, error }) => {
        console.error(`Failed to sync ${action} for note ${noteUuid}:`, error);
      });

    } catch (error) {
      console.error(`Batch ${action} operation failed entirely:`, error);
      
      // If the entire batch fails, handle all items as failed
      items.forEach(item => {
        const canRetry = QueueManager.handleFailedSync(item.noteUuid, (error as Error).message);
        
        if (!canRetry) {
          console.warn(`Note ${item.noteUuid} moved to retry queue after max retries`);
        }
      });
    }
  }

  /**
   * Create a note with precheck and queue management
   */
  static async createNote(note: Note): Promise<Note> {
    // Set userId if user is authenticated
    let noteToSave = note;
    if (this.isAuthenticated()) {
      const currentUser = TokenManager.getCurrentUserFromToken();
      if (currentUser && currentUser.id) {
        console.log(`Setting userId ${currentUser.id} for note ${note.uuid} (was ${note.userId})`);
        noteToSave = { ...note, userId: currentUser.id };
      } else {
        console.log(`User authenticated but no valid user ID found for note ${note.uuid}`);
      }
    } else {
      console.log(`User not authenticated, keeping original userId ${note.userId} for note ${note.uuid}`);
    }
    
    // Always save to localStorage first
    NotesStorage.saveNote(noteToSave);
    
    // Add to sync queue with precheck if authenticated
    if (this.isAuthenticated()) {
      const added = QueueManager.addToQueue(noteToSave.uuid, 'create');
      if (!added) {
        console.log(`Note ${noteToSave.uuid} not added to sync queue due to precheck failure`);
      }
    }
    
    return noteToSave;
  }

  /**
   * Update a note with precheck and queue management
   */
  static async updateNote(note: Note): Promise<Note> {
    // Set userId if user is authenticated
    let noteToSave = note;
    if (this.isAuthenticated()) {
      const currentUser = TokenManager.getCurrentUserFromToken();
      if (currentUser && currentUser.id) {
        noteToSave = { ...note, userId: currentUser.id };
      }
    }
    
    // Always save to localStorage first
    NotesStorage.saveNote(noteToSave);
    
    // Add to sync queue with precheck if authenticated
    if (this.isAuthenticated()) {
      const added = QueueManager.addToQueue(noteToSave.uuid, 'update');
      if (!added) {
        console.log(`Note ${noteToSave.uuid} update not added to sync queue due to precheck failure`);
      }
    }
    
    return noteToSave;
  }

  /**
   * Delete a note with precheck and queue management
   */
  static async deleteNote(_id: number, uuid: string): Promise<void> {
    // Add to sync queue with precheck if authenticated
    if (this.isAuthenticated()) {
      const added = QueueManager.addToQueue(uuid, 'delete');
      if (!added) {
        console.log(`Note ${uuid} delete not added to sync queue due to precheck (likely id=0)`);
      }
    }
  }

  /**
   * Handle user logout - stop sync but preserve queue
   */
  static handleUserLogout(): void {
    console.log('User logged out - stopping sync timer');
    this.stopSyncTimer();
    // Note: Queue is preserved so pending operations can sync when user logs back in
  }

  /**
   * Handle user login - start sync timer
   */
  static handleUserLogin(): void {
    console.log('User logged in - starting sync timer');
    this.startSyncTimer();
  }

  /**
   * Handle network status change
   */
  static handleNetworkChange(isOnline: boolean): void {
    if (isOnline && this.isAuthenticated()) {
      console.log('Network restored - starting sync timer');
      this.startSyncTimer();
    } else {
      console.log('Network lost - stopping sync timer');
      this.stopSyncTimer();
    }
  }

  /**
   * Get enhanced sync status including retry queue
   */
  static getSyncStatus() {
    const queueStats = QueueManager.getQueueStats();
    
    return {
      isTimerActive: this.syncTimer !== null,
      isSyncing: this.isSyncing,
      canSync: this.canSync(),
      primaryQueueCount: queueStats.primary.total,
      retryQueueCount: queueStats.retry.total,
      queueStats
    };
  }

  /**
   * Manual retry of items in retry queue
   */
  static async retryFailedItems(): Promise<void> {
    console.log('Manually retrying failed items...');
    QueueManager.processRetryQueue();
    
    if (this.canSync()) {
      await this.performScheduledSync();
    }
  }

  /**
   * Load all notes from API and localStorage
   */
  static async loadAllNotes(): Promise<Note[]> {
    // If user has never logged in, only use localStorage
    if (!TokenManager.hasUserEverLoggedIn()) {
      console.log('User has never logged in, using localStorage only');
      return NotesStorage.getAllNotes();
    }

    // If user has logged in before but is not currently authenticated, use localStorage only
    if (!this.isAuthenticated()) {
      console.log('User not currently authenticated but has logged in before, using localStorage only');
      return NotesStorage.getAllNotes();
    }
    
    try {
      // User is authenticated and has logged in before - merge API + unsynced local notes
      console.log('User is authenticated, loading and merging API notes with local unsynced notes');
      
      const apiResponse = await notesApi.getAllNotes();
      const apiNotes = apiResponse.map(transformNoteResponseToNote);
      
      // Get all local notes
      const localNotes = NotesStorage.getAllNotes();
      
      // Create a map for efficient lookup
      const apiNotesMap = new Map(apiNotes.map(note => [note.uuid, note]));
      
      // Merge notes with priority: local with bigger localVersion > API > localStorage not in API
      const mergedNotes: Note[] = [];
      const processedUuids = new Set<string>();
      
      // First, process notes that exist in both local and API
      for (const localNote of localNotes) {
        const apiNote = apiNotesMap.get(localNote.uuid);
        
        if (apiNote) {
          // Note exists in both local and API - compare localVersion
          const localVersion = localNote.localVersion || 1;
          const apiSyncVersion = apiNote.syncVersion || 1;
          
          if (localVersion > apiSyncVersion) {
            // Local note has higher version - use local and queue for sync
            mergedNotes.push(localNote);
            console.log(`Using local version of note ${localNote.uuid} (local v${localVersion} > API v${apiSyncVersion})`);
            
            // Immediately add to sync queue since local version is newer
            const isInQueue = QueueManager.getPrimaryQueue().some(queueItem => queueItem.noteUuid === localNote.uuid) ||
                             QueueManager.getRetryQueue().some(queueItem => queueItem.noteUuid === localNote.uuid);
            
            if (!isInQueue) {
              const action = localNote.id === 0 ? 'create' : 'update';
              const added = QueueManager.addToQueue(localNote.uuid, action);
              if (added) {
                console.log(`Added note ${localNote.uuid} to sync queue (local v${localVersion} > API v${apiSyncVersion})`);
              }
            }
          } else {
            // API note has same or higher version - use API and save to localStorage
            mergedNotes.push(apiNote);
            NotesStorage.saveNote(apiNote);
            console.log(`Using API version of note ${apiNote.uuid} (API v${apiSyncVersion} >= local v${localVersion})`);
          }
          processedUuids.add(localNote.uuid);
        }
      }
      
      // Second, add API notes that don't exist locally
      for (const apiNote of apiNotes) {
        if (!processedUuids.has(apiNote.uuid)) {
          mergedNotes.push(apiNote);
          NotesStorage.saveNote(apiNote);
          processedUuids.add(apiNote.uuid);
          console.log(`Added API-only note ${apiNote.uuid} to local storage`);
        }
      }
      
      // Third, add local notes that don't exist in API (unsynced notes)
      const unsyncedNotes = localNotes.filter(localNote => 
        !processedUuids.has(localNote.uuid)
      );
      
      // Add unsynced notes to the merged list
      mergedNotes.push(...unsyncedNotes);
      
      // Add unsynced notes to queue if they're not already in the queue
      unsyncedNotes.forEach(note => {
        const isInQueue = QueueManager.getPrimaryQueue().some(queueItem => queueItem.noteUuid === note.uuid) ||
                         QueueManager.getRetryQueue().some(queueItem => queueItem.noteUuid === note.uuid);
        
        if (!isInQueue) {
          // Determine the appropriate action based on note properties
          const action = note.id === 0 ? 'create' : 'update';
          const added = QueueManager.addToQueue(note.uuid, action);
          if (added) {
            console.log(`Added unsynced note ${note.uuid} to sync queue with action: ${action}`);
          }
        }
      });
      
      console.log(`Loaded ${apiNotes.length} API notes and ${unsyncedNotes.length} unsynced local notes, merged total: ${mergedNotes.length}`);
      return mergedNotes;
    } catch (error) {
      console.warn('Failed to load notes from API, using localStorage:', error);
      return NotesStorage.getAllNotes();
    }
  }

  /**
   * Check if API is available (only for authenticated users)
   */
  static async isApiAvailable(): Promise<boolean> {
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

  /**
   * Force reload all notes from API (useful after login)
   */
  static async forceReloadNotes(): Promise<Note[]> {
    console.log('Force reloading all notes from API...');
    return this.loadAllNotes();
  }

  /**
   * Check if user is authenticated
   */
  private static isAuthenticated(): boolean {
    return TokenManager.isAuthenticated();
  }
}
