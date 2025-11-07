import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('AuthCallback component mounted');
    console.log('User:', user, 'Loading:', loading);

    if (!loading) {
      if (user) {
        console.log('User authenticated, redirecting to dashboard');
        navigate('/', { replace: true });
      } else {
        console.log('No user found after callback, redirecting to auth');
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
        <p className="mt-2 text-xs text-gray-500">Please wait</p>
      </div>
    </div>
  );
};

export default AuthCallback;
