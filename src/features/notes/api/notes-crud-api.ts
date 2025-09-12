import { BaseCrudApi } from '@/lib/api/base-crud-api';
import { Note, NoteColor } from '@/types/note';

// Notes API request/response types
export interface CreateNoteRequest {
  content: string;
  color: NoteColor;
  position: {
    x: number;
    y: number;
  };
}

export interface UpdateNoteRequest {
  content?: string;
  color?: NoteColor;
  position?: {
    x: number;
    y: number;
  };
}

// API response type (what the backend returns)
export interface NoteApiResponse {
  id: string;
  content: string;
  color: NoteColor;
  position: {
    x: number;
    y: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Helper function to convert API response to Note type
function apiNoteToNote(apiNote: NoteApiResponse): Note {
  return {
    id: apiNote.id,
    content: apiNote.content,
    color: apiNote.color,
    position: apiNote.position,
    createdAt: new Date(apiNote.createdAt),
    updatedAt: new Date(apiNote.updatedAt),
  };
}

// Extended Notes API with custom methods
class NotesApi extends BaseCrudApi<Note, CreateNoteRequest, UpdateNoteRequest> {
  constructor() {
    super('notes'); // This will create endpoints like /notes, /notes/{id}
  }

  // Override methods to handle data transformation
  async getAll(): Promise<Note[]> {
    const apiNotes = await super.customRequest<NoteApiResponse[]>('');
    return apiNotes.map(apiNoteToNote);
  }

  async getById(id: string): Promise<Note> {
    const apiNote = await super.customRequest<NoteApiResponse>(`/${id}`);
    return apiNoteToNote(apiNote);
  }

  async create(data: CreateNoteRequest): Promise<Note> {
    const apiNote = await super.customRequest<NoteApiResponse>('', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return apiNoteToNote(apiNote);
  }

  async update(id: string, data: UpdateNoteRequest): Promise<Note> {
    const apiNote = await super.customRequest<NoteApiResponse>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return apiNoteToNote(apiNote);
  }

  // Custom methods specific to notes
  async duplicateNote(id: string): Promise<Note> {
    const apiNote = await super.customRequest<NoteApiResponse>(`/${id}/duplicate`, {
      method: 'POST',
    });
    return apiNoteToNote(apiNote);
  }

  async searchNotes(query: string): Promise<Note[]> {
    const apiNotes = await super.customRequest<NoteApiResponse[]>(`/search?q=${encodeURIComponent(query)}`);
    return apiNotes.map(apiNoteToNote);
  }

  async getNotesByColor(color: NoteColor): Promise<Note[]> {
    const apiNotes = await super.customRequest<NoteApiResponse[]>(`/color/${color}`);
    return apiNotes.map(apiNoteToNote);
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await super.customRequest<void>('/bulk-delete', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
  }
}

// Export singleton instance
export const notesApi = new NotesApi();
