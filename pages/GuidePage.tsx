
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RepairGuideDisplay from '../components/RepairGuideDisplay';
import LoadingIndicator from '../components/LoadingIndicator';
import SEOHead from '../components/seo/SEOHead';
import { generateFullRepairGuide } from '../services/geminiService';
import { saveGuide, getGuideById } from '../services/storageService';
import { RepairGuide, SubscriptionTier } from '../types';
import { useAuth } from '../contexts/AuthContext';
import UpgradeModal from '../components/UpgradeModal';

const GuidePage: React.FC = () => {
    const { year, make, model, task } = useParams<{ year: string; make: string; model: string; task: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isPremium = user?.tier === SubscriptionTier.Premium;
    const FREE_TIER_LIMIT = 1;

    // Note: We might want to track free usage across the app session or local storage
    // For now, we'll rely on the existing logical flow but adapted for pages
    const [guide, setGuide] = useState<RepairGuide | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    useEffect(() => {
        if (!year || !make || !model || !task) {
            setError("Invalid URL parameters.");
            setLoading(false);
            return;
        }

        const fetchGuide = async () => {
            // Check if we hit limit (logic simulated here, ideally centralized)
            // For public SEO pages, we might want to allow viewing cached/static content
            // But for dynamic generation, we enforce limits.

            // Check if user is trying to "game" the system by reloading? 
            // We'll generate it.
            setError(null);
            setLoading(true);

            try {
                // Clean up task string from URL (kebab-case back to spaces if needed, 
                // though AI handles "alternator-replacement" fine)
                const cleanTask = task.replace(/-/g, ' ');

                const vehicle = { year, make, model };

                // Unique ID for storage check
                const guideId = `${year}-${make}-${model}-${cleanTask}`.toLowerCase().replace(/\s+/g, '-');

                // Check storage first (if premium or we want to cache for everyone)
                const cached = getGuideById(guideId);
                if (cached) {
                    setGuide(cached);
                    setLoading(false);
                    return;
                }

                // Generate new
                const generatedGuide = await generateFullRepairGuide(vehicle, cleanTask);
                setGuide(generatedGuide);

                if (isPremium) {
                    saveGuide(generatedGuide);
                }
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Failed to generate guide.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchGuide();
    }, [year, make, model, task, isPremium]);

    const title = guide ? guide.title : `How to fix ${task} on ${year} ${make} ${model}`;
    const desc = `Step-by-step DIY repair guide for ${task} on a ${year} ${make} ${model}. Includes diagrams, parts list, and tool requirements.`;

    if (loading) return (
        <>
            <SEOHead title={`Generating Guide... | AI Auto Repair`} description="Please wait..." />
            <div className="min-h-screen flex items-center justify-center">
                <LoadingIndicator />
            </div>
        </>
    );

    if (error) return (
        <div className="w-full max-w-2xl mx-auto mt-20 text-center bg-black/50 border border-red-500/50 p-8 rounded-xl">
            <h2 className="text-2xl font-bold text-red-400">Error</h2>
            <p className="text-gray-300 mt-2">{error}</p>
            <button onClick={() => navigate('/')} className="mt-4 text-brand-cyan hover:underline">Return Home</button>
        </div>
    );

    return (
        <>
            <SEOHead title={`${title} | AI Auto Repair`} description={desc} />
            <div className="p-4 md:p-8 flex justify-center">
                {guide && <RepairGuideDisplay guide={guide} onReset={() => navigate('/')} />}
            </div>
            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                onAuthClick={() => {
                    setIsUpgradeModalOpen(false);
                    // Trigger auth modal or redirect
                }}
            />
        </>
    );
};

export default GuidePage;
