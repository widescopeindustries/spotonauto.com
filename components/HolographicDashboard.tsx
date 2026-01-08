import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Search, Zap, AlertTriangle, ScanLine, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { decodeVin } from '../services/geminiService';
import { getYears, COMMON_MAKES, fetchModels } from '../services/vehicleData';
import { useEffect } from 'react';

const HolographicDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState({ year: '', make: '', model: '' });
    const [task, setTask] = useState('');
    const [vin, setVin] = useState('');
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
            setError("VIN MUST BE 17 CHARACTERS");
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
            setError("DECODING FAILURE. VERIFY VIN.");
        } finally {
            setIsDecoding(false);
        }
    };

    return (
        <div className="relative w-full max-w-4xl mx-auto p-8 rounded-2xl glass-panel border-neon-cyan/20 overflow-hidden">
            {/* HUD Elements */}
            <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-neon-cyan/50 rounded-tl-2xl opacity-50" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-neon-cyan/50 rounded-br-2xl opacity-50" />

            {/* Scanner Effect */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-cyan/5 to-transparent h-20 w-full"
                animate={{ top: ['-10%', '110%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
            />

            <div className="relative z-10 flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 p-4 rounded-full border border-neon-cyan/30 bg-black/40 shadow-glow-cyan"
                >
                    <Car className="w-12 h-12 text-neon-cyan" />
                </motion.div>

                <h2 className="text-3xl font-mono text-white mb-2 text-glow">SYSTEM READY</h2>
                <p className="text-neon-cyan/70 mb-8 font-mono tracking-widest text-sm">INITIALIZE VEHICLE PARAMETERS</p>

                {/* VIN Decoder Section */}
                <div className="w-full mb-8 max-w-2xl">
                    <div className="flex flex-col md:flex-row gap-4 relative">
                        <div className="flex-grow relative group">
                            <input
                                type="text"
                                placeholder="ENTER 17-DIGIT VIN FOR AUTO-SCAN"
                                className="w-full bg-black/50 border border-neon-cyan/30 rounded-lg px-4 py-3 text-neon-cyan placeholder-neon-cyan/30 focus:outline-none focus:border-neon-cyan focus:shadow-glow-cyan transition-all font-mono text-sm uppercase tracking-wider"
                                value={vin}
                                onChange={(e) => {
                                    setVin(e.target.value.toUpperCase());
                                    setError(null);
                                }}
                                maxLength={17}
                            />
                            <div className="absolute right-3 top-3 text-neon-cyan/30 font-mono text-xs">
                                {vin.length}/17
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleDecodeVin}
                            disabled={isDecoding || vin.length !== 17}
                            className="bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan text-neon-cyan px-6 py-3 rounded-lg font-bold font-mono tracking-wider flex items-center justify-center gap-2 hover:shadow-glow-cyan transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {isDecoding ? (
                                <Zap className="w-4 h-4 animate-pulse" />
                            ) : (
                                <ScanLine className="w-4 h-4" />
                            )}
                            <span>{isDecoding ? 'SCANNING...' : 'DECODE VIN'}</span>
                        </button>
                    </div>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-neon-red text-xs font-mono mt-2 flex items-center gap-2"
                        >
                            <AlertTriangle className="w-3 h-3" />
                            {error}
                        </motion.div>
                    )}
                </div>

                <div className="w-full flex items-center gap-4 mb-8">
                    <div className="h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent flex-grow"></div>
                    <span className="text-neon-cyan/50 font-mono text-xs tracking-widest">MANUAL OVERRIDE</span>
                    <div className="h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent flex-grow"></div>
                </div>

                <form onSubmit={handleSearch} className="w-full space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* YEAR DROPDOWN */}
                        <div className="relative group">
                            <select
                                className="w-full bg-black/50 border border-neon-cyan/30 rounded-lg px-4 py-3 text-neon-cyan focus:outline-none focus:border-neon-cyan focus:shadow-glow-cyan transition-all font-mono text-sm uppercase appearance-none"
                                value={vehicle.year}
                                onChange={(e) => {
                                    setVehicle({ ...vehicle, year: e.target.value, model: '' }); // Reset model on year change
                                }}
                            >
                                <option value="">SELECT YEAR</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-3.5 pointer-events-none text-neon-cyan/50">
                                <span className="text-[10px]">▼</span>
                            </div>
                        </div>

                        {/* MAKE DROPDOWN */}
                        <div className="relative group">
                            <select
                                className="w-full bg-black/50 border border-neon-cyan/30 rounded-lg px-4 py-3 text-neon-cyan focus:outline-none focus:border-neon-cyan focus:shadow-glow-cyan transition-all font-mono text-sm uppercase appearance-none disabled:opacity-50"
                                value={vehicle.make}
                                onChange={(e) => {
                                    setVehicle({ ...vehicle, make: e.target.value, model: '' });
                                }}
                                disabled={!vehicle.year}
                            >
                                <option value="">{vehicle.year ? "SELECT MAKE" : "YEAR FIRST"}</option>
                                {COMMON_MAKES.map(make => (
                                    <option key={make} value={make}>{make.toUpperCase()}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-3.5 pointer-events-none text-neon-cyan/50">
                                <span className="text-[10px]">▼</span>
                            </div>
                        </div>

                        {/* MODEL DROPDOWN */}
                        <div className="relative group">
                            {loadingModels ? (
                                <div className="absolute right-4 top-3.5 text-neon-cyan animate-spin">
                                    <Zap className="w-4 h-4" />
                                </div>
                            ) : (
                                <div className="absolute right-4 top-3.5 pointer-events-none text-neon-cyan/50">
                                    <span className="text-[10px]">▼</span>
                                </div>
                            )}
                            <select
                                className="w-full bg-black/50 border border-neon-cyan/30 rounded-lg px-4 py-3 text-neon-cyan focus:outline-none focus:border-neon-cyan focus:shadow-glow-cyan transition-all font-mono text-sm uppercase appearance-none disabled:opacity-50"
                                value={vehicle.model}
                                onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
                                disabled={!vehicle.make || loadingModels}
                            >
                                <option value="">{loadingModels ? "LOADING..." : (vehicle.make ? "SELECT MODEL" : "MAKE FIRST")}</option>
                                {availableModels.map(model => (
                                    <option key={model} value={model}>{model}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute left-4 top-3.5 text-neon-cyan/50">
                            <Wrench className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="DESCRIBE PROBLEM OR REPAIR (E.G. 'REPLACE BRAKES')"
                            className="w-full bg-black/50 border border-neon-cyan/30 rounded-lg pl-12 pr-4 py-3 text-neon-cyan placeholder-neon-cyan/30 focus:outline-none focus:border-neon-cyan focus:shadow-glow-cyan transition-all font-mono text-sm uppercase tracking-wide"
                            value={task}
                            onChange={(e) => setTask(e.target.value)}
                        />
                        <div className="absolute inset-0 border border-neon-cyan/0 group-hover:border-neon-cyan/20 rounded-lg pointer-events-none transition-all" />
                    </div>

                    <div className="pt-4 grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => {
                                if (vehicle.year && vehicle.make && vehicle.model && task) {
                                    // Navigate to Diagnostic Chat
                                    navigate('/diagnose', { state: { vehicle, initialProblem: task } });
                                }
                            }}
                            disabled={!vehicle.year || !vehicle.make || !vehicle.model || !task}
                            className="w-full bg-transparent border border-neon-cyan text-neon-cyan px-6 py-3 rounded-lg font-bold font-mono tracking-wider flex items-center justify-center gap-2 hover:bg-neon-cyan/10 transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Zap className="w-5 h-5" />
                            <span>DIAGNOSE</span>
                        </button>

                        <button
                            type="submit"
                            disabled={!vehicle.year || !vehicle.make || !vehicle.model || !task}
                            className="w-full bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan text-neon-cyan px-6 py-3 rounded-lg font-bold font-mono tracking-wider flex items-center justify-center gap-2 hover:shadow-glow-cyan transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Search className="w-5 h-5" />
                            <span>GUIDE</span>
                        </button>
                    </div>
                </form>

                <div className="mt-12 grid grid-cols-2 gap-8 w-full max-w-lg">
                    <div className="text-center p-4 border border-white/5 rounded-lg bg-white/5 backdrop-blur-sm">
                        <div className="text-2xl font-bold text-neon-cyan mb-1">98.4%</div>
                        <div className="text-xs text-gray-400 font-mono">DIAGNOSTIC ACCURACY</div>
                    </div>
                    <div className="text-center p-4 border border-white/5 rounded-lg bg-white/5 backdrop-blur-sm">
                        <div className="text-2xl font-bold text-neon-amber mb-1">0.05s</div>
                        <div className="text-xs text-gray-400 font-mono">LATENCY</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HolographicDashboard;
