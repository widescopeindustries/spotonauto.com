/**
 * Expand wiring-coverage.json using Cloudflare KV knowledge graph data.
 *
 * Scans KV vehicle data to find which systems have diagram-type content,
 * then maps them to WiringSystemSlug values. Produces an expanded
 * wiring-coverage.json with 14 system types instead of 3.
 *
 * Usage: node scripts/expand-wiring-coverage-from-kv.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT_PATH = join(ROOT, 'src', 'data', 'wiring-coverage.json');

// Load env
const envPath = join(ROOT, '.env.local');
const envLines = readFileSync(envPath, 'utf-8').split('\n');
const env = {};
for (const line of envLines) {
  const eq = line.indexOf('=');
  if (eq > 0 && !line.startsWith('#')) {
    env[line.substring(0, eq).trim()] = line.substring(eq + 1).trim();
  }
}

const ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = env.CLOUDFLARE_API_TOKEN;
const KV_NAMESPACE_ID = env.CLOUDFLARE_KV_NAMESPACE_ID;
const KV_BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}`;

if (!ACCOUNT_ID || !API_TOKEN || !KV_NAMESPACE_ID) {
  console.error('Missing Cloudflare env vars in .env.local');
  process.exit(1);
}

// Map KV system names → WiringSystemSlug
const KV_SYSTEM_TO_SLUG = {
  'Starting and Charging': ['starter', 'alternator'],
  'Lighting and Horns': ['headlight'],
  'Brakes and Traction Control': ['abs'],
  'Heating and Air Conditioning': ['ac-heater'],
  'Windows and Glass': ['power-windows'],
  'Instrument Panel, Gauges and Warning Indicators': ['instrument-cluster'],
  'Wiper and Washer Systems': ['wipers'],
  'Transmission and Drivetrain': ['transmission'],
  'Cruise Control': ['cruise-control'],
  'Restraints and Safety Systems': ['airbag'],
  'Powertrain Management': ['engine-management'],
  'Body and Frame': ['body-electrical'],
  'Engine, Cooling and Exhaust': ['engine-management'],
  'Accessories and Optional Equipment': ['body-electrical'],
  'Maintenance': ['engine-management'],
  'Sensors and Switches': ['engine-management'],
};

// Non-road vehicle filter
const NON_ROAD = /\b(trailer|scooter|motorcycle|motocross|enduro|atv|utv|quad|snowmobile|roadking|softail|sportster|electra\s+glide|heritage\s+classic|fat\s+boy|shadow\s+ace|gold\s+wing|vulcan|hayabusa|ninja|gsx-r|rm-z|xr\d|crf\d|dr\d|yz[f]?\d|vt\d|cbr\d|klr\d|intruder|boulevard|virago|v-star|roadstar|nighthawk|speedfight|manufacturing)\b/i;

function cfFetch(path) {
  return new Promise((resolve, reject) => {
    const url = `${KV_BASE}${path}`;
    https.get(url, { headers: { Authorization: `Bearer ${API_TOKEN}` } }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
        else reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
      });
    }).on('error', reject);
  });
}

async function listKeys(prefix, limit = 1000) {
  let cursor = '';
  const allKeys = [];
  while (true) {
    const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
    const raw = await cfFetch(`/keys?prefix=${encodeURIComponent(prefix)}&limit=${limit}${cursorParam}`);
    const parsed = JSON.parse(raw);
    if (!parsed.success) throw new Error(JSON.stringify(parsed.errors));
    allKeys.push(...(parsed.result || []).map((k) => k.name));
    if (!parsed.result_info?.cursor || parsed.result.length < limit) break;
    cursor = parsed.result_info.cursor;
  }
  return allKeys;
}

async function getVehicle(key) {
  const raw = await cfFetch(`/values/${encodeURIComponent(key)}`);
  return JSON.parse(raw);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('Expanding wiring coverage from Cloudflare KV knowledge graph\n');

  // Get the makes index
  const makesRaw = await cfFetch('/values/index%3Amakes');
  const makes = JSON.parse(makesRaw);
  console.log(`Found ${makes.length} makes in KV\n`);

  const vehicles = [];
  let processed = 0;
  let skipped = 0;

  for (const makeEntry of makes) {
    const makeSlug = makeEntry.slug;
    const makeIndexRaw = await cfFetch(`/values/index%3Amake%3A${encodeURIComponent(makeSlug)}`);
    const makeVehicles = JSON.parse(makeIndexRaw);

    // Group by year+model to avoid fetching every variant
    const byYearModel = new Map();
    for (const v of makeVehicles) {
      const key = `${v.year}:${v.model}`;
      if (!byYearModel.has(key)) byYearModel.set(key, v);
    }

    // Sample: fetch one variant per year/model
    const entries = [...byYearModel.values()];
    for (const entry of entries) {
      // Filter non-road
      if (NON_ROAD.test(`${entry.make} ${entry.model}`)) {
        skipped++;
        continue;
      }

      // Build key from entry ID
      const vehicleKey = entry.id;
      try {
        const data = await getVehicle(vehicleKey);
        if (!data || !data.sys) continue;

        // Find which systems have diagram content
        const foundSlugs = new Set();
        for (const [sysName, entries] of Object.entries(data.sys)) {
          const hasDiagrams = entries.some((e) => e.type === 'diagram');
          if (!hasDiagrams) continue;

          const slugs = KV_SYSTEM_TO_SLUG[sysName];
          if (slugs) {
            for (const s of slugs) foundSlugs.add(s);
          }
        }

        // Also check the catch-all Diagrams system (contains all diagram types)
        if (data.sys['Diagrams'] && data.sys['Diagrams'].length > 0) {
          // Check diagram titles for system hints
          for (const diag of data.sys['Diagrams']) {
            const t = diag.title.toLowerCase();
            if (t.includes('starter') || t.includes('starting')) foundSlugs.add('starter');
            if (t.includes('alternator') || t.includes('charging') || t.includes('generator')) foundSlugs.add('alternator');
            if (t.includes('fuel pump') || t.includes('fuel sender')) foundSlugs.add('fuel-pump');
            if (t.includes('headlight') || t.includes('headlamp') || t.includes('head light')) foundSlugs.add('headlight');
            if (t.includes('abs') || t.includes('anti lock') || t.includes('wheel speed')) foundSlugs.add('abs');
            if (t.includes('a/c') || t.includes('air condition') || t.includes('blower') || t.includes('heater')) foundSlugs.add('ac-heater');
            if (t.includes('window') || t.includes('regulator')) foundSlugs.add('power-windows');
            if (t.includes('instrument') || t.includes('cluster') || t.includes('gauge')) foundSlugs.add('instrument-cluster');
            if (t.includes('wiper') || t.includes('washer')) foundSlugs.add('wipers');
            if (t.includes('transmission') || t.includes('transaxle') || t.includes('shift')) foundSlugs.add('transmission');
            if (t.includes('cruise')) foundSlugs.add('cruise-control');
            if (t.includes('airbag') || t.includes('srs') || t.includes('restraint') || t.includes('squib')) foundSlugs.add('airbag');
            if (t.includes('ignition coil') || t.includes('injector') || t.includes('oxygen sensor') || t.includes('throttle')) foundSlugs.add('engine-management');
            if (t.includes('door lock') || t.includes('horn') || t.includes('keyless') || t.includes('trunk')) foundSlugs.add('body-electrical');
          }
        }

        if (foundSlugs.size > 0) {
          vehicles.push({
            year: data.v.year,
            make: data.v.make,
            model: data.v.model,
            systems: [...foundSlugs].sort(),
          });
        }

        processed++;
        if (processed % 100 === 0) {
          console.log(`  Processed ${processed} vehicles (${vehicles.length} with wiring, ${skipped} skipped)`);
        }
      } catch (e) {
        // Skip failures silently
        skipped++;
      }

      // Rate limit
      await sleep(50);
    }

    console.log(`  ${makeEntry.slug}: ${entries.length} year/model combos`);
  }

  // Deduplicate (same year/make/model from different variants)
  const seen = new Set();
  const deduped = [];
  for (const v of vehicles) {
    const key = `${v.year}:${v.make}:${v.model}`;
    if (seen.has(key)) {
      // Merge systems
      const existing = deduped.find((d) => `${d.year}:${d.make}:${d.model}` === key);
      if (existing) {
        const merged = new Set([...existing.systems, ...v.systems]);
        existing.systems = [...merged].sort();
      }
      continue;
    }
    seen.add(key);
    deduped.push(v);
  }

  // Sort
  deduped.sort((a, b) => a.make.localeCompare(b.make) || a.model.localeCompare(b.model) || a.year - b.year);

  const output = {
    generatedAt: new Date().toISOString(),
    source: 'cloudflare-kv-knowledge-graph',
    vehicles: deduped,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');

  // Stats
  const totalPages = deduped.reduce((sum, v) => sum + v.systems.length, 0);
  const systemCounts = {};
  for (const v of deduped) {
    for (const s of v.systems) {
      systemCounts[s] = (systemCounts[s] || 0) + 1;
    }
  }

  console.log(`\n=== Results ===`);
  console.log(`  Vehicles with wiring: ${deduped.length}`);
  console.log(`  Total wiring pages: ${totalPages}`);
  console.log(`  Systems breakdown:`);
  for (const [s, c] of Object.entries(systemCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${s}: ${c}`);
  }
  console.log(`\nWritten to ${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
