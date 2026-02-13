'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VEHICLE_PRODUCTION_YEARS } from '@/data/vehicles';
import Link from 'next/link';

// Capture UTM params for GA4
function useUtmCapture() {
    const searchParams = useSearchParams();
    useEffect(() => {
        if (typeof window === 'undefined' || !window.gtag) return;
        const utmSource = searchParams.get('utm_source');
        const utmMedium = searchParams.get('utm_medium');
        const utmCampaign = searchParams.get('utm_campaign');
        if (utmSource) {
            window.gtag('set', 'user_properties', {
                utm_source: utmSource,
                utm_medium: utmMedium || '',
                utm_campaign: utmCampaign || '',
            });
            window.gtag('event', 'cel_landing_view', {
                event_category: 'landing',
                utm_source: utmSource,
                utm_medium: utmMedium,
                utm_campaign: utmCampaign,
            });
        }
    }, [searchParams]);
}

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
    }
}

const makes = Object.keys(VEHICLE_PRODUCTION_YEARS).sort();

function getModelsForMake(make: string): string[] {
    const models = VEHICLE_PRODUCTION_YEARS[make];
    return models ? Object.keys(models).sort() : [];
}

function getYearsForModel(make: string, model: string): number[] {
    const models = VEHICLE_PRODUCTION_YEARS[make];
    if (!models || !models[model]) return [];
    const { start, end } = models[model];
    const years: number[] = [];
    for (let y = end; y >= start; y--) years.push(y);
    return years;
}

export default function CELLandingPage() {
    const router = useRouter();
    useUtmCapture();

    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');

    const models = make ? getModelsForMake(make) : [];
    const years = make && model ? getYearsForModel(make, model) : [];
    const canSubmit = make && model && year;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'cel_diagnose_click', {
                event_category: 'landing',
                vehicle: `${year} ${make} ${model}`,
            });
        }
        router.push(`/diagnose?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&task=Check+Engine+Light`);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
            {/* Minimal header */}
            <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4">
                <Link href="/" className="font-display font-bold text-xl tracking-wider text-cyan-400">
                    SPOTON<span className="text-white">AUTO</span>
                </Link>
                <Link href="/auth" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors font-body">
                    Login
                </Link>
            </header>

            {/* Hero - above the fold */}
            <section className="relative min-h-screen flex items-center justify-center px-4">
                {/* Background effects */}
                <div className="absolute inset-0 hex-pattern opacity-30" />
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/8 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

                <div className="relative z-10 max-w-2xl mx-auto text-center">
                    {/* Pulsing check engine icon */}
                    <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="font-mono text-xs tracking-widest text-amber-400 uppercase">Check Engine Light Detected</span>
                    </div>

                    {/* Headline */}
                    <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl leading-tight mb-4">
                        <span className="text-white">YOUR CHECK</span>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200">ENGINE LIGHT</span>
                        <br />
                        <span className="text-white">IS ON. LET&apos;S FIX IT.</span>
                    </h1>

                    <p className="font-body text-lg sm:text-xl text-gray-400 mb-8 max-w-md mx-auto">
                        Free AI diagnosis in 30 seconds.<br />No mechanic needed.
                    </p>

                    {/* Vehicle selector form */}
                    <form onSubmit={handleSubmit} className="space-y-3 max-w-md mx-auto">
                        <div className="grid grid-cols-3 gap-2">
                            <select
                                value={make}
                                onChange={(e) => { setMake(e.target.value); setModel(''); setYear(''); }}
                                className="bg-white/5 border border-cyan-500/30 rounded-lg px-3 py-3 text-sm text-white font-body focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 appearance-none"
                            >
                                <option value="" className="bg-gray-900">Make</option>
                                {makes.map(m => <option key={m} value={m} className="bg-gray-900">{m}</option>)}
                            </select>

                            <select
                                value={model}
                                onChange={(e) => { setModel(e.target.value); setYear(''); }}
                                disabled={!make}
                                className="bg-white/5 border border-cyan-500/30 rounded-lg px-3 py-3 text-sm text-white font-body focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 disabled:opacity-40 appearance-none"
                            >
                                <option value="" className="bg-gray-900">Model</option>
                                {models.map(m => <option key={m} value={m} className="bg-gray-900">{m}</option>)}
                            </select>

                            <select
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                disabled={!model}
                                className="bg-white/5 border border-cyan-500/30 rounded-lg px-3 py-3 text-sm text-white font-body focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 disabled:opacity-40 appearance-none"
                            >
                                <option value="" className="bg-gray-900">Year</option>
                                {years.map(y => <option key={y} value={y} className="bg-gray-900">{y}</option>)}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="w-full py-4 rounded-lg font-display font-bold text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] active:scale-[0.98]"
                        >
                            DIAGNOSE NOW — FREE
                        </button>
                    </form>

                    {/* Trust badges */}
                    <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-500 font-body">
                        <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            No credit card
                        </span>
                        <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            Results in 30s
                        </span>
                        <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            50,000+ users
                        </span>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="relative py-20 px-4">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent" />
                <div className="max-w-3xl mx-auto relative z-10">
                    <h2 className="font-display font-bold text-2xl text-center text-white mb-12 tracking-wider">
                        HOW IT WORKS
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'ENTER YOUR VEHICLE', desc: 'Select your year, make, and model above.' },
                            { step: '02', title: 'DESCRIBE THE ISSUE', desc: 'Tell our AI what\'s happening — codes, sounds, symptoms.' },
                            { step: '03', title: 'GET YOUR FIX', desc: 'Receive a step-by-step repair guide with parts and tools.' },
                        ].map((item) => (
                            <div key={item.step} className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-cyan-500/30 bg-cyan-500/5 mb-4">
                                    <span className="font-mono text-cyan-400 text-sm font-bold">{item.step}</span>
                                </div>
                                <h3 className="font-display font-bold text-sm tracking-wider text-white mb-2">{item.title}</h3>
                                <p className="font-body text-sm text-gray-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social proof */}
            <section className="py-16 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { name: 'Mike R.', text: 'Saved me $400 on what the dealer quoted for my Camry. The guide was spot on.', stars: 5 },
                            { name: 'Sarah K.', text: 'P0420 code had me panicking. This tool diagnosed it in seconds — just needed a new O2 sensor.', stars: 5 },
                            { name: 'James T.', text: 'Fixed my own brakes for the first time using this. Step-by-step guide made it easy.', stars: 5 },
                        ].map((t, i) => (
                            <div key={i} className="border border-white/5 rounded-lg p-5 bg-white/[0.02]">
                                <div className="flex gap-0.5 mb-3">
                                    {Array.from({ length: t.stars }).map((_, j) => (
                                        <svg key={j} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <p className="font-body text-sm text-gray-400 mb-3">&ldquo;{t.text}&rdquo;</p>
                                <p className="font-body text-xs text-gray-600">{t.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-16 px-4 text-center">
                <div className="max-w-md mx-auto">
                    <p className="font-display font-bold text-xl text-white mb-2 tracking-wider">SAVE $200–500 PER REPAIR</p>
                    <p className="font-body text-sm text-gray-500 mb-6">Stop overpaying mechanics for simple fixes you can do yourself.</p>
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="inline-block py-3 px-8 rounded-lg font-display font-bold text-sm tracking-widest uppercase bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] transition-all"
                    >
                        START FREE DIAGNOSIS
                    </a>
                </div>
            </section>
        </div>
    );
}
