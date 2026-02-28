'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ServiceManualGuide from '@/components/ServiceManualGuide';
import LoadingIndicator from '@/components/LoadingIndicator';
import { generateFullRepairGuide } from '@/services/apiClient';
import { saveGuide, getGuideById } from '@/services/storageService';
import { RepairGuide, SubscriptionTier } from '@/types';
import { trackGuideGenerated, trackRepairPageView, trackUpgradeModalShown } from '@/lib/analytics';
import { trackGuideUse, isFirstFreeGuideUsed, getUsageStatus } from '@/lib/usageTracker';
import { useAuth } from '@/contexts/AuthContext';
import VehicleHealthSnapshot from '@/components/VehicleHealthSnapshot';
import UpgradeModal from '@/components/UpgradeModal';

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
    const { user, loading: authLoading } = useAuth();
    const { year, make, model, task } = params;

    const [guide, setGuide] = useState<RepairGuide | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPremiumGated, setIsPremiumGated] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Determine pro status from Supabase (via AuthContext) — NOT localStorage
    const isPro = user?.tier === SubscriptionTier.Pro || user?.tier === SubscriptionTier.ProPlus;

    useEffect(() => {
        // Wait until auth state is resolved before proceeding
        if (authLoading) return;

        // Anonymous users are allowed — guide generation is public up to the
        // free limit tracked by localStorage (usageTracker). No auth redirect here.

        const fetchGuide = async () => {
            setError(null);
            setLoading(true);

            // Determine if this guide should show blurred premium content
            // Pro users: never gated
            // Free users: 1st guide = full access, 2nd+ guide = blurred specs
            let shouldGate = false;
            if (!isPro) {
                // Check if they've already used their free guide BEFORE tracking this one
                const alreadyUsedFreeGuide = isFirstFreeGuideUsed();

                if (alreadyUsedFreeGuide) {
                    // This is guide 2+, show blurred content
                    shouldGate = true;
                } else {
                    // This is their first guide, track it and give full access
                    trackGuideUse();
                }
            }
            setIsPremiumGated(shouldGate);

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
                trackGuideGenerated({
                    vehicle: `${year} ${make} ${model}`,
                    task: cleanTask,
                    partsCount: generatedGuide.parts?.length || 0,
                    toolsCount: generatedGuide.tools?.length || 0,
                });
                trackRepairPageView(`${year} ${make} ${model}`, cleanTask);
                setGuide(generatedGuide);

                // Show Founding Member upgrade modal 3 seconds after guide loads for free users
                if (!isPro) {
                    setTimeout(() => setShowUpgradeModal(true), 3000);
                }
            } catch (err: any) {
                // Handle 401 specifically — redirect to auth
                if (err.message?.includes('Authentication required') || err.message?.includes('401')) {
                    router.push(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
                    return;
                }
                setError(err instanceof Error ? err.message : "Failed to generate guide.");
            } finally {
                setLoading(false);
            }
        };

        fetchGuide();
    }, [year, make, model, task, authLoading, user, isPro]);

    if (authLoading || loading) return (
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
        <div className="max-w-xl mx-auto my-16 p-8 bg-black/80 border border-red-500/30 rounded-xl shadow-lg text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Guide</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
                <button
                    onClick={async () => {
                        setError(null);
                        setLoading(true);
                        const cleanTask = task.replace(/-/g, ' ');
                        const vehicle = { year, make, model };
                        try {
                            const generatedGuide = await generateFullRepairGuide(vehicle, cleanTask);
                            await saveGuide(generatedGuide);
                            trackGuideGenerated({
                                vehicle: `${year} ${make} ${model}`,
                                task: cleanTask,
                                partsCount: generatedGuide.parts?.length || 0,
                                toolsCount: generatedGuide.tools?.length || 0,
                            });
                            setGuide(generatedGuide);
                        } catch (e: any) {
                            if (e.message?.includes('Authentication required') || e.message?.includes('401')) {
                                router.push(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
                                return;
                            }
                            setError(e instanceof Error ? e.message : 'Failed to generate guide.');
                        } finally {
                            setLoading(false);
                        }
                    }}
                    className="px-6 py-2 bg-brand-cyan text-black rounded-lg font-semibold hover:bg-brand-cyan-light transition-colors"
                >
                    Try Again
                </button>
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-2 bg-white/10 text-white border border-white/20 rounded-lg font-semibold hover:bg-white/20 transition-colors"
                >
                    Return Home
                </button>
            </div>
        </div>
    );

    return (
        <div className="py-8">
            {guide && (
                <>
                    <div className="max-w-4xl mx-auto px-4">
                        <VehicleHealthSnapshot year={year} make={make} model={model} />
                    </div>
                    <ServiceManualGuide
                        guide={guide}
                        onReset={() => router.push('/')}
                        isPremiumGated={isPremiumGated}
                    />
                </>
            )}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                onAuthClick={() => router.push(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`)}
                trigger="guide-limit"
            />
        </div>
    );
}
