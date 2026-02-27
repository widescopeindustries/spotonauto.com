
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!process.env.GEMINI_API_KEY) {
    console.error("No API KEY found in .env.local");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
    try {
        console.log("Listing models...");
        // The new SDK structure might be different, let's try the standard way if possible
        // or just try to generate content with what we think works to test it.
        // Actually, checking available models via SDK:
        // ai.models.list() does not exist on the generic client often, let's check.
        // simpler: try to generate with gemini-1.5-flash and gemini-1.5-pro and 2.0-flash-exp

        const modelsToTest = [
            'gemini-1.5-flash',
            'gemini-1.5-flash-001',
            'models/gemini-1.5-flash',
            'gemini-2.0-flash-exp',
            'gemini-1.5-pro'
        ];

        for (const model of modelsToTest) {
            try {
                console.log(`Testing model: ${model}`);
                const response = await ai.models.generateContent({
                    model: model,
                    contents: "Hello, result."
                });
                console.log(`✅ SUCCESS: ${model} works!`);
            } catch (e) {
                console.log(`❌ FAILED: ${model} - ${e.message}`);
            }
        }

    } catch (error) {
        console.error("Global error:", error);
    }
}

listModels();
