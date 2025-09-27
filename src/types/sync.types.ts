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
