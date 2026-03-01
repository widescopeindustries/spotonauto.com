import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { FORUM_CATEGORIES } from '@/data/forumCategories';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://spotonauto.com';
    const entries: MetadataRoute.Sitemap = [];

    // Category pages
    for (const cat of FORUM_CATEGORIES) {
        entries.push({
            url: `${baseUrl}/community/${cat.slug}`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'daily',
            priority: 0.6,
        });
    }

    // Thread pages from database
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key && url !== 'your_supabase_url') {
        const sb = createClient(url, key);

        // Get all categories for slug mapping
        const { data: categories } = await sb
            .from('forum_categories')
            .select('id, slug');

        const catMap = new Map(categories?.map((c) => [c.id, c.slug]) ?? []);

        // Get all threads
        const { data: threads } = await sb
            .from('forum_threads')
            .select('slug, category_id, updated_at')
            .order('created_at', { ascending: false })
            .limit(10000);

        for (const thread of threads ?? []) {
            const catSlug = catMap.get(thread.category_id);
            if (!catSlug) continue;
            entries.push({
                url: `${baseUrl}/community/${catSlug}/${thread.slug}`,
                lastModified: thread.updated_at,
                changeFrequency: 'weekly',
                priority: 0.5,
            });
        }
    }

    return entries;
}
