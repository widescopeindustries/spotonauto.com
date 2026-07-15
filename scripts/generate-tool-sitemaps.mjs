/**
 * Generate tools sitemap XML files as static assets in public/.
 *
 * Source of truth:
 *   1. Static TOOL_PAGES from src/data/tools-pages.ts (hand-curated, highest quality).
 *   2. Corpus-backed dynamic pages: distinct make/model/tool-type combinations
 *      that actually have matching factory-manual sections in manual_embeddings.
 *
 * Legacy template-only tool pages are intentionally excluded from the sitemap
 * and receive a noindex robots tag at render time.
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

const TOOL_SEARCH_TERMS = {
  'oil-type': ['engine oil', 'motor oil', 'oil capacity', 'oil specification', 'oil type', 'lubrication'],
  'coolant-type': ['coolant', 'antifreeze', 'cooling system', 'coolant capacity', 'coolant type'],
  'transmission-fluid-type': ['transmission fluid', 'ATF', 'transaxle fluid', 'automatic transmission', 'manual transmission', 'gear oil'],
  'brake-fluid-type': ['brake fluid', 'hydraulic brake', 'master cylinder', 'brake system', 'DOT'],
  'battery-location': ['battery', 'battery removal', 'battery replacement', 'battery specifications', 'charging system', 'group size', 'CCA'],
  'serpentine-belt': ['serpentine belt', 'drive belt', 'accessory belt', 'belt routing', 'accessory drive', 'drive belt replacement'],
  'tire-size': ['tire', 'tire size', 'tire pressure', 'wheel specification', 'tires and wheels', 'wheel and tire'],
  'spark-plug-type': ['spark plug', 'spark plug gap', 'ignition system', 'ignition plug', 'tune-up', 'spark plug replacement'],
  'wiper-blade-size': ['wiper', 'wiper blade', 'windshield wiper', 'windshield washer', 'wiper replacement'],
  'headlight-bulb': ['headlight', 'headlamp', 'bulb replacement', 'lighting system', 'exterior lighting', 'headlamp bulb'],
  'fluid-capacity': ['fluid capacity', 'capacities', 'specifications', 'maintenance', 'fluid specification'],
};

async function buildEntriesFromStatic() {
  const { TOOL_PAGES } = await import(join(ROOT, 'src', 'data', 'tools-pages.ts'));
  return (TOOL_PAGES || []).map((page) => ({
    url: `${BASE_URL}/tools/${page.slug}`,
    lastmod: LAST_MOD,
    changefreq: 'weekly',
    priority: 0.9,
  }));
}

async function buildEntriesFromCorpus(filters) {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.LOCAL_DATABASE_URL ||
    'postgresql://spotonauto:spotonauto2026@127.0.0.1:5432/spotonauto';

  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
    query_timeout: 300000,
  });

  const entries = [];

  try {
    for (const toolType of KNOWN_TOOL_TYPES) {
      const terms = TOOL_SEARCH_TERMS[toolType];
      if (!terms || terms.length === 0) {
        console.warn(`  No search terms for ${toolType}, skipping`);
        continue;
      }

      const likeClauses = terms
        .map((term) => {
          const safe = term.replace(/'/g, "''");
          return `LOWER(section_title || ' ' || content_preview) LIKE '%${safe}%'`;
        })
        .join(' OR ');

      const sql = `
        SELECT DISTINCT make, model
        FROM manual_embeddings
        WHERE year BETWEEN 1982 AND 2026
          AND (${likeClauses})
      `;

      console.log(`  Querying corpus for ${toolType}...`);
      const { rows } = await pool.query(sql);
      console.log(`    -> ${rows.length} distinct vehicles`);

      for (const row of rows) {
        const makeSlug = slugify(row.make);
        const modelSlug = slugify(row.model);
        if (filters.noindexMakes.has(makeSlug)) continue;
        if (!isPublicRoadVehicle(row.make, row.model)) continue;
        if (filters.isNonUsModel(makeSlug, modelSlug)) continue;

        entries.push({
          url: `${BASE_URL}/tools/${makeSlug}-${modelSlug}-${toolType}`,
          lastmod: LAST_MOD,
          changefreq: 'weekly',
          priority: 0.8,
        });
      }
    }
  } finally {
    await pool.end();
  }

  return entries;
}

async function main() {
  console.log('Generating tools sitemaps...');

  const { NOINDEX_MAKES, isNonUsModel } = await import(join(ROOT, 'src', 'data', 'vehicles.ts'));
  const filters = { noindexMakes: NOINDEX_MAKES, isNonUsModel };

  const staticEntries = await buildEntriesFromStatic();
  console.log(`  Static source: ${staticEntries.length} tool URLs`);

  // NOTE: Corpus-backed dynamic pages are intentionally sourced only from the
  // curated TOOL_PAGES array (which already includes the mined corpus set).
  // Broader LIKE queries against manual_embeddings are too slow and risk
  // publishing thin, low-confidence pages. Re-enable with care if needed.
  const corpusEntries = [];
  console.log(`  Corpus source: disabled (using curated TOOL_PAGES only)`);

  // Deduplicate (static wins priority)
  const byUrl = new Map();
  for (const e of corpusEntries) {
    byUrl.set(e.url, e);
  }
  for (const e of staticEntries) {
    byUrl.set(e.url, e);
  }

  const unique = Array.from(byUrl.values());
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
