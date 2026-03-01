'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { FORUM_CATEGORIES } from '@/data/forumCategories';
import { VEHICLE_PRODUCTION_YEARS } from '@/data/vehicles';
import { generateThreadSlug, randomSuffix } from '@/lib/forumUtils';
import { FadeInUp } from '@/components/MotionWrappers';
import ForumBreadcrumbs from '@/components/forum/ForumBreadcrumbs';

export default function NewThreadForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();

    const [categorySlug, setCategorySlug] = useState(searchParams.get('category') ?? '');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [vehicleYear, setVehicleYear] = useState('');
    const [vehicleMake, setVehicleMake] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Redirect to auth if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push(`/auth?redirect=${encodeURIComponent('/community/new')}`);
        }
    }, [authLoading, user, router]);

    const makes = Object.keys(VEHICLE_PRODUCTION_YEARS).sort();
    const models = vehicleMake
        ? Object.keys(VEHICLE_PRODUCTION_YEARS[vehicleMake] ?? {}).sort()
        : [];
    const yearRange = vehicleMake && vehicleModel
        ? VEHICLE_PRODUCTION_YEARS[vehicleMake]?.[vehicleModel]
        : null;
    const years = yearRange
        ? Array.from({ length: yearRange.end - yearRange.start + 1 }, (_, i) => yearRange.end - i)
        : [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !body.trim() || !categorySlug || submitting) return;
        setSubmitting(true);
        setError('');

        // Get category ID
        const { data: catData, error: catError } = await supabase
            .from('forum_categories')
            .select('id')
            .eq('slug', categorySlug)
            .single();

        if (catError || !catData) {
            setError('Invalid category. Please select a category.');
            setSubmitting(false);
            return;
        }

        const yearNum = vehicleYear ? parseInt(vehicleYear, 10) : undefined;
        const slug = generateThreadSlug(
            title.trim(),
            yearNum,
            vehicleMake || undefined,
            vehicleModel || undefined
        );

        const threadData = {
            category_id: catData.id,
            author_id: user!.id,
            title: title.trim(),
            slug,
            body: body.trim(),
            vehicle_year: yearNum ?? null,
            vehicle_make: vehicleMake || null,
            vehicle_model: vehicleModel || null,
        };

        const { error: insertError } = await supabase
            .from('forum_threads')
            .insert(threadData);

        // Slug conflict (23505) — retry with suffix
        if (insertError?.code === '23505') {
            const retrySlug = slug + '-' + randomSuffix();
            const { error: retryError } = await supabase
                .from('forum_threads')
                .insert({ ...threadData, slug: retrySlug });

            if (retryError) {
                setError('Failed to create thread. Please try again.');
                setSubmitting(false);
                return;
            }

            router.push(`/community/${categorySlug}/${retrySlug}`);
            return;
        }

        if (insertError) {
            setError('Failed to create thread. Please try again.');
            setSubmitting(false);
            return;
        }

        router.push(`/community/${categorySlug}/${slug}`);
    };

    if (authLoading || !user) {
        return (
            <div className="glass p-8 rounded-xl text-center">
                <p className="font-body text-gray-400">Loading...</p>
            </div>
        );
    }

    return (
        <FadeInUp>
            <ForumBreadcrumbs crumbs={[{ label: 'New Thread' }]} />

            <h1 className="font-display font-bold text-2xl text-white tracking-wide mt-6 mb-6">
                Start a New Thread
            </h1>

            <form onSubmit={handleSubmit} className="glass p-6 rounded-xl space-y-5">
                {/* Category */}
                <div>
                    <label className="block font-body text-sm text-gray-400 mb-1.5">Category *</label>
                    <select
                        value={categorySlug}
                        onChange={(e) => setCategorySlug(e.target.value)}
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 font-body text-sm text-white focus:outline-none focus:border-cyan-500/50 appearance-none"
                    >
                        <option value="" className="bg-gray-900">Select a category...</option>
                        {FORUM_CATEGORIES.map((cat) => (
                            <option key={cat.slug} value={cat.slug} className="bg-gray-900">
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Title */}
                <div>
                    <label className="block font-body text-sm text-gray-400 mb-1.5">Title *</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="What's your question or topic?"
                        required
                        maxLength={150}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 font-body text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                    />
                </div>

                {/* Body */}
                <div>
                    <label className="block font-body text-sm text-gray-400 mb-1.5">Description *</label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Describe your issue, question, or topic in detail..."
                        required
                        rows={6}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                    />
                </div>

                {/* Vehicle (optional) */}
                <div>
                    <label className="block font-body text-sm text-gray-400 mb-1.5">
                        Vehicle <span className="text-gray-600">(optional — helps match repair guides)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        <select
                            value={vehicleMake}
                            onChange={(e) => {
                                setVehicleMake(e.target.value);
                                setVehicleModel('');
                                setVehicleYear('');
                            }}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 font-body text-sm text-white focus:outline-none focus:border-cyan-500/50 appearance-none"
                        >
                            <option value="" className="bg-gray-900">Make</option>
                            {makes.map((m) => (
                                <option key={m} value={m} className="bg-gray-900">{m}</option>
                            ))}
                        </select>
                        <select
                            value={vehicleModel}
                            onChange={(e) => {
                                setVehicleModel(e.target.value);
                                setVehicleYear('');
                            }}
                            disabled={!vehicleMake}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 font-body text-sm text-white focus:outline-none focus:border-cyan-500/50 appearance-none disabled:opacity-40"
                        >
                            <option value="" className="bg-gray-900">Model</option>
                            {models.map((m) => (
                                <option key={m} value={m} className="bg-gray-900">{m}</option>
                            ))}
                        </select>
                        <select
                            value={vehicleYear}
                            onChange={(e) => setVehicleYear(e.target.value)}
                            disabled={!vehicleModel}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 font-body text-sm text-white focus:outline-none focus:border-cyan-500/50 appearance-none disabled:opacity-40"
                        >
                            <option value="" className="bg-gray-900">Year</option>
                            {years.map((y) => (
                                <option key={y} value={y} className="bg-gray-900">{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm font-body">{error}</p>}

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={!title.trim() || !body.trim() || !categorySlug || submitting}
                        className="btn-cyber-primary flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                        {submitting ? 'Creating...' : 'Create Thread'}
                    </button>
                </div>
            </form>
        </FadeInUp>
    );
}
