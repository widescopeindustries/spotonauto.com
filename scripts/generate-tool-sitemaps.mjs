/**
 * Generate tools sitemap XML files as static assets in public/.
 *
 * Source of truth: manual_embeddings Postgres table (distinct make/year/model).
 * This ensures every vehicle that has a hub page also gets tool pages discovered
 * by search engines, matching the dynamic tool page renderer which falls back to
 * corpus data and legacy templates for any valid vehicle/tool-type combination.
 *
 * Outputs:
 *   public/tools/sitemap.xml            — sitemap index
 *   public/tools/sitemap/0.xml ...      — chunked tool URLs
 */
import { writeFileSync, mkdirSync, readdirSync, unlinkSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'tools', 'sitemap');
const INDEX_PATH = join(ROOT, 'public', 'tools', 'sitemap.xml');
const VEHICLES_PATH = join(ROOT, 'src', 'data', 'validated-vehicles.json');

const LAST_MOD = process.env.SITEMAP_LAST_MOD || new Date().toISOString().slice(0, 10);
const URLS_PER_SITEMAP = 10000;
const BASE_URL = 'https://alloemmanuals.com';

const KNOWN_TOOL_TYPES = [
  'oil-type',
  'battery-location',
  'tire-size',
  'serpentine-belt',
  'headlight-bulb',
  'fluid-capacity',
  'spark-plug-type',
  'wiper-blade-size',
  'coolant-type',
  'transmission-fluid-type',
  'brake-fluid-type',
];

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-cr-v(?=-|$)/g, '-crv');
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const NON_ROAD_VEHICLE_PATTERN =
  /\b(trailer|scooter|motorcycle|motocross|enduro|atv|utv|quad|snowmobile|roadking|softail|sportster|electra\s+glide|heritage\s+classic|fat\s+boy|shadow\s+ace|gold\s+wing|vulcan|hayabusa|ninja|gsx-r|rm-z|xr\d|crf\d|dr\d|yz[f]?\d|vt\d|cbr\d|klr\d|intruder|boulevard|virago|v-star|roadstar|nighthawk|speedfight|manufacturing)\b/i;

function isPublicRoadVehicle(make, model) {
  return !NON_ROAD_VEHICLE_PATTERN.test(`${make} ${model}`);
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

  for (const [make, models] of Object.entries(rawData)) {
    const makeSlug = slugify(make);
    if (filters.noindexMakes.has(makeSlug)) continue;
    for (const [model, info] of Object.entries(models)) {
      const modelSlug = slugify(model);
      if (!isPublicRoadVehicle(make, model)) continue;
      if (filters.isNonUsModel(makeSlug, modelSlug)) continue;

      for (const toolType of KNOWN_TOOL_TYPES) {
        entries.push({
          url: `${BASE_URL}/tools/${makeSlug}-${modelSlug}-${toolType}`,
          lastmod: LAST_MOD,
          changefreq: 'weekly',
          priority: 0.8,
        });
      }
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
    console.log('Fetching distinct vehicles from manual_embeddings for tools sitemap...');
    const { rows } = await pool.query(`
      SELECT DISTINCT make, model
      FROM manual_embeddings
      ORDER BY make ASC, model ASC
    `);

    const entries = [];
    for (const row of rows) {
      const makeSlug = slugify(row.make);
      const modelSlug = slugify(row.model);
      if (filters.noindexMakes.has(makeSlug)) continue;
      if (!isPublicRoadVehicle(row.make, row.model)) continue;
      if (filters.isNonUsModel(makeSlug, modelSlug)) continue;

      for (const toolType of KNOWN_TOOL_TYPES) {
        entries.push({
          url: `${BASE_URL}/tools/${makeSlug}-${modelSlug}-${toolType}`,
          lastmod: LAST_MOD,
          changefreq: 'weekly',
          priority: 0.8,
        });
      }
    }

    return entries;
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('Generating tools sitemaps...');

  const { NOINDEX_MAKES, isNonUsModel } = await import(join(ROOT, 'src', 'data', 'vehicles.ts'));
  const filters = { noindexMakes: NOINDEX_MAKES, isNonUsModel };

  let all;
  try {
    all = await buildEntriesFromDb(filters);
    console.log(`  DB source: ${all.length} tool URLs`);
  } catch (err) {
    console.warn('  Falling back to validated-vehicles.json:', err.message);
    all = buildEntriesFromValidatedJson(filters);
    console.log(`  JSON fallback: ${all.length} tool URLs`);
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
        `<loc>${BASE_URL}/tools/sitemap/${i}.xml</loc>`,
        `<lastmod>${LAST_MOD}</lastmod>`,
        '</sitemap>',
      ].join(''),
    ),
    '</sitemapindex>',
  ].join('\n');

  writeFileSync(INDEX_PATH, indexXml, 'utf-8');
  console.log(`✓ ${INDEX_PATH} — ${chunkCount} child sitemaps`);
  console.log(`\nGenerated ${chunkCount} tools sitemap chunks with ${unique.length} total URLs`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
