
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// Models
const TEXT_MODEL = "gemini-2.0-flash-exp";
const IMAGE_MODEL = "imagen-3.0-generate-002";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS Handling
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { action, payload } = req.body;

    try {
        switch (action) {
            case 'decode-vin':
                return await handleDecodeVin(payload, res);
            case 'vehicle-info':
                return await handleVehicleInfo(payload, res);
            case 'generate-guide':
                return await handleGenerateGuide(payload, res);
            case 'diagnostic-chat':
                return await handleDiagnosticChat(payload, res);
            default:
                return res.status(400).json({ error: `Unknown action: ${action}` });
        }
    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}

async function handleDecodeVin(payload: { vin: string }, res: VercelResponse) {
    const { vin } = payload;
    if (!vin) throw new Error('VIN is required');

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

    const response = await genAI.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: vehicleSchema,
        },
    });

    // Use response.text (property) not function
    const text = (response.text || "").trim().replace(/^```json\s*|```$/g, '');
    const data = JSON.parse(text);

    if (data.year) {
        data.year = data.year.toString().replace(/[^0-9]/g, '').slice(0, 4);
    }

    return res.status(200).json(data);
}

async function handleVehicleInfo(payload: { vehicle: any, task: string }, res: VercelResponse) {
    const { vehicle, task } = payload;
    const { year, make, model } = vehicle;

    const vehicleYear = parseInt(year, 10);
    let charmLiInstruction = '';
    if (vehicleYear >= 1982 && vehicleYear <= 2013) {
        charmLiInstruction = 'URGENT: For this vehicle, you MUST search "site:charm.li ' + year + ' ' + make + ' ' + model + ' ' + task + '" to find the specific professional service manual page. Prioritize data found in these factory-level databases.';
    }

    const prompt = `Act as an expert automotive service database, using web search to find the most current and factual information. ${charmLiInstruction} For a ${year} ${make} ${model} and the repair task "${task}", provide the following information:
1. A "Job Snapshot" based on standard service manual data, with realistic estimates for difficulty, time, parts cost, and potential savings vs. a professional repair.
2. A list of real Technical Service Bulletins (TSBs) related to this task. If none are found, return an empty array.
3. A list of real safety recalls that might be relevant. If none are found, return an empty array.

You MUST format your entire response as a single JSON object with three keys: "jobSnapshot", "tsbs", and "recalls". Do not include any markdown formatting like \`\`\`json.`;

    const response = await genAI.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const text = (response.text || "").trim().replace(/^```json\s*|```$/g, '');
    const data = JSON.parse(text);

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => chunk.web)
        .filter((web: any): web is { uri: string; title: string } => !!(web?.uri && web.title)) || [];

    return res.status(200).json({ ...data, sources });
}

async function generateImage(prompt: string): Promise<string> {
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
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        return "";
    } catch (e) {
        console.error("Image generation failed:", e);
        return "";
    }
}

async function handleGenerateGuide(payload: { vehicle: any, task: string }, res: VercelResponse) {
    const { vehicle, task } = payload;
    const { year, make, model } = vehicle;

    const vehicleYear = parseInt(year, 10);
    let groundingInstruction = '';
    if (vehicleYear >= 1982 && vehicleYear <= 2013) {
        groundingInstruction = 'CRITICAL: You MUST use the Google Search tool to find "site:charm.li ' + year + ' ' + make + ' ' + model + ' ' + task + '". This search targets a factory-level service manual database. Base ALL repair steps, torque specs, and fluid capacities on the verified factory manual content retrieved. If exact steps are found, use them as the source of truth.';
    } else {
        groundingInstruction = 'Crucially, use Google Search to find professional OEM service manuals or technical forums for this specific vehicle. The steps must be 100% factual and reflect industry-standard repair methods.';
    }

    const prompt = `Generate a detailed, step-by-step DIY repair guide for the following task: "${task}" on a ${year} ${make} ${model}. ${groundingInstruction} The guide should be easy for a shade-tree mechanic to follow, using clear "IF this, THEN that" logic where applicable for diagnostics or complex steps. 
  
  Include essential safety warnings, a list of required tools, and a list of necessary parts. 
  IMPORTANT: For the 'parts' list, provide specific, searchable product names (e.g., "Front Brake Pads (Ceramic)" instead of just "Brake Pads") so they can be easily found on Amazon.

  For each step, provide a clear instruction and a descriptive prompt for an AI image generator to create a technical illustration for that step. The image prompt should describe a clean, minimalist, black and white line drawing in an automotive service manual style.`;

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

    const response = await genAI.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: repairGuideSchema,
            tools: [{ googleSearch: {} }],
        },
    });

    const text = (response.text || "").trim().replace(/^```json\s*|```$/g, '');
    const data = JSON.parse(text);

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => chunk.web)
        .filter((web: any): web is { uri: string; title: string } => !!(web?.uri && web.title)) || [];

    // Generate images 
    const stepsWithImages = await Promise.all(data.steps.map(async (step: any) => {
        const imageUrl = await generateImage(step.imagePrompt);
        return { ...step, imageUrl };
    }));

    const guideId = `${vehicle.year}-${vehicle.make}-${vehicle.model}-${data.title}`
        .toLowerCase()
        .replace(/\s+/g, '-');

    return res.status(200).json({
        ...data,
        id: guideId,
        steps: stepsWithImages,
        sources
    });
}

async function handleDiagnosticChat(payload: { history: any[], message: string, vehicle: any }, res: VercelResponse) {
    const { history, message, vehicle } = payload;

    const diagnosticSystemInstruction = `You are an expert automotive diagnostic AI with access to online service manuals. Your goal is to guide a DIY mechanic through diagnosing a vehicle issue step-by-step, referencing real factory-level service data whenever possible.
    1.  Begin by asking for the primary symptom or issue.
    2.  Use the search tool to find TSBs or diagnostic trees for the specific vehicle and symptom (e.g., search "site:charm.li ${vehicle.year} ${vehicle.make} ${vehicle.model} no start diagnostic").
    3.  Provide one single, clear diagnostic step at a time. Be concise.
    4.  After each step, wait for the user's response (e.g., a measurement, an observation).
    5.  Based on their feedback, provide the next logical step to narrow down the problem.
    6.  For every instructional step you provide, also give a prompt for an AI image generator to create a helpful technical illustration.
    7.  You MUST format your entire response as a single JSON object with two keys: "instruction" (your text guidance) and "imagePrompt" (the image generation prompt). Do not include any other text, markdown, or explanations outside of this JSON structure.
    Example: {"instruction": "First, check the fuse for the fuel pump. It is in the fuse box under the hood.", "imagePrompt": "A diagram showing the location of the fuel pump fuse in the under-hood fuse box for a ${vehicle.year} ${vehicle.make} ${vehicle.model}."}`;

    const chat = genAI.chats.create({
        model: TEXT_MODEL,
        config: {
            systemInstruction: diagnosticSystemInstruction,
            tools: [{ googleSearch: {} }],
        },
        history: history || []
    });

    const response = await chat.sendMessage(message as any);


    const text = (response.text || "").trim().replace(/^```json\s*|```$/g, '');

    let parsedResponse;
    try {
        parsedResponse = JSON.parse(text);
    } catch {
        return res.status(200).json({ text: "I encountered an issue. Let's try that again. What did you observe?", imageUrl: null });
    }

    const { instruction, imagePrompt } = parsedResponse;
    // Generate image
    const imageUrl = await generateImage(imagePrompt);

    return res.status(200).json({ text: instruction, imageUrl });
}
