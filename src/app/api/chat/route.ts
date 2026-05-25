import { NextRequest, NextResponse } from "next/server";
import { logWarn } from "@/lib/logger";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { checkRateLimit } from "@/lib/rateLimit";
import { getDTCGraphData } from "@/lib/graphQueries";
import { findNearestRepairProfile } from "@/lib/vehicleRepairProfiles";
import { findManualSectionsByTerms, findVehicleManualSections, findDiagnosticTroubleCodeSections } from "@/lib/manualEmbeddingsStore";

const geminiApiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenAI({ apiKey: geminiApiKey });
const openAiApiKey = process.env.OPENAI_API_KEY;
const openAI = openAiApiKey ? new OpenAI({ apiKey: openAiApiKey }) : null;

const kimiApiKey = process.env.KIMI_API_KEY;
const kimi = kimiApiKey
  ? new OpenAI({ apiKey: kimiApiKey, baseURL: "https://api.moonshot.ai/v1" })
  : null;

const ollamaBaseURL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1";
const ollamaModel = process.env.OLLAMA_MODEL || "qwen2.5:7b";
const ollama = new OpenAI({
  apiKey: "ollama", // required by SDK but unused by Ollama
  baseURL: ollamaBaseURL,
});

const preferOpenAI = (() => {
  const raw = (process.env.OPENAI_PRIMARY || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
})();
const preferKimi = (() => {
  const raw = (process.env.KIMI_PRIMARY || "").trim().toLowerCase();
  if (!raw) return false;
  return raw === "1" || raw === "true" || raw === "yes";
})();
const preferGemini = (() => {
  const raw = (process.env.GEMINI_PRIMARY || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
})();
const preferOllama = (() => {
  const raw = (process.env.OLLAMA_PRIMARY || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
})();

function buildSystemPrompt(graphContext?: string, corpusContext?: string, isOllama = false): string {
  const corpusFirstRule = corpusContext
    ? `\n\n=== FACTORY MANUAL DATA (your primary source) ===\n` +
      `The excerpts below are from the ACTUAL factory service manuals in your archive. ` +
      `Base your answer PRIMARILY on these excerpts. Quote or paraphrase them directly. ` +
      `If excerpts are incomplete, say what the manual covers and what it doesn't. ` +
      `Never invent specs that aren't in the excerpts.`
    : '';

  const ollamaHint = isOllama
    ? `\n\nYou're running on a local model with direct access to our proprietary corpus. ` +
      `Use the provided manual excerpts as your primary source. Be concise and accurate.`
    : '';

  return `You are **Manuel** (pronounced like "Man-well") — the Factory AI Diagnostician at AllOEMManuals.com.

**WHO YOU ARE:**
You are a senior factory-trained automotive technician with 30+ years of experience who has read every service manual in the CHARM and LEMON archives. You speak like a real mechanic — conversational, direct, occasionally gruff but always helpful. You call the user "boss" or "amigo" sometimes. You're not a corporate chatbot — you're the old tech in the shop who knows every quirk of every engine.

**YOUR ARCHIVE:**
- CHARM: 24,935 vehicles (1982–2013), 548GB of OEM manual images + 34GB pages
- LEMON: 279,988 vehicles (1960–2025), 481GB of OEM manual images + 31GB pages
- When you reference data, say things like "the book calls for..." or "per the factory manual..." or "I've seen this a hundred times on the [model]..."

**HOW YOU BEHAVE:**
1. **ALWAYS get year/make/model first.** Never diagnose without it. A 2002 Camry and a 2022 Camry are completely different animals. Say: "Before we go any further — what year, make, and model are we working on?"

2. **Be PROACTIVE.** Don't just answer questions — anticipate what the user needs next.
   - Bad: "Yes, P0420 is a catalytic converter code."
   - Good: "P0420 — Catalyst Efficiency Below Threshold. On a 2008 Honda Accord, this usually means the downstream O2 sensor is lying to the computer. But before you throw a $400 cat at it, let's check for exhaust leaks upstream. Do you see any black soot marks before the first O2 sensor?"

3. **Walk through factory flowcharts step by step.** Don't dump everything at once. Ask one question at a time, then branch based on the answer.
   - "Step 1: Check for exhaust leaks before the upstream O2 sensor. Do you see any cracks or black soot?"
   - If yes: "Fix the leak first — that's probably your whole problem."
   - If no: "Step 2: With the engine hot, monitor Bank 1 Sensor 1 voltage..."

4. **Tell war stories.** Reference common failures you've "seen" on specific vehicles.
   - "The 3.5L V6 in that generation is notorious for oil consumption contaminating the cat. Check your oil level first."
   - "Those rear caliper bolts are a pain — use a 10mm swivel socket or you'll round them off like everyone else does."

5. **Route users to exact pages on the site.** When you know the answer lives on a specific page, give them the direct link.
   - "I've got the exact serpentine belt routing for your 2010 Camry right here: [link to /repair/2010/toyota/camry/serpentine-belt-replacement]"
   - "The torque spec for those caliper bolts is 25 ft-lbs. I've got the full brake guide here: [link]"

6. **Remember context.** If the user told you they have a 2008 Honda Accord in a previous message, don't ask again. Use it.

**ROUTING FORMAT:**
When you want to send the user to a specific page, include the link in markdown:
- Repair guide: "/repair/{year}/{make}/{model}/{task}"
- Tool/spec page: "/tools/{slug}"
- DTC code: "/codes/{code}"
- Wiring: "/wiring/{year}/{make}/{model}/{system}"
- Vehicle hub: "/vehicles/{year}/{make}/{model}"

**VOICE & TONE:**
- Warm, confident, slightly weathered. Like a tech who's been under cars for decades.
- Use contractions ("don't", "can't", "here's").
- Short paragraphs. One idea per paragraph.
- Use bullet points for steps.
- Bold important specs or warnings.
- If something is dangerous, say so clearly: **"Do NOT open a hot radiator cap."**

${corpusFirstRule}${ollamaHint}
${graphContext ? '\n=== DTC GRAPH DATA ===\n' + graphContext : ''}${corpusContext ? '\n=== FACTORY MANUAL EXCERPTS ===\n' + corpusContext : ''}`;
}

// ── CORPUS-BASED FALLBACK (works when all LLM APIs are down) ────────────────

function extractVehicleTaskFromMessage(message: string): { year?: number; make?: string; model?: string; task?: string } | null {
  const lower = message.toLowerCase();
  
  // Extract year
  const yearMatch = lower.match(/\b(19\d{2}|20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;
  
  // Known makes
  const makes = [
    "toyota", "honda", "ford", "chevrolet", "chevy", "nissan", "hyundai", "kia",
    "mazda", "mitsubishi", "subaru", "bmw", "mercedes", "volkswagen", "vw", "audi",
    "jeep", "dodge", "chrysler", "gmc", "buick", "cadillac", "lincoln", "pontiac",
    "saturn", "oldsmobile", "mercury", "plymouth", "acura", "infiniti", "lexus",
    "volvo", "jaguar", "land rover", "porsche", "mini", "fiat", "peugeot", "renault",
    "suzuki", "smart", "saab", "hummer", "scion", "geo", "eagle", "daewoo",
  ];
  let make: string | undefined;
  for (const m of makes) {
    if (lower.includes(m)) {
      make = m === "chevy" ? "chevrolet" : m === "vw" ? "volkswagen" : m;
      break;
    }
  }
  
  // Task patterns
  const taskPatterns: [RegExp, string][] = [
    [/battery/, "battery-replacement"],
    [/spark\s*plug/, "spark-plug-replacement"],
    [/oil\s*change|oil\s*type|oil\s*capacity/, "oil-change"],
    [/brake\s*pad/, "brake-pad-replacement"],
    [/brake\s*rotor/, "brake-rotor-replacement"],
    [/serpentine\s*belt|drive\s*belt/, "serpentine-belt-replacement"],
    [/timing\s*belt/, "timing-belt-replacement"],
    [/timing\s*chain/, "timing-chain-replacement"],
    [/thermostat/, "thermostat-replacement"],
    [/water\s*pump/, "water-pump-replacement"],
    [/radiator/, "radiator-replacement"],
    [/starter/, "starter-replacement"],
    [/alternator/, "alternator-replacement"],
    [/headlight|headlight\s*bulb/, "headlight-bulb-replacement"],
    [/tail\s*light|taillight/, "tail-light-replacement"],
    [/cabin\s*air\s*filter|cabin\s*filter/, "cabin-air-filter-replacement"],
    [/engine\s*air\s*filter|air\s*filter/, "engine-air-filter-replacement"],
    [/transmission\s*fluid/, "transmission-fluid-change"],
    [/coolant|antifreeze/, "coolant-flush"],
    [/fuel\s*pump/, "fuel-pump-replacement"],
    [/fuel\s*filter/, "fuel-filter-replacement"],
    [/fuel\s*injector/, "fuel-injector-replacement"],
    [/oxygen\s*sensor|o2\s*sensor/, "oxygen-sensor-replacement"],
    [/ignition\s*coil/, "ignition-coil-replacement"],
    [/maf\s*sensor|mass\s*air\s*flow/, "mass-air-flow-sensor-replacement"],
    [/wiper|windshield\s*wiper/, "windshield-wiper-replacement"],
    [/cv\s*axle|cv\s*joint/, "cv-axle-replacement"],
    [/wheel\s*bearing/, "wheel-bearing-replacement"],
    [/shock\s*absorber|shocks/, "shock-absorber-replacement"],
    [/strut/, "strut-replacement"],
    [/tie\s*rod/, "tie-rod-replacement"],
    [/ball\s*joint/, "ball-joint-replacement"],
    [/catalytic\s*converter/, "catalytic-converter-replacement"],
    [/muffler/, "muffler-replacement"],
    [/egr\s*valve/, "egr-valve-replacement"],
    [/differential\s*fluid/, "differential-fluid-change"],
    [/power\s*steering\s*fluid/, "power-steering-fluid-change"],
    [/turbo/, "turbo-replacement"],
    [/glow\s*plug/, "glow-plug-replacement"],
    [/clutch/, "clutch-replacement"],
    [/valve\s*cover\s*gasket/, "valve-cover-gasket-replacement"],
    [/head\s*gasket/, "head-gasket-replacement"],
    [/crankshaft\s*sensor|crank\s*sensor/, "crankshaft-sensor-replacement"],
    [/camshaft\s*sensor|cam\s*sensor/, "camshaft-sensor-replacement"],
  ];
  
  let task: string | undefined;
  for (const [pattern, taskSlug] of taskPatterns) {
    if (pattern.test(lower)) {
      task = taskSlug;
      break;
    }
  }
  
  // Extract model by removing year, make, and task keywords
  if (year && make) {
    let cleaned = lower;
    cleaned = cleaned.replace(new RegExp(`\\b${year}\\b`, "g"), "");
    cleaned = cleaned.replace(new RegExp(`\\b${make}\\b`, "g"), "");
    for (const [pattern] of taskPatterns) {
      cleaned = cleaned.replace(pattern, "");
    }
    // Remove common filler words
    const fillers = /\b(what|size|does|a|the|how|to|replace|replacement|change|where|is|on|in|for|my|do|i|need|know|about|get|find|cost|much|many|qt|quart|type|capacity|location|torque|spec|specs|gap|diagram|routing|install|remove|fix|repair|guide|help|please|thank|you|your|have|has|had|will|would|should|could|can|may|might|this|that|these|those|with|without|from|by|of|and|or|but|so|if|then|than|as|at|be|been|being|am|are|was|were|an|it|its|we|us|our|they|them|their|he|she|his|her|him|himself|herself|mine|yours|ours|theirs|one|two|three|four|five|six|seven|eight|nine|ten|first|second|third|last|next|previous|before|after|above|below|up|down|out|over|under|again|further|then|once|here|there|when|where|why|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|just|now|also|back|still|well|even|new|good|old|right|big|high|small|different|large|long|little|important|public|great|same|able|bad|best|better|early|enough|far|fast|free|full|hard|high|hot|late|low|main|major|many|more|much|near|next|nice|old|only|open|other|own|poor|real|right|same|short|small|special|strong|sure|true|various|whole|wide|young)\b/g;
    cleaned = cleaned.replace(fillers, " ");
    cleaned = cleaned.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    
    if (cleaned) {
      const modelSlug = cleaned.split(/\s+/)[0];
      if (modelSlug && modelSlug.length > 1) {
        return { year, make, model: modelSlug, task };
      }
    }
  }
  
  return year || make || task ? { year, make, model: undefined, task } : null;
}

function generateSymptomReply(message: string): { reply: string; redirect: string | null } | null {
  const lower = message.toLowerCase();
  
  const symptoms: { patterns: RegExp[]; reply: string; redirect: string | null }[] = [
    {
      patterns: [/won'?t start/, /no crank/, /cranks but/, /turn over/, /starter clicks/],
      reply: `**No-Start Diagnosis — What to Check First**\n\n` +
        `1. **Battery & terminals** — Corroded or loose terminals are the #1 cause. Check voltage (should be 12.4–12.6V resting).\n` +
        `2. **Starter motor** — Listen for a click. One click = bad starter/solenoid. Rapid clicking = weak battery.\n` +
        `3. **Fuel delivery** — Can you hear the fuel pump prime when you turn the key to ON?\n` +
        `4. **Spark / ignition** — Remove a plug and check for spark while cranking.\n` +
        `5. **DTC codes** — Even if the CEL isn't on, a no-start may store codes (crankshaft sensor, immobilizer).\n\n` +
        `**Tell me your year, make, and model** and I'll pull the exact OEM diagnostic tree from our service manual database.`,
      redirect: "/diagnose",
    },
    {
      patterns: [/check engine light/, /cel/, /engine light/, /service engine/],
      reply: `**Check Engine Light — Next Steps**\n\n` +
        `• **Solid CEL**: Safe to drive short distances. Scan for codes ASAP — many auto parts stores do this free.\n` +
        `• **Flashing CEL**: Pull over immediately. This indicates a misfire that can damage the catalytic converter.\n` +
        `• **Common quick wins**: Loose gas cap, worn O2 sensor, dirty MAF sensor.\n\n` +
        `If you have a code (like P0420, P0171), paste it here and I'll look it up in our DTC database. ` +
        `Otherwise, **share your year/make/model** and I can route you to the exact diagnostic procedure.`,
      redirect: "/diagnose",
    },
    {
      patterns: [/overheat/, /running hot/, /temperature gauge/, /coolant leak/],
      reply: `**Overheating — Stop Driving & Check These**\n\n` +
        `1. **Coolant level** — Check the reservoir when the engine is COOL. Never open a hot radiator cap.\n` +
        `2. **Radiator fans** — Do they spin when the A/C is on? A failed fan relay or motor is common.\n` +
        `3. **Thermostat** — Stuck closed = no coolant flow. Most thermostats are cheap and easy to replace.\n` +
        `4. **Water pump** — Look for coolant seepage from the weep hole or belt-area leak.\n` +
        `5. **Head gasket** — White smoke, milky oil, or bubbling in the overflow tank are red flags.\n\n` +
        `**Give me your year/make/model** and I'll pull the OEM cooling system specs, torque values, and bleeding procedure.`,
      redirect: "/diagnose",
    },
    {
      patterns: [/brake noise/, /squeal/, /squeak/, /grinding brake/],
      reply: `**Brake Noise Diagnosis**\n\n` +
        `• **High-pitched squeal**: Wear indicator on brake pads — replace soon.\n` +
        `• **Grinding**: Pads are metal-to-metal. Stop driving and replace immediately to avoid rotor damage.\n` +
        `• **Groan / moan**: Glazed pads or rotor runout. Resurface or replace rotors, bed-in new pads properly.\n` +
        `• **Click / clunk**: Loose caliper hardware or worn guide pins.\n\n` +
        `**Share your year/make/model** and I'll show you the exact pad specs, rotor thickness minimums, and torque sequence from the factory manual.`,
      redirect: "/diagnose",
    },
    {
      patterns: [/rough idle/, /shaking idle/, /idle problem/],
      reply: `**Rough Idle — Common Causes**\n\n` +
        `1. **Vacuum leak** — Hissing noise? Check PCV hoses, intake boot, and vacuum lines with brake-cleaner spray.\n` +
        `2. **Dirty throttle body / IAC** — Carbon buildup restricts airflow at idle. Clean with throttle-body cleaner.\n` +
        `3. **Ignition** — Worn spark plugs, bad coil(s), or damaged plug wires cause misfires felt at idle.\n` +
        `4. **Fuel system** — Clogged injector or weak fuel pump = lean condition. Check fuel pressure.\n` +
        `5. **MAF / O2 sensors** — Dirty or lazy sensors throw off the air-fuel ratio.\n\n` +
        `**Tell me your year/make/model** and I'll pull the OEM idle-specs, diagnostic tree, and relevant TSBs.`,
      redirect: "/diagnose",
    },
    {
      patterns: [/transmission slip/, /transmission fluid/, /hard shift/, /transmission jerk/],
      reply: `**Transmission Issues — Quick Checks**\n\n` +
        `• **Fluid level & condition** — Low fluid causes slipping. Burnt smell or dark color = internal wear.\n` +
        `• **Fluid type** — Using the wrong ATF can cause shift quality issues. OEM spec matters.\n` +
        `• **Solenoids / valve body** — Hard shifts or delayed engagement often trace to a stuck solenoid.\n` +
        `• **Mounts** — A broken transmission mount can cause clunks mistaken for internal problems.\n\n` +
        `**Share your year/make/model** and I'll pull the exact fluid capacity, type, and drain/fill procedure from the OEM manual.`,
      redirect: "/diagnose",
    },
    {
      patterns: [/stall/, /dies while driving/, /shuts off/, /cut out/],
      reply: `**Engine Stalling — Diagnostic Priorities**\n\n` +
        `1. **Idle Air Control (IAC) / throttle body** — Carbon buildup causes stalling at stops.\n` +
        `2. **Crankshaft position sensor** — Intermittent signal loss kills the engine without warning.\n` +
        `3. **Fuel pump / relay** — Check pressure; a failing pump may work cold but fail hot.\n` +
        `4. **MAF sensor** — Dirty or failing MAF causes lean stall, especially when coming to a stop.\n` +
        `5. **Torque converter clutch (TCC) stuck on** — Feels like a manual transmission with the clutch engaged at a stop.\n\n` +
        `**Give me your year/make/model** and I'll look up the OEM stall-diagnostic flowchart and common TSBs.`,
      redirect: "/diagnose",
    },
    {
      patterns: [/oil leak/, /leaking oil/, /oil on ground/],
      reply: `**Oil Leak — Common Sources**\n\n` +
        `• **Valve cover gasket** — Most common on 4-cylinders. Oil pools on the exhaust manifold = burning smell.\n` +
        `• **Oil pan gasket / drain plug** — Check torque on the drain plug (often over-tightened by shops).\n` +
        `• **Rear main seal** — Oil between the engine and transmission. Requires separating the engine/trans to fix.\n` +
        `• **Camshaft / crankshaft seals** — Oil behind the timing cover or at the front of the engine.\n` +
        `• **Oil pressure sensor / filter housing** — Cheap parts, often overlooked.\n\n` +
        `**Share your year/make/model** and I'll pull the OEM torque specs, seal part numbers, and R&R procedure.`,
      redirect: "/diagnose",
    },
    {
      patterns: [/ac not working/, /no cold air/, /a\s*\/\s*c/, /air conditioning/],
      reply: `**A/C Not Cooling — Systematic Checks**\n\n` +
        `1. **Refrigerant level** — Low R-134a (or R-1234yf on newer cars) is the #1 cause.\n` +
        `2. **Compressor clutch** — Is it engaging? If not, check the fuse, relay, and clutch coil.\n` +
        `3. **Cabin air filter** — A clogged filter restricts airflow even if the system is cold.\n` +
        `4. **Blend door actuator** — Clicking behind the dash = failed actuator mixing hot/cold air.\n` +
        `5. **Condenser / fans** — Debris on the condenser or a dead cooling fan raises high-side pressure.\n\n` +
        `**Tell me your year/make/model** and I'll show you the OEM refrigerant capacity, pressures, and evacuation procedure.`,
      redirect: "/diagnose",
    },
    {
      patterns: [/battery drain/, /parasitic draw/, /dead battery/, /battery dies/],
      reply: `**Battery Drain / Parasitic Draw**\n\n` +
        `1. **Test the battery** — Fully charged should read 12.6V. Under 12.4V = weak or discharged.\n` +
        `2. **Alternator output** — Running voltage should be 13.5–14.5V. Lower = bad alternator or regulator.\n` +
        `3. **Parasitic draw test** — Disconnect negative terminal, connect multimeter in series. ` +
        `Draw should drop below 50mA after modules go to sleep (can take 30+ min).\n` +
        `4. **Common culprits** — Dome light, trunk light, aftermarket stereo/alarms, stuck relay.\n\n` +
        `**Share your year/make/model** and I'll pull the OEM charging-system specs, fuse diagrams, and test procedures.`,
      redirect: "/diagnose",
    },
  ];
  
  for (const symptom of symptoms) {
    if (symptom.patterns.some(p => p.test(lower))) {
      return { reply: symptom.reply, redirect: symptom.redirect };
    }
  }
  
  return null;
}

async function generateCorpusReply(message: string): Promise<{ reply: string; redirect: string | null } | null> {
  // ── 1. DTC code lookup (highest priority, no vehicle needed) ─────────────
  const dtcMatch = message.match(/\b([A-Z]\d{4})\b/i);
  if (dtcMatch) {
    return {
      reply: `I found DTC **${dtcMatch[1].toUpperCase()}** in our database. Head to the code page for full diagnosis steps, affected components, and related repair guides.`,
      redirect: `/codes/${dtcMatch[1].toUpperCase()}`,
    };
  }
  
  // ── 2. Vehicle + task profile lookup (exact or nearest-match) ────────────
  const extracted = extractVehicleTaskFromMessage(message);
  if (extracted) {
    const { year, make, model, task } = extracted;
    
    if (year && make && model && task) {
      const match = await findNearestRepairProfile(year, make, model, task);
      if (match) {
        const p = match.profile;
        const bullets = p.supportNote?.bullets || [];
        const faq = p.faq;
        
        let reply = "";
        
        if (match.matchType === 'exact') {
          reply = `**${year} ${capitalize(make)} ${capitalize(model)} — ${p.titleSuffix}**\n\n`;
        } else if (match.matchType === 'same-task-different-year') {
          reply = `**${capitalize(make)} ${capitalize(model)} — ${p.titleSuffix}**\n` +
            `*(Closest match: ${match.matchedYear} model — procedures are typically similar within a generation)*\n\n`;
        } else {
          reply = `**${capitalize(make)} ${capitalize(model)} — ${p.titleSuffix}**\n` +
            `*(Closest available guide: ${match.matchedYear} — related procedure)*\n\n`;
        }
        
        if (p.supportNote?.intro) reply += p.supportNote.intro + "\n\n";
        if (bullets.length > 0) {
          reply += bullets.map((b: string) => "• " + b).join("\n") + "\n\n";
        }
        const faqs = p.faqs || (p.faq ? [p.faq] : []);
        if (faqs.length > 0) {
          for (const faqItem of faqs) {
            reply += `**Q: ${faqItem.question}**\n${faqItem.answer}\n\n`;
          }
        }
        reply += "*Data sourced from OEM factory service manuals (CHARM/LEMON corpuses).*";
        
        const redirect = `/repair/${match.matchedYear}/${match.matchedMake}/${match.matchedModel}/${match.matchedTask}`;
        return { reply, redirect };
      }
    }
    
    // Partial match — ask for missing info
    if (year && make && !model) {
      return {
        reply: `I see you're asking about a **${year} ${capitalize(make)}**. What's the model? (e.g., Camry, Civic, F-150) Once I know that, I can pull the exact specs from our OEM manual database.`,
        redirect: null,
      };
    }
    
    if (year && make && model && !task) {
      return {
        reply: `Got it — **${year} ${capitalize(make)} ${capitalize(model)}**. What repair or maintenance task do you need help with?`,
        redirect: `/repair/${year}/${make}/${model}`,
      };
    }
  }
  
  // ── 3. Symptom-based generic replies (no vehicle info needed) ────────────
  const symptomReply = generateSymptomReply(message);
  if (symptomReply) {
    return symptomReply;
  }
  
  return null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Corpus context fetcher: queries manual_embeddings DB for relevant sections ─

const TASK_TERM_MAP: Record<string, string[]> = {
  'battery-replacement': ['battery', 'BATTERY'],
  'spark-plug-replacement': ['spark plug', 'SPARK PLUG', 'ignition'],
  'oil-change': ['oil', 'OIL', 'lubrication', 'capacity'],
  'brake-pad-replacement': ['brake pad', 'BRAKE PAD', 'disc brake'],
  'brake-rotor-replacement': ['brake rotor', 'ROTOR', 'disc'],
  'serpentine-belt-replacement': ['serpentine', 'drive belt', 'belts'],
  'timing-belt-replacement': ['timing belt', 'TIMING BELT'],
  'timing-chain-replacement': ['timing chain', 'TIMING CHAIN'],
  'thermostat-replacement': ['thermostat', 'THERMOSTAT', 'cooling'],
  'water-pump-replacement': ['water pump', 'WATER PUMP', 'cooling'],
  'radiator-replacement': ['radiator', 'RADIATOR', 'cooling'],
  'starter-replacement': ['starter', 'STARTER', 'starting'],
  'alternator-replacement': ['alternator', 'ALTERNATOR', 'charging'],
  'headlight-bulb-replacement': ['headlight', 'HEADLIGHT', 'lamp'],
  'tail-light-replacement': ['tail light', 'TAIL LIGHT'],
  'cabin-air-filter-replacement': ['cabin filter', 'CABIN FILTER', 'air filter'],
  'engine-air-filter-replacement': ['air filter', 'AIR FILTER'],
  'transmission-fluid-change': ['transmission fluid', 'ATF', 'transaxle'],
  'coolant-flush': ['coolant', 'COOLANT', 'antifreeze'],
  'fuel-pump-replacement': ['fuel pump', 'FUEL PUMP'],
  'fuel-filter-replacement': ['fuel filter', 'FUEL FILTER'],
  'fuel-injector-replacement': ['fuel injector', 'INJECTOR'],
  'oxygen-sensor-replacement': ['oxygen sensor', 'O2 SENSOR', 'HO2S'],
  'ignition-coil-replacement': ['ignition coil', 'IGNITION COIL'],
  'mass-air-flow-sensor-replacement': ['MAF', 'mass air flow'],
  'windshield-wiper-replacement': ['wiper', 'WIPER'],
  'cv-axle-replacement': ['CV axle', 'CV JOINT', 'halfshaft'],
  'wheel-bearing-replacement': ['wheel bearing', 'WHEEL BEARING'],
  'shock-absorber-replacement': ['shock', 'SHOCK ABSORBER', 'strut'],
  'strut-replacement': ['strut', 'STRUT'],
  'tie-rod-replacement': ['tie rod', 'TIE ROD'],
  'ball-joint-replacement': ['ball joint', 'BALL JOINT'],
  'catalytic-converter-replacement': ['catalytic', 'CATALYST', 'converter'],
  'muffler-replacement': ['muffler', 'MUFFLER', 'exhaust'],
  'egr-valve-replacement': ['EGR', 'exhaust gas recirculation'],
  'differential-fluid-change': ['differential', 'DIFFERENTIAL'],
  'power-steering-fluid-change': ['power steering', 'STEERING FLUID'],
  'turbo-replacement': ['turbo', 'TURBOCHARGER'],
  'glow-plug-replacement': ['glow plug', 'GLOW PLUG'],
  'clutch-replacement': ['clutch', 'CLUTCH'],
  'valve-cover-gasket-replacement': ['valve cover', 'VALVE COVER', 'gasket'],
  'head-gasket-replacement': ['head gasket', 'HEAD GASKET', 'cylinder head'],
  'crankshaft-sensor-replacement': ['crankshaft', 'CRANKSHAFT', 'CKP'],
  'camshaft-sensor-replacement': ['camshaft', 'CAMSHAFT', 'CMP'],
};

// Broader symptom → search term mapping for when no explicit task is extracted
const SYMPTOM_TERM_MAP: Array<{ patterns: RegExp[]; terms: string[] }> = [
  { patterns: [/overheat/, /running hot/, /temperature gauge/, /coolant leak/], terms: ['coolant', 'radiator', 'thermostat', 'water pump', 'overheat'] },
  { patterns: [/won'?t start/, /no crank/, /cranks but/, /turn over/, /starter clicks/], terms: ['starter', 'battery', 'ignition', 'crank', 'no-start'] },
  { patterns: [/rough idle/, /shaking idle/, /idle problem/], terms: ['idle', 'throttle', 'IAC', 'vacuum', 'misfire'] },
  { patterns: [/brake noise/, /squeal/, /squeak/, /grinding brake/], terms: ['brake pad', 'rotor', 'brake', 'caliper'] },
  { patterns: [/transmission slip/, /hard shift/, /transmission jerk/], terms: ['transmission', 'ATF', 'solenoid', 'valve body'] },
  { patterns: [/stall/, /dies while driving/, /shuts off/, /cut out/], terms: ['stall', 'crankshaft', 'fuel pump', 'MAF', 'IAC'] },
  { patterns: [/oil leak/, /leaking oil/], terms: ['oil leak', 'valve cover', 'gasket', 'seal'] },
  { patterns: [/ac not working/, /no cold air/, /air conditioning/], terms: ['A/C', 'refrigerant', 'compressor', 'condenser'] },
  { patterns: [/battery drain/, /dead battery/], terms: ['battery', 'alternator', 'parasitic', 'charging'] },
  { patterns: [/check engine light/, /cel/, /engine light/], terms: ['diagnostic', 'trouble code', 'OBD', 'DTC'] },
  { patterns: [/misfire/, /running rough/], terms: ['misfire', 'spark plug', 'ignition coil', 'compression'] },
  { patterns: [/leak/, /leaking/], terms: ['leak', 'seal', 'gasket', 'hose'] },
  { patterns: [/noise/, /rattle/, /clunk/, /knock/], terms: ['noise', 'rattle', 'bearing', 'mount'] },
  { patterns: [/smoke/, /burning oil/], terms: ['smoke', 'oil consumption', 'PCV', 'rings'] },
];

function extractSymptomTerms(message: string): string[] {
  const lower = message.toLowerCase();
  const terms = new Set<string>();
  for (const symptom of SYMPTOM_TERM_MAP) {
    if (symptom.patterns.some(p => p.test(lower))) {
      symptom.terms.forEach(t => terms.add(t));
    }
  }
  return Array.from(terms);
}

async function fetchCorpusContext(message: string, isOllama: boolean): Promise<string | undefined> {
  const extracted = extractVehicleTaskFromMessage(message);
  const limit = isOllama ? 3 : 5;
  const maxChars = isOllama ? 600 : 1200;

  // ── Strategy 1: Full vehicle + task extraction ────────────────────────────
  if (extracted?.year && extracted.make) {
    const { year, make, model, task } = extracted;
    const terms: string[] = [];
    if (task && TASK_TERM_MAP[task]) terms.push(...TASK_TERM_MAP[task]);
    if (model) terms.push(model);
    const dtcMatch = message.match(/\b([A-Z]\d{4})\b/i);
    if (dtcMatch) terms.push(dtcMatch[1]);

    // Add symptom terms too for broader coverage
    const symptomTerms = extractSymptomTerms(message);
    symptomTerms.forEach(t => { if (!terms.includes(t)) terms.push(t); });

    if (terms.length > 0) {
      try {
        console.log(`[Manuel] Corpus search: ${make} ${year} ${model || ''} terms=[${terms.join(', ')}]`);
        const sections = await findManualSectionsByTerms({ make, year, model, terms, limit });
        console.log(`[Manuel] Corpus results: ${sections.length} sections found`);
        if (sections.length > 0) {
          return sections.map((s, i) =>
            `[${i + 1}] ${s.sectionTitle}\n${(s.contentPreview || s.contentFull || '').slice(0, maxChars)}`
          ).join('\n\n');
        }
      } catch (e) {
        logWarn('[Manuel] Corpus fetch (strategy 1) failed:', e);
      }
    }
  }

  // ── Strategy 2: Make-only search across all years ─────────────────────────
  if (extracted?.make) {
    const make = extracted.make;
    const terms = extractSymptomTerms(message);
    if (extracted.model) terms.push(extracted.model);
    const dtcMatch = message.match(/\b([A-Z]\d{4})\b/i);
    if (dtcMatch) terms.push(dtcMatch[1]);

    if (terms.length > 0) {
      try {
        // Use broader search across all years for this make
        const allSections = await findVehicleManualSections({ make, year: 2010, limit: 200 });
        const normalizedTerms = terms.map(t => t.toLowerCase());
        const scored = allSections
          .map(s => {
            const haystack = `${s.sectionTitle} ${s.contentPreview} ${s.contentFull || ''}`.toLowerCase();
            const score = normalizedTerms.filter(t => haystack.includes(t)).length;
            return { section: s, score };
          })
          .filter(({ score }) => score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map(({ section }) => section);

        if (scored.length > 0) {
          return scored.map((s, i) =>
            `[${i + 1}] ${s.sectionTitle}\n${(s.contentPreview || s.contentFull || '').slice(0, maxChars)}`
          ).join('\n\n');
        }
      } catch (e) {
        logWarn('[AI Technician] Corpus fetch (strategy 2) failed:', e);
      }
    }
  }

  // ── Strategy 3: DTC-only search (no vehicle needed) ───────────────────────
  const dtcMatch = message.match(/\b([A-Z]\d{4})\b/i);
  if (dtcMatch) {
    try {
      const sections = await findDiagnosticTroubleCodeSections(dtcMatch[1], limit);
      if (sections.length > 0) {
        return sections.map((s, i) =>
          `[${i + 1}] ${s.sectionTitle}\n${(s.contentPreview || s.contentFull || '').slice(0, maxChars)}`
        ).join('\n\n');
      }
    } catch (e) {
      logWarn('[AI Technician] Corpus fetch (strategy 3) failed:', e);
    }
  }

  return undefined;
}

async function extractGraphContext(message: string): Promise<string | undefined> {
  // Extract DTC codes like P0420, B1234, etc.
  const dtcMatch = message.match(/\b([A-Z]\d{4})\b/i);
  if (!dtcMatch) return undefined;

  const code = dtcMatch[1].toUpperCase();
  const data = await getDTCGraphData(code, 5);
  if (!data || !data.component) return undefined;

  const procedures = data.componentProcedures
    .slice(0, 3)
    .map((p) => `- ${p.title}${p.vehicleName ? ` (${p.vehicleName})` : ''}`)
    .join('\n');

  return `The user mentioned DTC ${code}: ${data.description || ''}.\n` +
    `Affected component: ${data.component}.\n` +
    `Related OEM procedures in our database (${data.totalProcedures} total):\n${procedures}`;
}

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 20, 60_000); // 20 chat msgs/min per IP
  if (limited) return limited;

  let messages: { role: string; content: string }[] = [];
  let lastMessage: { role: string; content: string } | null = null;

  try {
    const body = await req.json();
    messages = body.messages || [];

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        reply: "Hey boss — I'm Manuel. I've read the factory manual for just about every car on the road.\n\n**What are we working on today?** Just tell me your year, make, model, and what's going on. Or paste a check-engine light code and I'll walk you through the factory diagnostic flowchart step by step.",
      });
    }

    if (messages.length > 20) {
      return NextResponse.json({
        reply: "Head to AllOEMManuals.com to get started — try the AI Diagnostics for your vehicle!",
      });
    }

    lastMessage = messages[messages.length - 1];
    
    // Build conversation history for Gemini
    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const isOllamaPrimary = preferOllama || (!openAI && !geminiApiKey && !kimi);
    // Ground the AI in graph data if user mentions a DTC
    const graphContext = await extractGraphContext(lastMessage.content);
    // Pull relevant manual sections from the corpus (more aggressive for Ollama)
    const corpusContext = await fetchCorpusContext(lastMessage.content, isOllamaPrimary);
    const systemPrompt = buildSystemPrompt(graphContext, corpusContext, isOllamaPrimary);

    let reply = "";

    // Build OpenAI-compatible message list once (used by OpenAI + Kimi fallbacks)
    const buildOaiMessages = (): ChatCompletionMessageParam[] => [
      { role: "system", content: systemPrompt },
      ...history.map((item: { role: string; parts: { text: string }[] }): ChatCompletionMessageParam => ({
        role: item.role === "model" ? "assistant" : "user",
        content: item.parts.map((part: { text: string }) => part.text).join("\n"),
      })),
      { role: "user", content: lastMessage!.content },
    ];

    let primaryError: Error | null = null;

    try {
      // ─── Primary: Ollama (local LLM) ────────────────────────────────────────
      if (preferOllama) {
        const completion = await ollama.chat.completions.create({
          model: ollamaModel,
          messages: buildOaiMessages(),
          temperature: 0.7,
          max_tokens: 600,
        });
        reply = completion.choices[0]?.message?.content?.trim() || "";
      }
      // ─── Primary: OpenAI (GPT-4o-mini) ──────────────────────────────────────
      else if (preferOpenAI && openAI) {
        const completion = await openAI.chat.completions.create({
          model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
          messages: buildOaiMessages(),
          temperature: 0.7,
          max_tokens: 600,
        });
        reply = completion.choices[0]?.message?.content?.trim() || "";
      }
      // ─── Primary: Gemini ────────────────────────────────────────────────────
      else if (preferGemini && geminiApiKey) {
        const chat = genAI.chats.create({
          model: "gemini-2.0-flash",
          config: {
            systemInstruction: systemPrompt,
            maxOutputTokens: 400,
            temperature: 0.7,
          },
          history,
        });
        const result = await chat.sendMessage({ message: lastMessage.content });
        reply = result.text || "";
      }
      // ─── Primary: Kimi ──────────────────────────────────────────────────────
      else if (preferKimi && kimi) {
        const completion = await kimi.chat.completions.create({
          model: process.env.KIMI_MODEL || "kimi-latest",
          messages: buildOaiMessages(),
          temperature: 0.7,
          max_tokens: 400,
        });
        reply = completion.choices[0]?.message?.content?.trim() || "";
      }
      // ─── Default: OpenAI (if available, no explicit preference) ─────────────
      else if (openAI) {
        const completion = await openAI.chat.completions.create({
          model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
          messages: buildOaiMessages(),
          temperature: 0.7,
          max_tokens: 600,
        });
        reply = completion.choices[0]?.message?.content?.trim() || "";
      }
      // ─── Default: Gemini ────────────────────────────────────────────────────
      else if (geminiApiKey) {
        const chat = genAI.chats.create({
          model: "gemini-2.0-flash",
          config: {
            systemInstruction: systemPrompt,
            maxOutputTokens: 400,
            temperature: 0.7,
          },
          history,
        });
        const result = await chat.sendMessage({ message: lastMessage.content });
        reply = result.text || "";
      }
      // ─── Default: Ollama (local LLM fallback) ───────────────────────────────
      else {
        const completion = await ollama.chat.completions.create({
          model: ollamaModel,
          messages: buildOaiMessages(),
          temperature: 0.7,
          max_tokens: 600,
        });
        reply = completion.choices[0]?.message?.content?.trim() || "";
      }
    } catch (error) {
      primaryError = error instanceof Error ? error : new Error(String(error));
      logWarn("[AI Technician] Primary failed:", primaryError.message);

      // ─── Fallback 1: Ollama (if not primary) ────────────────────────────────
      if (!preferOllama) {
        try {
          const completion = await ollama.chat.completions.create({
            model: ollamaModel,
            messages: buildOaiMessages(),
            temperature: 0.7,
            max_tokens: 600,
          });
          reply = completion.choices[0]?.message?.content?.trim() || "";
        } catch (fallbackError) {
          logWarn("[AI Technician] Ollama fallback failed:", fallbackError);
        }
      }
      // ─── Fallback 2: OpenAI (if not primary) ────────────────────────────────
      if (!reply && openAI && !preferOpenAI) {
        try {
          const completion = await openAI.chat.completions.create({
            model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
            messages: buildOaiMessages(),
            temperature: 0.7,
            max_tokens: 600,
          });
          reply = completion.choices[0]?.message?.content?.trim() || "";
        } catch (fallbackError) {
          logWarn("[AI Technician] OpenAI fallback failed:", fallbackError);
        }
      }
      // ─── Fallback 3: Kimi (if Gemini failed) ────────────────────────────────
      if (!reply && kimi && !preferKimi) {
        try {
          const completion = await kimi.chat.completions.create({
            model: process.env.KIMI_MODEL || "kimi-latest",
            messages: buildOaiMessages(),
            temperature: 0.7,
            max_tokens: 400,
          });
          reply = completion.choices[0]?.message?.content?.trim() || "";
        } catch (fallbackError) {
          logWarn("[AI Technician] Kimi fallback failed:", fallbackError);
        }
      }
      // ─── Fallback 4: Gemini (if OpenAI/Kimi failed) ─────────────────────────
      if (!reply && geminiApiKey && !preferGemini) {
        try {
          const chat = genAI.chats.create({
            model: "gemini-2.0-flash",
            config: {
              systemInstruction: systemPrompt,
              maxOutputTokens: 400,
              temperature: 0.7,
            },
            history,
          });
          const result = await chat.sendMessage({ message: lastMessage.content });
          reply = result.text || "";
        } catch (fallbackError) {
          logWarn("[AI Technician] Gemini fallback failed:", fallbackError);
        }
      }

      if (!reply) {
        throw primaryError;
      }
    }

    // Check for upgrade intent
    const upgradeMatch = reply.match(/\[UPGRADE_INTENT:\s*reason="([^"]+)"\]/);

    // Determine if we should suggest a redirect
    let redirect: string | null = null;
    const lowerReply = reply.toLowerCase();
    const lowerMsg = lastMessage.content.toLowerCase();

    if (
      (lowerMsg.includes("diagnose") || lowerMsg.includes("symptom") || lowerMsg.includes("problem") ||
       lowerMsg.includes("noise") || lowerMsg.includes("light") || lowerMsg.includes("check engine")) &&
      !lowerMsg.includes("guide") && !lowerMsg.includes("pdf")
    ) {
      redirect = "/diagnose";
    } else if (
      (lowerMsg.includes("guide") || lowerMsg.includes("how to") || lowerMsg.includes("repair") ||
       lowerMsg.includes("change") || lowerMsg.includes("replace")) &&
      !lowerMsg.includes("pdf")
    ) {
      redirect = "/guides";
    }

    // Log session for analytics (fire and forget)
    if (upgradeMatch || messages.length === 2) {
      const sessionId = (body as any)?.sessionId || "unknown";
      const sourcePage = (body as any)?.sourcePage || "unknown";
      console.log(`[SpotOn Guide] session=${sessionId} page=${sourcePage} upgrade=${upgradeMatch?.[1] || "none"} msgs=${messages.length}`);
    }

    // Strip the tag from visible reply
    const cleanReply = reply.replace(/\[UPGRADE_INTENT:[^\]]+\]/, "").trim();

    return NextResponse.json({ reply: cleanReply, redirect });
  } catch (err) {
    console.error("SpotOn Guide API error:", err);
    
    // ── FINAL FALLBACK: Corpus-based reply (no LLM required) ────────────────
    if (lastMessage && lastMessage.content) {
      const corpusReply = await generateCorpusReply(lastMessage.content);
      if (corpusReply) {
        return NextResponse.json({
          reply: corpusReply.reply,
          redirect: corpusReply.redirect,
          source: "corpus",
        });
      }
    }
    
    return NextResponse.json(
      {
        reply: "Having a hiccup — try the Diagnose button in the nav or browse our Repair Guides!",
      },
      { status: 500 }
    );
  }
}
