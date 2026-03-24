'use client';

import { startTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, HardDrive, Zap } from 'lucide-react';

import {
    getDiagnosticDraft,
    getLatestDiagnosticSession,
    saveDiagnosticDraft,
    type DiagnosticSessionSnapshot,
} from '@/services/diagnosticMemory';
import { fetchModels, getMakesForYear, getYears } from '@/services/vehicleData';

interface DiagnosticVehicleSelectorProps {
    initialTask?: string;
}

export default function DiagnosticVehicleSelector({
    initialTask = '',
}: DiagnosticVehicleSelectorProps) {
    const router = useRouter();
    const [vehicle, setVehicle] = useState({ year: '', make: '', model: '' });
    const [symptom, setSymptom] = useState(initialTask);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [resumeSession, setResumeSession] = useState<DiagnosticSessionSnapshot | null>(null);
    const [draftReady, setDraftReady] = useState(false);

    const availableYears = getYears();
    const availableMakes = vehicle.year ? getMakesForYear(vehicle.year) : [];
    const canSubmit = Boolean(vehicle.year && vehicle.make && vehicle.model);

    useEffect(() => {
        const draft = getDiagnosticDraft();
        if (draft) {
            setVehicle({
                year: draft.year,
                make: draft.make,
                model: draft.model,
            });
            setSymptom(initialTask || draft.symptom);
        } else if (initialTask) {
            setSymptom(initialTask);
        }

        setResumeSession(getLatestDiagnosticSession());
        setDraftReady(true);
    }, [initialTask]);

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

    useEffect(() => {
        if (!draftReady) return;

        const payload = {
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            symptom,
        };

        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            const id = requestIdleCallback(() => {
                saveDiagnosticDraft(payload);
            }, { timeout: 1200 });

            return () => cancelIdleCallback(id);
        }

        const timer = setTimeout(() => {
            saveDiagnosticDraft(payload);
        }, 180);

        return () => clearTimeout(timer);
    }, [draftReady, symptom, vehicle]);

    const handleStart = () => {
        if (!canSubmit) return;

        const params = new URLSearchParams({
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            ...(symptom ? { task: symptom } : {}),
            fresh: '1',
        });

        startTransition(() => {
            router.push(`/diagnose?${params.toString()}`);
        });
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

        startTransition(() => {
            router.push(`/diagnose?${params.toString()}`);
        });
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
            <div className="mb-10 text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-mono uppercase tracking-widest text-amber-400">AI Diagnosis Ready</span>
                </div>
                <h2 className="mb-3 font-display text-3xl font-black text-white sm:text-4xl">
                    What&apos;s wrong with
                    <br />
                    <span className="bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent">your vehicle?</span>
                </h2>
                <p className="max-w-md mx-auto font-body text-gray-400">
                    Select your vehicle, describe the problem, and get free AI-powered diagnosis in seconds.
                </p>
            </div>

            {resumeSession && (
                <div className="mb-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
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
                            type="button"
                            onClick={handleResume}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-black/30 px-5 py-3 text-sm font-semibold text-cyan-100 transition-all hover:border-cyan-300 hover:bg-black/40"
                        >
                            Resume thread
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                <div className="grid grid-cols-3 gap-3">
                    <div className="relative">
                        <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-gray-500">Year</label>
                        <select
                            value={vehicle.year}
                            onChange={(event) => {
                                const year = event.target.value;
                                startTransition(() => {
                                    setVehicle({ year, make: '', model: '' });
                                    setAvailableModels([]);
                                });
                            }}
                            className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-900/80 px-3 py-2.5 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                        >
                            <option value="">Year</option>
                            {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>

                    <div className="relative">
                        <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-gray-500">Make</label>
                        <select
                            value={vehicle.make}
                            onChange={(event) => {
                                const make = event.target.value;
                                startTransition(() => {
                                    setVehicle((current) => ({ ...current, make, model: '' }));
                                    setAvailableModels([]);
                                });
                            }}
                            disabled={!vehicle.year}
                            className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-900/80 px-3 py-2.5 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                        >
                            <option value="">Make</option>
                            {availableMakes.map((make) => <option key={make} value={make}>{make}</option>)}
                        </select>
                    </div>

                    <div className="relative">
                        <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-gray-500">Model</label>
                        <select
                            value={vehicle.model}
                            onChange={(event) => {
                                const model = event.target.value;
                                startTransition(() => {
                                    setVehicle((current) => ({ ...current, model }));
                                });
                            }}
                            disabled={!vehicle.make || loadingModels}
                            className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-900/80 px-3 py-2.5 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                        >
                            <option value="">{loadingModels ? 'Loading...' : 'Model'}</option>
                            {availableModels.map((model) => <option key={model} value={model}>{model}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-gray-500">
                        What&apos;s the problem? <span className="text-gray-600">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={symptom}
                        onChange={(event) => setSymptom(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                handleStart();
                            }
                        }}
                        placeholder="e.g. Check engine light on, brakes squeaking, car won't start..."
                        className="w-full rounded-lg border border-gray-700 bg-gray-900/80 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleStart}
                    disabled={!canSubmit}
                    className="w-full flex items-center justify-center gap-3 rounded-xl bg-cyan-500 py-4 text-base font-bold text-black transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-600"
                >
                    <Zap className="h-5 w-5" />
                    Start AI Diagnosis
                    <ArrowRight className="h-5 w-5" />
                </button>

                <p className="text-center text-xs text-gray-600">
                    Free — No credit card required
                </p>
            </div>
        </div>
    );
}
