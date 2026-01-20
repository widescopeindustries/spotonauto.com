
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

export interface Chat {
    // We keep the chat session instance to maintain history
    session: any; 
    vehicle: Vehicle;
    // We add history property to satisfy types if needed, or manage it internally in the session
    history: any[];
}

export const decodeVin = async (vin: string): Promise<Vehicle> => {
  const prompt = `Decode the following Vehicle Identification Number (VIN) and return the year, make, and model. VIN: "${vin}"`;

  const vehicleSchema = {
    type: Type.OBJECT,
    properties: {
      year: { type: Type.STRING, description: "The model year of the vehicle." },
      make: { type: Type.STRING, description: "The manufacturer of the vehicle." },
      model: { type: Type.STRING, description: "The model of the vehicle." },
    },
    required: ["year", "make", "model"],
  };

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

  if (data.year) {
    data.year = data.year.toString().replace(/[^0-9]/g, '').slice(0, 4);
  }
  return data;
};

export const getVehicleInfo = async (vehicle: Vehicle, task: string): Promise<VehicleInfo> => {
  const { year, make, model } = vehicle;
  const vehicleYear = parseInt(year, 10);
  let charmLiInstruction = '';
  if (vehicleYear >= 1982 && vehicleYear <= 2013) {
    charmLiInstruction = 'URGENT: For this vehicle, you MUST search "site:charm.li ' + year + ' ' + make + ' ' + model + ' ' + task + '" to find the specific professional service manual page.';
  }

  const prompt = `Act as an expert automotive service database, using web search to find the most current and factual information. ${charmLiInstruction} For a ${year} ${make} ${model} and the repair task "${task}", provide the following information:
1. A "Job Snapshot" based on standard service manual data, with realistic estimates for difficulty, time, parts cost, and potential savings.
2. A list of real Technical Service Bulletins (TSBs) related to this task.
3. A list of real safety recalls that might be relevant.

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
  const vehicleYear = parseInt(year, 10);
  let groundingInstruction = '';
  if (vehicleYear >= 1982 && vehicleYear <= 2013) {
    groundingInstruction = 'CRITICAL: You MUST use the Google Search tool to find "site:charm.li ' + year + ' ' + make + ' ' + model + ' ' + task + '". Base ALL repair steps on the factory manual content retrieved.';
  } else {
    groundingInstruction = 'Crucially, use Google Search to find professional OEM service manuals or technical forums for this specific vehicle.';
  }

  const prompt = `Generate a detailed, step-by-step DIY repair guide for the following task: "${task}" on a ${year} ${make} ${model}. ${groundingInstruction} The guide should be easy for a shade-tree mechanic to follow. 
  
  Include essential safety warnings, a list of required tools, and a list of necessary parts. 
  IMPORTANT: For the 'parts' list, provide specific, searchable product names.

  For each step, provide a clear instruction and a descriptive prompt for an AI image generator to create a technical illustration for that step.`;

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
            instruction: { type: Type.STRING },
            imagePrompt: { type: Type.STRING }
          },
          required: ["step", "instruction", "imagePrompt"]
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

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web)
    .filter((web: any): web is { uri: string; title: string } => !!(web?.uri && web.title)) || [];

  // Disable image generation for now to stay under 10s timeout
  const stepsWithImages = data.steps.map((step: any) => ({ ...step, imageUrl: "" }));

  const guideId = `${year}-${make}-${model}-${data.title}`.toLowerCase().replace(/\s+/g, '-');

  return {
    ...data,
    id: guideId,
    steps: stepsWithImages,
    sources
  };
};

// --- Diagnostic Chat ---

export const createDiagnosticChat = (vehicle: Vehicle): Chat => {
  const diagnosticSystemInstruction = `You are an expert automotive diagnostic AI. Your goal is to guide a DIY mechanic through diagnosing a vehicle issue step-by-step.
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
  // We send the message to the existing session
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