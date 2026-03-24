'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import type { WiringSelectorData } from '@/lib/wiringCoverage';

const WiringDiagramLibrary = dynamic(() => import('./WiringDiagramLibrary'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[40vh] flex items-center justify-center px-4">
      <p className="text-sm text-gray-500">Loading the interactive wiring browser...</p>
    </div>
  ),
});

function shouldAutoOpenLibrary() {
  if (typeof window === 'undefined') {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  return ['year', 'make', 'model', 'variant', 'q', 'open'].some((key) => params.has(key))
    || window.location.hash === '#diagram-browser';
}

export default function DeferredWiringDiagramBrowser() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [selectorData, setSelectorData] = useState<WiringSelectorData | null>(null);
  const [loadingSelectorData, setLoadingSelectorData] = useState(false);
  const [selectorError, setSelectorError] = useState<string | null>(null);

  useEffect(() => {
    if (shouldAutoOpenLibrary()) {
      setShouldLoad(true);
    }
  }, []);

  useEffect(() => {
    if (!shouldLoad || selectorData || loadingSelectorData) {
      return;
    }

    let cancelled = false;
    setLoadingSelectorData(true);
    setSelectorError(null);

    void fetch('/api/wiring-selector')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Unable to load verified wiring coverage');
        }
        return data as WiringSelectorData;
      })
      .then((data) => {
        if (cancelled) return;
        setSelectorData(data);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setSelectorError(error instanceof Error ? error.message : 'Unable to load wiring coverage');
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingSelectorData(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadingSelectorData, selectorData, shouldLoad]);

  if (shouldLoad && selectorData) {
    return <WiringDiagramLibrary selectorData={selectorData} />;
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-cyan-500/15 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_48%),rgba(255,255,255,0.03)] p-8 sm:p-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
            Factory electrical archive
          </div>
          <h1 className="mt-5 font-display text-4xl font-black tracking-tight text-white sm:text-5xl">
            Open the interactive wiring browser only when you need it
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-300 sm:text-lg">
            This keeps the wiring landing page lighter on mobile. When you open the browser, SpotOnAuto will load the verified year, make, and model coverage plus the full diagram search interface.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShouldLoad(true)}
              className="inline-flex items-center rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-cyan-300"
            >
              Open wiring browser
            </button>
            <a
              href="/wiring#diagram-browser"
              className="inline-flex items-center rounded-full border border-white/12 px-6 py-3 text-sm font-medium text-gray-200 transition-colors hover:border-cyan-400/40 hover:text-white"
            >
              Direct link
            </a>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/75">Coverage</p>
            <p className="mt-3 text-sm leading-6 text-gray-300">Verified factory wiring coverage from 1982 to 2013 across the supported makes and models.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/75">Search</p>
            <p className="mt-3 text-sm leading-6 text-gray-300">Search by system, deep-link from SEO wiring pages, and open the exact diagram only when you need it.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/75">Mobile first</p>
            <p className="mt-3 text-sm leading-6 text-gray-300">The heavy browser stays off the main thread until the user intentionally opens the diagram flow.</p>
          </div>
        </div>

        {loadingSelectorData && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-gray-300">
            Loading verified wiring coverage...
          </div>
        )}

        {selectorError && (
          <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
            <p className="text-sm text-amber-100">{selectorError}</p>
            <button
              type="button"
              onClick={() => {
                setSelectorError(null);
                setSelectorData(null);
                setShouldLoad(true);
              }}
              className="mt-4 inline-flex items-center rounded-full border border-amber-300/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100 transition-colors hover:border-amber-200/50"
            >
              Retry
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
