// Note Request Models
export interface CreateNotePositionRequest {
  x: number;
  y: number;
}

export interface CreateTaskRequest {
  id: number;
  uuid: string;
  text: string | null;
  completed: boolean;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  date?: string | null; // ISO date string format
  color: string;
  isDisplayed: boolean;
  position: CreateNotePositionRequest;
  noteTasks?: CreateTaskRequest[] | null;
  isTaskMode?: boolean | null;
  isPinned?: boolean | null;
  tagNames?: string[] | null;
}

export interface UpdateNotePositionRequest {
  x: number;
  y: number;
}

export interface UpdateTaskRequest {
  id: number;
  uuid: string;
  text: string | null;
  completed: boolean;
}

export interface UpdateNoteRequest {
  id: number;
  uuid: string;
  title: string;
  content: string;
  date?: string | null; // ISO date string format
  color: string;
  isDisplayed: boolean;
  position: UpdateNotePositionRequest;
  tasks?: UpdateTaskRequest[] | null;
  isTaskMode?: boolean | null;
  tagNames?: string[] | null;
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

// Note Response Models
export interface NotePositionResponse {
  x: number;
  y: number;
}

export interface TaskResponse {
  id: number;
  uuid: string;
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
  title: string;
  content: string;
  date: string; // ISO date string format
  color: string;
  isDisplayed: boolean;
  isPinned?: boolean | null;
  position: NotePositionResponse;
  createdAt: string; // ISO date string format
  updatedAt: string; // ISO date string format
  tasks?: TaskResponse[] | null;
  isTaskMode?: boolean | null;
  tags: TagResponse[];
}

// Health Response Models
export interface HealthResponse {
  status: string | null;
  timestamp: string; // ISO date string format
  version: string | null;
  dependencies?: { [key: string]: string } | null;
}
