/**
 * Generate tools sitemap XML files as static assets in public/.
 * Same chunked strategy as generate-wiring-sitemaps.mjs and generate-repair-sitemaps.mjs.
 *
 * Outputs:
 *   public/tools/sitemap.xml            — sitemap index
 *   public/tools/sitemap/0.xml ...      — chunked tool URLs
 *
 * Run: node scripts/generate-tool-sitemaps.mjs
 */
import { writeFileSync, mkdirSync, readdirSync, unlinkSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

const NON_ROAD_VEHICLE_PATTERN =
  /\b(trailer|scooter|motorcycle|motocross|enduro|atv|utv|quad|snowmobile|roadking|softail|sportster|electra\s+glide|heritage\s+classic|fat\s+boy|shadow\s+ace|gold\s+wing|vulcan|hayabusa|ninja|gsx-r|rm-z|xr\d|crf\d|dr\d|yz[f]?\d|vt\d|cbr\d|klr\d|intruder|boulevard|virago|v-star|roadstar|nighthawk|speedfight|manufacturing)\b/i;

function slugify(value) {
  const slug = value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  // Canonicalize common model variants to avoid redirect-only sitemap URLs.
  return slug.replace(/-cr-v(?=-|$)/g, '-crv');
}

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isPublicRoadVehicle(make, model) {
  return !NON_ROAD_VEHICLE_PATTERN.test(`${make} ${model}`);
}

function buildAllEntries() {
  if (!existsSync(VEHICLES_PATH)) {
    console.error(`Vehicles data file not found at ${VEHICLES_PATH}`);
    return [];
  }

  const rawData = JSON.parse(readFileSync(VEHICLES_PATH, 'utf-8'));
  const entries = [];

  for (const [make, models] of Object.entries(rawData)) {
    const makeSlug = slugify(make);
    for (const [model, info] of Object.entries(models)) {
      if (!isPublicRoadVehicle(make, model)) continue;
      const modelSlug = slugify(model);

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

async function main() {
  console.log('Generating tools sitemaps...');
  const all = buildAllEntries();
  if (all.length === 0) {
    console.log('No URLs generated.');
    return;
  }

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
  console.log(`\nGenerated ${chunkCount} tools sitemap chunks with ${all.length} total URLs`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
