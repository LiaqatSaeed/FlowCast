import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

/**
 * Supabase browser client — uses anon key, protected by RLS policies.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Sign in with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * Sign out the current user.
 * @returns {Promise<{error: object|null}>}
 */
export async function signOut() {
  return supabase.auth.signOut();
}

/**
 * Get the current authenticated session.
 * @returns {Promise<{data: {session: object|null}, error: object|null}>}
 */
export async function getSession() {
  return supabase.auth.getSession();
}
