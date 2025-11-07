import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './hooks/useDataContext';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/ErrorBoundary';
import ToastProvider from './components/Toast';
import Auth from './components/Auth';
import AuthCallback from './components/AuthCallback';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import ProjectDetails from './components/ProjectDetails';
import Tasks from './components/Tasks';
import Team from './components/Team';
import TimeTracking from './components/TimeTracking';
import PunchLists from './components/PunchLists';
import PunchListDetails from './components/PunchListDetails';
import ProjectPhotos from './components/ProjectPhotos';
import Profile from './components/Profile';
import Schedule from './components/Schedule';
import MapView from './components/MapView';
import Invoices from './components/Invoices';
import InvoiceDetails from './components/InvoiceDetails';
import InvoiceEditor from './components/InvoiceEditor';
import ProtectedRoute from './components/ProtectedRoute';
import EnvTest from './components/EnvTest';


const AppContent: React.FC = () => {
  console.log('AppContent rendering...');
  
  try {
    // Simple test without authentication first
    if (window.location.search.includes('test=noauth')) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">🏗️ ConstructTrack Pro</h1>
            <p className="text-gray-600 mb-4">No auth test - CSS and React working!</p>
            <div className="text-sm text-gray-500 mb-4">
              <p>Environment: {import.meta.env.MODE}</p>
              <p>Supabase configured: {import.meta.env.VITE_SUPABASE_URL ? 'Yes' : 'No'}</p>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.href = window.location.pathname + '?test=auth'}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Test with Auth
              </button>
              <button 
                onClick={() => window.location.href = window.location.pathname}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Try Full App
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    const { user, loading } = useAuth();

    console.log('Auth state:', { user: !!user, loading });

    if (loading) {
      console.log('Showing loading screen');
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 loading-test">Loading ConstructTrack Pro...</p>
            <p className="mt-2 text-xs text-gray-500">Environment: {import.meta.env.MODE}</p>
            <p className="mt-1 text-xs text-gray-400">Supabase: {import.meta.env.VITE_SUPABASE_URL ? 'Connected' : 'Not configured'}</p>
          </div>
        </div>
      );
    }

    if (!user) {
      console.log('No user, showing Auth component');
      return <Auth />;
    }

    console.log('User authenticated, showing main app');
    return (
      <DataProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<ProjectDetails />} />
            <Route path="/projects/:projectId/photos" element={<ProjectPhotos />} />
            <Route path="/projects/:projectId/tasks" element={<Tasks />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/team" element={<Team />} />
            <Route path="/time-tracking" element={<TimeTracking />} />
            <Route path="/punch-lists" element={<PunchLists />} />
            <Route path="/punch-lists/:projectId" element={<PunchListDetails />} />
            <Route path="/invoicing" element={<Invoices />} />
            <Route path="/invoices/new" element={<InvoiceEditor />} />
            <Route path="/invoices/:invoiceId" element={<InvoiceDetails />} />
            <Route path="/invoices/:invoiceId/edit" element={<InvoiceEditor />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </DataProvider>
    );
  } catch (error) {
    console.error('Error in AppContent:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Application Error</h3>
            <p className="text-sm text-gray-600 mb-4">
              Error in AppContent: {error.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }
};

const App: React.FC = () => {
  console.log('App component rendering...');
  
  // Step-by-step debugging
  try {
    console.log('Environment variables:', {
      SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      HAS_SUPABASE_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      NODE_ENV: import.meta.env.MODE,
      BASE_URL: import.meta.env.BASE_URL
    });
    
    // For debugging, show a simple test first
    if (window.location.search.includes('test=simple')) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">🏗️ ConstructTrack Pro</h1>
            <p className="text-gray-600 mb-4">Simple test mode - React is working!</p>
            <div className="text-sm text-gray-500">
              <p>Environment: {import.meta.env.MODE}</p>
              <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL || 'Not set'}</p>
              <p>Time: {new Date().toLocaleString()}</p>
            </div>
            <button 
              onClick={() => window.location.href = window.location.pathname}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Full App
            </button>
          </div>
        </div>
      );
    }
    
    // Try to render the full app
    return (
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Critical error in App component:', error);
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ App Error</h1>
          <p className="text-gray-600 mb-4">
            The application failed to initialize. Error: {error.message}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
};

export default App;