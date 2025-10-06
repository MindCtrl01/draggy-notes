import { API_CONFIG } from '@/config/api';
import { SessionManager } from '@/helpers/session-manager';
import { ApiError, ApiResponse } from './models/api.model';
import { API } from '@/constants/ui-constants';
import {
  CreateGroupRequest,
  JoinGroupRequest,
  UpdateGroupRequest,
  UpdateMemberRoleRequest,
  GroupResponse,
  GroupMemberResponse
} from '@/domains/group';

// Groups API service
class GroupsApi {
  private readonly basePath = '/api/groups';

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

  // POST /api/groups - Create a new group
  async createGroup(request: CreateGroupRequest): Promise<GroupResponse> {
    const response = await this.makeRequest<GroupResponse>(this.basePath, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!response.data) {
      throw new ApiError('No data returned from create group', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
    return response.data;
  }

  // GET /api/groups - Get user's groups
  async getUserGroups(): Promise<{ groups: GroupResponse[]; totalCount: number }> {
    const response = await this.makeRequest<{ groups: GroupResponse[]; totalCount: number }>(this.basePath, {
      method: 'GET'
    });
    return response.data || { groups: [], totalCount: 0 };
  }

  // GET /api/groups/{id} - Get group details
  async getGroupById(id: number): Promise<GroupResponse> {
    const response = await this.makeRequest<GroupResponse>(`${this.basePath}/${id}`, {
      method: 'GET',
    });
    if (!response.data) {
      throw new ApiError('Group not found', API.STATUS_CODES.NOT_FOUND);
    }
    return response.data;
  }

  // PUT /api/groups/{id} - Update group
  async updateGroup(id: number, request: UpdateGroupRequest): Promise<GroupResponse> {
    const response = await this.makeRequest<GroupResponse>(`${this.basePath}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
    if (!response.data) {
      throw new ApiError('No data returned from update group', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
    return response.data;
  }

  // DELETE /api/groups/{id} - Delete group (owner only)
  async deleteGroup(id: number): Promise<void> {
    await this.makeRequest<void>(`${this.basePath}/${id}`, {
      method: 'DELETE',
    });
  }

  // POST /api/groups/join - Join group via share link
  async joinGroup(request: JoinGroupRequest): Promise<GroupResponse> {
    const response = await this.makeRequest<GroupResponse>(`${this.basePath}/join`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!response.data) {
      throw new ApiError('No data returned from join group', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
    return response.data;
  }

  // DELETE /api/groups/{id}/leave - Leave group
  async leaveGroup(id: number): Promise<void> {
    await this.makeRequest<void>(`${this.basePath}/${id}/leave`, {
      method: 'DELETE',
    });
  }

  // PUT /api/groups/{id}/members/{userId}/role - Update member role
  async updateMemberRole(id: number, request: UpdateMemberRoleRequest): Promise<GroupMemberResponse> {
    const response = await this.makeRequest<GroupMemberResponse>(`${this.basePath}/${id}/members/${request.userId}/role`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
    if (!response.data) {
      throw new ApiError('No data returned from update member role', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
    return response.data;
  }

  // DELETE /api/groups/{id}/members/{userId} - Remove member from group
  async removeMember(id: number, userId: number): Promise<void> {
    await this.makeRequest<void>(`${this.basePath}/${id}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // POST /api/groups/{id}/regenerate-share-link - Regenerate share link
  async regenerateShareLink(id: number): Promise<{ shareToken: string; shareUrl: string }> {
    const response = await this.makeRequest<{ shareToken: string; shareUrl: string }>(`${this.basePath}/${id}/regenerate-share-link`, {
      method: 'POST',
    });
    if (!response.data) {
      throw new ApiError('No data returned from regenerate share link', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
    return response.data;
  }
}

// Export singleton instance
export const groupsApi = new GroupsApi();
