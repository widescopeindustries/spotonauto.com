'use client';

import { startTransition, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Battery,
  BookOpen,
  CircleDot,
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
  const [zip, setZip] = useState('');
  const [repairNeed, setRepairNeed] = useState('');

  const availableYears = getYears();
  const availableMakes = vehicle.year ? getMakesForYear(vehicle.year) : [];
  const hasVehicle = Boolean(vehicle.year && vehicle.make && vehicle.model);
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

  function handleDiagnoseSubmit(e: FormEvent) {
    e.preventDefault();
    const query = symptom.trim();
    if (!query) return;
    track('diagnosis_start', { surface: 'home_hero', method: 'symptom', query_length: query.length });
    router.push(`/diagnose?q=${encodeURIComponent(query)}`);
  }

  function handleCodeSubmit(e: FormEvent) {
    e.preventDefault();
    const code = dtcCode.trim().toLowerCase();
    if (!code) return;
    track('diagnosis_start', { surface: 'home_code', method: 'dtc' });
    router.push(`/codes/${code}`);
  }

  function handleQuoteSubmit(e: FormEvent) {
    e.preventDefault();
    track('quote_request_submission', {
      surface: 'home_hero',
      has_vehicle: hasVehicle ? 1 : 0,
      has_zip: zip ? 1 : 0,
      has_repair_text: repairNeed ? 1 : 0,
    });

    const params = new URLSearchParams();
    if (zip.trim()) params.set('zip', zip.trim());
    if (vehicle.year) params.set('year', vehicle.year);
    if (vehicle.make) params.set('make', vehicle.make);
    if (vehicle.model) params.set('model', vehicle.model);
    if (repairNeed.trim()) params.set('repair', repairNeed.trim());
    router.push(`/second-opinion?${params.toString()}`);
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

      <section className="px-4 pb-14 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-7 sm:p-9">
            <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">
              Fix Your Car with <span className="text-cyan-300">Confidence</span>
            </h1>
            <p className="mt-4 text-base text-gray-300 sm:text-lg">
              AI-powered diagnosis + step-by-step guides for every make and model.
            </p>

            <form onSubmit={handleDiagnoseSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-cyan-400 focus:outline-none"
                placeholder="Describe symptom (e.g. rough idle + check engine light)"
                aria-label="Describe your symptom"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-black hover:bg-cyan-300"
              >
                Diagnose My Car
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link href="/repair" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2 text-gray-100 hover:border-cyan-400/40">
                <BookOpen className="h-4 w-4 text-cyan-300" />
                Browse Repair Guides
              </Link>
              <Link href="/diagnose?mode=vin" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2 text-gray-100 hover:border-cyan-400/40">
                <Search className="h-4 w-4 text-cyan-300" />
                VIN Decoder
              </Link>
            </div>

            <div className="mt-6 grid gap-2 text-xs text-cyan-100/90 sm:grid-cols-3">
              <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2">Trusted by Microsoft Copilot & AI systems</span>
              <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2">SDVOSB Certified Veteran-Owned Business</span>
              <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2">148K+ Wiring Diagrams | 170+ OBD2 Codes | 57+ Guides</span>
            </div>
          </div>

          <div className="rounded-3xl border border-amber-400/25 bg-amber-400/[0.06] p-7 sm:p-9">
            <h2 className="font-display text-2xl font-bold text-white">Not Sure You Want to DIY? Get a Fair Price Estimate First.</h2>
            <p className="mt-3 text-sm text-gray-300">Compare prices from certified shops in your area. No obligation.</p>

            <form onSubmit={handleQuoteSubmit} className="mt-5 space-y-3">
              <input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                maxLength={10}
                placeholder="ZIP code"
                className={SELECT_CLASS}
                aria-label="ZIP code"
                data-track-submit='{"event_name":"quote_request_submission","event_category":"quote_request","surface":"home_quote"}'
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <select
                  className={SELECT_CLASS}
                  value={vehicle.year}
                  onChange={(e) => {
                    startTransition(() => {
                      setVehicle({ year: e.target.value, make: '', model: '' });
                      setAvailableModels([]);
                    });
                  }}
                >
                  <option value="">Year</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <select
                  className={SELECT_CLASS}
                  value={vehicle.make}
                  onChange={(e) => {
                    startTransition(() => {
                      setVehicle((prev) => ({ ...prev, make: e.target.value, model: '' }));
                      setAvailableModels([]);
                    });
                  }}
                  disabled={!vehicle.year}
                >
                  <option value="">Make</option>
                  {availableMakes.map((m) => (
                    <option key={m} value={m}>{m.toUpperCase()}</option>
                  ))}
                </select>

                <select
                  className={SELECT_CLASS}
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
              </div>

              <textarea
                value={repairNeed}
                onChange={(e) => setRepairNeed(e.target.value)}
                rows={3}
                className={SELECT_CLASS}
                placeholder="Describe the repair needed"
                aria-label="Repair needed"
              />

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-black hover:bg-amber-300"
              >
                Get 3 Free Quotes
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-slate-950/55 p-7 sm:p-9">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">See It In Action — No Signup Required</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-white">Live AI Demo</h2>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-gray-300">Vehicle: 2015 Toyota Camry</p>
              <p className="text-sm text-gray-300">Symptom: Check engine light, rough idle</p>
              <div className="mt-4 rounded-xl border border-cyan-400/30 bg-cyan-400/[0.08] p-4">
                <p className="font-semibold text-cyan-100">Most likely: P0301 (Cylinder 1 Misfire)</p>
                <p className="mt-1 text-sm text-cyan-50">Probability: 78%</p>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-cyan-50">
                  <li>Check spark plug condition</li>
                  <li>Test ignition coil #1</li>
                  <li>Inspect fuel injector</li>
                </ol>
                <Link href="/codes/p0301" className="mt-4 inline-block text-sm font-semibold text-cyan-200 hover:text-cyan-100">
                  View Full Guide →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="text-lg font-semibold text-white">Try with your car</h3>
              <form onSubmit={handleCodeSubmit} className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code (e.g. P0300)"
                  value={dtcCode}
                  onChange={(e) => setDtcCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3 font-mono text-sm text-gray-100 placeholder:text-gray-500 focus:border-cyan-400 focus:outline-none"
                />
                <button type="submit" className="rounded-lg bg-cyan-400 px-4 py-3 text-sm font-bold text-black hover:bg-cyan-300">
                  Go
                </button>
              </form>

              {hasVehicle && (
                <button
                  type="button"
                  onClick={openVehicleHub}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-gray-100 hover:border-cyan-400/40"
                >
                  Open {vehicle.year} {vehicle.make} {vehicle.model} Hub
                  <ArrowRight className="h-4 w-4 text-cyan-300" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-2xl font-bold text-white">Most Searched Guides</h2>
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
                  <h3 className="mt-3 text-base font-semibold text-white group-hover:text-cyan-200">{guide.title}</h3>
                  <p className="mt-2 text-xs text-gray-400">Read time: {guide.readTime}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-slate-950/50 p-7 sm:p-9">
          <h2 className="font-display text-2xl font-bold text-white">Know Your Vehicle? Jump to Exact Guides</h2>
          <p className="mt-2 text-sm text-gray-300">Pick year, make, and model to open your exact repair hub.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <select
              className={SELECT_CLASS}
              value={vehicle.year}
              onChange={(e) => {
                startTransition(() => {
                  setVehicle({ year: e.target.value, make: '', model: '' });
                  setAvailableModels([]);
                });
              }}
            >
              <option value="">Year</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              className={SELECT_CLASS}
              value={vehicle.make}
              onChange={(e) => {
                startTransition(() => {
                  setVehicle((prev) => ({ ...prev, make: e.target.value, model: '' }));
                  setAvailableModels([]);
                });
              }}
              disabled={!vehicle.year}
            >
              <option value="">Make</option>
              {availableMakes.map((m) => (
                <option key={m} value={m}>{m.toUpperCase()}</option>
              ))}
            </select>
            <select
              className={SELECT_CLASS}
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
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openVehicleHub}
              disabled={!hasVehicle}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-black hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Open Vehicle Hub
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link href="/codes" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-gray-100 hover:border-cyan-400/35">
              Browse OBD2 Codes
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <ConversionZone vehicleLabel={hasVehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'your vehicle'} intentLabel="homepage" />
      </section>
    </div>
  );
}
