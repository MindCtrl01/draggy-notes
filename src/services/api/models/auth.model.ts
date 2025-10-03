// Authentication Request Models
export interface FirebaseLoginRequest {
  firebaseToken: string; // For Firebase token verification
}

// Legacy interface for backward compatibility
export interface LoginRequest {
  firebaseToken?: string;
}

// Authentication Response Models
export interface UserInfo {
  id: number;
  uuid: string;
  username: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  phoneNumber?: string;
  emailVerified?: boolean;
  lastSignInAt?: Date;
  createdAt?: Date;
}

export interface AuthUser {
  id: number;
  uuid: string;
  username: string;
  email: string;
  phoneNumber?: string;
  displayName?: string;
  photoUrl?: string;
  emailVerified?: boolean;
  lastSignInAt?: Date;
  createdAt?: Date;
  isActive: boolean;
  isDelete: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  token?: string;
}