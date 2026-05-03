#!/usr/bin/env node
/**
 * Generate vehicle sitemap XML files directly from manual_embeddings DB.
 *
 * This replaces the old KV-based generator (scripts/generate-vehicle-sitemaps.mjs)
 * which produced URLs that didn't match the actual database content.
 *
 * Outputs:
 *   public/vehicles/sitemap.xml          — sitemap index
 *   public/vehicles/sitemap/0.xml ...    — chunked vehicle URLs
 *
 * Run: node scripts/generate-vehicle-sitemaps-from-db.mjs
 */
import { existsSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BASE_URL = 'https://spotonauto.com';
const LAST_MOD = process.env.SITEMAP_LAST_MOD || new Date().toISOString().slice(0, 10);
const URLS_PER_SITEMAP = 10000;

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function slugify(value) {
  return decodeURIComponent(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
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

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.LOCAL_DATABASE_URL ||
    'postgresql://spotonauto:pnjkD6ip8hRXsLEj9A087u71@116.202.210.109:5432/spotonauto';

  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
    query_timeout: 30000,
  });

  console.log('Fetching distinct vehicles from manual_embeddings...');

  const { rows } = await pool.query(`
    SELECT DISTINCT make, year, model
    FROM manual_embeddings
    ORDER BY make ASC, year DESC, model ASC
  `);

  console.log(`  ${rows.length} unique make/year/model combos found`);

  // Generate URLs
  const urls = rows.map((row) => {
    const makeSlug = slugify(row.make);
    const modelSlug = slugify(row.model);
    const year = Number(row.year);
    return `${BASE_URL}/vehicles/${year}/${makeSlug}/${modelSlug}`;
  });

  // Deduplicate (shouldn't happen, but belt-and-suspenders)
  const uniqueUrls = [...new Set(urls)];
  console.log(`  ${uniqueUrls.length} unique URLs after dedup`);

  // Generate chunked sitemaps
  const VEHICLE_OUT = join(ROOT, 'public', 'vehicles', 'sitemap');
  const VEHICLE_INDEX = join(ROOT, 'public', 'vehicles', 'sitemap.xml');
  ensureDir(VEHICLE_OUT);
  cleanDir(VEHICLE_OUT);

  const chunks = [];
  for (let i = 0; i < uniqueUrls.length; i += URLS_PER_SITEMAP) {
    chunks.push(uniqueUrls.slice(i, i + URLS_PER_SITEMAP));
  }

  for (let c = 0; c < chunks.length; c++) {
    const urlEntries = chunks[c].map((url) =>
      `<url><loc>${escapeXml(url)}</loc><lastmod>${LAST_MOD}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries.join('\n')}\n</urlset>`;
    writeFileSync(join(VEHICLE_OUT, `${c}.xml`), xml);
    console.log(`  Wrote vehicles/sitemap/${c}.xml (${chunks[c].length} URLs)`);
  }

  // Write sitemap index
  const indexEntries = chunks.map((_, i) =>
    `<sitemap><loc>${BASE_URL}/vehicles/sitemap/${i}.xml</loc><lastmod>${LAST_MOD}</lastmod></sitemap>`
  );
  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexEntries.join('\n')}\n</sitemapindex>`;
  writeFileSync(VEHICLE_INDEX, indexXml);
  console.log(`  Wrote vehicles/sitemap.xml (${chunks.length} chunks, ${uniqueUrls.length} total URLs)`);

  await pool.end();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
