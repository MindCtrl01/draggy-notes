// Note Request Models
export interface CreateNotePositionRequest {
  x: number;
  y: number;
}

export interface CreateTaskRequest {
  id: number;
  uuid: string;
  noteId: number;
  text: string | null;
  completed: boolean;
}

export interface CreateNoteRequest {
  uuid: string;
  title: string;
  content: string;
  date: string; // ISO date string format
  userId: number;
  color: string;
  isDisplayed: boolean;
  position: CreateNotePositionRequest;
  noteTasks?: CreateTaskRequest[] | null;
  isTaskMode: boolean;
  isPinned: boolean;
  tagNames?: string[] | null;
  isDeleted: boolean;
  // sync properties - send clientUpdatedAt to server for tracking
  clientUpdatedAt?: string;
  syncVersion: number;
  lastSyncedAt: string; // ISO date string format
}

export interface UpdateNotePositionRequest {
  x: number;
  y: number;
}

export interface UpdateTaskRequest {
  id: number;
  uuid: string;
  noteId: number;
  text: string | null;
  completed: boolean;
}

export interface UpdateNoteRequest {
  id: number;
  uuid: string;
  userId: number;
  title: string;
  content: string;
  date: string; // ISO date string format
  color: string;
  isDisplayed: boolean;
  position: UpdateNotePositionRequest;
  tasks?: UpdateTaskRequest[] | null;
  isTaskMode: boolean;
  tagNames?: string[] | null;
  isDeleted: boolean;
  // sync properties - send clientUpdatedAt to server for conflict detection
  clientUpdatedAt?: string;
  syncVersion: number;
  lastSyncedAt: string; // ISO date string format
}

export interface GetNoteByIdRequest {
  id: number;
}

export interface DeleteNoteRequest {
  id: number;
}

export interface DuplicateNoteRequest {
  id: number;
}

export interface GetNotesByColorRequest {
  color: string | null;
}

export interface SearchNotesRequest {
  q: string | null;
}

export interface BatchDeleteRequest {
  ids: number[] | null;
}

export interface BatchCreateRequest {
  notes: CreateNoteRequest[];
}

export interface BatchUpdateRequest {
  notes: UpdateNoteRequest[];
}

export interface BatchResponse<T> {
  successful: T[];
  errors: Array<{
    index: number;
    error: string;
    item?: any;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// Note Response Models
export interface NotePositionResponse {
  x: number;
  y: number;
}

export interface TaskResponse {
  id: number;
  uuid: string;
  noteId: number;
  text: string;
  completed: boolean;
  createdAt: string; // ISO date string format
}

export interface TagResponse {
  id: number;
  uuid: string;
  name: string;
  userId: number;
  usageCount: number;
  isPredefined: boolean;
}

export interface NoteResponse {
  id: number;
  uuid: string;
  userId: number;
  title: string;
  content: string;
  date: string; // ISO date string format
  color: string;
  isDisplayed: boolean;
  isPinned: boolean;
  position: NotePositionResponse;
  createdAt: string; // ISO date string format
  updatedAt: string; // ISO date string format
  tasks?: TaskResponse[] | null;
  isTaskMode: boolean;
  tags?: TagResponse[] | null;
  isDeleted: boolean;
  // sync properties - received from server
  syncVersion: number;
  lastSyncedAt: string; // ISO date string format
  clientUpdatedAt?: string;
}

// Health Response Models
export interface HealthResponse {
  status: string | null;
  timestamp: string; // ISO date string format
  version: string | null;
  dependencies?: { [key: string]: string } | null;
}
