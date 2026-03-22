/**
 * Generate wiring sitemap XML files as static assets in public/.
 * Same strategy as generate-repair-sitemaps.mjs — chunked static files
 * served directly by Vercel CDN with no Next.js processing.
 *
 * Splits wiring URLs into conservative 10,000-URL chunks to match the
 * repair sitemap strategy and reduce crawler fetch/parse risk.
 */
import { writeFileSync, mkdirSync, readdirSync, unlinkSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'wiring', 'sitemap');
const INDEX_PATH = join(ROOT, 'public', 'wiring', 'sitemap.xml');
const COVERAGE_PATH = join(ROOT, 'src', 'data', 'wiring-coverage.json');

const LAST_MOD = process.env.SITEMAP_LAST_MOD || new Date().toISOString().slice(0, 10);
const URLS_PER_SITEMAP = 10000;
const BASE_URL = 'https://spotonauto.com';

const NON_ROAD_VEHICLE_PATTERN =
  /\b(trailer|scooter|motorcycle|motocross|enduro|atv|utv|quad|snowmobile|roadking|softail|sportster|electra\s+glide|heritage\s+classic|fat\s+boy|shadow\s+ace|gold\s+wing|vulcan|hayabusa|ninja|gsx-r|rm-z|xr\d|crf\d|dr\d|yz[f]?\d|vt\d|cbr\d|klr\d|intruder|boulevard|virago|v-star|roadstar|nighthawk|speedfight|manufacturing)\b/i;

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

const coverage = JSON.parse(readFileSync(COVERAGE_PATH, 'utf-8'));

function buildAllEntries() {
  const vehicles = (coverage.vehicles || []).filter((v) =>
    isPublicRoadVehicle(v.make, v.model),
  );

  const entries = [];
  for (const vehicle of vehicles) {
    for (const system of vehicle.systems) {
      entries.push({
        url: `${BASE_URL}/wiring/${vehicle.year}/${slugify(vehicle.make)}/${slugify(vehicle.model)}/${system}`,
        lastmod: LAST_MOD,
        changefreq: 'weekly',
        priority: 0.75,
      });
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

// Sitemap index
const indexXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...Array.from({ length: chunkCount }, (_, i) =>
    [
      '<sitemap>',
      `<loc>${BASE_URL}/wiring/sitemap/${i}.xml</loc>`,
      `<lastmod>${LAST_MOD}</lastmod>`,
      '</sitemap>',
    ].join(''),
  ),
  '</sitemapindex>',
].join('\n');

writeFileSync(INDEX_PATH, indexXml, 'utf-8');
console.log(`✓ ${INDEX_PATH} — ${chunkCount} child sitemaps`);

console.log(
  `\nGenerated ${chunkCount} wiring sitemap chunks with ${all.length} total URLs`,
);
