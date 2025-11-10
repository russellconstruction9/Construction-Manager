import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';

// Simple test component to check if React is working
const SimpleTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">App Test</h1>
        <p className="text-gray-600 mb-4">If you can see this, React is working correctly.</p>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ React components are rendering
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <p>Next steps:</p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Check browser console for errors</li>
            <li>Verify all imports are working</li>
            <li>Test data context loading</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  console.log('🚀 App component is starting...');
  console.log('Environment check:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('- VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  
  try {
    return (
      <ErrorBoundary>
        <div className="app-wrapper">
          <Routes>
            <Route path="/" element={<SimpleTest />} />
            <Route path="/test" element={<SimpleTest />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('💥 Error in App component:', error);
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border border-red-400">
          <h1 className="text-2xl font-bold text-red-800 mb-4">App Error</h1>
          <p className="text-red-600">Something went wrong in the App component.</p>
          <pre className="mt-4 p-4 bg-gray-100 text-xs overflow-auto">
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
        </div>
      </div>
    );
  }
};

export default App;