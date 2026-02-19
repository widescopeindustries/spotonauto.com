'use client';

import { useState } from 'react';
import CharmLiVehicleSelector from '@/components/CharmLiVehicleSelector';
import { VALID_TASKS } from '@/data/vehicles';

interface VehicleSelection {
    year: string;
    make: string;
    model: string;
}

export default function CharmRepairPage() {
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleSelection | null>(null);
    const [selectedTask, setSelectedTask] = useState('');

    const handleVehicleSelect = (vehicle: VehicleSelection) => {
        setSelectedVehicle(vehicle);
    };

    const handleGetGuide = () => {
        if (selectedVehicle && selectedTask) {
            const { year, make, model } = selectedVehicle;
            const url = `/repair/${year}/${make.toLowerCase()}/${model.toLowerCase().replace(/\s+/g, '-')}/${selectedTask}`;
            window.location.href = url;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="text-brand-cyan">Factory Manual</span> Repair Guides
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Select your vehicle from our charm.li-powered database. 
                        If we don&apos;t have it, we&apos;re working on adding it!
                    </p>
                </header>

                {/* Vehicle Selector */}
                <CharmLiVehicleSelector 
                    onSelect={handleVehicleSelect}
                    selectedTask={selectedTask}
                />

                {/* Task Selection */}
                {selectedVehicle && (
                    <div className="mt-8 w-full max-w-2xl mx-auto p-6 bg-white/5 rounded-2xl border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-brand-cyan text-black rounded-full flex items-center justify-center text-sm font-bold">
                                2
                            </span>
                            Select Repair Task
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {VALID_TASKS.map(task => (
                                <button
                                    key={task}
                                    onClick={() => setSelectedTask(task)}
                                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                                        selectedTask === task
                                            ? 'bg-brand-cyan text-black'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                    }`}
                                >
                                    {task.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Get Guide Button */}
                {selectedVehicle && selectedTask && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={handleGetGuide}
                            className="px-8 py-4 bg-gradient-to-r from-brand-cyan to-blue-500 text-black font-bold text-lg rounded-xl hover:opacity-90 transition-opacity"
                        >
                            Get Repair Guide for {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                        </button>
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-16 grid md:grid-cols-3 gap-6 text-center">
                    <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-3xl mb-2">📚</div>
                        <h3 className="font-bold text-white mb-2">Factory Manuals</h3>
                        <p className="text-gray-400 text-sm">
                            All guides sourced directly from charm.li professional service manuals
                        </p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-3xl mb-2">✅</div>
                        <h3 className="font-bold text-white mb-2">Verified Data</h3>
                        <p className="text-gray-400 text-sm">
                            Only vehicles we have complete data for are shown in the selector
                        </p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-3xl mb-2">🚫</div>
                        <h3 className="font-bold text-white mb-2">No Hallucinations</h3>
                        <p className="text-gray-400 text-sm">
                            If it&apos;s not in our database, we won&apos;t make it up. We&apos;re expanding daily.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
