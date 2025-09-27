export interface QueueItem {
  noteUuid: string;
  action: 'create' | 'update' | 'delete';
  timestamp: number;
  retryCount: number;
  lastRetryAt?: number;
  errorMessage?: string;
  localVersion?: number;
  syncVersion?: number;
}

export interface QueueStats {
  primary: {
    total: number;
    create: number;
    update: number;
    delete: number;
  };
  retry: {
    total: number;
    create: number;
    update: number;
    delete: number;
  };
}

// SignalR Real-time Sync Types
export interface NoteSyncEvent {
  eventType: 'CREATE' | 'UPDATE' | 'DELETE';
  userId: number;
  notes: Array<{
    id: number;
    uuid: string;
    title: string;
    content: string;
    date: string;
    color: string;
    position: { x: number; y: number };
    isDisplayed: boolean;
    isPinned: boolean;
    isTaskMode: boolean;
    tasks: Array<{
      id: number;
      content: string;
      isCompleted: boolean;
      order: number;
    }>;
    tags: Array<{
      id: number;
      name: string;
      color: string;
    }>;
    createdAt: string;
    updatedAt: string;
    syncVersion: number;
  }>;
  clientId?: string;
}

export interface SignalRConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionId?: string;
  lastError?: string;
  reconnectAttempts: number;
}

export interface RealTimeSyncStatus {
  isRealTimeEnabled: boolean;
  connectionState: SignalRConnectionState;
  lastEventReceived?: Date;
  eventsProcessed: number;
}