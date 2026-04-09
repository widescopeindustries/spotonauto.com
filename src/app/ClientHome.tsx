'use client';

import { startTransition, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Activity,
    ArrowRight,
    BookOpen,
    Battery,
    Car,
    CircleDot,
    Cog,
    Droplets,
    Hash,
    Lightbulb,
    MessageCircle,
    RotateCcw,
    Route,
    Thermometer,
    Wrench,
    Zap,
} from 'lucide-react';

import { fetchModels, getMakesForYear, getYears } from '@/services/vehicleData';
import { buildVehicleHubUrl } from '@/lib/vehicleIdentity';

const VEHICLE_SYSTEMS = [
    { label: 'Engine', icon: Cog },
    { label: 'Brakes', icon: CircleDot },
    { label: 'Electrical', icon: Zap },
    { label: 'Suspension', icon: Activity },
    { label: 'Cooling', icon: Thermometer },
    { label: 'Transmission', icon: RotateCcw },
    { label: 'Body', icon: Car },
    { label: 'Fluids', icon: Droplets },
];

const POPULAR_REPAIRS = [
    { label: 'Brake Pads', href: '/repairs/brake-pad-replacement', icon: CircleDot },
    { label: 'Oil Change', href: '/repairs/oil-change', icon: Droplets },
    { label: 'Battery', href: '/repairs/battery-replacement', icon: Battery },
    { label: 'Spark Plugs', href: '/repairs/spark-plug-replacement', icon: Zap },
    { label: 'Headlight', href: '/repairs/headlight-replacement', icon: Lightbulb },
    { label: 'Serpentine Belt', href: '/repairs/serpentine-belt-replacement', icon: Route },
    { label: 'Alternator', href: '/repairs/alternator-replacement', icon: Battery },
    { label: 'Thermostat', href: '/repairs/thermostat-replacement', icon: Thermometer },
];

const SELECT_CLASS =
    'w-full appearance-none rounded-lg border border-slate-700 bg-slate-900/55 px-4 py-3 text-sm font-medium text-gray-200 shadow-lg transition-all hover:border-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50';

export default function ClientHome() {
    const router = useRouter();
    const [lane2Open, setLane2Open] = useState(false);
    const [vehicle, setVehicle] = useState({ year: '', make: '', model: '' });
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [dtcCode, setDtcCode] = useState('');

    const availableYears = getYears();
    const availableMakes = vehicle.year ? getMakesForYear(vehicle.year) : [];
    const hasVehicle = Boolean(vehicle.year && vehicle.make && vehicle.model);
    const vehicleLabel = hasVehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : '';
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

    function handleCodeSubmit(e: FormEvent) {
        e.preventDefault();
        const code = dtcCode.trim().toLowerCase();
        if (code) {
            router.push(`/codes/${code}`);
        }
    }

    return (
        <div className="relative min-h-screen overflow-x-hidden text-white">
            {/* Background */}
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),transparent_14%,transparent_86%,rgba(255,255,255,0.025))]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
            </div>

            <div className="relative z-10">
                {/* Hero */}
                <section className="relative px-4 pt-24 pb-14 sm:px-6 lg:px-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,212,255,0.10),transparent_40%)]" />
                    <div className="absolute left-[-4rem] top-20 h-72 w-72 rounded-full bg-cyan-500/8 blur-[140px]" />
                    <div className="absolute right-[-4rem] top-32 h-64 w-64 rounded-full bg-cyan-500/6 blur-[160px]" />
                    <div className="relative mx-auto max-w-4xl text-center">
                        <h1 className="font-display text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                            What&apos;s going on with{' '}
                            <span className="bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent">
                                your car?
                            </span>
                        </h1>
                    </div>
                </section>

                {/* 3 Lanes */}
                <section className="px-4 pb-20 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl grid gap-6 lg:grid-cols-3 lg:items-start">

                        {/* Lane 1: Not sure what's wrong */}
                        <Link
                            href="/diagnose"
                            className="group flex flex-col rounded-3xl border border-white/10 bg-slate-900/50 p-8 transition-all hover:border-cyan-500/30 hover:bg-white/[0.04]"
                        >
                            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                                <MessageCircle className="h-8 w-8" />
                            </div>
                            <h2 className="font-display text-2xl font-bold text-white mb-3">
                                I&apos;m not sure what&apos;s wrong
                            </h2>
                            <p className="text-gray-400 leading-relaxed mb-6">
                                Describe what&apos;s happening and our AI will help you figure it out
                            </p>
                            <div className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 group-hover:text-cyan-200">
                                Start diagnosis
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>

                        {/* Lane 2: Know what needs fixing */}
                        <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-8 transition-all">
                            {!lane2Open ? (
                                <button
                                    type="button"
                                    onClick={() => setLane2Open(true)}
                                    className="flex w-full flex-col text-left group"
                                >
                                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                                        <Wrench className="h-8 w-8" />
                                    </div>
                                    <h2 className="font-display text-2xl font-bold text-white mb-3">
                                        I know what needs fixing
                                    </h2>
                                    <p className="text-gray-400 leading-relaxed mb-6">
                                        Pick your vehicle and find the exact repair guide, wiring diagram, or manual
                                    </p>
                                    <div className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 group-hover:text-cyan-200">
                                        Pick your vehicle
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </button>
                            ) : (
                                <div>
                                    <div className="mb-5 flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
                                            <Wrench className="h-5 w-5" />
                                        </div>
                                        <h2 className="font-display text-xl font-bold text-white">
                                            Pick your vehicle
                                        </h2>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="relative">
                                            <label htmlFor="lane2-year" className="sr-only">Year</label>
                                            <select
                                                id="lane2-year"
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
                                        </div>

                                        <div className="relative">
                                            <label htmlFor="lane2-make" className="sr-only">Make</label>
                                            <select
                                                id="lane2-make"
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
                                                    <option key={m} value={m}>{m.toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="relative">
                                            <label htmlFor="lane2-model" className="sr-only">Model</label>
                                            <select
                                                id="lane2-model"
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
                                                    {loadingModels ? 'Loading...' : 'Model'}
                                                </option>
                                                {availableModels.map((m) => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {hasVehicle && (
                                        <div className="mt-6">
                                            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300 mb-3">
                                                {vehicleLabel}
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {VEHICLE_SYSTEMS.map((sys) => {
                                                    const Icon = sys.icon;
                                                    return (
                                                        <Link
                                                            key={sys.label}
                                                            href={vehicleHubUrl}
                                                            className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/45 px-3 py-2.5 text-sm text-gray-200 transition-all hover:border-cyan-500/30 hover:text-cyan-100"
                                                        >
                                                            <Icon className="h-4 w-4 shrink-0 text-cyan-400" />
                                                            {sys.label}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                                <Link
                                                    href={vehicleHubUrl}
                                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold uppercase tracking-wide text-black transition-all hover:bg-cyan-300"
                                                >
                                                    Open {vehicleLabel}
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                                <Link
                                                    href="/manual-navigator"
                                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/55 px-5 py-3 text-sm font-bold uppercase tracking-wide text-gray-100 transition-all hover:border-cyan-500/30 hover:text-cyan-100"
                                                >
                                                    Open Manual Navigator
                                                    <BookOpen className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Lane 3: Have a code */}
                        <div className="flex flex-col rounded-3xl border border-white/10 bg-slate-900/50 p-8">
                            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                                <Hash className="h-8 w-8" />
                            </div>
                            <h2 className="font-display text-2xl font-bold text-white mb-3">
                                I have a code
                            </h2>
                            <p className="text-gray-400 leading-relaxed mb-6">
                                Look up any OBD-II diagnostic trouble code
                            </p>
                            <form onSubmit={handleCodeSubmit} className="mt-auto flex gap-2">
                                <input
                                    type="text"
                                    placeholder="P0420"
                                    value={dtcCode}
                                    onChange={(e) => setDtcCode(e.target.value)}
                                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900/55 px-4 py-3 font-mono text-sm font-medium text-gray-200 placeholder:text-gray-500 shadow-lg transition-all hover:border-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                                />
                                <button
                                    type="submit"
                                    disabled={!dtcCode.trim()}
                                    className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-bold text-black transition-all hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Look Up
                                </button>
                            </form>
                        </div>

                    </div>
                </section>

                {/* Popular right now */}
                <section className="px-4 pb-16 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <h2 className="font-display text-2xl font-bold text-white mb-6">
                            Popular right now
                        </h2>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {POPULAR_REPAIRS.map((repair) => {
                                const Icon = repair.icon;
                                return (
                                    <Link
                                        key={repair.href}
                                        href={repair.href}
                                        className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-4 text-sm text-gray-200 transition-all hover:border-cyan-500/30 hover:text-cyan-100"
                                    >
                                        <Icon className="h-5 w-5 shrink-0 text-cyan-400" />
                                        {repair.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Archive and wiring callouts */}
                <section className="px-4 pb-24 sm:px-6 lg:px-8">
                    <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2">
                        <Link
                            href="/manual"
                            className="group flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 transition-all hover:border-cyan-500/30 hover:bg-white/[0.03]"
                        >
                            <div>
                                <h3 className="font-display text-lg font-bold text-white mb-2">
                                    Browse the factory manual archive
                                </h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Navigate manual coverage by make, year, vehicle, and section across the 1982&ndash;2013 archive.
                                </p>
                            </div>
                            <BookOpen className="h-5 w-5 shrink-0 text-cyan-300 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link
                            href="/wiring"
                            className="group flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 transition-all hover:border-cyan-500/30 hover:bg-white/[0.03]"
                        >
                            <div>
                                <h3 className="font-display text-lg font-bold text-white mb-2">
                                    Need wiring diagrams?
                                </h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    We have 148,000+ factory electrical diagrams for vehicles from 1982&ndash;2013.
                                </p>
                            </div>
                            <ArrowRight className="h-5 w-5 shrink-0 text-cyan-300 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
