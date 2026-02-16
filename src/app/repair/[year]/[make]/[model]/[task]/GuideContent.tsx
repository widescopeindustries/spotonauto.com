'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ServiceManualGuide from '@/components/ServiceManualGuide';
import LoadingIndicator from '@/components/LoadingIndicator';
import { generateFullRepairGuide } from '@/services/apiClient';
import { saveGuide, getGuideById } from '@/services/storageService';
import { RepairGuide } from '@/types';
import { trackGuideGenerated, trackRepairPageView, trackUpgradeModalShown } from '@/lib/analytics';

interface GuideContentProps {
    params: {
        year: string;
        make: string;
        model: string;
        task: string;
    };
}

const guideCache = new Map<string, RepairGuide>();

const STORAGE_KEY = 'spoton_guide_views';
const FREE_GUIDE_LIMIT = 1;
const STRIPE_PRO_LINK = 'https://buy.stripe.com/cNi14na6t8iycykeo718c08';

function getViewedGuides(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

function recordGuideView(guideId: string): string[] {
    const views = getViewedGuides();
    if (!views.includes(guideId)) {
        views.push(guideId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
    }
    return views;
}

/** Paywall overlay shown when free limit is exceeded */
function PaywallOverlay({ vehicle, task }: { vehicle: string; task: string }) {
    useEffect(() => { trackUpgradeModalShown(); }, []);

    return (
        <div className="relative">
            {/* Blurred preview of what they'd get */}
            <div className="h-[400px] overflow-hidden relative" aria-hidden="true">
                <div className="absolute inset-0 bg-gradient-to-b from-[#f8f6f1]/0 via-[#f8f6f1]/60 to-[#f8f6f1] z-10" />
                <div className="blur-sm opacity-50 pointer-events-none p-8">
                    <div className="bg-white rounded-lg p-6 mb-4 border border-gray-200">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                        <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-5/6 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-4/6" />
                    </div>
                    <div className="bg-white rounded-lg p-6 mb-4 border border-gray-200">
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                        <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-5/6" />
                    </div>
                </div>
            </div>

            {/* Upgrade CTA */}
            <div className="relative z-20 -mt-48 mx-auto max-w-lg px-4">
                <div className="bg-white rounded-2xl shadow-2xl border-2 border-cyan-500/30 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#1e3a5f] to-[#0d1b2a] p-6 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 mb-3">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Free guide used</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Unlock Unlimited Repair Guides
                        </h2>
                        <p className="text-gray-300 text-sm">
                            Your free guide for <strong className="text-cyan-400">{vehicle} {task}</strong> is ready &mdash; upgrade to view it and get unlimited access.
                        </p>
                    </div>

                    <div className="p-6">
                        <ul className="space-y-3 mb-6">
                            {[
                                'Unlimited repair guides for any vehicle',
                                'Step-by-step instructions with parts links',
                                'Save vehicles & repair history',
                                'OBD-II scanner integration',
                                'Download guides as PDF',
                            ].map((feature) => (
                                <li key={feature} className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-700 text-sm">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <a
                            href={STRIPE_PRO_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full py-4 px-6 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-center rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98]"
                        >
                            Upgrade to Pro &mdash; $9.99/mo
                        </a>

                        <p className="text-center text-gray-400 text-xs mt-3">
                            Cancel anytime. 14-day money-back guarantee.
                        </p>

                        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
                            {['Secure checkout', 'All major cards', '256-bit encryption'].map((badge) => (
                                <span key={badge} className="text-[10px] text-gray-400 uppercase tracking-wider">{badge}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Value anchor */}
                <p className="text-center text-gray-500 text-xs mt-4 mb-8">
                    That&apos;s less than a single mechanic diagnostic fee ($100&ndash;$150).
                    <br />
                    <Link href="/pricing" className="text-cyan-600 hover:underline">Compare all plans</Link>
                </p>
            </div>
        </div>
    );
}

export default function GuideContent({ params }: GuideContentProps) {
    const router = useRouter();
    const { year, make, model, task } = params;

    const [guide, setGuide] = useState<RepairGuide | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isPaywalled, setIsPaywalled] = useState(false);

    const cleanTask = task.replace(/-/g, ' ');
    const guideId = `${year}-${make}-${model}-${cleanTask}`.toLowerCase().replace(/\s+/g, '-');

    // Check paywall status on mount
    useEffect(() => {
        const views = getViewedGuides();
        // Allow if this specific guide was already viewed (re-visit), otherwise check limit
        if (!views.includes(guideId) && views.length >= FREE_GUIDE_LIMIT) {
            setIsPaywalled(true);
        }
    }, [guideId]);

    useEffect(() => {
        // Don't generate if paywalled
        if (isPaywalled) {
            setLoading(false);
            return;
        }

        const fetchGuide = async () => {
            setError(null);
            setLoading(true);

            try {
                const vehicle = { year, make, model };

                const cached = await getGuideById(guideId);
                if (cached) {
                    setGuide(cached);
                    recordGuideView(guideId);
                    setLoading(false);
                    return;
                }

                if (guideCache.has(guideId)) {
                    setGuide(guideCache.get(guideId)!);
                    recordGuideView(guideId);
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
                        recordGuideView(guideId);
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
    }, [year, make, model, task, retryCount, isPaywalled, guideId, cleanTask]);

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

    if (isPaywalled) return (
        <div className="min-h-screen bg-[#f8f6f1] pt-8">
            <PaywallOverlay vehicle={`${year} ${make} ${model}`} task={cleanTask} />
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

