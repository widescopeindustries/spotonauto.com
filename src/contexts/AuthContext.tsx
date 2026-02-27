'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User as AppUser, SubscriptionTier } from '../types';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

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

  // Helper to map Supabase user + subscription to AppUser
  const mapUser = async (sbUser: SupabaseUser) => {
    try {
      const { data: subscription, error } = await supabase
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
    // Check active session immediately — no lazy import
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        mapUser(session.user);
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
        await mapUser(session.user);
      } else {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('spoton_pro');
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async (redirectAfter?: string) => {
    const dest = redirectAfter || (typeof window !== 'undefined' ? window.location.pathname : '/');
    if (dest && dest !== '/' && typeof window !== 'undefined') {
      localStorage.setItem('auth_redirect', dest);
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { console.error('Google Login failed:', error.message); throw error; }
  };

  const loginWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { console.error('Email Login failed:', error.message); throw error; }
  };

  const signup = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { console.error('Signup failed:', error.message); throw error; }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { console.error('Logout failed:', error.message); }
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('spoton_pro');
    }
  };

  const refreshUser = async () => {
    const { data: { user: sbUser } } = await supabase.auth.getUser();
    if (sbUser) await mapUser(sbUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, signup, logout, refreshUser }}>
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
  logout: noop,
  refreshUser: noop,
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  // Return default (loading state) if AuthProvider hasn't mounted yet
  return context ?? defaultAuth;
};
