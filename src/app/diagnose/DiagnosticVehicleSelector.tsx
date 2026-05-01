'use client';

import { startTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown, HardDrive, Zap, ScanLine } from 'lucide-react';

import {
    getDiagnosticDraft,
    getLatestDiagnosticSession,
    saveDiagnosticDraft,
    type DiagnosticSessionSnapshot,
} from '@/services/diagnosticMemory';
import { fetchModels, getMakesForYear, getYears } from '@/services/vehicleData';
import { decodeVin } from '@/services/apiClient';

interface DiagnosticVehicleSelectorProps {
    initialTask?: string;
    initialVin?: string;
    initialMode?: 'ymm' | 'vin' | '';
}

export default function DiagnosticVehicleSelector({
    initialTask = '',
    initialVin = '',
    initialMode = '',
}: DiagnosticVehicleSelectorProps) {
    const router = useRouter();
    const [vehicle, setVehicle] = useState({ year: '', make: '', model: '' });
    const [symptom, setSymptom] = useState(initialTask);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [resumeSession, setResumeSession] = useState<DiagnosticSessionSnapshot | null>(null);
    const [draftReady, setDraftReady] = useState(false);

    // VIN mode state
    const [idMode, setIdMode] = useState<'ymm' | 'vin'>(initialMode === 'vin' ? 'vin' : 'ymm');
    const [vinInput, setVinInput] = useState(initialVin);
    const [vinError, setVinError] = useState<string | null>(null);
    const [isDecoding, setIsDecoding] = useState(false);

    const availableYears = getYears();
    const availableMakes = vehicle.year ? getMakesForYear(vehicle.year) : [];
    const canSubmit = Boolean(vehicle.year && vehicle.make && vehicle.model);

    // Auto-decode VIN from URL on mount
    useEffect(() => {
        if (initialVin && initialVin.length >= 11) {
            void handleVinDecode(initialVin);
        }
    }, []);

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

    const handleVinDecode = async (vin: string) => {
        setVinError(null);
        setIsDecoding(true);
        try {
            const decoded = await decodeVin(vin);
            if (decoded.year && decoded.make) {
                setVehicle({
                    year: String(decoded.year),
                    make: decoded.make,
                    model: decoded.model || '',
                });
                setIdMode('ymm');
            } else {
                setVinError('Could not decode VIN. Please enter vehicle details manually.');
            }
        } catch (err) {
            setVinError(err instanceof Error ? err.message : 'VIN decode failed');
        } finally {
            setIsDecoding(false);
        }
    };

    const handleVinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const vin = vinInput.trim().toUpperCase();
        if (vin.length < 11) {
            setVinError('VIN must be at least 11 characters');
            return;
        }
        void handleVinDecode(vin);
    };

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
                {/* Mode toggle */}
                <div className="flex rounded-lg border border-white/10 bg-black/30 p-1">
                    <button
                        type="button"
                        onClick={() => setIdMode('ymm')}
                        className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                            idMode === 'ymm'
                                ? 'bg-cyan-500/20 text-cyan-200'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        Year / Make / Model
                    </button>
                    <button
                        type="button"
                        onClick={() => setIdMode('vin')}
                        className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                            idMode === 'vin'
                                ? 'bg-cyan-500/20 text-cyan-200'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        <span className="inline-flex items-center gap-1.5">
                            <ScanLine className="h-3.5 w-3.5" />
                            VIN Decoder
                        </span>
                    </button>
                </div>

                {idMode === 'vin' ? (
                    <form onSubmit={handleVinSubmit} className="space-y-3">
                        <label className="block text-xs font-mono uppercase tracking-wider text-gray-500">
                            Enter 17-digit VIN
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={vinInput}
                                onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                                placeholder="e.g. 1G1JC5444R7252367"
                                maxLength={17}
                                className="flex-1 rounded-lg border border-gray-700 bg-gray-900/80 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none uppercase"
                            />
                            <button
                                type="submit"
                                disabled={isDecoding || vinInput.trim().length < 11}
                                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-600"
                            >
                                {isDecoding ? (
                                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                                ) : (
                                    <ScanLine className="h-4 w-4" />
                                )}
                                Decode
                            </button>
                        </div>
                        {vinError && (
                            <p className="text-sm text-red-400">{vinError}</p>
                        )}
                        <p className="text-xs text-gray-600">
                            VIN is decoded via the free NHTSA database. No data is stored.
                        </p>
                    </form>
                ) : (
                    <div className="grid grid-cols-3 gap-3">
                        <div className="relative">
                            <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-gray-500">Year</label>
                            <div className="relative">
                                <select
                                    value={vehicle.year}
                                    onChange={(event) => {
                                        const year = event.target.value;
                                        startTransition(() => {
                                            setVehicle({ year, make: '', model: '' });
                                            setAvailableModels([]);
                                        });
                                    }}
                                    className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-900/80 px-3 py-2.5 pr-8 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                                >
                                    <option value="">Year</option>
                                    {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-gray-500">Make</label>
                            <div className="relative">
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
                                    className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-900/80 px-3 py-2.5 pr-8 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                                >
                                    <option value="">Make</option>
                                    {availableMakes.map((make) => <option key={make} value={make}>{make}</option>)}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-gray-500">Model</label>
                            <div className="relative">
                                <select
                                    value={vehicle.model}
                                    onChange={(event) => {
                                        const model = event.target.value;
                                        startTransition(() => {
                                            setVehicle((current) => ({ ...current, model }));
                                        });
                                    }}
                                    disabled={!vehicle.make || loadingModels}
                                    className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-900/80 px-3 py-2.5 pr-8 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                                >
                                    <option value="">{loadingModels ? 'Loading...' : 'Model'}</option>
                                    {availableModels.map((model) => <option key={model} value={model}>{model}</option>)}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Vehicle summary when known */}
                {canSubmit && (
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-3">
                        <p className="text-sm text-cyan-200">
                            <span className="font-semibold">Selected:</span> {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                    </div>
                )}

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
