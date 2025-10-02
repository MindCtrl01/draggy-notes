import { QueueItem, QueueStats } from '@/types/sync.types';
import { NotesStorage } from '@/helpers/notes-storage';
import { API, SYNC } from '@/constants/ui-constants';

export class QueueManager {
  private static readonly PRIMARY_QUEUE_KEY = 'draggy-notes-sync-queue';
  private static readonly RETRY_QUEUE_KEY = 'draggy-notes-retry-queue';
  private static readonly MAX_RETRY_COUNT = SYNC.MAX_RETRY_COUNT;
  private static readonly RETRY_DELAY = SYNC.RETRY_DELAY;

  /**
   * Add item to primary sync queue with precheck
   */
  static addToQueue(noteUuid: string, action: 'create' | 'update' | 'delete'): boolean {
    // Perform precheck before adding to queue
    const precheckResult = this.precheckOperation(noteUuid, action);
    
    if (!precheckResult.shouldQueue) {
      console.log(`Precheck failed for note ${noteUuid} with action ${action}, skipping queue`);
      return false;
    }

    const queue = this.getPrimaryQueue();
    
    // Remove existing item for same note (latest action wins)
    const filteredQueue = queue.filter(item => item.noteUuid !== noteUuid);
    
    // Get note to extract version information
    const note = NotesStorage.getNote(noteUuid);
    
    // Add new item with potentially converted action and version info
    const newItem: QueueItem = {
      noteUuid,
      action: precheckResult.finalAction,
      timestamp: Date.now(),
      retryCount: SYNC.INITIAL_RETRY_COUNT,
      localVersion: note?.localVersion,
      syncVersion: note?.syncVersion
    };
    
    filteredQueue.push(newItem);
    this.savePrimaryQueue(filteredQueue);
    
    if (action !== precheckResult.finalAction) {
      console.log(`Added note ${noteUuid} to sync queue with converted action: ${action} -> ${precheckResult.finalAction}`);
    } else {
      console.log(`Added note ${noteUuid} to sync queue with action: ${precheckResult.finalAction}`);
    }
    
    return true;
  }

  /**
   * Precheck logic before adding to queue with action conversion
   * Returns the final action to be queued (may differ from input action)
   */
  private static precheckOperation(noteUuid: string, action: 'create' | 'update' | 'delete'): { shouldQueue: boolean; finalAction: 'create' | 'update' | 'delete' } {
    const note = NotesStorage.getNote(noteUuid);
    
    switch (action) {
      case 'delete':
        // Case 1: Note never created on server (id = 0) and being deleted locally
        // Don't add to queue as there's nothing to delete on server
        if (!note || !note.id || note.id === API.DEFAULT_IDS.NEW_ENTITY) {
          console.log(`Note ${noteUuid} has id=0 or doesn't exist, skipping delete sync`);
          // Remove from queue if it exists there
          this.removeFromPrimaryQueue(noteUuid);
          this.removeFromRetryQueue(noteUuid);
          return { shouldQueue: false, finalAction: action };
        }
        return { shouldQueue: true, finalAction: action };

      case 'update':
        // Case 2: Note marked for update but has id = 0, convert to create
        if (!note) {
          console.log(`Note ${noteUuid} doesn't exist locally, skipping update sync`);
          return { shouldQueue: false, finalAction: action };
        }
        // if (note.id === API.DEFAULT_IDS.NEW_ENTITY) {
        //   console.log(`Note ${noteUuid} has id=0, converting update to create operation`);
        //   return { shouldQueue: true, finalAction: 'create' };
        // }
        return { shouldQueue: true, finalAction: action };

      case 'create':
        // Case 3: Create operations are always allowed if note exists locally
        if (!note) {
          console.log(`Note ${noteUuid} doesn't exist locally, skipping create sync`);
          return { shouldQueue: false, finalAction: action };
        }
        return { shouldQueue: true, finalAction: action };

      default:
        return { shouldQueue: false, finalAction: action };
    }
  }

  /**
   * Get primary sync queue
   */
  static getPrimaryQueue(): QueueItem[] {
    try {
      const queueData = localStorage.getItem(this.PRIMARY_QUEUE_KEY);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('Failed to load primary sync queue:', error);
      return [];
    }
  }

  /**
   * Get retry queue
   */
  static getRetryQueue(): QueueItem[] {
    try {
      const queueData = localStorage.getItem(this.RETRY_QUEUE_KEY);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('Failed to load retry queue:', error);
      return [];
    }
  }

  /**
   * Save primary queue
   */
  static savePrimaryQueue(queue: QueueItem[]): void {
    try {
      localStorage.setItem(this.PRIMARY_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save primary sync queue:', error);
    }
  }

  /**
   * Save retry queue
   */
  static saveRetryQueue(queue: QueueItem[]): void {
    try {
      localStorage.setItem(this.RETRY_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save retry queue:', error);
    }
  }

  /**
   * Remove item from primary queue
   */
  static removeFromPrimaryQueue(noteUuid: string): void {
    const queue = this.getPrimaryQueue();
    const filteredQueue = queue.filter(item => item.noteUuid !== noteUuid);
    this.savePrimaryQueue(filteredQueue);
  }

  /**
   * Remove item from retry queue
   */
  static removeFromRetryQueue(noteUuid: string): void {
    const queue = this.getRetryQueue();
    const filteredQueue = queue.filter(item => item.noteUuid !== noteUuid);
    this.saveRetryQueue(filteredQueue);
  }

  /**
   * Move item from primary queue to retry queue when max retries exceeded
   */
  static moveToRetryQueue(item: QueueItem, errorMessage?: string): void {
    // Remove from primary queue
    this.removeFromPrimaryQueue(item.noteUuid);
    
    // Add to retry queue with error info
    const retryQueue = this.getRetryQueue();
    const retryItem: QueueItem = {
      ...item,
      lastRetryAt: Date.now(),
      errorMessage: errorMessage || 'Max retries exceeded'
    };
    
    // Remove existing item in retry queue for same note
    const filteredRetryQueue = retryQueue.filter(retryItem => retryItem.noteUuid !== item.noteUuid);
    filteredRetryQueue.push(retryItem);
    
    this.saveRetryQueue(filteredRetryQueue);
    
    console.log(`Moved note ${item.noteUuid} to retry queue after max retries`);
  }

  /**
   * Move eligible items from retry queue back to primary queue
   */
  static processRetryQueue(): void {
    const retryQueue = this.getRetryQueue();
    const now = Date.now();
    const eligibleItems: QueueItem[] = [];
    const remainingItems: QueueItem[] = [];

    retryQueue.forEach(item => {
      const timeSinceLastRetry = now - (item.lastRetryAt || SYNC.QUEUE_PROCESSING.MIN_RETRY_ELIGIBILITY);
      
      if (timeSinceLastRetry >= this.RETRY_DELAY) {
        // Reset retry count and move back to primary queue
        eligibleItems.push({
          ...item,
          retryCount: SYNC.INITIAL_RETRY_COUNT,
          lastRetryAt: undefined,
          errorMessage: undefined
        });
      } else {
        remainingItems.push(item);
      }
    });

    if (eligibleItems.length > 0) {
      // Add eligible items back to primary queue
      const primaryQueue = this.getPrimaryQueue();
      const updatedPrimaryQueue = [...primaryQueue, ...eligibleItems];
      this.savePrimaryQueue(updatedPrimaryQueue);
      
      // Update retry queue with remaining items
      this.saveRetryQueue(remainingItems);
      
      console.log(`Moved ${eligibleItems.length} items from retry queue back to primary queue`);
    }
  }

  /**
   * Handle failed sync - increment retry count or move to retry queue
   */
  static handleFailedSync(noteUuid: string, errorMessage?: string): boolean {
    const queue = this.getPrimaryQueue();
    const item = queue.find(item => item.noteUuid === noteUuid);
    
    if (item) {
      item.retryCount += 1;
      
      if (item.retryCount >= this.MAX_RETRY_COUNT) {
        // Move to retry queue instead of removing
        this.moveToRetryQueue(item, errorMessage);
        return false;
      }
      
      this.savePrimaryQueue(queue);
      console.log(`Incremented retry count for note ${noteUuid} to ${item.retryCount}`);
      return true;
    }
    
    return false;
  }

  /**
   * Get queue items grouped by action
   */
  static getPrimaryQueueByAction(): Record<string, QueueItem[]> {
    const queue = this.getPrimaryQueue();
    return {
      create: queue.filter(item => item.action === 'create'),
      update: queue.filter(item => item.action === 'update'),
      delete: queue.filter(item => item.action === 'delete')
    };
  }

  /**
   * Get combined queue statistics
   */
  static getQueueStats(): QueueStats {
    const primaryQueue = this.getPrimaryQueue();
    const retryQueue = this.getRetryQueue();
    
    return {
      primary: {
        total: primaryQueue.length,
        create: primaryQueue.filter(item => item.action === 'create').length,
        update: primaryQueue.filter(item => item.action === 'update').length,
        delete: primaryQueue.filter(item => item.action === 'delete').length
      },
      retry: {
        total: retryQueue.length,
        create: retryQueue.filter(item => item.action === 'create').length,
        update: retryQueue.filter(item => item.action === 'update').length,
        delete: retryQueue.filter(item => item.action === 'delete').length
      }
    };
  }

  /**
   * Remove multiple items from primary queue (for successful batch operations)
   */
  static removeMultipleFromPrimaryQueue(noteUuids: string[]): void {
    const queue = this.getPrimaryQueue();
    const filteredQueue = queue.filter(item => !noteUuids.includes(item.noteUuid));
    this.savePrimaryQueue(filteredQueue);
    console.log(`Removed ${noteUuids.length} successful items from primary queue`);
  }

  /**
   * Handle batch sync results - remove successful, handle failed
   */
  static handleBatchSyncResult(
    successful: string[], 
    failed: Array<{ noteUuid: string, error: string }>
  ): void {
    // Remove successful items from primary queue
    if (successful.length > 0) {
      this.removeMultipleFromPrimaryQueue(successful);
    }

    // Handle failed items - increment retry count or move to retry queue
    failed.forEach(({ noteUuid, error }) => {
      const canRetry = this.handleFailedSync(noteUuid, error);
      if (!canRetry) {
        console.warn(`Note ${noteUuid} moved to retry queue after max retries`);
      }
    });
  }

  /**
   * Clear all queues
   */
  static clearAllQueues(): void {
    localStorage.removeItem(this.PRIMARY_QUEUE_KEY);
    localStorage.removeItem(this.RETRY_QUEUE_KEY);
    console.log('Cleared all sync queues');
  }
}
