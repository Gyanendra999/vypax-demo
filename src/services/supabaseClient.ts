import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  'https://placeholder-vyaapx.supabase.co';

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  return Boolean(
    url &&
    key &&
    !url.includes('placeholder') &&
    !url.includes('your-project')
  );
};

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce',
  },
});
