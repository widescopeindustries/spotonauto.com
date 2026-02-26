
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
  // Use the free NHTSA vPIC API for authoritative VIN decoding (no AI hallucination)
  const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${encodeURIComponent(vin)}?format=json`;

  console.log(`[VIN] Decoding via NHTSA API: ${vin}`);

  const response = await fetch(nhtsaUrl);
  if (!response.ok) {
    throw new Error(`NHTSA API error: ${response.status}`);
  }

  const data = await response.json();
  const result = data.Results?.[0];

  if (!result) {
    throw new Error('No results from NHTSA VIN decoder');
  }

  const year = result.ModelYear || '';
  const make = result.Make || '';
  const model = result.Model || '';

  if (!year || !make || !model) {
    throw new Error(`Could not decode VIN: ${vin}. NHTSA returned incomplete data.`);
  }

  console.log(`[VIN] Decoded: ${year} ${make} ${model}`);

  return { year, make, model };
};

// Local charm.li server URL (configured in .env.local)
const CHARM_LI_SERVER_URL = process.env.CHARM_LI_SERVER_URL || 'http://localhost:8080';

/**
 * Fetch raw content from local charm.li server
 */
async function fetchFromCharmLi(year: string, make: string, model: string, task?: string): Promise<string | null> {
  try {
    // Construct charm.li path: /Make/Year/Model/
    const path = `/${make}/${year}/${model}/`.replace(/\s+/g, '-');
    const url = `${CHARM_LI_SERVER_URL}${path}`;
    
    console.log(`[CHARM.LI] Fetching: ${url}`);
    
    const response = await fetch(url, { 
      method: 'GET',
      headers: { 'Accept': 'text/html,application/json' }
    });
    
    if (!response.ok) {
      console.warn(`[CHARM.LI] Not found: ${path}`);
      return null;
    }
    
    const content = await response.text();
    console.log(`[CHARM.LI] ✓ Found data for ${year} ${make} ${model}`);
    return content;
    
  } catch (error) {
    console.error('[CHARM.LI] Error fetching:', error);
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