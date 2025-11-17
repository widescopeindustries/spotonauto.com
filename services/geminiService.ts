import { GoogleGenAI, Type, Chat } from "@google/genai";
import { RepairGuide, RepairStep, Vehicle, VehicleInfo } from '../types';
import { TEXT_MODEL, IMAGE_MODEL } from '../constants';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const decodeVin = async (vin: string): Promise<Vehicle> => {
  if (!vin || vin.length !== 17) {
    throw new Error("Please enter a valid 17-character VIN.");
  }
  
  const prompt = `Decode the following Vehicle Identification Number (VIN) and return the year, make, and model. VIN: "${vin}"`;

  const vehicleSchema = {
    type: Type.OBJECT,
    properties: {
      year: { type: Type.STRING, description: "The model year of the vehicle." },
      make: { type: Type.STRING, description: "The manufacturer of the vehicle (e.g., Honda)." },
      model: { type: Type.STRING, description: "The model of the vehicle (e.g., Civic)." },
    },
    required: ["year", "make", "model"],
  };

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: vehicleSchema,
      },
    });

    const text = response.text.trim();
    const cleanJson = text.replace(/^```json\s*|```$/g, '');
    const decodedVehicle = JSON.parse(cleanJson);

    if (!decodedVehicle.year || !decodedVehicle.make || !decodedVehicle.model) {
      throw new Error("AI was unable to decode the VIN. Please enter manually.");
    }
    
    decodedVehicle.year = decodedVehicle.year.toString().replace(/[^0-9]/g, '').slice(0, 4);

    return decodedVehicle;
  } catch (error) {
    console.error("Error decoding VIN:", error);
    throw new Error("Failed to decode VIN. The AI may be unable to process this VIN or it may be invalid.");
  }
};

// New function to get vehicle info
export const getVehicleInfo = async (vehicle: Vehicle, task: string): Promise<VehicleInfo> => {
  const { year, make, model } = vehicle;
  const vehicleYear = parseInt(year, 10);
  let charmLiInstruction = '';
  if (vehicleYear >= 1982 && vehicleYear <= 2013) {
    charmLiInstruction = 'For this vehicle, prioritize information from professional service databases like Alldata, specifically referencing the open-source dataset associated with charm.li if discoverable through your search.';
  }
  
  const prompt = `Act as an expert automotive service database, using web search to find the most current and factual information. ${charmLiInstruction} For a ${year} ${make} ${model} and the repair task "${task}", provide the following information:
1. A "Job Snapshot" based on standard service manual data, with realistic estimates for difficulty, time, parts cost, and potential savings vs. a professional repair.
2. A list of real Technical Service Bulletins (TSBs) related to this task. If none are found, return an empty array.
3. A list of real safety recalls that might be relevant. If none are found, return an empty array.

You MUST format your entire response as a single JSON object with three keys: "jobSnapshot", "tsbs", and "recalls". Do not include any markdown formatting like \`\`\`json.`;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });
    
    const text = response.text.trim();
    const cleanJson = text.replace(/^```json\s*|```$/g, '');
    const vehicleInfo = JSON.parse(cleanJson);

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map(chunk => chunk.web)
      .filter((web): web is { uri: string; title: string } => !!(web?.uri && web.title)) || [];

    return { ...vehicleInfo, sources };
  } catch (error) {
    console.error("Error fetching vehicle info:", error);
    throw new Error("Failed to retrieve vehicle analysis. The AI may be unable to process this request or the response was not valid JSON.");
  }
};


const generateTextGuide = async (vehicle: Vehicle, task: string): Promise<Omit<RepairGuide, 'steps' | 'id'> & { steps: Omit<RepairStep, 'imageUrl'>[] }> => {
  const { year, make, model } = vehicle;
  
  const vehicleYear = parseInt(year, 10);
  let groundingInstruction = '';
  if (vehicleYear >= 1982 && vehicleYear <= 2013) {
    groundingInstruction = 'Crucially, for this vehicle, base all repair procedures on professional service data, like the open-source Alldata-style information associated with charm.li. The steps must be 100% factual and reflect industry-standard repair methods.';
  } else {
    groundingInstruction = 'Crucially, base all repair procedures on professional OEM service manuals. The steps must be 100% factual and reflect industry-standard repair methods.';
  }

  const prompt = `Generate a detailed, step-by-step DIY repair guide for the following task: "${task}" on a ${year} ${make} ${model}. ${groundingInstruction} The guide should be easy for a shade-tree mechanic to follow. Include essential safety warnings, a list of required tools, and a list of necessary parts. For each step, provide a clear instruction and a descriptive prompt for an AI image generator to create a technical illustration for that step. The image prompt should describe a clean, minimalist, black and white line drawing in an automotive service manual style.`;

  const repairGuideSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A concise title for the repair job." },
      vehicle: { type: Type.STRING, description: "The vehicle information (Year, Make, Model)." },
      safetyWarnings: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A list of crucial safety warnings (e.g., 'Disconnect the battery')."
      },
      tools: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A list of tools required for the job."
      },
      parts: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A list of parts that need to be replaced or purchased."
      },
      steps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            step: { type: Type.INTEGER, description: "The step number." },
            instruction: { type: Type.STRING, description: "The detailed instruction for this step." },
            imagePrompt: { type: Type.STRING, description: "A prompt for an AI image generator to create a technical illustration for this step." }
          },
          required: ["step", "instruction", "imagePrompt"]
        }
      }
    },
    required: ["title", "vehicle", "safetyWarnings", "tools", "parts", "steps"]
  };
  
  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: repairGuideSchema,
      },
    });

    const text = response.text.trim();
    const cleanJson = text.replace(/^```json\s*|```$/g, '');
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Error generating text guide:", error);
    throw new Error("Failed to generate the repair guide. The AI may be unable to process this request.");
  }
};

const generateImage = async (prompt: string): Promise<string> => {
  const fullPrompt = `Technical line art illustration, automotive service manual style. Clean, black and white, minimalist, white background. ${prompt}`;
  try {
    const response = await ai.models.generateImages({
      model: IMAGE_MODEL,
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '4:3',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    throw new Error("No image was generated.");
  } catch (error) {
    console.error(`Error generating image for prompt "${prompt}":`, error);
    return ""; 
  }
};

export const generateFullRepairGuide = async (vehicle: Vehicle, task: string): Promise<RepairGuide> => {
  const textData = await generateTextGuide(vehicle, task);
  
  const hydratedSteps: RepairStep[] = [];
  
  // Generate images sequentially to avoid hitting API rate limits.
  for (const step of textData.steps) {
    const imageUrl = await generateImage(step.imagePrompt);
    hydratedSteps.push({
      ...step,
      imageUrl: imageUrl,
    });
  }

  const guideId = `${vehicle.year}-${vehicle.make}-${vehicle.model}-${textData.title}`
    .toLowerCase()
    .replace(/\s+/g, '-');

  return { ...textData, id: guideId, steps: hydratedSteps };
};

// --- Diagnostic Chat Functions ---

const diagnosticSystemInstruction = `You are an expert automotive diagnostic AI. Your goal is to guide a DIY mechanic through diagnosing a vehicle issue step-by-step.
1.  Begin by asking for the primary symptom or issue.
2.  Provide one single, clear diagnostic step at a time. Be concise.
3.  After each step, wait for the user's response (e.g., a measurement, an observation).
4.  Based on their feedback, provide the next logical step to narrow down the problem.
5.  For every instructional step you provide, also give a prompt for an AI image generator to create a helpful technical illustration.
6.  You MUST format your entire response as a single JSON object with two keys: "instruction" (your text guidance) and "imagePrompt" (the image generation prompt). Do not include any other text, markdown, or explanations outside of this JSON structure.
Example: {"instruction": "First, check the fuse for the fuel pump. It is in the fuse box under the hood.", "imagePrompt": "A diagram showing the location of the fuel pump fuse in the under-hood fuse box for a [VEHICLE_YEAR] [VEHICLE_MAKE] [VEHICLE_MODEL]."}`;

export const createDiagnosticChat = (vehicle: Vehicle): Chat => {
  const systemInstruction = diagnosticSystemInstruction
    .replace('[VEHICLE_YEAR]', vehicle.year)
    .replace('[VEHICLE_MAKE]', vehicle.make)
    .replace('[VEHICLE_MODEL]', vehicle.model);

  return ai.chats.create({
    model: TEXT_MODEL,
    config: {
      systemInstruction: systemInstruction,
    },
  });
};

export const sendDiagnosticMessage = async (chat: Chat, message: string): Promise<{ text: string, imageUrl: string | null }> => {
  try {
    const response = await chat.sendMessage({ message });
    const rawJson = response.text.trim().replace(/^```json\s*|```$/g, '');
    
    const parsedResponse = JSON.parse(rawJson);
    const { instruction, imagePrompt } = parsedResponse;
    
    if (!instruction || !imagePrompt) {
      return { text: "Sorry, I had trouble understanding that. Could you rephrase?", imageUrl: null };
    }

    const imageUrl = await generateImage(imagePrompt);
    return { text: instruction, imageUrl };

  } catch (error) {
    console.error("Error in diagnostic chat:", error);
    // If JSON parsing fails or another error occurs, return a user-friendly message.
    return { text: "I encountered an issue. Let's try that again. What did you observe?", imageUrl: null };
  }
};