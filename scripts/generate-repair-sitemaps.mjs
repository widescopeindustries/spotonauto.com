/**
 * Generate repair sitemap XML files as static assets in public/.
 * Run before `next build` so Vercel serves them directly from CDN
 * with NO Next.js processing (no Vary: rsc headers, no RSC pipeline).
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'repair', 'sitemap');
const INDEX_PATH = join(ROOT, 'public', 'repair', 'sitemap.xml');

const LAST_MOD = '2026-03-01';
const YEAR_STEP = 5;
// Keep chunks small and stable for crawler fetch reliability.
const URLS_PER_SITEMAP = 10000;
const BASE_URL = 'https://spotonauto.com';

function slugify(s) {
    return s.toLowerCase().replace(/\s+/g, '-');
}

function escapeXml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Inline the vehicle data and tasks to avoid TS import issues
// These must stay in sync with src/data/vehicles.ts
const { VEHICLE_PRODUCTION_YEARS, VALID_TASKS, NOINDEX_MAKES } = await import(
    '../src/data/vehicles.ts'
).catch(() => {
    // Fallback: read and eval the TS file (strips types at import)
    throw new Error(
        'Could not import vehicles.ts — run with --experimental-strip-types or tsx'
    );
});

function buildAllEntries() {
    const entries = [];

    for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
        if (NOINDEX_MAKES.has(make.toLowerCase())) continue;
        const makeSlug = slugify(make);

        for (const [model, years] of Object.entries(models)) {
            const modelSlug = slugify(model);

            const sampledYears = new Set();
            sampledYears.add(years.start);
            sampledYears.add(years.end);
            for (let y = years.start; y <= years.end; y += YEAR_STEP) {
                sampledYears.add(y);
            }

            for (const year of sampledYears) {
                for (const task of VALID_TASKS) {
                    entries.push({
                        url: `${BASE_URL}/repair/${year}/${makeSlug}/${modelSlug}/${task}`,
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

// Generate
const all = buildAllEntries();
const chunkCount = Math.ceil(all.length / URLS_PER_SITEMAP);

mkdirSync(OUT_DIR, { recursive: true });

for (let i = 0; i < chunkCount; i++) {
    const chunk = all.slice(i * URLS_PER_SITEMAP, (i + 1) * URLS_PER_SITEMAP);
    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...chunk.map(
            (e) =>
                `<url><loc>${escapeXml(e.url)}</loc><lastmod>${e.lastmod}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`
        ),
        '</urlset>',
    ].join('\n');

    const outPath = join(OUT_DIR, `${i}.xml`);
    writeFileSync(outPath, xml, 'utf-8');
    console.log(`✓ ${outPath} — ${chunk.length} URLs`);
}

// Generate repair sitemap index so robots only needs one stable entry point.
const indexXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...Array.from({ length: chunkCount }, (_, i) => [
        '<sitemap>',
        `<loc>${BASE_URL}/repair/sitemap/${i}.xml</loc>`,
        `<lastmod>${LAST_MOD}</lastmod>`,
        '</sitemap>',
    ].join('')),
    '</sitemapindex>',
].join('\n');

writeFileSync(INDEX_PATH, indexXml, 'utf-8');
console.log(`✓ ${INDEX_PATH} — ${chunkCount} child sitemaps`);

console.log(`\nGenerated ${chunkCount} repair sitemap chunks with ${all.length} total URLs`);
