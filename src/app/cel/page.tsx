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

export default function CELLandingPage() {
    const router = useRouter();

    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [symptom, setSymptom] = useState('');

    const models = make ? getModelsForMake(make) : [];
    const years = make && model ? getYearsForModel(make, model) : [];
    const canSubmit = make && model && year && symptom;

    // Track page view + capture UTMs on mount
    useEffect(() => {
        captureUTMParams();
        Analytics.celPageView();
    }, []);

    // Track vehicle selection
    useEffect(() => {
        if (make && model && year) {
            Analytics.vehicleSelected(make, model, year);
        }
    }, [make, model, year]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        const vehicle = `${year} ${make} ${model}`;
        Analytics.diagnoseClicked(vehicle, symptom);
        router.push(`/diagnose?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&task=${encodeURIComponent(symptom)}`);
    };

    const scrollToForm = () => {
        document.getElementById('cel-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
            {/* Minimal header - no nav links */}
            <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4">
                <Link href="/" className="font-display font-bold text-xl tracking-wider text-cyan-400">
                    SPOTON<span className="text-white">AUTO</span>
                </Link>
                <Link href="/auth" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors font-body">
                    Login
                </Link>
            </header>

            {/* ==================== HERO ==================== */}
            <section className="relative min-h-screen flex items-center justify-center px-4">
                <div className="absolute inset-0 hex-pattern opacity-30" />
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/8 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

                <div className="relative z-10 max-w-2xl mx-auto text-center">
                    {/* Pulsing badge */}
                    <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="font-mono text-xs tracking-widest text-amber-400 uppercase">Check Engine Light Detected</span>
                    </div>

                    <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl leading-tight mb-4">
                        <span className="text-white">YOUR CHECK</span>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200">ENGINE LIGHT</span>
                        <br />
                        <span className="text-white">IS ON. LET&apos;S FIX IT.</span>
                    </h1>

                    <p className="font-body text-lg sm:text-xl text-gray-400 mb-8 max-w-md mx-auto">
                        Free AI diagnosis in 30 seconds.<br />Step-by-step repair guide for your exact vehicle.
                    </p>

                    <button
                        onClick={scrollToForm}
                        className="py-4 px-10 rounded-lg font-display font-bold text-sm tracking-widest uppercase bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] transition-all active:scale-[0.98]"
                    >
                        DIAGNOSE NOW — FREE
                    </button>

                    {/* Trust badges */}
                    <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-500 font-body">
                        {['No credit card', 'Results in 30s', 'Works on any vehicle'].map((text) => (
                            <span key={text} className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                {text}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ==================== HOW IT WORKS ==================== */}
            <section className="relative py-20 px-4">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent" />
                <div className="max-w-3xl mx-auto relative z-10">
                    <h2 className="font-display font-bold text-2xl text-center text-white mb-12 tracking-wider">
                        HOW IT WORKS
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'ENTER YOUR VEHICLE', desc: 'Select your year, make, and model. We pull factory specs for your exact car.' },
                            { step: '02', title: 'DESCRIBE THE ISSUE', desc: 'Tell us the symptom, OBD code, or what\'s going wrong. Our AI cross-references millions of repairs.' },
                            { step: '03', title: 'GET YOUR FIX', desc: 'Receive a step-by-step repair guide with tools, parts, and difficulty rating.' },
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

            {/* ==================== VEHICLE FORM ==================== */}
            <section id="cel-form" className="py-16 px-4 scroll-mt-20">
                <div className="max-w-lg mx-auto">
                    <div className="border border-white/10 rounded-2xl p-8 bg-white/[0.02] backdrop-blur-sm">
                        <h2 className="font-display font-bold text-xl text-center text-white mb-1 tracking-wider">
                            START YOUR <span className="text-cyan-400">FREE DIAGNOSIS</span>
                        </h2>
                        <p className="text-center text-gray-500 text-xs font-body mb-8">Takes 30 seconds. No account required.</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="cel-make" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 font-mono">Make</label>
                                <select
                                    id="cel-make"
                                    value={make}
                                    onChange={(e) => { setMake(e.target.value); setModel(''); setYear(''); }}
                                    className="w-full bg-white/5 border border-cyan-500/30 rounded-lg px-4 py-3 text-sm text-white font-body focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 appearance-none"
                                >
                                    <option value="" className="bg-gray-900">Select Make</option>
                                    {makes.map(m => <option key={m} value={m} className="bg-gray-900">{m}</option>)}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="cel-model" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 font-mono">Model</label>
                                <select
                                    id="cel-model"
                                    value={model}
                                    onChange={(e) => { setModel(e.target.value); setYear(''); }}
                                    disabled={!make}
                                    className="w-full bg-white/5 border border-cyan-500/30 rounded-lg px-4 py-3 text-sm text-white font-body focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 disabled:opacity-40 appearance-none"
                                >
                                    <option value="" className="bg-gray-900">Select Model</option>
                                    {models.map(m => <option key={m} value={m} className="bg-gray-900">{m}</option>)}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="cel-year" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 font-mono">Year</label>
                                <select
                                    id="cel-year"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    disabled={!model}
                                    className="w-full bg-white/5 border border-cyan-500/30 rounded-lg px-4 py-3 text-sm text-white font-body focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 disabled:opacity-40 appearance-none"
                                >
                                    <option value="" className="bg-gray-900">Select Year</option>
                                    {years.map(y => <option key={y} value={y} className="bg-gray-900">{y}</option>)}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="cel-symptom" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 font-mono">What&apos;s Wrong?</label>
                                <input
                                    id="cel-symptom"
                                    type="text"
                                    placeholder="e.g. Check engine light on, P0420 code, squeaky brakes..."
                                    value={symptom}
                                    onChange={(e) => setSymptom(e.target.value)}
                                    onBlur={() => { if (symptom) Analytics.symptomEntered(symptom); }}
                                    className="w-full bg-white/5 border border-cyan-500/30 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 font-body focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="w-full mt-2 py-4 rounded-lg font-display font-bold text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] active:scale-[0.98]"
                            >
                                GET MY FREE DIAGNOSIS
                            </button>

                            <p className="text-center text-[11px] text-gray-600 font-body mt-2">
                                No signup required. Your first diagnosis is completely free.
                            </p>
                        </form>
                    </div>
                </div>
            </section>

            {/* ==================== SAVINGS ==================== */}
            <section className="py-16 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-3 tracking-wider">
                        SAVE <span className="text-cyan-400">$200–$500</span> PER REPAIR
                    </h2>
                    <p className="font-body text-sm text-gray-500 max-w-lg mx-auto mb-10">
                        Mechanics charge $100–$150 just to diagnose the problem. Then they mark up parts 50–100%.
                        Our AI gives you the same diagnosis for free.
                    </p>
                    <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                        {[
                            { label: 'Mechanic Diagnostic', cost: '$100–$150', color: 'text-red-400', sub: 'Just to tell you what\'s wrong' },
                            { label: 'SpotOn Diagnosis', cost: 'FREE', color: 'text-cyan-400', sub: 'Same answer, 30 seconds' },
                            { label: 'Average Savings', cost: '$347', color: 'text-green-400', sub: 'Per repair vs. shop prices' },
                        ].map((item, i) => (
                            <div key={i} className="border border-white/5 rounded-lg p-4 bg-white/[0.02]">
                                <p className="text-gray-600 text-[10px] font-mono uppercase tracking-wider mb-1">{item.label}</p>
                                <p className={`text-2xl font-bold ${item.color} font-mono`}>{item.cost}</p>
                                <p className="text-gray-600 text-[10px] font-body mt-1">{item.sub}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ==================== FAQ ==================== */}
            <section className="py-16 px-4">
                <div className="max-w-2xl mx-auto">
                    <h2 className="font-display font-bold text-2xl text-center text-white mb-10 tracking-wider">
                        COMMON QUESTIONS
                    </h2>
                    <div className="space-y-3">
                        {[
                            {
                                q: 'How does the AI know what\'s wrong with my car?',
                                a: 'Our AI cross-references your vehicle\'s factory service data, known issues, technical service bulletins, and millions of documented repairs to identify the most likely cause and fix.'
                            },
                            {
                                q: 'Will this work on my specific vehicle?',
                                a: 'We support virtually every make and model from 1980 to 2027. Our vehicle database pulls directly from the NHTSA, so if your car is registered in the US, we can diagnose it.'
                            },
                            {
                                q: 'Is it really free?',
                                a: 'Your first diagnosis is 100% free, no credit card required. Premium members get unlimited diagnoses and saved repair history for $9.99/month.'
                            },
                            {
                                q: 'What if the AI gets it wrong?',
                                a: 'Our guides always include multiple possible causes ranked by likelihood, safety warnings, and when to seek professional help.'
                            },
                            {
                                q: 'I\'m not a mechanic. Can I actually do this?',
                                a: 'Every guide includes a difficulty rating, estimated time, required tools, and step-by-step instructions. Brake pads, air filters, and spark plugs are common first-timer wins.'
                            },
                        ].map((item, i) => (
                            <details key={i} className="group border border-white/5 rounded-lg bg-white/[0.02] overflow-hidden">
                                <summary className="flex items-center justify-between cursor-pointer p-5 font-display font-bold text-sm tracking-wider text-white hover:text-cyan-400 transition-colors">
                                    {item.q}
                                    <svg className="w-4 h-4 text-gray-500 group-open:rotate-90 transition-transform flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </summary>
                                <div className="px-5 pb-5 text-gray-400 text-sm font-body leading-relaxed">
                                    {item.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ==================== FINAL CTA ==================== */}
            <section className="py-20 px-4 text-center">
                <div className="max-w-md mx-auto">
                    <h2 className="font-display font-bold text-2xl text-white mb-2 tracking-wider">
                        STOP GUESSING. <span className="text-cyan-400">START FIXING.</span>
                    </h2>
                    <p className="font-body text-sm text-gray-500 mb-6">Your check engine light won&apos;t turn itself off. Get answers in 30 seconds.</p>
                    <button
                        onClick={scrollToForm}
                        className="py-4 px-10 rounded-lg font-display font-bold text-sm tracking-widest uppercase bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] transition-all active:scale-[0.98]"
                    >
                        DIAGNOSE NOW — FREE
                    </button>
                </div>
            </section>

            {/* ==================== MINIMAL FOOTER ==================== */}
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
