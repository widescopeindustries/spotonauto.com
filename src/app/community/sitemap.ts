import { MetadataRoute } from 'next';
import { FORUM_CATEGORIES } from '@/data/forumCategories';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://spotonauto.com';
    return FORUM_CATEGORIES.map((cat) => ({
        url: `${baseUrl}/community/${cat.slug}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 0.6,
    }));
}
