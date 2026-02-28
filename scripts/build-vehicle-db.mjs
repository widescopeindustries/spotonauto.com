#!/usr/bin/env node
/**
 * Build a CLEAN vehicle database from NHTSA VPIC API.
 * Only passenger cars and light trucks. No motorcycles, ATVs, trailers, buses.
 * 
 * Usage: node scripts/build-vehicle-db.mjs
 */

import fs from 'fs';
import path from 'path';

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const DELAY_MS = 250;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Vehicle types to INCLUDE (NHTSA VehicleTypeId)
// 2 = Passenger Car, 3 = Truck, 5 = Bus (skip), 7 = Multipurpose Passenger Vehicle (SUV/crossover)
const VALID_VEHICLE_TYPES = ['Passenger Car', 'Truck', 'Multipurpose Passenger Vehicle (MPV)'];

async function getModelsForMakeYear(make, year) {
  // Use the vehicleType filter to only get cars/trucks
  const url = `${NHTSA_BASE}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}/vehicletype/car?format=json`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const carModels = (data.Results || []).map(r => r.Model_Name).filter(Boolean);
    
    // Also get trucks/SUVs
    const url2 = `${NHTSA_BASE}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}/vehicletype/truck?format=json`;
    const res2 = await fetch(url2);
    const data2 = await res2.json();
    const truckModels = (data2.Results || []).map(r => r.Model_Name).filter(Boolean);
    
    // Also MPVs (SUVs, crossovers, minivans)
    const url3 = `${NHTSA_BASE}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}/vehicletype/multipurpose passenger vehicle (mpv)?format=json`;
    const res3 = await fetch(url3);
    const data3 = await res3.json();
    const mpvModels = (data3.Results || []).map(r => r.Model_Name).filter(Boolean);
    
    // Deduplicate
    const all = [...new Set([...carModels, ...truckModels, ...mpvModels])];
    return all;
  } catch (e) {
    console.error(`  ✗ Failed: ${make} ${year}: ${e.message}`);
    return [];
  }
}

// Filter out obvious non-car models
const JUNK_PATTERNS = [
  /incomplete/i, /chassis/i, /stripped/i, /cutaway/i, /glider/i,
  /bare$/i, /^cab\b/i, /motorhome/i, /^step van/i, /school bus/i,
];

function isCleanModel(name) {
  if (!name || name.length < 2) return false;
  return !JUNK_PATTERNS.some(p => p.test(name));
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
];

// European makes not in NHTSA — add manually with known data
const MANUAL_MAKES = {
  'Renault': {
    'Clio': { start: 1991, end: 2024 },
    'Megane': { start: 1996, end: 2024 },
    'Captur': { start: 2013, end: 2024 },
    'Scenic': { start: 1997, end: 2024 },
    'Twingo': { start: 1993, end: 2024 },
    'Kangoo': { start: 1998, end: 2024 },
    'Kadjar': { start: 2015, end: 2022 },
    'Arkana': { start: 2021, end: 2024 },
    'Zoe': { start: 2013, end: 2024 },
    'Duster': { start: 2010, end: 2024 },
    'Laguna': { start: 1994, end: 2015 },
    'Koleos': { start: 2008, end: 2024 },
  },
  'Citroen': {
    'C3': { start: 2002, end: 2024 },
    'C4': { start: 2004, end: 2024 },
    'C5': { start: 2001, end: 2024 },
    'Berlingo': { start: 1996, end: 2024 },
    'C3 Aircross': { start: 2017, end: 2024 },
    'C5 Aircross': { start: 2019, end: 2024 },
    'DS3': { start: 2010, end: 2019 },
  },
  'SEAT': {
    'Ibiza': { start: 1984, end: 2024 },
    'Leon': { start: 1999, end: 2024 },
    'Arona': { start: 2018, end: 2024 },
    'Ateca': { start: 2016, end: 2024 },
    'Tarraco': { start: 2019, end: 2024 },
  },
  'Skoda': {
    'Octavia': { start: 1996, end: 2024 },
    'Fabia': { start: 2000, end: 2024 },
    'Superb': { start: 2002, end: 2024 },
    'Kodiaq': { start: 2017, end: 2024 },
    'Karoq': { start: 2018, end: 2024 },
    'Kamiq': { start: 2019, end: 2024 },
    'Rapid': { start: 2013, end: 2024 },
  },
  'Opel': {
    'Corsa': { start: 1982, end: 2024 },
    'Astra': { start: 1991, end: 2024 },
    'Insignia': { start: 2009, end: 2024 },
    'Mokka': { start: 2013, end: 2024 },
    'Grandland': { start: 2017, end: 2024 },
    'Crossland': { start: 2017, end: 2024 },
    'Zafira': { start: 1999, end: 2019 },
    'Meriva': { start: 2003, end: 2017 },
  },
  'Alfa Romeo': {
    'Giulietta': { start: 2010, end: 2024 },
    'Giulia': { start: 2016, end: 2024 },
    'Stelvio': { start: 2017, end: 2024 },
    'MiTo': { start: 2008, end: 2018 },
    '159': { start: 2005, end: 2011 },
    'Tonale': { start: 2022, end: 2024 },
  },
};

async function main() {
  console.log('🔍 Building validated vehicle database from NHTSA...\n');
  
  const validated = {};
  let totalModels = 0;

  for (const make of MAKES_TO_CHECK) {
    process.stdout.write(`📋 ${make}: `);
    validated[make] = {};
    
    // Sample years every 2 years from 1990 to 2024
    const years = [];
    for (let y = 1990; y <= 2024; y += 2) years.push(y);
    if (!years.includes(2024)) years.push(2024);
    if (!years.includes(2023)) years.push(2023);
    
    const modelYears = new Map();
    
    for (const year of years) {
      await sleep(DELAY_MS);
      const models = await getModelsForMakeYear(make, year);
      
      for (const model of models) {
        const clean = model.trim();
        if (!isCleanModel(clean)) continue;
        
        if (!modelYears.has(clean)) {
          modelYears.set(clean, new Set());
        }
        modelYears.get(clean).add(year);
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
    console.log(`📋 ${make}: ${Object.keys(models).length} models (manual)`);
    validated[make] = models;
    totalModels += Object.keys(models).length;
  }

  // Calculate total pages
  let totalPages = 0;
  for (const [make, models] of Object.entries(validated)) {
    for (const [model, info] of Object.entries(models)) {
      const yearSpan = info.end - info.start + 1;
      totalPages += yearSpan * ALL_TASKS.length;
    }
  }

  // Write compact version for vehicles.ts (just make/model/years, no tasks — tasks are global)
  const compact = {};
  for (const [make, models] of Object.entries(validated)) {
    compact[make] = {};
    for (const [model, info] of Object.entries(models)) {
      compact[make][model] = { start: info.start, end: info.end };
    }
  }

  const outPath = path.join(process.cwd(), 'src', 'data', 'validated-vehicles.json');
  fs.writeFileSync(outPath, JSON.stringify(compact, null, 2));
  
  console.log(`\n✅ Done!`);
  console.log(`   Makes: ${Object.keys(validated).length}`);
  console.log(`   Models: ${totalModels}`);
  console.log(`   Tasks: ${ALL_TASKS.length}`);
  console.log(`   Total possible pages: ${totalPages.toLocaleString()}`);
  console.log(`   Written to: ${outPath}`);
}

main().catch(console.error);
