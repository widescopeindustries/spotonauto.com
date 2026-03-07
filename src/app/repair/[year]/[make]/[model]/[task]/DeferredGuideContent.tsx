'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const GuideContent = dynamic(() => import('./GuideContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[40vh] flex items-center justify-center px-4">
      <p className="text-sm text-gray-500">Loading full AI repair guide...</p>
    </div>
  ),
});

interface DeferredGuideContentProps {
  params: {
    year: string;
    make: string;
    model: string;
    task: string;
  };
}

export default function DeferredGuideContent({ params }: DeferredGuideContentProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef}>
      {shouldLoad ? (
        <GuideContent params={params} />
      ) : (
        <section className="max-w-5xl mx-auto px-4 py-8 border-t border-white/10">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
            <h2 className="text-lg font-bold text-cyan-300">Loading Full AI Guide On Scroll</h2>
            <p className="text-sm text-gray-300 mt-2">
              Scroll down to load the interactive step-by-step guide and vehicle health snapshot.
            </p>
            <button
              type="button"
              onClick={() => setShouldLoad(true)}
              className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-cyan-500 text-black text-sm font-semibold hover:bg-cyan-400 transition-colors"
            >
              Load Now
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
