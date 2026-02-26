
import { GoogleGenAI, Type } from '@google/genai';
import { Vehicle, VehicleInfo, RepairGuide, ChatMessage } from '../types';
import { isValidVehicleCombination } from '@/data/vehicles';
import { getVehicleNHTSAData, nhtsaToPromptContext, recallsToSafetyWarnings } from './nhtsaService';

// NOTE: This service is now only used server-side (e.g., in api/ folder).
// Client-side code should use apiClient.ts instead to make secure API requests.
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey || apiKey === 'placeholder_gemini_key') {
  console.error("Gemini API Key is missing or invalid. Make sure GEMINI_API_KEY is set in your .env file.");
}

const genAI = new GoogleGenAI({ apiKey: apiKey || '' });

// Models
const TEXT_MODEL = "gemini-2.0-flash";
const IMAGE_MODEL = "imagen-3.0-generate-002";

// Schemas
const vehicleSchema = {
  type: Type.OBJECT,
  properties: {
    year: { type: Type.STRING, description: "The model year of the vehicle." },
    make: { type: Type.STRING, description: "The manufacturer of the vehicle." },
    model: { type: Type.STRING, description: "The model of the vehicle." },
  },
  required: ["year", "make", "model"],
};

const vehicleInfoSchema = {
  type: Type.OBJECT,
  properties: {
    jobSnapshot: { type: Type.STRING, description: "A summary of the repair task based on service manual data." },
    tsbs: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of Technical Service Bulletins related to the task." },
    recalls: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of safety recalls relevant to the task." },
  },
  required: ["jobSnapshot", "tsbs", "recalls"],
};

// Helper for Image Generation
async function generateImage(prompt: string): Promise<string> {
  // Client-side image generation might be restricted or require specific OAuth.
  // We attempt it, but fallback gracefully.
  const fullPrompt = `Technical line art illustration, automotive service manual style. Clean, black and white, minimalist, white background. ${prompt}`;
  try {
    const response = await genAI.models.generateImages({
      model: IMAGE_MODEL,
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '4:3',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const img = response.generatedImages[0].image;
      if (img && img.imageBytes) {
        return `data:image/jpeg;base64,${img.imageBytes}`;
      }
    }
    return "";
  } catch (e) {
    console.warn("Image generation failed (likely permission/scope issue on client):", e);
    return "";
  }
}

export const generateRepairStepImage = async (vehicle: string, stepInstruction: string): Promise<string> => {
  const prompt = `Show the specific action for: "${stepInstruction}" on a ${vehicle}. Focus on the mechanical parts involved. High contrast line art.`;
  return generateImage(prompt);
};

export interface Chat {
  // We keep the chat session instance to maintain history
  session: any;
  vehicle: Vehicle;
  // We add history property to satisfy types if needed, or manage it internally in the session
  history: any[];
}

export const decodeVin = async (vin: string): Promise<Vehicle> => {
  // Basic VIN format check before hitting the API
  const cleanVin = vin.trim().toUpperCase().replace(/[IOQ]/g, ''); // I, O, Q are illegal in VINs
  if (cleanVin.length !== 17) {
    throw new Error('VIN must be exactly 17 characters. Please check and try again.');
  }

  // Use the free NHTSA vPIC API for authoritative VIN decoding
  const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${encodeURIComponent(cleanVin)}?format=json`;
  console.log(`[VIN] Decoding via NHTSA vPIC: ${cleanVin}`);

  let response: Response;
  try {
    response = await fetch(nhtsaUrl, { signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined });
  } catch {
    throw new Error('Could not reach the NHTSA VIN database. Please try again or enter vehicle details manually.');
  }

  if (!response.ok) {
    throw new Error(`NHTSA API returned ${response.status}. Please try again or enter vehicle details manually.`);
  }

  const data = await response.json();
  const r = data.Results?.[0];
  if (!r) throw new Error('No response from NHTSA. Try entering vehicle details manually.');

  const year  = (r.ModelYear || '').trim();
  const make  = (r.Make      || '').trim();
  const model = (r.Model     || r.Series || r.Trim || '').trim();

  // Need at minimum year + make to be useful
  if (!year || !make) {
    const errorCode = r.ErrorCode || '';
    if (errorCode.includes('11') || errorCode.includes('12')) {
      throw new Error('VIN check digit is invalid. Please double-check the VIN number.');
    }
    throw new Error('NHTSA could not identify this VIN. Verify the VIN on your door jamb sticker or title, or enter vehicle details manually.');
  }

  // Model missing but year+make present — return what we have, let user fill model
  if (!model) {
    console.warn(`[VIN] ${cleanVin}: year+make decoded (${year} ${make}) but model missing — NHTSA gap`);
    return { year, make, model: '' }; // UI will prompt user to fill in model
  }

  // Normalize make to title case (FORD → Ford)
  const normMake = make.charAt(0).toUpperCase() + make.slice(1).toLowerCase();
  // Normalize model (F-150 → F-150, already fine usually)
  const normModel = model.charAt(0).toUpperCase() + model.slice(1).toLowerCase();

  console.log(`[VIN] ✓ Decoded: ${year} ${normMake} ${normModel}`);
  return { year, make: normMake, model: normModel };
};

// ─── Operation CHARM (charm.li) live fetch ──────────────────────────────────
// Publicly free service manual archive ("no strings attached") covering 1982–2013.
// We fetch live at query time — no local copy stored.
// For 2014+ vehicles we fall back silently to AI-only.

const CHARM_BASE = 'https://charm.li';
const CHARM_FETCH_OPTS = {
  headers: { 'User-Agent': 'SpotOnAuto/1.0 (+https://spotonauto.com) repair-guide-builder' },
  signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined,
};

/** Keywords mapping common repair tasks to relevant charm.li path segments */
const TASK_KEYWORDS: Record<string, string[]> = {
  'oil':          ['Oil', 'Lubrication', 'Engine Oil', 'Oil Pan', 'Oil Filter'],
  'brake':        ['Brake', 'Brakes', 'Pad', 'Rotor', 'Caliper', 'Brake Disc'],
  'spark':        ['Spark Plug', 'Tune-up', 'Ignition'],
  'battery':      ['Battery', 'Charging System'],
  'coolant':      ['Cooling System', 'Coolant', 'Thermostat', 'Radiator'],
  'transmission': ['Transmission', 'Clutch', 'Fluid'],
  'alternator':   ['Alternator', 'Charging', 'Generator'],
  'starter':      ['Starter', 'Starting System'],
  'belt':         ['Belt', 'Timing Belt', 'Serpentine', 'Drive Belt'],
  'filter':       ['Filter', 'Air Filter', 'Cabin Filter', 'Fuel Filter'],
  'tire':         ['Tire', 'Wheel Bearing', 'Hub', 'Suspension'],
  'shock':        ['Shock', 'Strut', 'Suspension', 'Spring'],
};

function extractText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&#\d+;/g, ' ')
    .replace(/\s{2,}/g, ' ').trim();
}

function extractLinks(html: string): string[] {
  const matches = html.matchAll(/href=['"]([^'"]+\/)['"]/g);
  return [...matches].map(m => m[1]);
}

/** Fuzzy match: find best vehicle variant on the year page for a given model name */
function bestVariantMatch(modelName: string, variants: string[]): string | null {
  const norm = (s: string) => decodeURIComponent(s).toLowerCase().replace(/[-_\s]+/g, ' ');
  const target = norm(modelName);
  // Score each variant by how many words from the model name appear in it
  const targetWords = target.split(' ').filter(w => w.length > 2);
  let bestScore = 0, bestVariant: string | null = null;
  for (const v of variants) {
    const vNorm = norm(v);
    const score = targetWords.filter(w => vNorm.includes(w)).length;
    if (score > bestScore) { bestScore = score; bestVariant = v; }
  }
  return bestScore > 0 ? bestVariant : (variants[0] ?? null); // fallback to first
}

/** Find relevant sections in the Repair+Diagnosis tree for a given task */
function findTaskSections(sectionLinks: string[], task: string): string[] {
  const taskLower = task.toLowerCase();
  const relevantKeywords: string[] = [];

  for (const [key, words] of Object.entries(TASK_KEYWORDS)) {
    if (taskLower.includes(key) || words.some(w => taskLower.includes(w.toLowerCase()))) {
      relevantKeywords.push(...words.map(w => w.toLowerCase()));
    }
  }

  // Also add individual words from the task itself
  const taskWords = taskLower.split(/\s+/).filter(w => w.length > 3);
  relevantKeywords.push(...taskWords);

  if (!relevantKeywords.length) return sectionLinks.slice(0, 5);

  return sectionLinks.filter(link => {
    const decoded = decodeURIComponent(link).toLowerCase();
    return relevantKeywords.some(kw => decoded.includes(kw));
  }).slice(0, 6);
}

/**
 * Fetch live repair manual content from charm.li for the given vehicle + task.
 * Returns null for 2014+ vehicles or if charm.li doesn't have the data.
 * Never throws — always fails gracefully.
 */
async function fetchFromCharmLi(year: string, make: string, model: string, task?: string): Promise<string | null> {
  // charm.li coverage is 1982–2013
  const yearNum = parseInt(year, 10);
  if (isNaN(yearNum) || yearNum > 2013 || yearNum < 1982) {
    console.log(`[CHARM.LI] Year ${year} outside coverage (1982-2013), skipping`);
    return null;
  }

  try {
    // Step 1: Get year page to find vehicle variants
    const yearUrl = `${CHARM_BASE}/${encodeURIComponent(make)}/${year}/`;
    const yearResp = await fetch(yearUrl, CHARM_FETCH_OPTS);
    if (!yearResp.ok) { console.warn(`[CHARM.LI] Make/year not found: ${make}/${year}`); return null; }
    const yearHtml = await yearResp.text();

    // Extract relative variant links (exclude breadcrumbs/nav)
    const allLinks = extractLinks(yearHtml);
    const variantLinks = allLinks.filter(l =>
      l.startsWith(`/${make}/`) && l.split('/').length === 4 // /Make/Year/Variant/
    );

    if (!variantLinks.length) { console.warn(`[CHARM.LI] No variants found for ${make}/${year}`); return null; }

    // Step 2: Fuzzy-match the user's model to available variants
    const variantPaths = variantLinks.map(l => l.split('/')[3]); // just the encoded variant segment
    const bestPath = bestVariantMatch(model, variantPaths);
    if (!bestPath) return null;

    const variantBase = `${CHARM_BASE}/${encodeURIComponent(make)}/${year}/${bestPath}`;
    const variantDecoded = decodeURIComponent(bestPath);
    console.log(`[CHARM.LI] ✓ Matched "${model}" → "${variantDecoded}"`);

    // Step 3: Fetch Repair and Diagnosis index
    const rdUrl = `${variantBase}Repair%20and%20Diagnosis/`;
    const rdResp = await fetch(rdUrl, CHARM_FETCH_OPTS);
    if (!rdResp.ok) { console.warn(`[CHARM.LI] No Repair+Diagnosis for ${variantDecoded}`); return null; }
    const rdHtml = await rdResp.text();

    // Step 4: Find task-relevant sections
    const sectionLinks = extractLinks(rdHtml).filter(l => !l.startsWith('/') || l.includes('Repair'));
    const relevantSections = task ? findTaskSections(sectionLinks, task) : sectionLinks.slice(0, 4);

    if (!relevantSections.length) {
      // Return just the section index as context
      return `=== charm.li: ${year} ${make} ${variantDecoded} — Repair & Diagnosis Index ===\n${extractText(rdHtml).slice(0, 4000)}`;
    }

    // Step 5: Fetch up to 3 relevant section pages in parallel
    const contentPages = await Promise.all(
      relevantSections.slice(0, 3).map(async section => {
        try {
          const sectionUrl = `${rdUrl}${section}`;
          const resp = await fetch(sectionUrl, CHARM_FETCH_OPTS);
          if (!resp.ok) return null;
          const html = await resp.text();
          const text = extractText(html).slice(0, 3000);
          const sectionName = decodeURIComponent(section.split('/').filter(Boolean).pop() ?? section);
          return `=== ${sectionName} ===\n${text}`;
        } catch { return null; }
      })
    );

    const content = contentPages.filter(Boolean).join('\n\n');
    if (!content.trim()) return null;

    const header = `=== charm.li Factory Service Manual: ${year} ${make} ${variantDecoded} ===\n`;
    console.log(`[CHARM.LI] ✓ Fetched ${contentPages.filter(Boolean).length} section(s) for "${task}"`);
    return header + content;

  } catch (error) {
    console.error('[CHARM.LI] Fetch error:', error);
    return null;
  }
}

export const getVehicleInfo = async (vehicle: Vehicle, task: string): Promise<VehicleInfo> => {
  const { year, make, model } = vehicle;

  // Validate vehicle combination before generating
  if (!isValidVehicleCombination(year, make, model, task)) {
    throw new Error(`Invalid vehicle combination: ${year} ${make} ${model}. This vehicle did not exist in the specified year.`);
  }

  // Fetch NHTSA data + charm.li in parallel
  const [nhtsaData, charmLiContent] = await Promise.all([
    getVehicleNHTSAData(year, make, model),
    fetchFromCharmLi(year, make, model, task),
  ]);

  const nhtsaContext = nhtsaToPromptContext(nhtsaData);

  const basePrompt = charmLiContent
    ? `Act as an expert automotive service database. For a ${year} ${make} ${model} and repair task "${task}", use the service manual content and NHTSA safety data below.

CHARM.LI SERVICE MANUAL CONTENT:
${charmLiContent.slice(0, 12000)}

${nhtsaContext}`
    : `Act as an expert automotive service database. For a ${year} ${make} ${model} and repair task "${task}", use the NHTSA safety data below and your knowledge of factory service procedures.

${nhtsaContext}`;

  const prompt = `${basePrompt}

Provide:
1. A "Job Snapshot" with realistic estimates for difficulty (1-5), time, parts cost, and potential savings.
2. A list of relevant Technical Service Bulletins (TSBs) — use real ones from the data above if available.
3. The ACTIVE RECALLS listed in the NHTSA data above — copy them exactly, do not invent new ones.

Format as JSON with keys: "jobSnapshot", "tsbs", "recalls".`;

  const response = await genAI.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: vehicleSchema,
    },
  });

  const text = (response.text || "").trim().replace(/^```json\s*|```$/g, '');
  const data = JSON.parse(text);

  // Override AI-generated recalls with real NHTSA recalls
  const realRecalls = nhtsaData.recalls.length > 0
    ? nhtsaData.recalls.slice(0, 5).map(r =>
        `[${r.nhtsaCampaignNumber}] ${r.component}: ${r.summary.slice(0, 300)}`
      )
    : data.recalls;

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web)
    .filter((web: any): web is { uri: string; title: string } => !!(web?.uri && web.title)) || [];

  return {
    ...data,
    recalls: realRecalls,
    sources,
  };
};

export const generateFullRepairGuide = async (vehicle: Vehicle, task: string): Promise<RepairGuide> => {
  const { year, make, model } = vehicle;

  // Validate vehicle combination before generating
  if (!isValidVehicleCombination(year, make, model, task)) {
    throw new Error(`Invalid vehicle combination: ${year} ${make} ${model}. This vehicle did not exist in the specified year.`);
  }

  // Fetch NHTSA data + charm.li in parallel
  const [nhtsaData, charmLiContent] = await Promise.all([
    getVehicleNHTSAData(year, make, model),
    fetchFromCharmLi(year, make, model, task),
  ]);

  const nhtsaContext = nhtsaToPromptContext(nhtsaData);
  const recallWarnings = recallsToSafetyWarnings(nhtsaData.recalls);

  const prompt = charmLiContent
    ? `Generate a step-by-step DIY repair guide for "${task}" on a ${year} ${make} ${model}.

PRIMARY DATA SOURCE - CHARM.LI FACTORY SERVICE MANUAL:
${charmLiContent.slice(0, 18000)}

${nhtsaContext}

INSTRUCTIONS:
1. Use the factory service manual content as your primary source for procedures
2. Extract the specific procedure for "${task}" on this exact vehicle
3. Include exact torque specs, part numbers from the manual
4. IMPORTANT: Use the NHTSA recall data above as safety warnings — these are REAL and must be included
5. Do not invent information not present in the sources above

Return JSON with title, vehicle, safetyWarnings, tools, parts, steps.`
    : `Generate a step-by-step DIY repair guide for "${task}" on a ${year} ${make} ${model}.

${nhtsaContext}

INSTRUCTIONS:
1. Provide accurate repair procedures based on known factory service procedures for this vehicle
2. Include torque specs, part numbers, and safety warnings where known
3. IMPORTANT: The NHTSA recall data above is REAL — include relevant recalls as the first safety warnings
4. Focus on safety and correctness

Return JSON with:
- title (concise repair task name)
- vehicle ("${year} ${make} ${model}")
- safetyWarnings (3-5 warnings — lead with any NHTSA recalls above)
- tools (5-10 tools needed)
- parts (5-10 part names with typical part numbers where known)
- steps (5-8 clear numbered steps)

Keep instructions concise and practical.`;

  const repairGuideSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A concise title for the repair job." },
      vehicle: { type: Type.STRING, description: "The vehicle information (Year, Make, Model)." },
      safetyWarnings: { type: Type.ARRAY, items: { type: Type.STRING } },
      tools: { type: Type.ARRAY, items: { type: Type.STRING } },
      parts: { type: Type.ARRAY, items: { type: Type.STRING } },
      steps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            step: { type: Type.INTEGER },
            instruction: { type: Type.STRING }
          },
          required: ["step", "instruction"]
        }
      }
    },
    required: ["title", "vehicle", "safetyWarnings", "tools", "parts", "steps"]
  };

  const response = await genAI.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: repairGuideSchema,
    },
  });

  const text = (response.text || "").trim().replace(/^```json\s*|```$/g, '');
  const data = JSON.parse(text);

  // Get source count but don't expose URLs (especially charm.li)
  const rawSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web)
    .filter((web: any): web is { uri: string; title: string } => !!(web?.uri && web.title)) || [];

  // Only pass sanitized source info (no URLs, just count for "verified" badge)
  const sources = rawSources.length > 0
    ? [{ title: 'Factory Service Manual', uri: '#verified' }]
    : [];

  const stepsWithImages = data.steps.map((step: any, idx: number) => ({
    step: idx + 1,
    instruction: step.instruction,
    imageUrl: ""
  }));

  // Prepend real NHTSA recall warnings — these override AI-generated ones
  const safetyWarnings: string[] = recallWarnings.length > 0
    ? [...recallWarnings, ...(data.safetyWarnings ?? []).slice(0, 4)]
    : (data.safetyWarnings ?? []);

  const guideId = `${year}-${make}-${model}-${data.title}`.toLowerCase().replace(/\s+/g, '-');

  return {
    ...data,
    id: guideId,
    safetyWarnings,
    steps: stepsWithImages,
    sources,
    sourceCount: rawSources.length,
  };
};

// --- Diagnostic Chat ---

export const createDiagnosticChat = (vehicle: Vehicle): Chat => {
  const { year, make, model } = vehicle;
  
  // Note: We can't throw here since this is synchronous, but the API route should validate
  
  const diagnosticSystemInstruction = `You are an expert automotive diagnostic AI for a ${year} ${make} ${model}. Your goal is to guide a DIY mechanic through diagnosing a vehicle issue step-by-step.

CRITICAL: Only provide diagnostic guidance if you can verify the ${year} ${make} ${model} existed. If you cannot find specific data for this EXACT vehicle, state "I don't have diagnostic data for this specific vehicle year" rather than guessing.

DATA SOURCE: When user describes symptoms or issues, you MUST use Google Search to find relevant diagnostic information. Always search "site:charm.li ${year} ${make} ${model}" combined with the symptom to find professional diagnostic procedures. Use charm.li as your PRIMARY SOURCE of information.

Instructions:
1.  Begin by asking for the primary symptom or issue.
2.  Provide one single, clear diagnostic step at a time. Be concise.
3.  After each step, wait for the user's response.
4.  You MUST format your entire response as a single JSON object with one key: "instruction" (your text guidance). Do not include any other text.`;

  const session = genAI.chats.create({
    model: TEXT_MODEL,
    config: {
      systemInstruction: diagnosticSystemInstruction,
    },
    history: []
  });

  return {
    session,
    vehicle,
    history: []
  };
};

export const sendDiagnosticMessage = async (chat: Chat, message: string): Promise<{ text: string, imageUrl: string | null }> => {
  const result = await chat.session.sendMessage(message);

  const text = (result.text || "").trim().replace(/^```json\s*|```$/g, '');
  let parsedResponse;

  try {
    parsedResponse = JSON.parse(text);
  } catch (e) {
    return { text: text, imageUrl: null };
  }

  const { instruction } = parsedResponse;

  return { text: instruction, imageUrl: null };
};

/**
 * Stateless diagnostic message handler - reconstructs chat from history each time
 * This is needed because API calls are stateless between requests
 */
export const sendDiagnosticMessageWithHistory = async (
  vehicle: Vehicle,
  message: string,
  history: { role: string; parts: { text: string }[] }[]
): Promise<{ text: string, imageUrl: string | null }> => {
  const { year, make, model } = vehicle;

  const diagnosticSystemInstruction = `You are an expert automotive diagnostic AI for a ${year} ${make} ${model}. Your goal is to guide a DIY mechanic through diagnosing a vehicle issue step-by-step.

Instructions:
1. If the user provides a diagnostic trouble code (like P0301, P0420, etc.), explain what it means and provide diagnostic steps.
2. If the user describes symptoms, ask clarifying questions and guide them through diagnosis.
3. Provide one clear diagnostic step at a time.
4. Be conversational but professional. Keep responses focused and helpful.
5. When you have enough information, suggest likely causes and repairs.

Keep your response concise and practical. Do NOT return JSON - respond in natural language.`;

  try {
    // Build the conversation contents for a single generateContent call
    // This is more reliable for stateless API calls
    const contents = [
      // Add history as alternating user/model messages
      ...history.map(h => ({
        role: h.role as 'user' | 'model',
        parts: h.parts.map(p => ({ text: p.text }))
      })),
      // Add the new user message
      {
        role: 'user' as const,
        parts: [{ text: message }]
      }
    ];

    // Use generateContent instead of chat for stateless operation
    const response = await genAI.models.generateContent({
      model: TEXT_MODEL,
      contents: contents,
      config: {
        systemInstruction: diagnosticSystemInstruction,
      }
    });

    const responseText = (response.text || "").trim();

    return { text: responseText, imageUrl: null };
  } catch (error) {
    console.error('Diagnostic message error:', error);
    throw error;
  }
};