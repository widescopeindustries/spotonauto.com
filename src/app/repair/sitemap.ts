import { MetadataRoute } from 'next'
import { VEHICLE_PRODUCTION_YEARS, VALID_TASKS } from '@/data/vehicles';

function slugify(s: string) {
    return s.toLowerCase().replace(/\s+/g, '-');
}

const LAST_MOD = '2026-03-01';

/**
 * Repair sub-sitemap — ALL 46 repair tasks × ~310 models (newest year).
 * ~14,260 URLs. Next.js includes this in the sitemap index automatically.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://spotonauto.com';
    const entries: MetadataRoute.Sitemap = [];

    for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
        const makeSlug = slugify(make);

        for (const [model, years] of Object.entries(models)) {
            const modelSlug = slugify(model);
            const latestYear = years.end;

            for (const task of VALID_TASKS) {
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
