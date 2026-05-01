'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InteractiveRepairGuide from '@/components/InteractiveRepairGuide';
import { generateFullRepairGuide } from '@/services/apiClient';
import { saveGuide, getGuideById } from '@/services/storageService';
import { RepairGuide } from '@/types';
import { trackGuideGenerated, trackRepairGuideOpen, trackRepairPageView, trackRetrievalBackbone } from '@/lib/analytics';
import { deriveIntentCluster } from '@/lib/analyticsContext';

interface GuideContentProps {
    params: {
        year: string;
        make: string;
        model: string;
        task: string;
    };
    fallbackGuide: RepairGuide;
}

const guideCache = new Map<string, RepairGuide>();

export default function GuideContent({ params, fallbackGuide }: GuideContentProps) {
    const router = useRouter();
    const { year, make, model, task } = params;
    const cleanTask = task.replace(/-/g, ' ');
    const guideIntentCluster = deriveIntentCluster({
        pageSurface: 'repair_guide',
        task,
    });

    // Show fallback guide immediately; try to enhance with AI in background
    const [guide, setGuide] = useState<RepairGuide>(fallbackGuide);
    const [enhancing, setEnhancing] = useState(true);
    const [enhanceError, setEnhanceError] = useState<string | null>(null);

    useEffect(() => {
        trackRepairPageView(`${year} ${make} ${model}`, cleanTask, {
            pageSurface: 'repair_guide',
            taskSlug: task,
            vehicleYear: year,
            vehicleMake: make,
            vehicleModel: model,
            intentCluster: guideIntentCluster,
        });
        trackRepairGuideOpen(`${year} ${make} ${model}`, cleanTask, {
            pageSurface: 'repair_guide',
            taskSlug: task,
            vehicleYear: year,
            vehicleMake: make,
            vehicleModel: model,
            intentCluster: guideIntentCluster,
        });
    }, [cleanTask, guideIntentCluster, make, model, task, year]);

    useEffect(() => {
        const fetchGuide = async () => {
            setEnhanceError(null);
            setEnhancing(true);

            try {
                const vehicle = { year, make, model };
                const guideId = `${year}-${make}-${model}-${cleanTask}`.toLowerCase().replace(/\s+/g, '-');

                const cached = await getGuideById(guideId);
                if (cached) {
                    setGuide(cached);
                    setEnhancing(false);
                    return;
                }

                if (guideCache.has(guideId)) {
                    setGuide(guideCache.get(guideId)!);
                    setEnhancing(false);
                    return;
                }

                const generatedGuide = await generateFullRepairGuide(vehicle, cleanTask);
                guideCache.set(guideId, generatedGuide);
                await saveGuide(generatedGuide);
                trackGuideGenerated({
                    vehicle: `${year} ${make} ${model}`,
                    task: cleanTask,
                    partsCount: generatedGuide.parts?.length || 0,
                    toolsCount: generatedGuide.tools?.length || 0,
                    manualMode: generatedGuide.retrieval?.manualMode,
                    manualSourceCount: generatedGuide.retrieval?.manualSourceCount,
                    pageSurface: 'repair_guide',
                    taskSlug: task,
                    vehicleYear: year,
                    vehicleMake: make,
                    vehicleModel: model,
                    intentCluster: guideIntentCluster,
                });
                trackRetrievalBackbone(
                    `${year} ${make} ${model}`,
                    cleanTask,
                    generatedGuide.retrieval?.manualMode || 'none',
                    generatedGuide.retrieval?.manualSourceCount || 0,
                    {
                        pageSurface: 'repair_guide',
                        taskSlug: task,
                        vehicleYear: year,
                        vehicleMake: make,
                        vehicleModel: model,
                        intentCluster: guideIntentCluster,
                    },
                );
                setGuide(generatedGuide);
            } catch (err: any) {
                console.warn('AI guide enhancement failed, using fallback:', err);
                setEnhanceError('AI enhancement unavailable — showing static guide data.');
            } finally {
                setEnhancing(false);
            }
        };

        fetchGuide();
    }, [cleanTask, fallbackGuide, guideIntentCluster, make, model, task, year]);

    return (
        <div className="relative">
            {enhancing && (
                <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full border border-neon-cyan/20 bg-black/70 px-3 py-1.5 text-[10px] text-neon-cyan">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-neon-cyan" />
                    Enhancing with AI...
                </div>
            )}
            {enhanceError && !enhancing && (
                <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[10px] text-amber-300">
                    {enhanceError}
                </div>
            )}
            <InteractiveRepairGuide
                guide={guide}
                vehicle={{ year, make, model }}
                onReset={() => router.push('/')}
                analyticsContext={{
                    pageSurface: 'repair_guide',
                    intentCluster: guideIntentCluster,
                    task: cleanTask,
                    taskSlug: task,
                    vehicleYear: year,
                    vehicleMake: make,
                    vehicleModel: model,
                }}
            />
        </div>
    );
}
