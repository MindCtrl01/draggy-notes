import { API } from '@/constants/ui-constants';
import { SessionManager } from '@/helpers/session-manager';
import { apiRequest } from './base-api';
import { ApiError } from './models/api.model';
import {
  AuthUser,
  LoginRequest,
  FirebaseLoginRequest,
  AuthResponse,
  UserInfo
} from './models/auth.model';

// Authentication API service
class AuthApi {
  private readonly authBasePath = '/api/auth';

  // Login with Firebase token - verify with backend
  async login(loginRequest: FirebaseLoginRequest): Promise<AuthResponse> {
    const response = await apiRequest<UserInfo>(`${this.authBasePath}/login`, {
      method: 'POST',
      body: JSON.stringify(loginRequest)
    });

    if (!response.data) {
      throw new ApiError('No user data returned from login', API.STATUS_CODES.INTERNAL_SERVER_ERROR);
    }

    // Convert UserInfo to AuthUser format for frontend compatibility
    const authUser: AuthUser = {
      id: response.data.id,
      uuid: response.data.uuid,
      username: response.data.username,
      email: response.data.email,
      phoneNumber: response.data.phoneNumber,
      displayName: response.data.displayName,
      photoUrl: response.data.photoUrl,
      emailVerified: response.data.emailVerified,
      lastSignInAt: response.data.lastSignInAt,
      createdAt: response.data.createdAt,
      isActive: true,
      isDelete: false,
    };

    return {
      user: authUser,
      token: loginRequest.firebaseToken
    };
  }

  // Legacy login method for backward compatibility
  async legacyLogin(loginRequest: LoginRequest): Promise<AuthResponse> {
    if (!loginRequest.firebaseToken) {
      throw new Error('Firebase token is required');
    }
    
    return this.login({ firebaseToken: loginRequest.firebaseToken });
  }

  // Get current user from server (API call) - using token parsing instead of API call
  async getCurrentUser(): Promise<AuthUser> {
    const user = SessionManager.getCurrentUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }
    return user;
  }
}

// Export singleton instance
export const authApi = new AuthApi();