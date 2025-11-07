import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './hooks/useDataContext';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/ErrorBoundary';
import ToastProvider from './components/Toast';
import Auth from './components/Auth';
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


const AppContent: React.FC = () => {
  console.log('AppContent rendering...');
  const { user, loading } = useAuth();

  console.log('Auth state:', { user: !!user, loading });

  if (loading) {
    console.log('Showing loading screen');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
};

const App: React.FC = () => {
  console.log('App component rendering...');
  console.log('Environment variables:', {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    HAS_SUPABASE_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    NODE_ENV: import.meta.env.MODE,
    BASE_URL: import.meta.env.BASE_URL
  });
  
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;