import { MetadataRoute } from 'next'
import { TOOL_PAGES } from '@/data/tools-pages';
import { slugifyRoutePart, NOINDEX_MAKES, isNonUsModel } from '@/data/vehicles';
import { getSitemapLastMod } from '@/lib/sitemap';

const LAST_MOD = getSitemapLastMod();

/**
 * Maintenance sitemap — every year/make/model combo that has at least one
 * corpus-backed tool page (oil-type, coolant-type, tire-size, etc.).
 *
 * These maintenance hub pages are high-value, vehicle-specific spec pages
 * that aggregate all available maintenance data for a given vehicle.
 * They are dynamically rendered via ISR and should be indexed aggressively.
 *
 * NOTE: Individual spec-type sub-pages (e.g. /maintenance/2020/toyota/camry/oil-type)
 * are intentionally NOT included — the hub page links to all available specs
 * and bots will discover them naturally via internal links.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://alloemmanuals.com';
    const entries: MetadataRoute.Sitemap = [];

    // Landing page
    entries.push({
        url: `${baseUrl}/maintenance`,
        lastModified: LAST_MOD,
        changeFrequency: 'weekly',
        priority: 0.85,
    });

    // Collect unique year/make/model combos from corpus-backed tool pages.
    // Each tool page has generations with year ranges — expand those into
    // individual year entries so crawlers discover every vehicle variant.
    const seen = new Set<string>();

    for (const page of TOOL_PAGES) {
        if (!page?.make || !page?.model || !page?.generations) continue;

        const makeSlug = slugifyRoutePart(page.make);
        const modelSlug = slugifyRoutePart(page.model);

        if (NOINDEX_MAKES.has(makeSlug) || isNonUsModel(makeSlug, modelSlug)) continue;

        for (const gen of page.generations) {
            if (!gen.years) continue;
            const parts = gen.years.split('-').map((s: string) => s.trim());
            const start = parseInt(parts[0], 10);
            const end = parts.length > 1 ? parseInt(parts[1], 10) : start;
            if (isNaN(start)) continue;

            for (let year = start; year <= (isNaN(end) ? start : end); year++) {
                const key = `${year}/${makeSlug}/${modelSlug}`;
                if (seen.has(key)) continue;
                seen.add(key);

                entries.push({
                    url: `${baseUrl}/maintenance/${year}/${makeSlug}/${modelSlug}`,
                    lastModified: LAST_MOD,
                    changeFrequency: 'monthly',
                    priority: 0.7,
                });
            }
        }
    }

    return entries;
}
