import { useState, useEffect, useCallback } from 'react';
import { NotesSyncService } from '@/services/notes-sync-service';
import { authApi } from '@/services/api/auth-api';
import { SYNC, API } from '@/constants/ui-constants';

export interface SyncStatus {
  isOnline: boolean;
  isApiAvailable: boolean;
  isAuthenticated: boolean;
  lastSyncTime: Date | null;
  pendingSyncCount: number;
  syncErrors: string[];
}

/**
 * Hook to track sync status between API and localStorage
 * For unauthenticated users, API is considered unavailable
 */
export const useSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isApiAvailable: false,
    isAuthenticated: authApi.isAuthenticated(),
    lastSyncTime: null,
    pendingSyncCount: API.DEFAULT_IDS.NEW_ENTITY,
    syncErrors: []
  });

  // Check API availability
  const checkApiAvailability = useCallback(async () => {
    const isAuthenticated = authApi.isAuthenticated();
    
    try {
      const isAvailable = await NotesSyncService.isApiAvailable();
      setSyncStatus(prev => ({
        ...prev,
        isAuthenticated,
        isApiAvailable: isAvailable,
        lastSyncTime: isAvailable ? new Date() : prev.lastSyncTime
      }));
      return isAvailable;
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        isAuthenticated,
        isApiAvailable: false,
        syncErrors: [...prev.syncErrors.slice(-SYNC.MAX_RECENT_ERRORS), `API check failed: ${error}`]
      }));
      return false;
    }
  }, []);

  // Sync local notes to API
  const syncToApi = useCallback(async () => {
    if (!syncStatus.isOnline || !syncStatus.isApiAvailable || !syncStatus.isAuthenticated) {
      return false;
    }

    try {
      setSyncStatus(prev => ({ ...prev, pendingSyncCount: prev.pendingSyncCount + 1 }));
      
      await NotesSyncService.syncLocalNotesToApi();
      
      setSyncStatus(prev => ({
        ...prev,
        pendingSyncCount: Math.max(API.DEFAULT_IDS.NEW_ENTITY, prev.pendingSyncCount - 1),
        lastSyncTime: new Date(),
        syncErrors: prev.syncErrors.slice(-SYNC.RECENT_ERRORS_KEEP) // Keep only recent errors
      }));
      
      return true;
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        pendingSyncCount: Math.max(API.DEFAULT_IDS.NEW_ENTITY, prev.pendingSyncCount - 1),
        syncErrors: [...prev.syncErrors.slice(-SYNC.MAX_RECENT_ERRORS), `Sync failed: ${error}`]
      }));
      return false;
    }
  }, [syncStatus.isOnline, syncStatus.isApiAvailable, syncStatus.isAuthenticated]);

  // Add sync error
  const addSyncError = useCallback((error: string) => {
    setSyncStatus(prev => ({
      ...prev,
      syncErrors: [...prev.syncErrors.slice(-SYNC.MAX_RECENT_ERRORS), error]
    }));
  }, []);

  // Clear sync errors
  const clearSyncErrors = useCallback(() => {
    setSyncStatus(prev => ({
      ...prev,
      syncErrors: []
    }));
  }, []);

  // Update authentication status
  const updateAuthStatus = useCallback(() => {
    const isAuthenticated = authApi.isAuthenticated();
    setSyncStatus(prev => ({
      ...prev,
      isAuthenticated,
      // If user becomes unauthenticated, mark API as unavailable
      isApiAvailable: isAuthenticated ? prev.isApiAvailable : false
    }));
    
    // Re-check API availability if user becomes authenticated
    if (isAuthenticated) {
      checkApiAvailability();
    }
  }, [checkApiAvailability]);

  // Listen to online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      // Check API availability when coming back online
      checkApiAvailability();
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ 
        ...prev, 
        isOnline: false, 
        isApiAvailable: false 
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkApiAvailability]);

  // Initial API availability check
  useEffect(() => {
    checkApiAvailability();
  }, [checkApiAvailability]);

  // Auto-sync when conditions are right
  useEffect(() => {
    if (syncStatus.isOnline && syncStatus.isApiAvailable && syncStatus.isAuthenticated && syncStatus.pendingSyncCount === API.DEFAULT_IDS.NEW_ENTITY) {
      const autoSyncTimer = setTimeout(() => {
        syncToApi();
      }, SYNC.AUTO_SYNC_INTERVAL); // Auto-sync every 5 minutes when online

      return () => clearTimeout(autoSyncTimer);
    }
  }, [syncStatus.isOnline, syncStatus.isApiAvailable, syncStatus.isAuthenticated, syncStatus.pendingSyncCount, syncToApi]);

  return {
    syncStatus,
    checkApiAvailability,
    syncToApi,
    addSyncError,
    clearSyncErrors,
    updateAuthStatus
  };
};
