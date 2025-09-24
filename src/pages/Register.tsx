import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginModal } from '@/components/auth';
import { useAuthContext } from '@/components/common/contexts/AuthContext';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleClose = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LoginModal
        isOpen={true}
        onClose={handleClose}
        defaultMode="register"
      />
    </div>
  );
};

export default Register;
