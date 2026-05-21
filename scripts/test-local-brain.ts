import fs from 'fs';
import path from 'path';
import { findManualSectionsByTerms } from '../src/lib/manualEmbeddingsStore';
import OpenAI from 'openai';

// Manual .env.local parsing to avoid external dependencies
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        const key = parts[0]?.trim();
        const value = parts.slice(1).join('=').trim();
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  }
} catch (e) {
  console.warn("Failed to load .env.local", e);
}

async function run() {
  console.log("=== ARKC Local Brain Integration Test ===");
  
  // 1. Fetch data from VPS Database via the SSH tunnel
  const vehicle = { year: 2012, make: "Honda", model: "Civic" };
  const task = "oil change";
  const terms = ["oil", "capacity", "torque", "drain"];
  
  console.log(`\n[1/3] Querying VPS Database via SSH tunnel for: ${vehicle.year} ${vehicle.make} ${vehicle.model} - "${task}"...`);
  
  let rows: any[] = [];
  try {
    rows = await findManualSectionsByTerms({
      make: vehicle.make,
      year: vehicle.year,
      model: vehicle.model,
      terms,
      limit: 2
    });
  } catch (error) {
    console.error("Database query failed. Make sure the SSH tunnel is active on port 5432.", error);
    process.exit(1);
  }
  
  if (!rows || rows.length === 0) {
    console.log("No exact matching manual sections found in the database. Using fallback mockup context.");
    rows = [{
      sectionTitle: "Engine Lubrication - Maintenance",
      contentPreview: "Recommended engine oil: API Premium Grade 0W-20. Capacity: 3.7 Quarts (3.5 Liters) with oil filter replacement. Drain plug torque: 29 lb-ft (39 N-m). Filter torque: 9-12 lb-ft.",
      contentFull: "Engine oil change procedure:\n1. Warm up the engine.\n2. Remove the oil filler cap.\n3. Raise the vehicle and support on jack stands.\n4. Place a drain pan under the engine oil pan drain bolt.\n5. Remove the drain bolt and washer. Allow oil to drain.\n6. Clean and install the drain bolt with a new washer. Torque to 29 lb-ft (39 N-m).\n7. Remove the oil filter using an oil filter wrench.\n8. Clean the mating surface on the engine block. Lubricate the new O-ring with fresh engine oil.\n9. Spin on the new filter until the seal contacts the block, then tighten another 3/4 turn (9-12 lb-ft).\n10. Fill engine with 3.7 Quarts (3.5 Liters) of 0W-20 oil.\n11. Run engine, inspect for leaks, and reset the maintenance minder."
    }];
  } else {
    console.log(`✓ Found ${rows.length} relevant manual sections in the database.`);
  }

  const selectedRow = rows[0];
  console.log(`  - Section: "${selectedRow.sectionTitle}"`);
  console.log(`  - Preview: "${selectedRow.contentPreview.slice(0, 150)}..."`);

  // 2. Initialize connection to local llama-server running Qwen 35B
  const openai = new OpenAI({
    apiKey: 'ollama',
    baseURL: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:7474/v1'
  });
  const model = process.env.OLLAMA_MODEL || 'Qwen3.6-35B-A3B-UD-Q4_K_XL';

  console.log(`\n[2/3] Connecting to Local AI Engine at ${openai.baseURL} (Model: ${model})...`);

  const systemInstruction = `You are "Manuel", an expert automotive mechanic. Provide a step-by-step DIY guide based on the provided factory service manual content. Include exact specifications (torque, volume, viscosity) and output in Markdown. Do not invent any facts not present in the manual content.`;
  const prompt = `Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}
Task: ${task}

FACTORY SERVICE MANUAL CONTENT:
${selectedRow.contentFull || selectedRow.contentPreview}`;

  console.log("\n[3/3] Sending query to local Qwen 3.6 35B model...");
  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    });

    console.log("\n=== Manuel's Diagnostic Response ===");
    console.log(completion.choices[0].message.content);
    console.log("====================================");
  } catch (error: any) {
    console.error("Local LLM request failed. Make sure Qwen 3.6 Vulkan container is active on port 7474.", error);
  }
}

run();
