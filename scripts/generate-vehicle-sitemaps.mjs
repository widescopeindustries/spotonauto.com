/**
 * Generate vehicle + DTC sitemap XML files from Cloudflare KV data.
 *
 * Outputs:
 *   public/vehicles/sitemap.xml          — sitemap index
 *   public/vehicles/sitemap/0.xml ...    — chunked vehicle URLs
 *   public/codes/sitemap/all.xml         — all 8,506 DTC codes (static)
 *
 * Run: node scripts/generate-vehicle-sitemaps.mjs
 */
import { existsSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BASE_URL = 'https://spotonauto.com';
const LAST_MOD = process.env.SITEMAP_LAST_MOD || new Date().toISOString().slice(0, 10);
const URLS_PER_SITEMAP = 10000;

// Cloudflare KV config
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const NS = process.env.CLOUDFLARE_KV_NAMESPACE_ID;

if (!ACCOUNT || !TOKEN || !NS) {
  console.error('Missing CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, or CLOUDFLARE_KV_NAMESPACE_ID');
  process.exit(1);
}

const KV_BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/storage/kv/namespaces/${NS}`;

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function cleanDir(dir) {
  if (existsSync(dir)) {
    for (const f of readdirSync(dir)) {
      if (f.endsWith('.xml')) unlinkSync(join(dir, f));
    }
  }
}

// ─── KV Key Listing ─────────────────────────────────────────────────────────

async function listAllKeys(prefix) {
  const keys = [];
  let cursor = null;
  do {
    let url = `${KV_BASE}/keys?prefix=${encodeURIComponent(prefix)}&limit=1000`;
    if (cursor) url += `&cursor=${cursor}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    const data = await res.json();
    if (!data.success) throw new Error(`KV list failed: ${JSON.stringify(data.errors)}`);
    keys.push(...data.result.map(k => k.name));
    cursor = data.result_info?.cursor || null;
  } while (cursor);
  return keys;
}

// ─── Vehicle Sitemap Generation ─────────────────────────────────────────────

async function generateVehicleSitemaps() {
  console.log('Fetching vehicle keys from KV...');
  const vehicleKeys = await listAllKeys('vehicle:');
  console.log(`  ${vehicleKeys.length} vehicle keys found`);

  // Parse keys and deduplicate by year/make/model
  const seen = new Set();
  const vehicles = [];

  for (const key of vehicleKeys) {
    // key format: vehicle:make:year:model:variant
    const parts = key.split(':');
    if (parts.length < 4) continue;
    const [, make, year, model] = parts;
    const dedup = `${year}/${make}/${model}`;
    if (seen.has(dedup)) continue;
    seen.add(dedup);
    vehicles.push({ year, make, model });
  }

  console.log(`  ${vehicles.length} unique year/make/model combinations`);

  // Sort by make, then year desc, then model
  vehicles.sort((a, b) =>
    a.make.localeCompare(b.make) || Number(b.year) - Number(a.year) || a.model.localeCompare(b.model)
  );

  // Generate chunked sitemaps
  const VEHICLE_OUT = join(ROOT, 'public', 'vehicles', 'sitemap');
  const VEHICLE_INDEX = join(ROOT, 'public', 'vehicles', 'sitemap.xml');
  ensureDir(VEHICLE_OUT);
  cleanDir(VEHICLE_OUT);

  const chunks = [];
  for (let i = 0; i < vehicles.length; i += URLS_PER_SITEMAP) {
    chunks.push(vehicles.slice(i, i + URLS_PER_SITEMAP));
  }

  for (let c = 0; c < chunks.length; c++) {
    const urls = chunks[c].map(v => {
      const url = `${BASE_URL}/vehicles/${escapeXml(v.year)}/${escapeXml(v.make)}/${escapeXml(v.model)}`;
      return `<url><loc>${url}</loc><lastmod>${LAST_MOD}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
    writeFileSync(join(VEHICLE_OUT, `${c}.xml`), xml);
    console.log(`  Wrote vehicles/sitemap/${c}.xml (${chunks[c].length} URLs)`);
  }

  // Write sitemap index
  const indexEntries = chunks.map((_, i) =>
    `<sitemap><loc>${BASE_URL}/vehicles/sitemap/${i}.xml</loc><lastmod>${LAST_MOD}</lastmod></sitemap>`
  );
  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexEntries.join('\n')}\n</sitemapindex>`;
  writeFileSync(VEHICLE_INDEX, indexXml);
  console.log(`  Wrote vehicles/sitemap.xml (${chunks.length} chunks, ${vehicles.length} total URLs)`);

  return vehicles.length;
}

// ─── DTC Code Sitemap Generation ────────────────────────────────────────────

async function generateDtcSitemaps() {
  console.log('Fetching DTC keys from KV...');
  const dtcKeys = await listAllKeys('dtc:');

  // Filter to individual code entries (not summary shards)
  const codes = dtcKeys
    .filter(k => !k.startsWith('dtc:summary'))
    .map(k => k.replace('dtc:', '').toLowerCase())
    .sort();

  console.log(`  ${codes.length} DTC codes found`);

  const DTC_OUT = join(ROOT, 'public', 'codes', 'sitemap');
  const DTC_INDEX = join(ROOT, 'public', 'codes', 'sitemap-all.xml');
  ensureDir(DTC_OUT);
  cleanDir(DTC_OUT);

  // Generate chunked sitemaps
  const chunks = [];
  for (let i = 0; i < codes.length; i += URLS_PER_SITEMAP) {
    chunks.push(codes.slice(i, i + URLS_PER_SITEMAP));
  }

  for (let c = 0; c < chunks.length; c++) {
    const urls = chunks[c].map(code => {
      const url = `${BASE_URL}/codes/${escapeXml(code)}`;
      return `<url><loc>${url}</loc><lastmod>${LAST_MOD}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
    writeFileSync(join(DTC_OUT, `${c}.xml`), xml);
    console.log(`  Wrote codes/sitemap/${c}.xml (${chunks[c].length} URLs)`);
  }

  // Write sitemap index (only if multiple chunks)
  if (chunks.length > 1) {
    const indexEntries = chunks.map((_, i) =>
      `<sitemap><loc>${BASE_URL}/codes/sitemap/${i}.xml</loc><lastmod>${LAST_MOD}</lastmod></sitemap>`
    );
    const indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexEntries.join('\n')}\n</sitemapindex>`;
    writeFileSync(DTC_INDEX, indexXml);
    console.log(`  Wrote codes/sitemap-all.xml (${chunks.length} chunks)`);
  }

  return codes.length;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();

  const vehicleCount = await generateVehicleSitemaps();
  const dtcCount = await generateDtcSitemaps();

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s — ${vehicleCount} vehicle URLs + ${dtcCount} DTC URLs`);
}

main().catch(err => { console.error(err); process.exit(1); });
