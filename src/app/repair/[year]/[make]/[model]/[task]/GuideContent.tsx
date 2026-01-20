'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RepairGuideDisplay from '@/components/RepairGuideDisplay';
import LoadingIndicator from '@/components/LoadingIndicator';
import { generateFullRepairGuide } from '@/services/apiClient';
import { saveGuide, getGuideById } from '@/services/storageService';
import { RepairGuide } from '@/types';
import UpgradeModal from '@/components/UpgradeModal';

interface GuideContentProps {
    params: {
        year: string;
        make: string;
        model: string;
        task: string;
    };
}

export default function GuideContent({ params }: GuideContentProps) {
    const router = useRouter();
    const { year, make, model, task } = params;

    const [guide, setGuide] = useState<RepairGuide | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

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

                const generatedGuide = await generateFullRepairGuide(vehicle, cleanTask);
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
        <div className="min-h-screen flex items-center justify-center">
            <LoadingIndicator />
        </div>
    );

    if (error) return (
        <div className="w-full max-w-2xl mx-auto mt-20 text-center bg-black/50 border border-red-500/50 p-8 rounded-xl text-white">
            <h2 className="text-2xl font-bold text-red-400">Error</h2>
            <p className="text-gray-300 mt-2">{error}</p>
            <button onClick={() => router.push('/')} className="mt-4 text-brand-cyan hover:underline">Return Home</button>
        </div>
    );

    return (
        <div className="p-4 md:p-8 flex justify-center">
            {guide && <RepairGuideDisplay guide={guide} onReset={() => router.push('/')} />}
            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                onAuthClick={() => setIsUpgradeModalOpen(false)}
            />
        </div>
    );
}
