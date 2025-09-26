# 🔄 Client-Side Sync Implementation Guide

This guide provides a comprehensive implementation plan for the client-side synchronization functionality in the Draggy Notes application.

## 📋 Overview

The client-side sync system implements an offline-first approach where:
- Notes are stored locally in `localStorage` for immediate access
- API synchronization happens in the background for authenticated users
- Graceful fallback to localStorage-only mode for offline or unauthenticated users

## 🏗️ Architecture Components

### Core Services

```typescript
// Main sync service
src/services/notes-sync-service.ts

// Sync status hook
src/hooks/use-sync-status.ts

// API layer
src/services/api/notes-api.ts

// Local storage helper
src/helpers/notes-storage.ts

// Data transformers
src/services/api/transformers/note-transformers.ts
```

## 📝 Implementation Steps

### Step 1: Set Up Local Storage System

Create the `NotesStorage` helper class to manage localStorage operations:

```typescript
// src/helpers/notes-storage.ts
export class NotesStorage {
  static saveNote(note: Note): void {
    const key = `draggy-notes-${note.uuid}`;
    const noteData = {
      ...note,
      date: note.date.toISOString(),
      createdAt: note.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: note.updatedAt?.toISOString() || new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(noteData));
    this.updateNotesList(note.uuid, 'add');
  }

  static getNote(noteUuid: string): Note | null {
    const key = `draggy-notes-${noteUuid}`;
    const noteData = localStorage.getItem(key);
    if (!noteData) return null;
    
    const parsed = JSON.parse(noteData);
    return {
      ...parsed,
      date: new Date(parsed.date),
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
    };
  }

  static getAllNotes(): Note[] {
    const notesList = this.getNotesList();
    return notesList
      .map(uuid => this.getNote(uuid))
      .filter(note => note !== null);
  }

  static deleteNote(noteUuid: string): void {
    const key = `draggy-notes-${noteUuid}`;
    localStorage.removeItem(key);
    this.updateNotesList(noteUuid, 'remove');
  }
}
```

### Step 2: Create API Data Transformers

Implement transformers to convert between domain models and API models:

```typescript
// src/services/api/transformers/note-transformers.ts
export function transformNoteResponseToNote(response: NoteResponse): Note {
  return {
    id: response.id,
    uuid: response.uuid,
    title: response.title,
    content: response.content,
    date: new Date(response.date),
    color: response.color,
    isDisplayed: response.isDisplayed,
    isPinned: response.isPinned || false,
    position: { x: response.position.x, y: response.position.y },
    createdAt: new Date(response.createdAt),
    updatedAt: new Date(response.updatedAt),
    userId: API.DEFAULT_IDS.TEMPORARY_USER,
    isTaskMode: response.isTaskMode || false,
    noteTasks: response.tasks?.map(transformTaskResponseToNoteTask) || [],
    tags: response.tags.map(transformTagResponseToTag)
  };
}

export function transformNoteToCreateRequest(note: Note): CreateNoteRequest {
  return {
    title: note.title,
    content: note.content,
    date: note.date.toISOString(),
    color: note.color,
    isDisplayed: note.isDisplayed,
    position: { x: note.position.x, y: note.position.y },
    noteTasks: note.noteTasks?.map(transformNoteTaskToCreateRequest) || null,
    isTaskMode: note.isTaskMode || false,
    isPinned: note.isPinned || false,
    tagNames: note.tags?.map(tag => tag.name) || null
  };
}
```

### Step 3: Implement Notes API Service

Create the API service with proper error handling:

```typescript
// src/services/api/notes-api.ts
class NotesApi {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = TokenManager.getToken();
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.message || `API Error: ${response.status}`);
    }
    
    return await response.json();
  }

  async getAllNotes(): Promise<NoteResponse[]> {
    const response = await this.makeRequest<NoteResponse[]>('/api/notes');
    return response.data || [];
  }

  async createNote(noteData: CreateNoteRequest): Promise<NoteResponse> {
    const response = await this.makeRequest<NoteResponse>('/api/notes', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
    return response.data!;
  }

  async updateNote(request: UpdateNoteRequest): Promise<NoteResponse> {
    const response = await this.makeRequest<NoteResponse>(`/api/notes/${request.id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
    return response.data!;
  }
}
```

### Step 4: Create Sync Service with Offline-First Strategy

Implement the main sync service that handles both online and offline scenarios:

```typescript
// src/services/notes-sync-service.ts
export class NotesSyncService {
  static async createNote(note: Note): Promise<Note> {
    // Always save to localStorage first for immediate UI feedback
    NotesStorage.saveNote(note);
    
    // If user is not authenticated, only use localStorage
    if (!this.isAuthenticated()) {
      return note;
    }
    
    try {
      // Try to sync with API
      const createRequest = transformNoteToCreateRequest(note);
      const apiResponse = await notesApi.createNote(createRequest);
      const syncedNote = transformNoteResponseToNote(apiResponse);
      
      // Update localStorage with the synced version (includes server ID)
      NotesStorage.saveNote(syncedNote);
      return syncedNote;
    } catch (error) {
      console.warn('Failed to create note via API, using localStorage only:', error);
      return note;
    }
  }

  static async updateNote(note: Note): Promise<Note> {
    // Always save to localStorage first
    NotesStorage.saveNote(note);
    
    if (!this.isAuthenticated() || note.id === API.DEFAULT_IDS.NEW_ENTITY) {
      return note;
    }
    
    try {
      const updateRequest = transformNoteToUpdateRequest(note);
      const apiResponse = await notesApi.updateNote(updateRequest);
      const syncedNote = transformNoteResponseToNote(apiResponse);
      
      NotesStorage.saveNote(syncedNote);
      return syncedNote;
    } catch (error) {
      console.warn('Failed to update note via API, using localStorage only:', error);
      return note;
    }
  }

  static async loadAllNotes(): Promise<Note[]> {
    if (!this.isAuthenticated()) {
      return NotesStorage.getAllNotes();
    }
    
    try {
      const apiResponse = await notesApi.getAllNotes();
      const apiNotes = apiResponse.map(transformNoteResponseToNote);
      
      // Sync API notes to localStorage
      apiNotes.forEach(note => NotesStorage.saveNote(note));
      return apiNotes;
    } catch (error) {
      console.warn('Failed to load notes from API, using localStorage:', error);
      return NotesStorage.getAllNotes();
    }
  }
}
```

### Step 5: Create Sync Status Hook

Implement a React hook to track sync status and provide sync controls:

```typescript
// src/hooks/use-sync-status.ts
export interface SyncStatus {
  isOnline: boolean;
  isApiAvailable: boolean;
  isAuthenticated: boolean;
  lastSyncTime: Date | null;
  pendingSyncCount: number;
  syncErrors: string[];
}

export const useSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isApiAvailable: false,
    isAuthenticated: authApi.isAuthenticated(),
    lastSyncTime: null,
    pendingSyncCount: 0,
    syncErrors: []
  });

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

  const syncToApi = useCallback(async () => {
    if (!syncStatus.isOnline || !syncStatus.isApiAvailable || !syncStatus.isAuthenticated) {
      return false;
    }

    try {
      setSyncStatus(prev => ({ ...prev, pendingSyncCount: prev.pendingSyncCount + 1 }));
      await NotesSyncService.syncLocalNotesToApi();
      
      setSyncStatus(prev => ({
        ...prev,
        pendingSyncCount: Math.max(0, prev.pendingSyncCount - 1),
        lastSyncTime: new Date()
      }));
      return true;
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        pendingSyncCount: Math.max(0, prev.pendingSyncCount - 1),
        syncErrors: [...prev.syncErrors, `Sync failed: ${error}`]
      }));
      return false;
    }
  }, [syncStatus]);

  // Listen to online/offline events
  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false, isApiAvailable: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    syncStatus,
    checkApiAvailability,
    syncToApi,
    addSyncError: (error: string) => setSyncStatus(prev => ({ ...prev, syncErrors: [...prev.syncErrors, error] })),
    clearSyncErrors: () => setSyncStatus(prev => ({ ...prev, syncErrors: [] }))
  };
};
```

### Step 6: Create Sync Context Provider

Set up a React context to provide sync functionality throughout the app:

```typescript
// src/components/common/contexts/SyncContext.tsx
const SyncContext = createContext<ReturnType<typeof useSyncStatus> | null>(null);

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const syncHook = useSyncStatus();
  const { isAuthenticated } = useAuthContext();

  // Update sync status when authentication changes
  useEffect(() => {
    syncHook.updateAuthStatus();
  }, [isAuthenticated]);

  return (
    <SyncContext.Provider value={syncHook}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
};
```

## 🔧 Configuration

### Environment Variables

```bash
# .env.local
VITE_API_BASE_URL=https://localhost:7060/api
VITE_API_TIMEOUT=10000
VITE_SYNC_INTERVAL=300000  # 5 minutes auto-sync
```

### Constants

```typescript
// src/constants/ui-constants.ts
export const SYNC = {
  AUTO_SYNC_INTERVAL: 300000, // 5 minutes
  MAX_RECENT_ERRORS: 10,
  RECENT_ERRORS_KEEP: 5,
};

export const API = {
  DEFAULT_IDS: {
    NEW_ENTITY: 0,
    TEMPORARY_USER: -1,
  },
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  }
};
```

## 🎯 Usage Examples

### Basic Note Operations

```typescript
// Create a note
const newNote = await NotesSyncService.createNote({
  uuid: uuidv7(),
  title: "My Note",
  content: "Note content",
  // ... other properties
});

// Update a note
const updatedNote = await NotesSyncService.updateNote(existingNote);

// Load all notes
const notes = await NotesSyncService.loadAllNotes();
```

### Using Sync Status

```typescript
function MyComponent() {
  const { syncStatus, syncToApi, checkApiAvailability } = useSyncContext();

  return (
    <div>
      <p>Status: {syncStatus.isOnline ? 'Online' : 'Offline'}</p>
      <p>API: {syncStatus.isApiAvailable ? 'Available' : 'Unavailable'}</p>
      <p>Last Sync: {syncStatus.lastSyncTime?.toLocaleString()}</p>
      
      <button onClick={syncToApi} disabled={!syncStatus.isOnline}>
        Sync Now
      </button>
    </div>
  );
}
```

## 🔍 Testing Strategy

### Unit Tests

```typescript
describe('NotesSyncService', () => {
  it('should save to localStorage when API is unavailable', async () => {
    // Mock API failure
    jest.spyOn(notesApi, 'createNote').mockRejectedValue(new Error('API Error'));
    
    const note = createMockNote();
    const result = await NotesSyncService.createNote(note);
    
    expect(NotesStorage.getNote(note.uuid)).toEqual(note);
    expect(result).toEqual(note);
  });

  it('should sync to API when available', async () => {
    const mockApiResponse = createMockNoteResponse();
    jest.spyOn(notesApi, 'createNote').mockResolvedValue(mockApiResponse);
    
    const note = createMockNote();
    const result = await NotesSyncService.createNote(note);
    
    expect(result.id).toBe(mockApiResponse.id);
  });
});
```

### Integration Tests

```typescript
describe('Sync Integration', () => {
  it('should handle offline to online transition', async () => {
    // Start offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    
    const { result } = renderHook(() => useSyncStatus());
    expect(result.current.syncStatus.isOnline).toBe(false);
    
    // Go online
    Object.defineProperty(navigator, 'onLine', { value: true });
    fireEvent(window, new Event('online'));
    
    expect(result.current.syncStatus.isOnline).toBe(true);
  });
});
```

## 📚 Error Handling

### Common Error Scenarios

1. **Network Errors**: Graceful fallback to localStorage
2. **Authentication Errors**: Switch to unauthenticated mode
3. **API Errors**: Log errors and continue with local operations
4. **Storage Quota**: Implement cleanup strategies

### Error Recovery

```typescript
// Automatic retry mechanism
const retryOperation = async (operation: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

## 🚀 Performance Optimizations

1. **Debounced Sync**: Batch multiple operations
2. **Selective Sync**: Only sync changed notes
3. **Background Sync**: Use Web Workers for heavy operations
4. **Compression**: Compress large note content

## 🔒 Security Considerations

1. **Token Management**: Secure storage and refresh
2. **Data Validation**: Sanitize all user input
3. **HTTPS Only**: Ensure all API calls use HTTPS
4. **Local Storage Encryption**: Consider encrypting sensitive data

This implementation provides a robust, offline-first sync system that ensures data availability and consistency across different network conditions while maintaining a smooth user experience.
