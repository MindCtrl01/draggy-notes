import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useSyncStatus } from '@/hooks/use-sync-status';
import { useAuthContext } from './AuthContext';
import { NotesSyncService } from '@/services/notes-sync-service';

type SyncContextType = ReturnType<typeof useSyncStatus>;

const SyncContext = createContext<SyncContextType | undefined>(undefined);

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const syncHook = useSyncStatus();
  const { isAuthenticated } = useAuthContext();

  // Initialize sync system when app starts
  useEffect(() => {
    if (isAuthenticated) {
      NotesSyncService.handleUserLogin();
    }

    // Cleanup on unmount
    return () => {
      NotesSyncService.stopSyncTimer();
    };
  }, []);

  // Handle authentication changes
  useEffect(() => {
    syncHook.handleAuthChange(isAuthenticated);
  }, [isAuthenticated]);

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
