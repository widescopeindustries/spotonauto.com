'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DiagnosticChat from '@/components/DiagnosticChat';
import { getYears, getMakesForYear, fetchModels } from '@/services/vehicleData';
import { useState, useEffect } from 'react';
import { Zap, ArrowRight, HardDrive } from 'lucide-react';
import {
    getDiagnosticDraft,
    getLatestDiagnosticSession,
    saveDiagnosticDraft,
    type DiagnosticSessionSnapshot,
} from '@/services/diagnosticMemory';

// ── Vehicle selector shown when no vehicle params are in URL ──────────────
function VehicleSelector() {
    const router = useRouter();
    const [vehicle, setVehicle] = useState({ year: '', make: '', model: '' });
    const [symptom, setSymptom] = useState('');
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [resumeSession, setResumeSession] = useState<DiagnosticSessionSnapshot | null>(null);
    const [draftReady, setDraftReady] = useState(false);
    const availableYears = getYears();
    const availableMakes = vehicle.year ? getMakesForYear(vehicle.year) : [];

    useEffect(() => {
        const draft = getDiagnosticDraft();
        if (draft) {
            setVehicle({
                year: draft.year,
                make: draft.make,
                model: draft.model,
            });
            setSymptom(draft.symptom);
        }

        setResumeSession(getLatestDiagnosticSession());
        setDraftReady(true);
    }, []);

    useEffect(() => {
        if (vehicle.make && vehicle.year) {
            setLoadingModels(true);
            fetchModels(vehicle.make, vehicle.year)
                .then(m => { setAvailableModels(m); setLoadingModels(false); })
                .catch(() => setLoadingModels(false));
        } else {
            setAvailableModels([]);
        }
    }, [vehicle.make, vehicle.year]);

    useEffect(() => {
        if (!draftReady) return;

        saveDiagnosticDraft({
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            symptom,
        });
    }, [draftReady, symptom, vehicle]);

    const canSubmit = vehicle.year && vehicle.make && vehicle.model;

    const handleStart = () => {
        if (!canSubmit) return;
        const params = new URLSearchParams({
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            ...(symptom ? { task: symptom } : {}),
        });
        params.set('fresh', '1');
        router.push(`/diagnose?${params.toString()}`);
    };

    const handleResume = () => {
        if (!resumeSession) return;

        const params = new URLSearchParams({
            year: resumeSession.vehicle.year,
            make: resumeSession.vehicle.make,
            model: resumeSession.vehicle.model,
            thread: resumeSession.id,
            ...(resumeSession.initialProblem ? { task: resumeSession.initialProblem } : {}),
        });

        router.push(`/diagnose?${params.toString()}`);
    };

    const resumeTimestamp = resumeSession
        ? new Date(resumeSession.updatedAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
        : null;

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 mb-4">
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    <span className="text-amber-400 font-mono text-xs tracking-widest uppercase">AI Diagnostic Core Online</span>
                </div>
                <h2 className="font-display font-black text-3xl sm:text-4xl text-white mb-3">
                    What's wrong with<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200">your vehicle?</span>
                </h2>
                <p className="text-gray-400 font-body max-w-md mx-auto">
                    Select your car and describe the problem. Our AI will diagnose it and guide you through the fix — for free.
                </p>
            </motion.div>

            {resumeSession && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="mb-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5"
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-black/20 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-cyan-200">
                                <HardDrive className="h-3.5 w-3.5" />
                                Persistent memory
                            </div>
                            <h3 className="mt-3 text-lg font-display font-bold text-white">
                                Resume {resumeSession.vehicle.year} {resumeSession.vehicle.make} {resumeSession.vehicle.model}
                            </h3>
                            <p className="mt-1 text-sm text-gray-300">
                                {resumeSession.initialProblem || 'Continue the last thread you left open.'}
                            </p>
                            {resumeTimestamp && (
                                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-200/70">
                                    Last saved {resumeTimestamp}
                                </p>
                            )}
                        </div>

                        <button
                            onClick={handleResume}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-black/30 px-5 py-3 text-sm font-semibold text-cyan-100 transition-all hover:border-cyan-300 hover:bg-black/40"
                        >
                            Resume thread
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Selector Form */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5"
            >
                {/* Year / Make / Model */}
                <div className="grid grid-cols-3 gap-3">
                    {/* Year */}
                    <div className="relative">
                        <label className="block text-xs text-gray-500 font-mono uppercase tracking-wider mb-1.5">Year</label>
                        <select
                            value={vehicle.year}
                            onChange={e => setVehicle({ ...vehicle, year: e.target.value, make: '', model: '' })}
                            className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-200 focus:outline-none focus:border-cyan-500 text-sm appearance-none"
                        >
                            <option value="">Year</option>
                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    {/* Make */}
                    <div className="relative">
                        <label className="block text-xs text-gray-500 font-mono uppercase tracking-wider mb-1.5">Make</label>
                        <select
                            value={vehicle.make}
                            onChange={e => setVehicle({ ...vehicle, make: e.target.value, model: '' })}
                            disabled={!vehicle.year}
                            className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-200 focus:outline-none focus:border-cyan-500 text-sm appearance-none disabled:opacity-50"
                        >
                            <option value="">Make</option>
                            {availableMakes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    {/* Model */}
                    <div className="relative">
                        <label className="block text-xs text-gray-500 font-mono uppercase tracking-wider mb-1.5">Model</label>
                        <select
                            value={vehicle.model}
                            onChange={e => setVehicle({ ...vehicle, model: e.target.value })}
                            disabled={!vehicle.make || loadingModels}
                            className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-200 focus:outline-none focus:border-cyan-500 text-sm appearance-none disabled:opacity-50"
                        >
                            <option value="">{loadingModels ? 'Loading…' : 'Model'}</option>
                            {availableModels.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                        </select>
                    </div>
                </div>

                {/* Symptom */}
                <div>
                    <label className="block text-xs text-gray-500 font-mono uppercase tracking-wider mb-1.5">
                        What's the problem? <span className="text-gray-600">(optional — you can type it in the chat too)</span>
                    </label>
                    <input
                        type="text"
                        value={symptom}
                        onChange={e => setSymptom(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleStart()}
                        placeholder="e.g. Check engine light on, brakes squeaking, car won't start..."
                        className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 text-sm"
                    />
                </div>

                {/* CTA */}
                <button
                    onClick={handleStart}
                    disabled={!canSubmit}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all text-base"
                >
                    <Zap className="w-5 h-5" />
                    Start AI Diagnosis
                    <ArrowRight className="w-5 h-5" />
                </button>

                <p className="text-center text-xs text-gray-600">
                    Free · No credit card required · Powered by Gemini 2.0
                </p>
            </motion.div>

            {/* Quick picks */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-6"
            >
                <p className="text-center text-xs text-gray-600 font-mono uppercase tracking-widest mb-3">Popular diagnoses</p>
                <div className="flex flex-wrap gap-2 justify-center">
                    {[
                        { label: 'Check Engine Light', task: 'check engine light on' },
                        { label: 'Car Won\'t Start', task: 'car won\'t start' },
                        { label: 'Squeaky Brakes', task: 'squeaky brakes' },
                        { label: 'AC Not Working', task: 'AC not cold' },
                        { label: 'Rough Idle', task: 'rough idle' },
                        { label: 'Transmission Slip', task: 'transmission slipping' },
                    ].map(q => (
                        <button
                            key={q.task}
                            onClick={() => setSymptom(q.task)}
                            className={`px-3 py-1.5 rounded-full text-xs border transition-all ${symptom === q.task
                                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-cyan-500/50 hover:text-gray-200'
                                }`}
                        >
                            {q.label}
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

// ── Chat wrapper — only shown when vehicle params exist ───────────────────
function DiagnosticContent() {
    return <DiagnosticChat />;
}

// ── Main page — decides which view to show ────────────────────────────────
function DiagnosticPageInner() {
    const searchParams = useSearchParams();
    const hasVehicle = searchParams.get('year') && searchParams.get('make') && searchParams.get('model');

    if (!hasVehicle) {
        return (
            <div className="px-4 pt-28 pb-16 flex flex-col items-center w-full min-h-screen bg-[#050505]">
                <VehicleSelector />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 flex flex-col items-center w-full min-h-[calc(100vh-80px)]">
            <h2 className="text-2xl font-mono text-neon-cyan mb-8 tracking-widest uppercase">
                SYSTEM DIAGNOSTICS
            </h2>
            <Suspense fallback={<div className="text-neon-cyan font-mono">Initializing Diagnostic Core...</div>}>
                <DiagnosticContent />
            </Suspense>
        </div>
    );
}

export default function DiagnosticPage() {
    return (
        <>
            <h1 className="text-2xl font-display font-bold text-white mb-4 text-center pt-24">AI Car Diagnosis</h1>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    name: "SpotOnAuto AI Diagnostic Tool",
                    applicationCategory: "UtilityApplication",
                    operatingSystem: "Web",
                    description: "Free AI-powered automotive diagnostic tool. Describe symptoms or enter a trouble code to get instant diagnosis and repair guidance for any vehicle.",
                    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
                    author: { "@type": "Organization", "@id": "https://spotonauto.com/#organization" },
                }) }}
            />
            <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-cyan-400 font-mono animate-pulse">Loading...</div>
                </div>
            }>
                <DiagnosticPageInner />
            </Suspense>
        </>
    );
}
