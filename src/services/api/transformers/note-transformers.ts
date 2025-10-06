import { Note } from '@/domains/note';
import { API } from '@/constants/ui-constants';
import { NoteTask } from '@/domains/noteTask';
import { Tag } from '@/domains/tag';
import { 
  NoteResponse, 
  CreateNoteRequest, 
  UpdateNoteRequest, 
  TaskResponse, 
  TagResponse,
  CreateTaskRequest,
  UpdateTaskRequest
} from '../models/notes.model';

/**
 * Transform API NoteResponse to domain Note model
 */
export function transformNoteResponseToNote(response: NoteResponse): Note {
  const transformedTasks = response.tasks ? response.tasks.map(task => ({
    ...transformTaskResponseToNoteTask(task),
    noteId: response.id // Set the note ID for each task
  })) : [];

  return {
    id: response.id,
    uuid: response.uuid,
    userId: response.userId || 0,
    noteGroupId: response.noteGroupId, // Include group ID
    title: response.title,
    content: response.content,
    date: new Date(response.date),
    color: response.color,
    isDisplayed: response.isDisplayed,
    isPinned: response.isPinned || false,
    position: {
      x: response.position.x,
      y: response.position.y
    },
    createdAt: new Date(response.createdAt),
    updatedAt: new Date(response.updatedAt),
    isTaskMode: response.isTaskMode,
    noteTasks: transformedTasks,
    tags: response.tags ? response.tags.map(transformTagResponseToTag) : null,
    isDeleted: response.isDeleted || false,
    // sync properties - received from server
    syncVersion: (response as any).syncVersion || 1,
    localVersion: (response as any).localVersion || 1,
    lastSyncedAt: new Date((response as any).lastSyncedAt || response.updatedAt),
    clientUpdatedAt: (response as any).clientUpdatedAt ? new Date((response as any).clientUpdatedAt) : undefined
  };
}

/**
 * Transform domain Note model to API CreateNoteRequest
 */
export function transformNoteToCreateRequest(note: Note): CreateNoteRequest {
  return {
    uuid: note.uuid,
    title: note.title,
    content: note.content,
    date: note.date.toISOString(),
    userId: note.userId,
    noteGroupId: note.noteGroupId, // Include group ID
    color: note.color,
    isDisplayed: note.isDisplayed,
    position: {
      x: note.position.x,
      y: note.position.y
    },
    noteTasks: note.noteTasks ? note.noteTasks.map(transformNoteTaskToCreateRequest) : null,
    isTaskMode: note.isTaskMode || false,
    isPinned: note.isPinned || false,
    tagNames: note.tags ? note.tags.map(tag => tag.name) : null,
    isDeleted: note.isDeleted || false,
    // sync properties - send clientUpdatedAt to server for tracking
    clientUpdatedAt: note.clientUpdatedAt?.toISOString(),
    syncVersion: note.syncVersion,
    localVersion: note.localVersion,
    lastSyncedAt: note.lastSyncedAt.toISOString()
  }
}

/**
 * Transform domain Note model to API UpdateNoteRequest
 */
export function transformNoteToUpdateRequest(note: Note): UpdateNoteRequest {
  return {
    id: note.id || API.DEFAULT_IDS.NEW_ENTITY, // Will be set from the API response
    uuid: note.uuid,
    userId: note.userId,
    noteGroupId: note.noteGroupId, // Include group ID
    title: note.title,
    content: note.content,
    date: note.date.toISOString(),
    color: note.color,
    isDisplayed: note.isDisplayed,
    position: {
      x: note.position.x,
      y: note.position.y
    },
    tasks: note.noteTasks ? note.noteTasks.map(transformNoteTaskToUpdateRequest) : null,
    isTaskMode: note.isTaskMode || false,
    tagNames: note.tags ? note.tags.map(tag => tag.name) : null,
    isDeleted: note.isDeleted,
    // sync properties - send clientUpdatedAt to server for conflict detection
    clientUpdatedAt: note.clientUpdatedAt?.toISOString(),
    syncVersion: note.syncVersion,
    localVersion: note.localVersion,
    lastSyncedAt: note.lastSyncedAt.toISOString()
  }
}

/**
 * Transform API TaskResponse to domain NoteTask model
 */
export function transformTaskResponseToNoteTask(response: TaskResponse): NoteTask {
  return {
    id: response.id,
    uuid: response.uuid,
    noteId: response.noteId,
    text: response.text,
    completed: response.completed,
    createdAt: new Date(response.createdAt),
    updatedAt: new Date(response.createdAt), // Use createdAt as fallback
  };
}

/**
 * Transform domain NoteTask to API CreateTaskRequest
 */
export function transformNoteTaskToCreateRequest(task: NoteTask): CreateTaskRequest {
  return {
    id: API.DEFAULT_IDS.NEW_ENTITY,
    uuid: task.uuid,
    text: task.text,
    completed: task.completed,
    noteId: task.noteId
  };
}

/**
 * Transform domain NoteTask to API UpdateTaskRequest
 */
export function transformNoteTaskToUpdateRequest(task: NoteTask): UpdateTaskRequest {
  return {
    id: task.id,
    uuid: task.uuid,
    noteId: task.noteId,
    text: task.text,
    completed: task.completed
  };
}

/**
 * Transform API TagResponse to domain Tag model
 */
export function transformTagResponseToTag(response: TagResponse): Tag {
  return {
    id: response.id,
    uuid: response.uuid,
    name: response.name,
    userId: response.userId,
    usageCount: response.usageCount,
    isPreDefined: response.isPreDefined,
    createdAt: new Date(), // Default to current date
    updatedAt: new Date()  // Default to current date
  };
}
