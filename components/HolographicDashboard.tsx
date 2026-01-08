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
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xs font-bold text-brand-cyan uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-brand-cyan rounded-full animate-pulse"></span>
                    Step 1: Identification
                </h3>
            </div>

            {/* VIN Decoder Section */}
            <div className="mb-8 p-1 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-inner border border-gray-700">
                <div className="bg-black/40 rounded-lg p-4 backdrop-blur-sm">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 font-mono">Quick Scan (VIN)</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="ENTER VIN NUMBER"
                            className="flex-grow bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-2.5 text-brand-cyan placeholder-gray-600 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all font-mono text-sm uppercase tracking-wider"
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
                            className="bg-gray-800 hover:bg-gray-700 text-brand-cyan border border-gray-600 hover:border-brand-cyan px-4 py-2 rounded-lg font-bold text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isDecoding ? <ScanLine className="w-4 h-4 animate-spin" /> : 'DECODE'}
                        </button>
                    </div>
                    {error && (
                        <div className="text-red-400 text-xs font-mono mt-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {/* divider */}
            <div className="relative flex items-center py-4 mb-6">
                <div className="flex-grow border-t border-gray-800"></div>
                <span className="flex-shrink-0 mx-4 text-gray-600 text-[10px] font-bold uppercase tracking-widest font-mono">or Manual Entry</span>
                <div className="flex-grow border-t border-gray-800"></div>
            </div>

            <form onSubmit={handleSearch} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* YEAR */}
                    <div className="relative group">
                        <select
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan shadow-lg transition-all text-sm font-medium appearance-none hover:border-gray-500"
                            value={vehicle.year}
                            onChange={(e) => setVehicle({ ...vehicle, year: e.target.value, model: '' })}
                        >
                            <option value="">Select Year</option>
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-3.5 pointer-events-none text-brand-cyan text-xs group-hover:text-white transition-colors">▼</div>
                    </div>

                    {/* MAKE */}
                    <div className="relative group">
                        <select
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan shadow-lg transition-all text-sm font-medium appearance-none hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            value={vehicle.make}
                            onChange={(e) => setVehicle({ ...vehicle, make: e.target.value, model: '' })}
                            disabled={!vehicle.year}
                        >
                            <option value="">Select Make</option>
                            {COMMON_MAKES.map(make => (
                                <option key={make} value={make}>{make.toUpperCase()}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-3.5 pointer-events-none text-brand-cyan text-xs group-hover:text-white transition-colors">▼</div>
                    </div>

                    {/* MODEL */}
                    <div className="relative group">
                        <select
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan shadow-lg transition-all text-sm font-medium appearance-none hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            value={vehicle.model}
                            onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
                            disabled={!vehicle.make || loadingModels}
                        >
                            <option value="">{loadingModels ? "Scanning..." : "Select Model"}</option>
                            {availableModels.map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-3.5 pointer-events-none text-brand-cyan text-xs group-hover:text-white transition-colors">
                            {loadingModels ? <Zap className="w-3 h-3 animate-spin text-neon-amber" /> : '▼'}
                        </div>
                    </div>
                </div>

                <div className="relative group">
                    <div className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-brand-cyan transition-colors">
                        <Wrench className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        placeholder="Describe symptom (e.g. 'Squeaky Brakes')"
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan shadow-lg transition-all text-sm"
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
                        className="w-full bg-transparent border border-brand-cyan/50 hover:bg-brand-cyan/10 text-brand-cyan hover:text-white px-6 py-3.5 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-cyan/20 font-mono text-sm uppercase"
                    >
                        <Zap className="w-5 h-5" />
                        <span>Diagnose</span>
                    </button>

                    <button
                        type="submit"
                        disabled={!vehicle.year || !vehicle.make || !vehicle.model || !task}
                        className="w-full bg-brand-cyan hover:bg-brand-cyan-light text-black border border-transparent px-6 py-3.5 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 shadow-glow-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-95 font-mono text-sm uppercase"
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
