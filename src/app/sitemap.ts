import { MetadataRoute } from 'next'
import { VEHICLE_PRODUCTION_YEARS } from '@/data/vehicles';
import { TOOL_PAGES } from '@/data/tools-pages';
import { FORUM_CATEGORIES } from '@/data/forumCategories';

function slugify(s: string) {
    return s.toLowerCase().replace(/\s+/g, '-');
}

/** Top 15 repair tasks by search volume */
const TOP_REPAIR_TASKS = [
    'oil-change',
    'brake-pad-replacement',
    'battery-replacement',
    'spark-plug-replacement',
    'brake-rotor-replacement',
    'serpentine-belt-replacement',
    'cabin-air-filter-replacement',
    'engine-air-filter-replacement',
    'alternator-replacement',
    'starter-replacement',
    'headlight-bulb-replacement',
    'thermostat-replacement',
    'radiator-replacement',
    'water-pump-replacement',
    'timing-belt-replacement',
];

/** Stable date for sitemap lastmod — avoids build-time clock drift */
const LAST_MOD = '2026-02-28';

/**
 * Single flat sitemap — includes static pages, all tool pages, guide pages,
 * and top repair pages. Stays well under the 50,000 URL / 50 MB limit.
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

    // ── Tool pages (all ~1,854) ──────────────────────────────────────
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

    // ── Repair pages — top 15 tasks × all models (newest year) ──────
    for (const make of allMakes) {
        const models = VEHICLE_PRODUCTION_YEARS[make];
        if (!models) continue;
        const makeSlug = slugify(make);

        for (const [model, years] of Object.entries(models)) {
            const modelSlug = slugify(model);
            const latestYear = years.end;

            for (const task of TOP_REPAIR_TASKS) {
                entries.push({
                    url: `${baseUrl}/repair/${latestYear}/${makeSlug}/${modelSlug}/${task}`,
                    lastModified: LAST_MOD,
                    changeFrequency: 'monthly',
                    priority: 0.7,
                });
            }
        }
    }

    return entries;
}
