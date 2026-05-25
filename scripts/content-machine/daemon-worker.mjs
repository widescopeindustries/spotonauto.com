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
import OpenAI from "openai";
import { getLocalPool } from "../../src/lib/manualEmbeddingsStore.ts";
import { getRepairTaskProfile } from "../../src/lib/repairTaskProfiles.ts";
import { slugifyRoutePart } from "../../src/data/vehicles.ts";

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
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:7475/v1";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";
const SLEEP_MS = Number(process.env.DAEMON_SLEEP_MS) || 5000;

// Connect to Llama/Ollama server
const openai = new OpenAI({
  baseURL: OLLAMA_BASE_URL,
  apiKey: "ollama-dummy",
});

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

async function mineOEMContent(pool, year, make, model, task) {
  const profile = getRepairTaskProfile(task);
  const taskLabel = task.replace(/-/g, " ");
  const terms = [...profile.keywords, taskLabel];

  const conditions = [];
  const params = [make, Number(year)];
  
  const termConditions = [];
  for (let i = 0; i < terms.length; i++) {
    const paramIndex = params.length + 1;
    params.push(`%${terms[i].toLowerCase()}%`);
    termConditions.push(`(LOWER(section_title) LIKE $${paramIndex} OR LOWER(content_preview) LIKE $${paramIndex})`);
  }
  
  if (termConditions.length > 0) {
    conditions.push(`(${termConditions.join(" OR ")})`);
  }

  const query = `
    SELECT path, make, year, model, section_title, content_preview
    FROM manual_embeddings
    WHERE LOWER(make) = LOWER($1)
      AND year = $2
      ${conditions.length > 0 ? "AND " + conditions.join(" AND ") : ""}
    LIMIT 5
  `;

  const result = await pool.query(query, params);
  return result.rows.map((r) => ({
    sectionTitle: r.section_title,
    contentPreview: r.content_preview,
    path: r.path,
  }));
}

async function generateProfile(year, make, model, task, oemExcerpts) {
  const taskLabel = task.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const vehicleLabel = `${year} ${make} ${model}`;

  const excerptText = oemExcerpts
    .map(
      (e, i) =>
        `[Excerpt ${i + 1}] Section: ${e.sectionTitle}\nSource Path: ${e.path}\nContent:\n${e.contentPreview.slice(0, 500)}`
    )
    .join("\n\n");

  const prompt = `You are an expert automotive technical writer creating SEO-optimized repair guide content.

VEHICLE: ${vehicleLabel}
TASK: ${taskLabel}

RAW OEM SERVICE MANUAL EXCERPTS:
${excerptText}

INSTRUCTIONS:
Create a structured content profile for the exact vehicle and task above. The output will be used on a repair guide webpage and must be:
1. Keyword-dense for search engines.
2. Formatted as a JSON object containing the fields below.
3. Specific to the exact year, make, and model - not generic. Identify actual specs like torque values, socket sizes, and battery group sizes from the excerpts. If the excerpts do not contain them, use general automotive knowledge for this exact model.
4. Output ONLY valid JSON matching this schema exactly.
5. IMPORTANT: All FAQs must be 100% relevant to the specific task (${taskLabel}) and vehicle (${vehicleLabel}). Do not mix tasks! If the task is ${taskLabel}, do not generate FAQs about unrelated tasks like battery, spark plugs, or brakes.

{
  "titleSuffix": "Title suffix under 50 chars highlighting exact specs or warnings",
  "descriptionSuffix": "Meta description under 120 chars summarizing exact spec details",
  "extraKeywords": [
    "5-10 long-tail keywords specific to this vehicle and task"
  ],
  "supportNote": {
    "eyebrow": "Short label, e.g., 'Exact-fit check' or 'Warning'",
    "title": "Specific warning or tip for this exact vehicle",
    "intro": "1-2 sentence context explaining why this matters for this car",
    "bullets": [
      "3-5 actionable bullets, each a complete, specific sentence citing exact details (e.g. specs, tools, socket sizes)."
    ],
    "tone": "cyan"
  },
  "faqs": [
    {
      "question": "A specific search question directly about ${taskLabel} for this vehicle",
      "answer": "Detailed 2-4 sentence answer with specific specs/details from the excerpts."
    },
    {
      "question": "A second search question directly about ${taskLabel} for this vehicle (e.g. regarding symptoms, locations, or warnings)",
      "answer": "Detailed 2-4 sentence answer."
    },
    {
      "question": "A third search question directly about ${taskLabel} for this vehicle (e.g. regarding tools, torque values, or specific procedures)",
      "answer": "Detailed 2-4 sentence answer."
    }
  ]
}

Return ONLY the raw JSON string. Do not include markdown codeblocks or any conversational wrapper.`;

  const response = await openai.chat.completions.create({
    model: OLLAMA_MODEL,
    messages: [
      { role: "system", content: "You are a professional JSON generator. Output valid raw JSON only, matching the requested schema. No markdown formatting." },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
  });

  const rawText = response.choices[0]?.message?.content?.trim() || "";
  
  // Clean markdown json blocks if returned by the LLM
  let cleaned = rawText;
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error(`❌ Failed to parse JSON for ${vehicleLabel} - ${task}:`, err.message);
    return null;
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
      const excerpts = await mineOEMContent(pool, target.year, target.make, target.model, target.task);
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
          const excerpts = await mineOEMContent(pool, vehicle.year, vehicle.make, vehicle.model, task);
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
