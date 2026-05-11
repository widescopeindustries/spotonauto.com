/**
 * Mine LEMON Manuals "Fluids" pages for exact capacities and specs.
 * Generates VehicleRepairSpec entries for fluid-related tasks.
 * 
 * The LEMON "Fluids" page contains a table with:
 *   Fluid Type | Application | Standard | Metric | Fluid Spec | Notes
 *
 * Usage:
 *   node scripts/mine-lemon-fluids.mjs --make Toyota --year 2015 --model "Camry LE"
 *   node scripts/mine-lemon-fluids.mjs --batch vehicles.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LMDB_BASE = process.env.LMDB_BASE || 'http://127.0.0.1:8080';
const OUTPUT_DIR = path.join(__dirname, 'generated-specs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Generic Templates ────────────────────────────────────────────────

const GENERIC_TEMPLATES = {
  'oil-change': {
    difficulty: 'Easy', time: '30-45 minutes',
    tools: ['Socket wrench set', 'Oil filter wrench', 'Drain pan', 'Funnel', 'Jack and jack stands', 'Torque wrench'],
    parts: ['Engine oil', 'Oil filter', 'Drain plug washer/gasket'],
    warnings: ['Allow engine to cool before starting', 'Properly dispose of used oil', 'Do not overtighten drain plug'],
    steps: ['Lift vehicle and secure on jack stands', 'Locate and remove drain plug', 'Drain old oil completely (5-10 minutes)', 'Replace oil filter', 'Reinstall drain plug with new washer', 'Add new oil to specified level', 'Start engine and check for leaks', 'Verify oil level on dipstick'],
  },
  'transmission-fluid-change': {
    difficulty: 'Intermediate', time: '1-2 hours',
    tools: ['Drain pan', 'Funnel', 'Socket set', 'Torque wrench'],
    parts: ['Correct transmission fluid', 'Drain plug washer/gasket'],
    warnings: ['Use ONLY the specified transmission fluid type', 'Measure exactly — overfilling causes damage', 'Check fluid level at correct temperature per manufacturer'],
    steps: ['Warm transmission to operating temperature', 'Remove drain plug and drain into pan', 'Replace drain plug washer and reinstall to torque spec', 'Refill through dipstick tube to specified level', 'Check level with engine running in Park'],
  },
  'coolant-flush': {
    difficulty: 'Intermediate', time: '1-2 hours',
    tools: ['Drain pan', 'Funnel', 'Pliers', 'Gloves', 'Distilled water'],
    parts: ['Correct coolant', 'Distilled water'],
    warnings: ['Never open hot cooling system', 'Coolant is toxic to pets', 'Bleed air from system after refill'],
    steps: ['Allow engine to cool completely', 'Open radiator drain cock and drain coolant', 'Close drain cock and refill with correct coolant mix', 'Run engine with heater on max to circulate', 'Top off coolant and check for leaks', 'Verify level in overflow tank after cooling'],
  },
  'brake-fluid-flush': {
    difficulty: 'Intermediate', time: '1-1.5 hours',
    tools: ['Brake bleeder wrench', 'Clear tubing', 'Drain bottle', 'Funnel', 'Brake cleaner'],
    parts: ['Correct brake fluid', 'Brake cleaner'],
    warnings: ['Brake fluid is corrosive — wear gloves and eye protection', 'Do not let reservoir run dry during bleeding', 'Start bleeding from furthest wheel (RR) and work inward'],
    steps: ['Remove old fluid from master cylinder reservoir', 'Refill with fresh brake fluid', 'Bleed each caliper starting from furthest wheel', 'Keep reservoir topped off during process', 'Verify firm pedal feel before driving'],
  },
};

// ── HTML Table Parser ────────────────────────────────────────────────

function parseFluidTable(html) {
  const fluids = [];
  
  // Extract table rows
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    
    // Extract cells from this row
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      // Strip HTML tags from cell content
      const text = cellMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s{2,}/g, ' ')
        .trim();
      cells.push(text);
    }
    
    // LEMON Fluids table: Fluid Type | Application | (empty) | Standard | Metric | Fluid Spec | Note | S/H
    if (cells.length >= 6 && cells[0] && cells[0] !== 'Fluid Type') {
      fluids.push({
        fluidType: cells[0],
        application: cells[1] || '',
        condition: cells[2] || '',
        standard: cells[3] || '',
        metric: cells[4] || '',
        spec: cells[5] || '',
        note: cells[6] || '',
      });
    }
  }
  
  return fluids;
}

// ── Backend Fetch ────────────────────────────────────────────────────

async function fetchPage(urlPath) {
  const url = `${LMDB_BASE}${urlPath}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'alloemmanuals.com/1.0 repair-spec-miner' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    console.error(`[fetch] ${url}: ${err.message}`);
    return null;
  }
}

// ── Crawl Fluids Page ────────────────────────────────────────────────

async function crawlFluids(make, year, model) {
  const encode = (s) => encodeURIComponent(s).replace(/%2C/g, ',').replace(/%20/g, '%20');
  const fluidsPath = `/${encode(make)}/${year}/${encode(model)}/Repair%20and%20Diagnosis/Quick%20Lookups/Fluids/`;
  
  const html = await fetchPage(fluidsPath);
  if (!html) {
    // Try without "Repair and Diagnosis" prefix for some makes
    const altPath = `/${encode(make)}/${year}/${encode(model)}/Fluids/`;
    const altHtml = await fetchPage(altPath);
    if (!altHtml) return null;
    return parseFluidTable(altHtml);
  }
  
  return parseFluidTable(html);
}

// ── Map Fluids to Tasks ──────────────────────────────────────────────

function mapFluidsToTasks(fluids, make, year, model) {
  const specs = [];
  
  for (const [taskKey, template] of Object.entries(GENERIC_TEMPLATES)) {
    const relevantFluids = [];
    
    for (const f of fluids) {
      const lowerFluid = f.fluidType.toLowerCase();
      const lowerSpec = f.spec.toLowerCase();
      
      if (taskKey === 'oil-change' && lowerFluid.includes('engine oil')) {
        relevantFluids.push(f);
      }
      if (taskKey === 'transmission-fluid-change' && (lowerFluid.includes('transmission') || lowerFluid.includes('transaxle'))) {
        relevantFluids.push(f);
      }
      if (taskKey === 'coolant-flush' && (lowerFluid.includes('coolant') || lowerFluid.includes('antifreeze'))) {
        relevantFluids.push(f);
      }
      if (taskKey === 'brake-fluid-flush' && lowerFluid.includes('brake fluid')) {
        relevantFluids.push(f);
      }
    }
    
    if (relevantFluids.length === 0) continue;
    
    // Build parts from fluid data
    const parts = template.parts.map(p => ({ ...p, spec: '' }));
    
    // Add fluid spec to first part
    if (parts.length > 0 && relevantFluids[0].spec) {
      parts[0].spec = relevantFluids[0].spec;
      parts[0].name = `${relevantFluids[0].fluidType} (${relevantFluids[0].spec})`;
    }
    
    // Build vehicle notes from fluid data
    const vehicleNotes = relevantFluids.map(f => {
      const parts = [];
      if (f.standard) parts.push(`${f.standard}`);
      if (f.metric) parts.push(`${f.metric}`);
      if (f.condition) parts.push(`— ${f.condition}`);
      if (f.note) parts.push(`Note: ${f.note}`);
      return `${f.fluidType}: ${parts.join(' ')}`;
    });
    
    const key = `${make.toLowerCase().replace(/\s+/g, '-')}-${model.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)}-${year}-${taskKey}`;
    
    specs.push({
      key,
      make, year, model,
      task: taskKey,
      title: `${year} ${make} ${model} — ${taskKey.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
      difficulty: template.difficulty,
      time: template.time,
      tools: template.tools,
      parts,
      warnings: template.warnings,
      steps: template.steps,
      vehicleNotes,
      sources: [{ path: fluidsPath, title: `${year} ${make} ${model} Fluids` }],
      _mined: { fluidCount: relevantFluids.length },
    });
  }
  
  return specs;
}

// ── CLI ──────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--make') result.make = args[++i];
    else if (args[i] === '--year') result.year = parseInt(args[++i]);
    else if (args[i] === '--model') result.model = args[++i];
    else if (args[i] === '--batch') result.batchPath = args[++i];
    else if (args[i] === '--output') result.output = args[++i];
  }
  result.output = result.output || path.join(OUTPUT_DIR, 'lemon-fluid-specs.json');
  return result;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║       LEMON Fluids Miner — Capacity & Spec Extractor        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const { make, year, model, batchPath, output } = parseArgs();

  let vehicles = [];
  if (batchPath && fs.existsSync(batchPath)) {
    vehicles = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
    console.log(`Loaded ${vehicles.length} vehicles from ${batchPath}`);
  } else if (make && year && model) {
    vehicles = [{ make, year, model }];
    console.log(`Single mode: ${year} ${make} ${model}`);
  } else {
    // Default: high-value vehicles from GSC data + some 2014+ LEMON vehicles
    vehicles = [
      { make: 'Toyota', year: 2015, model: 'Camry LE' },
      { make: 'Toyota', year: 2015, model: 'Corolla LE' },
      { make: 'Honda', year: 2015, model: 'Civic LX' },
      { make: 'Honda', year: 2015, model: 'Accord LX' },
      { make: 'Ford', year: 2015, model: 'F-150' },
      { make: 'Chevrolet', year: 2015, model: 'Silverado 1500' },
      { make: 'Hyundai', year: 2015, model: 'Sonata SE' },
      { make: 'Nissan', year: 2015, model: 'Altima 2.5' },
    ];
    console.log(`Default mode: ${vehicles.length} LEMON vehicles`);
  }

  const allSpecs = [];
  let found = 0, missed = 0;

  for (const v of vehicles) {
    process.stdout.write(`  ${v.year} ${v.make} ${v.model}... `);
    const fluids = await crawlFluids(v.make, v.year, v.model);
    if (fluids && fluids.length > 0) {
      const specs = mapFluidsToTasks(fluids, v.make, v.year, v.model);
      allSpecs.push(...specs);
      found++;
      console.log(`${fluids.length} fluids, ${specs.length} tasks`);
    } else {
      missed++;
      console.log('no fluids page');
    }
  }

  fs.writeFileSync(output, JSON.stringify(allSpecs, null, 2));
  console.log(`\n✓ Saved ${allSpecs.length} specs from ${found} vehicles to ${output}`);
  console.log(`  ${missed} vehicles had no fluids page`);

  if (allSpecs.length > 0) {
    console.log('\n─── Sample output ───');
    const sample = allSpecs[0];
    console.log(`Key:    ${sample.key}`);
    console.log(`Title:  ${sample.title}`);
    console.log(`Parts:  ${sample.parts.map(p => p.name + (p.spec ? ` (${p.spec})` : '')).join(', ')}`);
    console.log(`Notes:  ${sample.vehicleNotes.slice(0, 2).join(' | ')}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
