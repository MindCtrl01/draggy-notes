import { API_CONFIG } from '@/services/config/api';
import { TokenManager } from '@/helpers/token-manager';
import { ApiError, ApiResponse } from './models/api.model';

// Enhanced API request helper with JWT authentication and OpenAPI response format
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  // Get token
  const token = TokenManager.getToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    // Handle authentication errors
    if (response.status === 401) {
      TokenManager.clearTokens();
      throw new ApiError('Authentication failed. Please login again.', 401);
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `API Error: ${response.status} ${response.statusText}`,
        response.status,
        errorData.code,
        errorData.details
      );
    }
    
    // Handle 204 No Content responses
    if (response.status === 204) {
      return {
        success: true,
        message: null,
        data: undefined as T,
        errors: null
      };
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('API Request failed:', error);
    throw new ApiError('Network error occurred', 500);
  }
}

// Legacy API request helper for backward compatibility
export async function legacyApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await apiRequest<T>(endpoint, options);
  return response.data as T;
}

export class BaseApi<TEntity, TCreateRequest, TUpdateRequest> {
  constructor(private resourcePath: string) {}

  // Helper method to make requests with proper response handling
  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return apiRequest<T>(`/${this.resourcePath}${endpoint}`, options);
  }

  // GET /resource - List all entities
  async getAll(): Promise<TEntity[]> {
    const response = await this.makeRequest<TEntity[]>('', {
      method: 'GET'
    });
    return response.data || [];
  }

  // GET /resource/{id} - Get single entity by ID
  async getById(id: string): Promise<TEntity> {
    const response = await this.makeRequest<TEntity>(`/${id}`, {
      method: 'GET'
    });
    if (!response.data) {
      throw new ApiError('Entity not found', 404);
    }
    return response.data;
  }

  // POST /resource - Create new entity
  async create(data: TCreateRequest): Promise<TEntity> {
    const response = await this.makeRequest<TEntity>('', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.data) {
      throw new ApiError('No data returned from create', 500);
    }
    return response.data;
  }

  // PUT /resource/{id} - Update entity
  async update(id: string, data: TUpdateRequest): Promise<TEntity> {
    const response = await this.makeRequest<TEntity>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.data) {
      throw new ApiError('No data returned from update', 500);
    }
    return response.data;
  }

  // DELETE /resource/{id} - Delete entity
  async delete(id: string): Promise<void> {
    await this.makeRequest<void>(`/${id}`, {
      method: 'DELETE',
    });
  }

  // Custom endpoint support
  async customRequest<TResponse>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<TResponse> {
    const response = await this.makeRequest<TResponse>(endpoint, options);
    return response.data as TResponse;
  }
}




