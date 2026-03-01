import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getCategoryBySlug, FORUM_CATEGORIES } from '@/data/forumCategories';
import CategoryThreadList from './CategoryThreadList';

export const revalidate = 60;

const THREADS_PER_PAGE = 20;

interface PageProps {
    params: Promise<{ category: string }>;
    searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
    return FORUM_CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { category: slug } = await params;
    const cat = getCategoryBySlug(slug);
    if (!cat) return {};

    return {
        title: `${cat.name} — Community Forum | SpotOn Auto`,
        description: `Discuss ${cat.name.toLowerCase()} with fellow DIY mechanics. ${cat.description}`,
        openGraph: {
            title: `${cat.name} — SpotOn Auto Community`,
            description: cat.description,
            url: `https://spotonauto.com/community/${slug}`,
        },
        alternates: { canonical: `https://spotonauto.com/community/${slug}` },
    };
}

async function getThreads(categorySlug: string, page: number) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || url === 'your_supabase_url') {
        return { threads: [], total: 0 };
    }

    const sb = createClient(url, key);

    // Get category id
    const { data: catData } = await sb
        .from('forum_categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();

    if (!catData) return { threads: [], total: 0 };

    const from = (page - 1) * THREADS_PER_PAGE;
    const to = from + THREADS_PER_PAGE - 1;

    const { data: threads, count } = await sb
        .from('forum_threads')
        .select(
            'id, title, slug, vehicle_year, vehicle_make, vehicle_model, reply_count, view_count, is_pinned, created_at, author_id',
            { count: 'exact' }
        )
        .eq('category_id', catData.id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (!threads) return { threads: [], total: 0 };

    // Get author profiles
    const authorIds = [...new Set(threads.map((t) => t.author_id))];
    const { data: profiles } = await sb
        .from('forum_profiles')
        .select('id, display_name')
        .in('id', authorIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);

    return {
        threads: threads.map((t) => ({
            ...t,
            authorName: profileMap.get(t.author_id) ?? 'DIY Mechanic',
        })),
        total: count ?? 0,
    };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
    const { category: slug } = await params;
    const { page: pageStr } = await searchParams;
    const cat = getCategoryBySlug(slug);
    if (!cat) notFound();

    const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1);
    const { threads, total } = await getThreads(slug, page);
    const totalPages = Math.ceil(total / THREADS_PER_PAGE);

    return (
        <CategoryThreadList
            category={cat}
            threads={threads}
            currentPage={page}
            totalPages={totalPages}
        />
    );
}
