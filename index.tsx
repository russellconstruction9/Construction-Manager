import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';
import { HashRouter } from 'react-router-dom';

console.log('index.tsx loading...');
const env = {
  nodeEnv: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
};
console.log('Environment:', env);

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Could not find root element with id="root"');
  }

  console.log('Creating React root...');
  const root = ReactDOM.createRoot(rootElement);

  console.log('Rendering App...');
  root.render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );

  console.log('App rendered successfully');
} catch (error) {
  console.error('Critical error in index.tsx:', error);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f0f0f0; font-family: Arial, sans-serif;">
        <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 500px;">
          <h1 style="color: #d32f2f; margin: 0 0 1rem 0;">❌ Initialization Error</h1>
          <p style="color: #666; margin: 0 0 1rem 0;">${error.message}</p>
          <p style="color: #999; font-size: 14px; margin: 0 0 1rem 0;">Stack: ${error.stack}</p>
          <button onclick="window.location.reload()" style="background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px;">Reload Page</button>
        </div>
      </div>
    `;
  }
}
