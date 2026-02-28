import { MetadataRoute } from 'next'
import { VEHICLE_PRODUCTION_YEARS } from '@/data/vehicles';
import { TOOL_PAGES } from '@/data/tools-pages';

function slugify(s: string) {
    return s.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Single flat sitemap — includes static pages, all tool pages, and guide pages.
 * Repair pages are discoverable via guide pages (internal links) and don't need
 * explicit sitemap entries — Google will crawl them through navigation.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://spotonauto.com';
    const entries: MetadataRoute.Sitemap = [];

    // Static pages
    entries.push(
        { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
        { url: `${baseUrl}/guides`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
        { url: `${baseUrl}/tools`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
        { url: `${baseUrl}/parts`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
        { url: `${baseUrl}/diagnose`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/cel`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
        { url: `${baseUrl}/second-opinion`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
        { url: `${baseUrl}/scanner`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
        { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
        { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
        { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
        { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    );

    // Tool pages (all ~1,854)
    for (const tp of TOOL_PAGES) {
        if (!tp?.slug) continue;
        entries.push({
            url: `${baseUrl}/tools/${tp.slug}`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        });
    }

    // Guide directory — make and model level pages
    const allMakes = Object.keys(VEHICLE_PRODUCTION_YEARS);
    for (const make of allMakes) {
        if (!make) continue;
        const makeSlug = slugify(make);
        entries.push({
            url: `${baseUrl}/guides/${makeSlug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        });

        const models = VEHICLE_PRODUCTION_YEARS[make];
        if (!models) continue;
        for (const model of Object.keys(models)) {
            if (!model) continue;
            entries.push({
                url: `${baseUrl}/guides/${makeSlug}/${slugify(model)}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.7,
            });
        }
    }

    return entries;
}
