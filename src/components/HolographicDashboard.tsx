import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Zap, AlertTriangle, ScanLine, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { buildSymptomHref, getSymptomClusterFromText } from '@/data/symptomGraph';
import { decodeVin } from '../services/apiClient';
import { getYears, getMakesForYear, fetchModels } from '../services/vehicleData';
import { trackVehicleSearch, trackVinDecode } from '../lib/analytics';
import { useT } from '@/lib/translations';
import { buildRepairUrl, buildVehicleHubUrl } from '@/lib/vehicleIdentity';

interface HolographicDashboardProps {
    onVehicleChange?: (vehicle: { year: string; make: string; model: string }) => void;
}

const HolographicDashboard: React.FC<HolographicDashboardProps> = ({ onVehicleChange }) => {
    const router = useRouter();
    const t = useT();
    const [vehicle, setVehicle] = useState({ year: '', make: '', model: '' });
    const [task, setTask] = useState('');
    const [vin, setVin] = useState('');

    // Notify parent on change
    useEffect(() => {
        if (onVehicleChange) {
            onVehicleChange(vehicle);
        }
    }, [vehicle, onVehicleChange]);
    const [isDecoding, setIsDecoding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dropdown Data State
    const [availableYears] = useState(getYears());
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const availableMakes = vehicle.year ? getMakesForYear(vehicle.year) : [];
    const matchedSymptomCluster = getSymptomClusterFromText(task);
    const hasVehicleLock = Boolean(vehicle.year && vehicle.make && vehicle.model);
    const wiringHref = hasVehicleLock
        ? `/wiring?${new URLSearchParams({
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
        }).toString()}`
        : '/wiring';
    const vehicleHubHref = hasVehicleLock
        ? buildVehicleHubUrl(vehicle.year, vehicle.make, vehicle.model)
        : '/repair';

    useEffect(() => {
        if (vehicle.make && vehicle.year) {
            setLoadingModels(true);
            fetchModels(vehicle.make, vehicle.year)
                .then(models => {
                    setAvailableModels(models);
                    setLoadingModels(false);
                })
                .catch(() => setLoadingModels(false));
        } else {
            setAvailableModels([]);
        }
    }, [vehicle.make, vehicle.year]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (vehicle.year && vehicle.make && vehicle.model && task) {
            trackVehicleSearch(`${vehicle.year} ${vehicle.make} ${vehicle.model}`, task, 'guide');
            router.push(buildRepairUrl(vehicle.year, vehicle.make, vehicle.model, task));
        }
    };

    const handleDecodeVin = async () => {
        if (vin.length !== 17) {
            setError("Invalid VIN length (17 chars)");
            return;
        }
        setIsDecoding(true);
        setError(null);
        try {
            const decoded = await decodeVin(vin);
            trackVinDecode(vin, true);
            setVehicle({
                year: decoded.year,
                make: decoded.make,
                model: decoded.model
            });
            if (!decoded.model) {
                setError(`Found ${decoded.year} ${decoded.make} — model not in NHTSA database. Please select your model below.`);
            }
        } catch (err) {
            trackVinDecode(vin, false);
            setError(err instanceof Error ? err.message : "Decoding failed. Please verify VIN or enter details manually.");
        } finally {
            setIsDecoding(false);
        }
    };

    return (
        <div className="w-full">
            {/* Header / Instructions */}
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xs font-bold text-brand-cyan uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-brand-cyan rounded-full animate-pulse"></span>
                    {t('form.step1')}
                </h2>
            </div>

            {/* VIN Decoder Section */}
            <div className="mb-8 p-1 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-inner border border-gray-700">
                <div className="bg-black/40 rounded-lg p-4 backdrop-blur-sm">
                    <label htmlFor="vin-input" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-mono">{t('form.quickScan')}</label>
                    <div className="flex gap-2">
                        <input
                            id="vin-input"
                            type="text"
                            placeholder={t('form.enterVin')}
                            className="flex-grow bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-2.5 text-brand-cyan placeholder-gray-500 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all font-mono text-sm uppercase tracking-wider"
                            value={vin}
                            onChange={(e) => {
                                setVin(e.target.value.toUpperCase());
                                setError(null);
                            }}
                            maxLength={17}
                            aria-label="Vehicle Identification Number Input"
                        />
                        <button
                            type="button"
                            onClick={handleDecodeVin}
                            disabled={isDecoding || vin.length !== 17}
                            className="bg-gray-800 hover:bg-gray-700 text-brand-cyan border border-gray-600 hover:border-brand-cyan px-4 py-2 rounded-lg font-bold text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            aria-label="Decode VIN"
                        >
                            {isDecoding ? <ScanLine className="w-4 h-4 animate-spin" /> : t('form.decode')}
                        </button>
                    </div>
                    {error && (
                        <div className="text-red-400 text-xs font-mono mt-2 flex items-center gap-1" role="alert">
                            <AlertTriangle className="w-3 h-3" />
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {/* divider */}
            <div className="relative flex items-center py-4 mb-6">
                <div className="flex-grow border-t border-gray-800"></div>
                <span className="flex-shrink-0 mx-4 text-gray-500 text-[10px] font-bold uppercase tracking-widest font-mono">{t('form.orManual')}</span>
                <div className="flex-grow border-t border-gray-800"></div>
            </div>

            <form onSubmit={handleSearch} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* YEAR */}
                    <div className="relative group">
                        <label htmlFor="year-select" className="sr-only">Select Year</label>
                        <select
                            id="year-select"
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan shadow-lg transition-all text-sm font-medium appearance-none hover:border-gray-500"
                            value={vehicle.year}
                            onChange={(e) => setVehicle({ ...vehicle, year: e.target.value, make: '', model: '' })}
                            aria-label="Select Year"
                        >
                            <option value="">{t('form.selectYear')}</option>
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-3.5 pointer-events-none text-brand-cyan text-xs group-hover:text-white transition-colors">▼</div>
                    </div>

                    {/* MAKE */}
                    <div className="relative group">
                        <label htmlFor="make-select" className="sr-only">Select Make</label>
                        <select
                            id="make-select"
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan shadow-lg transition-all text-sm font-medium appearance-none hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            value={vehicle.make}
                            onChange={(e) => setVehicle({ ...vehicle, make: e.target.value, model: '' })}
                            disabled={!vehicle.year}
                            aria-label="Select Make"
                        >
                            <option value="">{t('form.selectMake')}</option>
                            {availableMakes.map(make => (
                                <option key={make} value={make}>{make.toUpperCase()}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-3.5 pointer-events-none text-brand-cyan text-xs group-hover:text-white transition-colors">▼</div>
                    </div>

                    {/* MODEL */}
                    <div className="relative group">
                        <label htmlFor="model-select" className="sr-only">Select Model</label>
                        <select
                            id="model-select"
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan shadow-lg transition-all text-sm font-medium appearance-none hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            value={vehicle.model}
                            onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
                            disabled={!vehicle.make || loadingModels}
                            aria-label="Select Model"
                        >
                            <option value="">{loadingModels ? t('form.scanning') : t('form.selectModel')}</option>
                            {availableModels.map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-3.5 pointer-events-none text-brand-cyan text-xs group-hover:text-white transition-colors">
                            {loadingModels ? <Zap className="w-3 h-3 animate-spin text-neon-amber" /> : '▼'}
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/85">Primary route</p>
                            <p className="mt-2 text-xs leading-5 text-gray-300">
                                Pick year, make, and model, then enter the exact vehicle hub. Add a symptom only if you want to skip straight into diagnosis or a task-specific guide.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (hasVehicleLock) {
                                    router.push(vehicleHubHref);
                                }
                            }}
                            disabled={!hasVehicleLock}
                            className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-black transition-all hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {hasVehicleLock ? `Open ${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Open vehicle hub'}
                        </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                            href={wiringHref}
                            className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-gray-200 hover:border-cyan-400/35 hover:text-cyan-200 transition-all"
                        >
                            Wiring diagrams
                        </Link>
                        <Link
                            href="/codes"
                            className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-gray-200 hover:border-cyan-400/35 hover:text-cyan-200 transition-all"
                        >
                            OBD2 codes
                        </Link>
                        <Link
                            href="/parts"
                            className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-gray-200 hover:border-cyan-400/35 hover:text-cyan-200 transition-all"
                        >
                            Parts
                        </Link>
                    </div>
                </div>

                <div className="relative group">
                    <label htmlFor="symptom-input" className="sr-only">Describe Symptom</label>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">Optional shortcut</p>
                    <div className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-brand-cyan transition-colors">
                        <Wrench className="w-5 h-5" />
                    </div>
                    <input
                        id="symptom-input"
                        type="text"
                        placeholder={t('form.describeSymptom')}
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan shadow-lg transition-all text-sm"
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                        aria-label="Describe symptom or repair task"
                    />
                </div>

                {matchedSymptomCluster && (
                    <Link
                        href={buildSymptomHref(matchedSymptomCluster.slug)}
                        className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100 hover:border-amber-400/35 hover:bg-amber-500/15 transition-all"
                    >
                        Matched symptom hub: {matchedSymptomCluster.label}
                    </Link>
                )}

                <div className="pt-6 grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => {
                            if (vehicle.year && vehicle.make && vehicle.model && task) {
                                trackVehicleSearch(`${vehicle.year} ${vehicle.make} ${vehicle.model}`, task, 'diagnose');
                                const params = new URLSearchParams({
                                    year: vehicle.year,
                                    make: vehicle.make,
                                    model: vehicle.model,
                                    task: task
                                });
                                router.push(`/diagnose?${params.toString()}`);
                            }
                        }}
                        disabled={!vehicle.year || !vehicle.make || !vehicle.model || !task}
                        className="w-full bg-transparent border border-brand-cyan/50 hover:bg-brand-cyan/10 text-brand-cyan hover:text-white px-6 py-3.5 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-cyan/20 font-mono text-sm uppercase"
                    >
                        <Zap className="w-5 h-5" />
                        <span>{t('form.startDiagnosis')}</span>
                    </button>

                    <button
                        type="submit"
                        disabled={!vehicle.year || !vehicle.make || !vehicle.model || !task}
                        className="w-full bg-brand-cyan hover:bg-brand-cyan-light text-black border border-transparent px-6 py-3.5 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 shadow-glow-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-95 font-mono text-sm uppercase"
                    >
                        <Search className="w-5 h-5" />
                        <span>{t('form.findGuide')}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default HolographicDashboard;
