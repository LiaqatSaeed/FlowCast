import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, signIn as supabaseSignIn, signOut as supabaseSignOut } from './supabase';

const AuthContext = createContext(null);

/**
 * Provides Supabase auth state to all children.
 * Persists session via Supabase's built-in token refresh.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hydrate from existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Sign in with email + password.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<string|null>} error message or null on success
   */
  async function signIn(email, password) {
    const { error } = await supabaseSignIn(email, password);
    return error ? error.message : null;
  }

  /**
   * Sign out the current user.
   */
  async function signOut() {
    await supabaseSignOut();
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access the auth context.
 * Must be used inside <AuthProvider>.
 * @returns {{ user: object|null, loading: boolean, signIn: Function, signOut: Function }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
