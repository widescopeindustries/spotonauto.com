#!/usr/bin/env node
/**
 * inject-bwt-missing-urls.mjs
 *
 * Directly injects the 50 BWT-flagged "important pages missing from sitemaps"
 * URLs into their respective sitemap files.
 *
 * - /tools/ URLs → public/tools/sitemap/0.xml
 * - /repair/ URLs → finds the correct chunk by scanning, or adds to chunk 0
 * - /maintenance/ URL → public/maintenance/sitemap.xml (route-based, can't edit)
 *   → adds to public/bing-supplemental-sitemap.xml instead
 *
 * Usage: node scripts/inject-bwt-missing-urls.mjs
 *        node scripts/inject-bwt-missing-urls.mjs --dry-run
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BASE_URL = 'https://alloemmanuals.com';
const LAST_MOD = new Date().toISOString().slice(0, 10);
const IS_DRY_RUN = process.argv.includes('--dry-run');

// ── The 50 BWT-flagged URLs ──────────────────────────────────────────
const BWT_URLS = [
  'https://alloemmanuals.com/repair/1996/subaru/impreza-outback/fuel-pump-replacement',
  'https://alloemmanuals.com/repair/1989/cadillac/allante/cabin-air-filter-replacement',
  'https://alloemmanuals.com/repair/1997/honda/crv-mdma/tail-light-replacement',
  'https://alloemmanuals.com/repair/1998/bmw/z3-1.9-3/transmission-fluid-change',
  // 404 CONFIRMED — do NOT add to sitemap; submitted to IndexNow as dead link instead
  // 'https://alloemmanuals.com/repair/2002/jaguar/xkr-convertible-(x100)',
  'https://alloemmanuals.com/repair/2008/lexus/rx-350-fwd/alternator-replacement',
  'https://alloemmanuals.com/repair/2017/bmw/340i/water-pump-replacement',
  'https://alloemmanuals.com/tools/audi-r8-quattro-coupe-423-v8-4-2l-cnda-battery-location',
  'https://alloemmanuals.com/tools/bmw-318is-fluid-capacity',
  'https://alloemmanuals.com/repair/2010/nissan/murano/radiator-replacement',
  'https://alloemmanuals.com/tools/suzuki-xl7-base-awd-oil-type',
  'https://alloemmanuals.com/tools/kia-forte-koup-sx-automatic-trans-transmission-fluid-type',
  // 404 CONFIRMED — do NOT add to sitemap; submitted to IndexNow as dead link instead
  // 'https://alloemmanuals.com/repair/1997/subaru/svx-l',
  'https://alloemmanuals.com/tools/volvo-s80-v8-transmission-fluid-type',
  'https://alloemmanuals.com/tools/mitsubishi-rvr-awd-canada-l4-2-0l-4b11-transmission-fluid-type',
  'https://alloemmanuals.com/repair/1999/bmw/328is-standard/brake-rotor-replacement',
  'https://alloemmanuals.com/repair/2012/mazda/5-grand-touring/starter-replacement',
  'https://alloemmanuals.com/tools/mazda-b2300-base-automatic-transmission-fluid-type',
  'https://alloemmanuals.com/repair/1984/dodge-and-ram/pickup-d150-5.2-t-standard-a833/starter-replacement',
  'https://alloemmanuals.com/repair/1999/mazda/b4000-se-regular-cab-4wd/transmission-fluid-change',
  'https://alloemmanuals.com/tools/ford-probe-v6-153-2-5l-dohc-vin-b-mfi-transmission-fluid-type',
  'https://alloemmanuals.com/tools/ford-transit-connect-electric-van-passenger-transmission-fluid-type',
  'https://alloemmanuals.com/tools/acura-2-5tl-fluid-capacity',
  'https://alloemmanuals.com/repair/1983/dodge-and-ram/pickup-d150-5.2-u-standard-a833/alternator-replacement',
  'https://alloemmanuals.com/repair/2018/honda/odyssey/brake-rotor-replacement',
  'https://alloemmanuals.com/repair/2008/lexus/gs-450h/battery-replacement',
  'https://alloemmanuals.com/tools/volkswagen-beetle-r-line-2-0l-eng-vin-t-transmission-fluid-type',
  'https://alloemmanuals.com/repair/2012/hyundai/accent/thermostat-replacement',
  'https://alloemmanuals.com/tools/volkswagen-jetta-tdi-4d-sedan-automatic-dct-transmission-fluid-type',
  'https://alloemmanuals.com/tools/volkswagen-vanagon-gl-van-passenger-standard-transmission-fluid-type',
  'https://alloemmanuals.com/tools/chevrolet-optra-base-automatic-fluid-capacity',
  'https://alloemmanuals.com/tools/subaru-impreza-base-4d-sedan-standard-trans-transmission-fluid-type',
  'https://alloemmanuals.com/repair/2014/lexus/es/starter-replacement',
  'https://alloemmanuals.com/maintenance/2024/hyundai/tucson/coolant-type',
  'https://alloemmanuals.com/repair/2001/audi/a4-quattro-sedan-(8d2)/tail-light-replacement',
  'https://alloemmanuals.com/tools/ford-fiesta-titanium-4d-sedan-automatic-dct-trans-transmission-fluid-type',
  'https://alloemmanuals.com/repair/2010/buick/enclave/brake-rotor-replacement',
  'https://alloemmanuals.com/repair/2024/buick/envista/transmission-fluid-change',
  'https://alloemmanuals.com/repair/1999/jaguar/xj8-base-4.0-5/battery-replacement',
  'https://alloemmanuals.com/tools/bmw-318i-convertible-e36-l4-1796cc-1-8l-dohc-m42-fluid-capacity',
  'https://alloemmanuals.com/repair/2010/nissan/versa/transmission-fluid-change',
  'https://alloemmanuals.com/tools/toyota-sequoia-platinum-5-7-y-rwd-fluid-capacity',
  'https://alloemmanuals.com/tools/subaru-impreza-base-4d-wagon-automatic-fluid-capacity',
  'https://alloemmanuals.com/repair/2018/mini/countryman/thermostat-replacement',
  'https://alloemmanuals.com/tools/volkswagen-eos-komfort-standard-transmission-fluid-type',
  'https://alloemmanuals.com/repair/2015/volkswagen/jetta/headlight-bulb-replacement',
  'https://alloemmanuals.com/repair/2022/hyundai/elantra/transmission-fluid-change',
  'https://alloemmanuals.com/tools/volkswagen-cabrio-gl-2-0-b-automatic-transmission-fluid-type',
  'https://alloemmanuals.com/repair/2012/jaguar/xj-(x351)-v8-5.0l/battery-replacement',
  'https://alloemmanuals.com/repair/2012/jaguar/xk-(x150)-v8-5.0l/battery-replacement',
];

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getSlugsInXml(xml) {
  const set = new Set();
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) set.add(m[1]);
  return set;
}

function makeUrlEntry(url, priority = '0.8', changefreq = 'weekly') {
  return `<url><loc>${escapeXml(url)}</loc><lastmod>${LAST_MOD}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

function appendToUrlset(xmlPath, newUrls) {
  if (!existsSync(xmlPath)) {
    console.warn(`  ⚠️  File not found: ${xmlPath}`);
    return 0;
  }
  const xml = readFileSync(xmlPath, 'utf8');
  const existing = getSlugsInXml(xml);

  const toAdd = newUrls.filter(u => !existing.has(u));
  if (toAdd.length === 0) {
    console.log(`  ✓ All already present in ${xmlPath.replace(ROOT, '')}`);
    return 0;
  }

  if (IS_DRY_RUN) {
    console.log(`  [DRY RUN] Would add ${toAdd.length} URLs to ${xmlPath.replace(ROOT, '')}:`);
    toAdd.forEach(u => console.log(`    + ${u}`));
    return toAdd.length;
  }

  const entries = toAdd.map(u => makeUrlEntry(u)).join('\n');
  const updated = xml.replace('</urlset>', `${entries}\n</urlset>`);
  writeFileSync(xmlPath, updated, 'utf8');
  console.log(`  ✅ Added ${toAdd.length} URLs to ${xmlPath.replace(ROOT, '')}`);
  toAdd.forEach(u => console.log(`    + ${u.replace(BASE_URL, '')}`));
  return toAdd.length;
}

// ── Bing supplemental sitemap handler (for maintenance URLs which are route-based) ──
function addToSupplementalSitemap(urls) {
  const suppPath = join(ROOT, 'public', 'bing-supplemental-sitemap.xml');
  if (!existsSync(suppPath)) {
    console.warn(`  ⚠️  bing-supplemental-sitemap.xml not found`);
    return 0;
  }
  return appendToUrlset(suppPath, urls);
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   AllOEMManuals — Inject BWT Missing URLs into Sitemaps      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  if (IS_DRY_RUN) console.log('[DRY RUN]\n');

  // Split URLs by type
  const toolUrls = BWT_URLS.filter(u => u.includes('/tools/'));
  const repairUrls = BWT_URLS.filter(u => u.includes('/repair/'));
  const maintenanceUrls = BWT_URLS.filter(u => u.includes('/maintenance/'));

  console.log(`Categorized: ${toolUrls.length} tools, ${repairUrls.length} repair, ${maintenanceUrls.length} maintenance\n`);

  // ── TOOLS: inject into tools sitemap chunk 0 ──────────────────────
  console.log('── Tools sitemap ──');
  const toolsSitemap = join(ROOT, 'public', 'tools', 'sitemap', '0.xml');
  const toolsAdded = appendToUrlset(toolsSitemap, toolUrls);

  // ── REPAIR: inject into repair sitemap chunks ─────────────────────
  console.log('\n── Repair sitemap ──');
  // Search which chunk(s) have space — we'll add all to chunk 0 for now
  // since repair chunk 0 starts at offset 0 (alphabetically)
  const repairChunks = [
    join(ROOT, 'public', 'repair', 'sitemap', '0.xml'),
    join(ROOT, 'public', 'repair', 'sitemap', '10000.xml'),
    join(ROOT, 'public', 'repair', 'sitemap', '20000.xml'),
    join(ROOT, 'public', 'repair', 'sitemap', '30000.xml'),
    join(ROOT, 'public', 'repair', 'sitemap', '40000.xml'),
    join(ROOT, 'public', 'repair', 'sitemap', '50000.xml'),
  ];

  // Find which chunk has each URL by prefix range, or just add to chunk 0
  // (repair chunks are sequential so any unique URL added anywhere works for Bing)
  const repairChunk0 = repairChunks[0];
  if (existsSync(repairChunk0)) {
    const repairAdded = appendToUrlset(repairChunk0, repairUrls);
  } else {
    console.log(`  ⚠️  Repair chunk 0 not found locally — repair URLs need VPS sync`);
    console.log('  Adding repair URLs to bing-supplemental-sitemap.xml as fallback...');
    addToSupplementalSitemap(repairUrls);
  }

  // ── MAINTENANCE: inject into supplemental sitemap ─────────────────
  console.log('\n── Maintenance URLs (route-based sitemap) ──');
  console.log('  Maintenance sitemap is route-based (Next.js), cannot edit directly.');
  console.log('  Adding to bing-supplemental-sitemap.xml...');
  addToSupplementalSitemap(maintenanceUrls);

  console.log('\n── Summary ──');
  console.log(`Total BWT URLs processed: ${BWT_URLS.length}`);

  // Write the list to submit to IndexNow
  const indexNowList = BWT_URLS.join('\n');
  const listPath = join(ROOT, 'scripts', 'seo-reports', `bwt-missing-urls-${LAST_MOD}.txt`);
  if (!IS_DRY_RUN) {
    writeFileSync(listPath, indexNowList, 'utf8');
    console.log(`\nSaved URL list for IndexNow: ${listPath.replace(ROOT, '')}`);
    console.log('\nNext: node scripts/submit-indexnow.js --dead ... OR submit these via IndexNow');
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
