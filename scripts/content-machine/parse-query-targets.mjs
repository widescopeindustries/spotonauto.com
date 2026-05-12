#!/usr/bin/env node
/**
 * Parse all GSC + Bing query CSVs into deduplicated (year,make,model,task) targets.
 * Outputs: scripts/content-machine/query-targets.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── TASK KEYWORD MAPPING ────────────────────────────────────────────────────
const TASK_PATTERNS = [
  // Serpentine belt
  { pattern: /serpentine\s*belt/i, task: "serpentine-belt-replacement", keywords: ["serpentine belt", "drive belt", "belt diagram", "belt routing"] },
  // Timing belt
  { pattern: /timing\s*belt/i, task: "timing-belt-replacement", keywords: ["timing belt", "timing marks"] },
  // Timing chain
  { pattern: /timing\s*chain/i, task: "timing-chain-replacement", keywords: ["timing chain"] },
  // Spark plug
  { pattern: /spark\s*plug/i, task: "spark-plug-replacement", keywords: ["spark plug", "sparkplug", "spark plug gap", "spark plug torque"] },
  // Oil change / oil type / oil capacity
  { pattern: /oil\s*(change|type|capacity|weight|amount|qt|quart)/i, task: "oil-change", keywords: ["oil change", "oil type", "oil capacity", "oil weight", "oil filter"] },
  // Brake pads
  { pattern: /brake\s*pad/i, task: "brake-pad-replacement", keywords: ["brake pad", "brake pads", "disk brake", "disc brake"] },
  // Brake rotor
  { pattern: /brake\s*rotor/i, task: "brake-rotor-replacement", keywords: ["brake rotor", "rotor replacement"] },
  // Brake fluid
  { pattern: /brake\s*fluid/i, task: "brake-fluid-flush", keywords: ["brake fluid"] },
  // Battery
  { pattern: /battery/i, task: "battery-replacement", keywords: ["battery", "battery location", "battery size", "battery replacement", "batteries", "battery group"] },
  // Thermostat
  { pattern: /thermostat/i, task: "thermostat-replacement", keywords: ["thermostat", "thermostat location"] },
  // Water pump
  { pattern: /water\s*pump/i, task: "water-pump-replacement", keywords: ["water pump", "waterpump"] },
  // Radiator
  { pattern: /radiator/i, task: "radiator-replacement", keywords: ["radiator", "radiator replacement", "radiator fluid"] },
  // Starter
  { pattern: /starter/i, task: "starter-replacement", keywords: ["starter", "starter replacement", "starter location", "starter motor"] },
  // Alternator
  { pattern: /alternator/i, task: "alternator-replacement", keywords: ["alternator", "alternator replacement", "alternator diagram"] },
  // Headlight bulb
  { pattern: /headlight/i, task: "headlight-bulb-replacement", keywords: ["headlight", "headlight bulb", "high beam", "low beam", "headlamp"] },
  // Tail light
  { pattern: /tail\s*light|taillight|rear\s*light/i, task: "tail-light-replacement", keywords: ["tail light", "taillight", "rear light"] },
  // Cabin air filter
  { pattern: /cabin\s*air\s*filter|cabin\s*filter/i, task: "cabin-air-filter-replacement", keywords: ["cabin air filter", "cabin filter"] },
  // Engine air filter
  { pattern: /engine\s*air\s*filter|air\s*filter/i, task: "engine-air-filter-replacement", keywords: ["engine air filter", "air filter"] },
  // Transmission fluid
  { pattern: /transmission\s*fluid|transmission\s*oil|atf/i, task: "transmission-fluid-change", keywords: ["transmission fluid", "ATF"] },
  // Coolant / antifreeze
  { pattern: /coolant|antifreeze/i, task: "coolant-flush", keywords: ["coolant", "antifreeze", "radiator fluid"] },
  // Fuel pump
  { pattern: /fuel\s*pump/i, task: "fuel-pump-replacement", keywords: ["fuel pump"] },
  // Fuel filter
  { pattern: /fuel\s*filter/i, task: "fuel-filter-replacement", keywords: ["fuel filter"] },
  // Fuel injector
  { pattern: /fuel\s*injector/i, task: "fuel-injector-replacement", keywords: ["fuel injector"] },
  // Oxygen sensor / O2 sensor
  { pattern: /oxygen\s*sensor|o2\s*sensor/i, task: "oxygen-sensor-replacement", keywords: ["oxygen sensor", "o2 sensor"] },
  // Ignition coil
  { pattern: /ignition\s*coil/i, task: "ignition-coil-replacement", keywords: ["ignition coil", "coil on plug"] },
  // MAF sensor
  { pattern: /mass\s*air\s*flow|maf\s*sensor/i, task: "mass-air-flow-sensor-replacement", keywords: ["mass air flow", "MAF sensor"] },
  // Wiper blade
  { pattern: /wiper|windshield\s*wiper/i, task: "windshield-wiper-replacement", keywords: ["wiper", "windshield wiper"] },
  // CV axle
  { pattern: /cv\s*axle|cv\s*joint/i, task: "cv-axle-replacement", keywords: ["cv axle", "cv joint"] },
  // Wheel bearing
  { pattern: /wheel\s*bearing/i, task: "wheel-bearing-replacement", keywords: ["wheel bearing"] },
  // Shock absorber
  { pattern: /shock\s*absorber|shocks/i, task: "shock-absorber-replacement", keywords: ["shock absorber", "shocks"] },
  // Strut
  { pattern: /strut/i, task: "strut-replacement", keywords: ["strut", "struts"] },
  // Tie rod
  { pattern: /tie\s*rod/i, task: "tie-rod-replacement", keywords: ["tie rod"] },
  // Ball joint
  { pattern: /ball\s*joint/i, task: "ball-joint-replacement", keywords: ["ball joint"] },
  // Catalytic converter
  { pattern: /catalytic\s*converter/i, task: "catalytic-converter-replacement", keywords: ["catalytic converter"] },
  // Muffler
  { pattern: /muffler/i, task: "muffler-replacement", keywords: ["muffler", "exhaust"] },
  // EGR valve
  { pattern: /egr\s*valve/i, task: "egr-valve-replacement", keywords: ["egr valve"] },
  // Differential fluid
  { pattern: /differential\s*fluid/i, task: "differential-fluid-change", keywords: ["differential fluid"] },
  // Power steering fluid
  { pattern: /power\s*steering\s*fluid/i, task: "power-steering-fluid-change", keywords: ["power steering fluid"] },
  // Turbo
  { pattern: /turbo/i, task: "turbo-replacement", keywords: ["turbo", "turbocharger"] },
  // Glow plug
  { pattern: /glow\s*plug/i, task: "glow-plug-replacement", keywords: ["glow plug"] },
  // Drive belt (catch-all after serpentine)
  { pattern: /drive\s*belt/i, task: "drive-belt-replacement", keywords: ["drive belt"] },
  // Clutch
  { pattern: /clutch/i, task: "clutch-replacement", keywords: ["clutch"] },
  // Valve cover gasket
  { pattern: /valve\s*cover\s*gasket/i, task: "valve-cover-gasket-replacement", keywords: ["valve cover gasket"] },
  // Head gasket
  { pattern: /head\s*gasket/i, task: "head-gasket-replacement", keywords: ["head gasket"] },
  // Crankshaft sensor
  { pattern: /crankshaft\s*sensor|crank\s*sensor/i, task: "crankshaft-sensor-replacement", keywords: ["crankshaft sensor", "crank sensor"] },
  // Camshaft sensor
  { pattern: /camshaft\s*sensor|cam\s*sensor/i, task: "camshaft-sensor-replacement", keywords: ["camshaft sensor", "cam sensor"] },
];

// ── KNOWN MAKES ─────────────────────────────────────────────────────────────
const KNOWN_MAKES = [
  "toyota", "honda", "ford", "chevrolet", "chevy", "nissan", "hyundai", "kia",
  "mazda", "mitsubishi", "suzuki", "acura", "infiniti", "lexus", "subaru",
  "bmw", "mercedes", "mercedes-benz", "volkswagen", "vw", "audi", "renault",
  "peugeot", "fiat", "porsche", "volvo", "jaguar", "land rover", "land-rover",
  "mini", "smart", "saab",
  "jeep", "dodge", "chrysler", "gmc", "buick", "cadillac", "lincoln",
  "pontiac", "saturn", "oldsmobile", "mercury", "plymouth", "geo", "eagle",
  "scion", "hummer", "daewoo",
  "tesla", "rivian", "lucid",
];

// Normalize make names
const MAKE_ALIASES = {
  "chevy": "chevrolet",
  "vw": "volkswagen",
  "mercedes-benz": "mercedes",
  "land-rover": "land rover",
};

// ── KNOWN MODELS (subset — we'll fuzzy match) ───────────────────────────────
// We'll extract model from the query by removing year, make, and task keywords

function normalizeMake(make) {
  const lower = make.toLowerCase().trim();
  return MAKE_ALIASES[lower] || lower;
}

function extractYear(query) {
  const m = query.match(/\b(19\d{2}|20\d{2})\b/);
  return m ? parseInt(m[1], 10) : null;
}

function extractMake(query) {
  const lower = query.toLowerCase();
  for (const make of KNOWN_MAKES) {
    // Match whole word or common boundaries
    const regex = new RegExp(`\\b${make.replace(/-/g, "[-\\s]?")}\\b`, "i");
    if (regex.test(lower)) {
      return normalizeMake(make);
    }
  }
  return null;
}

function extractTask(query) {
  const lower = query.toLowerCase();
  for (const tp of TASK_PATTERNS) {
    if (tp.pattern.test(query)) {
      return tp.task;
    }
  }
  return null;
}

function extractModel(query, year, make, task) {
  let cleaned = query.toLowerCase();
  
  // Remove year
  if (year) cleaned = cleaned.replace(new RegExp(`\\b${year}\\b`, "g"), "");
  
  // Remove make (and aliases like chevy for chevrolet)
  if (make) {
    const makeRegex = new RegExp(`\\b${make.replace(/[-\s]/g, "[-\\s]?")}\\b`, "gi");
    cleaned = cleaned.replace(makeRegex, "");
    // Also remove common aliases
    if (make === "chevrolet") cleaned = cleaned.replace(/\bchevy\b/gi, " ");
    if (make === "volkswagen") cleaned = cleaned.replace(/\bvw\b/gi, " ");
  }
  
  // Remove ALL task keywords broadly
  const broadTaskKws = [
    "serpentine", "belt", "timing", "chain", "spark", "plug", "sparkplug", "gap",
    "oil", "change", "type", "capacity", "weight", "amount", "qt", "quart", "filter",
    "brake", "pad", "pads", "rotor", "rotors", "disk", "disc", "fluid", "flush", "bleed",
    "battery", "batteries", "bms", "terminal", "cca", "group",
    "thermostat", "water", "pump", "radiator", "coolant", "antifreeze", "drain", "drain plug", "petcock",
    "starter", "alternator", "headlight", "headlights", "headlamp", "bulb", "bulbs", "high beam", "low beam", "drl",
    "tail", "light", "lights", "taillight", "taillights", "rear light", "rear lights",
    "cabin", "air", "engine", "intake",
    "transmission", "atf", "dipstick",
    "fuel", "injector", "pump", "filter",
    "oxygen", "o2", "sensor",
    "ignition", "coil", "maf", "mass",
    "wiper", "windshield",
    "cv", "axle", "joint",
    "wheel", "bearing",
    "shock", "absorber", "absorbers", "shocks",
    "strut", "struts", "strut assembly",
    "tie", "rod", "ball", "joint",
    "catalytic", "converter", "muffler", "exhaust",
    "egr", "valve",
    "differential",
    "power", "steering",
    "turbo", "turbocharger",
    "glow", "plug",
    "clutch",
    "valve", "valves", "cover", "gasket", "gaskets",
    "head", "gasket",
    "crankshaft", "crank", "camshaft", "cam", "position",
    "clips", "diagram", "installation", "install",
    "location", "size", "torque", "spec", "specs", "diy",
    "guide", "step", "steps", "procedure", "remove", "removal",
    "fix", "repair", "cost", "price", "replacement", "replacing", "replace",
  ];
  
  for (const kw of broadTaskKws) {
    cleaned = cleaned.replace(new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"), " ");
  }
  
  // Remove common filler words
  const fillers = [
    "how", "to", "what", "does", "have", "is", "the", "a", "an",
    "for", "on", "in", "of", "and", "or", "with", "without", "by", "from",
    "can", "will", "would", "should", "could", "may", "might", "do", "did",
    "front", "rear", "left", "right", "driver", "passenger", "side",
    "new", "old", "original", "oem", "aftermarket", "up", "down", "out",
    "when", "where", "why", "who", "which", "that", "this", "these", "those",
    "my", "your", "his", "her", "its", "our", "their",
    "https?://\\S+", "mail\\.aol\\.com", "search", "referrer", "keyword",
    "starred", "accountids", "messages", "apvxbp\\w+", "disassembly", "instructions",
    "many", "qts", "hold", "holds", "take", "takes", "using", "use", "used",
    "need", "needed", "require", "required", "requires",
    "car", "truck", "suv", "van", "wagon", "sedan", "coupe", "hatchback",
  ];
  
  for (const f of fillers) {
    cleaned = cleaned.replace(new RegExp(`\\b${f}\\b`, "gi"), " ");
  }
  
  // Remove engine spec patterns
  cleaned = cleaned.replace(/\b\d+\.\d+\s*(l|liter|litre|v6|v8|v12|i4|inline)\b/gi, " ");
  cleaned = cleaned.replace(/\b(v6|v8|v12|i4|l4|inline[-\s]?\d|5\.7|3\.5|2\.0|1\.6|1\.8|2\.5|3\.0|4\.0|5\.0)\b/gi, " ");
  
  // Remove 4-digit years and small standalone numbers, but keep model numbers like rav4, f150, 328i
  cleaned = cleaned.replace(/\b(?:19\d{2}|20\d{2})\b/g, " ");  // years
  cleaned = cleaned.replace(/\b\d{1,2}\b/g, " ");  // 1-2 digit numbers (likely not model numbers)
  
  // Remove punctuation but keep digits and hyphens (for model names like rav4, f-150, mx-5)
  cleaned = cleaned.replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
  // Collapse multiple hyphens and trim
  cleaned = cleaned.replace(/-+/g, "-").replace(/^-|-$/g, "").trim();
  
  if (!cleaned || cleaned.length < 2) return null;
  
  // Capitalize first letter of each word for display
  const displayModel = cleaned.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return displayModel;
}

// ── LOAD EXISTING PROFILES ──────────────────────────────────────────────────
const existingProfilesPath = path.join(__dirname, "../../src/data/vehicle-repair-profiles.json");
let existingKeys = new Set();
if (fs.existsSync(existingProfilesPath)) {
  const existingRaw = JSON.parse(fs.readFileSync(existingProfilesPath, "utf8"));
  const existing = Array.isArray(existingRaw) ? existingRaw : (existingRaw.profiles || []);
  for (const p of existing) {
    existingKeys.add(`${p.year}:${p.make.toLowerCase()}:${p.model.toLowerCase().replace(/\s+/g, "-")}:${p.task}`);
  }
}
console.log(`Existing profiles: ${existingKeys.size}`);

// ── PARSE ALL QUERY CSVs ────────────────────────────────────────────────────
const reportsDir = path.join(__dirname, "../seo-reports");
const csvFiles = fs.readdirSync(reportsDir).filter(f => f.endsWith(".csv") && (f.startsWith("queries-") || f.startsWith("bing-")));

const allTargets = new Map(); // key -> {year, make, model, task, queries: [], impressions: 0, clicks: 0}

for (const csvFile of csvFiles) {
  const content = fs.readFileSync(path.join(reportsDir, csvFile), "utf8");
  const lines = content.trim().split("\n");
  
  // Parse header
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const queryIdx = headers.indexOf("Query");
  const clicksIdx = headers.indexOf("Clicks");
  const impressionsIdx = headers.indexOf("Impressions");
  
  if (queryIdx === -1) {
    console.warn(`Skipping ${csvFile} — no Query column`);
    continue;
  }
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parse (handle quoted fields)
    const cols = [];
    let col = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cols.push(col.trim());
        col = "";
      } else {
        col += ch;
      }
    }
    cols.push(col.trim());
    
    const rawQuery = cols[queryIdx]?.replace(/^"|"$/g, "").trim();
    if (!rawQuery) continue;
    
    const clicks = parseInt(cols[clicksIdx] || "0", 10) || 0;
    const impressions = parseInt(cols[impressionsIdx] || "0", 10) || 0;
    
    const year = extractYear(rawQuery);
    const make = extractMake(rawQuery);
    const task = extractTask(rawQuery);
    
    if (!year || !make || !task) continue;
    
    const model = extractModel(rawQuery, year, make, task);
    if (!model) continue;
    
    const modelSlug = model.toLowerCase().replace(/\s+/g, "-");
    const key = `${year}:${make}:${modelSlug}:${task}`;
    
    if (allTargets.has(key)) {
      const t = allTargets.get(key);
      t.queries.push(rawQuery);
      t.clicks += clicks;
      t.impressions += impressions;
    } else {
      allTargets.set(key, {
        year,
        make,
        model: modelSlug,
        rawModel: model,
        task,
        queries: [rawQuery],
        clicks,
        impressions,
        sources: [csvFile],
      });
    }
  }
}

// ── FILTER OUT EXISTING ─────────────────────────────────────────────────────
const newTargets = [];
for (const [key, target] of allTargets) {
  if (existingKeys.has(key)) {
    console.log(`SKIP (existing): ${key}`);
    continue;
  }
  newTargets.push(target);
}

// Sort by impressions desc
newTargets.sort((a, b) => b.impressions - a.impressions);

// ── OUTPUT ──────────────────────────────────────────────────────────────────
const outputPath = path.join(__dirname, "query-targets.json");
fs.writeFileSync(outputPath, JSON.stringify(newTargets, null, 2));

console.log(`\n=== RESULTS ===`);
console.log(`Total unique targets from queries: ${allTargets.size}`);
console.log(`Existing profiles: ${existingKeys.size}`);
console.log(`New targets to create: ${newTargets.length}`);
console.log(`Top 20 by impressions:`);
newTargets.slice(0, 20).forEach((t, i) => {
  console.log(`  ${i+1}. ${t.year} ${t.make} ${t.rawModel} — ${t.task} (${t.impressions} impressions, ${t.clicks} clicks)`);
  console.log(`     Queries: ${t.queries.slice(0, 3).join(" | ")}${t.queries.length > 3 ? ` (+${t.queries.length - 3} more)` : ""}`);
});

// Also output a simple list for subagents
const simpleList = newTargets.map(t => ({
  year: t.year,
  make: t.make,
  model: t.rawModel,
  modelSlug: t.model,
  task: t.task,
  impressions: t.impressions,
  clicks: t.clicks,
  sampleQuery: t.queries[0],
}));
fs.writeFileSync(path.join(__dirname, "query-targets-simple.json"), JSON.stringify(simpleList, null, 2));
