'use client';

import { useEffect, useRef, useState } from 'react';

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_SRC = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3105584943212740';
let adsenseLoadPromise: Promise<void> | null = null;

function ensureAdSenseLoaded(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.adsbygoogle) return Promise.resolve();

  if (!adsenseLoadPromise) {
    adsenseLoadPromise = new Promise<void>((resolve) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${ADSENSE_SRC}"]`);
      if (existing) {
        if (window.adsbygoogle) resolve();
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => resolve(), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.src = ADSENSE_SRC;
      script.crossOrigin = 'anonymous';
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener('error', () => resolve(), { once: true });
      document.head.appendChild(script);
    });
  }

  return adsenseLoadPromise;
}

export default function AdUnit({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
}: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    if (initialized.current) return;
    if (!adRef.current) return;
    if (adRef.current.dataset.adStatus === 'done') {
      initialized.current = true;
      return;
    }
    const node = adRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!nearViewport || initialized.current || !adRef.current) return;

    let cancelled = false;
    const init = async () => {
      await ensureAdSenseLoaded();
      if (cancelled || initialized.current) return;

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        initialized.current = true;
      } catch {
        // AdSense not loaded, blocked, or ad slot already filled
      }
    };

    // Keep ad setup out of critical interaction window (INP).
    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(init, { timeout: 3000 });
      return () => {
        cancelled = true;
        cancelIdleCallback(id);
      };
    }

    const timer = window.setTimeout(init, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [nearViewport]);

  const minHeight = format === 'rectangle' ? 250 : format === 'vertical' ? 600 : 90;

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
        style={{ display: 'block', minHeight: `${minHeight}px` }}
        data-ad-client="ca-pub-3105584943212740"
        data-ad-slot={slot}
        data-ad-format={format}
        {...(responsive && { 'data-full-width-responsive': 'true' })}
      />
    </aside>
  );
}
