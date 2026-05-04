import { MetadataRoute } from 'next';
import { FORUM_CATEGORIES } from '@/data/forumCategories';
import { getForumCategoryCounts } from '@/data/forumThreads';

export const revalidate = 3600;
const COMMUNITY_LIVE_THREAD_THRESHOLD = 20;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const totalThreads = FORUM_CATEGORIES.reduce((sum, cat) => {
        return sum + getForumCategoryCounts(cat.slug).threadCount;
    }, 0);
    if (totalThreads < COMMUNITY_LIVE_THREAD_THRESHOLD) return [];

    const baseUrl = 'https://spotonauto.com';
    return FORUM_CATEGORIES.map((cat) => ({
        url: `${baseUrl}/community/${cat.slug}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 0.6,
    }));
}
