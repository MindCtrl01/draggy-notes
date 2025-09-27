# 🔄 SignalR Real-Time Sync Integration

This document describes the SignalR real-time synchronization implementation that integrates with the existing localStorage-based sync system.

## 📋 Overview

The SignalR integration provides real-time synchronization of notes across multiple clients while maintaining the existing offline-first approach with localStorage. When a user creates, updates, or deletes notes on one client, other connected clients receive these changes instantly.

## 🏗️ Architecture

### Core Components

1. **SignalRService** (`src/services/signalr/signalr-service.ts`)
   - Manages SignalR connection lifecycle
   - Handles real-time events from server
   - Integrates with localStorage for conflict resolution

2. **Enhanced NotesSyncService** (`src/services/notes-sync-service.ts`)
   - Integrates SignalR with existing sync system
   - Provides event handlers for real-time updates
   - Maintains backward compatibility

3. **Updated Types** (`src/types/sync.types.ts`)
   - Defines SignalR event structures
   - Connection state interfaces
   - Real-time sync status types

4. **Enhanced Sync Hook** (`src/hooks/use-sync-status.ts`)
   - Includes real-time connection status
   - Provides SignalR status information
   - Handles real-time event updates

## 🎯 Key Features

### Real-Time Event Handling

The system handles three main SignalR events from the server:

#### 1. NotesCreated Event
```typescript
{
  EventType: "CREATE",
  UserId: 123,
  Notes: [...],
  ClientId?: "optional-client-id"
}
```

**Behavior:**
- Adds new notes to localStorage if they don't exist
- Updates existing notes if server version is newer
- Skips events from the same client to prevent loops

#### 2. NotesUpdated Event
```typescript
{
  EventType: "UPDATE", 
  UserId: 123,
  Notes: [...],
  ClientId?: "optional-client-id"
}
```

**Behavior:**
- Updates notes in localStorage if server version is newer
- Preserves local changes (checks localVersion vs syncVersion)
- Creates missing notes if they don't exist locally

#### 3. NotesDeleted Event
```typescript
{
  EventType: "DELETE",
  UserId: 123, 
  Notes: [...],
  ClientId?: "optional-client-id"
}
```

**Behavior:**
- Deletes notes from localStorage if no local changes exist
- Preserves notes with unsaved local changes
- Prevents accidental data loss

### Connection Management

- **Automatic Connection**: Connects when user logs in
- **Automatic Reconnection**: Handles network interruptions
- **Exponential Backoff**: Smart retry logic with increasing delays
- **Connection State Tracking**: Provides detailed connection status

### Conflict Resolution

The system uses version-based conflict resolution:

1. **Server Wins**: When server version > local sync version AND no local changes
2. **Local Wins**: When local changes exist (localVersion > syncVersion)
3. **Smart Merging**: Preserves user work while applying server updates

## 🚀 Usage

### Basic Integration

The SignalR integration is automatically initialized when a user logs in:

```typescript
// Automatically handled by NotesSyncService
NotesSyncService.handleUserLogin(); // Starts SignalR connection
```

### Getting Real-Time Status

```typescript
const { syncStatus } = useSyncStatus();

// Access real-time status
const {
  isRealTimeEnabled,
  connectionState: {
    isConnected,
    isConnecting,
    connectionId,
    reconnectAttempts
  },
  eventsProcessed,
  lastEventReceived
} = syncStatus.realTimeStatus;
```

### Listening to Real-Time Events

```typescript
// Add event handler for real-time updates
NotesSyncService.addRealTimeEventHandler('notesCreated', (data) => {
  console.log('Notes created:', data.notes);
  // Handle UI updates
});

// Remove event handler
NotesSyncService.removeRealTimeEventHandler('notesCreated', handler);
```

## 🔧 Configuration

### Environment Variables

The SignalR connection uses the API base URL:

```bash
# .env.local
VITE_API_BASE_URL=https://localhost:7060/api
```

The SignalR hub URL is automatically derived: `https://localhost:7060/notesHub`

### Connection Options

- **Authentication**: Uses JWT tokens from TokenManager
- **Automatic Reconnect**: Enabled with exponential backoff
- **Logging**: Information level logging enabled
- **Max Reconnect Attempts**: 5 attempts before giving up

## 🛡️ Error Handling

### Connection Errors
- Automatic retry with exponential backoff
- Graceful degradation to polling-based sync
- Detailed error logging and status reporting

### Event Processing Errors
- Individual event failures don't affect other events
- Error logging with context information
- Continues processing subsequent events

### Network Issues
- Automatic reconnection when network is restored
- Maintains offline functionality through localStorage
- Seamless transition between online/offline modes

## 🔄 Integration with Existing Sync

The SignalR integration works alongside the existing sync system:

1. **Real-Time Updates**: Immediate updates via SignalR
2. **Batch Sync**: Periodic sync for reliability (every 5 minutes)
3. **Queue Management**: Maintains sync queue for offline operations
4. **Conflict Resolution**: Consistent version-based resolution

## 📊 Monitoring

### Connection Status
```typescript
const signalRStatus = NotesSyncService.getSignalRStatus();
console.log('Connected:', signalRStatus.isConnected);
console.log('Connection ID:', signalRStatus.connectionState.connectionId);
```

### Event Statistics
```typescript
const { realTimeStatus } = syncStatus;
console.log('Events processed:', realTimeStatus.eventsProcessed);
console.log('Last event:', realTimeStatus.lastEventReceived);
```

## 🚨 Important Notes

### Client ID Handling
Currently uses SignalR connection ID as client ID. For production, consider implementing a more sophisticated client identification system.

### Version Synchronization
The system relies on `syncVersion` and `localVersion` fields for conflict resolution. Ensure these are properly maintained in your Note model.

### Server Requirements
The server must implement the SignalR hub with the following methods:
- `NotesCreated` event broadcast
- `NotesUpdated` event broadcast  
- `NotesDeleted` event broadcast

### Security
- JWT authentication required for SignalR connection
- User isolation enforced (events only sent to correct user)
- Client ID exclusion prevents event loops

## 🔮 Future Enhancements

1. **Operational Transforms**: More sophisticated conflict resolution
2. **Presence Indicators**: Show which users are online
3. **Typing Indicators**: Real-time collaboration features
4. **Custom Client IDs**: Better client identification
5. **Event Compression**: Batch multiple events for efficiency
