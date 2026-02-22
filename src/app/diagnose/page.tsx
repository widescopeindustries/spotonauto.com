'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DiagnosticChat from '@/components/DiagnosticChat';
import { getYears, COMMON_MAKES, fetchModels } from '@/services/vehicleData';
import { useState, useEffect } from 'react';
import { Zap, Car, ArrowRight } from 'lucide-react';

// ── Vehicle selector shown when no vehicle params are in URL ──────────────
function VehicleSelector() {
    const router = useRouter();
    const [vehicle, setVehicle] = useState({ year: '', make: '', model: '' });
    const [symptom, setSymptom] = useState('');
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const availableYears = getYears();

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

    const canSubmit = vehicle.year && vehicle.make && vehicle.model;

    const handleStart = () => {
        if (!canSubmit) return;
        const params = new URLSearchParams({
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            ...(symptom ? { task: symptom } : {}),
        });
        router.push(`/diagnose?${params.toString()}`);
    };

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
                <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-3">
                    What's wrong with<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200">your vehicle?</span>
                </h1>
                <p className="text-gray-400 font-body max-w-md mx-auto">
                    Select your car and describe the problem. Our AI will diagnose it and guide you through the fix — for free.
                </p>
            </motion.div>

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
                            onChange={e => setVehicle({ ...vehicle, year: e.target.value, model: '' })}
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
                            {COMMON_MAKES.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
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
            <h1 className="text-2xl font-mono text-neon-cyan mb-8 tracking-widest uppercase">
                SYSTEM DIAGNOSTICS
            </h1>
            <Suspense fallback={<div className="text-neon-cyan font-mono">Initializing Diagnostic Core...</div>}>
                <DiagnosticContent />
            </Suspense>
        </div>
    );
}

export default function DiagnosticPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-cyan-400 font-mono animate-pulse">Loading...</div>
            </div>
        }>
            <DiagnosticPageInner />
        </Suspense>
    );
}
