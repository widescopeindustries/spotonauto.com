'use client';

import { startTransition, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Battery,
  BookOpen,
  Car,
  CircleDot,
  Keyboard,
  Search,
  ShieldCheck,
  Wrench,
  Zap,
} from 'lucide-react';

import { fetchModels, getMakesForYear, getYears } from '@/services/vehicleData';
import { buildVehicleHubUrl } from '@/lib/vehicleIdentity';
import ConversionZone from '@/components/ConversionZone';

const SELECT_CLASS =
  'w-full appearance-none rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm font-medium text-gray-200 shadow-lg transition-all hover:border-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50';

const POPULAR_GUIDES = [
  {
    title: 'P0300 Code: Complete Diagnosis Guide',
    href: '/codes/p0300',
    readTime: '9 min',
    difficulty: 'High',
    icon: Zap,
  },
  {
    title: 'Ford F-150 Brake Pad Replacement (2015-2020)',
    href: '/repairs/brake-pad-replacement',
    readTime: '12 min',
    difficulty: 'Medium',
    icon: CircleDot,
  },
  {
    title: 'Honda Accord Oil Change: Step-by-Step',
    href: '/repairs/oil-change',
    readTime: '8 min',
    difficulty: 'Easy',
    icon: Wrench,
  },
  {
    title: 'Check Engine Light Flashing? Stop Driving Now',
    href: '/codes',
    readTime: '6 min',
    difficulty: 'Critical',
    icon: ShieldCheck,
  },
  {
    title: 'Jeep Wrangler Tire Size Guide by Year',
    href: '/tools/jeep-wrangler-tire-size',
    readTime: '7 min',
    difficulty: 'Easy',
    icon: CircleDot,
  },
  {
    title: 'BMW X5 Battery Location & Replacement',
    href: '/tools/bmw-x3-battery-location',
    readTime: '10 min',
    difficulty: 'Medium',
    icon: Battery,
  },
];

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

function track(event: string, params: Record<string, string | number> = {}) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', event, params);
}

export default function ClientHome() {
  const router = useRouter();

  const [vehicle, setVehicle] = useState({ year: '', make: '', model: '' });
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const [symptom, setSymptom] = useState('');
  const [dtcCode, setDtcCode] = useState('');
  const [vinInput, setVinInput] = useState('');
  const [idMode, setIdMode] = useState<'ymm' | 'vin'>('ymm');

  const availableYears = getYears();
  const availableMakes = vehicle.year ? getMakesForYear(vehicle.year) : [];
  const hasVehicle = Boolean(vehicle.year && vehicle.make && vehicle.model);
  const vehicleLabel = hasVehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : '';
  const vehicleHubUrl = hasVehicle
    ? buildVehicleHubUrl(vehicle.year, vehicle.make, vehicle.model)
    : '';

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

  function handleVinSubmit(e: FormEvent) {
    e.preventDefault();
    const vin = vinInput.trim().toUpperCase();
    if (vin.length < 11) return;
    track('vin_decoder_usage', { surface: 'home_hero', mode: 'vin' });
    router.push(`/diagnose?mode=vin&vin=${encodeURIComponent(vin)}`);
  }

  function handleDiagnoseSubmit(e: FormEvent) {
    e.preventDefault();
    const query = symptom.trim();
    if (!query || !hasVehicle) return;
    track('diagnosis_start', {
      surface: 'home_hero',
      method: 'symptom',
      query_length: query.length,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
    });
    const q = encodeURIComponent(query);
    router.push(
      `/diagnose?q=${q}&year=${vehicle.year}&make=${vehicle.make}&model=${vehicle.model}`,
    );
  }

  function handleCodeSubmit(e: FormEvent) {
    e.preventDefault();
    const code = dtcCode.trim().toLowerCase();
    if (!code) return;
    track('diagnosis_start', { surface: 'home_hero', method: 'dtc' });
    if (hasVehicle) {
      router.push(
        `/codes/${code}?year=${vehicle.year}&make=${vehicle.make}&model=${vehicle.model}`,
      );
    } else {
      router.push(`/codes/${code}`);
    }
  }

  function openVehicleHub() {
    if (!vehicleHubUrl) return;
    track('vin_decoder_usage', {
      surface: 'home_vehicle_selector',
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
    });
    router.push(vehicleHubUrl);
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.16),transparent_42%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,transparent_85%,rgba(255,255,255,0.03))]" />
      </div>

      {/* ===== HERO: Vehicle ID first, then symptom ===== */}
      <section className="px-4 pb-14 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-7 sm:p-9 lg:p-12">
            <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Factory Service Data for{' '}
              <span className="text-cyan-300">Every Vehicle</span>
            </h1>
            <p className="mt-4 max-w-3xl text-base text-gray-300 sm:text-lg">
              1.4 million OEM repair procedures, 8,800+ DTC codes with component
              links, and AI-powered diagnostics grounded in real factory manuals.
            </p>

            {/* Step 1 — Identify Vehicle */}
            <div className="mt-8">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-200">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/20 text-xs text-cyan-300">
                  1
                </span>
                Identify your vehicle
              </p>

              {/* Tabs: YMM vs VIN */}
              <div className="mb-4 inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => setIdMode('ymm')}
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    idMode === 'ymm'
                      ? 'bg-cyan-400/15 text-cyan-200'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Car className="h-4 w-4" />
                  Year / Make / Model
                </button>
                <button
                  type="button"
                  onClick={() => setIdMode('vin')}
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    idMode === 'vin'
                      ? 'bg-cyan-400/15 text-cyan-200'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Keyboard className="h-4 w-4" />
                  VIN
                </button>
              </div>

              {idMode === 'ymm' ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <select
                    className={SELECT_CLASS}
                    value={vehicle.year}
                    onChange={(e) => {
                      startTransition(() => {
                        setVehicle({
                          year: e.target.value,
                          make: '',
                          model: '',
                        });
                        setAvailableModels([]);
                      });
                    }}
                  >
                    <option value="">Year</option>
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <select
                    className={SELECT_CLASS}
                    value={vehicle.make}
                    onChange={(e) => {
                      startTransition(() => {
                        setVehicle((prev) => ({
                          ...prev,
                          make: e.target.value,
                          model: '',
                        }));
                        setAvailableModels([]);
                      });
                    }}
                    disabled={!vehicle.year}
                  >
                    <option value="">Make</option>
                    {availableMakes.map((m) => (
                      <option key={m} value={m}>
                        {m.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <select
                    className={SELECT_CLASS}
                    value={vehicle.model}
                    onChange={(e) => {
                      startTransition(() => {
                        setVehicle((prev) => ({
                          ...prev,
                          model: e.target.value,
                        }));
                      });
                    }}
                    disabled={!vehicle.make || loadingModels}
                  >
                    <option value="">
                      {loadingModels ? 'Loading…' : 'Model'}
                    </option>
                    {availableModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <form
                  onSubmit={handleVinSubmit}
                  className="flex max-w-xl flex-col gap-3 sm:flex-row"
                >
                  <input
                    value={vinInput}
                    onChange={(e) => setVinInput(e.target.value)}
                    maxLength={17}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 font-mono text-sm uppercase tracking-wider text-gray-100 placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-500 focus:border-cyan-400 focus:outline-none"
                    placeholder="Enter 17-character VIN"
                    aria-label="Vehicle Identification Number"
                  />
                  <button
                    type="submit"
                    disabled={vinInput.trim().length < 11}
                    className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-black hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Decode VIN
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>

            {/* Step 2 — Symptom / DTC (only when vehicle known) */}
            <div
              className={`mt-6 transition-opacity duration-300 ${
                hasVehicle ? 'opacity-100' : 'pointer-events-none opacity-40'
              }`}
            >
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-200">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/20 text-xs text-cyan-300">
                  2
                </span>
                {hasVehicle
                  ? `What is ${vehicleLabel} doing?`
                  : 'What is your vehicle doing?'}
              </p>

              <form
                onSubmit={handleDiagnoseSubmit}
                className="flex max-w-2xl flex-col gap-3 sm:flex-row"
              >
                <input
                  value={symptom}
                  onChange={(e) => setSymptom(e.target.value)}
                  disabled={!hasVehicle}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-cyan-400 focus:outline-none disabled:cursor-not-allowed"
                  placeholder="Describe symptom, noise, warning light, or DTC code…"
                  aria-label="Describe your symptom"
                />
                <button
                  type="submit"
                  disabled={!hasVehicle || !symptom.trim()}
                  className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-black hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Diagnose
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {/* Quick DTC input inline */}
              <form
                onSubmit={handleCodeSubmit}
                className="mt-3 flex max-w-md flex-col gap-2 sm:flex-row"
              >
                <input
                  type="text"
                  placeholder="Or enter DTC code (e.g. P0300)"
                  value={dtcCode}
                  onChange={(e) => setDtcCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2.5 font-mono text-sm text-gray-100 placeholder:text-gray-500 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!dtcCode.trim()}
                  className="w-full rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-bold text-black hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Go
                </button>
              </form>
            </div>

            {/* Direct action chips */}
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <Link
                href="/codes"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2 text-gray-100 hover:border-cyan-400/40"
              >
                <Zap className="h-4 w-4 text-cyan-300" />
                Browse DTC Codes
              </Link>
              <Link
                href="/repair"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2 text-gray-100 hover:border-cyan-400/40"
              >
                <BookOpen className="h-4 w-4 text-cyan-300" />
                Repair Guides
              </Link>
              <Link
                href={vehicleHubUrl || '/repair'}
                className={`inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2 text-gray-100 hover:border-cyan-400/40 ${!hasVehicle ? 'pointer-events-none opacity-40' : ''}`}
              >
                <Wrench className="h-4 w-4 text-cyan-300" />
                {hasVehicle
                  ? `Open ${vehicleLabel} Hub`
                  : 'Open Vehicle Hub'}
              </Link>
            </div>

            <div className="mt-8 grid gap-2 text-xs text-cyan-100/90 sm:grid-cols-4">
              <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2">
                1.4M+ OEM Procedures
              </span>
              <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2">
                8,881 DTC Codes Linked
              </span>
              <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2">
                304K Vehicle Variants
              </span>
              <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2">
                AI Grounded in Factory Data
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LIVE DEMO ===== */}
      <section className="px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-slate-950/55 p-7 sm:p-9">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">
            See It In Action — No Signup Required
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold text-white">
            Live AI Demo
          </h2>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-gray-300">Vehicle: 2015 Toyota Camry</p>
              <p className="text-sm text-gray-300">
                Symptom: Check engine light, rough idle
              </p>
              <div className="mt-4 rounded-xl border border-cyan-400/30 bg-cyan-400/[0.08] p-4">
                <p className="font-semibold text-cyan-100">
                  Most likely: P0301 (Cylinder 1 Misfire)
                </p>
                <p className="mt-1 text-sm text-cyan-50">Probability: 78%</p>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-cyan-50">
                  <li>Check spark plug condition</li>
                  <li>Test ignition coil #1</li>
                  <li>Inspect fuel injector</li>
                </ol>
                <Link
                  href="/codes/p0301"
                  className="mt-4 inline-block text-sm font-semibold text-cyan-200 hover:text-cyan-100"
                >
                  View Full Guide →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="text-lg font-semibold text-white">
                Try with your car
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Select your year, make, and model above, then type a symptom to
                get factory-specific guidance.
              </p>
              {hasVehicle && (
                <button
                  type="button"
                  onClick={openVehicleHub}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-gray-100 hover:border-cyan-400/40"
                >
                  Open {vehicleLabel} Hub
                  <ArrowRight className="h-4 w-4 text-cyan-300" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== MOST SEARCHED GUIDES ===== */}
      <section className="px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-2xl font-bold text-white">
            Most Searched Guides
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {POPULAR_GUIDES.map((guide) => {
              const Icon = guide.icon;
              return (
                <Link
                  key={guide.href}
                  href={guide.href}
                  className="group rounded-2xl border border-white/10 bg-slate-900/45 p-5 transition-all hover:border-cyan-400/35 hover:bg-slate-900/65"
                  data-track-click={`{"event_name":"popular_guide_click","event_category":"content","label":"${guide.title}"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <Icon className="h-5 w-5 text-cyan-300" />
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-gray-400">
                      {guide.difficulty}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-white group-hover:text-cyan-200">
                    {guide.title}
                  </h3>
                  <p className="mt-2 text-xs text-gray-400">
                    Read time: {guide.readTime}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <ConversionZone
          vehicleLabel={hasVehicle ? vehicleLabel : 'your vehicle'}
          intentLabel="homepage"
        />
      </section>
    </div>
  );
}
