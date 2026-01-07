import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a singleton Supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null;

export const supabase = (() => {
  if (typeof window === 'undefined') {
    // Server-side: create a basic client
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  // Client-side: use singleton pattern and ensure proper storage
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'supabase.auth.token',
      },
    });
  }

  return supabaseClient;
})();

