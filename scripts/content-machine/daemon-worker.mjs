#!/usr/bin/env node
/**
 * AllOEMManuals Content Generation Daemon
 * 
 * Runs continuously in the background on the VPS to:
 * 1. Pull ungenerated vehicle-repair combinations.
 * 2. Mine the PostgreSQL manual_embeddings table for relevant excerpts.
 * 3. Call the local Llama server to generate optimized title/description suffixes,
 *    an exact-fit support card, and 3 specific FAQs.
 * 4. Save the generated profile into public.vehicle_repair_profiles.
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getLocalPool } from "../../src/lib/manualEmbeddingsStore.ts";
import { slugifyRoutePart } from "../../src/data/vehicles.ts";
import { mineOEMContent, generateProfile } from "@/lib/repairGuideCompiler";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "../..");

// Load .env.local if present
try {
  const envPath = join(PROJECT_ROOT, ".env.local");
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
    }
  }
} catch {
  // Ignored
}

// Configuration
const SLEEP_MS = Number(process.env.DAEMON_SLEEP_MS) || 5000;

// Target tasks to generate
const TARGET_TASKS = [
  "battery-replacement",
  "oil-change",
  "spark-plug-replacement",
  "oxygen-sensor-replacement",
  "starter-replacement",
  "fuel-pump-replacement",
  "thermostat-replacement",
  "radiator-replacement",
  "water-pump-replacement",
  "transmission-fluid-change",
  "coolant-flush",
  "serpentine-belt-replacement"
];

// Helper to sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function submitToIndexNow(year, make, model, task) {
  const sMake = slugifyRoutePart(make);
  const sModel = slugifyRoutePart(model);
  const sTask = slugifyRoutePart(task);
  const url = `https://alloemmanuals.com/repair/${year}/${sMake}/${sModel}/${sTask}`;
  const encodedUrl = encodeURIComponent(url);
  const INDEXNOW_KEY = "b2e1ed9a4693444c8bf73f80fe75f1e0";
  const endpoint = `https://api.indexnow.org/IndexNow?url=${encodedUrl}&key=${INDEXNOW_KEY}`;

  try {
    const res = await fetch(endpoint);
    if (res.ok) {
      console.log(`   📡 IndexNow: Submitted successfully (${url})`);
    } else {
      console.log(`   ⚠️ IndexNow: Failed to submit (${url}) - HTTP status ${res.status}`);
    }
  } catch (err) {
    console.log(`   ⚠️ IndexNow: Error submitting (${url}): ${err.message}`);
  }
}

async function getPrioritizedTargets() {
  try {
    // Try to load query targets from query-targets-simple.json
    const targetsPath = join(PROJECT_ROOT, "scripts/content-machine/query-targets-simple.json");
    const data = JSON.parse(readFileSync(targetsPath, "utf8"));
    // Return sorted by impressions desc
    return data.sort((a, b) => b.impressions - a.impressions);
  } catch {
    return [];
  }
}

async function getGeneralTargets(pool) {
  console.log("Loading general targets from manual_embeddings database...");
  const { rows } = await pool.query(
    `SELECT DISTINCT year, make, model FROM manual_embeddings ORDER BY make, year, model`
  );
  return rows;
}

async function main() {
  const pool = getLocalPool();
  if (!pool) {
    console.error("FATAL: Could not establish PostgreSQL pool");
    process.exit(1);
  }

  // Handle dry-run flag
  const isDryRun = process.argv.includes("--dry-run");
  if (isDryRun) {
    console.log("=== Content Worker (Dry Run Mode) ===");
  }

  // Load prioritized opportunities from search console report
  const priorityQueue = await getPrioritizedTargets();
  console.log(`Loaded ${priorityQueue.length} prioritized GSC query targets.`);

  // Load general list of vehicles in manual database
  const generalQueue = await getGeneralTargets(pool);
  console.log(`Loaded ${generalQueue.length} vehicles from database.`);

  console.log("Starting generation daemon loop...");

  // 1. Process prioritized targets first
  for (const target of priorityQueue) {
    const key = `${target.year}:${slugifyRoutePart(target.make)}:${slugifyRoutePart(target.model)}:${slugifyRoutePart(target.task)}`;

    // Check if exists in DB
    const { rows } = await pool.query(
      `SELECT 1 FROM public.vehicle_repair_profiles WHERE key = $1`,
      [key]
    );

    if (rows.length > 0) {
      continue;
    }

    console.log(`\n⚡ Priority Target: ${target.year} ${target.make} ${target.model} - ${target.task}`);

    try {
      const excerpts = await mineOEMContent(target.year, target.make, target.model, target.task);
      if (excerpts.length === 0) {
        console.log(`⏭ Skipping: No relevant OEM excerpts found in DB`);
        continue;
      }

      console.log(`   Found ${excerpts.length} OEM excerpts.`);
      if (isDryRun) {
        console.log(`   [Dry Run] Would generate for: ${key}`);
        continue;
      }

      const profile = await generateProfile(target.year, target.make, target.model, target.task, excerpts);
      if (!profile) continue;

      // Save to Postgres
      await pool.query(
        `INSERT INTO public.vehicle_repair_profiles (key, year, make, model, task, profile)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (key) DO UPDATE SET profile = EXCLUDED.profile, updated_at = now()`,
        [key, Number(target.year), slugifyRoutePart(target.make), slugifyRoutePart(target.model), slugifyRoutePart(target.task), JSON.stringify(profile)]
      );

      console.log(`   ✅ Stored: ${profile.supportNote?.title || "No Title"}`);
      await submitToIndexNow(target.year, target.make, target.model, target.task);
    } catch (err) {
      console.error(`   ❌ Failed:`, err.message);
    }

    await sleep(SLEEP_MS);
  }

  // 2. Loop continuously over all vehicles in the database
  while (true) {
    let processedAny = false;

    for (const vehicle of generalQueue) {
      for (const task of TARGET_TASKS) {
        const key = `${vehicle.year}:${slugifyRoutePart(vehicle.make)}:${slugifyRoutePart(vehicle.model)}:${slugifyRoutePart(task)}`;

        // Check if exists in DB
        const { rows } = await pool.query(
          `SELECT 1 FROM public.vehicle_repair_profiles WHERE key = $1`,
          [key]
        );

        if (rows.length > 0) {
          continue;
        }

        console.log(`\n🚗 General Queue: ${vehicle.year} ${vehicle.make} ${vehicle.model} - ${task}`);

        try {
          const excerpts = await mineOEMContent(vehicle.year, vehicle.make, vehicle.model, task);
          if (excerpts.length === 0) {
            continue;
          }

          processedAny = true;
          console.log(`   Found ${excerpts.length} OEM excerpts.`);
          if (isDryRun) {
            console.log(`   [Dry Run] Would generate for: ${key}`);
            continue;
          }

          const profile = await generateProfile(vehicle.year, vehicle.make, vehicle.model, task, excerpts);
          if (!profile) continue;

          // Save to Postgres
          await pool.query(
            `INSERT INTO public.vehicle_repair_profiles (key, year, make, model, task, profile)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (key) DO UPDATE SET profile = EXCLUDED.profile, updated_at = now()`,
            [key, Number(vehicle.year), slugifyRoutePart(vehicle.make), slugifyRoutePart(vehicle.model), slugifyRoutePart(task), JSON.stringify(profile)]
          );

          console.log(`   ✅ Stored: ${profile.supportNote?.title || "No Title"}`);
          await submitToIndexNow(vehicle.year, vehicle.make, vehicle.model, task);
        } catch (err) {
          console.error(`   ❌ Failed:`, err.message);
        }

        await sleep(SLEEP_MS);
      }
    }

    if (!processedAny) {
      console.log("\nAll vehicle combinations completed. Sleeping for 1 hour before checking again...");
      await sleep(3600000);
    }
  }
}

main().catch((err) => {
  console.error("FATAL Daemon error:", err);
  process.exit(1);
});
