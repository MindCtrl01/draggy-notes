// Authentication Request Models
export interface LoginRequest {
  username: string | null;
  password: string | null;
}

export interface RegisterRequest {
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  password: string | null;
  phoneNumber?: string | null;
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
  uuid: string;
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
  uuid: string;
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
  uuid: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  isActive: boolean;
}

export interface GetUserByIdRequest {
  uuid: string;
}

export interface DeleteUserRequest {
  uuid: string;
}

// Legacy types for backward compatibility
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  uuid: string;
  username: string;
  firstName: string;
  lastName: string;
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