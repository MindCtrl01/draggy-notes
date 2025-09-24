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
    noteUuid: response.uuid // Set the note UUID for each task
  })) : [];

  return {
    id: response.id,
    uuid: response.uuid,
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
    userId: API.DEFAULT_IDS.TEMPORARY_USER, // Will be set based on current user context
    isTaskMode: response.isTaskMode || false,
    noteTasks: transformedTasks,
    tags: response.tags.map(transformTagResponseToTag)
  };
}

/**
 * Transform domain Note model to API CreateNoteRequest
 */
export function transformNoteToCreateRequest(note: Note): CreateNoteRequest {
  return {
    title: note.title,
    content: note.content,
    date: note.date.toISOString(),
    color: note.color,
    isDisplayed: note.isDisplayed,
    position: {
      x: note.position.x,
      y: note.position.y
    },
    noteTasks: note.noteTasks ? note.noteTasks.map(transformNoteTaskToCreateRequest) : null,
    isTaskMode: note.isTaskMode || false,
    isPinned: note.isPinned || false,
    tagNames: note.tags ? note.tags.map(tag => tag.name) : null
  };
}

/**
 * Transform domain Note model to API UpdateNoteRequest
 */
export function transformNoteToUpdateRequest(note: Note): UpdateNoteRequest {
  return {
    id: note.id || API.DEFAULT_IDS.NEW_ENTITY, // Will be set from the API response
    uuid: note.uuid,
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
    tagNames: note.tags ? note.tags.map(tag => tag.name) : null
  };
}

/**
 * Transform API TaskResponse to domain NoteTask model
 */
export function transformTaskResponseToNoteTask(response: TaskResponse): NoteTask {
  return {
    id: response.id,
    uuid: response.uuid,
    text: response.text,
    completed: response.completed,
    createdAt: new Date(response.createdAt),
    updatedAt: new Date(response.createdAt), // Use createdAt as fallback
    userId: API.DEFAULT_IDS.TEMPORARY_USER, // Will be set based on current user context
    noteUuid: '', // Will be set by the calling context
    tags: [] // Initialize empty tags array
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
    completed: task.completed
  };
}

/**
 * Transform domain NoteTask to API UpdateTaskRequest
 */
export function transformNoteTaskToUpdateRequest(task: NoteTask): UpdateTaskRequest {
  return {
    id: task.id,
    uuid: task.uuid,
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
    isPredefined: response.isPredefined,
    createdAt: new Date(), // Default to current date
    updatedAt: new Date()  // Default to current date
  };
}
