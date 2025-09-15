import { useState, useEffect, useCallback } from 'react';
import { 
  authApi, 
  AuthUser, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse 
} from '@/services/api';

interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  register: (userData: RegisterRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authApi.isAuthenticated()) {
          // Try to get user from token first (faster)
          const userFromToken = authApi.getCurrentUserFromToken();
          if (userFromToken) {
            setUser(userFromToken);
          }
          
          // Then refresh from server to get latest data
          try {
            const currentUser = await authApi.getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            // If server request fails, keep token user or clear if invalid
            console.warn('Failed to refresh user from server:', error);
            if (!userFromToken) {
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      setUser(response.user);
      return response;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: RegisterRequest): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authApi.register(userData);
      setUser(response.user);
      return response;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    if (!authApi.isAuthenticated()) {
      setUser(null);
      return;
    }

    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
    }
  }, []);

  const changePassword = useCallback(async (
    oldPassword: string, 
    newPassword: string
  ): Promise<void> => {
    return authApi.changePassword(oldPassword, newPassword);
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<void> => {
    return authApi.requestPasswordReset(email);
  }, []);

  const resetPassword = useCallback(async (
    token: string, 
    newPassword: string
  ): Promise<void> => {
    return authApi.resetPassword(token, newPassword);
  }, []);

  return {
    user,
    isAuthenticated: !!user && authApi.isAuthenticated(),
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    changePassword,
    requestPasswordReset,
    resetPassword,
  };
};
