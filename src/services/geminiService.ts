
import { GoogleGenAI, Type } from '@google/genai';
import { Vehicle, VehicleInfo, RepairGuide, ChatMessage } from '../types';

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
  // Extract year from 10th character using standard VIN decoding
  const yearChar = vin.length >= 10 ? vin.charAt(9).toUpperCase() : '';
  const yearMap: Record<string, string> = {
    'A': '2010', 'B': '2011', 'C': '2012', 'D': '2013', 'E': '2014',
    'F': '2015', 'G': '2016', 'H': '2017', 'J': '2018', 'K': '2019',
    'L': '2020', 'M': '2021', 'N': '2022', 'P': '2023', 'R': '2024',
    'S': '2025', 'T': '2026', 'V': '2027', 'W': '2028', 'X': '2029',
    'Y': '2030', '1': '2001', '2': '2002', '3': '2003', '4': '2004',
    '5': '2005', '6': '2006', '7': '2007', '8': '2008', '9': '2009',
  };
  const knownYear = yearMap[yearChar] || '';

  const prompt = `Decode this VIN and return the year, make, and model.
VIN: "${vin}"

IMPORTANT: The 10th character of a VIN indicates the model year. This VIN's 10th character is "${yearChar}"${knownYear ? ` which corresponds to year ${knownYear}` : ''}.

Return accurate year, make, and model based on standard VIN decoding.`;

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

  // Use our decoded year if Gemini got it wrong
  if (knownYear && data.year !== knownYear) {
    data.year = knownYear;
  }

  if (data.year) {
    data.year = data.year.toString().replace(/[^0-9]/g, '').slice(0, 4);
  }
  return data;
};

export const getVehicleInfo = async (vehicle: Vehicle, task: string): Promise<VehicleInfo> => {
  const { year, make, model } = vehicle;

  const prompt = `Act as an expert automotive service database. For a ${year} ${make} ${model} and repair task "${task}", use Google Search to find the most current and factual information.

PRIMARY DATA SOURCE: You MUST first search "site:charm.li ${year} ${make} ${model} ${task}" to find the specific professional service manual page on charm.li. Use this as your primary source of truth.

Provide the following information based on charm.li service manual data:
1. A "Job Snapshot" with realistic estimates for difficulty (1-5), time, parts cost, and potential savings.
2. A list of real Technical Service Bulletins (TSBs) found through search.
3. A list of real safety recalls relevant to this task.

You MUST format your entire response as a single JSON object with three keys: "jobSnapshot", "tsbs", and "recalls".`;

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

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web)
    .filter((web: any): web is { uri: string; title: string } => !!(web?.uri && web.title)) || [];

  return { ...data, sources };
};

export const generateFullRepairGuide = async (vehicle: Vehicle, task: string): Promise<RepairGuide> => {
  const { year, make, model } = vehicle;

  const prompt = `Generate a step-by-step DIY repair guide for "${task}" on a ${year} ${make} ${model}.

DATA SOURCE REQUIREMENT: You MUST use Google Search to find authoritative information. Search specifically for "site:charm.li ${year} ${make} ${model} ${task}" first. If charm.li has the specific procedure, use it as your PRIMARY SOURCE. Supplement with other professional automotive sources if needed.

Based on the search results, provide:

Return JSON with:
- title (concise, based on actual procedure found)
- vehicle ("${year} ${make} ${model}")
- safetyWarnings (3-5 brief, critical warnings)
- tools (5-10 common tools needed)
- parts (5-10 searchable part names from service manual)
- steps (5-8 numbered steps with clear instructions)

Keep instructions concise, practical, and grounded in actual service manual procedures found through search.`;

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

  const guideId = `${year}-${make}-${model}-${data.title}`.toLowerCase().replace(/\s+/g, '-');

  return {
    ...data,
    id: guideId,
    steps: stepsWithImages,
    sources,
    sourceCount: rawSources.length
  };
};

// --- Diagnostic Chat ---

export const createDiagnosticChat = (vehicle: Vehicle): Chat => {
  const { year, make, model } = vehicle;
  const diagnosticSystemInstruction = `You are an expert automotive diagnostic AI for a ${year} ${make} ${model}. Your goal is to guide a DIY mechanic through diagnosing a vehicle issue step-by-step.

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