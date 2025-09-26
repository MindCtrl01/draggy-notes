import { useState, useEffect, useCallback } from 'react';
import { NotesSyncService } from '@/services/notes-sync-service';
import { QueueManager } from '@/services/sync/queue-manager';
import { authApi } from '@/services/api/auth-api';
import { QueueStats } from '@/types/sync.types';
import { SYNC } from '@/constants/ui-constants';

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
}

/**
 * Enhanced hook to track sync status with queue management and retry mechanisms
 */
export const useSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isApiAvailable: false,
    isAuthenticated: authApi.isAuthenticated(),
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
      isAuthenticated: authApi.isAuthenticated(),
      queueStats: status.queueStats
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
    clearAllQueues: QueueManager.clearAllQueues
  };
};
