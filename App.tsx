import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './hooks/useDataContext';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
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
import Inventory from './components/Inventory';
import Profile from './components/Profile';
import Schedule from './components/Schedule';
import MapView from './components/MapView';
import Invoices from './components/Invoices';
import InvoiceDetails from './components/InvoiceDetails';
import InvoiceEditor from './components/InvoiceEditor';


const App: React.FC = () => {
  console.log('App component rendering...');
  console.log('API_KEY:', process.env.API_KEY);
  console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);
  
  return (
    <ErrorBoundary>
      <ToastProvider>
        <DataProvider>
          <Layout>
            <Routes>
              <Route path="/" element={
                <ErrorBoundary fallback={
                  <div className="text-center py-10">
                    <h2 className="text-xl font-bold text-gray-800">Dashboard Error</h2>
                    <p className="mt-2 text-gray-600">Unable to load dashboard. Please try again.</p>
                  </div>
                }>
                  <Dashboard />
                </ErrorBoundary>
              } />
              <Route path="/projects" element={
                <ErrorBoundary fallback={<div>Error loading projects</div>}>
                  <Projects />
                </ErrorBoundary>
              } />
              <Route path="/projects/:projectId" element={
                <ErrorBoundary fallback={<div>Error loading project details</div>}>
                  <ProjectDetails />
                </ErrorBoundary>
              } />
              <Route path="/projects/:projectId/photos" element={
                <ErrorBoundary fallback={<div>Error loading project photos</div>}>
                  <ProjectPhotos />
                </ErrorBoundary>
              } />
              <Route path="/projects/:projectId/tasks" element={
                <ErrorBoundary fallback={<div>Error loading tasks</div>}>
                  <Tasks />
                </ErrorBoundary>
              } />
              <Route path="/tasks" element={
                <ErrorBoundary fallback={<div>Error loading tasks</div>}>
                  <Tasks />
                </ErrorBoundary>
              } />
              <Route path="/schedule" element={
                <ErrorBoundary fallback={<div>Error loading schedule</div>}>
                  <Schedule />
                </ErrorBoundary>
              } />
              <Route path="/map" element={
                <ErrorBoundary fallback={<div>Error loading map</div>}>
                  <MapView />
                </ErrorBoundary>
              } />
              <Route path="/team" element={
                <ErrorBoundary fallback={<div>Error loading team</div>}>
                  <Team />
                </ErrorBoundary>
              } />
              <Route path="/time-tracking" element={
                <ErrorBoundary fallback={<div>Error loading time tracking</div>}>
                  <TimeTracking />
                </ErrorBoundary>
              } />
              <Route path="/punch-lists" element={
                <ErrorBoundary fallback={<div>Error loading punch lists</div>}>
                  <PunchLists />
                </ErrorBoundary>
              } />
              <Route path="/punch-lists/:projectId" element={
                <ErrorBoundary fallback={<div>Error loading punch list details</div>}>
                  <PunchListDetails />
                </ErrorBoundary>
              } />
              <Route path="/invoicing" element={
                <ErrorBoundary fallback={<div>Error loading invoices</div>}>
                  <Invoices />
                </ErrorBoundary>
              } />
              <Route path="/invoices/new" element={
                <ErrorBoundary fallback={<div>Error loading invoice editor</div>}>
                  <InvoiceEditor />
                </ErrorBoundary>
              } />
              <Route path="/invoices/:invoiceId" element={
                <ErrorBoundary fallback={<div>Error loading invoice details</div>}>
                  <InvoiceDetails />
                </ErrorBoundary>
              } />
              <Route path="/invoices/:invoiceId/edit" element={
                <ErrorBoundary fallback={<div>Error loading invoice editor</div>}>
                  <InvoiceEditor />
                </ErrorBoundary>
              } />
              <Route path="/inventory" element={
                <ErrorBoundary fallback={<div>Error loading inventory</div>}>
                  <Inventory />
                </ErrorBoundary>
              } />
              <Route path="/profile" element={
                <ErrorBoundary fallback={<div>Error loading profile</div>}>
                  <Profile />
                </ErrorBoundary>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </DataProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;