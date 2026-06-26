import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'repair', 'sitemap');
const INDEX_PATH = join(ROOT, 'public', 'repair', 'sitemap.xml');
const REPORTS_DIR = join(ROOT, 'scripts', 'seo-reports');
const WINNERS_DIR = join(ROOT, 'public', 'repair', 'winners');
const WINNERS_SITEMAP_PATH = join(WINNERS_DIR, 'sitemap.xml');
const WINNERS_LIST_PATH = join(WINNERS_DIR, 'urls.txt');
const VEHICLES_PATH = join(ROOT, 'src', 'data', 'validated-vehicles.json');

const LAST_MOD = process.env.SITEMAP_LAST_MOD || new Date().toISOString().slice(0, 10);
const URLS_PER_SITEMAP = 10000;
const BASE_URL = 'https://alloemmanuals.com';

function escapeXml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function writeUrlSet(path, entries) {
    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...entries.map((e) => `<url><loc>${escapeXml(e.url)}</loc><lastmod>${e.lastmod}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`),
        '</urlset>',
    ].join('\n');
    writeFileSync(path, xml, 'utf-8');
}

function writeSitemapIndex(path, chunks) {
    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...chunks.map((c) => `<sitemap><loc>${escapeXml(c.loc)}</loc><lastmod>${c.lastmod}</lastmod></sitemap>`),
        '</sitemapindex>',
    ].join('\n');
    writeFileSync(path, xml, 'utf-8');
}

function slugify(value) {
    return String(value)
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function findLatestRecrawlPriorityReport() {
    if (!existsSync(REPORTS_DIR)) return null;
    const reports = readdirSync(REPORTS_DIR)
        .map((name) => {
            const match = name.match(/^recrawl-priority-(\d{4}-\d{2}-\d{2})\.txt$/);
            return match ? { name, reportDate: match[1] } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.reportDate.localeCompare(a.reportDate));
    return reports.length ? reports[0] : null;
}

function loadWinnerEntries() {
    const latest = findLatestRecrawlPriorityReport();
    if (!latest) return null;
    const raw = readFileSync(join(REPORTS_DIR, latest.name), 'utf-8');
    const lines = raw.split('\n').map((l) => l.trim()).filter((l) => l.startsWith(`${BASE_URL}/repair/`));
    const fixed = lines.map((l) => l.replace('/honda/cr-v/', '/honda/crv/'));
    const urls = [...new Set(fixed)];
    return { reportName: latest.name, reportDate: latest.reportDate, urls };
}

async function main() {
    const connectionString =
        process.env.DATABASE_URL ||
        process.env.LOCAL_DATABASE_URL ||
        'postgresql://spotonauto:spotonauto2026@127.0.0.1:5432/spotonauto';

    const pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 10000,
        query_timeout: 30000,
    });

    // Load filters and helpers from vehicle data
    const {
        NOINDEX_MAKES,
        isNonUsModel,
        isEvModel,
        ICE_ONLY_TASKS,
        VALID_TASKS,
        slugifyRoutePart,
    } = await import(join(ROOT, 'src', 'data', 'vehicles.ts'));

    function shouldIndex(year, make, model) {
        if (!make || NOINDEX_MAKES.has(make.toLowerCase())) return false;
        if (isNonUsModel(make, model)) return false;
        return true;
    }

    const entries = [];
    let skippedNoindex = 0;

    function addRepairUrl(year, make, model, task, priority = 0.9) {
        if (!shouldIndex(year, make, model)) { skippedNoindex++; return; }
        if (isEvModel(make, model) && ICE_ONLY_TASKS.has(task)) return;
        const makeSlug = slugifyRoutePart(make);
        const modelSlug = slugifyRoutePart(model);
        const url = `${BASE_URL}/repair/${year}/${makeSlug}/${modelSlug}/${task}`;
        entries.push({ url, lastmod: LAST_MOD, changefreq: 'weekly', priority });
    }

    // ── 1. Curated vehicle/task corpus from validated-vehicles.json ──────────
    // This is the primary source: every model's confirmed year range × its task list.
    let corpusVehicles = 0;
    let corpusTasks = 0;
    if (existsSync(VEHICLES_PATH)) {
        const validated = JSON.parse(readFileSync(VEHICLES_PATH, 'utf-8'));
        for (const [make, models] of Object.entries(validated)) {
            const makeSlug = slugifyRoutePart(make);
            if (NOINDEX_MAKES.has(makeSlug)) continue;
            for (const [model, info] of Object.entries(models)) {
                if (isNonUsModel(makeSlug, slugifyRoutePart(model))) continue;
                const modelSlug = slugifyRoutePart(model);
                const start = info.start || 1982;
                const end = info.end || 2025;
                const tasks = info.tasks || VALID_TASKS || [];
                for (let year = start; year <= end; year++) {
                    corpusVehicles++;
                    for (const task of tasks) {
                        addRepairUrl(year, makeSlug, modelSlug, task, 0.9);
                        corpusTasks++;
                    }
                }
            }
        }
    }

    // ── 2. DB-generated repair profiles (catches anything not in JSON) ───────
    try {
        const { rows } = await pool.query('SELECT key FROM vehicle_repair_profiles');
        for (const { key } of rows) {
            const [year, make, model, task] = key.split(':');
            if (!year || !make || !model || !task) continue;
            addRepairUrl(year, make, model, task, 0.92);
        }
    } catch (err) {
        console.warn('Could not load vehicle_repair_profiles:', err.message);
    }

    // ── 3. Static VEHICLE_REPAIR_SPECS pages (year-specific only) ────────────
    const { VEHICLE_REPAIR_SPECS } = await import(join(ROOT, 'src', 'data', 'vehicle-repair-specs.ts'));
    for (const key of Object.keys(VEHICLE_REPAIR_SPECS)) {
        const parts = key.split('::');
        if (parts.length !== 2) continue;
        const [vehiclePart, task] = parts;
        const segs = vehiclePart.split('-');
        if (segs.length >= 3 && /^\d{4}$/.test(segs[0])) {
            const year = segs[0];
            const make = segs[1];
            const model = segs.slice(2).join('-');
            addRepairUrl(year, make, model, task, 0.93);
        }
    }

    await pool.end();

    console.log(`Skipped ${skippedNoindex} noindex / non-US URLs`);
    console.log(`Curated corpus: ${corpusVehicles} vehicle-years, ${corpusTasks} tasks`);

    // ── 5. Deduplicate and write chunks ──────────────────────────────────────
    mkdirSync(OUT_DIR, { recursive: true });
    mkdirSync(WINNERS_DIR, { recursive: true });

    // Clean old chunks
    for (const f of readdirSync(OUT_DIR)) {
        if (f.endsWith('.xml')) unlinkSync(join(OUT_DIR, f));
    }

    const seen = new Set();
    const uniqueEntries = [];
    for (const e of entries) {
        if (seen.has(e.url)) continue;
        seen.add(e.url);
        uniqueEntries.push(e);
    }
    uniqueEntries.sort((a, b) => a.url.localeCompare(b.url));

    const chunks = [];
    for (let i = 0; i < uniqueEntries.length; i += URLS_PER_SITEMAP) {
        const chunk = uniqueEntries.slice(i, i + URLS_PER_SITEMAP);
        const chunkPath = join(OUT_DIR, `${i}.xml`);
        writeUrlSet(chunkPath, chunk);
        chunks.push({ loc: `${BASE_URL}/repair/sitemap/${i}.xml`, lastmod: LAST_MOD });
    }

    if (chunks.length === 0) {
        writeSitemapIndex(INDEX_PATH, []);
        console.log('⚠ No qualified repair URLs found — sitemap is empty');
    } else if (chunks.length === 1) {
        writeUrlSet(INDEX_PATH, uniqueEntries);
        console.log(`✓ ${INDEX_PATH} — ${uniqueEntries.length} URLs (single sitemap)`);
    } else {
        writeSitemapIndex(INDEX_PATH, chunks);
        console.log(`✓ ${INDEX_PATH} — ${chunks.length} chunks, ${uniqueEntries.length} total URLs`);
    }

    // ── 6. Winners sitemap (recrawl priority) ────────────────────────────────
    const winners = loadWinnerEntries();
    if (winners) {
        const winnerEntries = winners.urls.map((url) => ({ url, lastmod: LAST_MOD, changefreq: 'daily', priority: 0.95 }));
        writeUrlSet(WINNERS_SITEMAP_PATH, winnerEntries);
        writeFileSync(WINNERS_LIST_PATH, winners.urls.join('\n'), 'utf-8');
        console.log(`✓ ${WINNERS_SITEMAP_PATH} — ${winnerEntries.length} URLs from ${winners.reportName}`);
    }
}

main().catch((e) => { console.error(e); process.exit(1); });
