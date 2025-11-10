import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

// Simple functional error boundary replacement
const ErrorBoundary: React.FC<Props> = ({ children, fallback }) => {
  return (
    <React.Suspense 
      fallback={
        fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Loading...
              </h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                Please wait while we load the application.
              </p>
            </div>
          </div>
        )
      }
    >
      {children}
    </React.Suspense>
  );
};

export default ErrorBoundary;