import { MetadataRoute } from 'next'
import { VEHICLE_PRODUCTION_YEARS, VALID_TASKS } from '@/data/vehicles';

// Only generate years within our target range that also match production years
const SITEMAP_YEAR_MIN = 1982;
const SITEMAP_YEAR_MAX = 2024;

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://spotonauto.com';
    const entries: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/parts`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/diagnose`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/cel`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
    ];

    // Generate only valid vehicle/year combinations
    for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
        const makeSlug = make.toLowerCase().replace(/\s+/g, '-');

        for (const [model, productionYears] of Object.entries(models)) {
            const modelSlug = model.toLowerCase().replace(/\s+/g, '-');

            // Calculate valid year range for this model within our sitemap bounds
            const startYear = Math.max(productionYears.start, SITEMAP_YEAR_MIN);
            const endYear = Math.min(productionYears.end, SITEMAP_YEAR_MAX);

            // Skip if no valid years in range
            if (startYear > endYear) continue;

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
    }

    return entries;
}
