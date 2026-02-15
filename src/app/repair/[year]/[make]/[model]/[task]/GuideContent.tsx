'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ServiceManualGuide from '@/components/ServiceManualGuide';
import LoadingIndicator from '@/components/LoadingIndicator';
import { generateFullRepairGuide } from '@/services/apiClient';
import { saveGuide, getGuideById } from '@/services/storageService';
import { RepairGuide } from '@/types';
import { trackGuideGenerated, trackRepairPageView } from '@/lib/analytics';

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
    const [retryCount, setRetryCount] = useState(0);

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

                // Try up to 2 attempts (initial + 1 automatic retry)
                let lastError: Error | null = null;
                const maxAttempts = retryCount === 0 ? 2 : 1;
                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    try {
                        const generatedGuide = await generateFullRepairGuide(vehicle, cleanTask);
                        guideCache.set(guideId, generatedGuide);
                        await saveGuide(generatedGuide);
                        trackGuideGenerated({
                            vehicle: `${year} ${make} ${model}`,
                            task: cleanTask,
                            partsCount: generatedGuide.parts?.length || 0,
                            toolsCount: generatedGuide.tools?.length || 0,
                        });
                        trackRepairPageView(`${year} ${make} ${model}`, cleanTask);
                        setGuide(generatedGuide);
                        return;
                    } catch (err) {
                        lastError = err instanceof Error ? err : new Error('Failed to generate guide.');
                        if (attempt < maxAttempts - 1) {
                            await new Promise(r => setTimeout(r, 2000));
                        }
                    }
                }
                throw lastError;
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to generate guide.");
            } finally {
                setLoading(false);
            }
        };

        fetchGuide();
    }, [year, make, model, task, retryCount]);

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 bg-[#f8f6f1]">
            <div className="text-center">
                <div className="inline-block w-12 h-12 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[#1e3a5f] font-serif text-lg">
                    Consulting service manuals...
                </p>
                <p className="text-[#666] text-sm mt-2">
                    Generating your personalized repair guide
                </p>
            </div>
        </div>
    );

    if (error) return (
        <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-red-200 rounded-lg shadow-lg text-center">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Guide</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
                <button
                    onClick={() => setRetryCount(c => c + 1)}
                    className="px-6 py-2 bg-cyan-600 text-white rounded font-semibold hover:bg-cyan-700 transition-colors"
                >
                    Try Again
                </button>
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-2 bg-[#1e3a5f] text-white rounded font-semibold hover:bg-[#2d4a6f] transition-colors"
                >
                    Return Home
                </button>
            </div>
        </div>
    );

    return (
        <div className="py-8">
            {guide && <ServiceManualGuide guide={guide} onReset={() => router.push('/')} />}
        </div>
    );
}

