import type { ComponentType } from 'react';
import Link from 'next/link';
import { ArrowRight, Battery, CircleDot, Cpu, Droplets, Lightbulb, Route, Search, Wrench } from 'lucide-react';

import HomeVehiclePicker from './HomeVehiclePicker';

const FALLBACK_PATHS = [
    {
        eyebrow: 'Need help first',
        title: 'Start with diagnosis',
        description: 'Use the diagnostic flow when you only know the symptom and need help narrowing the repair path first.',
        href: '/diagnose',
        cta: 'Run diagnosis',
        icon: Search,
    },
    {
        eyebrow: 'Have a code',
        title: 'Open OBD2 code pages',
        description: 'If the warning light already gave you a code, go straight into the code library and its repair paths.',
        href: '/codes',
        cta: 'Browse codes',
        icon: Cpu,
    },
    {
        eyebrow: 'Need wiring now',
        title: 'Open wiring diagrams',
        description: 'Jump directly into the factory wiring library when electrical work is the reason you came.',
        href: '/wiring',
        cta: 'Browse wiring',
        icon: Route,
    },
];

const DIAGNOSIS_QUICK_STARTS = [
    { label: 'Car won\'t start', task: 'car won\'t start' },
    { label: 'Check engine light', task: 'check engine light on' },
    { label: 'Squeaky brakes', task: 'squeaky brakes' },
    { label: 'Battery light', task: 'battery light on' },
    { label: 'Overheating', task: 'overheating' },
    { label: 'AC not cold', task: 'AC not cold' },
];

interface MomentumClusterCard {
    cluster: string;
    eyebrow: string;
    title: string;
    description: string;
    href: string;
    cta: string;
    queries: number;
    impressions: number;
    links: Array<{ href: string; label: string }>;
}

interface CommandCenterMomentumCard {
    year: string;
    make: string;
    model: string;
    label: string;
    note: string;
    href: string;
    score: number;
}

interface ClientHomeProps {
    momentumClusters: MomentumClusterCard[];
    commandCenterMomentum: CommandCenterMomentumCard[];
}

const CLUSTER_ICONS: Record<string, ComponentType<{ className?: string }>> = {
    lighting: Lightbulb,
    battery: Battery,
    brakes: CircleDot,
    oil_fluids: Droplets,
    filters: Wrench,
    belts_cooling: Route,
    starting_charging: Battery,
    ignition_tuneup: Wrench,
};

function HeroSection() {
    return (
        <section className="relative px-4 pb-16 pt-24 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,212,255,0.12),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_16%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/35 to-transparent" />
            <div className="absolute left-[-4rem] top-28 h-72 w-72 rounded-full bg-cyan-500/10 blur-[140px]" />
            <div className="absolute bottom-12 right-[-4rem] h-80 w-80 rounded-full bg-cyan-500/8 blur-[180px]" />

            <div className="relative z-10 mx-auto max-w-7xl">
                <div className="grid items-start gap-12 lg:grid-cols-[0.92fr,1.08fr] lg:gap-16">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 rounded-full matte-panel-soft px-4 py-2">
                            <span className="status-dot" />
                            <span className="font-body text-xs uppercase tracking-widest text-cyan-300">
                                Vehicle-first repair routing
                            </span>
                        </div>

                        <div className="space-y-5">
                            <h1 className="font-display text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                                Start with your
                                <br />
                                <span className="bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent glow-text">
                                    exact vehicle
                                </span>
                            </h1>
                            <p className="max-w-2xl font-body text-lg text-gray-300 sm:text-xl">
                                Pick year, make, and model. From there, the exact vehicle hub becomes the front door to repair guides,
                                wiring diagrams, codes, symptoms, manuals, specs, and parts for that car.
                            </p>
                        </div>

                        <div className="rounded-[28px] matte-panel-soft p-6">
                            <div className="space-y-3">
                                <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">Why this route is faster</p>
                                <p className="text-sm leading-7 text-gray-400">
                                    The homepage now keeps the first interaction path focused on year, make, and model. VIN decode,
                                    symptom-first diagnosis, and deeper AI flows still exist, but they no longer sit inside the first
                                    above-the-fold client bundle.
                                </p>
                            </div>
                            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-4">
                                    <h3 className="text-base font-semibold text-white">Vehicle hub</h3>
                                    <p className="mt-2 text-sm leading-6 text-gray-400">Open repairs, symptoms, tools, and related support pages for that exact car.</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-4">
                                    <h3 className="text-base font-semibold text-white">Diagnosis</h3>
                                    <p className="mt-2 text-sm leading-6 text-gray-400">Use the chat flow when the symptom is still vague or you only have a complaint.</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-4">
                                    <h3 className="text-base font-semibold text-white">Wiring</h3>
                                    <p className="mt-2 text-sm leading-6 text-gray-400">Jump straight to electrical diagrams when the job is already known to be circuit-related.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative lg:pl-4">
                        <HomeVehiclePicker />
                    </div>
                </div>
            </div>
        </section>
    );
}

function AlternateEntrySection() {
    return (
        <section className="px-4 pb-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="rounded-[32px] matte-panel p-8 sm:p-10">
                    <div className="mb-8 max-w-3xl space-y-4">
                        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                            Need a different starting point?
                        </span>
                        <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                            Start with diagnosis, a code, or wiring when that is what you already know
                        </h2>
                        <p className="text-lg text-gray-300">
                            Not every visit starts with an exact repair. These routes help when you already have a trouble code,
                            need wiring diagrams, or want help narrowing the problem before opening a guide.
                        </p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                        {FALLBACK_PATHS.map((path) => {
                            const Icon = path.icon;

                            return (
                                <Link
                                    key={path.title}
                                    href={path.href}
                                    className="group rounded-[24px] matte-panel-soft p-6 transition-all hover:border-cyan-500/30 hover:bg-white/[0.035]"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-3">
                                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">{path.eyebrow}</p>
                                            <h3 className="font-display text-2xl font-bold text-white">{path.title}</h3>
                                            <p className="text-sm leading-6 text-gray-400">{path.description}</p>
                                        </div>
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                    </div>

                                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100">
                                        {path.cta}
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="mt-8 rounded-[24px] matte-panel-soft p-6">
                        <div className="max-w-3xl space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Common starting points</p>
                            <h3 className="font-display text-2xl font-bold text-white">If you only know the symptom, start here</h3>
                            <p className="text-sm leading-6 text-gray-400">
                                These quick starts open diagnosis with the symptom already filled in, so you can add the vehicle on the next screen and keep moving.
                            </p>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                            {DIAGNOSIS_QUICK_STARTS.map((quickStart) => (
                                <Link
                                    key={quickStart.task}
                                    href={{ pathname: '/diagnose', query: { task: quickStart.task } }}
                                    className="rounded-full border border-white/10 bg-slate-900/50 px-4 py-2 text-sm text-gray-200 transition-all hover:border-cyan-400/35 hover:bg-slate-900/70 hover:text-cyan-100"
                                >
                                    {quickStart.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function SearchMomentumSection({ momentumClusters }: { momentumClusters: MomentumClusterCard[] }) {
    return (
        <section className="px-4 pb-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="rounded-[32px] matte-panel p-8 sm:p-10">
                    <div className="mb-8 max-w-3xl space-y-4">
                        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                            Popular DIY repairs
                        </span>
                        <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                            Start with the repairs drivers handle most often
                        </h2>
                        <p className="text-lg text-gray-300">
                            These are common jobs many owners can usually do themselves: lights, brakes, batteries, fluids, and filters.
                            Open an exact guide to get the right parts, specs, and next steps for your vehicle.
                        </p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
                        {momentumClusters.map((cluster) => {
                            const Icon = CLUSTER_ICONS[cluster.cluster] || Wrench;

                            return (
                                <div
                                    key={cluster.title}
                                    className="rounded-[24px] matte-panel-soft p-6"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-3">
                                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">{cluster.eyebrow}</p>
                                            <h3 className="font-display text-2xl font-bold text-white">{cluster.title}</h3>
                                            <p className="text-sm leading-6 text-gray-400">{cluster.description}</p>
                                        </div>
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-2">
                                        {cluster.links.map((link) => (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                className="block rounded-2xl border border-white/10 bg-slate-900/45 px-4 py-3 text-sm text-gray-200 transition-all hover:border-cyan-500/30 hover:bg-slate-900/70 hover:text-cyan-100"
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>

                                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100">
                                        <Link href={cluster.href} className="inline-flex items-center gap-2">
                                            {cluster.cta}
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}

function CommandCenterMomentumSection({ commandCenterMomentum }: { commandCenterMomentum: CommandCenterMomentumCard[] }) {
    return (
        <section className="px-4 pb-24 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="rounded-[32px] matte-panel p-8 sm:p-10">
                    <div className="mb-8 max-w-3xl space-y-4">
                        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                            Popular vehicle hubs
                        </span>
                        <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                            Start from an exact vehicle hub when you already know the car
                        </h2>
                        <p className="text-lg text-gray-300">
                            These exact vehicle hubs make it easier to move from the car you own into the right repair guide, wiring page, symptom path, or code page without starting over.
                        </p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                        {commandCenterMomentum.map((vehicle) => {
                            return (
                                <Link
                                    key={vehicle.href}
                                    href={vehicle.href}
                                    className="group rounded-[24px] matte-panel-soft p-6 transition-all hover:border-cyan-500/30 hover:bg-white/[0.035]"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-3">
                                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Exact vehicle hub</p>
                                            <h3 className="font-display text-2xl font-bold text-white">{vehicle.label}</h3>
                                            <p className="text-sm leading-6 text-gray-400">{vehicle.note}</p>
                                        </div>
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>

                                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100">
                                        Open command center
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function ClientHome({ momentumClusters, commandCenterMomentum }: ClientHomeProps) {
    return (
        <div className="relative min-h-screen overflow-x-hidden matte-shell text-white">
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),transparent_14%,transparent_86%,rgba(255,255,255,0.025))]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
            </div>

            <div className="relative z-10">
                <HeroSection />
                <AlternateEntrySection />
                <SearchMomentumSection momentumClusters={momentumClusters} />
                <CommandCenterMomentumSection commandCenterMomentum={commandCenterMomentum} />
            </div>
        </div>
    );
}
