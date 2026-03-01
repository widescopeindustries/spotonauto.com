'use client';

import { useEffect, useRef } from 'react';

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdUnit({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
}: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (!adRef.current) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      initialized.current = true;
    } catch {
      // AdSense not loaded or blocked
    }
  }, []);

  return (
    <aside
      className={`my-8 mx-auto max-w-4xl rounded-xl border border-white/10 bg-white/[0.02] p-4 ${className}`}
      aria-label="Advertisement"
    >
      <span className="mb-2 block text-[10px] uppercase tracking-widest text-gray-600">
        Ad
      </span>
      <ins
        ref={adRef}
        className="adsbygoogle block"
        style={{ display: 'block', minHeight: '90px' }}
        data-ad-client="ca-pub-3105584943212740"
        data-ad-slot={slot}
        data-ad-format={format}
        {...(responsive && { 'data-full-width-responsive': 'true' })}
      />
    </aside>
  );
}
