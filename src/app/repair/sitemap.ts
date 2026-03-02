import { MetadataRoute } from 'next'
import { VEHICLE_PRODUCTION_YEARS, VALID_TASKS, NOINDEX_MAKES } from '@/data/vehicles';

function slugify(s: string) {
    return s.toLowerCase().replace(/\s+/g, '-');
}

const LAST_MOD = '2026-03-01';
const YEAR_STEP = 5; // Sample every 5th year across production range

/**
 * Repair sub-sitemap — ALL 46 repair tasks × ~310 models × sampled years.
 * Samples: start year, every 5th year, and end year for each model.
 * ~50,000–70,000 URLs. Next.js includes this in the sitemap index automatically.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://spotonauto.com';
    const entries: MetadataRoute.Sitemap = [];

    for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
        if (NOINDEX_MAKES.has(make.toLowerCase())) continue; // Skip low-relevance brands
        const makeSlug = slugify(make);

        for (const [model, years] of Object.entries(models)) {
            const modelSlug = slugify(model);

            // Build sampled years: start, every 5th, and end
            const sampledYears = new Set<number>();
            sampledYears.add(years.start);
            sampledYears.add(years.end);
            for (let y = years.start; y <= years.end; y += YEAR_STEP) {
                sampledYears.add(y);
            }

            for (const year of sampledYears) {
                for (const task of VALID_TASKS) {
                    entries.push({
                        url: `${baseUrl}/repair/${year}/${makeSlug}/${modelSlug}/${task}`,
                        lastModified: LAST_MOD,
                        changeFrequency: 'monthly',
                        priority: year === years.end ? 0.8 : 0.6,
                    });
                }
            }
        }
    }

    return entries;
}
