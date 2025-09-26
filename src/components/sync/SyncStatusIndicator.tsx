import React from 'react';
import { useSyncStatus } from '@/hooks/use-sync-status';
import { SYNC } from '@/constants/ui-constants';
import { 
  WifiOff, 
  RefreshCw, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  CloudOff
} from 'lucide-react';

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const { 
    syncStatus, 
    triggerSync, 
    retryFailedItems, 
    clearSyncErrors 
  } = useSyncStatus();

  const getSyncStatusIcon = () => {
    if (!syncStatus.isAuthenticated) {
      return (
        <div title="Not authenticated">
          <CloudOff className="h-4 w-4 text-gray-500" />
        </div>
      );
    }

    if (!syncStatus.isOnline) {
      return (
        <div title="Offline">
          <WifiOff className="h-4 w-4 text-red-500" />
        </div>
      );
    }
    
    if (syncStatus.isSyncing) {
      return (
        <div title="Syncing...">
          <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
        </div>
      );
    }
    
    if (syncStatus.primaryQueueCount > SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT || syncStatus.retryQueueCount > SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT) {
      return (
        <div title="Pending sync">
          <Clock className="h-4 w-4 text-yellow-500" />
        </div>
      );
    }
    
    if (syncStatus.syncErrors.length > SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT) {
      return (
        <div title="Sync errors">
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </div>
      );
    }
    
    return (
      <div title="Synced">
        <CheckCircle className="h-4 w-4 text-green-500" />
      </div>
    );
  };

  const getSyncStatusText = () => {
    if (!syncStatus.isAuthenticated) {
      return 'Not authenticated - Changes saved locally';
    }

    if (!syncStatus.isOnline) {
      return 'Offline - Changes saved locally';
    }
    
    if (syncStatus.isSyncing) {
      return 'Syncing...';
    }
    
    if (syncStatus.primaryQueueCount > SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT) {
      return `${syncStatus.primaryQueueCount} pending sync`;
    }
    
    if (syncStatus.retryQueueCount > SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT) {
      return `${syncStatus.retryQueueCount} failed items`;
    }
    
    if (syncStatus.syncErrors.length > SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT) {
      return 'Sync errors occurred';
    }
    
    return 'All changes synced';
  };

  const formatLastSyncTime = () => {
    if (!syncStatus.lastSyncTime) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - syncStatus.lastSyncTime.getTime();
    const minutes = Math.floor(diff / (SYNC.TIME.MS_PER_SECOND * SYNC.TIME.SECONDS_PER_MINUTE));
    
    if (minutes < 1) return 'Just now';
    if (minutes < SYNC.TIME.MINUTES_PER_HOUR) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / SYNC.TIME.MINUTES_PER_HOUR);
    if (hours < SYNC.TIME.HOURS_PER_DAY) return `${hours}h ago`;
    
    return syncStatus.lastSyncTime.toLocaleDateString();
  };

  return (
    <div className={`flex items-center space-x-2 p-2 bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Status Icon and Text */}
      <div className="flex items-center space-x-2">
        {getSyncStatusIcon()}
        {showDetails && (
          <span className="text-sm font-medium">{getSyncStatusText()}</span>
        )}
      </div>

      {/* Queue Status Badges */}
      {showDetails && (
        <>
          {syncStatus.primaryQueueCount > SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT && (
            <div className="flex items-center space-x-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {syncStatus.primaryQueueCount} queued
              </span>
            </div>
          )}
          
          {syncStatus.retryQueueCount > SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT && (
            <div className="flex items-center space-x-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {syncStatus.retryQueueCount} failed
              </span>
            </div>
          )}
        </>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-1">
        {/* Manual Sync Button */}
        <button
          onClick={triggerSync}
          disabled={!syncStatus.isOnline || !syncStatus.isAuthenticated || syncStatus.isSyncing}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Manual sync"
        >
          <RefreshCw className={`h-3 w-3 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
        </button>

        {/* Retry Failed Button */}
        {syncStatus.retryQueueCount > SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT && (
          <button
            onClick={retryFailedItems}
            disabled={!syncStatus.isOnline || !syncStatus.isAuthenticated}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Retry failed items"
          >
            <AlertTriangle className="h-3 w-3" />
          </button>
        )}

        {/* Clear Errors Button */}
        {syncStatus.syncErrors.length > SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT && (
          <button
            onClick={clearSyncErrors}
            className="p-1 rounded hover:bg-gray-100"
            title="Clear errors"
          >
            <XCircle className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Last Sync Time */}
      {showDetails && syncStatus.lastSyncTime && (
        <span className="text-xs text-gray-500">
          Last sync: {formatLastSyncTime()}
        </span>
      )}

      {/* Sync Timer Status */}
      {showDetails && syncStatus.isAuthenticated && (
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${syncStatus.isTimerActive ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-xs text-gray-500">
            Auto-sync {syncStatus.isTimerActive ? 'on' : 'off'}
          </span>
        </div>
      )}

      {/* Queue Details Tooltip */}
      {showDetails && (syncStatus.primaryQueueCount > SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT || syncStatus.retryQueueCount > SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT) && (
        <div className="text-xs text-gray-500">
          Queue: {syncStatus.queueStats.primary.create}c, {syncStatus.queueStats.primary.update}u, {syncStatus.queueStats.primary.delete}d
          {syncStatus.retryQueueCount > SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT && (
            <span className="text-red-500"> | Retry: {syncStatus.retryQueueCount}</span>
          )}
        </div>
      )}

      {/* Error Details */}
      {showDetails && syncStatus.syncErrors.length > SYNC.DEFAULT_QUEUE_STATS.EMPTY_COUNT && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-white border rounded shadow-lg z-10 max-w-xs">
          <div className="text-xs font-medium mb-1 text-red-600">Recent Sync Errors:</div>
          {syncStatus.syncErrors.slice(SYNC.QUEUE_PROCESSING.ERROR_SLICE_START).map((error, index) => (
            <div key={index} className="text-xs text-red-600 mb-1 break-words">
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
