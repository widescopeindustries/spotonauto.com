'use client';

import dynamic from 'next/dynamic';
import { AuthProvider } from '@/contexts/AuthContext';

// Lazy-load SpotOnGuide chat widget — not needed for initial paint
const SpotOnGuide = dynamic(
  () => import('@/components/SpotOnGuide').then((m) => m.SpotOnGuide),
  { ssr: false }
);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <SpotOnGuide />
    </AuthProvider>
  );
}
