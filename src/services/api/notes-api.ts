import { API_CONFIG } from '@/config/api';
import { TokenManager } from '@/helpers/token-manager';
import { ApiError, ApiResponse } from './models/api.model';
import { API } from '@/constants/ui-constants';
import {
  CreateNoteRequest,
  UpdateNoteRequest,
  GetNoteByIdRequest,
  DeleteNoteRequest,
  DuplicateNoteRequest,
  GetNotesByColorRequest,
  SearchNotesRequest,
  BatchDeleteRequest,
  BatchCreateRequest,
  BatchUpdateRequest,
  BatchSyncResult,
  NoteResponse,
  HealthResponse
} from './models/notes.model';

// Notes API service
class NotesApi {
  private readonly basePath = '/api/notes';

  // Helper method to make authenticated API requests
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = TokenManager.getToken();
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `API Error: ${response.status} ${response.statusText}`,
          response.status,
          errorData.code,
          errorData.details
        );
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('API Request failed:', error);
      throw new ApiError('Network error occurred', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  // GET /api/notes - Fetch all notes
  async getAllNotes(): Promise<NoteResponse[]> {
    const response = await this.makeRequest<NoteResponse[]>(this.basePath, {
      method: 'GET'
    });
    return response.data || [];
  }

  // POST /api/notes - Create a new note
  async createNote(noteData: CreateNoteRequest): Promise<NoteResponse> {
    const response = await this.makeRequest<NoteResponse>(this.basePath, {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
    if (!response.data) {
      throw new ApiError('No data returned from create note', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
    return response.data;
  }

  // GET /api/notes/{uuid} - Get note by UUID
  async getNoteById(request: GetNoteByIdRequest): Promise<NoteResponse> {
    const response = await this.makeRequest<NoteResponse>(`${this.basePath}/${request.id}`, {
      method: 'GET',
    });
    if (!response.data) {
      throw new ApiError('Note not found', API.STATUS_CODES.NOT_FOUND);
    }
    return response.data;
  }

  // PUT /api/notes/{uuid} - Update an existing note
  async updateNote(request: UpdateNoteRequest): Promise<NoteResponse> {
    const response = await this.makeRequest<NoteResponse>(`${this.basePath}/${request.id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
    if (!response.data) {
      throw new ApiError('No data returned from update note', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
    return response.data;
  }

  // DELETE /api/notes/{uuid} - Delete a note
  async deleteNote(request: DeleteNoteRequest): Promise<void> {
    await this.makeRequest<void>(`${this.basePath}/${request.id}`, {
      method: 'DELETE',
      body: JSON.stringify(request),
    });
  }

  // POST /api/notes/{uuid}/duplicate - Duplicate a note
  async duplicateNote(request: DuplicateNoteRequest): Promise<NoteResponse> {
    const response = await this.makeRequest<NoteResponse>(`${this.basePath}/${request.id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!response.data) {
      throw new ApiError('No data returned from duplicate note', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
    return response.data;
  }

  // GET /api/notes/color/{color} - Get notes by color
  async getNotesByColor(request: GetNotesByColorRequest): Promise<NoteResponse[]> {
    const response = await this.makeRequest<NoteResponse[]>(`${this.basePath}/color/${request.color}`, {
      method: 'GET',
    });
    return response.data || [];
  }

  // GET /api/notes/search - Search notes
  async searchNotes(request: SearchNotesRequest): Promise<NoteResponse[]> {
    const queryParams = new URLSearchParams();
    if (request.q) {
      queryParams.append('q', request.q);
    }
    
    const response = await this.makeRequest<NoteResponse[]>(`${this.basePath}/search?${queryParams}`, {
      method: 'GET',
    });
    return response.data || [];
  }

  // POST /api/notes/batch - Batch create notes
  async batchCreateNotes(request: BatchCreateRequest): Promise<BatchSyncResult> {
    const response = await this.makeRequest<BatchSyncResult>(`${this.basePath}/batch`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!response.data) {
      throw new ApiError('No data returned from batch create', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
    return response.data;
  }

  // PUT /api/notes/batch - Batch update notes
  async batchUpdateNotes(request: BatchUpdateRequest): Promise<BatchSyncResult> {
    const response = await this.makeRequest<BatchSyncResult>(`${this.basePath}/batch`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
    if (!response.data) {
      throw new ApiError('No data returned from batch update', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
    return response.data;
  }

  // DELETE /api/notes/batch - Batch delete notes
  async batchDeleteNotes(request: BatchDeleteRequest): Promise<BatchSyncResult> {
    const response = await this.makeRequest<BatchSyncResult>(`${this.basePath}/batch`, {
      method: 'DELETE',
      body: JSON.stringify(request),
    });
    if (!response.data) {
      throw new ApiError('No data returned from batch delete', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
    return response.data;
  }

  // GET /health - Health check
  async getHealth(): Promise<HealthResponse> {
    const response = await this.makeRequest<HealthResponse>('/health', {
      method: 'GET'
    });
    if (!response.data) {
      throw new ApiError('No health data returned', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
    return response.data;
  }
}

// Export singleton instance
export const notesApi = new NotesApi();
