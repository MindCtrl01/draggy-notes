export interface ApiErrorResponse {
    message: string;
    status: number;
    code?: string;
    details?: Record<string, unknown>;
  }
  
  // Authentication types
  export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
  }
  
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface RegisterRequest {
    email: string;
    password: string;
    name?: string;
  }
  
  export interface AuthUser {
    id: string;
    email: string;
    name?: string;
    roles?: string[];
  }
  
  export interface AuthResponse {
    user: AuthUser;
    tokens: AuthTokens;
  }