'use client';

import { startTransition, useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';

import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';
import { fetchModels, getMakesForYear, getYears } from '@/services/vehicleData';

const PART_CATEGORIES = [
    { label: 'Brake Pads', query: 'brake pads' },
    { label: 'Oil Filters', query: 'oil filter' },
    { label: 'Spark Plugs', query: 'spark plugs' },
    { label: 'Batteries', query: 'car battery' },
    { label: 'Belts', query: 'serpentine belt' },
    { label: 'Headlight Bulbs', query: 'headlight bulb' },
    { label: 'Air Filters', query: 'engine air filter' },
    { label: 'Wiper Blades', query: 'wiper blades' },
];

export default function PartsVehiclePicker() {
    const [year, setYear] = useState('');
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);

    const availableYears = getYears();
    const availableMakes = year ? getMakesForYear(year) : [];
    const vehiclePrefix = year && make && model ? `${year} ${make} ${model}` : '';

    useEffect(() => {
        if (!make || !year) {
            setAvailableModels([]);
            return;
        }
        let cancelled = false;
        setLoadingModels(true);
        void fetchModels(make, year)
            .then((models) => { if (!cancelled) setAvailableModels(models); })
            .catch(() => { if (!cancelled) setAvailableModels([]); })
            .finally(() => { if (!cancelled) setLoadingModels(false); });
        return () => { cancelled = true; };
    }, [make, year]);

    function buildPartUrl(query: string): string {
        return buildAmazonSearchUrl(vehiclePrefix ? `${vehiclePrefix} ${query}` : query);
    }

    return (
        <div>
            {/* Vehicle Picker */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-10">
                <h2 className="text-lg font-bold text-white mb-1">Find parts for your vehicle</h2>
                <p className="text-sm text-gray-400 mb-5">
                    We search Amazon for the best prices on OEM and aftermarket parts.
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="relative">
                        <label htmlFor="parts-year" className="sr-only">Select Year</label>
                        <select
                            id="parts-year"
                            className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900/55 px-4 py-3 text-sm font-medium text-gray-200 transition-all hover:border-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                            value={year}
                            onChange={(e) => {
                                const v = e.target.value;
                                startTransition(() => { setYear(v); setMake(''); setModel(''); setAvailableModels([]); });
                            }}
                        >
                            <option value="">Year</option>
                            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="relative">
                        <label htmlFor="parts-make" className="sr-only">Select Make</label>
                        <select
                            id="parts-make"
                            className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900/55 px-4 py-3 text-sm font-medium text-gray-200 transition-all hover:border-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-50"
                            value={make}
                            disabled={!year}
                            onChange={(e) => {
                                const v = e.target.value;
                                startTransition(() => { setMake(v); setModel(''); setAvailableModels([]); });
                            }}
                        >
                            <option value="">Make</option>
                            {availableMakes.map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div className="relative">
                        <label htmlFor="parts-model" className="sr-only">Select Model</label>
                        <select
                            id="parts-model"
                            className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900/55 px-4 py-3 text-sm font-medium text-gray-200 transition-all hover:border-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-50"
                            value={model}
                            disabled={!make || loadingModels}
                            onChange={(e) => { startTransition(() => { setModel(e.target.value); }); }}
                        >
                            <option value="">{loadingModels ? 'Loading...' : 'Model'}</option>
                            {availableModels.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>

                {vehiclePrefix && (
                    <p className="mt-4 text-sm text-cyan-400">
                        Showing parts for <strong>{vehiclePrefix}</strong>
                    </p>
                )}
            </div>

            {/* Part Category Grid */}
            <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-widest">
                Common Parts
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {PART_CATEGORIES.map((cat) => (
                    <a
                        key={cat.label}
                        href={buildPartUrl(cat.query)}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="flex flex-col items-center gap-2 p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.06] transition-all group text-center"
                    >
                        <ShoppingCart className="w-6 h-6 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                        <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                            {cat.label}
                        </span>
                        {vehiclePrefix && (
                            <span className="text-[10px] text-gray-500">for {vehiclePrefix}</span>
                        )}
                    </a>
                ))}
            </div>
        </div>
    );
}
