// Supabase client initialization
// Ensure you create a .env.local file with:
// VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
// VITE_SUPABASE_ANON_KEY=<your anon/public key>
// Never commit real keys; add a .env.example with placeholders.

import { createClient } from '@supabase/supabase-js';
import { Database } from '../supabase-types';

// Using Vite's import.meta.env to access env variables prefixed with VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Soft warning so app still builds; you can choose to throw instead.
  console.warn('[supabaseClient] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Supabase features will be disabled until these are set.');
}

export const supabase = createClient<Database>(supabaseUrl || 'http://localhost:54321', supabaseAnonKey || 'public-anon-key-placeholder');

// Simple health check helper
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('projects').select('id').limit(1);
    if (error) {
      console.warn('[Supabase Test] Error querying projects table:', error.message);
      return false;
    }
    console.info('[Supabase Test] Connection OK. Rows:', data?.length ?? 0);
    return true;
  } catch (e) {
    console.error('[Supabase Test] Unexpected error:', e);
    return false;
  }
}
