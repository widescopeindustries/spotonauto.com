#!/usr/bin/env node
/**
 * Build a CLEAN vehicle database from NHTSA VPIC API.
 * Only passenger cars and light trucks. No motorcycles, ATVs, trailers, buses.
 *
 * Merges fresh NHTSA data with the existing validated-vehicles.json so manual
 * additions are preserved.
 *
 * Usage: node scripts/build-vehicle-db.mjs
 */

import fs from 'fs';
import path from 'path';

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const CONCURRENCY = 5;
const DELAY_MS = 100;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Vehicle types to INCLUDE (NHTSA VehicleTypeId)
const VALID_VEHICLE_TYPES = ['Passenger Car', 'Truck', 'Multipurpose Passenger Vehicle (MPV)'];

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

// Filter out obvious non-car models and duplicates
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
  // Strip common trim/engine suffixes to collapse variants
  let normalized = name
    .replace(/\s+/g, ' ')
    .replace(TRIM_SUFFIX_RE, '')
    .replace(/\s+(2WD|4WD|AWD|FWD|RWD|4x4|4x2|Quattro|xDrive|4MATIC)\b.*$/i, '')
    .replace(/\s+(V6|V8|V12|I4|I6|I3|1\.\dL|2\.\dL|3\.\dL|4\.\dL|5\.\dL|6\.\dL|1\.\dT|2\.\dT)\b.*$/i, '')
    .replace(/\s+(Hybrid|HEV|PHEV|EV|Electric|Diesel|TDI|CDI)\b.*$/i, '')
    .replace(/\s+(Sedan|Coupe|Hatchback|Wagon|SUV|Crossover|Convertible|Roadster|Minivan|Van|Truck)\b.*$/i, '')
    .replace(/\s+(2-Door|4-Door|2 Door|4 Door|2Dr|4Dr)\b.*$/i, '')
    .trim();

  // Collapse obvious variants
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
    'B-Series': 'B-Series',
  };
  for (const [from, to] of Object.entries(variants)) {
    normalized = normalized.replace(new RegExp(`\\b${from}\\b`, 'g'), to);
  }

  return normalized;
}

// Repair tasks — universal to all cars
const ALL_TASKS = [
  'oil-change', 'brake-pad-replacement', 'brake-rotor-replacement',
  'battery-replacement', 'spark-plug-replacement', 'alternator-replacement',
  'starter-replacement', 'serpentine-belt-replacement', 'timing-belt-replacement',
  'timing-chain-replacement', 'cabin-air-filter-replacement',
  'engine-air-filter-replacement', 'headlight-bulb-replacement',
  'tail-light-replacement', 'thermostat-replacement', 'water-pump-replacement',
  'radiator-replacement', 'fuel-filter-replacement', 'fuel-pump-replacement',
  'clutch-replacement', 'transmission-fluid-change', 'coolant-flush',
  'power-steering-fluid-change', 'wheel-bearing-replacement',
  'tie-rod-replacement', 'ball-joint-replacement', 'strut-replacement',
  'shock-absorber-replacement', 'cv-axle-replacement',
  'oxygen-sensor-replacement', 'mass-air-flow-sensor-replacement',
  'ignition-coil-replacement', 'egr-valve-replacement',
  'catalytic-converter-replacement', 'muffler-replacement',
  'brake-fluid-flush', 'valve-cover-gasket-replacement',
  'head-gasket-replacement', 'crankshaft-sensor-replacement',
  'camshaft-sensor-replacement', 'windshield-wiper-replacement',
  'drive-belt-replacement',
];

const MAKES_TO_CHECK = [
  // Big volume US/Japan/Korea
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia',
  'Mazda', 'Subaru', 'Mitsubishi',
  // European
  'BMW', 'Mercedes-Benz', 'Volkswagen', 'Audi', 'Volvo', 'Porsche',
  'Jaguar', 'Land Rover', 'Mini', 'Fiat', 'Peugeot', 'Saab', 'Smart',
  // US brands
  'Jeep', 'Dodge', 'Ram', 'Chrysler', 'GMC', 'Buick', 'Cadillac',
  'Lincoln', 'Acura', 'Infiniti', 'Lexus',
  // Defunct
  'Scion', 'Saturn', 'Pontiac', 'Oldsmobile', 'Mercury', 'Plymouth',
  'Hummer', 'Geo', 'Daewoo', 'Eagle', 'Isuzu', 'Suzuki', 'Daihatsu',
  // Additional global makes for scale
  'Tesla', 'Rivian', 'Lucid', 'Polestar', 'Genesis',
  'Renault', 'Citroen', 'SEAT', 'Skoda', 'Opel', 'Alfa Romeo',
  'Maserati', 'Ferrari', 'Lamborghini', 'Aston Martin', 'Bentley',
  'Rolls-Royce', 'McLaren', 'Lotus', 'Dacia', 'Lada', 'Holden',
  'Proton', 'Perodua', 'Mahindra', 'Tata', 'Maruti Suzuki',
  'Changan', 'Chery', 'Geely', 'Great Wall', 'BYD', 'Haval',
  'MG', 'Rover', 'Vauxhall',
];

// European / other makes not well covered by NHTSA — manual data
const MANUAL_MAKES = {
  'Renault': {
    'Clio': { start: 1991, end: 2025 },
    'Megane': { start: 1996, end: 2025 },
    'Captur': { start: 2013, end: 2025 },
    'Scenic': { start: 1997, end: 2025 },
    'Twingo': { start: 1993, end: 2025 },
    'Kangoo': { start: 1998, end: 2025 },
    'Kadjar': { start: 2015, end: 2022 },
    'Arkana': { start: 2021, end: 2025 },
    'Zoe': { start: 2013, end: 2024 },
    'Duster': { start: 2010, end: 2025 },
    'Laguna': { start: 1994, end: 2015 },
    'Koleos': { start: 2008, end: 2025 },
    'Talisman': { start: 2016, end: 2022 },
    'Espace': { start: 1984, end: 2025 },
  },
  'Citroen': {
    'C3': { start: 2002, end: 2025 },
    'C4': { start: 2004, end: 2025 },
    'C5': { start: 2001, end: 2025 },
    'Berlingo': { start: 1996, end: 2025 },
    'C3 Aircross': { start: 2017, end: 2025 },
    'C5 Aircross': { start: 2019, end: 2025 },
    'DS3': { start: 2010, end: 2019 },
    'C4 Cactus': { start: 2014, end: 2025 },
  },
  'SEAT': {
    'Ibiza': { start: 1984, end: 2025 },
    'Leon': { start: 1999, end: 2025 },
    'Arona': { start: 2018, end: 2025 },
    'Ateca': { start: 2016, end: 2025 },
    'Tarraco': { start: 2019, end: 2025 },
  },
  'Skoda': {
    'Octavia': { start: 1996, end: 2025 },
    'Fabia': { start: 2000, end: 2025 },
    'Superb': { start: 2002, end: 2025 },
    'Kodiaq': { start: 2017, end: 2025 },
    'Karoq': { start: 2018, end: 2025 },
    'Kamiq': { start: 2019, end: 2025 },
    'Rapid': { start: 2013, end: 2025 },
    'Scala': { start: 2019, end: 2025 },
  },
  'Opel': {
    'Corsa': { start: 1982, end: 2025 },
    'Astra': { start: 1991, end: 2025 },
    'Insignia': { start: 2009, end: 2025 },
    'Mokka': { start: 2013, end: 2025 },
    'Grandland': { start: 2017, end: 2025 },
    'Crossland': { start: 2017, end: 2025 },
    'Zafira': { start: 1999, end: 2019 },
    'Meriva': { start: 2003, end: 2017 },
  },
  'Alfa Romeo': {
    'Giulietta': { start: 2010, end: 2025 },
    'Giulia': { start: 2016, end: 2025 },
    'Stelvio': { start: 2017, end: 2025 },
    'MiTo': { start: 2008, end: 2018 },
    '159': { start: 2005, end: 2011 },
    'Tonale': { start: 2022, end: 2025 },
  },
};

async function runWithConcurrency(tasks, concurrency) {
  const results = [];
  const executing = [];
  for (const [index, task] of tasks.entries()) {
    const p = Promise.resolve().then(() => task()).then(result => ({ index, result }));
    results.push(p);
    if (results.length >= concurrency) {
      executing.push(Promise.race(results));
      await Promise.race(executing);
    }
    // Throttle slightly to be polite to NHTSA
    await sleep(DELAY_MS);
  }
  return Promise.all(results).then(arr => arr.map(r => r.result));
}

async function main() {
  console.log('🔍 Building validated vehicle database from NHTSA...\n');

  const validated = {};
  let totalModels = 0;

  const years = [];
  for (let y = YEAR_START; y <= YEAR_END; y++) years.push(y);

  for (const make of MAKES_TO_CHECK) {
    process.stdout.write(`📋 ${make}: `);
    validated[make] = {};

    const modelYears = new Map();

    // Query all years with bounded concurrency
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

    for (const [model, yrs] of modelYears) {
      const sortedYears = [...yrs].sort((a, b) => a - b);
      validated[make][model] = {
        start: sortedYears[0],
        end: sortedYears[sortedYears.length - 1],
      };
      totalModels++;
    }

    console.log(`${modelYears.size} models`);
  }

  // Add manual European makes
  for (const [make, models] of Object.entries(MANUAL_MAKES)) {
    if (!validated[make]) validated[make] = {};
    let added = 0;
    for (const [model, info] of Object.entries(models)) {
      if (!validated[make][model]) {
        validated[make][model] = info;
        added++;
        totalModels++;
      }
    }
    console.log(`📋 ${make}: ${added} models (manual)`);
  }

  // Merge with existing validated-vehicles.json to preserve manual fixes
  const outPath = path.join(process.cwd(), 'src', 'data', 'validated-vehicles.json');
  let existing = {};
  if (fs.existsSync(outPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
      console.log(`\n🔄 Merging ${Object.keys(existing).length} existing makes...`);
    } catch (e) {
      console.warn('Could not read existing validated-vehicles.json:', e.message);
    }
  }

  // New data wins for same make/model, but keep any existing make/model not returned by NHTSA
  const merged = { ...existing };
  for (const [make, models] of Object.entries(validated)) {
    if (!merged[make]) merged[make] = {};
    for (const [model, info] of Object.entries(models)) {
      // NHTSA data wins to refresh year ranges; merge start/end conservatively
      const existingInfo = merged[make][model];
      if (existingInfo) {
        merged[make][model] = {
          start: Math.min(info.start, existingInfo.start || info.start),
          end: Math.max(info.end, existingInfo.end || info.end),
        };
      } else {
        merged[make][model] = info;
      }
    }
  }

  // Clamp years to sane range and clip to 1982-2025
  const compact = {};
  for (const [make, models] of Object.entries(merged)) {
    compact[make] = {};
    for (const [model, info] of Object.entries(models)) {
      const start = Math.max(info.start || YEAR_START, YEAR_START);
      const end = Math.min(info.end || YEAR_END, YEAR_END);
      if (end < start) continue;
      compact[make][model] = { start, end };
    }
  }

  // Calculate total pages
  let totalPages = 0;
  let totalCombos = 0;
  for (const [, models] of Object.entries(compact)) {
    for (const [, info] of Object.entries(models)) {
      const yearSpan = info.end - info.start + 1;
      totalCombos += yearSpan;
      totalPages += yearSpan * ALL_TASKS.length;
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(compact, null, 2));

  console.log(`\n✅ Done!`);
  console.log(`   Makes: ${Object.keys(compact).length}`);
  console.log(`   Models: ${Object.values(compact).reduce((a, m) => a + Object.keys(m).length, 0)}`);
  console.log(`   Year/make/model combos: ${totalCombos.toLocaleString()}`);
  console.log(`   Tasks: ${ALL_TASKS.length}`);
  console.log(`   Total possible repair pages: ${totalPages.toLocaleString()}`);
  console.log(`   Written to: ${outPath}`);
}

main().catch(console.error);
