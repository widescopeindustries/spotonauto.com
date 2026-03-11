'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (new URLSearchParams(window.location.search).get('fullGuide') === '1') {
      setShouldLoad(true);
    }
  }, []);

  return (
    <div id="full-ai-guide">
      {shouldLoad ? (
        <GuideContent params={params} />
      ) : (
        <section className="max-w-5xl mx-auto px-4 py-8 border-t border-white/10">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
            <h2 className="text-xl font-semibold tracking-tight text-white">Open the full AI repair guide</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-300">
              Load the interactive guide only when you want it. This keeps the main repair page lighter on mobile while still giving you generated instructions, extra specs, and the vehicle health snapshot.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShouldLoad(true)}
                className="inline-flex items-center rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-cyan-400"
              >
                Load full AI guide
              </button>
              <a
                href="?fullGuide=1#full-ai-guide"
                className="inline-flex items-center rounded-full border border-white/12 px-5 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:border-cyan-400/40 hover:text-white"
              >
                Open via direct link
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
