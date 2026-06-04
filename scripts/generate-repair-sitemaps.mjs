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
    const pool = new Pool({ host: '127.0.0.1', port: 5432, database: 'spotonauto', user: 'spotonauto', password: 'spotonauto2026' });

    // 1. Get all profile keys from DB
    const { rows } = await pool.query('SELECT key FROM vehicle_repair_profiles');
    const entries = [];
    const hubUrls = new Set();

    for (const { key } of rows) {
        const [year, make, model, task] = key.split(':');
        if (!year || !make || !model || !task) continue;
        const url = `${BASE_URL}/repair/${year}/${make}/${model}/${task}`;
        entries.push({ url, lastmod: LAST_MOD, changefreq: 'weekly', priority: 0.9 });
        hubUrls.add(`${BASE_URL}/repair/${year}/${make}/${model}`);
    }

    // 2. Add hub pages for vehicles that have at least one qualified task
    for (const hubUrl of hubUrls) {
        entries.push({ url: hubUrl, lastmod: LAST_MOD, changefreq: 'weekly', priority: 0.85 });
    }

    // 3. Add VEHICLE_REPAIR_SPECS pages (year-specific only)
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
            const url = `${BASE_URL}/repair/${year}/${make}/${model}/${task}`;
            if (!entries.some((e) => e.url === url)) {
                entries.push({ url, lastmod: LAST_MOD, changefreq: 'weekly', priority: 0.88 });
                hubUrls.add(`${BASE_URL}/repair/${year}/${make}/${model}`);
            }
        }
    }

    await pool.end();

    // 4. Write chunks
    mkdirSync(OUT_DIR, { recursive: true });
    mkdirSync(WINNERS_DIR, { recursive: true });

    // Clean old chunks
    for (const f of readdirSync(OUT_DIR)) {
        if (f.endsWith('.xml')) unlinkSync(join(OUT_DIR, f));
    }

    entries.sort((a, b) => a.url.localeCompare(b.url));

    const chunks = [];
    for (let i = 0; i < entries.length; i += URLS_PER_SITEMAP) {
        const chunk = entries.slice(i, i + URLS_PER_SITEMAP);
        const chunkPath = join(OUT_DIR, `${i}.xml`);
        writeUrlSet(chunkPath, chunk);
        chunks.push({ loc: `${BASE_URL}/repair/sitemap/${i}.xml`, lastmod: LAST_MOD });
    }

    if (chunks.length === 0) {
        // Fallback: write empty sitemap index
        writeSitemapIndex(INDEX_PATH, []);
        console.log('⚠ No qualified repair URLs found — sitemap is empty');
    } else if (chunks.length === 1) {
        // Single chunk: write urlset directly to index path
        writeUrlSet(INDEX_PATH, entries);
        console.log(`✓ ${INDEX_PATH} — ${entries.length} URLs (single sitemap)`);
    } else {
        writeSitemapIndex(INDEX_PATH, chunks);
        console.log(`✓ ${INDEX_PATH} — ${chunks.length} chunks, ${entries.length} total URLs`);
    }

    // 5. Winners sitemap (recrawl priority)
    const winners = loadWinnerEntries();
    if (winners) {
        const winnerEntries = winners.urls.map((url) => ({ url, lastmod: LAST_MOD, changefreq: 'daily', priority: 0.95 }));
        writeUrlSet(WINNERS_SITEMAP_PATH, winnerEntries);
        writeFileSync(WINNERS_LIST_PATH, winners.urls.join('\n'), 'utf-8');
        console.log(`✓ ${WINNERS_SITEMAP_PATH} — ${winnerEntries.length} URLs from ${winners.reportName}`);
    }
}

main().catch((e) => { console.error(e); process.exit(1); });
