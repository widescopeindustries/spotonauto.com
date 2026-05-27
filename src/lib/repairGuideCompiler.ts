import { getLocalPool } from './manualEmbeddingsStore';
import { getRepairTaskProfile } from './repairTaskProfiles';
import OpenAI from 'openai';

// Configuration loaded from env
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:7475/v1";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "Llama-3.2-3B-Instruct-Q4_K_M.gguf";

const openai = new OpenAI({
  baseURL: OLLAMA_BASE_URL,
  apiKey: "ollama-dummy",
});

export interface OEMExcerptRow {
  sectionTitle: string;
  contentPreview: string;
  path: string;
  model: string;
}

export function getModelHints(model: string): { exact: string; prefix: string } {
  const exact = (model || "").trim();
  const prefix = exact.split(/[\s(/-]+/).filter(Boolean)[0] || "";
  return { exact, prefix };
}

export function sortByModelHints<T extends { model: string }>(rows: T[], model: string): T[] {
  const { exact, prefix } = getModelHints(model);
  if (!exact) return rows;

  const lcExact = exact.toLowerCase();
  const lcPrefix = prefix.toLowerCase();

  const getRank = (rowModel: string): number => {
    const normalized = (rowModel || "").toLowerCase();
    if (normalized === lcExact) return 0;
    if (normalized.includes(lcExact)) return 1;
    if (lcPrefix && normalized.startsWith(lcPrefix)) return 2;
    if (lcPrefix && normalized.includes(lcPrefix)) return 3;
    return 4;
  };

  const ranked = rows.map((r) => ({
    ...r,
    _rank: getRank(r.model),
  }));

  ranked.sort((a, b) => a._rank - b._rank);

  const hasGoodMatch = ranked.some((r) => r._rank <= 3);
  const filtered = hasGoodMatch ? ranked.filter((r) => r._rank <= 3) : ranked;

  // Remove the temporary _rank field and return the original shape
  return filtered.map(({ _rank, ...rest }) => rest as unknown as T);
}

export async function mineOEMContent(
  year: string | number,
  make: string,
  model: string,
  task: string
): Promise<OEMExcerptRow[]> {
  const pool = getLocalPool();
  if (!pool) {
    throw new Error("Database connection pool is unavailable");
  }

  const profile = getRepairTaskProfile(task);
  const taskLabel = task.replace(/-/g, " ");
  const terms = [...profile.keywords, taskLabel];

  const conditions: string[] = [];
  const params: (string | number)[] = [make, Number(year)];
  
  const termConditions: string[] = [];
  for (let i = 0; i < terms.length; i++) {
    const paramIndex = params.length + 1;
    params.push(`%${terms[i].toLowerCase()}%`);
    termConditions.push(`(LOWER(section_title) LIKE $${paramIndex} OR LOWER(content_preview) LIKE $${paramIndex})`);
  }
  
  if (termConditions.length > 0) {
    conditions.push(`(${termConditions.join(" OR ")})`);
  }

  // Fetch up to 100 entries so we can filter/sort by model relevance in memory
  const query = `
    SELECT path, make, year, model, section_title, content_preview
    FROM manual_embeddings
    WHERE LOWER(make) = LOWER($1)
      AND year = $2
      ${conditions.length > 0 ? "AND " + conditions.join(" AND ") : ""}
    LIMIT 100
  `;

  const result = await pool.query(query, params);
  
  // Sort and filter in-memory by model relevance
  const sorted = sortByModelHints(result.rows, model);

  return sorted.slice(0, 5).map((r) => ({
    sectionTitle: String(r.section_title || ""),
    contentPreview: String(r.content_preview || ""),
    path: String(r.path || ""),
    model: String(r.model || "")
  }));
}

export async function generateProfile(
  year: string | number,
  make: string,
  model: string,
  task: string,
  oemExcerpts: OEMExcerptRow[]
): Promise<any> {
  const taskLabel = task.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const vehicleLabel = `${year} ${make} ${model}`;

  const excerptText = oemExcerpts
    .map(
      (e, i) =>
        `[Excerpt ${i + 1}] Model Group: ${e.model || "Unknown"}\nSection: ${e.sectionTitle}\nSource Path: ${e.path}\nContent:\n${e.contentPreview.slice(0, 750)}`
    )
    .join("\n\n");

  const prompt = `You are an expert automotive technical writer creating SEO-optimized, highly structured, and precise repair guide content.

VEHICLE: ${vehicleLabel}
TASK: ${taskLabel}

RAW OEM SERVICE MANUAL EXCERPTS:
${excerptText}

INSTRUCTIONS:
Create a structured content profile for the exact vehicle and task above. The output will be used on a repair guide webpage and must be:
1. Keyword-dense for search engines.
2. Formatted as a JSON object containing the fields below.
3. Specific to the exact year, make, and model - not generic. 
   CRITICAL SPECIFICATION RULES:
   - ONLY cite specific numeric specifications (e.g. torque values like "9 ft-lbs", socket/wrench sizes like "14mm", clearance values, or fluid capacities) if they are explicitly mentioned in the provided OEM excerpts.
   - DO NOT hallucinate, guess, or invent numeric specs. If the excerpts do not state a specific torque value, tool size, or fluid capacity, write high-quality procedural details instead, or write "Refer to the vehicle owner's manual for specific torque specifications" rather than guessing. Citing incorrect specifications can break the user's vehicle.
4. TRANSLATION AND ORIGINAL PROSE:
   - Do NOT copy the raw OEM excerpts verbatim.
   - Translate all technical jargon, industrial step descriptions, and factory instructions into clear, friendly, step-by-step DIY instructions in normal, readable human language.
   - Write everything in your own words to create original content while preserving 100% mechanical and factual accuracy.
5. Output ONLY valid JSON matching this schema exactly.
6. IMPORTANT: All FAQs must be 100% relevant to the specific task (${taskLabel}) and vehicle (${vehicleLabel}). Do not mix tasks! If the task is ${taskLabel}, do not generate FAQs about unrelated tasks like battery, spark plugs, or brakes.
7. Ensure that all string values are properly escaped for JSON. Do not include unescaped newlines or double-quotes inside string values. All double quotes inside JSON string values must be escaped as \\\".

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
      "3-5 actionable bullets, each a complete, specific sentence citing exact details (e.g. specs, tools, socket sizes) from the excerpts."
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
  ],
  "guideData": {
    "specifications": {
      "torque_specs": [
        { "component": "Name of component", "value": "Torque value (e.g. 9 ft-lbs / 12 Nm)" }
      ],
      "capacities": [
        { "fluid": "Name of fluid", "value": "Fluid capacity" }
      ],
      "clearances_or_other_specs": [
        { "specification": "Name of specification", "value": "Value" }
      ]
    },
    "tools_required": [
      "Exact tool names mentioned in the excerpts"
    ],
    "safety_warnings": [
      "Actionable safety warnings mentioned in the excerpts"
    ],
    "procedure_steps": [
      {
        "step": 1,
        "action": "Clean, precise step-by-step action text extracted from the excerpts.",
        "cautions_or_tips": "Any specific caution, note, or tip for this step"
      }
    ]
  }
}

Return ONLY the raw JSON string. Do not include markdown codeblocks or any conversational wrapper.`;

  const response = await openai.chat.completions.create({
    model: OLLAMA_MODEL,
    messages: [
      { role: "system", content: "You are a professional JSON generator. Output valid raw JSON only, matching the requested schema. No markdown formatting." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
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
  } catch (err: any) {
    console.error(`❌ Failed to parse JSON for ${vehicleLabel} - ${task}:`, err.message);
    return null;
  }
}
