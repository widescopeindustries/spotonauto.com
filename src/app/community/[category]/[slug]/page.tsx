import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getCategoryBySlug } from '@/data/forumCategories';
import ThreadPageClient from './ThreadPageClient';

export const revalidate = 300;

interface PageProps {
    params: Promise<{ category: string; slug: string }>;
}

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || url === 'your_supabase_url') return null;
    return createClient(url, key);
}

async function getThread(categorySlug: string, threadSlug: string) {
    const sb = getSupabase();
    if (!sb) return null;

    const { data: catData } = await sb
        .from('forum_categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();

    if (!catData) return null;

    const { data: thread } = await sb
        .from('forum_threads')
        .select('id, title, slug, body, created_at, view_count, reply_count, vehicle_year, vehicle_make, vehicle_model, author_id, is_pinned, is_locked')
        .eq('category_id', catData.id)
        .eq('slug', threadSlug)
        .single();

    if (!thread) return null;

    // Get author profile
    const { data: authorProfile } = await sb
        .from('forum_profiles')
        .select('display_name, avatar_url')
        .eq('id', thread.author_id)
        .single();

    // Get replies
    const { data: posts } = await sb
        .from('forum_posts')
        .select('id, body, created_at, author_id')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: true });

    // Get reply author profiles
    const postAuthorIds = [...new Set(posts?.map((p) => p.author_id) ?? [])];
    let postProfileMap = new Map<string, { display_name: string; avatar_url: string | null }>();
    if (postAuthorIds.length > 0) {
        const { data: postProfiles } = await sb
            .from('forum_profiles')
            .select('id, display_name, avatar_url')
            .in('id', postAuthorIds);
        postProfileMap = new Map(postProfiles?.map((p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }]) ?? []);
    }

    return {
        thread: {
            ...thread,
            author: {
                display_name: authorProfile?.display_name ?? 'DIY Mechanic',
                avatar_url: authorProfile?.avatar_url ?? null,
            },
        },
        posts: (posts ?? []).map((p) => ({
            id: p.id,
            body: p.body,
            created_at: p.created_at,
            author: postProfileMap.get(p.author_id) ?? { display_name: 'DIY Mechanic', avatar_url: null },
        })),
    };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { category: catSlug, slug } = await params;
    const cat = getCategoryBySlug(catSlug);
    if (!cat) return {};

    const result = await getThread(catSlug, slug);
    if (!result) return {};

    const { thread } = result;
    const vehicleStr = thread.vehicle_year && thread.vehicle_make && thread.vehicle_model
        ? `${thread.vehicle_year} ${thread.vehicle_make} ${thread.vehicle_model} — `
        : '';
    const title = `${vehicleStr}${thread.title} | ${cat.name} — SpotOn Auto Community`;
    const description = thread.body.slice(0, 155).replace(/\n/g, ' ');

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `https://spotonauto.com/community/${catSlug}/${slug}`,
            type: 'article',
        },
        alternates: { canonical: `https://spotonauto.com/community/${catSlug}/${slug}` },
    };
}

export default async function ThreadPage({ params }: PageProps) {
    const { category: catSlug, slug } = await params;
    const cat = getCategoryBySlug(catSlug);
    if (!cat) notFound();

    const result = await getThread(catSlug, slug);
    if (!result) notFound();

    const { thread, posts } = result;

    // QAPage structured data
    const qaSchema = {
        '@context': 'https://schema.org',
        '@type': 'QAPage',
        mainEntity: {
            '@type': 'Question',
            name: thread.title,
            text: thread.body,
            dateCreated: thread.created_at,
            author: { '@type': 'Person', name: thread.author.display_name },
            answerCount: posts.length,
            ...(posts.length > 0
                ? {
                      acceptedAnswer: {
                          '@type': 'Answer',
                          text: posts[0].body,
                          dateCreated: posts[0].created_at,
                          author: { '@type': 'Person', name: posts[0].author.display_name },
                      },
                  }
                : {}),
        },
    };

    return (
        <main className="min-h-screen pt-24 pb-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(qaSchema) }}
            />
            <ThreadPageClient
                thread={thread}
                posts={posts}
                category={cat}
            />
        </main>
    );
}
