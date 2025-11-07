import React from 'react';

const EnvTest: React.FC = () => {
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
    VITE_NODE_ENV: import.meta.env.VITE_NODE_ENV,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    BASE_URL: import.meta.env.BASE_URL
  };

  console.log('Environment variables:', envVars);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Environment Variables Test</h1>
        <div className="space-y-2">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="font-mono text-sm text-gray-600">{key}:</span>
              <span className="font-mono text-sm text-gray-900 break-all max-w-sm">
                {value ? (key.includes('KEY') ? '***' + String(value).slice(-10) : String(value)) : 'undefined'}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Supabase Status:</strong> {envVars.VITE_SUPABASE_URL && envVars.VITE_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Not Configured'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnvTest;