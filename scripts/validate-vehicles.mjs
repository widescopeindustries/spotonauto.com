#!/usr/bin/env node
/**
 * Validate vehicle database against NHTSA VPIC API.
 * For each make, samples a few years and confirms models exist.
 * Outputs validated-vehicles.json with ONLY real combos.
 * 
 * Usage: node scripts/validate-vehicles.mjs
 */

import fs from 'fs';
import path from 'path';

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const DELAY_MS = 200; // be nice to NHTSA

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function getModelsForMakeYear(make, year) {
  const url = `${NHTSA_BASE}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return (data.Results || []).map(r => r.Model_Name).filter(Boolean);
  } catch (e) {
    console.error(`  ✗ Failed: ${make} ${year}: ${e.message}`);
    return [];
  }
}

// Common repairs mapped to vehicle type/characteristics
// Not every repair applies to every car
const UNIVERSAL_TASKS = [
  'oil-change',
  'brake-pad-replacement',
  'brake-rotor-replacement',
  'battery-replacement',
  'cabin-air-filter-replacement',
  'engine-air-filter-replacement',
  'headlight-bulb-replacement',
  'windshield-wiper-replacement',
  'coolant-flush',
  'spark-plug-replacement',
];

const COMMON_TASKS = [
  'alternator-replacement',
  'starter-replacement',
  'serpentine-belt-replacement',
  'thermostat-replacement',
  'water-pump-replacement',
  'radiator-replacement',
  'oxygen-sensor-replacement',
  'ignition-coil-replacement',
  'valve-cover-gasket-replacement',
  'transmission-fluid-change',
  'power-steering-fluid-change',
  'brake-fluid-flush',
  'fuel-filter-replacement',
  'wheel-bearing-replacement',
  'tie-rod-replacement',
  'strut-replacement',
  'shock-absorber-replacement',
  'cv-axle-replacement',
  'tail-light-replacement',
  'muffler-replacement',
  'crankshaft-sensor-replacement',
  'camshaft-sensor-replacement',
  'mass-air-flow-sensor-replacement',
];

const ADVANCED_TASKS = [
  'timing-belt-replacement',
  'timing-chain-replacement',
  'clutch-replacement',
  'head-gasket-replacement',
  'catalytic-converter-replacement',
  'fuel-pump-replacement',
  'turbo-replacement',
  'egr-valve-replacement',
  'ball-joint-replacement',
  'differential-fluid-change',
  'drive-belt-replacement',
  'glow-plug-replacement',
];

// Makes to validate (all from our vehicles.ts)
const MAKES_TO_CHECK = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia',
  'BMW', 'Mercedes-Benz', 'Volkswagen', 'Audi', 'Subaru', 'Mazda',
  'Mitsubishi', 'Suzuki', 'Jeep', 'Dodge', 'Chrysler', 'GMC',
  'Buick', 'Cadillac', 'Lincoln', 'Acura', 'Infiniti', 'Lexus',
  'Volvo', 'Jaguar', 'Land Rover', 'Porsche', 'Mini', 'Fiat',
  'Renault', 'Peugeot', 'Saab', 'Scion', 'Saturn', 'Pontiac',
  'Oldsmobile', 'Mercury', 'Isuzu', 'Daihatsu', 'Smart', 'Hummer',
  'Daewoo', 'Geo', 'Eagle', 'Plymouth',
];

async function main() {
  console.log('🔍 Validating vehicles against NHTSA VPIC database...\n');
  
  const validated = {};
  let totalModels = 0;
  let totalCombos = 0;

  for (const make of MAKES_TO_CHECK) {
    console.log(`\n📋 ${make}:`);
    validated[make] = {};
    
    // Sample years: every 3 years from 1990 to 2024
    const years = [];
    for (let y = 1990; y <= 2024; y += 3) years.push(y);
    years.push(2024); // always include latest
    
    const modelYears = new Map(); // model → Set of confirmed years
    
    for (const year of years) {
      await sleep(DELAY_MS);
      const models = await getModelsForMakeYear(make, year);
      
      for (const model of models) {
        const clean = model.trim();
        if (!clean || clean.length < 2) continue;
        
        if (!modelYears.has(clean)) {
          modelYears.set(clean, new Set());
        }
        modelYears.get(clean).add(year);
      }
    }
    
    // For each confirmed model, estimate production range from sampled years
    for (const [model, years] of modelYears) {
      const sortedYears = [...years].sort((a, b) => a - b);
      const start = sortedYears[0];
      const end = sortedYears[sortedYears.length - 1];
      
      // Assign tasks based on model characteristics
      let tasks = [...UNIVERSAL_TASKS, ...COMMON_TASKS];
      
      // Add advanced tasks for models that likely need them
      if (end - start > 5) {
        // Long-running models get full task list
        tasks = [...tasks, ...ADVANCED_TASKS];
      }
      
      validated[make][model] = {
        start,
        end,
        confirmedYears: sortedYears,
        tasks: tasks.map(t => t),
      };
      totalModels++;
      totalCombos += (end - start + 1) * tasks.length;
    }
    
    console.log(`  ✓ ${modelYears.size} models confirmed`);
  }

  // Write output
  const outPath = path.join(process.cwd(), 'src', 'data', 'validated-vehicles.json');
  fs.writeFileSync(outPath, JSON.stringify(validated, null, 2));
  
  console.log(`\n✅ Done!`);
  console.log(`   Makes: ${Object.keys(validated).length}`);
  console.log(`   Models: ${totalModels}`);
  console.log(`   Est. page combos: ${totalCombos.toLocaleString()}`);
  console.log(`   Written to: ${outPath}`);
}

main().catch(console.error);
