
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import VehicleForm from '../components/VehicleForm';
import VehicleInfoDisplay from '../components/VehicleInfoDisplay';
import LoadingIndicator from '../components/LoadingIndicator';
import { getVehicleInfo } from '../services/geminiService';
import { Vehicle, VehicleInfo } from '../types';
import SEOHead from '../components/seo/SEOHead';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionTier } from '../types';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [vehicle, setVehicle] = useState<Vehicle>({ year: '', make: '', model: '' });
    const [task, setTask] = useState<string>('');
    const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyzeTask = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const info = await getVehicleInfo(vehicle, task);
            setVehicleInfo(info);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }, [vehicle, task]);

    const handleGenerateGuide = () => {
        // Navigate to the guide page
        // Clean strings for URL using a helper or simple replace
        const vehicleStr = `${vehicle.year}-${vehicle.make}-${vehicle.model}`.toLowerCase().replace(/\s+/g, '-');
        const taskStr = task.toLowerCase().replace(/\s+/g, '-');
        navigate(`/repair/${vehicleStr}/${taskStr}`, { state: { vehicle, task } });
        // Passing state allows us to skip re-parsing or guessing casing, 
        // though the GuidePage will also handle fresh loads from URL.
    };

    const handleStartDiagnostic = () => {
        navigate('/diagnose', { state: { vehicle, initialProblem: task } });
    };

    const handleReset = () => {
        setVehicleInfo(null);
        setTask('');
        setVehicle({ year: '', make: '', model: '' });
    };

    return (
        <>
            <SEOHead
                title="AI Auto Repair - Personal Mechanic Assistant"
                description="Diagnose car problems and get custom repair guides instantly with AI Auto Repair."
            />

            <div className="w-full flex items-center justify-center p-4 md:p-8">
                {loading ? (
                    <LoadingIndicator />
                ) : error ? (
                    <div className="w-full max-w-2xl mx-auto text-center bg-black/50 backdrop-blur-sm border border-red-500/50 p-8 rounded-xl animate-fade-in">
                        <h2 className="text-2xl font-bold text-red-400">Error</h2>
                        <p className="text-gray-300 mt-2 mb-6">{error}</p>
                        <button onClick={() => setError(null)} className="text-brand-cyan hover:underline">Try Again</button>
                    </div>
                ) : vehicleInfo ? (
                    <VehicleInfoDisplay
                        vehicleInfo={vehicleInfo}
                        vehicle={vehicle}
                        task={task}
                        user={user}
                        onGenerateGuide={handleGenerateGuide}
                        onStartDiagnostic={handleStartDiagnostic}
                        onBack={handleReset}
                    />
                ) : (
                    <VehicleForm
                        vehicle={vehicle}
                        setVehicle={setVehicle}
                        task={task}
                        setTask={setTask}
                        onAnalyze={handleAnalyzeTask}
                        user={user}
                    />
                )}
            </div>
        </>
    );
};

export default HomePage;
