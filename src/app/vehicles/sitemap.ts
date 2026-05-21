import { MetadataRoute } from 'next'
import { VEHICLE_PRODUCTION_YEARS, NOINDEX_MAKES, isNonUsModel, slugifyRoutePart } from '@/data/vehicles';
import { getSitemapLastMod } from '@/lib/sitemap';

function slugify(s: string) {
    return slugifyRoutePart(s);
}

const LAST_MOD = getSitemapLastMod();

/**
 * Vehicle hub sitemap — every valid year/make/model combination.
 *
 * Generated from VEHICLE_PRODUCTION_YEARS, excluding:
 *   - NOINDEX_MAKES (low-value / spam-prone brands)
 *   - Non-US models (import-only vehicles without US service data)
 *
 * Vehicle hub pages serve as anchor pages linking to repair guides,
 * DTC codes, wiring diagrams, and factory manual sections for each
 * specific vehicle. They are high-intent landing pages and should be
 * indexed aggressively.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://alloemmanuals.com';
    const entries: MetadataRoute.Sitemap = [];

    // Landing page
    entries.push({
        url: `${baseUrl}/vehicles`,
        lastModified: LAST_MOD,
        changeFrequency: 'weekly',
        priority: 0.85,
    });

    for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
        if (!make || NOINDEX_MAKES.has(make.toLowerCase())) continue;
        const makeSlug = slugify(make);

        for (const [model, range] of Object.entries(models)) {
            if (!model) continue;
            if (isNonUsModel(makeSlug, slugify(model))) continue;

            for (let year = range.start; year <= range.end; year++) {
                entries.push({
                    url: `${baseUrl}/vehicles/${year}/${makeSlug}/${slugify(model)}`,
                    lastModified: LAST_MOD,
                    changeFrequency: 'monthly',
                    priority: 0.75,
                });
            }
        }
    }

    return entries;
}
