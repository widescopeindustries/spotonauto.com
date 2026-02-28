import { MetadataRoute } from 'next'
import { VEHICLE_PRODUCTION_YEARS, VALID_TASKS } from '@/data/vehicles';
import { TOOL_PAGES } from '@/data/tools-pages';

// Only include years with meaningful search volume
const SITEMAP_YEAR_MIN = 1990;
const SITEMAP_YEAR_MAX = 2025;

const ALL_MAKES = Object.keys(VEHICLE_PRODUCTION_YEARS);

/**
 * Split sitemap into chunks — one per make + one for static/tools pages.
 * Each sub-sitemap stays well under Vercel's 19 MB ISR limit.
 */
export async function generateSitemaps() {
    return [{ id: 0 }, ...ALL_MAKES.map((_, i) => ({ id: i + 1 }))];
}

function slugify(s: string) {
    return s.toLowerCase().replace(/\s+/g, '-');
}

export default function sitemap({ id }: { id: number }): MetadataRoute.Sitemap {
    const baseUrl = 'https://spotonauto.com';
    const numId = typeof id === 'string' ? parseInt(id as string, 10) : id;

    // ── id 0: static pages, tools, and guide directory ──────────────
    if (numId === 0) {
        const staticPages: MetadataRoute.Sitemap = [
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
        ];
        // Tool pages
        for (const tp of TOOL_PAGES) {
            if (!tp?.slug) continue;
            staticPages.push({
                url: `${baseUrl}/tools/${tp.slug}`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.8,
            });
        }
        // Guide directory — one entry per make
        for (const make of ALL_MAKES) {
            if (!make) continue;
            staticPages.push({
                url: `${baseUrl}/guides/${slugify(make)}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.7,
            });
        }
        return staticPages;
    }

    // ── id 1..N: repair pages for one vehicle make ──────────────────
    const makeIndex = numId - 1;
    if (makeIndex < 0 || makeIndex >= ALL_MAKES.length) return [];

    const make = ALL_MAKES[makeIndex];
    if (!make) return [];
    const makeSlug = slugify(make);
    const models = VEHICLE_PRODUCTION_YEARS[make];
    if (!models) return [];
    const entries: MetadataRoute.Sitemap = [];

    for (const [model, productionYears] of Object.entries(models)) {
        if (!model || !productionYears) continue;
        const modelSlug = slugify(model);
        const startYear = Math.max(productionYears.start, SITEMAP_YEAR_MIN);
        const endYear = Math.min(productionYears.end, SITEMAP_YEAR_MAX);
        if (startYear > endYear) continue;

        // Guide directory — make/model level
        entries.push({
            url: `${baseUrl}/guides/${makeSlug}/${modelSlug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        });

        // Repair pages — every year × every task
        for (let year = startYear; year <= endYear; year++) {
            for (const task of VALID_TASKS) {
                entries.push({
                    url: `${baseUrl}/repair/${year}/${makeSlug}/${modelSlug}/${task}`,
                    lastModified: new Date(),
                    changeFrequency: 'monthly',
                    priority: 0.7,
                });
            }
        }
    }

    return entries;
}
