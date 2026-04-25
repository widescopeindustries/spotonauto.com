'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User as AppUser, SubscriptionTier } from '../types';
import { clearLocalUser, loadLocalUser, saveLocalUser } from '@/lib/localBrowserStore';

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

function readStoredEmail(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('spotonauto-local-email-v1') || '';
}

function persistEmail(email: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('spotonauto-local-email-v1', email.trim());
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const syncFromStorage = () => {
    const stored = loadLocalUser();
    setUser(stored);
    setLoading(false);
  };

  useEffect(() => {
    syncFromStorage();
  }, []);

  const createOrUpdateLocalUser = async (email: string) => {
    const userRecord = saveLocalUser({ email, tier: SubscriptionTier.Free });
    persistEmail(email);
    setUser(userRecord);
  };

  const loginWithGoogle = async () => {
    const fallbackEmail = readStoredEmail() || 'local-user@spotonauto.com';
    await createOrUpdateLocalUser(fallbackEmail);
  };

  const loginWithEmail = async (email: string) => {
    await createOrUpdateLocalUser(email);
  };

  const signup = async (email: string) => {
    await createOrUpdateLocalUser(email);
  };

  const resetPassword = async (_email: string) => {
    // Local-only auth does not send reset mail. Keep the promise shape so callers
    // can reuse the same flow while the stack is fully self-hosted.
    return;
  };

  const logout = async () => {
    clearLocalUser();
    setUser(null);
  };

  const refreshUser = async () => {
    syncFromStorage();
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, signup, resetPassword, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

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
  return context ?? defaultAuth;
};
