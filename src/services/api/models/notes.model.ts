// Note Request Models
export interface CreateNotePositionRequest {
  x: number;
  y: number;
}

export interface CreateTaskRequest {
  text: string | null;
  completed: boolean;
}

export interface CreateNoteRequest {
  title: string | null;
  content: string | null;
  date?: string | null; // ISO date string format
  color: string | null;
  isDisplayed: boolean;
  position: CreateNotePositionRequest;
  noteTasks?: CreateTaskRequest[] | null;
  isTaskMode?: boolean | null;
  isPinned?: boolean | null;
}

export interface UpdateNotePositionRequest {
  x: number;
  y: number;
}

export interface UpdateTaskRequest {
  id: number;
  text: string | null;
  completed: boolean;
}

export interface UpdateNoteRequest {
  id: number;
  title: string | null;
  content: string | null;
  date?: string | null; // ISO date string format
  color: string | null;
  isDisplayed: boolean;
  position: UpdateNotePositionRequest;
  tasks?: UpdateTaskRequest[] | null;
  isTaskMode?: boolean | null;
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

export interface BulkDeleteRequest {
  ids: number[] | null;
}

// Note Response Models
export interface NotePositionResponse {
  x: number;
  y: number;
}

export interface TaskResponse {
  id: number;
  text: string | null;
  completed: boolean;
  createdAt: string; // ISO date string format
}

export interface NoteResponse {
  id: number;
  title: string | null;
  content: string | null;
  date: string; // ISO date string format
  color: string | null;
  isDisplayed: boolean;
  position: NotePositionResponse;
  createdAt: string; // ISO date string format
  updatedAt: string; // ISO date string format
  tasks?: TaskResponse[] | null;
  isTaskMode?: boolean | null;
}

// Health Response Models
export interface HealthResponse {
  status: string | null;
  timestamp: string; // ISO date string format
  version: string | null;
  dependencies?: { [key: string]: string } | null;
}
