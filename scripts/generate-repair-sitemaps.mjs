/**
 * Generate repair sitemap XML files as static assets in public/.
 * Run before `next build` so Vercel serves them directly from CDN
 * with NO Next.js processing (no Vary: rsc headers, no RSC pipeline).
 */
import { writeFileSync, mkdirSync, readdirSync, readFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'repair', 'sitemap');
const INDEX_PATH = join(ROOT, 'public', 'repair', 'sitemap.xml');
const REPORTS_DIR = join(ROOT, 'scripts', 'seo-reports');
const WINNERS_DIR = join(ROOT, 'public', 'repair', 'winners');
const WINNERS_SITEMAP_PATH = join(WINNERS_DIR, 'sitemap.xml');
const WINNERS_LIST_PATH = join(WINNERS_DIR, 'urls.txt');

const LAST_MOD = process.env.SITEMAP_LAST_MOD || new Date().toISOString().slice(0, 10);
const YEAR_STEP = 5;
// Keep chunks small and stable for crawler fetch reliability.
const URLS_PER_SITEMAP = 10000;
const BASE_URL = 'https://spotonauto.com';
const MAIN_SITEMAP_MIN_YEAR = 1995;
const TASK_MIN_YEAR = {
    'catalytic-converter-replacement': 1975,
    'oxygen-sensor-replacement': 1980,
    'egr-valve-replacement': 1975,
    'mass-air-flow-sensor-replacement': 1988,
    'crankshaft-sensor-replacement': 1988,
    'camshaft-sensor-replacement': 1988,
    'cabin-air-filter-replacement': 1990,
    'serpentine-belt-replacement': 1985,
    'turbo-replacement': 1980,
    'cv-axle-replacement': 1980,
    'glow-plug-replacement': 1980,
};

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

function getEligibleTasksForYear(year) {
    return VALID_TASKS.filter((task) => year >= (TASK_MIN_YEAR[task] ?? 1900));
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

    // Repair category hub pages (high priority — these link to all repair pages)
    entries.push({
        url: `${BASE_URL}/repairs`,
        lastmod: LAST_MOD,
        changefreq: 'weekly',
        priority: 0.9,
    });
    for (const task of VALID_TASKS) {
        entries.push({
            url: `${BASE_URL}/repairs/${task}`,
            lastmod: LAST_MOD,
            changefreq: 'weekly',
            priority: 0.9,
        });
    }

    // Individual repair guide pages
    for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
        if (NOINDEX_MAKES.has(make.toLowerCase())) continue;
        const makeSlug = slugify(make);

        for (const [model, years] of Object.entries(models)) {
            const modelSlug = slugify(model);

            const sampledYears = new Set();
            if (years.start >= MAIN_SITEMAP_MIN_YEAR) {
                sampledYears.add(years.start);
            }
            sampledYears.add(years.end);
            for (let y = Math.max(years.start, MAIN_SITEMAP_MIN_YEAR); y <= years.end; y += YEAR_STEP) {
                sampledYears.add(y);
            }

            for (const year of sampledYears) {
                entries.push({
                    url: `${BASE_URL}/repair/${year}/${makeSlug}/${modelSlug}`,
                    lastmod: LAST_MOD,
                    changefreq: 'weekly',
                    priority: year === years.end ? 0.82 : 0.72,
                });

                const eligibleTasks = getEligibleTasksForYear(year);
                for (const task of eligibleTasks) {
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

function findLatestRecrawlPriorityReport() {
    const reports = readdirSync(REPORTS_DIR)
        .map((name) => {
            const match = name.match(/^recrawl-priority-(\d{4}-\d{2}-\d{2})\.txt$/);
            return match ? { name, reportDate: match[1] } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.reportDate.localeCompare(a.reportDate));

    if (!reports.length) {
        return null;
    }

    return reports[0];
}

function loadWinnerEntries() {
    const latestReport = findLatestRecrawlPriorityReport();
    if (!latestReport) return null;
    const reportPath = join(REPORTS_DIR, latestReport.name);
    const urls = [...new Set(
        readFileSync(reportPath, 'utf-8')
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.startsWith(`${BASE_URL}/repair/`))
    )];

    return {
        reportName: latestReport.name,
        reportDate: latestReport.reportDate,
        urls,
    };
}

function writeUrlSet(path, entries) {
    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...entries.map(
            (entry) =>
                `<url><loc>${escapeXml(entry.url)}</loc><lastmod>${entry.lastmod}</lastmod><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`
        ),
        '</urlset>',
    ].join('\n');

    writeFileSync(path, xml, 'utf-8');
}

// Generate
const all = buildAllEntries();
const chunkCount = Math.ceil(all.length / URLS_PER_SITEMAP);

mkdirSync(OUT_DIR, { recursive: true });
for (const name of readdirSync(OUT_DIR)) {
    if (name.endsWith('.xml')) {
        unlinkSync(join(OUT_DIR, name));
    }
}

for (let i = 0; i < chunkCount; i++) {
    const chunk = all.slice(i * URLS_PER_SITEMAP, (i + 1) * URLS_PER_SITEMAP);
    const outPath = join(OUT_DIR, `${i}.xml`);
    writeUrlSet(outPath, chunk);
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

const winners = loadWinnerEntries();
if (winners) {
    mkdirSync(WINNERS_DIR, { recursive: true });

    const winnerEntries = winners.urls.map((url) => ({
        url,
        lastmod: winners.reportDate,
        changefreq: 'weekly',
        priority: 0.95,
    }));

    writeUrlSet(WINNERS_SITEMAP_PATH, winnerEntries);
    writeFileSync(WINNERS_LIST_PATH, `${winners.urls.join('\n')}\n`, 'utf-8');
    console.log(`✓ ${WINNERS_SITEMAP_PATH} — ${winnerEntries.length} URLs from ${winners.reportName}`);
    console.log(`✓ ${WINNERS_LIST_PATH} — ${winnerEntries.length} URLs`);
} else {
    console.log(`⚠ No recrawl-priority report found — skipping winner sitemap`);
}

console.log(`\nGenerated ${chunkCount} repair sitemap chunks with ${all.length} total URLs`);
