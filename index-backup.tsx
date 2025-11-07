// index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';
import { HashRouter } from 'react-router-dom';

console.log('index.tsx loading...');
console.log('Environment check:', {
  nodeEnv: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
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
