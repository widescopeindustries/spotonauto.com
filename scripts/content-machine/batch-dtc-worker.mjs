#!/usr/bin/env node
/**
 * AllOEMManuals DTC Batch API Worker
 *
 * Uses OpenAI GPT-4o-mini to generate vehicle-specific DTC diagnostic profiles.
 * Mines OEM excerpts from PostgreSQL manual_embeddings.
 * Stores results in JSON files for now (DB table can be added later).
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import pLimit from "p-limit";
import { getLocalPool } from "../../src/lib/manualEmbeddingsStore.ts";
import { slugifyRoutePart } from "../../src/data/vehicles.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "../..");

// Load .env.local
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
  // ignored
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
const BATCH_SIZE = 20;
const CONCURRENCY = 5;
const RETRIES = 3;
const SLEEP_BETWEEN_BATCHES = 300;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const limit = pLimit(CONCURRENCY);

async function mineOEMContent(pool, year, make, model, code) {
  const codeNum = code.replace(/\D/g, "");
  const terms = [code, `P${codeNum}`, code.toLowerCase(), code.replace("P", "")];

  // Also search for system-related terms based on code
  const systemTerms = [];
  if (code.startsWith("P0") && ["30","31","32","33","34","35","36"].some(n => code.includes(n))) systemTerms.push("misfire", "spark plug", "ignition coil");
  if (code.startsWith("P0") && ["42","43"].some(n => code.includes(n))) systemTerms.push("catalyst", "O2 sensor", "oxygen sensor", "converter");
  if (code.startsWith("P0") && ["17","18"].some(n => code.includes(n))) systemTerms.push("lean", "MAF", "vacuum leak");
  if (code.startsWith("P0") && ["44","45","46"].some(n => code.includes(n))) systemTerms.push("EVAP", "purge", "gas cap", "canister");
  if (code.startsWith("P0") && ["10","11","12","13","14"].some(n => code.includes(n))) systemTerms.push("VVT", "camshaft", "timing", "solenoid");
  if (code.startsWith("P0") && ["15","16"].some(n => code.includes(n))) systemTerms.push("O2 sensor", "heater", "oxygen");
  if (code.startsWith("P0") && ["01","02","03","06","07","08"].some(n => code.includes(n))) systemTerms.push("MAF", "MAP", "air flow", "intake");
  if (code.startsWith("P0") && ["25","26","27","28"].some(n => code.includes(n))) systemTerms.push("coolant", "thermostat", "temperature");
  if (code.startsWith("P0") && ["50","51","52","55","56","57"].some(n => code.includes(n))) systemTerms.push("idle", "throttle", "IAC");
  if (code.startsWith("P0") && ["70","71","72","73","74","75","76","77","78","80"].some(n => code.includes(n))) systemTerms.push("transmission", "shift solenoid", "speed sensor");
  if (code.startsWith("P0") && ["56","60","62","63"].some(n => code.includes(n))) systemTerms.push("voltage", "battery", "alternator");
  if (code.startsWith("P0") && ["20","21","22","23"].some(n => code.includes(n))) systemTerms.push("TPS", "throttle position");
  if (code.startsWith("P0") && ["32","33","34","35"].some(n => code.includes(n))) systemTerms.push("knock sensor", "crankshaft", "camshaft");
  if (code.startsWith("P0") && ["40","41"].some(n => code.includes(n))) systemTerms.push("EGR");

  const allTerms = [...terms, ...systemTerms];

  const conditions = [];
  const params = [make, Number(year)];

  const termConditions = [];
  for (let i = 0; i < allTerms.length; i++) {
    const paramIndex = params.length + 1;
    params.push(`%${allTerms[i].toLowerCase()}%`);
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
    console.error(`   DB error for ${year} ${make} ${model} ${code}:`, e.message);
    return [];
  }
}

function buildBatchPrompt(batchEntries) {
  let prompt = `You are an expert automotive diagnostic technician writing factory-style diagnostic flowcharts for AllOEMManuals.com.

Generate vehicle-specific DTC diagnostic profiles for the following ${batchEntries.length} vehicle+code combinations.
For each combination, OEM service manual excerpts are provided.

CRITICAL RULES:
1. Write factory-style diagnostic flowcharts with IF/THEN branches
2. Be SPECIFIC — include exact voltage specs, resistance values, connector pin colors, and component locations when known
3. Include "likelyFaultyComponent" — the single most common failed part for this code on this vehicle
4. Include "replacementPart" with name and common aftermarket part number
5. Include "toolsNeeded" with specific diagnostic tools (scan tool, multimeter, etc.)
6. Include "diagnosticSteps" as a numbered array with clear pass/fail branches
7. Do NOT hallucinate — use known OEM specs. If uncertain, state the most common cause for this vehicle
8. Output ONLY a valid JSON array. No markdown, no commentary.

OUTPUT SCHEMA per profile:
{
  "key": "year:make:model:code",
  "year": 2008,
  "make": "nissan",
  "model": "pathfinder",
  "code": "P0420",
  "profile": {
    "titleSuffix": "Factory diagnostic flowchart & fix",
    "descriptionSuffix": "Step-by-step P0420 diagnostic for this exact vehicle with voltage specs and replacement part",
    "extraKeywords": ["5-8 long-tail keywords"],
    "supportNote": {
      "eyebrow": "Factory diagnostic",
      "title": "Specific headline about this code on this vehicle",
      "intro": "2-3 sentence intro about common failure mode for this exact vehicle",
      "bullets": ["5-7 bullets with exact specs, common causes, and preliminary checks"],
      "tone": "rose|amber|emerald|cyan|violet|indigo"
    },
    "diagnosticSteps": [
      {"step": 1, "text": "Visual inspection or preliminary check", "spec": "exact spec if applicable", "nextIfPass": "Go to Step 2", "nextIfFail": "Repair and retest"}
    ],
    "likelyFaultyComponent": "Name of most common failed part",
    "replacementPart": {"name": "Part name", "partNumber": "common aftermarket number", "notes": "fitment note"},
    "toolsNeeded": [{"name": "Tool name", "notes": "specific requirements"}],
    "faq": {"question": "Exact searcher question", "answer": "Detailed 2-4 sentence answer with specs"}
  }
}

TONE COLORS:
- rose: emissions/catalyst/O2 sensor codes
- amber: electrical/sensor codes
- emerald: engine mechanical/timing codes
- cyan: fuel/trim/air flow codes
- violet: cooling/temperature codes
- indigo: transmission codes
`;

  for (let i = 0; i < batchEntries.length; i++) {
    const e = batchEntries[i];
    prompt += `\n--- ENTRY ${i + 1} ---\n`;
    prompt += `Vehicle: ${e.year} ${e.make} ${e.model}\n`;
    prompt += `Code: ${e.code} — ${e.codeTitle}\n`;
    prompt += `System: ${e.system}\n`;
    prompt += `Common Fix: ${e.commonFix}\n`;
    if (e.excerpts && e.excerpts.length > 0) {
      prompt += `OEM Excerpts:\n`;
      for (const ex of e.excerpts) {
        prompt += `  [${ex.sectionTitle}] ${ex.contentPreview.slice(0, 400)}\n`;
      }
    } else {
      prompt += `OEM Excerpts: None available. Use general automotive knowledge for this exact vehicle and code.\n`;
    }
  }

  prompt += `\n--- OUTPUT ---\nReturn ONLY a valid JSON array containing exactly ${batchEntries.length} profile objects in the same order as above. Do not wrap in markdown code blocks.\n`;
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
    });

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

async function main() {
  const pool = getLocalPool();
  if (!pool) {
    console.error("FATAL: Could not establish PostgreSQL pool");
    process.exit(1);
  }

  const manifestPath = join(__dirname, "dtc-batches", "manifest.json");
  if (!existsSync(manifestPath)) {
    console.error("FATAL: Manifest not found. Run create-dtc-batches.mjs first.");
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  console.log(`Loaded manifest: ${manifest.totalBatches} batches, ${manifest.totalCombinations} combinations`);

  // Load progress
  const progressPath = join(__dirname, "dtc-batches", "progress.json");
  let completedBatches = new Set();
  if (existsSync(progressPath)) {
    try {
      const prog = JSON.parse(readFileSync(progressPath, "utf8"));
      completedBatches = new Set(prog.completedBatches || []);
      console.log(`Resuming: ${completedBatches.size} batches already processed`);
    } catch {
      // ignored
    }
  }

  const pendingBatches = manifest.batches.filter((b) => !completedBatches.has(b.batchNum));
  console.log(`Pending batches: ${pendingBatches.length}`);

  let totalProcessed = 0;
  let totalErrors = 0;
  let batchCounter = 0;

  const tasks = pendingBatches.map((batch) =>
    limit(async () => {
      batchCounter++;
      const currentNum = batchCounter;
      console.log(`\n[${currentNum}/${pendingBatches.length}] Batch #${batch.batchNum} (${batch.count} entries)`);

      const entries = JSON.parse(readFileSync(batch.inputPath, "utf8"));

      // Mine excerpts
      for (const e of entries) {
        e.excerpts = await mineOEMContent(pool, e.year, e.make, e.model, e.code);
      }

      const prompt = buildBatchPrompt(entries);

      try {
        const profiles = await callOpenAI(prompt);

        if (profiles.length !== entries.length) {
          console.warn(`   Expected ${entries.length} profiles, got ${profiles.length}`);
        }

        // Enforce keys
        for (let i = 0; i < entries.length; i++) {
          const e = entries[i];
          const expectedKey = `${e.year}:${slugifyRoutePart(e.make)}:${slugifyRoutePart(e.model)}:${e.code}`;
          if (profiles[i]) {
            profiles[i].key = expectedKey;
            profiles[i].year = e.year;
            profiles[i].make = slugifyRoutePart(e.make);
            profiles[i].model = slugifyRoutePart(e.model);
            profiles[i].code = e.code;
          }
        }

        // Write output
        writeFileSync(batch.outputPath, JSON.stringify(profiles.filter((p) => p && p.key), null, 2));

        completedBatches.add(batch.batchNum);
        totalProcessed += profiles.filter((p) => p && p.key).length;

        writeFileSync(progressPath, JSON.stringify({ completedBatches: Array.from(completedBatches), totalProcessed }, null, 2));

        console.log(`   ✅ Batch #${batch.batchNum}: saved ${profiles.length} profiles | total: ${totalProcessed}`);
      } catch (err) {
        console.error(`   ❌ Batch #${batch.batchNum} failed:`, err.message);
        totalErrors++;
      }

      await new Promise((r) => setTimeout(r, SLEEP_BETWEEN_BATCHES));
    })
  );

  await Promise.all(tasks);

  console.log(`\n=== DONE ===`);
  console.log(`Total processed: ${totalProcessed}`);
  console.log(`Total errors: ${totalErrors}`);

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
