import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/auth/use-auth';
import { AuthUser } from '@/services/api/models/auth.model';
import { LoginRequest } from '@/services/api/models/auth.model';
import { AuthenticationResponse } from '@/services/api/models/auth.model';
import { RegisterRequest } from '@/services/api/models/auth.model';

interface AuthContextType {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// Export the context for direct access if needed
export { AuthContext };
