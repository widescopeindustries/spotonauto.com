import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Search, Zap, AlertTriangle, ScanLine, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { decodeVin } from '../services/geminiService';
import { getYears, COMMON_MAKES, fetchModels } from '../services/vehicleData';
import { useEffect } from 'react';

interface HolographicDashboardProps {
    onVehicleChange?: (vehicle: { year: string; make: string; model: string }) => void;
}

const HolographicDashboard: React.FC<HolographicDashboardProps> = ({ onVehicleChange }) => {
    const navigate = useNavigate();
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
            navigate(`/repair/${vehicle.year}/${vehicle.make}/${vehicle.model}/${task.replace(/\s+/g, '-')}`);
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
            setVehicle({
                year: decoded.year,
                make: decoded.make,
                model: decoded.model
            });
        } catch (err) {
            setError("Decoding failed. Please verify VIN.");
        } finally {
            setIsDecoding(false);
        }
    };

    return (
        <div className="w-full">
            {/* Header / Instructions */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Step 1: Identification</h3>
                <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Car className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* VIN Decoder Section */}
            <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Scan (VIN)</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="ENTER VIN NUMBER"
                        className="flex-grow bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-mono text-sm uppercase"
                        value={vin}
                        onChange={(e) => {
                            setVin(e.target.value.toUpperCase());
                            setError(null);
                        }}
                        maxLength={17}
                    />
                    <button
                        type="button"
                        onClick={handleDecodeVin}
                        disabled={isDecoding || vin.length !== 17}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm tracking-wide transition-colors disabled:opacity-50"
                    >
                        {isDecoding ? <ScanLine className="w-4 h-4 animate-spin" /> : 'DECODE'}
                    </button>
                </div>
                {error && (
                    <div className="text-red-500 text-xs font-medium mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {error}
                    </div>
                )}
            </div>

            {/* divider */}
            <div className="relative flex items-center py-4 mb-6">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">or Manual Entry</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleSearch} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* YEAR */}
                    <div className="relative">
                        <select
                            className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm appearance-none transition-all text-sm font-medium"
                            value={vehicle.year}
                            onChange={(e) => setVehicle({ ...vehicle, year: e.target.value, model: '' })}
                        >
                            <option value="">Year</option>
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400 text-xs">▼</div>
                    </div>

                    {/* MAKE */}
                    <div className="relative">
                        <select
                            className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm appearance-none transition-all text-sm font-medium disabled:bg-slate-50 disabled:text-slate-400"
                            value={vehicle.make}
                            onChange={(e) => setVehicle({ ...vehicle, make: e.target.value, model: '' })}
                            disabled={!vehicle.year}
                        >
                            <option value="">Make</option>
                            {COMMON_MAKES.map(make => (
                                <option key={make} value={make}>{make.toUpperCase()}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400 text-xs">▼</div>
                    </div>

                    {/* MODEL */}
                    <div className="relative">
                        <select
                            className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm appearance-none transition-all text-sm font-medium disabled:bg-slate-50 disabled:text-slate-400"
                            value={vehicle.model}
                            onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
                            disabled={!vehicle.make || loadingModels}
                        >
                            <option value="">{loadingModels ? "Loading..." : "Model"}</option>
                            {availableModels.map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400 text-xs">
                            {loadingModels ? <Zap className="w-3 h-3 animate-spin" /> : '▼'}
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute left-4 top-3.5 text-slate-400">
                        <Wrench className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        placeholder="What needs repair? (e.g. 'Squeaky Brakes')"
                        className="w-full bg-white border border-slate-300 rounded-lg pl-12 pr-4 py-3 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm transition-all text-sm"
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                    />
                </div>

                <div className="pt-6 grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => {
                            if (vehicle.year && vehicle.make && vehicle.model && task) {
                                navigate('/diagnose', { state: { vehicle, initialProblem: task } });
                            }
                        }}
                        disabled={!vehicle.year || !vehicle.make || !vehicle.model || !task}
                        className="w-full bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 px-6 py-3.5 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <Zap className="w-5 h-5" />
                        <span>Diagnose</span>
                    </button>

                    <button
                        type="submit"
                        disabled={!vehicle.year || !vehicle.make || !vehicle.model || !task}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white border-2 border-transparent px-6 py-3.5 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                    >
                        <Search className="w-5 h-5" />
                        <span>Get Guide</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default HolographicDashboard;
