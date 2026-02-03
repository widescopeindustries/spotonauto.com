'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getHistory } from '@/services/storageService';
import { HistoryItem } from '@/types';
import { History, ArrowRight, Clock } from 'lucide-react';

export default function HistoryPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            getHistory().then((items) => {
                setHistory(items);
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
                <div className="flex items-center gap-3 mb-8">
                    <History className="w-8 h-8 text-cyan-400" />
                    <h1 className="text-3xl font-display font-bold text-white">Your Repair History</h1>
                </div>

                {history.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                        <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h2 className="text-xl font-display text-gray-400 mb-2">No repairs yet</h2>
                        <p className="text-gray-500 font-body mb-6">
                            Your generated repair guides will appear here for easy access.
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
                                        </p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
