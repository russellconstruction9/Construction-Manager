import React from 'react';

const DebugInfo: React.FC = () => {
  const apiKey = process.env.API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  
  return (
    <div className="fixed top-0 right-0 bg-red-100 border border-red-400 text-red-700 p-2 m-2 rounded text-xs z-50">
      <h3 className="font-bold">Debug Info:</h3>
      <p>API_KEY: {apiKey ? 'Set' : 'Missing'}</p>
      <p>GEMINI_API_KEY: {geminiKey ? 'Set' : 'Missing'}</p>
      <p>NODE_ENV: {process.env.NODE_ENV}</p>
    </div>
  );
};

export default DebugInfo;