import { API_CONFIG } from '@/services/config/api';
import { TokenManager } from '@/helpers/token-manager';
import { AuthResponse, LoginRequest, RegisterRequest, AuthUser } from './models/auth.model';
import { ApiError } from './models/api.model';

// Authentication API service
class AuthApi {
  private readonly basePath = '/auth';

  // Login user
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${this.basePath}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Login failed',
        response.status,
        errorData.code,
        errorData.details
      );
    }

    const authResponse: AuthResponse = await response.json();
    
    // Store tokens
    TokenManager.setToken(authResponse.tokens.accessToken);
    TokenManager.setRefreshToken(authResponse.tokens.refreshToken);

    return authResponse;
  }

  // Register new user
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${this.basePath}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Registration failed',
        response.status,
        errorData.code,
        errorData.details
      );
    }

    const authResponse: AuthResponse = await response.json();
    
    // Store tokens
    TokenManager.setToken(authResponse.tokens.accessToken);
    TokenManager.setRefreshToken(authResponse.tokens.refreshToken);

    return authResponse;
  }

  // Logout user
  async logout(): Promise<void> {
    const refreshToken = TokenManager.getRefreshToken();
    
    if (refreshToken) {
      try {
        await fetch(`${API_CONFIG.BASE_URL}${this.basePath}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        // Even if logout request fails, clear local tokens
        console.warn('Logout request failed:', error);
      }
    }

    // Clear tokens from storage
    TokenManager.clearTokens();
  }

  // Get current user profile
  async getCurrentUser(): Promise<AuthUser> {
    const token = TokenManager.getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${this.basePath}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        TokenManager.clearTokens();
        throw new Error('Authentication expired. Please login again.');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to get user profile',
        response.status,
        errorData.code,
        errorData.details
      );
    }

    return await response.json();
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = TokenManager.getToken();
    return token !== null && !TokenManager.isTokenExpired(token);
  }

  // Get current user from token (without API call)
  getCurrentUserFromToken(): AuthUser | null {
    const token = TokenManager.getToken();
    
    if (!token || TokenManager.isTokenExpired(token)) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub || payload.userId,
        email: payload.email,
        name: payload.name,
        roles: payload.roles || [],
      };
    } catch {
      return null;
    }
  }

  // Change password
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const token = TokenManager.getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${this.basePath}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to change password',
        response.status,
        errorData.code,
        errorData.details
      );
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${this.basePath}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to request password reset',
        response.status,
        errorData.code,
        errorData.details
      );
    }
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${this.basePath}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to reset password',
        response.status,
        errorData.code,
        errorData.details
      );
    }
  }

  async refreshAuthToken(): Promise<string> {
    const refreshToken = TokenManager.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
  
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
  
    const data = await response.json();
    TokenManager.setToken(data.accessToken);
    
    if (data.refreshToken) {
      TokenManager.setRefreshToken(data.refreshToken);
    }
  
    return data.accessToken;
  }
}

// Export singleton instance
export const authApi = new AuthApi();
