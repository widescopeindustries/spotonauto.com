'use client';

import React, { createContext, useState, useEffect, useContext, useRef, ReactNode } from 'react';
import { User as AppUser, SubscriptionTier } from '../types';
import type { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginWithGoogle: (redirectAfter?: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  // Supabase client — loaded lazily after initial render to avoid blocking LCP
  const sbRef = useRef<SupabaseClient | null>(null);

  // Helper to map Supabase user + subscription to AppUser
  const mapUser = async (sbUser: SupabaseUser, sb: SupabaseClient) => {
    try {
      const { data: subscription, error } = await sb
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

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    // Dynamically import Supabase AFTER initial render — keeps it out of
    // the critical JS path so repair pages don't pay the ~150 KB cost.
    import('../lib/supabaseClient').then(({ supabase }) => {
      sbRef.current = supabase;

      // Check active session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          mapUser(session.user, supabase);
        } else {
          setUser(null);
        }
        setLoading(false);
      }).catch((err: unknown) => {
        console.error('getSession failed:', err);
        setLoading(false);
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          await mapUser(session.user, supabase);
        } else {
          setUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('spoton_pro');
          }
        }
        setLoading(false);
      });

      cleanup = () => subscription.unsubscribe();
    }).catch((err: unknown) => {
      console.error('Supabase import failed:', err);
      setLoading(false); // Never leave buttons stuck on "Loading..."
    });

    return () => cleanup?.();
  }, []);

  const loginWithGoogle = async (redirectAfter?: string) => {
    const sb = sbRef.current;
    if (!sb) return;
    // Save the intended destination so auth/callback can restore it after OAuth
    const dest = redirectAfter || (typeof window !== 'undefined' ? window.location.pathname : '/');
    if (dest && dest !== '/' && typeof window !== 'undefined') {
      localStorage.setItem('auth_redirect', dest);
    }
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { console.error('Google Login failed:', error.message); throw error; }
  };

  const loginWithEmail = async (email: string, password: string) => {
    const sb = sbRef.current;
    if (!sb) return;
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { console.error('Email Login failed:', error.message); throw error; }
  };

  const signup = async (email: string, password: string) => {
    const sb = sbRef.current;
    if (!sb) return;
    const { error } = await sb.auth.signUp({ email, password });
    if (error) { console.error('Signup failed:', error.message); throw error; }
  };

  const logout = async () => {
    const sb = sbRef.current;
    if (!sb) return;
    const { error } = await sb.auth.signOut();
    if (error) { console.error('Logout failed:', error.message); }
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('spoton_pro');
    }
  };

  const refreshUser = async () => {
    const sb = sbRef.current;
    if (!sb) return;
    const { data: { user: sbUser } } = await sb.auth.getUser();
    if (sbUser) await mapUser(sbUser, sb);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
