#!/usr/bin/env node
/**
 * Create DTC batch files for vehicle-specific diagnostic pages.
 *
 * Inputs:
 *   - query-targets-simple.json (for validated vehicle combinations + impressions)
 *
 * Outputs:
 *   - dtc-batches/batch-dtc-###.json (20 entries each)
 *   - dtc-batches/manifest.json
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Top 50 DTC codes by estimated search volume
const TOP_CODES = [
  { code: "P0420", title: "Catalyst System Efficiency Below Threshold (Bank 1)", system: "Emissions", commonFix: "Replace catalytic converter or O2 sensor" },
  { code: "P0300", title: "Random/Multiple Cylinder Misfire Detected", system: "Engine", commonFix: "Replace spark plugs, coils, or injectors" },
  { code: "P0010", title: "Intake Camshaft Position Actuator Circuit (Bank 1)", system: "Engine", commonFix: "Replace VVT solenoid" },
  { code: "P0301", title: "Cylinder 1 Misfire Detected", system: "Engine", commonFix: "Replace spark plug, coil, or injector for cylinder 1" },
  { code: "P0302", title: "Cylinder 2 Misfire Detected", system: "Engine", commonFix: "Replace spark plug, coil, or injector for cylinder 2" },
  { code: "P0303", title: "Cylinder 3 Misfire Detected", system: "Engine", commonFix: "Replace spark plug, coil, or injector for cylinder 3" },
  { code: "P0304", title: "Cylinder 4 Misfire Detected", system: "Engine", commonFix: "Replace spark plug, coil, or injector for cylinder 4" },
  { code: "P0305", title: "Cylinder 5 Misfire Detected", system: "Engine", commonFix: "Replace spark plug, coil, or injector for cylinder 5" },
  { code: "P0306", title: "Cylinder 6 Misfire Detected", system: "Engine", commonFix: "Replace spark plug, coil, or injector for cylinder 6" },
  { code: "P0171", title: "System Too Lean (Bank 1)", system: "Fuel", commonFix: "Fix vacuum leak or replace MAF sensor" },
  { code: "P0174", title: "System Too Lean (Bank 2)", system: "Fuel", commonFix: "Fix vacuum leak or replace MAF sensor" },
  { code: "P0442", title: "Evaporative Emission System Leak Detected (Small Leak)", system: "Emissions", commonFix: "Replace gas cap or EVAP purge valve" },
  { code: "P0455", title: "Evaporative Emission System Leak Detected (Gross Leak)", system: "Emissions", commonFix: "Replace EVAP canister or repair hose" },
  { code: "P0456", title: "Evaporative Emission System Leak Detected (Very Small Leak)", system: "Emissions", commonFix: "Replace gas cap or purge valve" },
  { code: "P0401", title: "Exhaust Gas Recirculation Flow Insufficient", system: "Emissions", commonFix: "Clean or replace EGR valve" },
  { code: "P0135", title: "O2 Sensor Heater Circuit (Bank 1, Sensor 1)", system: "Emissions", commonFix: "Replace upstream O2 sensor" },
  { code: "P0141", title: "O2 Sensor Heater Circuit (Bank 1, Sensor 2)", system: "Emissions", commonFix: "Replace downstream O2 sensor" },
  { code: "P0155", title: "O2 Sensor Heater Circuit (Bank 2, Sensor 1)", system: "Emissions", commonFix: "Replace upstream O2 sensor bank 2" },
  { code: "P0161", title: "O2 Sensor Heater Circuit (Bank 2, Sensor 2)", system: "Emissions", commonFix: "Replace downstream O2 sensor bank 2" },
  { code: "P0325", title: "Knock Sensor Circuit (Bank 1)", system: "Engine", commonFix: "Replace knock sensor" },
  { code: "P0335", title: "Crankshaft Position Sensor A Circuit", system: "Engine", commonFix: "Replace crankshaft position sensor" },
  { code: "P0340", title: "Camshaft Position Sensor Circuit", system: "Engine", commonFix: "Replace camshaft position sensor" },
  { code: "P0400", title: "Exhaust Gas Recirculation Flow", system: "Emissions", commonFix: "Clean or replace EGR valve" },
  { code: "P0411", title: "Secondary Air Injection System Incorrect Flow", system: "Emissions", commonFix: "Replace air injection pump or valve" },
  { code: "P0430", title: "Catalyst System Efficiency Below Threshold (Bank 2)", system: "Emissions", commonFix: "Replace catalytic converter bank 2" },
  { code: "P0440", title: "Evaporative Emission Control System", system: "Emissions", commonFix: "Replace gas cap or purge valve" },
  { code: "P0441", title: "Evaporative Emission Control System Incorrect Purge Flow", system: "Emissions", commonFix: "Replace purge valve" },
  { code: "P0446", title: "Evaporative Emission Control System Vent Control Circuit", system: "Emissions", commonFix: "Replace vent valve" },
  { code: "P0452", title: "Evaporative Emission Control System Pressure Sensor Low Input", system: "Emissions", commonFix: "Replace fuel tank pressure sensor" },
  { code: "P0453", title: "Evaporative Emission Control System Pressure Sensor High Input", system: "Emissions", commonFix: "Replace fuel tank pressure sensor" },
  { code: "P0463", title: "Fuel Level Sensor Circuit High Input", system: "Fuel", commonFix: "Replace fuel level sensor" },
  { code: "P0500", title: "Vehicle Speed Sensor", system: "Transmission", commonFix: "Replace VSS or repair wiring" },
  { code: "P0505", title: "Idle Air Control System", system: "Engine", commonFix: "Clean or replace IAC valve" },
  { code: "P0506", title: "Idle Air Control System RPM Lower Than Expected", system: "Engine", commonFix: "Clean throttle body or replace IAC" },
  { code: "P0507", title: "Idle Air Control System RPM Higher Than Expected", system: "Engine", commonFix: "Clean throttle body or replace IAC" },
  { code: "P0562", title: "System Voltage Low", system: "Electrical", commonFix: "Replace battery or alternator" },
  { code: "P0603", title: "Internal Control Module Keep Alive Memory Error", system: "Electrical", commonFix: "Replace ECM or check battery" },
  { code: "P0700", title: "Transmission Control System Malfunction", system: "Transmission", commonFix: "Diagnose with scan tool for specific transmission code" },
  { code: "P0705", title: "Transmission Range Sensor Circuit Malfunction", system: "Transmission", commonFix: "Replace neutral safety switch" },
  { code: "P0715", title: "Input/Turbine Speed Sensor Circuit", system: "Transmission", commonFix: "Replace input speed sensor" },
  { code: "P0720", title: "Output Speed Sensor Circuit", system: "Transmission", commonFix: "Replace output speed sensor" },
  { code: "P0730", title: "Incorrect Gear Ratio", system: "Transmission", commonFix: "Repair transmission or replace sensors" },
  { code: "P0740", title: "Torque Converter Clutch Circuit Malfunction", system: "Transmission", commonFix: "Replace TCC solenoid" },
  { code: "P0750", title: "Shift Solenoid A Malfunction", system: "Transmission", commonFix: "Replace shift solenoid A" },
  { code: "P0760", title: "Shift Solenoid C Malfunction", system: "Transmission", commonFix: "Replace shift solenoid C" },
  { code: "P0770", title: "Shift Solenoid E Malfunction", system: "Transmission", commonFix: "Replace shift solenoid E" },
  { code: "P0780", title: "Shift Malfunction", system: "Transmission", commonFix: "Diagnose transmission internals" },
  { code: "P0800", title: "Transfer Case Control System", system: "Transmission", commonFix: "Service transfer case or replace actuator" },
  { code: "P0011", title: "Intake Camshaft Position Timing Over-Advanced (Bank 1)", system: "Engine", commonFix: "Replace VVT solenoid or change oil" },
  { code: "P0012", title: "Intake Camshaft Position Timing Over-Retarded (Bank 1)", system: "Engine", commonFix: "Replace VVT solenoid or change oil" },
];

const INPUT_PATH = join(__dirname, "query-targets-simple.json");
const BATCH_DIR = join(__dirname, "dtc-batches");

// Load vehicles, aggregate by impressions
const targets = JSON.parse(readFileSync(INPUT_PATH, "utf8"));
const vehicleImpressions = {};
for (const t of targets) {
  const key = `${t.year}|${t.make}|${t.model}|${t.modelSlug}`;
  if (!vehicleImpressions[key]) {
    vehicleImpressions[key] = { year: t.year, make: t.make, model: t.model, modelSlug: t.modelSlug, impressions: 0 };
  }
  vehicleImpressions[key].impressions += t.impressions || 0;
}

const vehicles = Object.values(vehicleImpressions)
  .sort((a, b) => b.impressions - a.impressions)
  .slice(0, 200);

console.log(`Selected top ${vehicles.length} vehicles by impressions`);

// Build combinations
const combinations = [];
for (const v of vehicles) {
  for (const code of TOP_CODES) {
    combinations.push({
      year: v.year,
      make: v.make,
      model: v.model,
      modelSlug: v.modelSlug,
      code: code.code,
      codeTitle: code.title,
      system: code.system,
      commonFix: code.commonFix,
    });
  }
}

console.log(`Total combinations: ${combinations.length}`);

// Create batches
mkdirSync(BATCH_DIR, { recursive: true });
const BATCH_SIZE = 20;
const batches = [];

for (let i = 0; i < combinations.length; i += BATCH_SIZE) {
  const batch = combinations.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const inputFile = `batch-dtc-${String(batchNum).padStart(4, "0")}.json`;
  const outputFile = `batch-dtc-${String(batchNum).padStart(4, "0")}-output.json`;
  const inputPath = join(BATCH_DIR, inputFile);

  writeFileSync(inputPath, JSON.stringify(batch, null, 2));

  batches.push({
    batchNum,
    count: batch.length,
    inputFile,
    outputFile,
    inputPath,
    outputPath: join(BATCH_DIR, outputFile),
  });
}

const manifest = {
  generatedAt: new Date().toISOString(),
  totalCombinations: combinations.length,
  totalBatches: batches.length,
  batchSize: BATCH_SIZE,
  vehicles: vehicles.length,
  codes: TOP_CODES.length,
  batches,
};

writeFileSync(join(BATCH_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));

console.log(`Created ${batches.length} batch files in ${BATCH_DIR}`);
console.log(`Manifest: ${join(BATCH_DIR, "manifest.json")}`);
