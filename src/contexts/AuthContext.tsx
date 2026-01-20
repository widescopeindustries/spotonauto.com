
'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User as AppUser, SubscriptionTier } from '../types';
import { supabase } from '../lib/supabaseClient';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to map Supabase user + profile to AppUser
  const mapUser = async (sbUser: SupabaseUser) => {
    try {
      // Fetch profile for subscription tier
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_tier, credits')
        .eq('id', sbUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      // Default to free if no profile exists yet (could be created via trigger or just fallback)
      const tier = (profile?.subscription_tier as SubscriptionTier) || SubscriptionTier.Free;

      setUser({
        id: sbUser.id,
        email: sbUser.email || '',
        tier: tier,
      });
    } catch (err) {
      console.error('Unexpected error mapping user:', err);
      // Fallback
      setUser({
        id: sbUser.id,
        email: sbUser.email || '',
        tier: SubscriptionTier.Free,
      });
    }
  };

  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        mapUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Reload user profile to ensure fresh data (e.g. after upgrade)
        await mapUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error('Google Login failed:', error.message);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) {
        console.error('Email Login failed:', error.message);
        throw error;
    }
  };

  const signup = async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({
          email,
          password,
      });
      if (error) {
          console.error('Signup failed:', error.message);
          throw error;
      }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout failed:', error.message);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, signup, logout }}>
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
