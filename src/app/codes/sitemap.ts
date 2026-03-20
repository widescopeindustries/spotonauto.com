import { MetadataRoute } from 'next'
import { DTC_CODES } from '@/data/dtc-codes-data';
import { getSitemapLastMod } from '@/lib/sitemap';

const LAST_MOD = getSitemapLastMod();

/**
 * Codes sub-sitemap — index page + 300 individual code pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://spotonauto.com';
    const entries: MetadataRoute.Sitemap = [];

    // Index page
    entries.push({
        url: `${baseUrl}/codes`,
        lastModified: LAST_MOD,
        changeFrequency: 'weekly',
        priority: 0.8,
    });

    // Individual code pages
    for (const dtc of DTC_CODES) {
        entries.push({
            url: `${baseUrl}/codes/${dtc.code.toLowerCase()}`,
            lastModified: LAST_MOD,
            changeFrequency: 'monthly',
            priority: 0.7,
        });
    }

    return entries;
}
