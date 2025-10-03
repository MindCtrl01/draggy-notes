import { useState, useEffect, useCallback } from 'react';
import { NotesSyncService } from '@/services/notes-sync-service';
import { QueueManager } from '@/services/sync/queue-manager';
import { QueueStats, RealTimeSyncStatus } from '@/types/sync.types';
import { SYNC } from '@/constants/ui-constants';
import { SessionManager } from '@/helpers/session-manager';

export interface SyncStatus {
  isOnline: boolean;
  isApiAvailable: boolean;
  isAuthenticated: boolean;
  lastSyncTime: Date | null;
  primaryQueueCount: number;
  retryQueueCount: number;
  syncErrors: string[];
  isTimerActive: boolean;
  isSyncing: boolean;
  queueStats: QueueStats;
  realTimeStatus: RealTimeSyncStatus;
}

/**
 * Enhanced hook to track sync status with queue management and retry mechanisms
 */
export const useSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isApiAvailable: false,
    isAuthenticated: SessionManager.isAuthenticated(),
    lastSyncTime: null,
    primaryQueueCount: SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT,
    retryQueueCount: SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT,
    syncErrors: [],
    isTimerActive: false,
    isSyncing: false,
    queueStats: {
      primary: { 
        total: SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT, 
        create: SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT, 
        update: SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT, 
        delete: SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT 
      },
      retry: { 
        total: SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT, 
        create: SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT, 
        update: SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT, 
        delete: SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT 
      }
    },
    realTimeStatus: {
      isRealTimeEnabled: false,
      connectionState: {
        isConnected: false,
        isConnecting: false,
        reconnectAttempts: 0
      },
      eventsProcessed: 0
    }
  });

  // Update sync status from service
  const updateSyncStatus = useCallback(() => {
    const status = NotesSyncService.getSyncStatus();
    setSyncStatus(prev => ({
      ...prev,
      primaryQueueCount: status.primaryQueueCount,
      retryQueueCount: status.retryQueueCount,
      isTimerActive: status.isTimerActive,
      isSyncing: status.isSyncing,
      isAuthenticated: SessionManager.isAuthenticated(),
      queueStats: status.queueStats,
      realTimeStatus: status.realTimeStatus
    }));
  }, []);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (!syncStatus.isOnline || !syncStatus.isAuthenticated) {
      return false;
    }

    try {
      await NotesSyncService.performScheduledSync();
      updateSyncStatus();
      setSyncStatus(prev => ({
        ...prev,
        lastSyncTime: new Date()
      }));
      return true;
    } catch (error) {
      console.error('Manual sync failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        syncErrors: [...prev.syncErrors, `Manual sync failed: ${error}`]
      }));
      return false;
    }
  }, [syncStatus.isOnline, syncStatus.isAuthenticated, updateSyncStatus]);

  // Retry failed items
  const retryFailedItems = useCallback(async () => {
    try {
      await NotesSyncService.retryFailedItems();
      updateSyncStatus();
      return true;
    } catch (error) {
      console.error('Retry failed:', error);
      return false;
    }
  }, [updateSyncStatus]);

  // Handle authentication changes
  const handleAuthChange = useCallback((isAuthenticated: boolean) => {
    if (isAuthenticated) {
      NotesSyncService.handleUserLogin();
    } else {
      NotesSyncService.handleUserLogout();
    }
    updateSyncStatus();
  }, [updateSyncStatus]);

  // Clear sync errors
  const clearSyncErrors = useCallback(() => {
    setSyncStatus(prev => ({
      ...prev,
      syncErrors: []
    }));
  }, []);

  // Check API availability
  const checkApiAvailability = useCallback(async () => {
    try {
      const isAvailable = await NotesSyncService.isApiAvailable();
      setSyncStatus(prev => ({
        ...prev,
        isApiAvailable: isAvailable,
        lastSyncTime: isAvailable ? new Date() : prev.lastSyncTime
      }));
      return isAvailable;
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        isApiAvailable: false,
        syncErrors: [...prev.syncErrors, `API check failed: ${error}`]
      }));
      return false;
    }
  }, []);

  // Handle network changes
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      NotesSyncService.handleNetworkChange(true);
      updateSyncStatus();
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
      NotesSyncService.handleNetworkChange(false);
      updateSyncStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateSyncStatus]);

  // Periodic status updates
  useEffect(() => {
    const interval = setInterval(updateSyncStatus, SYNC.STATUS_UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [updateSyncStatus]);

  // Initial status update
  useEffect(() => {
    updateSyncStatus();
  }, [updateSyncStatus]);

  // Set up real-time event handlers
  useEffect(() => {
    const handleRealTimeEvent = () => {
      updateSyncStatus();
    };

    // Listen to real-time sync events
    NotesSyncService.addRealTimeEventHandler('notesCreated', handleRealTimeEvent);
    NotesSyncService.addRealTimeEventHandler('notesUpdated', handleRealTimeEvent);
    NotesSyncService.addRealTimeEventHandler('notesDeleted', handleRealTimeEvent);
    NotesSyncService.addRealTimeEventHandler('statusUpdated', handleRealTimeEvent);

    return () => {
      // Clean up event handlers
      NotesSyncService.removeRealTimeEventHandler('notesCreated', handleRealTimeEvent);
      NotesSyncService.removeRealTimeEventHandler('notesUpdated', handleRealTimeEvent);
      NotesSyncService.removeRealTimeEventHandler('notesDeleted', handleRealTimeEvent);
      NotesSyncService.removeRealTimeEventHandler('statusUpdated', handleRealTimeEvent);
    };
  }, [updateSyncStatus]);

  // Get SignalR connection status
  const getSignalRStatus = useCallback(() => {
    return NotesSyncService.getSignalRStatus();
  }, []);

  return {
    syncStatus,
    triggerSync,
    retryFailedItems,
    handleAuthChange,
    updateSyncStatus,
    clearSyncErrors,
    checkApiAvailability,
    getQueueItems: QueueManager.getPrimaryQueue,
    getRetryQueueItems: QueueManager.getRetryQueue,
    clearAllQueues: QueueManager.clearAllQueues,
    getSignalRStatus
  };
};
