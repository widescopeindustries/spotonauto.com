#!/usr/bin/env node
/**
 * Fast expansion of validated-vehicles.json using NHTSA VPIC.
 * Focuses on high-yield US/import makes and merges results into the existing registry.
 *
 * Usage: node scripts/expand-vehicle-db-fast.mjs
 */

import fs from 'fs';
import path from 'path';

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const CONCURRENCY = 8;
const DELAY_MS = 50;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const YEAR_START = 1982;
const YEAR_END = 2025;

async function fetchJson(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function getModelsForMakeYear(make, year) {
  const endpoints = [
    `${NHTSA_BASE}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}/vehicletype/car?format=json`,
    `${NHTSA_BASE}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}/vehicletype/truck?format=json`,
    `${NHTSA_BASE}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}/vehicletype/multipurpose%20passenger%20vehicle%20(mpv)?format=json`,
  ];

  const all = new Set();
  for (const url of endpoints) {
    const data = await fetchJson(url);
    if (data?.Results) {
      for (const r of data.Results) {
        if (r.Model_Name) all.add(r.Model_Name.trim());
      }
    }
  }
  return [...all];
}

const JUNK_PATTERNS = [
  /incomplete/i, /chassis/i, /stripped/i, /cutaway/i, /glider/i,
  /bare$/i, /^cab\b/i, /motorhome/i, /^step van/i, /school bus/i,
  /unfinished/i, /incompl/i, /rollback/i, /tow truck/i, /ambulance/i,
  /fire truck/i, /dump truck/i, /garbage/i, /refuse/i, /concrete/i,
  /mixer/i, /flatbed/i, /stake bed/i, /box truck/i, /delivery/i,
  /cargo van/i, /passenger van/i, /shuttle/i, /cutaway van/i,
];

const TRIM_SUFFIX_RE = /\b(LX|EX|SX|SE|LE|XLE|Limited|Touring|Sport|Premium|Platinum|Reserve|Select|Essential|Ultimate|N-Line|GT-Line|R-Line|S-Line|M Sport|AMG Line|Design|Advance|Technology|Luxury|Elite|Overland|Summit|Trailhawk|Rubicon|Sahara|Mojave|High Altitude|Denali|AT4|LTZ|LT|LS|RS|SS|Z71|Z85|Zr2|Baja|Outdoorsman|Laramie|Big Horn|Tradesman|Limited|King Ranch|Platinum|Tremor|Raptor| Shelby|GT|GT350|GT500|Mach 1|Boss|Cobra|SVT|SHO|ST|RS|Nismo|Type R|Si|TRD|GR|GR86|BRZ|tS|Spec B|WRX|STI)\b.*$/i;

function isCleanModel(name) {
  if (!name || name.length < 2) return false;
  if (JUNK_PATTERNS.some(p => p.test(name))) return false;
  return true;
}

function normalizeModelName(name) {
  let normalized = name
    .replace(/\s+/g, ' ')
    .replace(TRIM_SUFFIX_RE, '')
    .replace(/\s+(2WD|4WD|AWD|FWD|RWD|4x4|4x2|Quattro|xDrive|4MATIC)\b.*$/i, '')
    .replace(/\s+(V6|V8|V12|I4|I6|I3|1\.\dL|2\.\dL|3\.\dL|4\.\dL|5\.\dL|6\.\dL|1\.\dT|2\.\dT)\b.*$/i, '')
    .replace(/\s+(Hybrid|HEV|PHEV|EV|Electric|Diesel|TDI|CDI)\b.*$/i, '')
    .replace(/\s+(Sedan|Coupe|Hatchback|Wagon|SUV|Crossover|Convertible|Roadster|Minivan|Van|Truck)\b.*$/i, '')
    .replace(/\s+(2-Door|4-Door|2 Door|4 Door|2Dr|4Dr)\b.*$/i, '')
    .trim();

  const variants = {
    'CR-V': 'CRV', 'cr-v': 'crv',
    'HR-V': 'HRV', 'hr-v': 'hrv',
    'BR-V': 'BRV', 'br-v': 'brv',
    'XR-V': 'XRV', 'xr-v': 'xrv',
    'UR-V': 'URV', 'ur-v': 'urv',
    'MX-5': 'MX5', 'mx-5': 'mx5',
    'CX-3': 'CX3', 'cx-3': 'cx3',
    'CX-30': 'CX30', 'cx-30': 'cx30',
    'CX-5': 'CX5', 'cx-5': 'cx5',
    'CX-7': 'CX7', 'cx-7': 'cx7',
    'CX-9': 'CX9', 'cx-9': 'cx9',
    'CX-50': 'CX50', 'cx-50': 'cx50',
    'CX-60': 'CX60', 'cx-60': 'cx60',
    'CX-70': 'CX70', 'cx-70': 'cx70',
    'CX-80': 'CX80', 'cx-80': 'cx80',
    'CX-90': 'CX90', 'cx-90': 'cx90',
    'MX-30': 'MX30', 'mx-30': 'mx30',
  };
  for (const [from, to] of Object.entries(variants)) {
    normalized = normalized.replace(new RegExp(`\\b${from}\\b`, 'g'), to);
  }

  return normalized;
}

// High-yield makes observed in NHTSA VPIC
const MAKES_TO_EXPAND = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia',
  'Mazda', 'Subaru', 'Mitsubishi',
  'BMW', 'Mercedes-Benz', 'Volkswagen', 'Audi', 'Volvo', 'Porsche',
  'Jaguar', 'Land Rover', 'Mini', 'Fiat', 'Peugeot', 'Saab', 'Smart',
  'Jeep', 'Dodge', 'Ram', 'Chrysler', 'GMC', 'Buick', 'Cadillac',
  'Lincoln', 'Acura', 'Infiniti', 'Lexus', 'Scion', 'Saturn', 'Pontiac',
  'Oldsmobile', 'Mercury', 'Plymouth', 'Hummer', 'Geo', 'Isuzu', 'Suzuki',
];

async function runWithConcurrency(tasks, concurrency) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      await sleep(DELAY_MS);
      results[i] = await tasks[i]();
    }
  }

  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log('🔍 Fast NHTSA expansion for high-yield makes...\n');

  const outPath = path.join(process.cwd(), 'src', 'data', 'validated-vehicles.json');
  const existing = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
  console.log(`Loaded ${Object.keys(existing).length} existing makes`);

  const years = [];
  for (let y = YEAR_START; y <= YEAR_END; y++) years.push(y);

  for (const make of MAKES_TO_EXPAND) {
    process.stdout.write(`📋 ${make}: `);
    const modelYears = new Map();

    // Seed with existing data so we don't shrink ranges
    if (existing[make]) {
      for (const [model, info] of Object.entries(existing[make])) {
        const years = new Set();
        for (let y = info.start; y <= info.end; y++) years.add(y);
        modelYears.set(model, years);
      }
    }

    const tasks = years.map(year => async () => {
      const models = await getModelsForMakeYear(make, year);
      return { year, models };
    });

    const yearResults = await runWithConcurrency(tasks, CONCURRENCY);

    for (const { year, models } of yearResults) {
      if (!models) continue;
      for (const model of models) {
        const clean = model.trim();
        if (!isCleanModel(clean)) continue;
        const normalized = normalizeModelName(clean);
        if (!normalized) continue;

        if (!modelYears.has(normalized)) {
          modelYears.set(normalized, new Set());
        }
        modelYears.get(normalized).add(year);
      }
    }

    const mergedModels = {};
    for (const [model, yrs] of modelYears) {
      const sortedYears = [...yrs].sort((a, b) => a - b);
      mergedModels[model] = {
        start: sortedYears[0],
        end: sortedYears[sortedYears.length - 1],
      };
    }

    existing[make] = mergedModels;
    console.log(`${Object.keys(mergedModels).length} models`);
  }

  // Clamp years
  for (const make of Object.keys(existing)) {
    for (const model of Object.keys(existing[make])) {
      const info = existing[make][model];
      const start = Math.max(info.start || YEAR_START, YEAR_START);
      const end = Math.min(info.end || YEAR_END, YEAR_END);
      if (end < start) {
        delete existing[make][model];
      } else {
        existing[make][model] = { start, end };
      }
    }
  }

  let totalCombos = 0;
  for (const [, models] of Object.entries(existing)) {
    for (const [, info] of Object.entries(models)) {
      totalCombos += info.end - info.start + 1;
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(existing, null, 2));

  console.log(`\n✅ Done!`);
  console.log(`   Makes: ${Object.keys(existing).length}`);
  console.log(`   Models: ${Object.values(existing).reduce((a, m) => a + Object.keys(m).length, 0)}`);
  console.log(`   Year/make/model combos: ${totalCombos.toLocaleString()}`);
  console.log(`   Written to: ${outPath}`);
}

main().catch(console.error);
