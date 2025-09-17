import React from 'react';
import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Example component demonstrating how to use the AuthContext
 * You can use this pattern in any component that needs access to authentication state
 */
export const AuthExample: React.FC = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    login, 
    logout, 
    register 
  } = useAuthContext();

  if (isLoading) {
    return <div>Loading authentication...</div>;
  }

  if (isAuthenticated && user) {
    return (
      <div className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Welcome, {user.name || user.email}!</h2>
        <p className="text-sm text-gray-600 mb-4">
          Email: {user.email}
          {user.roles && user.roles.length > 0 && (
            <span className="ml-2">
              Roles: {user.roles.join(', ')}
            </span>
          )}
        </p>
        <button 
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Not Authenticated</h2>
      <p className="text-sm text-gray-600 mb-4">
        Please login or register to access your account.
      </p>
      <div className="space-x-2">
        <button 
          onClick={() => {
            // Example login - replace with your actual login form
            login({ email: 'user@example.com', password: 'password' })
              .catch(error => console.error('Login failed:', error));
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Login (Example)
        </button>
        <button 
          onClick={() => {
            // Example register - replace with your actual register form
            register({ email: 'user@example.com', password: 'password', name: 'User' })
              .catch(error => console.error('Registration failed:', error));
          }}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Register (Example)
        </button>
      </div>
    </div>
  );
};
