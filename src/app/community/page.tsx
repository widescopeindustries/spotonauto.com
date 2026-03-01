import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { FORUM_CATEGORIES } from '@/data/forumCategories';
import CommunityHome from './CommunityHome';

export const revalidate = 60;

export const metadata: Metadata = {
    title: 'Community Forum — SpotOn Auto | DIY Auto Repair Discussions',
    description:
        'Join the SpotOnAuto community forum. Ask questions, share repair tips, and get help from fellow DIY mechanics on oil changes, brakes, engines, and more.',
    keywords: ['auto repair forum', 'DIY mechanic community', 'car repair help', 'vehicle maintenance discussion'],
    openGraph: {
        title: 'Community Forum — SpotOn Auto',
        description: 'Join the SpotOnAuto community. Ask questions, share tips, and help fellow DIY mechanics.',
        url: 'https://spotonauto.com/community',
        type: 'website',
    },
    alternates: { canonical: 'https://spotonauto.com/community' },
};

async function getCategoryCounts() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || url === 'your_supabase_url') return null;

    const sb = createClient(url, key);
    const { data } = await sb
        .from('forum_categories')
        .select('slug, thread_count, post_count')
        .order('sort_order');
    return data;
}

export default async function CommunityPage() {
    const dbCategories = await getCategoryCounts();

    const categories = FORUM_CATEGORIES.map((cat) => {
        const db = dbCategories?.find((d) => d.slug === cat.slug);
        return {
            ...cat,
            threadCount: db?.thread_count ?? 0,
            postCount: db?.post_count ?? 0,
        };
    });

    return <CommunityHome categories={categories} />;
}
