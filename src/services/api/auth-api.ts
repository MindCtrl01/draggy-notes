import { API_CONFIG } from '@/config/api';
import { API } from '@/constants/ui-constants';
import { TokenManager } from '@/helpers/token-manager';
import { ApiError, ApiResponse } from './models/api.model';
import {
  LoginRequest,
  RegisterRequest,
  GoogleLoginRequest,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RefreshTokenRequest,
  AuthenticationResponse,
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  GetUserByIdRequest,
  DeleteUserRequest,
  AuthUser
} from './models/auth.model';

// Authentication API service
class AuthApi {
  private readonly authBasePath = '/api/auth';
  private readonly usersBasePath = '/api/users';

  // Helper method to make API requests
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

  // POST /api/auth/login - Login user
  async login(credentials: LoginRequest): Promise<AuthenticationResponse> {
    const response = await this.makeRequest<AuthenticationResponse>(`${this.authBasePath}/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (!response.data) {
      throw new ApiError('No authentication data returned', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }

    // Store tokens
    if (response.data.token) {
      TokenManager.setToken(response.data.token);
    }
    if (response.data.refreshToken) {
      TokenManager.setRefreshToken(response.data.refreshToken);
    }

    // Mark that user has logged in at least once
    TokenManager.markUserHasLoggedIn();

    return response.data;
  }

  // POST /api/auth/register - Register new user
  async register(userData: RegisterRequest): Promise<AuthenticationResponse> {
    const response = await this.makeRequest<AuthenticationResponse>(`${this.authBasePath}/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (!response.data) {
      throw new ApiError('No authentication data returned', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }

    // Store tokens
    if (response.data.token) {
      TokenManager.setToken(response.data.token);
    }
    if (response.data.refreshToken) {
      TokenManager.setRefreshToken(response.data.refreshToken);
    }

    return response.data;
  }

  // POST /api/auth/google - Google login
  async googleLogin(request: GoogleLoginRequest): Promise<AuthenticationResponse> {
    const response = await this.makeRequest<AuthenticationResponse>(`${this.authBasePath}/google`, {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.data) {
      throw new ApiError('No authentication data returned', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }

    // Store tokens
    if (response.data.token) {
      TokenManager.setToken(response.data.token);
    }
    if (response.data.refreshToken) {
      TokenManager.setRefreshToken(response.data.refreshToken);
    }

    // Mark that user has logged in at least once
    TokenManager.markUserHasLoggedIn();

    return response.data;
  }

  // POST /api/auth/logout - Logout user
  async logout(): Promise<void> {
    const token = TokenManager.getToken();
    
    if (token) {
      try {
        const request: LogoutRequest = { token };
        await this.makeRequest<void>(`${this.authBasePath}/logout`, {
          method: 'POST',
          body: JSON.stringify(request),
        });
      } catch (error) {
        // Even if logout request fails, clear local tokens
        console.warn('Logout request failed:', error);
      }
    }

    // Clear tokens from storage
    TokenManager.clearTokens();
  }

  // POST /api/auth/forgot-password - Request password reset
  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await this.makeRequest<void>(`${this.authBasePath}/forgot-password`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // POST /api/auth/reset-password - Reset password with token
  async resetPasswordWithRequest(request: ResetPasswordRequest): Promise<void> {
    await this.makeRequest<void>(`${this.authBasePath}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // POST /api/auth/refresh-token - Refresh authentication token
  async refreshToken(request: RefreshTokenRequest): Promise<AuthenticationResponse> {
    const response = await this.makeRequest<AuthenticationResponse>(`${this.authBasePath}/refresh-token`, {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.data) {
      throw new ApiError('No authentication data returned', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }

    // Store new tokens
    if (response.data.token) {
      TokenManager.setToken(response.data.token);
    }
    if (response.data.refreshToken) {
      TokenManager.setRefreshToken(response.data.refreshToken);
    }

    return response.data;
  }

  // POST /api/users - Create user
  async createUser(request: CreateUserRequest): Promise<UserResponse> {
    const response = await this.makeRequest<UserResponse>(this.usersBasePath, {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.data) {
      throw new ApiError('No user data returned', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }

    return response.data;
  }

  // GET /api/users - Get all users
  async getUsers(): Promise<UserResponse[]> {
    const response = await this.makeRequest<UserResponse[]>(this.usersBasePath, {
      method: 'GET',
    });

    return response.data || [];
  }

  // GET /api/users/{uuid} - Get user by UUID
  async getUserById(request: GetUserByIdRequest): Promise<UserResponse> {
    const response = await this.makeRequest<UserResponse>(`${this.usersBasePath}/${request.id}`, {
      method: 'GET',
    });

    if (!response.data) {
      throw new ApiError('User not found', API.STATUS_CODES.NOT_FOUND);
    }

    return response.data;
  }

  // PUT /api/users/{uuid} - Update user
  async updateUser(request: UpdateUserRequest): Promise<UserResponse> {
    const response = await this.makeRequest<UserResponse>(`${this.usersBasePath}/${request.id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });

    if (!response.data) {
      throw new ApiError('No user data returned', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }

    return response.data;
  }

  // DELETE /api/users/{uuid} - Delete user
  async deleteUser(request: DeleteUserRequest): Promise<void> {
    await this.makeRequest<void>(`${this.usersBasePath}/${request.id}`, {
      method: 'DELETE',
    });
  }

  // Legacy method for backward compatibility
  async refreshAuthToken(): Promise<string> {
    const refreshToken = TokenManager.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
  
    const request: RefreshTokenRequest = { refreshToken };
    const authResponse = await this.refreshToken(request);
    
    return authResponse.token || '';
  }

  // Legacy methods for backward compatibility

  // Get current user from server (API call) - using token parsing instead of API call
  async getCurrentUser(): Promise<AuthUser> {
    const user = TokenManager.getCurrentUserFromToken();
    if (!user) {
      throw new Error('No authenticated user found');
    }
    return user;
  }


}

// Export singleton instance
export const authApi = new AuthApi();
