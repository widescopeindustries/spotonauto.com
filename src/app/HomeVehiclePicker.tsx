'use client';

import { startTransition, useEffect, useState } from 'react';
import Link from 'next/link';
import { Route, Search } from 'lucide-react';

import { trackEntryRouteClick } from '@/lib/analytics';
import { buildVehicleHubUrl } from '@/lib/vehicleIdentity';
import { fetchModels, getMakesForYear, getYears } from '@/services/vehicleData';

interface VehicleSelectionState {
    year: string;
    make: string;
    model: string;
}

export default function HomeVehiclePicker() {
    const [vehicle, setVehicle] = useState<VehicleSelectionState>({ year: '', make: '', model: '' });
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);

    const availableYears = getYears();
    const availableMakes = vehicle.year ? getMakesForYear(vehicle.year) : [];
    const hasVehicleLock = Boolean(vehicle.year && vehicle.make && vehicle.model);
    const vehicleLabel = hasVehicleLock ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : null;
    const vehicleHubHref = hasVehicleLock
        ? buildVehicleHubUrl(vehicle.year, vehicle.make, vehicle.model)
        : '/repair';
    const wiringHref = hasVehicleLock
        ? `/wiring?${new URLSearchParams({
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
        }).toString()}`
        : '/wiring';

    useEffect(() => {
        if (!vehicle.make || !vehicle.year) {
            setAvailableModels([]);
            return;
        }

        let cancelled = false;
        setLoadingModels(true);

        void fetchModels(vehicle.make, vehicle.year)
            .then((models) => {
                if (cancelled) return;
                setAvailableModels(models);
            })
            .catch(() => {
                if (cancelled) return;
                setAvailableModels([]);
            })
            .finally(() => {
                if (cancelled) return;
                setLoadingModels(false);
            });

        return () => {
            cancelled = true;
        };
    }, [vehicle.make, vehicle.year]);

    return (
        <div className="rounded-[28px] matte-panel p-6 sm:p-8 glow-border">
            <div className="mb-6">
                <h2 className="font-display text-xl font-bold text-white">What are you working on?</h2>
                <p className="mt-1 font-body text-sm text-gray-400">
                    Select your year, make, and model to find repair guides, specs, and wiring diagrams for your exact car.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="relative group">
                    <label htmlFor="home-year-select" className="sr-only">Select Year</label>
                    <select
                        id="home-year-select"
                        className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900/55 px-4 py-3 text-sm font-medium text-gray-200 shadow-lg transition-all hover:border-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        value={vehicle.year}
                        onChange={(event) => {
                            const year = event.target.value;
                            startTransition(() => {
                                setVehicle({ year, make: '', model: '' });
                                setAvailableModels([]);
                            });
                        }}
                    >
                        <option value="">Select Year</option>
                        {availableYears.map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-3.5 text-cyan-300 text-xs transition-colors group-hover:text-white">v</div>
                </div>

                <div className="relative group">
                    <label htmlFor="home-make-select" className="sr-only">Select Make</label>
                    <select
                        id="home-make-select"
                        className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900/55 px-4 py-3 text-sm font-medium text-gray-200 shadow-lg transition-all hover:border-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                        value={vehicle.make}
                        onChange={(event) => {
                            const make = event.target.value;
                            startTransition(() => {
                                setVehicle((current) => ({ ...current, make, model: '' }));
                                setAvailableModels([]);
                            });
                        }}
                        disabled={!vehicle.year}
                    >
                        <option value="">Select Make</option>
                        {availableMakes.map((make) => (
                            <option key={make} value={make}>{make.toUpperCase()}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-3.5 text-cyan-300 text-xs transition-colors group-hover:text-white">v</div>
                </div>

                <div className="relative group">
                    <label htmlFor="home-model-select" className="sr-only">Select Model</label>
                    <select
                        id="home-model-select"
                        className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900/55 px-4 py-3 text-sm font-medium text-gray-200 shadow-lg transition-all hover:border-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                        value={vehicle.model}
                        onChange={(event) => {
                            const model = event.target.value;
                            startTransition(() => {
                                setVehicle((current) => ({ ...current, model }));
                            });
                        }}
                        disabled={!vehicle.make || loadingModels}
                    >
                        <option value="">{loadingModels ? 'Loading models...' : 'Select Model'}</option>
                        {availableModels.map((model) => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-3.5 text-cyan-300 text-xs transition-colors group-hover:text-white">v</div>
                </div>
            </div>

            <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/85">Ready when you are</p>
                        <p className="mt-2 text-xs leading-5 text-gray-300">
                            {vehicleLabel
                                ? `${vehicleLabel} — open your car's page to see repair guides, DTC codes, wiring diagrams, and specs all in one place.`
                                : 'Select your year, make, and model to find everything for your car.'}
                        </p>
                    </div>
                    <Link
                        href={vehicleHubHref}
                        onClick={() => {
                            trackEntryRouteClick('home_dashboard', hasVehicleLock ? 'vehicle_hub' : 'repair', vehicleLabel || 'open vehicle hub');
                        }}
                        className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-black transition-all hover:bg-cyan-300"
                    >
                        {hasVehicleLock ? `Go` : 'Browse all repairs'}
                    </Link>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                        href={wiringHref}
                        onClick={() => {
                            trackEntryRouteClick('home_dashboard', 'wiring', vehicleLabel ? `${vehicleLabel} wiring` : 'wiring diagrams');
                        }}
                        className="rounded-full border border-white/10 bg-slate-900/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-gray-200 transition-all hover:border-cyan-400/35 hover:text-cyan-200"
                    >
                        <Route className="mr-1 inline h-3.5 w-3.5" />
                        Wiring diagrams
                    </Link>
                    <Link
                        href="/diagnose"
                        onClick={() => {
                            trackEntryRouteClick('home_dashboard', 'diagnose', vehicleLabel ? `${vehicleLabel} diagnose` : 'start diagnosis');
                        }}
                        className="rounded-full border border-white/10 bg-slate-900/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-gray-200 transition-all hover:border-cyan-400/35 hover:text-cyan-200"
                    >
                        <Search className="mr-1 inline h-3.5 w-3.5" />
                        Not sure? Search by symptom
                    </Link>
                </div>
            </div>
        </div>
    );
}
