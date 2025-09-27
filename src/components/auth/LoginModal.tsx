import React, { useState, useRef, useEffect } from 'react';
import { X, Mail, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuthContext } from '@/components/common/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultMode = 'login' 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string; username?: string}>({});
  
  const { login, register } = useAuthContext();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  // Focus on first input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (mode === 'register' && usernameInputRef.current) {
          usernameInputRef.current.focus();
        } else if (emailInputRef.current) {
          emailInputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mode]);

  // Clear errors when switching modes
  useEffect(() => {
    setErrors({});
  }, [mode]);

  // Validate form fields
  const validateForm = () => {
    const newErrors: {email?: string; password?: string; username?: string} = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (mode === 'register' && username.trim() && username.length < 2) {
      newErrors.username = 'Username must be at least 2 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login({ email: email.trim(), password });
        toast({
          title: "Login successful!",
          description: "Welcome back to Draggy Notes. Your notes are being loaded...",
        });
      } else {
        await register({ 
          username: username.trim() || '', 
          password, 
          email: email.trim() 
        });
        toast({
          title: "Registration successful!",
          description: "Welcome to Draggy Notes! Your account has been created.",
        });
      }
      
      // Reset form and close modal
      resetForm();
      onClose();
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Please try again.";
      toast({
        title: mode === 'login' ? "Login failed" : "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press for form submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Reset form function
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setErrors({});
    setShowPassword(false);
  };

  // Handle input changes with error clearing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (errors.username) {
      setErrors(prev => ({ ...prev, username: undefined }));
    }
  };

  // Handle modal close with form reset
  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  const handleGmailLogin = async () => {
    setIsLoading(true);
    try {
      // This would integrate with Google OAuth
      // For now, we'll show a toast indicating the feature
      toast({
        title: "Gmail Integration",
        description: "Gmail login integration coming soon!",
      });
      
      // TODO: Implement Google OAuth integration
      // Example: window.location.href = '/api/auth/google';
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Please try again.";
      toast({
        title: "Gmail login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Gmail Login Button */}
          <button
            onClick={handleGmailLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail size={20} className="text-red-500" />
            <span className="text-gray-700 dark:text-gray-300">
              Continue with Gmail
            </span>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" onKeyDown={handleKeyDown}>
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username (optional)
                </label>
                <input
                  ref={usernameInputRef}
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                    errors.username 
                      ? 'border-red-500 dark:border-red-400' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Your name"
                  disabled={isLoading}
                />
                {errors.username && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.username}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={handleEmailChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                  errors.email 
                    ? 'border-red-500 dark:border-red-400' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="your@email.com"
                disabled={isLoading}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                    errors.password 
                      ? 'border-red-500 dark:border-red-400' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Your password"
                  disabled={isLoading}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.password}</p>
              )}
              {mode === 'register' && !errors.password && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum 6 characters
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : mode === 'login' ? (
                <>
                  <LogIn size={20} />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Mode Toggle */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => {
                  const newMode = mode === 'login' ? 'register' : 'login';
                  setMode(newMode);
                  resetForm();
                }}
                className="ml-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                disabled={isLoading}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
