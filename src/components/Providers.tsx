'use client';

import { useState, useEffect, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { LocaleProvider } from '@/lib/localeContext';

// Phase 1: Render children immediately with no auth context
// Phase 2: After first paint, load AuthProvider + SpotOnGuide
const AuthProvider = dynamic(
  () => import('@/contexts/AuthContext').then((m) => m.AuthProvider),
  { ssr: false }
);
const SpotOnGuide = dynamic(
  () => import('@/components/SpotOnGuide').then((m) => m.SpotOnGuide),
  { ssr: false }
);

export default function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Defer heavy auth+supabase bundle until after paint
    const id = requestIdleCallback?.(() => setMounted(true)) ?? setTimeout(() => setMounted(true), 50);
    return () => {
      if (typeof id === 'number' && cancelIdleCallback) cancelIdleCallback(id);
    };
  }, []);

  if (!mounted) {
    // First paint — no Supabase JS loaded, children render fast
    return <LocaleProvider>{children}</LocaleProvider>;
  }

  return (
    <LocaleProvider>
      <AuthProvider>
        {children}
        <SpotOnGuide />
      </AuthProvider>
    </LocaleProvider>
  );
}
