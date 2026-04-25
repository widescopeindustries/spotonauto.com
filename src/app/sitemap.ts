import { MetadataRoute } from 'next'
import { SYMPTOM_CLUSTERS } from '@/data/symptomGraph';
import { VEHICLE_PRODUCTION_YEARS, NOINDEX_MAKES, isNonUsModel } from '@/data/vehicles';
import { TOOL_PAGES, TOOL_TYPE_META } from '@/data/tools-pages';
import { getSitemapLastMod } from '@/lib/sitemap';

function slugify(s: string) {
    return s.toLowerCase().replace(/\s+/g, '-');
}

const LAST_MOD = getSitemapLastMod();

/**
 * Main sitemap — static pages, tool pages, guide pages.
 *
 * Sub-sitemaps (served separately, discovered via robots.txt):
 *   /codes/sitemap.xml         — ~300 DTC code pages
 *   /community/sitemap.xml     — community category + thread pages
 *   /repair/sitemap.xml        — repair sitemap index -> chunked child files
 *
 * NOTE: /diagnose intentionally omitted — it sets canonical to /
 * and including it in the sitemap confuses crawlers.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://spotonauto.com';
    const entries: MetadataRoute.Sitemap = [];

    // ── Static pages ──────────────────────────────────────────────────
    entries.push(
        { url: baseUrl, lastModified: LAST_MOD, changeFrequency: 'daily', priority: 1 },
        { url: `${baseUrl}/tools`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.85 },
        { url: `${baseUrl}/guides`, lastModified: LAST_MOD, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${baseUrl}/cel`, lastModified: LAST_MOD, changeFrequency: 'weekly', priority: 0.75 },
        { url: `${baseUrl}/second-opinion`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${baseUrl}/parts`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.65 },
        { url: `${baseUrl}/repair`, lastModified: LAST_MOD, changeFrequency: 'weekly', priority: 0.82 },
        { url: `${baseUrl}/symptoms`, lastModified: LAST_MOD, changeFrequency: 'weekly', priority: 0.78 },
        { url: `${baseUrl}/wiring`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/community`, lastModified: LAST_MOD, changeFrequency: 'daily', priority: 0.7 },
        { url: `${baseUrl}/about`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${baseUrl}/author/spotonauto-editorial-team`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.45 },
        { url: `${baseUrl}/author/lyndon-bedford`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.45 },
        { url: `${baseUrl}/blog/amazon-auto-parts-by-vehicle-year-and-type`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/contact`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.4 },
        { url: `${baseUrl}/privacy-policy`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.35 },
        { url: `${baseUrl}/terms-of-service`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.35 },
        { url: `${baseUrl}/disclaimer`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.35 },
        { url: `${baseUrl}/privacy`, lastModified: LAST_MOD, changeFrequency: 'yearly', priority: 0.3 },
        { url: `${baseUrl}/terms`, lastModified: LAST_MOD, changeFrequency: 'yearly', priority: 0.3 },
    );

    // ── Tool pages (~1,850) ───────────────────────────────────────────
    for (const toolType of Object.keys(TOOL_TYPE_META)) {
        entries.push({
            url: `${baseUrl}/tools/type/${toolType}`,
            lastModified: LAST_MOD,
            changeFrequency: 'weekly',
            priority: 0.7,
        });
    }

    // ── Tool pages (~1,850) ───────────────────────────────────────────
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
        if (!make || NOINDEX_MAKES.has(make.toLowerCase())) continue;
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
            if (isNonUsModel(makeSlug, slugify(model))) continue;
            entries.push({
                url: `${baseUrl}/guides/${makeSlug}/${slugify(model)}`,
                lastModified: LAST_MOD,
                changeFrequency: 'weekly',
                priority: 0.7,
            });
        }
    }

    for (const cluster of SYMPTOM_CLUSTERS) {
        entries.push({
            url: `${baseUrl}/symptoms/${cluster.slug}`,
            lastModified: LAST_MOD,
            changeFrequency: 'weekly',
            priority: 0.72,
        });
    }

    return entries;
}
