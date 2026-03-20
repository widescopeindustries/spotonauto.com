'use client';

import { useState, useEffect } from 'react';
import {
    CHARM_LI_DATABASE,
    getCharmLiAvailableYears,
    getCharmLiMakesForYear,
    getCharmLiModelsForYearMake,
    getCharmLiYears,
    isInCharmLi,
} from '@/data/charmLiDatabase';

interface VehicleSelection {
    year: string;
    make: string;
    model: string;
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

    // Load years on mount
    useEffect(() => {
        setYears(getCharmLiAvailableYears());
    }, []);

    // Update makes when year changes
    useEffect(() => {
        if (!selectedYear) {
            setMakes([]);
            setSelectedMake('');
            setModels([]);
            setSelectedModel('');
            setIsAvailable(null);
            return;
        }

        setMakes(getCharmLiMakesForYear(parseInt(selectedYear, 10)));
        setSelectedMake('');
        setModels([]);
        setSelectedModel('');
        setIsAvailable(null);
    }, [selectedYear]);

    // Update models when make changes
    useEffect(() => {
        if (!selectedYear || !selectedMake) {
            setModels([]);
            setSelectedModel('');
            setIsAvailable(null);
            return;
        }

        setModels(getCharmLiModelsForYearMake(parseInt(selectedYear, 10), selectedMake));
        setSelectedModel('');
        setIsAvailable(null);
    }, [selectedYear, selectedMake]);

    // Check availability when all selected
    useEffect(() => {
        if (selectedMake && selectedModel && selectedYear) {
            const available = isInCharmLi(parseInt(selectedYear), selectedMake, selectedModel);
            setIsAvailable(available);
            
            if (available) {
                onSelect({
                    year: selectedYear,
                    make: selectedMake,
                    model: selectedModel
                });
            }
        }
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
                                        {' '}We have {selectedMake} {selectedModel} data for years: {getCharmLiYears(selectedMake, selectedModel).join(', ')}
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
                    Manual coverage database: {Object.keys(CHARM_LI_DATABASE).length} makes, {' '}
                    {Object.values(CHARM_LI_DATABASE).reduce((acc, models) => acc + Object.keys(models).length, 0)} models
                </p>
            </div>
        </div>
    );
}
