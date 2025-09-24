import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useSyncStatus } from '@/hooks/use-sync-status';
import { useAuthContext } from './AuthContext';

interface SyncContextType {
  syncStatus: ReturnType<typeof useSyncStatus>['syncStatus'];
  checkApiAvailability: ReturnType<typeof useSyncStatus>['checkApiAvailability'];
  syncToApi: ReturnType<typeof useSyncStatus>['syncToApi'];
  addSyncError: ReturnType<typeof useSyncStatus>['addSyncError'];
  clearSyncErrors: ReturnType<typeof useSyncStatus>['clearSyncErrors'];
  updateAuthStatus: ReturnType<typeof useSyncStatus>['updateAuthStatus'];
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const syncHook = useSyncStatus();
  const { isAuthenticated } = useAuthContext();

  // Update sync status when authentication changes
  useEffect(() => {
    syncHook.updateAuthStatus();
  }, [isAuthenticated, syncHook.updateAuthStatus]);

  return (
    <SyncContext.Provider value={syncHook}>
      {children}
    </SyncContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSyncContext = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
};
