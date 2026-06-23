/**
 * Generate manual sitemap XML files as static assets in public/.
 *
 * Manual browser URLs follow /manual/{make}/{year}/... but the deepest paths are
 * dynamic and backed by the CHARM corpus. We submit make/year landing pages
 * (which the manual browser renders as section navigation) so search engines can
 * discover the manual hierarchy without trying to enumerate every corpus section.
 *
 * Outputs:
 *   public/manual/sitemap.xml            — sitemap index
 *   public/manual/sitemap/0.xml ...      — chunked manual URLs
 */
import { writeFileSync, mkdirSync, readdirSync, unlinkSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'manual', 'sitemap');
const INDEX_PATH = join(ROOT, 'public', 'manual', 'sitemap.xml');
const VEHICLES_PATH = join(ROOT, 'src', 'data', 'validated-vehicles.json');

const LAST_MOD = process.env.SITEMAP_LAST_MOD || new Date().toISOString().slice(0, 10);
const URLS_PER_SITEMAP = 10000;
const BASE_URL = 'https://alloemmanuals.com';

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function writeUrlSet(path, entries) {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      (entry) =>
        `<url><loc>${escapeXml(entry.url)}</loc><lastmod>${entry.lastmod}</lastmod><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`,
    ),
    '</urlset>',
  ].join('\n');

  writeFileSync(path, xml, 'utf-8');
}

function buildEntriesFromValidatedJson(filters) {
  if (!existsSync(VEHICLES_PATH)) return [];

  const rawData = JSON.parse(readFileSync(VEHICLES_PATH, 'utf-8'));
  const entries = [];
  const makeYears = new Map();

  for (const [make, models] of Object.entries(rawData)) {
    const makeSlug = slugify(make);
    if (filters.noindexMakes.has(makeSlug)) continue;
    for (const [model, info] of Object.entries(models)) {
      if (filters.isNonUsModel(makeSlug, slugify(model))) continue;
      const start = info.start || 1982;
      const end = info.end || 2025;
      for (let year = start; year <= end; year++) {
        if (!makeYears.has(makeSlug)) makeYears.set(makeSlug, new Set());
        makeYears.get(makeSlug).add(year);
      }
    }
  }

  for (const [makeSlug, years] of makeYears) {
    // Make landing page
    entries.push({
      url: `${BASE_URL}/manual/${encodeURIComponent(makeSlug)}`,
      lastmod: LAST_MOD,
      changefreq: 'weekly',
      priority: 0.7,
    });
    // Make/year pages
    for (const year of years) {
      entries.push({
        url: `${BASE_URL}/manual/${encodeURIComponent(makeSlug)}/${year}`,
        lastmod: LAST_MOD,
        changefreq: 'weekly',
        priority: 0.65,
      });
    }
  }

  return entries;
}

async function buildEntriesFromDb(filters) {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.LOCAL_DATABASE_URL ||
    'postgresql://spotonauto:spotonauto2026@127.0.0.1:5432/spotonauto';

  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
    query_timeout: 60000,
  });

  try {
    console.log('Fetching distinct make/year combos from manual_embeddings...');
    const { rows } = await pool.query(`
      SELECT DISTINCT make, year
      FROM manual_embeddings
      ORDER BY make ASC, year DESC
    `);

    const makeYears = new Map();
    for (const row of rows) {
      const makeSlug = slugify(row.make);
      if (filters.noindexMakes.has(makeSlug)) continue;
      if (filters.isNonUsModel(makeSlug, slugify(row.model || ''))) continue;
      if (!makeYears.has(makeSlug)) makeYears.set(makeSlug, new Set());
      makeYears.get(makeSlug).add(Number(row.year));
    }

    const entries = [];
    for (const [makeSlug, years] of makeYears) {
      entries.push({
        url: `${BASE_URL}/manual/${encodeURIComponent(makeSlug)}`,
        lastmod: LAST_MOD,
        changefreq: 'weekly',
        priority: 0.7,
      });
      for (const year of years) {
        entries.push({
          url: `${BASE_URL}/manual/${encodeURIComponent(makeSlug)}/${year}`,
          lastmod: LAST_MOD,
          changefreq: 'weekly',
          priority: 0.65,
        });
      }
    }

    return entries;
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('Generating manual sitemaps...');

  const { NOINDEX_MAKES, isNonUsModel } = await import(join(ROOT, 'src', 'data', 'vehicles.ts'));
  const filters = { noindexMakes: NOINDEX_MAKES, isNonUsModel };

  let all;
  try {
    all = await buildEntriesFromDb(filters);
    console.log(`  DB source: ${all.length} manual URLs`);
  } catch (err) {
    console.warn('  Falling back to validated-vehicles.json:', err.message);
    all = buildEntriesFromValidatedJson(filters);
    console.log(`  JSON fallback: ${all.length} manual URLs`);
  }

  if (all.length === 0) {
    console.log('No URLs generated.');
    return;
  }

  // Deduplicate
  const seen = new Set();
  const unique = [];
  for (const e of all) {
    if (seen.has(e.url)) continue;
    seen.add(e.url);
    unique.push(e);
  }
  unique.sort((a, b) => a.url.localeCompare(b.url));

  const chunkCount = Math.ceil(unique.length / URLS_PER_SITEMAP);

  mkdirSync(OUT_DIR, { recursive: true });
  for (const name of readdirSync(OUT_DIR)) {
    if (name.endsWith('.xml')) {
      unlinkSync(join(OUT_DIR, name));
    }
  }

  for (let i = 0; i < chunkCount; i++) {
    const chunk = unique.slice(i * URLS_PER_SITEMAP, (i + 1) * URLS_PER_SITEMAP);
    const outPath = join(OUT_DIR, `${i}.xml`);
    writeUrlSet(outPath, chunk);
    console.log(`✓ ${outPath} — ${chunk.length} URLs`);
  }

  // Sitemap index
  const indexXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...Array.from({ length: chunkCount }, (_, i) =>
      [
        '<sitemap>',
        `<loc>${BASE_URL}/manual/sitemap/${i}.xml</loc>`,
        `<lastmod>${LAST_MOD}</lastmod>`,
        '</sitemap>',
      ].join(''),
    ),
    '</sitemapindex>',
  ].join('\n');

  writeFileSync(INDEX_PATH, indexXml, 'utf-8');
  console.log(`✓ ${INDEX_PATH} — ${chunkCount} child sitemaps`);
  console.log(`\nGenerated ${chunkCount} manual sitemap chunks with ${unique.length} total URLs`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
