import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { TokenManager } from '@/helpers/token-manager';
import { NoteSyncEvent, SignalRConnectionState, RealTimeSyncStatus } from '@/types/sync.types';
import { Note } from '@/domains/note';
import { NotesStorage } from '@/helpers/notes-storage';

/**
 * SignalR service for real-time note synchronization
 * Handles connection management and event processing
 */
export class SignalRService {
  private static connection: HubConnection | null = null;
  private static connectionState: SignalRConnectionState = {
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0
  };
  private static realTimeStatus: RealTimeSyncStatus = {
    isRealTimeEnabled: false,
    connectionState: SignalRService.connectionState,
    eventsProcessed: 0
  };
  private static eventHandlers: Map<string, Function[]> = new Map();
  private static maxReconnectAttempts = 5;
  private static reconnectDelay = 5000; // 5 seconds

  /**
   * Initialize SignalR connection
   */
  static async initialize(): Promise<void> {
    if (!this.canConnect()) {
      console.log('Cannot initialize SignalR: user not authenticated or already connected');
      return;
    }

    try {
      this.connectionState.isConnecting = true;
      this.updateRealTimeStatus();

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5231/api';
      const hubUrl = `${apiBaseUrl}/hubs/notesync`;

      this.connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => {
            const token = TokenManager.getToken();
            return token || '';
          },
          skipNegotiation: false, // Allow negotiation for best transport
          transport: undefined // Let SignalR choose the best transport
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Exponential backoff with max delay of 30 seconds
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
        })
        .configureLogging(LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      // Set up connection event handlers
      this.setupConnectionEventHandlers();

      // Start the connection
      await this.connection.start();
      
      this.connectionState.isConnected = true;
      this.connectionState.isConnecting = false;
      this.connectionState.connectionId = this.connection.connectionId || undefined;
      this.connectionState.reconnectAttempts = 0;
      this.connectionState.lastError = undefined;
      this.realTimeStatus.isRealTimeEnabled = true;
      
      this.updateRealTimeStatus();
      
      console.log('SignalR connected successfully', {
        connectionId: this.connection.connectionId,
        state: this.connection.state
      });

    } catch (error) {
      this.connectionState.isConnected = false;
      this.connectionState.isConnecting = false;
      this.connectionState.lastError = (error as Error).message;
      this.realTimeStatus.isRealTimeEnabled = false;
      
      this.updateRealTimeStatus();
      
      console.error('Failed to initialize SignalR connection:', error);
      
      // Schedule retry if within limits
      if (this.connectionState.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.connectionState.reconnectAttempts++;
          this.initialize();
        }, this.reconnectDelay);
      }
    }
  }

  /**
   * Disconnect SignalR connection
   */
  static async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('SignalR disconnected successfully');
      } catch (error) {
        console.error('Error disconnecting SignalR:', error);
      } finally {
        this.connection = null;
        this.connectionState.isConnected = false;
        this.connectionState.isConnecting = false;
        this.connectionState.connectionId = undefined;
        this.realTimeStatus.isRealTimeEnabled = false;
        this.updateRealTimeStatus();
      }
    }
  }

  /**
   * Check if connection can be established
   */
  private static canConnect(): boolean {
    return (
      TokenManager.isAuthenticated() &&
      navigator.onLine &&
      !this.connectionState.isConnected &&
      !this.connectionState.isConnecting
    );
  }

  /**
   * Set up SignalR event handlers for note sync events
   */
  private static setupEventHandlers(): void {
    if (!this.connection) return;

    // Handle NotesCreated event
    this.connection.on('NotesCreated', (syncEvent: NoteSyncEvent) => {
      console.log('Received NotesCreated event:', syncEvent);
      this.handleNotesCreated(syncEvent);
    });

    // Handle NotesUpdated event
    this.connection.on('NotesUpdated', (syncEvent: NoteSyncEvent) => {
      console.log('Received NotesUpdated event:', syncEvent);
      this.handleNotesUpdated(syncEvent);
    });

    // Handle NotesDeleted event
    this.connection.on('NotesDeleted', (syncEvent: NoteSyncEvent) => {
      console.log('Received NotesDeleted event:', syncEvent);
      this.handleNotesDeleted(syncEvent);
    });
  }

  /**
   * Set up connection lifecycle event handlers
   */
  private static setupConnectionEventHandlers(): void {
    if (!this.connection) return;

    this.connection.onclose((error) => {
      console.log('SignalR connection closed', error);
      this.connectionState.isConnected = false;
      this.connectionState.connectionId = undefined;
      this.realTimeStatus.isRealTimeEnabled = false;
      if (error) {
        this.connectionState.lastError = error.message;
      }
      this.updateRealTimeStatus();
      this.notifyEventHandlers('connectionClosed', { error });
    });

    this.connection.onreconnecting((error) => {
      console.log('SignalR reconnecting...', error);
      this.connectionState.isConnecting = true;
      this.connectionState.isConnected = false;
      if (error) {
        this.connectionState.lastError = error.message;
      }
      this.updateRealTimeStatus();
      this.notifyEventHandlers('reconnecting', { error });
    });

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected', connectionId);
      this.connectionState.isConnected = true;
      this.connectionState.isConnecting = false;
      this.connectionState.connectionId = connectionId || undefined;
      this.connectionState.reconnectAttempts = 0;
      this.connectionState.lastError = undefined;
      this.realTimeStatus.isRealTimeEnabled = true;
      this.updateRealTimeStatus();
      this.notifyEventHandlers('reconnected', { connectionId });
    });
  }

  /**
   * Handle NotesCreated event from server
   */
  private static handleNotesCreated(syncEvent: NoteSyncEvent): void {
    try {
      const currentUser = TokenManager.getCurrentUserFromToken();
      if (!currentUser || currentUser.id != syncEvent.userId) {
        console.log('Ignoring NotesCreated event for different user');
        return;
      }

      // Skip if this event came from the current client
      // if (syncEvent.clientId && this.isCurrentClient(syncEvent.clientId)) {
      //   console.log('Ignoring NotesCreated event from current client');
      //   return;
      // }

      // Process each created note
      syncEvent.notes.forEach(noteData => {
        const existingNote = NotesStorage.getNote(noteData.uuid);
        
        if (!existingNote) {
          // New note from another client - add to localStorage
          const note = this.transformServerNoteToLocalNote(noteData);
          NotesStorage.saveNote(note);
          console.log(`Added new note from server: ${note.uuid}`);
        } else {
          // Note exists locally - check versions
          const serverSyncVersion = noteData.syncVersion || 1;
          const localSyncVersion = existingNote.syncVersion || 1;
          
          if (serverSyncVersion > localSyncVersion) {
            // Server version is newer - update local note
            const note = this.transformServerNoteToLocalNote(noteData);
            NotesStorage.saveNote(note);
            console.log(`Updated existing note from server: ${note.uuid} (server v${serverSyncVersion} > local v${localSyncVersion})`);
          } else {
            console.log(`Keeping local version of note: ${noteData.uuid} (local v${localSyncVersion} >= server v${serverSyncVersion})`);
          }
        }
      });

      this.realTimeStatus.eventsProcessed++;
      this.realTimeStatus.lastEventReceived = new Date();
      this.updateRealTimeStatus();
      
      // Notify event handlers
      this.notifyEventHandlers('notesCreated', { syncEvent, notes: syncEvent.notes });
      
      // Force reload all notes from localStorage after successful sync
      this.notifyEventHandlers('forceReloadNotes', { reason: 'notesCreated', affectedNotes: syncEvent.notes.length });

    } catch (error) {
      console.error('Error handling NotesCreated event:', error);
    }
  }

  /**
   * Handle NotesUpdated event from server
   */
  private static handleNotesUpdated(syncEvent: NoteSyncEvent): void {
    try {
      const currentUser = TokenManager.getCurrentUserFromToken();
      if (!currentUser || currentUser.id != syncEvent.userId) {
        console.log('Ignoring NotesCreated event for different user');
        return;
      }

      // Skip if this event came from the current client
      // if (syncEvent.clientId && this.isCurrentClient(syncEvent.clientId)) {
      //   console.log('Ignoring NotesCreated event from current client');
      //   return;
      // }

      // Process each updated note
      syncEvent.notes.forEach(noteData => {
        const existingNote = NotesStorage.getNote(noteData.uuid);
        
        if (existingNote) {
          // Check versions to determine if we should update
          const serverSyncVersion = noteData.syncVersion || 1;
          const localSyncVersion = existingNote.syncVersion || 1;
          const localVersion = existingNote.localVersion || 1;
          
          // Only update if server version is newer and local hasn't been modified
          if (serverSyncVersion > localSyncVersion && localVersion === localSyncVersion) {
            const note = this.transformServerNoteToLocalNote(noteData);
            NotesStorage.saveNote(note);
            console.log(`Updated note from server: ${note.uuid} (server v${serverSyncVersion} > local v${localSyncVersion})`);
          } else {
            console.log(`Keeping local version of note: ${noteData.uuid} (local modifications detected or server version not newer)`);
          }
        } else {
          // Note doesn't exist locally - treat as create
          const note = this.transformServerNoteToLocalNote(noteData);
          NotesStorage.saveNote(note);
          console.log(`Added missing note from server update: ${note.uuid}`);
        }
      });

      this.realTimeStatus.eventsProcessed++;
      this.realTimeStatus.lastEventReceived = new Date();
      this.updateRealTimeStatus();
      
      // Notify event handlers
      this.notifyEventHandlers('notesUpdated', { syncEvent, notes: syncEvent.notes });
      
      // Force reload all notes from localStorage after successful sync
      this.notifyEventHandlers('forceReloadNotes', { reason: 'notesUpdated', affectedNotes: syncEvent.notes.length });

    } catch (error) {
      console.error('Error handling NotesUpdated event:', error);
    }
  }

  /**
   * Handle NotesDeleted event from server
   */
  private static handleNotesDeleted(syncEvent: NoteSyncEvent): void {
    try {
      const currentUser = TokenManager.getCurrentUserFromToken();
      if (!currentUser || currentUser.id != syncEvent.userId) {
        console.log('Ignoring NotesCreated event for different user');
        return;
      }

      // Skip if this event came from the current client
      // if (syncEvent.clientId && this.isCurrentClient(syncEvent.clientId)) {
      //   console.log('Ignoring NotesCreated event from current client');
      //   return;
      // }

      // Process each deleted note
      syncEvent.notes.forEach(noteData => {
        const existingNote = NotesStorage.getNote(noteData.uuid);
        
        if (existingNote) {
          // Check if local note has unsaved changes
          const localVersion = existingNote.localVersion || 1;
          const syncVersion = existingNote.syncVersion || 1;
          
          if (localVersion > syncVersion) {
            console.log(`Not deleting note ${noteData.uuid}: has unsaved local changes`);
          } else {
            // Safe to delete - no local changes
            NotesStorage.deleteNote(noteData.uuid);
            console.log(`Deleted note from server: ${noteData.uuid}`);
          }
        }
      });

      this.realTimeStatus.eventsProcessed++;
      this.realTimeStatus.lastEventReceived = new Date();
      this.updateRealTimeStatus();
      
      // Notify event handlers
      this.notifyEventHandlers('notesDeleted', { syncEvent, notes: syncEvent.notes });
      
      // Force reload all notes from localStorage after successful sync
      this.notifyEventHandlers('forceReloadNotes', { reason: 'notesDeleted', affectedNotes: syncEvent.notes.length });

    } catch (error) {
      console.error('Error handling NotesDeleted event:', error);
    }
  }

  /**
   * Transform server note data to local Note object
   */
  private static transformServerNoteToLocalNote(serverNote: any): Note {
    return {
      id: serverNote.id,
      uuid: serverNote.uuid,
      title: serverNote.title,
      content: serverNote.content,
      date: new Date(serverNote.date),
      color: serverNote.color,
      position: serverNote.position,
      isDisplayed: serverNote.isDisplayed,
      isPinned: serverNote.isPinned,
      isTaskMode: serverNote.isTaskMode,
      isDeleted: serverNote.isDeleted,
      noteTasks: serverNote.tasks || [],
      tags: serverNote.tags || [],
      createdAt: new Date(serverNote.createdAt),
      updatedAt: new Date(serverNote.updatedAt),
      userId: serverNote.userId || -1,
      syncVersion: serverNote.syncVersion || 1,
      localVersion: serverNote.syncVersion || 1, // Set localVersion to syncVersion for server notes
      lastSyncedAt: new Date(),
      clientUpdatedAt: undefined // Clear client update timestamp for server notes
    };
  }

  /**
   * Check if the client ID matches the current client
   */
  // private static isCurrentClient(clientId: string): boolean {
  //   // For now, we'll use connection ID as client ID
  //   // You might want to implement a more sophisticated client identification
  //   return this.connectionState.connectionId === clientId;
  // }

  /**
   * Update real-time status and notify listeners
   */
  private static updateRealTimeStatus(): void {
    this.realTimeStatus.connectionState = { ...this.connectionState };
    this.notifyEventHandlers('statusUpdated', this.realTimeStatus);
  }

  /**
   * Register event handler
   */
  static addEventListener(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Remove event handler
   */
  static removeEventListener(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Notify all event handlers for a specific event
   */
  private static notifyEventHandlers(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get current connection state
   */
  static getConnectionState(): SignalRConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Get current real-time status
   */
  static getRealTimeStatus(): RealTimeSyncStatus {
    return { ...this.realTimeStatus };
  }

  /**
   * Check if SignalR is connected
   */
  static isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected && this.connectionState.isConnected;
  }

  /**
   * Handle user login - initialize connection
   */
  static handleUserLogin(): void {
    console.log('User logged in - initializing SignalR connection');
    this.initialize();
  }

  /**
   * Handle user logout - disconnect
   */
  static handleUserLogout(): void {
    console.log('User logged out - disconnecting SignalR');
    this.disconnect();
  }

  /**
   * Handle network status change
   */
  static handleNetworkChange(isOnline: boolean): void {
    if (isOnline && TokenManager.isAuthenticated() && !this.isConnected()) {
      console.log('Network restored - reconnecting SignalR');
      this.initialize();
    } else if (!isOnline && this.isConnected()) {
      console.log('Network lost - SignalR will handle reconnection automatically');
    }
  }
}
