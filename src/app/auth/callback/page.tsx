'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="animate-pulse text-cyan-400">Returning you to local sign-in...</div>
    </div>
  );
}
