import React from 'react';
import { useSyncContext } from '@/components/common/contexts/SyncContext';
import { WifiOff, Cloud, CloudOff, Loader2, AlertCircle } from 'lucide-react';
import { SYNC, COMPONENT_SIZES, API } from '@/constants/ui-constants';

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const { syncStatus, syncToApi, clearSyncErrors } = useSyncContext();

  const getStatusIcon = () => {
    if (!syncStatus.isAuthenticated) {
      return (
        <div title="Not Signed In">
          <CloudOff className={`w-${COMPONENT_SIZES.ICONS.SMALL} h-${COMPONENT_SIZES.ICONS.SMALL} text-gray-500`} />
        </div>
      );
    }
    
    if (!syncStatus.isOnline) {
      return (
        <div title="Offline">
          <WifiOff className={`w-${COMPONENT_SIZES.ICONS.SMALL} h-${COMPONENT_SIZES.ICONS.SMALL} text-red-500`} />
        </div>
      );
    }
    
    if (syncStatus.pendingSyncCount > API.DEFAULT_IDS.NEW_ENTITY) {
      return (
        <div title="Syncing...">
          <Loader2 className={`w-${COMPONENT_SIZES.ICONS.SMALL} h-${COMPONENT_SIZES.ICONS.SMALL} text-blue-500 animate-spin`} />
        </div>
      );
    }
    
    if (!syncStatus.isApiAvailable) {
      return (
        <div title="API Unavailable">
          <CloudOff className={`w-${COMPONENT_SIZES.ICONS.SMALL} h-${COMPONENT_SIZES.ICONS.SMALL} text-yellow-500`} />
        </div>
      );
    }
    
    if (syncStatus.syncErrors.length > API.DEFAULT_IDS.NEW_ENTITY) {
      return (
        <div title="Sync Errors">
          <AlertCircle className={`w-${COMPONENT_SIZES.ICONS.SMALL} h-${COMPONENT_SIZES.ICONS.SMALL} text-orange-500`} />
        </div>
      );
    }
    
    return (
      <div title="Online & Synced">
        <Cloud className={`w-${COMPONENT_SIZES.ICONS.SMALL} h-${COMPONENT_SIZES.ICONS.SMALL} text-green-500`} />
      </div>
    );
  };

  const getStatusText = () => {
    if (!syncStatus.isAuthenticated) {
      return 'Not signed in - Changes saved locally';
    }
    
    if (!syncStatus.isOnline) {
      return 'Offline - Changes saved locally';
    }
    
    if (syncStatus.pendingSyncCount > API.DEFAULT_IDS.NEW_ENTITY) {
      return `Syncing... (${syncStatus.pendingSyncCount} pending)`;
    }
    
    if (!syncStatus.isApiAvailable) {
      return 'API unavailable - Changes saved locally';
    }
    
    if (syncStatus.syncErrors.length > API.DEFAULT_IDS.NEW_ENTITY) {
      return `Sync errors (${syncStatus.syncErrors.length})`;
    }
    
    return 'Online & synced';
  };

  const formatLastSyncTime = () => {
    if (!syncStatus.lastSyncTime) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - syncStatus.lastSyncTime.getTime();
    const minutes = Math.floor(diff / SYNC.TIME.MS_PER_MINUTE);
    
    if (minutes < 1) return 'Just now';
    if (minutes < SYNC.TIME.MINUTES_PER_HOUR) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / SYNC.TIME.MINUTES_PER_HOUR);
    if (hours < SYNC.TIME.HOURS_PER_DAY) return `${hours}h ago`;
    
    return syncStatus.lastSyncTime.toLocaleDateString();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        {getStatusIcon()}
        {showDetails && (
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {getStatusText()}
          </span>
        )}
      </div>
      
      {showDetails && (
        <div className="flex items-center gap-2">
          {syncStatus.lastSyncTime && (
            <span className="text-xs text-gray-500">
              Last sync: {formatLastSyncTime()}
            </span>
          )}
          
          {syncStatus.isOnline && !syncStatus.isApiAvailable && syncStatus.isAuthenticated && (
            <button
              onClick={syncToApi}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
              disabled={syncStatus.pendingSyncCount > API.DEFAULT_IDS.NEW_ENTITY}
            >
              Retry Sync
            </button>
          )}
          
          {syncStatus.syncErrors.length > API.DEFAULT_IDS.NEW_ENTITY && (
            <button
              onClick={clearSyncErrors}
              className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300"
            >
              Clear Errors
            </button>
          )}
        </div>
      )}
      
      {showDetails && syncStatus.syncErrors.length > API.DEFAULT_IDS.NEW_ENTITY && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border rounded shadow-lg z-10 max-w-xs">
          <div className="text-xs font-medium mb-1">Recent Sync Errors:</div>
          {syncStatus.syncErrors.slice(-SYNC.MAX_ERRORS_DISPLAY).map((error, index) => (
            <div key={index} className="text-xs text-red-600 dark:text-red-400 mb-1">
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
