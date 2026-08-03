#!/usr/bin/env node
/**
 * sync-dynamic-tool-slugs.mjs
 *
 * Finds all tool page slugs that the dynamic route (/tools/[slug]) can serve
 * from Postgres but are NOT yet in the static tools sitemap.
 *
 * Then regenerates public/tools/sitemap/0.xml to include them.
 *
 * Usage (run on VPS where Postgres is available):
 *   node scripts/sync-dynamic-tool-slugs.mjs
 *   node scripts/sync-dynamic-tool-slugs.mjs --dry-run   # preview only
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SITEMAP_CHUNK = join(ROOT, 'public', 'tools', 'sitemap', '0.xml');
const INDEX_PATH = join(ROOT, 'public', 'tools', 'sitemap.xml');
const BASE_URL = 'https://alloemmanuals.com';
const LAST_MOD = new Date().toISOString().slice(0, 10);
const URLS_PER_SITEMAP = 10000;

const KNOWN_TOOL_TYPES = [
  'oil-type',
  'coolant-type',
  'transmission-fluid-type',
  'brake-fluid-type',
  'battery-location',
  'serpentine-belt',
  'tire-size',
  'spark-plug-type',
  'wiper-blade-size',
  'headlight-bulb',
  'fluid-capacity',
];

const TOOL_SEARCH_TERMS = {
  'oil-type':                  ['engine oil', 'motor oil', 'oil capacity', 'oil specification', 'oil type', 'lubrication'],
  'coolant-type':              ['coolant', 'antifreeze', 'cooling system', 'coolant capacity', 'coolant type'],
  'transmission-fluid-type':   ['transmission fluid', 'ATF', 'transaxle fluid', 'automatic transmission', 'manual transmission', 'gear oil'],
  'brake-fluid-type':          ['brake fluid', 'hydraulic brake', 'master cylinder', 'brake system', 'DOT'],
  'battery-location':          ['battery', 'battery removal', 'battery replacement', 'battery specifications', 'charging system', 'group size', 'CCA'],
  'serpentine-belt':           ['serpentine belt', 'drive belt', 'accessory belt', 'belt routing', 'accessory drive', 'drive belt replacement'],
  'tire-size':                 ['tire', 'tire size', 'tire pressure', 'wheel specification', 'tires and wheels', 'wheel and tire'],
  'spark-plug-type':           ['spark plug', 'spark plug gap', 'ignition system', 'ignition plug', 'tune-up', 'spark plug replacement'],
  'wiper-blade-size':          ['wiper', 'wiper blade', 'windshield wiper', 'windshield washer', 'wiper replacement'],
  'headlight-bulb':            ['headlight', 'headlamp', 'bulb replacement', 'lighting system', 'exterior lighting', 'headlamp bulb'],
  'fluid-capacity':            ['fluid capacity', 'capacities', 'specifications', 'maintenance', 'fluid specification'],
};

const NON_ROAD_PATTERN = /\b(trailer|scooter|motorcycle|motocross|enduro|atv|utv|quad|snowmobile|roadking|softail|sportster|electra\s+glide|heritage\s+classic|fat\s+boy|shadow\s+ace|gold\s+wing|vulcan|hayabusa|ninja|gsx-r|rm-z|xr\d|crf\d|dr\d|yz[f]?\d|vt\d|cbr\d|klr\d|intruder|boulevard|virago|v-star|roadstar|nighthawk|speedfight|manufacturing)\b/i;

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

function extractSitemapSlugs(xmlPath) {
  if (!existsSync(xmlPath)) return new Set();
  const xml = readFileSync(xmlPath, 'utf8');
  const slugs = new Set();
  for (const m of xml.matchAll(/<loc>https:\/\/alloemmanuals\.com\/tools\/([^<]+)<\/loc>/g)) {
    slugs.add(m[1]);
  }
  return slugs;
}

function writeUrlSetXml(entries) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(e =>
      `<url><loc>${escapeXml(e.url)}</loc><lastmod>${e.lastmod}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`
    ),
    '</urlset>',
  ].join('\n');
}

const isDryRun = process.argv.includes('--dry-run');

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     AllOEMManuals — Sync Dynamic Tool Slugs to Sitemap       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (isDryRun) console.log('[DRY RUN — no files will be written]\n');

  // Load existing sitemap slugs
  const existingSlugs = extractSitemapSlugs(SITEMAP_CHUNK);
  console.log(`Existing sitemap slugs: ${existingSlugs.size}`);

  // Connect to Postgres
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.LOCAL_DATABASE_URL ||
    'postgresql://spotonauto:spotonauto2026@127.0.0.1:5432/spotonauto';

  const pool = new Pool({ connectionString, connectionTimeoutMillis: 10000, query_timeout: 300000 });

  const newEntries = [];
  let totalQueried = 0;

  try {
    for (const toolType of KNOWN_TOOL_TYPES) {
      const terms = TOOL_SEARCH_TERMS[toolType] || [];
      const likeClauses = terms
        .map(t => `LOWER(section_title || ' ' || content_preview) LIKE '%${t.replace(/'/g, "''")}%'`)
        .join(' OR ');

      const sql = `
        SELECT DISTINCT make, model
        FROM manual_embeddings
        WHERE year BETWEEN 1982 AND 2026
          AND (${likeClauses})
      `;

      process.stdout.write(`  Querying ${toolType}... `);
      const { rows } = await pool.query(sql);
      totalQueried += rows.length;

      let newCount = 0;
      for (const row of rows) {
        // Skip non-road vehicles
        if (NON_ROAD_PATTERN.test(`${row.make} ${row.model}`)) continue;

        const makeSlug = slugify(row.make);
        const modelSlug = slugify(row.model);
        const slug = `${makeSlug}-${modelSlug}-${toolType}`;

        if (!existingSlugs.has(slug)) {
          newEntries.push({
            url: `${BASE_URL}/tools/${slug}`,
            lastmod: LAST_MOD,
            changefreq: 'weekly',
            priority: 0.8,
          });
          newCount++;
        }
      }
      console.log(`${rows.length} vehicles → ${newCount} new slugs`);
    }
  } finally {
    await pool.end();
  }

  console.log(`\nTotal new slugs not yet in sitemap: ${newEntries.length}`);

  if (newEntries.length === 0) {
    console.log('Nothing to add. Sitemap is already complete.\n');
    return;
  }

  // Deduplicate new entries
  const uniqueNew = [...new Map(newEntries.map(e => [e.url, e])).values()];

  // Merge with existing sitemap entries
  const existingXml = existsSync(SITEMAP_CHUNK) ? readFileSync(SITEMAP_CHUNK, 'utf8') : '';
  const existingEntries = [];
  for (const m of existingXml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const locMatch = m[1].match(/<loc>([^<]+)<\/loc>/);
    const lastmodMatch = m[1].match(/<lastmod>([^<]+)<\/lastmod>/);
    const changefreqMatch = m[1].match(/<changefreq>([^<]+)<\/changefreq>/);
    const priorityMatch = m[1].match(/<priority>([^<]+)<\/priority>/);
    if (locMatch) {
      existingEntries.push({
        url: locMatch[1],
        lastmod: lastmodMatch?.[1] || LAST_MOD,
        changefreq: changefreqMatch?.[1] || 'weekly',
        priority: priorityMatch?.[1] || '0.8',
      });
    }
  }

  // Merge and deduplicate (existing wins priority)
  const byUrl = new Map();
  for (const e of uniqueNew) byUrl.set(e.url, e);
  for (const e of existingEntries) byUrl.set(e.url, e);

  const allEntries = [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url));
  console.log(`Total merged sitemap URLs: ${allEntries.length}`);

  if (isDryRun) {
    console.log('\nNew slugs that would be added (first 20):');
    uniqueNew.slice(0, 20).forEach(e => console.log('  +', e.url.replace(BASE_URL + '/tools/', '')));
    if (uniqueNew.length > 20) console.log(`  ... and ${uniqueNew.length - 20} more`);
    return;
  }

  // Write updated sitemap chunk(s)
  mkdirSync(join(ROOT, 'public', 'tools', 'sitemap'), { recursive: true });

  const chunks = [];
  for (let i = 0; i < allEntries.length; i += URLS_PER_SITEMAP) {
    chunks.push(allEntries.slice(i, i + URLS_PER_SITEMAP));
  }

  for (let i = 0; i < chunks.length; i++) {
    const path = join(ROOT, 'public', 'tools', 'sitemap', `${i}.xml`);
    writeFileSync(path, writeUrlSetXml(chunks[i]), 'utf8');
    console.log(`✓ Wrote ${path} — ${chunks[i].length} URLs`);
  }

  // Update sitemap index
  const indexXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...chunks.map((_, i) => `<sitemap><loc>${BASE_URL}/tools/sitemap/${i}.xml</loc><lastmod>${LAST_MOD}</lastmod></sitemap>`),
    '</sitemapindex>',
  ].join('\n');
  writeFileSync(INDEX_PATH, indexXml, 'utf8');
  console.log(`✓ Updated sitemap index: ${chunks.length} chunk(s)\n`);

  console.log(`\n✅ Done! Added ${uniqueNew.length} new tool slugs to the sitemap.`);
  console.log('Run: node scripts/submit-indexnow.js to notify Bing.\n');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
