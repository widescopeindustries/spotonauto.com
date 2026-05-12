#!/usr/bin/env node
/**
 * Content Machine — Generate vehicle-specific repair profiles from OEM corpus data.
 *
 * Usage:
 *   node --experimental-strip-types scripts/content-machine/generate-profiles.mjs \
 *     --year 2014 --make Ford --model Escape --task battery-replacement
 *
 *   node --experimental-strip-types scripts/content-machine/generate-profiles.mjs \
 *     --batch scripts/seo-reports/command-center-opportunities-2026-04-24.json \
 *     --limit 10
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "../..");

// Load .env.local
const envPath = join(PROJECT_ROOT, ".env.local");
try {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // .env.local may not exist in CI
}

import OpenAI from "openai";
import { GoogleGenAI, Type } from "@google/genai";
import { findManualSectionsByTerms } from "../../src/lib/manualEmbeddingsStore.ts";
import { getRepairTaskProfile } from "../../src/lib/repairTaskProfiles.ts";
import { slugifyRoutePart } from "../../src/data/vehicles.ts";

// Kimi is the preferred provider for content generation per project policy.
// OpenAI is reserved for live user chat ONLY.
const kimiClient = process.env.KIMI_API_KEY
  ? new OpenAI({ apiKey: process.env.KIMI_API_KEY, baseURL: "https://api.moonshot.ai/v1" })
  : null;
const KIMI_MODEL = process.env.KIMI_MODEL || "kimi-latest";

// Gemini fallback for batch content generation when Kimi is unavailable
const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;
const GEMINI_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.0-flash";

// ─── CLI parsing ────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, "");
    opts[key] = args[i + 1];
  }
  return opts;
}

// ─── Schema for structured LLM output ───────────────────────────────────────

const PROFILE_SCHEMA_JSON = {
  type: "object",
  properties: {
    titleSuffix: {
      type: "string",
      description:
        "Optional title suffix for this exact vehicle+task (e.g., 'Battery Group Size & Fitment Check'). Keep under 50 chars.",
    },
    descriptionSuffix: {
      type: "string",
      description:
        "Optional meta description addition for this exact vehicle. Keep under 120 chars.",
    },
    extraKeywords: {
      type: "array",
      items: { type: "string" },
      description:
        "5-10 long-tail keywords specific to this vehicle+task (e.g., '2014 Ford Escape battery group size').",
    },
    supportNote: {
      type: "object",
      properties: {
        eyebrow: {
          type: "string",
          description: "Short label: 'Quick check', 'Exact-fit note', or 'Common mistake'.",
        },
        title: {
          type: "string",
          description:
            "Specific warning or tip for this exact vehicle (e.g., '2014 Ford Escape battery jobs are won by fitment first').",
        },
        intro: {
          type: "string",
          description:
            "1-2 sentence context about why this note matters for this vehicle.",
        },
        bullets: {
          type: "array",
          items: { type: "string" },
          description:
            "3-5 actionable bullets. Each bullet should be a complete, specific sentence. LLMs love to cite these.",
        },
        tone: {
          type: "string",
          description: "One of: cyan, emerald, amber, violet.",
        },
      },
      required: ["eyebrow", "title", "intro", "bullets", "tone"],
    },
    faq: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description:
            "A specific, high-intent FAQ question for this exact vehicle+task (e.g., 'What battery group size fits a 2014 Ford Escape?').",
        },
        answer: {
          type: "string",
          description:
            "Detailed 2-4 sentence answer. Be specific, accurate, and cite the OEM data where possible.",
        },
      },
      required: ["question", "answer"],
    },
  },
  required: ["extraKeywords", "supportNote", "faq"],
};

const PROFILE_SCHEMA = {
  type: "object",
  properties: {
    titleSuffix: { type: "string", description: "Title suffix under 50 chars" },
    descriptionSuffix: { type: "string", description: "Meta description under 120 chars" },
    extraKeywords: { type: "array", items: { type: "string" }, description: "5-10 long-tail keywords" },
    supportNote: {
      type: "object",
      properties: {
        eyebrow: { type: "string" },
        title: { type: "string" },
        intro: { type: "string" },
        bullets: { type: "array", items: { type: "string" } },
        tone: { type: "string", enum: ["cyan", "emerald", "amber", "violet"] },
      },
      required: ["eyebrow", "title", "intro", "bullets", "tone"],
    },
    faq: {
      type: "object",
      properties: {
        question: { type: "string" },
        answer: { type: "string" },
      },
      required: ["question", "answer"],
    },
  },
  required: ["extraKeywords", "supportNote", "faq"],
};

// ─── Content mining ─────────────────────────────────────────────────────────

async function mineOEMContent(year, make, model, task) {
  const profile = getRepairTaskProfile(task);
  const taskLabel = task.replace(/-/g, " ");

  console.log(`  Mining OEM content for ${year} ${make} ${model} ${task}...`);

  let rows = [];
  try {
    rows = await findManualSectionsByTerms({
      make,
      year: Number(year),
      model,
      terms: [...profile.keywords, taskLabel],
      limit: 5,
    });
  } catch (e) {
    console.warn(`    DB lookup failed: ${e.message}`);
  }

  return rows
    .filter((r) => r.contentPreview && r.contentPreview.length > 60)
    .map((r) => ({
      sectionTitle: r.sectionTitle,
      contentPreview: r.contentPreview,
      path: r.path,
    }));
}

// ─── Gemini generation ──────────────────────────────────────────────────────

async function generateProfile(year, make, model, task, oemExcerpts) {
  const taskLabel = task
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const vehicleLabel = `${year} ${make} ${model}`;

  const excerptText = oemExcerpts.length
    ? oemExcerpts
        .map(
          (e, i) =>
            `[Excerpt ${i + 1}] ${e.sectionTitle}\n${e.contentPreview.slice(0, 400)}`
        )
        .join("\n\n")
    : "No OEM excerpts available. Use general automotive knowledge for this vehicle.";

  const prompt = `You are an expert automotive technical writer creating SEO-optimized repair guide content.

VEHICLE: ${vehicleLabel}
TASK: ${taskLabel}

RAW OEM SERVICE MANUAL EXCERPTS:
${excerptText}

INSTRUCTIONS:
Create a structured content profile for the exact vehicle and task above. The output will be used on a repair guide webpage and must be:
1. Keyword-dense for search engines
2. Formatted as "boxed bullet points" that AI assistants (like ChatGPT, Gemini, Claude) love to cite
3. Specific to the exact year, make, and model — not generic
4. Based on the OEM excerpts provided (do not invent torque specs or capacities)

The supportNote.bullets should be complete, standalone sentences that an AI could quote as the definitive answer.
The FAQ should target a real search query someone would type into Google.

Output JSON matching the schema.`;

  // Provider priority: Kimi → Gemini
  if (kimiClient) {
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const completion = await kimiClient.chat.completions.create({
          model: KIMI_MODEL,
          messages: [
            { role: "system", content: "You are an expert automotive technical writer. Output valid JSON only." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        });
        const text = completion.choices[0]?.message?.content;
        if (!text) throw new Error("Empty Kimi response");
        return JSON.parse(text);
      } catch (err) {
        lastError = err;
        const isRetryable = err.message?.includes('rate limit') || err.message?.includes('timeout') || err.status >= 500;
        if (!isRetryable || attempt === 3) break;
        const delay = attempt * 2000;
        console.log(`    Kimi attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    console.log(`    Kimi failed: ${lastError?.message || lastError}. Falling back to Gemini...`);
  }

  // Fallback to Gemini
  if (geminiClient) {
    try {
      const response = await geminiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          { role: 'user', parts: [{ text: `You are an expert automotive technical writer. Output valid JSON only.\n\n${prompt}` }] },
        ],
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              titleSuffix: { type: Type.STRING, description: 'Title suffix under 50 chars' },
              descriptionSuffix: { type: Type.STRING, description: 'Meta description under 120 chars' },
              extraKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: '5-10 long-tail keywords' },
              supportNote: {
                type: Type.OBJECT,
                properties: {
                  eyebrow: { type: Type.STRING },
                  title: { type: Type.STRING },
                  intro: { type: Type.STRING },
                  bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                  tone: { type: Type.STRING, enum: ['cyan', 'emerald', 'amber', 'violet'] },
                },
                required: ['eyebrow', 'title', 'intro', 'bullets', 'tone'],
              },
              faq: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                },
                required: ['question', 'answer'],
              },
            },
            required: ['extraKeywords', 'supportNote', 'faq'],
          },
        },
      });
      const text = response.text;
      if (!text) throw new Error('Empty Gemini response');
      return JSON.parse(text);
    } catch (err) {
      throw new Error(`Gemini failed: ${err.message || err}`);
    }
  }

  throw new Error("No AI provider available. Set KIMI_API_KEY or GEMINI_API_KEY in .env.local");
}

// ─── Store management ───────────────────────────────────────────────────────

const STORE_PATH = join(PROJECT_ROOT, "src/data/vehicle-repair-profiles.json");

function loadStore() {
  try {
    return JSON.parse(readFileSync(STORE_PATH, "utf8"));
  } catch {
    return { generatedAt: new Date().toISOString(), generatorVersion: "1.0.0", count: 0, profiles: [] };
  }
}

function saveStore(store) {
  store.count = store.profiles.length;
  store.generatedAt = new Date().toISOString();
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2) + "\n");
}

function makeKey(year, make, model, task) {
  return `${year}:${slugifyRoutePart(make)}:${slugifyRoutePart(model)}:${slugifyRoutePart(task)}`;
}

// ─── Batch seeding from query reports ───────────────────────────────────────

function seedFromReport(reportPath, limit = 10) {
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  const centers = report.topCommandCenters || [];
  const targets = [];

  for (const center of centers.slice(0, limit)) {
    const tasks = center.topTasks?.length
      ? center.topTasks
      : [
          { task: "battery-replacement" },
          { task: "oil-change" },
          { task: "spark-plug-replacement" },
        ];

    for (const t of tasks.slice(0, 3)) {
      targets.push({
        year: center.year,
        make: center.make,
        model: center.model,
        task: t.task,
      });
    }
  }

  return targets;
}

function seedFromQueryTargets(targetsPath, limit = 50, minImpressions = 3) {
  const data = JSON.parse(readFileSync(targetsPath, "utf8"));
  const targets = [];
  
  // Filter by minimum impressions and deduplicate
  const seen = new Set();
  for (const item of data) {
    if (item.impressions < minImpressions) continue;
    const key = `${item.year}:${item.make}:${item.model}:${item.task}`;
    if (seen.has(key)) continue;
    seen.add(key);
    targets.push({
      year: item.year,
      make: item.make,
      model: item.model,
      task: item.task,
    });
    if (targets.length >= limit) break;
  }
  
  return targets;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();
  const targets = [];

  if (opts.targets) {
    const targetsPath = opts.targets.startsWith("/")
      ? opts.targets
      : join(PROJECT_ROOT, opts.targets);
    console.log(`Seeding from query targets: ${targetsPath}`);
    targets.push(...seedFromQueryTargets(targetsPath, Number(opts.limit) || 50, Number(opts.minImpressions) || 3));
  } else if (opts.batch) {
    const reportPath = opts.batch.startsWith("/")
      ? opts.batch
      : join(PROJECT_ROOT, opts.batch);
    console.log(`Seeding from report: ${reportPath}`);
    targets.push(...seedFromReport(reportPath, Number(opts.limit) || 10));
  } else if (opts.year && opts.make && opts.model && opts.task) {
    targets.push({
      year: opts.year,
      make: opts.make,
      model: opts.model,
      task: opts.task,
    });
  } else {
    console.log(`
Content Machine — Generate vehicle-specific repair profiles

Usage (single target):
  node --experimental-strip-types scripts/content-machine/generate-profiles.mjs \\
    --year 2014 --make Ford --model Escape --task battery-replacement

Usage (batch from query targets):
  node --experimental-strip-types scripts/content-machine/generate-profiles.mjs \\
    --targets scripts/content-machine/query-targets.json \\
    --limit 50 --minImpressions 5

Usage (batch from query report):
  node --experimental-strip-types scripts/content-machine/generate-profiles.mjs \\
    --batch scripts/seo-reports/command-center-opportunities-2026-04-24.json \\
    --limit 10
`);
    process.exit(1);
  }

  console.log(`\n🎯 Targets: ${targets.length}`);
  const store = loadStore();
  const existingKeys = new Set(store.profiles.map((p) => p.key));
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const target of targets) {
    const key = makeKey(target.year, target.make, target.model, target.task);

    if (existingKeys.has(key)) {
      console.log(`⏭ Skipping ${key} (already exists)`);
      skipped++;
      continue;
    }

    console.log(`\n🚗 ${target.year} ${target.make} ${target.model} — ${target.task}`);

    try {
      const oemExcerpts = await mineOEMContent(
        target.year,
        target.make,
        target.model,
        target.task
      );
      console.log(`   Found ${oemExcerpts.length} OEM excerpts`);

      const profile = await generateProfile(
        target.year,
        target.make,
        target.model,
        target.task,
        oemExcerpts
      );

      store.profiles.push({
        key,
        year: Number(target.year),
        make: slugifyRoutePart(target.make),
        model: slugifyRoutePart(target.model),
        task: slugifyRoutePart(target.task),
        profile,
      });
      existingKeys.add(key);
      generated++;

      console.log(`   ✅ Generated: ${profile.supportNote?.title || "(no title)"}`);
    } catch (e) {
      console.error(`   ❌ Failed: ${e.message}`);
      failed++;
    }

    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 500));

    // Checkpoint save every 10 profiles
    if (generated > 0 && generated % 10 === 0) {
      saveStore(store);
      console.log(`   💾 Checkpoint: ${store.count} total profiles`);
    }
  }

  saveStore(store);
  console.log(`\n📦 Store: ${store.count} total profiles`);
  console.log(`   ✅ Generated: ${generated}`);
  console.log(`   ⏭ Skipped:   ${skipped}`);
  console.log(`   ❌ Failed:    ${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
