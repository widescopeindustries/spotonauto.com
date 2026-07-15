#!/usr/bin/env node
/**
 * AI Citations Audit — maps Bing Webmaster Tools AI Performance queries to
 * vehicle-specific URLs, checks production status, and flags gaps.
 *
 * Run:
 *   node scripts/ai-citations-audit.mjs
 *
 * With status checks (slower):
 *   CHECK_STATUS=1 node scripts/ai-citations-audit.mjs
 */
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, 'seo-reports');

// Import project vehicle data with path-alias loader compatibility
const { VEHICLE_PRODUCTION_YEARS, slugifyRoutePart, getDisplayName, getClampedYear, VALID_TASKS } = await import(
  /* @vite-ignore */
  new URL('../src/data/vehicles.ts', import.meta.url).href
);
const { getToolPagesForVehicle, findGenerationForYear, TOOL_TYPE_META } = await import(
  /* @vite-ignore */
  new URL('../src/data/tools-pages.ts', import.meta.url).href
);

const CHECK_STATUS = process.env.CHECK_STATUS === '1' || process.env.CHECK_STATUS === 'true';
const BASE_URL = process.env.BASE_URL || 'https://alloemmanuals.com';

// Ensure reports dir exists
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

// ─── Raw AI Performance query data (2026-07-13 dump) ─────────────────────────
const QUERIES = [
  { query: 'amazon auto parts by vehicle make and model', intent: 'Commercial', topic: 'Online Shopping & Apps', citations: 203, pct: 26.36 },
  { query: 'toyota fluid capacities', intent: 'Informational', topic: 'Car Maintenance, Repair & Parts', citations: 194, pct: 45.33 },
  { query: 'amazon auto parts by vehicle year and type', intent: 'Commercial', topic: 'Car Maintenance, Repair & Parts', citations: 105, pct: 44.87 },
  { query: 'porsche cayenne battery location', intent: 'Learn and Solve', topic: 'Car Maintenance, Repair & Parts', citations: 84, pct: 33.07 },
  { query: 'toyota sienna tire size', intent: 'Informational', topic: 'Tires & Wheels', citations: 69, pct: 33.50 },
  { query: 'how to change belt tensioner pulley on 2012 fiat 500c convertible', intent: 'Learn and Solve', topic: 'Car Maintenance, Repair & Parts', citations: 63, pct: 56.25 },
  { query: '2022 chevy equinox oil capacity', intent: 'Informational', topic: 'Car Maintenance, Repair & Parts', citations: 55, pct: 14.75 },
  { query: '2017 porsche cayenne battery location', intent: 'Learn and Solve', topic: 'Car Maintenance, Repair & Parts', citations: 42, pct: 50.00 },
  { query: 'bmw x1 battery location', intent: 'Learn and Solve', topic: 'Car Maintenance, Repair & Parts', citations: 40, pct: 28.17 },
  { query: 'volvo s60 battery replacement', intent: 'Learn and Solve', topic: 'Car Maintenance, Repair & Parts', citations: 36, pct: 52.94 },
  { query: 'ford focus oil type chart', intent: 'Informational', topic: 'Car Maintenance, Repair & Parts', citations: 33, pct: 30.28 },
  { query: 'what color should the coolant be for pt cruiser 2008?', intent: 'Learn and Solve', topic: 'Car Maintenance, Repair & Parts', citations: 32, pct: 100.00 },
  { query: 'bmw x3 battery location', intent: 'Learn and Solve', topic: 'Car Maintenance, Repair & Parts', citations: 30, pct: 16.13 },
  { query: 'ford ecosport ses wheel size', intent: 'Informational', topic: 'Tires & Wheels', citations: 30, pct: 46.15 },
  { query: 'how to flush a 2015 ford taurus', intent: 'Learn and Solve', topic: 'Car Maintenance, Repair & Parts', citations: 29, pct: 39.73 },
  { query: '2025 jeep compass tire size', intent: 'Informational', topic: 'Tires & Wheels', citations: 29, pct: 32.58 },
  { query: 'what oil does a defender take', intent: 'Informational', topic: 'Car Maintenance, Repair & Parts', citations: 28, pct: 25.00 },
  { query: 'mazda cx-5 coolant fl22', intent: 'Commercial', topic: 'Car Maintenance, Repair & Parts', citations: 27, pct: 23.48 },
  { query: 'subaru outback tire size', intent: 'Informational', topic: 'Tires & Wheels', citations: 27, pct: 21.95 },
  { query: 'all wiring diagrams', intent: 'Learn and Solve', topic: 'Car Maintenance, Repair & Parts', citations: 22, pct: 18.64 },
  { query: 'p0108 07 ford mustang', intent: 'Learn and Solve', topic: 'Car Maintenance, Repair & Parts', citations: 21, pct: 12.50 },
  { query: 'ford focus oil type', intent: 'Informational', topic: 'Car Maintenance, Repair & Parts', citations: 21, pct: 31.82 },
  { query: 'nissan titan tire size', intent: 'Informational', topic: 'Tires & Wheels', citations: 20, pct: 33.33 },
  { query: 'honda element tire size', intent: 'Informational', topic: 'Tires & Wheels', citations: 19, pct: 40.43 },
  { query: 'ford ranger oil capacity chart', intent: 'Informational', topic: 'Car Maintenance, Repair & Parts', citations: 19, pct: 27.54 },
  { query: '2013 nissan versa cabin air filter location', intent: 'Learn and Solve', topic: 'Car Maintenance, Repair & Parts', citations: 18, pct: 33.33 },
  { query: 'prius tire size', intent: 'Informational', topic: 'Tires & Wheels', citations: 17, pct: 28.33 },
  { query: 'gr corolla tire size', intent: 'Informational', topic: 'Tires & Wheels', citations: 16, pct: 18.82 },
  { query: 'dodge durango battery location', intent: 'Learn and Solve', topic: 'Car Maintenance, Repair & Parts', citations: 16, pct: 11.11 },
  { query: 'amazon car parts by vehicle model', intent: 'Commercial', topic: 'Online Shopping & Apps', citations: 16, pct: 30.77 },
  { query: 'nissan maxima oil capacity', intent: 'Informational', topic: 'Car Maintenance, Repair & Parts', citations: 16, pct: 21.05 },
  { query: 'ford focus engine oil type', intent: 'Informational', topic: 'Car Maintenance, Repair & Parts', citations: 15, pct: 26.32 },
  { query: '2004 excursion brake fluid capacity', intent: 'Informational', topic: 'Car Maintenance, Repair & Parts', citations: 15, pct: 55.56 },
  { query: '2017 chevy traverse tire size', intent: 'Informational', topic: 'Tires & Wheels', citations: 15, pct: 15.79 },
  { query: '2019 ford flex tire size', intent: 'Informational', topic: 'Tires & Wheels', citations: 15, pct: 36.59 },
  { query: 'honda civic tire size chart', intent: 'Learn and Solve', topic: 'Tires & Wheels', citations: 14, pct: 25.00 },
  { query: '2003 subaru forester timing belt replacement', intent: 'Learn and Solve', topic: 'Car Maintenance, Repair & Parts', citations: 14, pct: 21.88 },
  { query: 'bmw x3 oil capacity', intent: 'Informational', topic: 'Car Maintenance, Repair & Parts', citations: 13, pct: 59.09 },
  { query: 'Jeep Renegade standard and upgraded tire sizes', intent: 'Informational', topic: 'Tires & Wheels', citations: 13, pct: 27.08 },
  { query: 'Jeep Renegade tire sizes standard upgraded wheels', intent: 'Informational', topic: 'Tires & Wheels', citations: 12, pct: 31.58 },
  { query: 'audi a5 battery location', intent: 'Learn and Solve', topic: 'Car Maintenance, Repair & Parts', citations: 12, pct: 16.90 },
  { query: '2019 toyota camry oil type', intent: 'Informational', topic: 'Car Maintenance, Repair & Parts', citations: 12, pct: 16.67 },
  { query: 'mini countryman oil type chart', intent: 'Informational', topic: 'Car Maintenance, Repair & Parts', citations: 12, pct: 22.22 },
  { query: 'mazda cx 5 spark plug replacement', intent: 'Learn and Solve', topic: 'Car Maintenance, Repair & Parts', citations: 12, pct: 16.44 },
  { query: 'toyota tundra transmission fluid', intent: 'Commercial', topic: 'Car Maintenance, Repair & Parts', citations: 12, pct: 28.57 },
  { query: 'dodge durango oil capacity', intent: 'Informational', topic: 'Car Maintenance, Repair & Parts', citations: 11, pct: 61.11 },
  { query: 'rav4 battery location', intent: 'Learn and Solve', topic: 'Car Maintenance, Repair & Parts', citations: 11, pct: 12.22 },
  { query: '2018 ford focus oil type', intent: 'Informational', topic: 'Car Maintenance, Repair & Parts', citations: 11, pct: 17.46 },
  { query: 'jeep renegade tire size', intent: 'Informational', topic: 'Tires & Wheels', citations: 10, pct: 45.45 },
  { query: 'mazda cx-5 wheel size', intent: 'Informational', topic: 'Tires & Wheels', citations: 10, pct: 23.81 },
];

// ─── Build make/model dictionary from production years ───────────────────────
const MAKE_DISPLAY = new Map(); // slug -> display name
const MODEL_DISPLAY = new Map(); // slug -> display name
const MODEL_TO_MAKE = new Map(); // model slug -> make display name
const VEHICLE_NAMES = []; // [{ makeSlug, modelSlug, make, model, start, end }]

for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
  const makeSlug = slugifyRoutePart(make);
  MAKE_DISPLAY.set(makeSlug, make);
  for (const [model, range] of Object.entries(models)) {
    const modelSlug = slugifyRoutePart(model);
    MODEL_DISPLAY.set(modelSlug, model);
    MODEL_TO_MAKE.set(modelSlug, make);
    VEHICLE_NAMES.push({ makeSlug, modelSlug, make, model, start: range.start, end: range.end });
  }
}

function tokenize(q) {
  return q.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/[\s-]+/).filter(Boolean);
}

function slugTokens(slug) {
  return slug.toLowerCase().split(/-/).filter(Boolean);
}

function queryHasMake(q, make) {
  const tokens = tokenize(q);
  const makeSlugTokens = slugTokens(slugifyRoutePart(make));
  return tokens.some((t) => make.toLowerCase() === t || makeSlugTokens.includes(t));
}

function findVehicleByModel(q) {
  const tokens = tokenize(q);
  const matches = [];

  for (const v of VEHICLE_NAMES) {
    const modelTokens = slugTokens(v.modelSlug);
    if (modelTokens.length === 0) continue;

    // Multi-word models: require consecutive tokens in order
    if (modelTokens.length > 1) {
      for (let i = 0; i <= tokens.length - modelTokens.length; i++) {
        if (modelTokens.every((t, j) => tokens[i + j] === t)) {
          const makeBonus = queryHasMake(q, v.make) ? 1000 : 0;
          matches.push({ ...v, score: v.model.length * 10 + makeBonus });
          break;
        }
      }
      continue;
    }

    // Single-word models: require an exact token match (not substring within another token)
    const t = modelTokens[0];
    if (tokens.includes(t)) {
      const makeBonus = queryHasMake(q, v.make) ? 1000 : 0;
      matches.push({ ...v, score: v.model.length + makeBonus });
    }
  }

  // Prefer matches where make is also in query, then longest model name, then recency
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.end - a.end;
  });
  return matches[0] || null;
}

function extractYear(q) {
  // 4-digit years
  const m4 = q.match(/\b(19|20)\d{2}\b/);
  if (m4) return parseInt(m4[0], 10);
  // 2-digit years (e.g. "07 ford mustang")
  const m2 = q.match(/\b'?(\d{2})\b/);
  if (m2) {
    const yy = parseInt(m2[1], 10);
    return yy >= 50 ? 1900 + yy : 2000 + yy;
  }
  return null;
}

function normalizeMake(q) {
  const qLower = q.toLowerCase();
  for (const [makeSlug, make] of MAKE_DISPLAY) {
    if (qLower.includes(make.toLowerCase()) || qLower.includes(makeSlug.replace(/-/g, ' '))) {
      return make;
    }
  }
  // Common aliases
  if (qLower.includes('chevy')) return 'Chevrolet';
  if (qLower.includes('vw')) return 'Volkswagen';
  if (qLower.includes('mercedes')) return 'Mercedes';
  if (qLower.includes('bmw')) return 'BMW';
  if (qLower.includes('mini')) return 'Mini';
  return null;
}

function pickYear(range, explicitYear) {
  if (explicitYear && explicitYear >= range.start && explicitYear <= range.end) return explicitYear;
  // Default to a recent model year that is likely to have data and match search intent
  const now = new Date().getFullYear();
  const latest = Math.min(range.end, now);
  // Prefer a mid-range year if latest is current (data may lag)
  if (latest >= now - 1) return Math.max(range.start, Math.min(range.end, now - 1));
  return latest;
}

const TASK_PHRASES = [
  { re: /belt tensioner pulley|tensioner pulley|serpentine belt/i, task: 'serpentine-belt-replacement' },
  { re: /timing belt/i, task: 'timing-belt-replacement' },
  { re: /timing chain/i, task: 'timing-chain-replacement' },
  { re: /cabin air filter/i, task: 'cabin-air-filter-replacement' },
  { re: /engine air filter/i, task: 'engine-air-filter-replacement' },
  { re: /spark plug/i, task: 'spark-plug-replacement' },
  { re: /brake pad/i, task: 'brake-pad-replacement' },
  { re: /brake rotor/i, task: 'brake-rotor-replacement' },
  { re: /alternator/i, task: 'alternator-replacement' },
  { re: /starter/i, task: 'starter-replacement' },
  { re: /battery( replacement)?/i, task: 'battery-replacement' },
  { re: /radiator/i, task: 'radiator-replacement' },
  { re: /thermostat/i, task: 'thermostat-replacement' },
  { re: /water pump/i, task: 'water-pump-replacement' },
  { re: /oil change/i, task: 'oil-change' },
  { re: /flush/i, task: 'coolant-flush' }, // special: not in VALID_TASKS
];

const TOOL_PHRASES = [
  { re: /battery location|battery size/i, type: 'battery-location' },
  { re: /tire size|wheel size/i, type: 'tire-size' },
  { re: /oil capacity|oil type|engine oil|what oil/i, type: 'oil-type' },
  { re: /fluid capacities|fluid capacity|capacity chart/i, type: 'fluid-capacity' },
  { re: /coolant color|coolant type|\bcoolant\b|antifreeze/i, type: 'coolant-type' },
  { re: /transmission fluid/i, type: 'transmission-fluid-type' },
  { re: /brake fluid/i, type: 'brake-fluid-type' },
  { re: /spark plug/i, type: 'spark-plug-type' },
  { re: /wiper blade/i, type: 'wiper-blade-size' },
  { re: /headlight bulb/i, type: 'headlight-bulb' },
  { re: /cabin air filter location/i, type: 'cabin-air-filter-replacement' }, // maps to repair task
];

function detectTask(q) {
  for (const { re, task } of TASK_PHRASES) if (re.test(q)) return task;
  return null;
}

function detectToolType(q) {
  for (const { re, type } of TOOL_PHRASES) if (re.test(q)) return type;
  return null;
}

function mapQueryToUrls(q) {
  const qLower = q.toLowerCase();
  const urls = [];

  // Static / hub pages
  if (/amazon auto parts|amazon car parts/i.test(q)) {
    urls.push({ url: '/blog/amazon-auto-parts-by-vehicle-year-and-type', kind: 'static', note: 'commercial affiliate hub' });
    return urls;
  }
  if (/all wiring diagrams/i.test(q)) {
    urls.push({ url: '/wiring', kind: 'static', note: 'wiring diagram hub' });
    return urls;
  }

  const explicitYear = extractYear(q);
  let vehicle = findVehicleByModel(q);
  let make = normalizeMake(q);
  let model = vehicle ? vehicle.model : null;

  // If make was inferred from text, ensure the model actually exists under that make
  if (make && model && VEHICLE_PRODUCTION_YEARS[make] && !VEHICLE_PRODUCTION_YEARS[make][model]) {
    // Make text may be ambiguous; trust the model's parent make instead
    make = vehicle.make;
  }

  // If only make was found but no model, or model not under make, fall back to vehicle match
  if (!model || !make || !VEHICLE_PRODUCTION_YEARS[make] || !VEHICLE_PRODUCTION_YEARS[make][model]) {
    if (vehicle) {
      make = vehicle.make;
      model = vehicle.model;
    }
  }

  if (!make || !model || !VEHICLE_PRODUCTION_YEARS[make] || !VEHICLE_PRODUCTION_YEARS[make][model]) {
    // If we have a make but no model, route to the make guide page
    if (make && VEHICLE_PRODUCTION_YEARS[make]) {
      urls.push({ url: `/guides/${slugifyRoutePart(make)}`, kind: 'make-guide', note: `make guide fallback for "${q}"` });
      return urls;
    }
    urls.push({ url: null, kind: 'unknown', note: `Could not resolve make/model for "${q}"` });
    return urls;
  }

  const range = VEHICLE_PRODUCTION_YEARS[make][model];
  const year = pickYear(range, explicitYear);
  const makeSlug = slugifyRoutePart(make);
  const modelSlug = slugifyRoutePart(model);

  // DTC code queries — use the generic code page unless vehicle-specific coverage is confirmed live
  const codeMatch = q.match(/\b([PBCU]\d{4})\b/i);
  if (codeMatch) {
    const code = codeMatch[1].toUpperCase();
    urls.push({ url: `/codes/${code}`, kind: 'dtc', note: 'generic DTC page (vehicle-specific code pages not yet live)' });
    return urls;
  }

  // Repair task queries
  const task = detectTask(q);
  if (task && VALID_TASKS.includes(task)) {
    urls.push({ url: `/repair/${year}/${makeSlug}/${modelSlug}/${task}`, kind: 'repair', note: `repair task: ${task}` });
    return urls;
  }
  if (task && task === 'coolant-flush') {
    // No dedicated coolant-flush task; route to thermostat replacement as closest, or repair hub
    urls.push({ url: `/repair/${year}/${makeSlug}/${modelSlug}`, kind: 'repair-hub', note: 'no dedicated coolant-flush task; repair hub' });
    return urls;
  }

  // Tool / maintenance spec queries
  const toolType = detectToolType(q);
  if (toolType) {
    if (toolType === 'cabin-air-filter-replacement') {
      urls.push({ url: `/repair/${year}/${makeSlug}/${modelSlug}/cabin-air-filter-replacement`, kind: 'repair', note: 'cabin air filter replacement' });
    } else {
      urls.push({ url: `/maintenance/${year}/${makeSlug}/${modelSlug}/${toolType}`, kind: 'maintenance', note: `maintenance spec: ${toolType}` });
    }
    // For oil capacity, also surface the fluid-capacity chart
    if (toolType === 'oil-type' && /capacity/i.test(q)) {
      urls.push({ url: `/maintenance/${year}/${makeSlug}/${modelSlug}/fluid-capacity`, kind: 'maintenance', note: 'fluid capacity chart' });
    }
    return urls;
  }

  // Fallback: vehicle hub
  urls.push({ url: `/vehicles/${year}/${makeSlug}/${modelSlug}`, kind: 'vehicle-hub', note: 'vehicle hub fallback' });
  return urls;
}

function hasToolData(make, model, toolType) {
  const pages = getToolPagesForVehicle(make, model);
  if (!pages || pages.length === 0) return false;
  return pages.some((p) => p.toolType === toolType);
}

function hasRepairData(make, model, task, year) {
  // Repair pages fetch from LMDB/CHARM; we can only infer via isValidVehicleCombination
  // and whether a tool-page entry exists for related specs.
  return true; // optimistic: repair routes exist if vehicle is in production years
}

function hasMaintenanceData(make, model, toolType, year) {
  // Tire size, oil type, coolant type, etc. use CHARM or tool-pages data
  if (toolType === 'tire-size') return true; // fetchMaintenanceData will try CHARM
  return hasToolData(make, model, toolType);
}

// ─── Production status checker ───────────────────────────────────────────────
function fetchStatus(url, depth = 0) {
  return new Promise((resolve) => {
    if (depth > 3) {
      resolve({ status: 'too-many-redirects', finalUrl: url, noindex: false });
      return;
    }
    const full = `${BASE_URL}${url}`;
    const req = https.get(
      full,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)',
          Accept: 'text/html',
        },
        timeout: 15000,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const loc = res.headers.location.startsWith('http')
            ? new URL(res.headers.location).pathname
            : res.headers.location;
          fetchStatus(loc, depth + 1).then((sub) =>
            resolve({
              status: sub.status,
              finalUrl: sub.finalUrl,
              noindex: sub.noindex,
              redirectChain: [url, ...(sub.redirectChain || [])],
            })
          );
          return;
        }
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          const noindex = /noindex/i.test(body);
          resolve({
            status: res.statusCode,
            finalUrl: url,
            noindex,
            bodySample: body.slice(0, 200).replace(/\s+/g, ' '),
          });
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 'timeout', finalUrl: url, noindex: false });
    });
    req.on('error', (err) => resolve({ status: `error: ${err.message}`, finalUrl: url, noindex: false }));
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`AI Citations Audit — ${QUERIES.length} queries`);
  console.log(`Status checks: ${CHECK_STATUS ? `enabled against ${BASE_URL}` : 'disabled (set CHECK_STATUS=1 to fetch)'}`);
  console.log('');

  const results = [];
  for (const q of QUERIES) {
    const mapped = mapQueryToUrls(q.query);
    for (const m of mapped) {
      let statusInfo = null;
      let dataInfo = null;

      if (m.url && m.kind === 'maintenance') {
        const match = m.url.match(/\/maintenance\/(\d+)\/([^/]+)\/([^/]+)\/([^/]+)/);
        if (match) {
          const [, year, makeSlug, modelSlug, toolType] = match;
          const make = getDisplayName(makeSlug, 'make');
          const model = getDisplayName(modelSlug, 'model');
          const clamped = getClampedYear(year, make, model);
          dataInfo = {
            make,
            model,
            year,
            toolType,
            clamped,
            hasData: clamped === null && hasMaintenanceData(make, model, toolType, parseInt(year, 10)),
          };
        }
      } else if (m.url && m.kind === 'repair') {
        const match = m.url.match(/\/repair\/(\d+)\/([^/]+)\/([^/]+)\/([^/]+)/);
        if (match) {
          const [, year, makeSlug, modelSlug, task] = match;
          const make = getDisplayName(makeSlug, 'make');
          const model = getDisplayName(modelSlug, 'model');
          const clamped = getClampedYear(year, make, model);
          dataInfo = { make, model, year, task, clamped, hasData: clamped === null };
        }
      } else if (m.url && m.kind === 'dtc') {
        const match = m.url.match(/\/vehicles\/(\d+)\/([^/]+)\/([^/]+)\/codes\/([^/]+)/);
        if (match) {
          const [, year, makeSlug, modelSlug, code] = match;
          const make = getDisplayName(makeSlug, 'make');
          const model = getDisplayName(modelSlug, 'model');
          const clamped = getClampedYear(year, make, model);
          dataInfo = { make, model, year, code, clamped, hasData: clamped === null };
        }
      }

      if (CHECK_STATUS && m.url) {
        statusInfo = await fetchStatus(m.url);
      }

      results.push({
        query: q.query,
        intent: q.intent,
        topic: q.topic,
        citations: q.citations,
        pct: q.pct,
        mappedUrl: m.url,
        kind: m.kind,
        note: m.note,
        dataInfo,
        statusInfo,
      });

      if (m.url) {
        const redirectNote = statusInfo?.redirectChain ? ` -> ${statusInfo.redirectChain.slice(1).join(' -> ')}` : '';
        const statusCol = statusInfo
          ? `${statusInfo.status}${statusInfo.noindex ? ' +noindex' : ''}${redirectNote}`
          : 'not checked';
        const dataCol = dataInfo ? (dataInfo.hasData ? 'data' : 'NO DATA') : '-';
        console.log(`${q.citations.toString().padStart(4)} ${q.pct.toFixed(2).padStart(6)}%  ${m.kind.padEnd(14)} ${dataCol.padEnd(8)} ${statusCol.slice(0, 50).padEnd(50)} ${m.url}`);
      } else {
        console.log(`${q.citations.toString().padStart(4)} ${q.pct.toFixed(2).padStart(6)}%  UNMAPPED       ${m.note}`);
      }
    }
  }

  // Summary
  const missingData = results.filter((r) => r.dataInfo && !r.dataInfo.hasData);
  const not200 = results.filter((r) => r.statusInfo && r.statusInfo.status !== 200);
  const noindexed = results.filter((r) => r.statusInfo && r.statusInfo.noindex);

  console.log('');
  console.log('=== Summary ===');
  console.log(`Total mapped URLs: ${results.filter((r) => r.mappedUrl).length}`);
  console.log(`Missing data:      ${missingData.length}`);
  console.log(`Non-200 statuses:  ${not200.length}`);
  console.log(`Noindexed pages:   ${noindexed.length}`);

  // Write report
  const reportPath = path.join(REPORTS_DIR, `ai-citations-audit-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({ baseUrl: BASE_URL, checked: CHECK_STATUS, results }, null, 2));
  console.log(`Report written: ${reportPath}`);

  // Write actionable gaps list
  const gapsPath = path.join(REPORTS_DIR, 'ai-citations-gaps.json');
  const gaps = missingData.map((r) => ({
    query: r.query,
    url: r.mappedUrl,
    kind: r.kind,
    dataInfo: r.dataInfo,
    citations: r.citations,
    pct: r.pct,
  }));
  fs.writeFileSync(gapsPath, JSON.stringify(gaps, null, 2));
  console.log(`Gaps written:   ${gapsPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
