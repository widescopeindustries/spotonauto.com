import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { findManualSectionsByTerms, getLocalPool } from "../../src/lib/manualEmbeddingsStore.ts";
import { getRepairTaskProfile } from "../../src/lib/repairTaskProfiles.ts";
import { slugifyRoutePart } from "../../src/data/vehicles.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "../..");

// Load env variables
process.env.DATABASE_URL = "postgresql://spotonauto:spotonauto2026@127.0.0.1:5432/spotonauto";
process.env.LOCAL_DATABASE_URL = "postgresql://spotonauto:spotonauto2026@127.0.0.1:5432/spotonauto";

// Connect to local Ollama on port 11434
const openai = new OpenAI({
  baseURL: "http://127.0.0.1:11434/v1",
  apiKey: "ollama-dummy", // Ollama doesn't validate keys
});
const MODEL = "llama3.2:3b";

async function mineOEMContent(year, make, model, task) {
  const profile = getRepairTaskProfile(task);
  const taskLabel = task.replace(/-/g, " ");
  const terms = [...profile.keywords, taskLabel];

  console.log(`\n🔍 Mining OEM content for: ${year} ${make} ${model} - ${task}...`);
  const pool = getLocalPool();
  if (!pool) throw new Error("No database pool available");

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

  let rows = [];
  try {
    const result = await pool.query(query, params);
    rows = result.rows;
  } catch (e) {
    console.error(`❌ DB Lookup failed:`, e);
  }

  return rows.map((r) => ({
    sectionTitle: r.section_title,
    contentPreview: r.content_preview,
    path: r.path,
  }));
}

async function generateProfile(year, make, model, task, oemExcerpts) {
  const taskLabel = task.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const vehicleLabel = `${year} ${make} ${model}`;

  const excerptText = oemExcerpts.length
    ? oemExcerpts
        .map(
          (e, i) =>
            `[Excerpt ${i + 1}] Section: ${e.sectionTitle}\nSource Path: ${e.path}\nContent:\n${e.contentPreview.slice(0, 500)}`
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
    "tone": "cyan | emerald | amber | violet"
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

  console.log(`🤖 Requesting LLM generation using ${MODEL}...`);
  const response = await openai.chat.completions.create({
    model: MODEL,
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
    console.error("❌ Failed to parse JSON response:", err);
    console.log("Raw Response received was:");
    console.log(rawText);
    return null;
  }
}

async function testRun() {
  // Test Case 1: 2011 Acura RDX battery-replacement
  const test1 = { year: "2011", make: "Acura", model: "RDX 2.3 TB1", task: "battery-replacement" };
  const excerpts1 = await mineOEMContent(test1.year, test1.make, test1.model, test1.task);
  console.log(`   Found ${excerpts1.length} OEM excerpts`);
  const result1 = await generateProfile(test1.year, test1.make, test1.model, test1.task, excerpts1);
  if (result1) {
    console.log("\n✅ Test Case 1 Output:");
    console.log(JSON.stringify(result1, null, 2));
  }

  // Test Case 2: 2007 Audi A4 oil-change
  const test2 = { year: "2007", make: "Audi", model: "A4 Base, 4D Sedan, 2.0 F, BWT, Standard", task: "oil-change" };
  const excerpts2 = await mineOEMContent(test2.year, test2.make, test2.model, test2.task);
  console.log(`   Found ${excerpts2.length} OEM excerpts`);
  const result2 = await generateProfile(test2.year, test2.make, test2.model, test2.task, excerpts2);
  if (result2) {
    console.log("\n✅ Test Case 2 Output:");
    console.log(JSON.stringify(result2, null, 2));
  }
  
  process.exit(0);
}

testRun().catch(e => {
  console.error("Fatal test run error:", e);
  process.exit(1);
});
