// Authentication Request Models
export interface LoginRequest {
  email: string | null;
  password: string | null;
}

export interface RegisterRequest {
  username: string | null;
  email: string | null;
  password: string | null;
}

export interface GoogleLoginRequest {
  idToken: string | null;
}

export interface LogoutRequest {
  token: string | null;
}

export interface ForgotPasswordRequest {
  email: string | null;
}

export interface ResetPasswordRequest {
  email: string;
  resetToken: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string | null;
}

// Authentication Response Models
export interface UserInfo {
  id: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  roles: string[] | null;
}

export interface AuthenticationResponse {
  token: string | null;
  refreshToken: string | null;
  expiresAt: string; // ISO date string format
  user: UserInfo;
}

// User Models
export interface UserResponse {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: string; // ISO date string format
  updatedAt: string; // ISO date string format
}

export interface CreateUserRequest {
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber?: string | null;
}

export interface UpdateUserRequest {
  id: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  isActive: boolean;
}

export interface GetUserByIdRequest {
  id: number;
}

export interface DeleteUserRequest {
  id: number;
}

// Legacy types for backward compatibility
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  isDelete: boolean;
  roles: string[];
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}