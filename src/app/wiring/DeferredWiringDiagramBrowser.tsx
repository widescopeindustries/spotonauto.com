'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { startTransition, useEffect, useState } from 'react';

import type { WiringSelectorData } from '@/lib/wiringCoverage';
import { buildVehicleHubUrl } from '@/lib/vehicleIdentity';
import { fetchModels, getMakesForYear, getYears } from '@/services/vehicleData';

const WiringDiagramLibrary = dynamic(() => import('./WiringDiagramLibrary'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[40vh] flex items-center justify-center px-4">
      <p className="text-sm text-gray-500">Loading wiring diagrams...</p>
    </div>
  ),
});

const POPULAR_MAKES = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW',
  'Dodge', 'Jeep', 'GMC', 'Hyundai', 'Kia', 'Subaru',
  'Acura', 'Volkswagen', 'Mazda',
];

const SYSTEM_TAGS = [
  { slug: 'headlight', label: 'Headlights' },
  { slug: 'power-windows', label: 'Power Windows' },
  { slug: 'ac-heater', label: 'A/C & Heater' },
  { slug: 'alternator', label: 'Alternator / Charging' },
  { slug: 'starter', label: 'Starter' },
  { slug: 'abs', label: 'ABS Brakes' },
  { slug: 'airbag', label: 'Airbag SRS' },
  { slug: 'engine-management', label: 'Engine Management' },
  { slug: 'fuel-pump', label: 'Fuel Pump' },
  { slug: 'cruise-control', label: 'Cruise Control' },
  { slug: 'instrument-cluster', label: 'Instrument Cluster' },
  { slug: 'body-electrical', label: 'Body Electrical' },
];

function wiringSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function shouldAutoOpenLibrary() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return (
    ['year', 'make', 'model', 'variant', 'q', 'open'].some((key) => params.has(key)) ||
    window.location.hash === '#diagram-browser'
  );
}

export default function DeferredWiringDiagramBrowser() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [selectorData, setSelectorData] = useState<WiringSelectorData | null>(null);
  const [loadingSelectorData, setLoadingSelectorData] = useState(false);
  const [selectorError, setSelectorError] = useState<string | null>(null);

  const [vehicle, setVehicle] = useState({ year: '', make: '', model: '' });
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const availableYears = getYears();
  const availableMakes = vehicle.year ? getMakesForYear(vehicle.year) : [];
  const hasVehicle = Boolean(vehicle.year && vehicle.make && vehicle.model);
  const vehicleHubHref = hasVehicle
    ? buildVehicleHubUrl(vehicle.year, vehicle.make, vehicle.model)
    : null;

  useEffect(() => {
    if (shouldAutoOpenLibrary()) setShouldLoad(true);
  }, []);

  useEffect(() => {
    if (!shouldLoad || selectorData || loadingSelectorData) return;

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

  useEffect(() => {
    if (!vehicle.make || !vehicle.year) {
      setAvailableModels([]);
      return;
    }

    let cancelled = false;
    setLoadingModels(true);

    void fetchModels(vehicle.make, vehicle.year)
      .then((models) => {
        if (!cancelled) setAvailableModels(models);
      })
      .catch(() => {
        if (!cancelled) setAvailableModels([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingModels(false);
      });

    return () => {
      cancelled = true;
    };
  }, [vehicle.make, vehicle.year]);

  if (shouldLoad && selectorData) {
    return <WiringDiagramLibrary selectorData={selectorData} />;
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-cyan-500/15 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_48%),rgba(255,255,255,0.03)] p-8 sm:p-10">
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl font-black tracking-tight text-white sm:text-5xl">
            Find Wiring Diagrams for Your Vehicle
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-300 sm:text-lg">
            Browse 148,000+ factory electrical diagrams covering 82 makes from 1982 to 2013.
            Select your vehicle below to find the exact diagram you need.
          </p>
        </div>

        {/* ── Vehicle Picker ────────────────────────────────────────────── */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/75 mb-4">
            Select your vehicle
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="relative">
              <label htmlFor="wiring-year" className="sr-only">Year</label>
              <select
                id="wiring-year"
                className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900/55 px-4 py-3 text-sm font-medium text-gray-200 shadow-lg transition-all hover:border-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                value={vehicle.year}
                onChange={(e) => {
                  const year = e.target.value;
                  startTransition(() => {
                    setVehicle({ year, make: '', model: '' });
                    setAvailableModels([]);
                  });
                }}
              >
                <option value="">Year</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-3.5 text-cyan-300 text-xs">&#9662;</div>
            </div>

            <div className="relative">
              <label htmlFor="wiring-make" className="sr-only">Make</label>
              <select
                id="wiring-make"
                className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900/55 px-4 py-3 text-sm font-medium text-gray-200 shadow-lg transition-all hover:border-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                value={vehicle.make}
                onChange={(e) => {
                  const make = e.target.value;
                  startTransition(() => {
                    setVehicle((prev) => ({ ...prev, make, model: '' }));
                    setAvailableModels([]);
                  });
                }}
                disabled={!vehicle.year}
              >
                <option value="">Make</option>
                {availableMakes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-3.5 text-cyan-300 text-xs">&#9662;</div>
            </div>

            <div className="relative">
              <label htmlFor="wiring-model" className="sr-only">Model</label>
              <select
                id="wiring-model"
                className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900/55 px-4 py-3 text-sm font-medium text-gray-200 shadow-lg transition-all hover:border-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                value={vehicle.model}
                onChange={(e) => {
                  startTransition(() => {
                    setVehicle((prev) => ({ ...prev, model: e.target.value }));
                  });
                }}
                disabled={!vehicle.make || loadingModels}
              >
                <option value="">{loadingModels ? 'Loading...' : 'Model'}</option>
                {availableModels.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-3.5 text-cyan-300 text-xs">&#9662;</div>
            </div>
          </div>

          {hasVehicle && vehicleHubHref && (
            <div className="mt-4">
              <Link
                href={vehicleHubHref}
                className="inline-flex items-center rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-cyan-300"
              >
                View {vehicle.year} {vehicle.make} {vehicle.model} wiring diagrams &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* ── Popular Makes ────────────────────────────────────────────── */}
        <div className="mt-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/75 mb-4">
            Popular makes
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {POPULAR_MAKES.map((make) => (
              <Link
                key={make}
                href={`/wiring?make=${encodeURIComponent(make)}`}
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-center text-sm font-medium text-gray-200 transition-all hover:border-cyan-400/35 hover:text-cyan-200 hover:bg-cyan-400/[0.06]"
              >
                {make}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Browse by System ─────────────────────────────────────────── */}
        <div className="mt-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/75 mb-4">
            Browse by electrical system
          </p>
          <div className="flex flex-wrap gap-2">
            {SYSTEM_TAGS.map(({ slug, label }) => {
              const href = hasVehicle
                ? `/wiring/${vehicle.year}/${wiringSlug(vehicle.make)}/${wiringSlug(vehicle.model)}/${slug}`
                : `/wiring?q=${encodeURIComponent(label)}&open=1`;
              return (
                <Link
                  key={slug}
                  href={href}
                  className="rounded-full border border-white/10 bg-slate-900/50 px-4 py-2 text-xs font-medium text-gray-300 transition-all hover:border-cyan-400/35 hover:text-cyan-200"
                >
                  {label}
                </Link>
              );
            })}
          </div>
          {hasVehicle && (
            <p className="mt-2 text-xs text-gray-500">
              Links go directly to {vehicle.year} {vehicle.make} {vehicle.model} diagrams for each system.
            </p>
          )}
        </div>

        {/* ── Full browser toggle ──────────────────────────────────────── */}
        <div className="mt-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-gray-500 uppercase tracking-widest">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShouldLoad(true)}
            className="inline-flex items-center rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-cyan-300"
          >
            Search wiring diagrams
          </button>
        </div>

        {/* ── Feature cards ────────────────────────────────────────────── */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/75">148K+ diagrams</p>
            <p className="mt-3 text-sm leading-6 text-gray-300">Factory electrical diagrams for 82 makes and hundreds of models, from 1982 to 2013.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/75">Search by system</p>
            <p className="mt-3 text-sm leading-6 text-gray-300">Find diagrams by electrical system — headlights, power windows, fuel injection, starting, and more.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/75">Year, make, model</p>
            <p className="mt-3 text-sm leading-6 text-gray-300">Select your exact vehicle to see only the diagrams that apply to your car, truck, or SUV.</p>
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
