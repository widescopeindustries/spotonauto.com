import { VEHICLE_PRODUCTION_YEARS, VALID_TASKS, NOINDEX_MAKES } from '@/data/vehicles';

function slugify(s: string) {
    return s.toLowerCase().replace(/\s+/g, '-');
}

const LAST_MOD = '2026-03-01';
const YEAR_STEP = 5;
const URLS_PER_SITEMAP = 45000;

interface SitemapEntry {
    url: string;
    lastmod: string;
    changefreq: string;
    priority: number;
}

function buildAllEntries(): SitemapEntry[] {
    const baseUrl = 'https://spotonauto.com';
    const entries: SitemapEntry[] = [];

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
                        lastmod: LAST_MOD,
                        changefreq: 'monthly',
                        priority: year === years.end ? 0.8 : 0.6,
                    });
                }
            }
        }
    }

    return entries;
}

export function generateStaticParams() {
    const total = buildAllEntries().length;
    const count = Math.ceil(total / URLS_PER_SITEMAP);
    return Array.from({ length: count }, (_, i) => ({ id: `${i}.xml` }));
}

export async function GET(
    _request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const { id: rawId } = await props.params;
    const id = Number(rawId.replace('.xml', ''));

    const all = buildAllEntries();
    const total = all.length;
    const maxChunks = Math.ceil(total / URLS_PER_SITEMAP);

    if (isNaN(id) || id < 0 || id >= maxChunks) {
        return new Response('Not found', { status: 404 });
    }

    const start = id * URLS_PER_SITEMAP;
    const chunk = all.slice(start, start + URLS_PER_SITEMAP);

    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...chunk.map(e =>
            `<url><loc>${e.url}</loc><lastmod>${e.lastmod}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`
        ),
        '</urlset>',
    ].join('\n');

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
    });
}
