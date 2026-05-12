#!/usr/bin/env node
/**
 * Merge all batch outputs into the main vehicle-repair-profiles.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const batchDir = path.join(__dirname, "batches");
const outputPath = path.join(__dirname, "../../src/data/vehicle-repair-profiles.json");

// Load existing profiles
const existingRaw = JSON.parse(fs.readFileSync(outputPath, "utf8"));
const existingProfiles = Array.isArray(existingRaw) ? existingRaw : (existingRaw.profiles || []);
const existingKeys = new Set(existingProfiles.map(p => p.key));

console.log(`Existing profiles: ${existingProfiles.length}`);

// Find all batch output files
const outputFiles = fs.readdirSync(batchDir)
  .filter(f => f.endsWith("-output.json"))
  .map(f => path.join(batchDir, f));

console.log(`Batch output files found: ${outputFiles.length}`);

let mergedCount = 0;
let skippedCount = 0;
let errorCount = 0;

for (const file of outputFiles) {
  try {
    const batchRaw = JSON.parse(fs.readFileSync(file, "utf8"));
    const batch = Array.isArray(batchRaw) ? batchRaw : (batchRaw.profiles || []);
    if (!Array.isArray(batch)) {
      console.warn(`  SKIP (not array): ${path.basename(file)}`);
      errorCount++;
      continue;
    }
    
    for (const profile of batch) {
      if (!profile.key) {
        console.warn(`  SKIP (no key): ${JSON.stringify(profile).slice(0, 100)}`);
        errorCount++;
        continue;
      }
      
      if (existingKeys.has(profile.key)) {
        skippedCount++;
        continue;
      }
      
      existingProfiles.push(profile);
      existingKeys.add(profile.key);
      mergedCount++;
    }
    
    console.log(`  MERGED: ${path.basename(file)} — ${batch.length} items`);
  } catch (err) {
    console.error(`  ERROR: ${path.basename(file)} — ${err.message}`);
    errorCount++;
  }
}

// Write merged output
const output = {
  generatedAt: new Date().toISOString(),
  generatorVersion: "1.1.0-subagent-fleet",
  count: existingProfiles.length,
  profiles: existingProfiles,
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\n=== MERGE COMPLETE ===`);
console.log(`New profiles merged: ${mergedCount}`);
console.log(`Duplicates skipped: ${skippedCount}`);
console.log(`Errors: ${errorCount}`);
console.log(`Total profiles: ${existingProfiles.length}`);
