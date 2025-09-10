import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a public client for browser-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a service client for server-side operations with full access
// WARNING: Never expose this client to the browser
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to check if we're on the server
export const isServer = typeof window === 'undefined';

// Get the appropriate client based on environment
export const getSupabaseClient = () => {
  if (isServer && supabaseServiceKey) {
    return supabaseAdmin;
  }
  return supabase;
};