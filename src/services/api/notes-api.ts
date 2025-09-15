import { Note, NoteColor } from '@/domains/note';
import { API_CONFIG } from '@/services/config/api';

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
}

// Note API interface for backend communication
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

// Notes API service
export const notesApi = {
  // GET /notes - Fetch all notes
  async getAllNotes(): Promise<Note[]> {
    const response = await apiRequest<NoteApiResponse[]>('/notes');
    return response.map(apiNoteToNote);
  },

  // POST /note - Create a new note
  async createNote(noteData: CreateNoteRequest): Promise<Note> {
    const response = await apiRequest<NoteApiResponse>('/note', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
    return apiNoteToNote(response);
  },

  // PUT /note/{id} - Update an existing note
  async updateNote(id: string, noteData: UpdateNoteRequest): Promise<Note> {
    const response = await apiRequest<NoteApiResponse>(`/note/${id}`, {
      method: 'PUT',
      body: JSON.stringify(noteData),
    });
    return apiNoteToNote(response);
  },

  // DELETE /note/{id} - Delete a note
  async deleteNote(id: string): Promise<void> {
    await apiRequest<void>(`/note/${id}`, {
      method: 'DELETE',
    });
  },
};

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
