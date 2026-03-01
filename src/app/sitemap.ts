import { MetadataRoute } from 'next'
import { VEHICLE_PRODUCTION_YEARS } from '@/data/vehicles';
import { TOOL_PAGES } from '@/data/tools-pages';
import { FORUM_CATEGORIES } from '@/data/forumCategories';

function slugify(s: string) {
    return s.toLowerCase().replace(/\s+/g, '-');
}

/** Stable date for sitemap lastmod — avoids build-time clock drift */
const LAST_MOD = '2026-03-01';

/**
 * Main sitemap — static pages, tool pages, guide pages, community.
 * Repair pages are in their own sub-sitemap at /repair/sitemap.xml.
 * DTC code pages are in /codes/sitemap.xml.
 * Next.js auto-generates a sitemap index at /sitemap.xml.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://spotonauto.com';
    const entries: MetadataRoute.Sitemap = [];

    // ── Static pages (5) ─────────────────────────────────────────────
    entries.push(
        { url: baseUrl, lastModified: LAST_MOD, changeFrequency: 'daily', priority: 1 },
        { url: `${baseUrl}/about`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${baseUrl}/contact`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.4 },
        { url: `${baseUrl}/privacy`, lastModified: LAST_MOD, changeFrequency: 'yearly', priority: 0.3 },
        { url: `${baseUrl}/terms`, lastModified: LAST_MOD, changeFrequency: 'yearly', priority: 0.3 },
    );

    // ── Community forum ────────────────────────────────────────────────
    entries.push({
        url: `${baseUrl}/community`,
        lastModified: LAST_MOD,
        changeFrequency: 'daily',
        priority: 0.7,
    });
    for (const cat of FORUM_CATEGORIES) {
        entries.push({
            url: `${baseUrl}/community/${cat.slug}`,
            lastModified: LAST_MOD,
            changeFrequency: 'daily',
            priority: 0.6,
        });
    }

    // ── Tool pages (all ~3,000+) ─────────────────────────────────────
    for (const tp of TOOL_PAGES) {
        if (!tp?.slug) continue;
        entries.push({
            url: `${baseUrl}/tools/${tp.slug}`,
            lastModified: LAST_MOD,
            changeFrequency: 'monthly',
            priority: 0.8,
        });
    }

    // ── Guide directory — make and model level pages ─────────────────
    const allMakes = Object.keys(VEHICLE_PRODUCTION_YEARS);
    for (const make of allMakes) {
        if (!make) continue;
        const makeSlug = slugify(make);
        entries.push({
            url: `${baseUrl}/guides/${makeSlug}`,
            lastModified: LAST_MOD,
            changeFrequency: 'weekly',
            priority: 0.7,
        });

        const models = VEHICLE_PRODUCTION_YEARS[make];
        if (!models) continue;
        for (const model of Object.keys(models)) {
            if (!model) continue;
            entries.push({
                url: `${baseUrl}/guides/${makeSlug}/${slugify(model)}`,
                lastModified: LAST_MOD,
                changeFrequency: 'weekly',
                priority: 0.7,
            });
        }
    }

    return entries;
}
