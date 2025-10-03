import { API_CONFIG } from '@/config/api';
import { SessionManager } from '@/helpers/session-manager';
import { ApiError, ApiResponse } from './models/api.model';
import { API } from '@/constants/ui-constants';
import {
  CreateTagRequest,
  UpdateTagRequest,
  TagResponse,
  TopTagResponse
} from './models/tags.model';

// Tags API service
class TagsApi {
  private readonly basePath = '/api/tags';

  // Helper method to make authenticated API requests
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = SessionManager.getToken();
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

  // GET /api/tags - Get all user tags + predefined tags
  async getAllTags(): Promise<TagResponse[]> {
    const response = await this.makeRequest<TagResponse[]>(`${this.basePath}`);
    return response.data || [];
  }

  // GET /api/tags/top - Get predefined tags + top user tags by usage
  async getTopTags(): Promise<TopTagResponse[]> {
    const response = await this.makeRequest<TopTagResponse[]>(`${this.basePath}/top`);
    return response.data || [];
  }

  // POST /api/tags - Create a new tag
  async createTag(request: CreateTagRequest): Promise<TagResponse> {
    const response = await this.makeRequest<TagResponse>(
      `${this.basePath}`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
    
    if (!response.data) {
      throw new ApiError('No data returned from create tag request', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
    
    return response.data;
  }

  // PUT /api/tags/{id} - Update an existing tag
  async updateTag(id: number, request: UpdateTagRequest): Promise<TagResponse> {
    const response = await this.makeRequest<TagResponse>(
      `${this.basePath}/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(request),
      }
    );
    
    if (!response.data) {
      throw new ApiError('No data returned from update tag request', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
    
    return response.data;
  }

  // DELETE /api/tags/{id} - Delete a tag (soft delete)
  async deleteTag(id: number): Promise<void> {
    await this.makeRequest<void>(
      `${this.basePath}/${id}`,
      {
        method: 'DELETE',
      }
    );
  }
}

// Export singleton instance
export const tagsApi = new TagsApi();
