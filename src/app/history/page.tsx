'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getHistory, getSavedManualReferences, type SavedManualReference } from '@/services/storageService';
import { garageService, type GarageVehicle } from '@/services/garageService';
import { HistoryItem } from '@/types';
import { History, ArrowRight, Clock, Car, BookOpen, Wrench } from 'lucide-react';
import AuthProviders from '@/components/AuthProviders';

function HistoryPageInner() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [vehicles, setVehicles] = useState<GarageVehicle[]>([]);
    const [manualReferences, setManualReferences] = useState<SavedManualReference[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            Promise.all([
                getHistory(),
                garageService.getGarage(user.id),
                getSavedManualReferences(),
            ]).then(([items, garageVehicles, savedManuals]) => {
                setHistory(items);
                setVehicles(garageVehicles);
                setManualReferences(savedManuals);
                setLoadingHistory(false);
            });
        }
    }, [user]);

    if (loading || loadingHistory) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-cyan-400">Loading your history...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen pt-24 px-4 pb-12">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                    <Car className="w-8 h-8 text-cyan-400" />
                    <h1 className="text-3xl font-display font-bold text-white">Your Garage</h1>
                </div>
                <p className="mb-8 text-sm text-gray-400">
                    Saved vehicles, repair guides, and the factory manual references attached to those guides.
                </p>

                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    {[
                        { label: 'Saved Vehicles', value: vehicles.length, icon: Car },
                        { label: 'Repair Guides', value: history.length, icon: Wrench },
                        { label: 'Manual References', value: manualReferences.length, icon: BookOpen },
                    ].map((stat) => (
                        <div key={stat.label} className="glass rounded-xl border border-cyan-500/10 p-4">
                            <div className="mb-2 flex items-center gap-2 text-cyan-300">
                                <stat.icon className="h-4 w-4" />
                                <span className="text-xs uppercase tracking-wider">{stat.label}</span>
                            </div>
                            <div className="text-2xl font-bold text-white">{stat.value}</div>
                        </div>
                    ))}
                </div>

                {vehicles.length > 0 && (
                    <section className="mb-8">
                        <h2 className="mb-3 text-lg font-bold text-white">Vehicles</h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {vehicles.map((vehicle) => (
                                <button
                                    key={vehicle.id}
                                    onClick={() => router.push(`/diagnose?year=${vehicle.year}&make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}`)}
                                    className="glass rounded-xl border border-white/10 p-4 text-left transition-all hover:border-cyan-500/30"
                                >
                                    <div className="font-semibold text-white">
                                        {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500">Open diagnosis with this vehicle prefilled</div>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {history.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                        <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h2 className="text-xl font-display text-gray-400 mb-2">No repairs yet</h2>
                        <p className="text-gray-500 font-body mb-6">
                            Your saved repair guides and their manual references will appear here for easy access.
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="btn-cyber-primary"
                        >
                            Start Your First Diagnosis
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((item) => (
                            <div
                                key={item.id}
                                className="glass rounded-xl p-6 border border-cyan-500/10 hover:border-cyan-500/30 transition-all cursor-pointer group"
                                onClick={() => router.push(`/history/${item.id}`)}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-display font-bold text-white text-lg group-hover:text-cyan-400 transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-gray-400 font-body text-sm mt-1">
                                            {item.vehicle}
                                        </p>
                                        <p className="text-gray-500 font-body text-xs mt-2">
                                            {new Date(item.timestamp).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                            {typeof item.manualReferenceCount === 'number' && item.manualReferenceCount > 0
                                                ? ` · ${item.manualReferenceCount} manual reference${item.manualReferenceCount === 1 ? '' : 's'}`
                                                : ''}
                                        </p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {manualReferences.length > 0 && (
                    <section className="mt-10">
                        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
                            <BookOpen className="h-5 w-5 text-cyan-400" />
                            Saved Manual References
                        </h2>
                        <div className="space-y-3">
                            {manualReferences.slice(0, 12).map((reference) => (
                                <a
                                    key={`${reference.guideId}-${reference.uri}`}
                                    href={reference.uri}
                                    className="block glass rounded-xl border border-white/10 p-4 transition-all hover:border-cyan-500/30"
                                >
                                    <div className="font-medium text-white">{reference.title}</div>
                                    <div className="mt-1 text-xs text-gray-500">
                                        {reference.vehicle} · from {reference.guideTitle}
                                    </div>
                                </a>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

export default function HistoryPage() {
    return (
        <AuthProviders>
            <HistoryPageInner />
        </AuthProviders>
    );
}
