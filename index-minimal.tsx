import React from 'react';
import ReactDOM from 'react-dom/client';

const MinimalApp = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f0f0',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#333', marginBottom: '1rem' }}>
          🏗️ ConstructTrack Pro
        </h1>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Minimal test - React is working!
        </p>
        <div style={{ fontSize: '14px', color: '#999' }}>
          <p>Environment: {import.meta.env.MODE}</p>
          <p>Timestamp: {new Date().toLocaleString()}</p>
          <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not set'}</p>
        </div>
      </div>
    </div>
  );
};

console.log('Minimal index starting...');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found!');
  }
  
  console.log('Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('Rendering minimal app...');
  root.render(<MinimalApp />);
  
  console.log('Minimal app rendered successfully!');
} catch (error) {
  console.error('Error in minimal app:', error);
  
  // Fallback to vanilla JS rendering
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f0f0f0; font-family: Arial, sans-serif;">
        <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center;">
          <h1 style="color: #333;">⚠️ React Error</h1>
          <p style="color: #666;">React failed to load. Error: ${error.message}</p>
          <button onclick="window.location.reload()" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      </div>
    `;
  }
}