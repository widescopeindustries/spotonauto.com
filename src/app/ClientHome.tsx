'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, Battery, CircleDot, Cpu, Droplets, Lightbulb, Route, Search, Wrench } from 'lucide-react';
import { useT } from '@/lib/translations';
import { buildVehicleHubUrl } from '@/lib/vehicleIdentity';

const HolographicDashboard = dynamic(() => import('@/components/HolographicDashboard'), {
    ssr: false,
    loading: () => (
        <div className="space-y-4" aria-hidden="true">
            <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
            <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
            <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
            <div className="h-12 rounded-lg bg-cyan-500/20 animate-pulse" />
        </div>
    ),
});

const FALLBACK_PATHS = [
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
    {
        eyebrow: 'Not sure yet',
        title: 'Start with diagnosis',
        description: 'Use the diagnostic flow when you only know the symptom and need help narrowing the repair path first.',
        href: '/diagnose',
        cta: 'Run diagnosis',
        icon: Search,
    },
];

const HUB_SURFACES = [
    {
        label: 'Repair guides',
        href: '/repair',
        description: 'Vehicle-specific repair flows and related exact pages.',
    },
    {
        label: 'Wiring diagrams',
        href: '/wiring',
        description: 'Factory electrical diagrams and connector views.',
    },
    {
        label: 'Codes',
        href: '/codes',
        description: 'DTC pages linked back into symptoms and repairs.',
    },
    {
        label: 'Symptoms',
        href: '/symptoms',
        description: 'Plain-English complaint hubs for faster routing.',
    },
    {
        label: 'Parts',
        href: '/parts',
        description: 'Fitment and parts research before teardown.',
    },
    {
        label: 'Guide directory',
        href: '/guides',
        description: 'Browse by make, model, and repair intent.',
    },
];

const SEARCH_MOMENTUM_CLUSTERS = [
    {
        eyebrow: 'Lighting',
        title: 'Headlights and tail lights',
        description: 'Bulb and lamp jobs are one of the clearest DIY entry lanes, and they keep showing up in current search demand.',
        href: '/repairs/headlight-bulb-replacement',
        cta: 'Browse lighting guides',
        icon: Lightbulb,
        links: [
            { href: '/repair/2019/kia/optima/headlight-bulb-replacement', label: '2019 Kia Optima headlight replacement' },
            { href: '/repair/2015/subaru/outback/tail-light-replacement', label: '2015 Subaru Outback tail lights' },
            { href: '/repair/2006/kia/sorento/headlight-bulb-replacement', label: '2006 Kia Sorento headlight bulb replacement' },
        ],
    },
    {
        eyebrow: 'Battery',
        title: 'Battery and quick no-start wins',
        description: 'Battery jobs are still one of the fastest trust-building first repairs because owners can verify the part and finish the job in one sitting.',
        href: '/repairs/battery-replacement',
        cta: 'Browse battery guides',
        icon: Battery,
        links: [
            { href: '/repair/2013/toyota/corolla/battery-replacement', label: '2013 Toyota Corolla battery replacement' },
            { href: '/repair/2015/honda/odyssey/battery-replacement', label: '2015 Honda Odyssey battery replacement' },
            { href: '/repair/2020/toyota/tacoma/battery-replacement', label: '2020 Toyota Tacoma battery replacement' },
        ],
    },
    {
        eyebrow: 'Brakes',
        title: 'Pads, rotors, and basic brake service',
        description: 'Brake work is already showing up as a strong next-wave DIY lane, especially when the exact vehicle path makes parts, tools, and the first steps obvious.',
        href: '/repairs/brake-pad-replacement',
        cta: 'Browse brake guides',
        icon: CircleDot,
        links: [
            { href: '/repair/2017/ford/fusion/brake-pad-replacement', label: '2017 Ford Fusion brake pads' },
            { href: '/repair/2014/nissan/altima/brake-pad-replacement', label: '2014 Nissan Altima front brakes' },
            { href: '/repair/2018/toyota/camry/brake-pad-replacement', label: '2018 Toyota Camry brake pads' },
        ],
    },
    {
        eyebrow: 'Fluids',
        title: 'Oil, transmission fluid, and coolant',
        description: 'Fluid-intent searchers are usually ready to act if the spec, quantity, and refill path are obvious enough.',
        href: '/repairs/oil-change',
        cta: 'Browse fluid guides',
        icon: Droplets,
        links: [
            { href: '/repair/2010/chevrolet/traverse/oil-change', label: 'Chevy Traverse oil change' },
            { href: '/repair/2004/acura/tsx/transmission-fluid-change', label: '2004 Acura TSX transmission fluid' },
            { href: '/repairs/coolant-flush', label: 'Coolant flush guides by vehicle' },
        ],
    },
    {
        eyebrow: 'Filters',
        title: 'Filters and light maintenance',
        description: 'These jobs are low-risk, high-confidence wins that turn search traffic into repeat users and parts research.',
        href: '/repairs/cabin-air-filter-replacement',
        cta: 'Browse filter guides',
        icon: Wrench,
        links: [
            { href: '/repair/2020/toyota/tacoma/cabin-air-filter-replacement', label: '2020 Toyota Tacoma cabin air filter' },
            { href: '/repair/2010/honda/pilot/fuel-filter-replacement', label: 'Honda Pilot fuel filter' },
            { href: '/repair/2016/nissan/rogue/cabin-air-filter-replacement', label: '2016 Nissan Rogue cabin air filter' },
        ],
    },
];

const COMMAND_CENTER_MOMENTUM = [
    { year: '2014', make: 'Ford', model: 'Escape', note: 'Lights, brakes, cooling, and tune-up signals are stacking here.' },
    { year: '2016', make: 'Ford', model: 'Fusion', note: 'Headlights and brakes are surfacing together on one vehicle family.' },
    { year: '2016', make: 'Nissan', model: 'Rogue', note: 'Filters, brakes, and lights all have active exact-vehicle demand.' },
    { year: '2014', make: 'Nissan', model: 'Altima', note: 'Brake and lighting demand is repeating on the same hub.' },
    { year: '2018', make: 'Toyota', model: 'Camry', note: 'Headlights and brake work are both getting tested already.' },
    { year: '2016', make: 'Hyundai', model: 'Elantra', note: 'Lighting, brakes, and charging all showed up in the query mix.' },
];

function HeroSection() {
    const [selectedVehicle, setSelectedVehicle] = React.useState<{ year: string; make: string; model: string } | null>(null);
    const t = useT();
    const hasVehicleLock = Boolean(selectedVehicle?.year && selectedVehicle?.make && selectedVehicle?.model);
    const vehicleLabel = hasVehicleLock ? `${selectedVehicle!.year} ${selectedVehicle!.make} ${selectedVehicle!.model}` : null;
    const vehicleHubHref = hasVehicleLock
        ? buildVehicleHubUrl(selectedVehicle!.year, selectedVehicle!.make, selectedVehicle!.model)
        : '/repair';
    const wiringHref = hasVehicleLock
        ? `/wiring?${new URLSearchParams({
            year: selectedVehicle!.year,
            make: selectedVehicle!.make,
            model: selectedVehicle!.model,
        }).toString()}`
        : '/wiring';

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
                            <span className="font-body text-xs tracking-widest text-cyan-300 uppercase">
                                {t('status.aiOnline')}
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

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={vehicleHubHref}
                                className="inline-flex items-center justify-center gap-3 rounded-xl bg-cyan-400 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-black transition-all hover:bg-cyan-300"
                            >
                                {vehicleLabel ? `Open ${vehicleLabel}` : 'Open vehicle hub'}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href={wiringHref}
                                className="inline-flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-all hover:border-cyan-400/30 hover:text-cyan-100"
                            >
                                Wiring diagrams
                            </Link>
                        </div>

                        <div className="rounded-[28px] matte-panel-soft p-6">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">Inside the vehicle hub</p>
                                    <p className="mt-2 text-sm text-gray-400">Everything important for that exact year, make, and model stays grouped around one canonical node.</p>
                                </div>
                                {vehicleLabel && (
                                    <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                                        {vehicleLabel}
                                    </span>
                                )}
                            </div>
                            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {HUB_SURFACES.map((surface) => (
                                    <Link
                                        key={surface.label}
                                        href={surface.href}
                                        className="rounded-2xl border border-white/10 bg-slate-900/45 p-4 transition-all hover:border-cyan-500/30 hover:bg-slate-900/70"
                                    >
                                        <h3 className="text-base font-semibold text-white">{surface.label}</h3>
                                        <p className="mt-2 text-sm leading-6 text-gray-400">{surface.description}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="relative lg:pl-4">
                        <div className="rounded-[28px] matte-panel p-6 sm:p-8 glow-border">
                            <div className="mb-6">
                                <h2 className="font-display text-xl font-bold text-white">{t('hero.configPanel')}</h2>
                                <p className="mt-1 font-body text-sm text-gray-400">
                                    Pick the vehicle first. Add a symptom or task only if you want to jump deeper immediately.
                                </p>
                            </div>

                            <HolographicDashboard onVehicleChange={setSelectedVehicle} />
                        </div>
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
                            Other ways in
                        </span>
                        <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                            Keep the front door simple, but do not trap users who came with a different intent
                        </h2>
                        <p className="text-lg text-gray-300">
                            The primary path is vehicle first. These three routes stay visible for people who already know they need wiring,
                            a code page, or diagnosis before they know the exact repair.
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
                </div>
            </div>
        </section>
    );
}

function SearchMomentumSection() {
    return (
        <section className="px-4 pb-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="rounded-[32px] matte-panel p-8 sm:p-10">
                    <div className="mb-8 max-w-3xl space-y-4">
                        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                            Search momentum
                        </span>
                        <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                            Expand the DIY clusters that are already pulling people in
                        </h2>
                        <p className="text-lg text-gray-300">
                            These are the simpler jobs current search demand keeps circling: lighting, brakes, battery, fluids, and filters.
                            The goal is not more homepage noise. It is stronger paths into the exact guides and repair categories that are already earning trust.
                        </p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
                        {SEARCH_MOMENTUM_CLUSTERS.map((cluster) => {
                            const Icon = cluster.icon;

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

function CommandCenterMomentumSection() {
    return (
        <section className="px-4 pb-24 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="rounded-[32px] matte-panel p-8 sm:p-10">
                    <div className="mb-8 max-w-3xl space-y-4">
                        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                            Command centers gaining traction
                        </span>
                        <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                            Repeated year-make-model demand should flow into stronger exact vehicle hubs
                        </h2>
                        <p className="text-lg text-gray-300">
                            These exact vehicles are already showing repeated search intent across multiple tasks. Their command centers should be the clean handoff from discovery into wiring, repairs, specs, symptoms, and the next likely job.
                        </p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                        {COMMAND_CENTER_MOMENTUM.map((vehicle) => {
                            const href = buildVehicleHubUrl(vehicle.year, vehicle.make, vehicle.model);
                            const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

                            return (
                                <Link
                                    key={label}
                                    href={href}
                                    className="group rounded-[24px] matte-panel-soft p-6 transition-all hover:border-cyan-500/30 hover:bg-white/[0.035]"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-3">
                                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Exact vehicle hub</p>
                                            <h3 className="font-display text-2xl font-bold text-white">{label}</h3>
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

export default function ClientHome() {
    return (
        <div className="relative min-h-screen overflow-x-hidden matte-shell text-white">
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),transparent_14%,transparent_86%,rgba(255,255,255,0.025))]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
            </div>

            <div className="relative z-10">
                <HeroSection />
                <AlternateEntrySection />
                <SearchMomentumSection />
                <CommandCenterMomentumSection />
            </div>
        </div>
    );
}
