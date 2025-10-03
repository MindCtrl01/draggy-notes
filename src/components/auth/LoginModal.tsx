import React, { useState } from 'react';
import { X, Quote } from 'lucide-react';
import { useAuthContext } from '@/components/common/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { FaApple } from 'react-icons/fa';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const { signInWithGoogle, signInWithFacebook, signInWithApple } = useAuthContext();

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: "Welcome to Draggy Notes!",
        description: "Successfully signed in with Google. Your creative journey begins now!",
      });
      
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Google sign-in failed. Please try again.";
      toast({
        title: "Authentication failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Facebook sign-in
  const handleFacebookSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithFacebook();
      toast({
        title: "Welcome to Draggy Notes!",
        description: "Successfully signed in with Facebook. Your creative journey begins now!",
      });
      
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Facebook sign-in failed. Please try again.";
      toast({
        title: "Authentication failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Apple sign-in
  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithApple();
      toast({
        title: "Welcome to Draggy Notes!",
        description: "Successfully signed in with Apple. Your creative journey begins now!",
      });
      
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Apple sign-in failed. Please try again.";
      toast({
        title: "Authentication failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isLoading) {
      onClose();
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors z-10"
          disabled={isLoading}
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="flex">
          {/* Left side - Sign in content */}
          <div className="flex-1 p-8 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Sign in to get started
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Choose your preferred sign-in method to access your personalized note-taking experience
                </p>
              </div>

              {/* Google Sign-In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group hover:shadow-lg"
              >
                {isLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
                ) : (
                  <>
                      <FcGoogle size={24} className="group-hover:scale-110 transition-transform" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium text-lg">
                        Continue with Google
                      </span>
                  </>
                )}
              </button>

              {/* Facebook Sign-In Button */}
              <button
                onClick={handleFacebookSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 mt-4 bg-white border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group hover:shadow-lg"
              >
                {isLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
                ) : (
                  <>
                      <FaFacebook size={24} className="text-[#1877F2] group-hover:scale-110 transition-transform" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium text-lg">
                        Continue with Facebook
                      </span>
                  </>
                )}
              </button>

              {/* Apple Sign-In Button */}
              <button
                onClick={handleAppleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 mt-4 bg-black border-2 border-gray-800 rounded-xl hover:bg-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group hover:shadow-lg"
              >
                {isLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <>
                      <FaApple size={24} className="text-white group-hover:scale-110 transition-transform" />
                      <span className="text-white font-medium text-lg">
                        Continue with Apple
                      </span>
                  </>
                )}
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Welcome section */}
          <div className="flex-1 bg-gradient-to-br from-blue-600 to-purple-600 text-white p-8 flex flex-col justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
                <Quote size={32} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Welcome to Draggy Notes</h2>
              <p className="text-white/90 text-lg mb-4">Your creative workspace awaits</p>
              <p className="text-white/80 text-sm leading-relaxed">
                Organize your thoughts, capture ideas, and let creativity flourish in your personalized note-taking experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};