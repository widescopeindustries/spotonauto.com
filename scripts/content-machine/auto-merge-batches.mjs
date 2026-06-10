#!/usr/bin/env node
/**
 * Auto-merge sub-agent batch outputs into vehicle-repair-profiles.json
 * and run affiliate link enrichment.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILES_PATH = join(__dirname, "../../src/data/vehicle-repair-profiles.json");
const BATCHES_DIR = join(__dirname, "batches");

function loadProfiles() {
  return JSON.parse(readFileSync(PROFILES_PATH, "utf8"));
}

function saveProfiles(data) {
  writeFileSync(PROFILES_PATH, JSON.stringify(data, null, 2));
}

function findBatchOutputs() {
  return readdirSync(BATCHES_DIR)
    .filter((f) => f.match(/^wave\d+-batch-\d+-output\.json$/))
    .map((f) => join(BATCHES_DIR, f))
    .filter((p) => existsSync(p));
}

function mergeBatch(mainData, batchPath) {
  let added = 0;
  let skipped = 0;
  try {
    const batch = JSON.parse(readFileSync(batchPath, "utf8"));
    const existingKeys = new Set(mainData.profiles.map((p) => p.key));
    for (const entry of batch) {
      if (!entry || !entry.key) continue;
      if (existingKeys.has(entry.key)) {
        skipped++;
        continue;
      }
      mainData.profiles.push(entry);
      existingKeys.add(entry.key);
      added++;
    }
    return { added, skipped, error: null };
  } catch (e) {
    return { added: 0, skipped: 0, error: e.message };
  }
}

function main() {
  const data = loadProfiles();
  const outputs = findBatchOutputs();
  let totalAdded = 0;
  let totalSkipped = 0;

  console.log(`Found ${outputs.length} batch outputs to merge`);

  for (const path of outputs) {
    const result = mergeBatch(data, path);
    if (result.error) {
      console.error(`  ❌ ${path}: ${result.error}`);
    } else {
      console.log(`  ✅ ${path}: +${result.added} new, ${result.skipped} duplicates skipped`);
      totalAdded += result.added;
      totalSkipped += result.skipped;
    }
  }

  saveProfiles(data);
  console.log(`\nTotal profiles: ${data.profiles.length}`);
  console.log(`Added in this run: ${totalAdded}`);
  console.log(`Duplicates skipped: ${totalSkipped}`);
}

main();
