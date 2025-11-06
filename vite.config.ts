import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // Environment variables are automatically available with VITE_ prefix
      // No need to manually define them in the define section
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Ensure sensitive environment variables are not exposed
      define: {
        __DEV__: JSON.stringify(mode === 'development'),
      }
    };
});
