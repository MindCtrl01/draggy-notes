import { useState, useEffect, useCallback } from 'react';
import { 
  AuthResponse,
  AuthUser, 
  FirebaseLoginRequest,
} from '@/services/api';
import { SessionManager } from '@/helpers/session-manager';
import { authApi } from '@/services/api/auth-api';
import { firebaseAuthService } from '@/services/auth/firebase-auth';

interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<AuthResponse>;
  signInWithFacebook: () => Promise<AuthResponse>;
  signInWithApple: () => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to verify Firebase token with backend
  const verifyWithBackend = useCallback(async (firebaseToken: string | undefined): Promise<AuthResponse> => {
    if (!firebaseToken) {
      throw new Error('Firebase authentication failed');
    }

    // Create Firebase login request that matches backend model
    const firebaseLoginRequest: FirebaseLoginRequest = {
      firebaseToken, // Firebase ID token for verification
    };

    const authResponse = await authApi.login(firebaseLoginRequest);
    
    // The authApi.login() now returns the converted AuthUser directly
    // Save session with JWT token from backend
    SessionManager.saveSession(authResponse.user, firebaseToken || '');
    setUser(authResponse.user);
    
    return authResponse;
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for existing session first
        const existingUser = SessionManager.getCurrentUser();
        if (existingUser) {
          setUser(existingUser);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen to Firebase auth state changes
    const unsubscribe = firebaseAuthService.onAuthStateChange((firebaseUser) => {
      if (firebaseUser) {
        // Sync with backend if user exists
        try {
          SessionManager.saveSession(firebaseUser, ''); // Token will be handled by Firebase
          setUser(firebaseUser);
        } catch (error) {
          console.error('Error syncing Firebase user:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      // Use Firebase Google authentication
      const firebaseResult = await firebaseAuthService.signInWithGoogle();
      const authResponse = await verifyWithBackend(firebaseResult.token);
      
      return authResponse;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [verifyWithBackend]);

  const signInWithFacebook = useCallback(async (): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      // Use Firebase Facebook authentication
      const firebaseResult = await firebaseAuthService.signInWithFacebook();
      const authResponse = await verifyWithBackend(firebaseResult.token);
      
      return authResponse;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [verifyWithBackend]);

  const signInWithApple = useCallback(async (): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      // Use Firebase Apple authentication
      const firebaseResult = await firebaseAuthService.signInWithApple();
      const authResponse = await verifyWithBackend(firebaseResult.token);
      
      return authResponse;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [verifyWithBackend]);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await firebaseAuthService.logout();
      SessionManager.clearSession();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const currentUser = SessionManager.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      setUser(null);
    }
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
    logout,
    refreshUser,
  };
};