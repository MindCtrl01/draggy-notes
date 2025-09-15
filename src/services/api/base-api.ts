import { API_CONFIG } from '@/services/config/api';
import { TokenManager } from '@/helpers/token-manager';
import { authApi } from './auth-api';
import { ApiError } from './models/api.model';

// Enhanced API request helper with JWT authentication
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  // Get and validate token
  let token = TokenManager.getToken();
  
  // Check if token is expired and try to refresh
  if (token && TokenManager.isTokenExpired(token)) {
    try {
      token = await authApi.refreshAuthToken();
    } catch (error) {
      // If refresh fails, clear tokens and redirect to login
      TokenManager.clearTokens();
      // You might want to dispatch a logout action or redirect to login page here
      throw new Error('Authentication expired. Please login again.');
    }
  }
  
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
      throw new Error('Authentication failed. Please login again.');
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
      return undefined as T;
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
}

export class BaseApi<TEntity, TCreateRequest, TUpdateRequest> {
  constructor(private resourcePath: string) {}

  // GET /resource - List all entities
  async getAll(): Promise<TEntity[]> {
    return apiRequest<TEntity[]>(`/${this.resourcePath}`);
  }

  // GET /resource/{id} - Get single entity by ID
  async getById(id: string): Promise<TEntity> {
    return apiRequest<TEntity>(`/${this.resourcePath}/${id}`);
  }

  // POST /resource - Create new entity
  async create(data: TCreateRequest): Promise<TEntity> {
    return apiRequest<TEntity>(`/${this.resourcePath}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT /resource/{id} - Update entity
  async update(id: string, data: TUpdateRequest): Promise<TEntity> {
    return apiRequest<TEntity>(`/${this.resourcePath}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE /resource/{id} - Delete entity
  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/${this.resourcePath}/${id}`, {
      method: 'DELETE',
    });
  }

  // Custom endpoint support
  async customRequest<TResponse>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<TResponse> {
    return apiRequest<TResponse>(`/${this.resourcePath}${endpoint}`, options);
  }
}




