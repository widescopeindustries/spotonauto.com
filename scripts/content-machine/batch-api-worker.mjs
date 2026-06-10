#!/usr/bin/env node
/**
 * AllOEMManuals Batch API Content Worker
 *
 * Uses OpenAI GPT-4o-mini to generate repair profiles in batches of 20.
 * Mines OEM excerpts from PostgreSQL manual_embeddings.
 * Stores results in PostgreSQL + JSON backup.
 * Resumable, concurrent, with retry logic.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import pLimit from "p-limit";
import { getLocalPool } from "../../src/lib/manualEmbeddingsStore.ts";
import { getRepairTaskProfile } from "../../src/lib/repairTaskProfiles.ts";
import { slugifyRoutePart } from "../../src/data/vehicles.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "../..");

// Load .env.local
const envPath = join(PROJECT_ROOT, ".env.local");
try {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
    }
  }
} catch {
  // ignored
}

// Config
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
const BATCH_SIZE = 20;
const CONCURRENCY = 5;
const RETRIES = 3;
const DELAY_MS = 500;
const SLEEP_BETWEEN_BATCHES = 300;

const INPUT_PATH = join(__dirname, "query-targets-simple.json");
const BACKUP_PATH = join(__dirname, "batch-api-output.json");
const PROGRESS_PATH = join(__dirname, "batch-api-progress.json");
const ERROR_PATH = join(__dirname, "batch-api-errors.json");

const openai = new OpenAI({ apiKey: OPENAI_API_KEY, timeout: 120000 });
const limit = pLimit(CONCURRENCY);

// Simple async mutex for file writes
let writeQueue = Promise.resolve();
async function atomicWriteFile(path, data) {
  await writeQueue;
  const promise = new Promise((resolve, reject) => {
    try {
      writeFileSync(path, data);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
  writeQueue = promise.catch(() => {});
  return promise;
}

async function mineOEMContent(pool, year, make, model, task) {
  let profile;
  try {
    profile = getRepairTaskProfile(task);
  } catch {
    profile = { keywords: [task.replace(/-/g, " ")] };
  }
  const taskLabel = task.replace(/-/g, " ");
  const terms = [...(profile.keywords || []), taskLabel];

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

  try {
    const result = await pool.query(query, params);
    return result.rows.map((r) => ({
      sectionTitle: r.section_title,
      contentPreview: r.content_preview,
      path: r.path,
    }));
  } catch (e) {
    console.error(`   DB error for ${year} ${make} ${model} - ${task}:`, e.message);
    return [];
  }
}

function buildBatchPrompt(batchTargets) {
  let prompt = `You are an expert automotive technical writer for AllOEMManuals.com.

Generate repair profiles for the following ${batchTargets.length} vehicles.
For each vehicle, OEM service manual excerpts are provided below.

CRITICAL RULES:
1. Be SPECIFIC — include exact part numbers, torque values, socket sizes, capacities
2. Include "partsNeeded" with 3-8 items relevant to this EXACT repair on this EXACT vehicle
3. Include "toolsNeeded" with 3-6 specific tools including socket sizes
4. Include "torqueSpecs" with at least 2 torque values for this repair
5. Every supportNote bullet must contain a number, spec, or part reference
6. Do NOT hallucinate — use known OEM specs. If uncertain, state the most common engine/config
7. Output ONLY a valid JSON array. No markdown, no commentary.

OUTPUT SCHEMA per profile:
{
  "key": "year:make:model:task",
  "year": 20XX,
  "make": "lowercase-make",
  "model": "lowercase-model-slug",
  "task": "task-slug",
  "profile": {
    "titleSuffix": "Short SEO title (30-50 chars) with exact spec",
    "descriptionSuffix": "Meta description (120-160 chars) with exact specs",
    "extraKeywords": ["5-8 long-tail keyword phrases"],
    "supportNote": {
      "eyebrow": "Exact-fit quick check",
      "title": "Specific headline with vehicle + task + key spec",
      "intro": "2-3 sentence intro about what makes this vehicle+task unique",
      "bullets": ["5-7 actionable bullets with exact OEM specs, part numbers, torque values, tools, warnings"],
      "tone": "cyan|emerald|amber|rose|violet|indigo"
    },
    "faq": {"question": "Exact question a searcher would type", "answer": "2-4 sentence answer with specific part numbers and specs"},
    "partsNeeded": [{"name": "Part name", "partNumber": "OEM or common aftermarket number", "quantity": "1", "notes": "fitment note"}],
    "toolsNeeded": [{"name": "Tool name", "size": "e.g. 10mm", "notes": "specialty tool note"}],
    "torqueSpecs": [{"component": "Component name", "value": "e.g. 18 ft-lb", "notes": "torque sequence note"}]
  }
}

TONE COLORS:
- cyan: general maintenance (oil, filters, fluids)
- emerald: engine/transmission/drivetrain
- amber: electrical, lighting, battery
- rose: brakes, safety-critical
- violet: cooling system
- indigo: belts, pulleys, timing

`;

  for (let i = 0; i < batchTargets.length; i++) {
    const t = batchTargets[i];
    prompt += `\n--- TARGET ${i + 1} ---\n`;
    prompt += `Vehicle: ${t.year} ${t.make} ${t.model}\n`;
    prompt += `Task: ${t.task.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}\n`;
    prompt += `Sample Query: ${t.sampleQuery || ""}\n`;
    if (t.excerpts && t.excerpts.length > 0) {
      prompt += `OEM Excerpts:\n`;
      for (const ex of t.excerpts) {
        prompt += `  [${ex.sectionTitle}] ${ex.contentPreview.slice(0, 400)}\n`;
      }
    } else {
      prompt += `OEM Excerpts: None available. Use general automotive knowledge for this exact vehicle.\n`;
    }
  }

  prompt += `\n--- OUTPUT ---\nReturn ONLY a valid JSON array containing exactly ${batchTargets.length} profile objects in the same order as the targets above. Do not wrap in markdown code blocks.\n`;
  return prompt;
}

async function callOpenAI(prompt, attempt = 1) {
  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: "You are a professional JSON generator. Output valid raw JSON only, matching the requested schema. No markdown formatting." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 16000,
    }, { timeout: 120000 });

    const rawText = response.choices[0]?.message?.content?.trim() || "";
    let cleaned = rawText;
    if (cleaned.startsWith("```json")) cleaned = cleaned.substring(7);
    else if (cleaned.startsWith("```")) cleaned = cleaned.substring(3);
    if (cleaned.endsWith("```")) cleaned = cleaned.substring(0, cleaned.length - 3);
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) {
      throw new Error("Response is not a JSON array");
    }
    return parsed;
  } catch (err) {
    if (attempt < RETRIES) {
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`   API error (attempt ${attempt}), retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      return callOpenAI(prompt, attempt + 1);
    }
    throw err;
  }
}

async function storeProfiles(pool, profiles) {
  let stored = 0;
  for (const profile of profiles) {
    if (!profile || !profile.key) continue;
    try {
      await pool.query(
        `INSERT INTO public.vehicle_repair_profiles (key, year, make, model, task, profile)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (key) DO UPDATE SET profile = EXCLUDED.profile, updated_at = now()`,
        [
          profile.key,
          Number(profile.year),
          slugifyRoutePart(profile.make),
          slugifyRoutePart(profile.model),
          slugifyRoutePart(profile.task),
          JSON.stringify(profile.profile),
        ]
      );
      stored++;
    } catch (e) {
      console.error(`   DB store error for ${profile.key}:`, e.message);
    }
  }
  return stored;
}

async function main() {
  const pool = getLocalPool();
  if (!pool) {
    console.error("FATAL: Could not establish PostgreSQL pool");
    process.exit(1);
  }

  const targets = JSON.parse(readFileSync(INPUT_PATH, "utf8"));
  console.log(`Loaded ${targets.length} targets`);

  // Load progress
  let completedKeys = new Set();
  let errorLog = [];
  if (existsSync(PROGRESS_PATH)) {
    try {
      const prog = JSON.parse(readFileSync(PROGRESS_PATH, "utf8"));
      completedKeys = new Set(prog.completedKeys || []);
      console.log(`Resuming: ${completedKeys.size} already processed`);
    } catch {
      // ignored
    }
  }
  if (existsSync(ERROR_PATH)) {
    try {
      errorLog = JSON.parse(readFileSync(ERROR_PATH, "utf8"));
    } catch {
      // ignored
    }
  }

  // Filter out completed
  const pending = targets.filter((t) => {
    const key = `${t.year}:${slugifyRoutePart(t.make)}:${slugifyRoutePart(t.model)}:${slugifyRoutePart(t.task)}`;
    return !completedKeys.has(key);
  });
  console.log(`Pending: ${pending.length}`);

  // Build batches
  const batches = [];
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    batches.push(pending.slice(i, i + BATCH_SIZE));
  }
  console.log(`Batches: ${batches.length} (size ${BATCH_SIZE})`);

  let totalStored = 0;
  let totalErrors = 0;

  const tasks = batches.map((batch, batchIndex) =>
    limit(async () => {
      const currentBatchNum = batchIndex + 1;
      console.log(`\n[${currentBatchNum}/${batches.length}] Processing batch of ${batch.length}...`);

      // Mine excerpts for each target in batch
      for (const t of batch) {
        t.excerpts = await mineOEMContent(pool, t.year, t.make, t.model, t.task);
      }

      const prompt = buildBatchPrompt(batch);

      try {
        const profiles = await callOpenAI(prompt);

        // Validate count
        if (profiles.length !== batch.length) {
          console.warn(`   Batch ${currentBatchNum}: expected ${batch.length} profiles, got ${profiles.length}`);
        }

        // Enforce keys
        for (let i = 0; i < batch.length; i++) {
          const t = batch[i];
          const expectedKey = `${t.year}:${slugifyRoutePart(t.make)}:${slugifyRoutePart(t.model)}:${slugifyRoutePart(t.task)}`;
          if (profiles[i]) {
            profiles[i].key = expectedKey;
            profiles[i].year = t.year;
            profiles[i].make = slugifyRoutePart(t.make);
            profiles[i].model = slugifyRoutePart(t.model);
            profiles[i].task = slugifyRoutePart(t.task);
          }
        }

        const stored = await storeProfiles(pool, profiles);
        totalStored += stored;

        // Mark completed
        for (const t of batch) {
          const key = `${t.year}:${slugifyRoutePart(t.make)}:${slugifyRoutePart(t.model)}:${slugifyRoutePart(t.task)}`;
          completedKeys.add(key);
        }

        // Append to backup JSON
        const backup = existsSync(BACKUP_PATH)
          ? JSON.parse(readFileSync(BACKUP_PATH, "utf8"))
          : [];
        backup.push(...profiles.filter((p) => p && p.key));
        await atomicWriteFile(BACKUP_PATH, JSON.stringify(backup, null, 2));

        // Save progress
        await atomicWriteFile(PROGRESS_PATH, JSON.stringify({ completedKeys: Array.from(completedKeys), lastBatch: currentBatchNum, totalStored }, null, 2));

        console.log(`   ✅ Batch ${currentBatchNum}: stored ${stored}/${batch.length} | total: ${totalStored}`);
      } catch (err) {
        console.error(`   ❌ Batch ${currentBatchNum} failed:`, err.message);
        totalErrors++;
        for (const t of batch) {
          errorLog.push({ batch: currentBatchNum, target: t, error: err.message, time: new Date().toISOString() });
        }
        writeFileSync(ERROR_PATH, JSON.stringify(errorLog, null, 2));
      }

      await new Promise((r) => setTimeout(r, SLEEP_BETWEEN_BATCHES));
    })
  );

  await Promise.all(tasks);

  console.log(`\n=== DONE ===`);
  console.log(`Total stored: ${totalStored}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log(`Backup: ${BACKUP_PATH}`);
  console.log(`Errors: ${ERROR_PATH}`);

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
