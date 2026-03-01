'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VEHICLE_PRODUCTION_YEARS } from '@/data/vehicles';
import Link from 'next/link';
import { Analytics, captureUTMParams } from '@/services/analytics';

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

// Common OBD codes that people search for
const COMMON_CODES = [
    {
        code: 'P0420',
        title: 'Catalytic Converter Efficiency',
        desc: 'Your catalytic converter isn\'t cleaning exhaust gases efficiently. Could be the cat itself, O2 sensors, or an exhaust leak.',
        severity: 'Medium',
        severityColor: 'text-amber-400',
        costRange: '$100 - $2,500',
        commonFix: 'O2 sensor replacement or catalytic converter',
    },
    {
        code: 'P0300',
        title: 'Random/Multiple Cylinder Misfire',
        desc: 'Engine is misfiring across multiple cylinders. Usually spark plugs, ignition coils, or fuel delivery issues.',
        severity: 'High',
        severityColor: 'text-red-400',
        costRange: '$50 - $400',
        commonFix: 'Spark plugs + ignition coils',
    },
    {
        code: 'P0171',
        title: 'System Too Lean (Bank 1)',
        desc: 'Engine is getting too much air or not enough fuel. Check for vacuum leaks, dirty MAF sensor, or weak fuel pump.',
        severity: 'Medium',
        severityColor: 'text-amber-400',
        costRange: '$20 - $500',
        commonFix: 'MAF sensor cleaning or vacuum leak repair',
    },
    {
        code: 'P0442',
        title: 'EVAP System Small Leak',
        desc: 'Small leak in your fuel vapor system. Often just a loose or cracked gas cap. Easy fix most of the time.',
        severity: 'Low',
        severityColor: 'text-green-400',
        costRange: '$5 - $200',
        commonFix: 'Replace gas cap',
    },
    {
        code: 'P0455',
        title: 'EVAP System Large Leak',
        desc: 'Larger leak in the evaporative emission system. Could be gas cap, purge valve, or vent valve.',
        severity: 'Low',
        severityColor: 'text-green-400',
        costRange: '$5 - $300',
        commonFix: 'Gas cap, purge valve, or vent valve',
    },
    {
        code: 'P0128',
        title: 'Coolant Thermostat Below Temp',
        desc: 'Engine isn\'t reaching operating temperature fast enough. Usually a stuck-open thermostat.',
        severity: 'Medium',
        severityColor: 'text-amber-400',
        costRange: '$30 - $200',
        commonFix: 'Thermostat replacement',
    },
];

export default function CELLandingPage() {
    const router = useRouter();
    const [mode, setMode] = useState<'choose' | 'vehicle'>('choose');
    const [codeInput, setCodeInput] = useState('');
    const [expandedCode, setExpandedCode] = useState<string | null>(null);

    // Vehicle selector state
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');

    const models = make ? getModelsForMake(make) : [];
    const years = make && model ? getYearsForModel(make, model) : [];
    const canSubmit = make && model && year;

    // Track page view + capture UTMs on mount
    useEffect(() => {
        captureUTMParams();
        Analytics.celPageView();
    }, []);

    const handleVehicleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        const vehicle = `${year} ${make} ${model}`;
        Analytics.diagnoseClicked(vehicle, 'Check Engine Light');
        router.push(`/diagnose?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&task=Check+Engine+Light`);
    };

    const handleCodeSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const code = codeInput.trim().toUpperCase();
        if (!code) return;
        Analytics.celCodeSearch(code);
        // Check if it matches a common code
        const match = COMMON_CODES.find(c => c.code === code);
        if (match) {
            setExpandedCode(code);
            document.getElementById('common-codes')?.scrollIntoView({ behavior: 'smooth' });
        } else {
            // Send to diagnose with the code pre-filled
            router.push(`/diagnose?task=${encodeURIComponent(code)}`);
        }
    };

    const handleCodeTap = (code: string) => {
        Analytics.celCodeTap(code);
        setExpandedCode(expandedCode === code ? null : code);
    };

    const handleGetGuide = (code: string) => {
        Analytics.celGetGuide(code);
        router.push(`/diagnose?task=${encodeURIComponent(code + ' diagnosis')}`);
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

            {/* Hero - compact, above the fold */}
            <section className="relative pt-24 pb-8 px-4">
                <div className="absolute inset-0 hex-pattern opacity-30" />
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/8 rounded-full blur-[150px]" />

                <div className="relative z-10 max-w-2xl mx-auto text-center">
                    <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="font-mono text-xs tracking-widest text-amber-400 uppercase">Check Engine Light On?</span>
                    </div>

                    <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl leading-tight mb-3">
                        <span className="text-white">Find Out What&apos;s Wrong</span>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200">In 30 Seconds</span>
                    </h1>

                    <p className="font-body text-base sm:text-lg text-gray-400 mb-6 max-w-md mx-auto">
                        Free AI diagnosis. See what the code means, what it costs, and if you can fix it yourself.
                    </p>

                    {/* Two-path entry */}
                    <div className="max-w-md mx-auto space-y-3">
                        {/* OBD Code entry - primary path */}
                        <form onSubmit={handleCodeSearch} className="flex gap-2">
                            <input
                                type="text"
                                value={codeInput}
                                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                                placeholder="Enter code (e.g. P0420)"
                                className="flex-1 bg-white/5 border border-cyan-500/30 rounded-lg px-4 py-3.5 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 uppercase tracking-wider"
                                maxLength={6}
                            />
                            <button
                                type="submit"
                                disabled={!codeInput.trim()}
                                className="px-6 py-3.5 rounded-lg font-display font-bold text-sm tracking-widest uppercase bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                LOOK UP
                            </button>
                        </form>

                        <div className="flex items-center gap-3 text-gray-600 text-xs">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="font-body">or describe your problem</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        {/* Vehicle path - secondary */}
                        {mode !== 'vehicle' ? (
                            <button
                                onClick={() => setMode('vehicle')}
                                className="w-full py-3.5 rounded-lg border border-white/10 bg-white/[0.03] text-gray-300 font-body text-sm hover:border-cyan-500/30 hover:text-white transition-all"
                            >
                                Select my vehicle for a full diagnosis
                            </button>
                        ) : (
                            <form onSubmit={handleVehicleSubmit} className="space-y-2">
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
                                    className="w-full py-3.5 rounded-lg font-display font-bold text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] active:scale-[0.98]"
                                >
                                    DIAGNOSE MY VEHICLE
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Trust badges */}
                    <div className="flex items-center justify-center gap-6 mt-5 text-xs text-gray-500 font-body">
                        {['No credit card', 'Results in 30s', 'No sign-up required'].map((text) => (
                            <span key={text} className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                {text}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Common codes section - immediate value */}
            <section id="common-codes" className="relative py-12 px-4">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                <div className="max-w-2xl mx-auto relative z-10">
                    <h2 className="font-display font-bold text-lg text-center text-white mb-2 tracking-wider">
                        MOST COMMON CHECK ENGINE CODES
                    </h2>
                    <p className="text-center text-gray-500 font-body text-sm mb-8">
                        Tap your code to see what it means and what it&apos;ll cost
                    </p>

                    <div className="space-y-3">
                        {COMMON_CODES.map((item) => (
                            <div key={item.code} className="border border-white/10 rounded-lg overflow-hidden bg-white/[0.02] hover:border-cyan-500/30 transition-colors">
                                <button
                                    onClick={() => handleCodeTap(item.code)}
                                    className="w-full flex items-center justify-between p-4 text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-cyan-400 font-bold text-sm">{item.code}</span>
                                        <span className="text-gray-300 font-body text-sm">{item.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-mono ${item.severityColor}`}>{item.severity}</span>
                                        <svg
                                            className={`w-4 h-4 text-gray-500 transition-transform ${expandedCode === item.code ? 'rotate-180' : ''}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>

                                {expandedCode === item.code && (
                                    <div className="px-4 pb-4 border-t border-white/5">
                                        <p className="text-gray-400 font-body text-sm mt-3 mb-4">{item.desc}</p>
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <p className="text-xs text-gray-500 mb-1">Typical Cost</p>
                                                <p className="text-white font-bold text-sm">{item.costRange}</p>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <p className="text-xs text-gray-500 mb-1">Common Fix</p>
                                                <p className="text-white font-bold text-sm">{item.commonFix}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/codes/${item.code.toLowerCase()}`}
                                                className="flex-1 py-3 rounded-lg font-display font-bold text-xs tracking-widest uppercase text-center border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all"
                                            >
                                                FULL {item.code} DETAILS
                                            </Link>
                                            <button
                                                onClick={() => handleGetGuide(item.code)}
                                                className="flex-1 py-3 rounded-lg font-display font-bold text-xs tracking-widest uppercase bg-cyan-500 text-black hover:bg-cyan-400 transition-all"
                                            >
                                                GET REPAIR GUIDE
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-6 space-y-2">
                        <p className="text-gray-600 font-body text-xs">
                            Don&apos;t see your code? Enter it above for an instant AI diagnosis.
                        </p>
                        <Link
                            href="/codes"
                            className="inline-block text-cyan-400 hover:text-cyan-300 font-body text-sm font-semibold transition-colors"
                        >
                            View all 300+ DTC codes →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Social proof */}
            <section className="py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { name: 'Mike R.', text: 'Saved me $400 on what the dealer quoted for my Camry. The guide was spot on.' },
                            { name: 'Sarah K.', text: 'P0420 code had me panicking. This tool diagnosed it in seconds.' },
                            { name: 'James T.', text: 'Fixed my own brakes for the first time. Step-by-step made it easy.' },
                        ].map((t, i) => (
                            <div key={i} className="border border-white/5 rounded-lg p-4 bg-white/[0.02]">
                                <div className="flex gap-0.5 mb-2">
                                    {Array.from({ length: 5 }).map((_, j) => (
                                        <svg key={j} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <p className="font-body text-xs text-gray-400 mb-2">&ldquo;{t.text}&rdquo;</p>
                                <p className="font-body text-xs text-gray-600">{t.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Savings section */}
            <section className="py-16 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="font-display font-bold text-2xl text-white mb-3 tracking-wider">
                        SAVE <span className="text-cyan-400">$200-$500</span> PER REPAIR
                    </h2>
                    <p className="font-body text-sm text-gray-500 max-w-lg mx-auto mb-8">
                        Mechanics charge $100-$150 just to diagnose the problem. Our AI gives you the same answer for free.
                    </p>
                    <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                        {[
                            { label: 'Mechanic Diagnostic', cost: '$100-$150', color: 'text-red-400' },
                            { label: 'SpotOn Diagnosis', cost: 'FREE', color: 'text-cyan-400' },
                            { label: 'Average Savings', cost: '$347', color: 'text-green-400' },
                        ].map((item, i) => (
                            <div key={i} className="border border-white/5 rounded-lg p-4 bg-white/[0.02]">
                                <p className="text-gray-600 text-[10px] font-mono uppercase tracking-wider mb-1">{item.label}</p>
                                <p className={`text-2xl font-bold ${item.color} font-mono`}>{item.cost}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-12 px-4 text-center">
                <div className="max-w-md mx-auto">
                    <h2 className="font-display font-bold text-xl text-white mb-2 tracking-wider">
                        STOP GUESSING. <span className="text-cyan-400">START FIXING.</span>
                    </h2>
                    <p className="font-body text-sm text-gray-500 mb-6">Your check engine light won&apos;t turn itself off. Get answers in 30 seconds.</p>
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="inline-block py-3 px-8 rounded-lg font-display font-bold text-sm tracking-widest uppercase bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] transition-all"
                    >
                        ENTER YOUR CODE
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-white/5 text-center">
                <p className="text-gray-600 text-xs font-body">
                    &copy; {new Date().getFullYear()} SpotOn Auto. All rights reserved.
                    {' '}&middot;{' '}
                    <Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy</Link>
                    {' '}&middot;{' '}
                    <Link href="/terms" className="hover:text-cyan-400 transition-colors">Terms</Link>
                </p>
            </footer>
        </div>
    );
}
