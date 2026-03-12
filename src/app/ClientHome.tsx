'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Search, ShieldCheck, Wrench } from 'lucide-react';
import PopularGuidesSection from '@/components/PopularGuidesSection';
import HomeRepairClusters from '@/components/HomeRepairClusters';
import AdUnit from '@/components/AdUnit';
import DeferredRender from '@/components/DeferredRender';
import { useT } from '@/lib/translations';

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
const FeaturesSection = dynamic(() => import('@/components/FeaturesSection'));
const TestimonialsSection = dynamic(() => import('@/components/TestimonialsSection'));
const CTASection = dynamic(() => import('@/components/CTASection'));

const START_PATHS = [
    {
        step: '01',
        eyebrow: 'Symptom first',
        title: 'Diagnose the problem',
        description: 'Start here when the car is acting up and you need the likely repair before buying parts or opening the guide.',
        href: '/diagnose',
        cta: 'Start diagnosis',
        icon: Search,
    },
    {
        step: '02',
        eyebrow: 'Repair first',
        title: 'Open the exact guide',
        description: 'Jump into year-make-model instructions when you already know the job and just need clean steps.',
        href: '/guides',
        cta: 'Browse repair guides',
        icon: Wrench,
    },
    {
        step: '03',
        eyebrow: 'Parts first',
        title: 'Compare parts before teardown',
        description: 'Check the likely parts up front so you do not get halfway through the job and stall out on fitment.',
        href: '/parts',
        cta: 'Compare parts',
        icon: ShieldCheck,
    },
];

const HERO_SIGNALS = [
    'Free to use',
    'Vehicle-specific repair paths',
    'Matte black, blue, and white',
];

const HeroSection = () => {
    const [selectedVehicle, setSelectedVehicle] = React.useState<{ year: string; make: string; model: string } | null>(null);
    const t = useT();

    return (
        <section id="hero" className="relative flex min-h-screen items-center overflow-hidden px-4 pb-20 pt-24 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,212,255,0.12),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_16%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/35 to-transparent" />
            <div className="absolute left-[-4rem] top-28 h-72 w-72 rounded-full bg-cyan-500/10 blur-[140px]" />
            <div className="absolute bottom-12 right-[-4rem] h-80 w-80 rounded-full bg-cyan-500/8 blur-[180px]" />

            <div className="relative z-10 mx-auto w-full max-w-7xl">
                <div className="grid items-center gap-14 lg:grid-cols-[1fr,0.95fr] lg:gap-16">
                    <div className="space-y-7">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-flex items-center gap-2 rounded-full matte-panel-soft px-4 py-2 animate-scale-in">
                                <span className="status-dot" />
                                <span className="font-body text-xs tracking-widest text-cyan-300 uppercase">
                                    {t('status.aiOnline')}
                                </span>
                            </div>

                            <span
                                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide"
                                style={{
                                    backgroundColor: 'rgba(212, 160, 23, 0.08)',
                                    borderColor: 'rgba(212, 160, 23, 0.25)',
                                    color: '#F4CF63',
                                }}
                            >
                                SDVOSB Certified
                            </span>
                        </div>

                        <div className="space-y-5">
                            <h1 className="font-display font-black text-4xl leading-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                                <span className="text-white">{t('hero.silenceThe')}</span>
                                <br />
                                <span className="bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent glow-text">
                                    {t('hero.checkEngine')}
                                </span>
                                <br />
                                <span className="text-white">{t('hero.light')}</span>
                            </h1>

                            <p className="max-w-2xl font-body text-lg text-gray-300 sm:text-xl">
                                {t('hero.subtitle')}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/diagnose"
                                className="inline-flex items-center justify-center gap-3 rounded-xl bg-cyan-400 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-black transition-all hover:bg-cyan-300"
                            >
                                Start diagnosis
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/guides"
                                className="inline-flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-all hover:border-cyan-400/30 hover:text-cyan-100"
                            >
                                Browse repair guides
                            </Link>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            {HERO_SIGNALS.map((item) => (
                                <div key={item} className="rounded-2xl matte-panel-soft px-4 py-4 text-sm font-medium text-gray-200">
                                    {item}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 border border-white/10">
                                <CheckCircle2 className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-body text-sm text-cyan-100">
                                {t('hero.aiPowered')} &middot; <span className="font-bold text-white">{t('hero.factoryData')}</span> &middot; {t('hero.free')}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="font-body text-xs uppercase tracking-[0.28em] text-gray-500">
                                Popular fixes right now
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/repair/2013/bmw/x3/battery-replacement"
                                    className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition-all hover:border-cyan-400 hover:bg-cyan-500/15"
                                >
                                    BMW X3 battery replacement
                                </Link>
                                <Link
                                    href="/repair/2009/bmw/x5/serpentine-belt-replacement"
                                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-gray-200 transition-all hover:border-cyan-500/30 hover:text-cyan-100"
                                >
                                    BMW X5 serpentine belt diagram
                                </Link>
                                <Link
                                    href="/repair/2013/honda/odyssey/alternator-replacement"
                                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-gray-200 transition-all hover:border-cyan-500/30 hover:text-cyan-100"
                                >
                                    Honda Odyssey alternator replacement
                                </Link>
                                <Link
                                    href="/parts"
                                    className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-cyan-100 transition-all hover:border-cyan-400 hover:bg-cyan-500/10"
                                >
                                    Compare common parts
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="relative lg:pl-6">
                        <div className="rounded-[28px] matte-panel p-6 sm:p-8 glow-border">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h2 className="font-display font-bold text-xl text-white">
                                        {t('hero.configPanel')}
                                    </h2>
                                    <p className="mt-1 font-body text-sm text-gray-400">
                                        {t('hero.configDesc')}
                                    </p>
                                </div>
                            </div>

                            <HolographicDashboard onVehicleChange={setSelectedVehicle} />

                            <div className="mt-6 rounded-2xl matte-panel-soft p-4">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <span className="font-body text-xs uppercase tracking-[0.18em] text-gray-500">
                                        {selectedVehicle?.model ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}` : 'Awaiting input'}
                                    </span>
                                    <span className="font-body text-xs text-cyan-300">
                                        {selectedVehicle?.model ? t('status.vehicleLocked') : t('status.noSignal')}
                                    </span>
                                </div>
                                <div className="h-1 overflow-hidden rounded-full bg-white/5">
                                    <div className={`h-full bg-gradient-to-r from-cyan-500 to-cyan-200 transition-all duration-500 ${selectedVehicle?.model ? 'w-full' : 'w-0'}`} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 sm:absolute sm:-bottom-6 sm:right-6 sm:mt-0 sm:w-[15rem]">
                            <div className="rounded-2xl matte-panel-soft p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="font-display text-lg font-bold text-white">{t('hero.saveMoney')}</div>
                                        <div className="font-body text-xs uppercase tracking-[0.18em] text-gray-500">
                                            {t('hero.vsMechanic')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const StartHereSection = () => {
    return (
        <section className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="rounded-[32px] matte-panel p-8 sm:p-10">
                    <div className="grid gap-10 lg:grid-cols-[0.82fr,1.18fr] lg:gap-12">
                        <div className="space-y-6">
                            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                                Start here
                            </span>
                            <div className="space-y-4">
                                <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                                    Choose the shortest route from problem to fix
                                </h2>
                                <p className="max-w-xl text-lg text-gray-300">
                                    No starfield, no guessing, no hunting through blocks. Pick the path that matches what you know right now and the rest of the homepage keeps moving in that direction.
                                </p>
                            </div>

                            <div className="space-y-3 text-sm text-gray-300">
                                {[
                                    'Free to use from the first click.',
                                    'Built around diagnosis, guides, and parts instead of stacked promo panels.',
                                    'The same blue-and-white system now sits on a calmer matte-black base.',
                                ].map((item) => (
                                    <div key={item} className="flex items-start gap-3">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative pl-8 sm:pl-10">
                            <div className="absolute left-3 top-6 bottom-6 w-px bg-gradient-to-b from-cyan-500/50 via-cyan-500/20 to-transparent" />
                            <div className="space-y-4">
                                {START_PATHS.map((path) => {
                                    const Icon = path.icon;

                                    return (
                                        <Link
                                            key={path.title}
                                            href={path.href}
                                            className="group relative block rounded-[24px] matte-panel-soft p-6 transition-all hover:border-cyan-500/30 hover:bg-white/[0.035]"
                                        >
                                            <span className="absolute -left-[2.35rem] top-6 flex h-7 w-7 items-center justify-center rounded-full border border-cyan-500/30 bg-[#050505] text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                                                {path.step}
                                            </span>

                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-3">
                                                    <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
                                                        {path.eyebrow}
                                                    </div>
                                                    <h3 className="font-display text-2xl font-bold text-white">
                                                        {path.title}
                                                    </h3>
                                                    <p className="max-w-2xl text-sm leading-6 text-gray-400">
                                                        {path.description}
                                                    </p>
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
                </div>
            </div>
        </section>
    );
};

export default function ClientHome() {
    return (
        <div className="relative min-h-screen overflow-x-hidden matte-shell text-white">
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),transparent_14%,transparent_86%,rgba(255,255,255,0.025))]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
            </div>

            <div className="relative z-10">
                <HeroSection />
                <StartHereSection />
                <HomeRepairClusters />
                <DeferredRender placeholderClassName="min-h-[380px]">
                    <PopularGuidesSection />
                </DeferredRender>
                <AdUnit slot="home-mid-content" format="horizontal" className="max-w-7xl" />
                <DeferredRender placeholderClassName="min-h-[520px]">
                    <FeaturesSection />
                </DeferredRender>
                <DeferredRender placeholderClassName="min-h-[420px]">
                    <TestimonialsSection />
                </DeferredRender>
                <AdUnit slot="home-bottom" className="max-w-7xl" />
                <DeferredRender placeholderClassName="min-h-[300px]">
                    <CTASection />
                </DeferredRender>
            </div>
        </div>
    );
}
