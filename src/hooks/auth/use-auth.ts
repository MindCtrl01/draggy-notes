import { useState, useEffect, useCallback } from 'react';
import { 
  authApi, 
  AuthUser, 
  LoginRequest, 
  RegisterRequest, 
  AuthenticationResponse 
} from '@/services/api';
import { API } from '@/constants/ui-constants';

interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthenticationResponse>;
  register: (userData: RegisterRequest) => Promise<AuthenticationResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, resetToken: string, newPassword: string) => Promise<void>;
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

  const login = useCallback(async (credentials: LoginRequest): Promise<AuthenticationResponse> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      // Convert UserInfo to AuthUser by adding missing properties
      const authUser: AuthUser = {
        ...response.user,
        id: response.user.id || API.DEFAULT_IDS.NEW_ENTITY,
        username: response.user.username || '',
        firstName: response.user.firstName || '',
        lastName: response.user.lastName || '',
        email: response.user.email || '',
        phoneNumber: response.user.phoneNumber || '',
        roles: response.user.roles || [],
        isActive: true, // Default value
        isDelete: false, // Default value
      };
      setUser(authUser);
      return response;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: RegisterRequest): Promise<AuthenticationResponse> => {
    setIsLoading(true);
    try {
      const response = await authApi.register(userData);
      // Convert UserInfo to AuthUser by adding missing properties
      const authUser: AuthUser = {
        ...response.user,
        username: response.user.username || '',
        firstName: response.user.firstName || '',
        lastName: response.user.lastName || '',
        email: response.user.email || '',
        phoneNumber: '',
        roles: response.user.roles || [],
        isActive: true, // Default value
        isDelete: false, // Default value
      };
      setUser(authUser);
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


  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    return authApi.forgotPassword({ email });
  }, []);

  const resetPassword = useCallback(async (
    email: string,
    resetToken: string, 
    newPassword: string
  ): Promise<void> => {
    const request = { email, resetToken, newPassword };
    return authApi.resetPasswordWithRequest(request);
  }, []);

  return {
    user,
    isAuthenticated: !!user && authApi.isAuthenticated(),
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    forgotPassword,
    resetPassword,
  };
};
