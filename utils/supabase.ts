import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// For development, provide clear error messages
// For production, create client with fallback values to prevent app from crashing
if (!supabaseUrl || !supabaseAnonKey) {
  if (import.meta.env.DEV) {
    console.error('Missing Supabase environment variables. Please check your .env.local file.');
    console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  } else {
    console.warn('Supabase environment variables not configured. Authentication will not work.');
  }
}

// Create client with fallback values to prevent crashes
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Store auth tokens in localStorage for persistence across sessions
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase.auth.token',
    },
  }
);

// Helper function to get proper redirect URL for auth callbacks
export const getAuthRedirectUrl = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:5173/#/auth/callback';
  }
  // In production, use the current origin with hash routing
  return `${window.location.origin}/#/auth/callback`;
};

// Export a function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

export default supabase;