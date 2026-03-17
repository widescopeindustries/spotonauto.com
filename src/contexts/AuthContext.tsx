'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User as AppUser, SubscriptionTier } from '../types';
import type { User as SupabaseUser, SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Lazy Supabase loader
// ---------------------------------------------------------------------------
// Dynamic import keeps the Supabase SDK (~50 KB) out of the initial JS bundle.
// The SDK chunk is only fetched when auth is actually needed — either when the
// deferred idle-time init fires or when the user triggers an auth action.
// ---------------------------------------------------------------------------
let _supabasePromise: Promise<SupabaseClient> | null = null;
function getSupabase(): Promise<SupabaseClient> {
  if (!_supabasePromise) {
    _supabasePromise = import('../lib/supabaseClient').then(m => m.supabase);
  }
  return _supabasePromise;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginWithGoogle: (redirectAfter?: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to map Supabase user + subscription to AppUser
  const mapUser = async (client: SupabaseClient, sbUser: SupabaseUser) => {
    try {
      const { data: subscription, error } = await client
        .from('subscriptions')
        .select('tier, status')
        .eq('user_id', sbUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
      }

      let tier = SubscriptionTier.Free;
      if (subscription?.status === 'active') {
        if (subscription.tier === 'pro') tier = SubscriptionTier.Pro;
        else if (subscription.tier === 'pro_plus') tier = SubscriptionTier.ProPlus;
      }

      if (typeof window !== 'undefined') {
        if (tier !== SubscriptionTier.Free) {
          localStorage.setItem('spoton_pro', 'true');
        } else {
          localStorage.removeItem('spoton_pro');
        }
      }

      setUser({ id: sbUser.id, email: sbUser.email || '', tier });
    } catch (err) {
      console.error('Unexpected error mapping user:', err);
      setUser({ id: sbUser.id, email: sbUser.email || '', tier: SubscriptionTier.Free });
    }
  };

  // --------------------------------------------------------------------------
  // Deferred auth initialisation
  // --------------------------------------------------------------------------
  // Instead of checking the session synchronously on mount (which blocks
  // hydration and hurts LCP / INP on every page), we defer the work to
  // requestIdleCallback so it runs *after* the browser has finished the
  // initial paint.  The 3 s timeout ensures auth still resolves promptly
  // even on busy pages.
  // --------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    let unsubscribeAuth: (() => void) | null = null;

    const initAuth = async () => {
      const client = await getSupabase();
      if (cancelled) return;

      // Check active session
      try {
        const { data: { session } } = await client.auth.getSession();
        if (cancelled) return;
        if (session?.user) {
          await mapUser(client, session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('getSession failed:', err);
      }
      if (cancelled) return;
      setLoading(false);

      // Listen for future auth changes
      const { data: { subscription } } = client.auth.onAuthStateChange(
        async (_event, session) => {
          if (cancelled) return;
          if (session?.user) {
            await mapUser(client, session.user);
          } else {
            setUser(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('spoton_pro');
            }
          }
          setLoading(false);
        },
      );
      unsubscribeAuth = () => subscription.unsubscribe();
    };

    // Defer to idle time so auth work doesn't compete with LCP
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = requestIdleCallback(() => { initAuth(); }, { timeout: 3000 });
      return () => {
        cancelled = true;
        cancelIdleCallback(id);
        unsubscribeAuth?.();
      };
    } else {
      const id = setTimeout(() => { initAuth(); }, 1);
      return () => {
        cancelled = true;
        clearTimeout(id);
        unsubscribeAuth?.();
      };
    }
  }, []);

  // --------------------------------------------------------------------------
  // Auth actions — each lazily loads Supabase on first call
  // --------------------------------------------------------------------------

  const loginWithGoogle = async (redirectAfter?: string) => {
    const client = await getSupabase();
    const dest = redirectAfter || (typeof window !== 'undefined' ? window.location.pathname : '/');
    if (dest && dest !== '/' && typeof window !== 'undefined') {
      localStorage.setItem('auth_redirect', dest);
    }
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { console.error('Google Login failed:', error.message); throw error; }
  };

  const loginWithEmail = async (email: string, password: string) => {
    const client = await getSupabase();
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) { console.error('Email Login failed:', error.message); throw error; }
  };

  const signup = async (email: string, password: string) => {
    const client = await getSupabase();
    const { error } = await client.auth.signUp({ email, password });
    if (error) { console.error('Signup failed:', error.message); throw error; }
  };

  const resetPassword = async (email: string) => {
    const client = await getSupabase();
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth`
      : undefined;
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) { console.error('Password reset failed:', error.message); throw error; }
  };

  const logout = async () => {
    const client = await getSupabase();
    const { error } = await client.auth.signOut();
    if (error) { console.error('Logout failed:', error.message); }
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('spoton_pro');
    }
  };

  const refreshUser = async () => {
    const client = await getSupabase();
    const { data: { user: sbUser } } = await client.auth.getUser();
    if (sbUser) await mapUser(client, sbUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, signup, resetPassword, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Default fallback when AuthProvider hasn't mounted yet (deferred loading)
const noop = async () => {};
const defaultAuth: AuthContextType = {
  user: null,
  loading: true,
  loginWithGoogle: noop,
  loginWithEmail: noop,
  signup: noop,
  resetPassword: noop,
  logout: noop,
  refreshUser: noop,
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  // Return default (loading state) if AuthProvider hasn't mounted yet
  return context ?? defaultAuth;
};
