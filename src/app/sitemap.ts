import { MetadataRoute } from 'next'
import { VEHICLE_PRODUCTION_YEARS, VALID_TASKS } from '@/data/vehicles';
import { TOOL_PAGES } from '@/data/tools-pages';

const SITEMAP_YEAR_MIN = 2000;
const SITEMAP_YEAR_MAX = 2025;

// Top makes to include repair pages for (keeps sitemap manageable)
const TOP_MAKES = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai',
    'Kia', 'Jeep', 'Subaru', 'BMW', 'Dodge', 'GMC', 'Mazda',
    'Volkswagen', 'Lexus', 'Mercedes-Benz',
];

function slugify(s: string) {
    return s.toLowerCase().replace(/\s+/g, '-');
}

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

    // Tool pages (all 1,854)
    for (const tp of TOOL_PAGES) {
        if (!tp?.slug) continue;
        entries.push({
            url: `${baseUrl}/tools/${tp.slug}`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        });
    }

    // Guide directory — one entry per make
    const allMakes = Object.keys(VEHICLE_PRODUCTION_YEARS);
    for (const make of allMakes) {
        if (!make) continue;
        entries.push({
            url: `${baseUrl}/guides/${slugify(make)}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        });

        // Guide model pages
        const models = VEHICLE_PRODUCTION_YEARS[make];
        if (!models) continue;
        for (const model of Object.keys(models)) {
            if (!model) continue;
            entries.push({
                url: `${baseUrl}/guides/${slugify(make)}/${slugify(model)}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.7,
            });
        }
    }

    // Repair pages — top makes only to keep size manageable
    for (const make of TOP_MAKES) {
        const models = VEHICLE_PRODUCTION_YEARS[make];
        if (!models) continue;
        const makeSlug = slugify(make);

        for (const [model, productionYears] of Object.entries(models)) {
            if (!model || !productionYears) continue;
            const modelSlug = slugify(model);
            const startYear = Math.max(productionYears.start, SITEMAP_YEAR_MIN);
            const endYear = Math.min(productionYears.end, SITEMAP_YEAR_MAX);
            if (startYear > endYear) continue;

            for (let year = startYear; year <= endYear; year++) {
                for (const task of VALID_TASKS) {
                    entries.push({
                        url: `${baseUrl}/repair/${year}/${makeSlug}/${modelSlug}/${task}`,
                        lastModified: new Date(),
                        changeFrequency: 'monthly',
                        priority: 0.6,
                    });
                }
            }
        }
    }

    return entries;
}
