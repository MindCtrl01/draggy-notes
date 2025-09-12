import { API_CONFIG } from '@/lib/config/api';

// Generic API request helper
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

// Generic CRUD API service
export class BaseCrudApi<TEntity, TCreateRequest, TUpdateRequest> {
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

// Generic query key factory
export const createQueryKeys = (resource: string) => ({
  all: [resource] as const,
  lists: () => [resource, 'list'] as const,
  list: (filters: Record<string, any>) => [resource, 'list', filters] as const,
  details: () => [resource, 'detail'] as const,
  detail: (id: string) => [resource, 'detail', id] as const,
});

// Generic API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Generic error types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, any>;
}
