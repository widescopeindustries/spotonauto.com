'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RepairGuideDisplay from '@/components/RepairGuideDisplay';
import LoadingIndicator from '@/components/LoadingIndicator';
import { generateFullRepairGuide } from '@/services/apiClient';
import { saveGuide, getGuideById } from '@/services/storageService';
import { RepairGuide } from '@/types';

interface GuideContentProps {
    params: {
        year: string;
        make: string;
        model: string;
        task: string;
    };
}

const guideCache = new Map<string, RepairGuide>();

export default function GuideContent({ params }: GuideContentProps) {
    const router = useRouter();
    const { year, make, model, task } = params;

    const [guide, setGuide] = useState<RepairGuide | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGuide = async () => {
            setError(null);
            setLoading(true);

            try {
                const cleanTask = task.replace(/-/g, ' ');
                const vehicle = { year, make, model };
                const guideId = `${year}-${make}-${model}-${cleanTask}`.toLowerCase().replace(/\s+/g, '-');

                const cached = await getGuideById(guideId);
                if (cached) {
                    setGuide(cached);
                    setLoading(false);
                    return;
                }

                if (guideCache.has(guideId)) {
                    setGuide(guideCache.get(guideId)!);
                    setLoading(false);
                    return;
                }

                const generatedGuide = await generateFullRepairGuide(vehicle, cleanTask);
                guideCache.set(guideId, generatedGuide);
                await saveGuide(generatedGuide);
                setGuide(generatedGuide);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to generate guide.");
            } finally {
                setLoading(false);
            }
        };

        fetchGuide();
    }, [year, make, model, task]);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <LoadingIndicator />
            <p className="text-cyan-400 font-body text-sm mt-4 animate-pulse">
                Generating repair guide with AI...
            </p>
        </div>
    );

    if (error) return (
        <div className="w-full max-w-2xl mx-auto mt-20 text-center glass p-8 rounded-xl text-white">
            <h2 className="text-2xl font-display font-bold text-red-400">Error</h2>
            <p className="text-gray-300 mt-2 font-body">{error}</p>
            <button onClick={() => router.push('/')} className="mt-4 text-cyan-400 hover:underline font-body">Return Home</button>
        </div>
    );

    return (
        <div className="p-4 md:p-8 flex justify-center">
            {guide && <RepairGuideDisplay guide={guide} onReset={() => router.push('/')} />}
        </div>
    );
}
