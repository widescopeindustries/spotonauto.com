'use client';

import { useState, useEffect } from 'react';

interface VehicleSelection {
    year: string;
    make: string;
    model: string;
}

interface CoverageStats {
    makeCount: number;
    modelCount: number;
    comboCount: number;
}

interface CharmLiVehicleSelectorProps {
    onSelect: (vehicle: VehicleSelection) => void;
    selectedTask?: string;
}

export default function CharmLiVehicleSelector({ onSelect, selectedTask }: CharmLiVehicleSelectorProps) {
    const [years, setYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [makes, setMakes] = useState<string[]>([]);
    const [selectedMake, setSelectedMake] = useState('');
    const [models, setModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState('');
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [availableModelYears, setAvailableModelYears] = useState<number[]>([]);
    const [stats, setStats] = useState<CoverageStats | null>(null);

    useEffect(() => {
        let cancelled = false;

        void fetch('/api/manual-coverage?action=bootstrap')
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Unable to load manual coverage');
                }
                return data;
            })
            .then((data) => {
                if (cancelled) return;
                setYears(Array.isArray(data.years) ? data.years : []);
                setStats(data.stats || null);
            })
            .catch(() => {
                if (cancelled) return;
                setYears([]);
                setStats(null);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!selectedYear) {
            setMakes([]);
            setSelectedMake('');
            setModels([]);
            setSelectedModel('');
            setIsAvailable(null);
            setAvailableModelYears([]);
            return;
        }

        let cancelled = false;

        void fetch(`/api/manual-coverage?action=makes&year=${selectedYear}`)
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Unable to load makes');
                }
                return data;
            })
            .then((data) => {
                if (cancelled) return;
                setMakes(Array.isArray(data.makes) ? data.makes : []);
                setSelectedMake('');
                setModels([]);
                setSelectedModel('');
                setIsAvailable(null);
                setAvailableModelYears([]);
            })
            .catch(() => {
                if (cancelled) return;
                setMakes([]);
                setSelectedMake('');
                setModels([]);
                setSelectedModel('');
                setIsAvailable(null);
                setAvailableModelYears([]);
            });

        return () => {
            cancelled = true;
        };
    }, [selectedYear]);

    useEffect(() => {
        if (!selectedYear || !selectedMake) {
            setModels([]);
            setSelectedModel('');
            setIsAvailable(null);
            setAvailableModelYears([]);
            return;
        }

        let cancelled = false;

        void fetch(`/api/manual-coverage?action=models&year=${selectedYear}&make=${encodeURIComponent(selectedMake)}`)
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Unable to load models');
                }
                return data;
            })
            .then((data) => {
                if (cancelled) return;
                setModels(Array.isArray(data.models) ? data.models : []);
                setSelectedModel('');
                setIsAvailable(null);
                setAvailableModelYears([]);
            })
            .catch(() => {
                if (cancelled) return;
                setModels([]);
                setSelectedModel('');
                setIsAvailable(null);
                setAvailableModelYears([]);
            });

        return () => {
            cancelled = true;
        };
    }, [selectedYear, selectedMake]);

    useEffect(() => {
        if (!selectedMake || !selectedModel || !selectedYear) {
            setIsAvailable(null);
            setAvailableModelYears([]);
            return;
        }

        let cancelled = false;

        void fetch(
            `/api/manual-coverage?action=availability&year=${selectedYear}&make=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(selectedModel)}`,
        )
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Unable to verify manual coverage');
                }
                return data;
            })
            .then((data) => {
                if (cancelled) return;
                const available = Boolean(data.available);
                setIsAvailable(available);
                setAvailableModelYears(Array.isArray(data.years) ? data.years : []);

                if (available) {
                    onSelect({
                        year: selectedYear,
                        make: selectedMake,
                        model: selectedModel,
                    });
                }
            })
            .catch(() => {
                if (cancelled) return;
                setIsAvailable(false);
                setAvailableModelYears([]);
            });

        return () => {
            cancelled = true;
        };
    }, [selectedMake, selectedModel, selectedYear, onSelect]);

    return (
        <div className="w-full max-w-2xl mx-auto p-6 bg-white/5 rounded-2xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-brand-cyan text-black rounded-full flex items-center justify-center text-sm font-bold">
                    1
                </span>
                Select Your Vehicle
            </h3>
            
            {/* Year Dropdown */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                    Year
                </label>
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:border-brand-cyan transition-colors"
                >
                    <option value="">Select Year...</option>
                    {years.map(year => (
                        <option key={year} value={year.toString()}>{year}</option>
                    ))}
                </select>
            </div>

            {/* Make Dropdown */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                    Make
                </label>
                <select
                    value={selectedMake}
                    onChange={(e) => setSelectedMake(e.target.value)}
                    disabled={!selectedYear}
                    className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:border-brand-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="">Select Make...</option>
                    {makes.map(make => (
                        <option key={make} value={make}>{make}</option>
                    ))}
                </select>
            </div>

            {/* Model Dropdown */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                    Model
                </label>
                <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={!selectedYear || !selectedMake}
                    className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:border-brand-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="">Select Model...</option>
                    {models.map(model => (
                        <option key={model} value={model}>{model}</option>
                    ))}
                </select>
            </div>

            {/* Availability Status */}
            {selectedMake && selectedModel && selectedYear && (
                <div className={`p-4 rounded-lg ${isAvailable ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                    {isAvailable ? (
                        <div className="flex items-center gap-2 text-green-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>
                                Factory manual coverage available for {selectedYear} {selectedMake} {selectedModel}
                                {selectedTask && ` - ${selectedTask.replace(/-/g, ' ')}`}
                            </span>
                        </div>
                    ) : (
                        <div className="text-red-400">
                            <p className="font-medium">Sorry, we do not have verified manual coverage for this vehicle yet.</p>
                            <p className="text-sm mt-1 text-red-300">
                                We&apos;re expanding the archive-backed coverage over time.
                                {selectedMake && selectedModel && (
                                    <span>
                                        {' '}We have {selectedMake} {selectedModel} data for years: {availableModelYears.join(', ')}
                                    </span>
                                )}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Database Stats */}
            <div className="mt-6 pt-4 border-t border-white/10 text-xs text-gray-500">
                <p>
                    Manual coverage database: {stats?.makeCount || 0} makes, {stats?.modelCount || 0} models, {stats?.comboCount || 0} year/model combinations
                </p>
            </div>
        </div>
    );
}
