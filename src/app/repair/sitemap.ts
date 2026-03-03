import { MetadataRoute } from 'next'
import { VEHICLE_PRODUCTION_YEARS, VALID_TASKS, NOINDEX_MAKES } from '@/data/vehicles';

function slugify(s: string) {
    return s.toLowerCase().replace(/\s+/g, '-');
}

const LAST_MOD = '2026-03-01';
const YEAR_STEP = 5;
const URLS_PER_SITEMAP = 45000;

/** Build all repair URLs once, then slice per sitemap chunk */
function buildAllEntries(): MetadataRoute.Sitemap {
    const baseUrl = 'https://spotonauto.com';
    const entries: MetadataRoute.Sitemap = [];

    for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
        if (NOINDEX_MAKES.has(make.toLowerCase())) continue;
        const makeSlug = slugify(make);

        for (const [model, years] of Object.entries(models)) {
            const modelSlug = slugify(model);

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

/**
 * Tell Next.js how many sitemap chunks we need.
 * Generates /repair/sitemap/0.xml, /repair/sitemap/1.xml, etc.
 */
export async function generateSitemaps() {
    const total = buildAllEntries().length;
    const count = Math.ceil(total / URLS_PER_SITEMAP);
    return Array.from({ length: count }, (_, i) => ({ id: i }));
}

/**
 * Return the URLs for a specific sitemap chunk.
 */
export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
    const all = buildAllEntries();
    const start = id * URLS_PER_SITEMAP;
    return all.slice(start, start + URLS_PER_SITEMAP);
}
