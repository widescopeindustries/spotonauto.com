'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, LogOut } from 'lucide-react';
import AuthProviders from '@/components/AuthProviders';
import { useAuth } from '@/contexts/AuthContext';

function HeaderAccountControlsInner() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  if (!user) {
    return (
      <Link
        href="/auth"
        className="btn-cyber hover:scale-105 active:scale-95 transition-transform duration-200"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/history"
        className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <History className="w-4 h-4" />
        <span className="font-body text-sm">History</span>
      </Link>
      <button
        onClick={handleLogout}
        className="btn-cyber flex items-center gap-2 py-2 px-4 hover:scale-105 active:scale-95 transition-transform duration-200"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-xs">Logout</span>
      </button>
    </div>
  );
}

export default function HeaderAccountControls() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const activate = () => setIsReady(true);

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(activate, { timeout: 2000 });
      return () => window.cancelIdleCallback(idleId);
    }

    timeoutId = setTimeout(activate, 300);
    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  if (!isReady) {
    return (
      <Link
        href="/auth"
        className="btn-cyber hover:scale-105 active:scale-95 transition-transform duration-200"
      >
        Sign In
      </Link>
    );
  }

  return (
    <AuthProviders>
      <HeaderAccountControlsInner />
    </AuthProviders>
  );
}
