// Note Request Models
export interface CreateNotePositionRequest {
  x: number;
  y: number;
}

export interface CreateTaskRequest {
  uuid: string;
  text: string | null;
  completed: boolean;
}

export interface CreateNoteRequest {
  uuid: string;
  title: string | null;
  content: string | null;
  date?: string | null; // ISO date string format
  color: string | null;
  isDisplayed: boolean;
  position: CreateNotePositionRequest;
  noteTasks?: CreateTaskRequest[] | null;
  isTaskMode?: boolean | null;
  isPinned?: boolean | null;
  tagUuids?: string[] | null;
}

export interface UpdateNotePositionRequest {
  x: number;
  y: number;
}

export interface UpdateTaskRequest {
  uuid: string;
  text: string | null;
  completed: boolean;
}

export interface UpdateNoteRequest {
  uuid: string;
  title: string | null;
  content: string | null;
  date?: string | null; // ISO date string format
  color: string | null;
  isDisplayed: boolean;
  position: UpdateNotePositionRequest;
  tasks?: UpdateTaskRequest[] | null;
  isTaskMode?: boolean | null;
  tagUuids?: string[] | null;
}

export interface GetNoteByIdRequest {
  uuid: string;
}

export interface DeleteNoteRequest {
  uuid: string;
}

export interface DuplicateNoteRequest {
  uuid: string;
}

export interface GetNotesByColorRequest {
  color: string | null;
}

export interface SearchNotesRequest {
  q: string | null;
}

export interface BulkDeleteRequest {
  uuids: string[] | null;
}

// Note Response Models
export interface NotePositionResponse {
  x: number;
  y: number;
}

export interface TaskResponse {
  uuid: string;
  text: string | null;
  completed: boolean;
  createdAt: string; // ISO date string format
}

export interface NoteResponse {
  uuid: string;
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
  tagUuids?: string[] | null;
}

// Health Response Models
export interface HealthResponse {
  status: string | null;
  timestamp: string; // ISO date string format
  version: string | null;
  dependencies?: { [key: string]: string } | null;
}
