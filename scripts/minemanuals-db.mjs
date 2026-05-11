/**
 * Mine manual_embeddings DB for repair specs and generate VehicleRepairSpec entries.
 * 
 * Strategy: CHARM data is TSB-heavy, but TSBs contain real torque specs, capacities,
 * fluid types, and part numbers. We extract those specs and merge with generic repair
 * templates to produce high-quality VehicleRepairSpec entries.
 *
 * Usage:
 *   node scripts/minemanuals-db.mjs --make BMW --year 2008 --task oil-change
 *   node scripts/minemanuals-db.mjs --batch scripts/seo-reports/top-vehicles.json
 *   node scripts/minemanuals-db.mjs --scan-makes
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ───────────────────────────────────────────────────────────

const DB_URL = process.env.DATABASE_URL
  || process.env.LOCAL_DATABASE_URL
  || 'postgresql://spotonauto:pnjkD6ip8hRXsLEj9A087u71@127.0.0.1:5432/spotonauto';

const OUTPUT_DIR = path.join(__dirname, 'generated-specs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Generic Repair Templates (from REPAIR_DATA) ──────────────────────

const GENERIC_TEMPLATES = {
  'oil-change': {
    difficulty: 'Easy', time: '30-45 minutes',
    tools: ['Socket wrench set', 'Oil filter wrench', 'Drain pan', 'Funnel', 'Jack and jack stands', 'Torque wrench'],
    parts: ['Engine oil', 'Oil filter', 'Drain plug washer/gasket'],
    warnings: ['Allow engine to cool before starting', 'Properly dispose of used oil at recycling center', 'Do not overtighten drain plug'],
    steps: ['Lift vehicle and secure on jack stands', 'Locate and remove drain plug', 'Drain old oil completely', 'Replace oil filter', 'Reinstall drain plug with new washer', 'Add new oil to specified level', 'Start engine and check for leaks', 'Verify oil level on dipstick'],
  },
  'spark-plug-replacement': {
    difficulty: 'Easy to Intermediate', time: '30 minutes - 2 hours',
    tools: ['Spark plug socket', 'Torque wrench', 'Gap gauge', 'Dielectric grease', 'Extension bars'],
    parts: ['Spark plugs (vehicle specific)', 'Anti-seize compound'],
    warnings: ['Work on cool engine only', 'Do not overtighten plugs', 'Check and set gap if required'],
    steps: ['Remove engine cover if equipped', 'Disconnect ignition coil', 'Remove old spark plug', 'Check gap on new plug', 'Install new plug to torque spec', 'Reinstall coil and repeat for all cylinders'],
  },
  'battery-replacement': {
    difficulty: 'Easy', time: '15-30 minutes',
    tools: ['Wrench set', 'Wire brush', 'Battery terminal cleaner', 'Memory saver (optional)'],
    parts: ['Battery (correct group size)', 'Terminal protector spray'],
    warnings: ['Remove negative terminal first', 'Install positive terminal first', 'Properly dispose of old battery'],
    steps: ['Turn off all electronics', 'Remove negative then positive terminals', 'Remove battery hold-down', 'Remove old battery', 'Clean terminals', 'Install new battery in reverse order'],
  },
  'serpentine-belt-replacement': {
    difficulty: 'Easy', time: '15-30 minutes',
    tools: ['Serpentine belt tool or breaker bar', 'Flashlight'],
    parts: ['Serpentine belt', 'Belt tensioner (inspect/replace if worn)'],
    warnings: ['Note routing before removal', 'Check tensioner for wear', 'Inspect all pulleys for damage'],
    steps: ['Locate belt routing diagram', 'Release tensioner', 'Remove old belt', 'Route new belt correctly', 'Release tensioner and verify alignment', 'Start engine and verify belt tracks properly'],
  },
  'brake-pad-replacement': {
    difficulty: 'Intermediate', time: '1-2 hours',
    tools: ['Socket wrench set', 'C-clamp or brake piston tool', 'Wire brush', 'Brake cleaner', 'Torque wrench'],
    parts: ['Brake pads (front or rear)', 'Brake hardware kit', 'Brake grease', 'Brake cleaner'],
    warnings: ['Never compress brake pedal with caliper removed', 'Check brake fluid level after compressing piston', 'Bed in new pads properly per manufacturer instructions'],
    steps: ['Remove wheel', 'Remove caliper bolts and suspend caliper', 'Remove old pads', 'Compress caliper piston', 'Install new pads with hardware', 'Reinstall caliper and torque to spec', 'Pump brake pedal before driving'],
  },
  'transmission-fluid-change': {
    difficulty: 'Intermediate', time: '1-2 hours',
    tools: ['Drain pan', 'Funnel', 'Socket set', 'Torque wrench'],
    parts: ['Correct transmission fluid', 'Drain plug washer/gasket', 'Transmission filter (if applicable)'],
    warnings: ['Use ONLY the specified transmission fluid type', 'Measure exactly — overfilling causes damage', 'Check fluid level at correct temperature per manufacturer'],
    steps: ['Warm transmission to operating temperature', 'Remove drain plug and drain into pan', 'Replace drain plug washer and reinstall', 'Refill through dipstick tube to specified level', 'Check level with engine running in Park'],
  },
  'thermostat-replacement': {
    difficulty: 'Easy to Intermediate', time: '1-2 hours',
    tools: ['Drain pan', 'Socket set', 'Scraper', 'Torque wrench'],
    parts: ['Thermostat', 'Thermostat gasket/O-ring', 'Coolant'],
    warnings: ['Work on cool engine', 'Note thermostat orientation before removal', 'Bleed cooling system after refill'],
    steps: ['Drain some coolant into pan', 'Locate thermostat housing', 'Remove housing bolts', 'Remove old thermostat and gasket', 'Clean mating surfaces', 'Install new thermostat with gasket', 'Torque housing bolts to spec', 'Refill coolant and bleed air'],
  },
  'water-pump-replacement': {
    difficulty: 'Intermediate to Advanced', time: '2-4 hours',
    tools: ['Drain pan', 'Socket set', 'Pulley puller (if needed)', 'Torque wrench', 'RTV sealant (if needed)'],
    parts: ['Water pump', 'Water pump gasket', 'Coolant', 'Serpentine belt (inspect/replace if worn)'],
    warnings: ['Drain system completely before starting', 'Check for bearing play before removing old pump', 'Use proper sealant or gasket as specified'],
    steps: ['Drain cooling system', 'Remove serpentine belt', 'Remove pump pulley', 'Remove pump mounting bolts', 'Clean mounting surface thoroughly', 'Install new pump with gasket/sealant', 'Torque bolts to spec in sequence', 'Reinstall belt and refill coolant'],
  },
  'headlight-bulb-replacement': {
    difficulty: 'Easy', time: '10-30 minutes',
    tools: ['Gloves', 'Screwdriver (possibly)'],
    parts: ['Headlight bulb (correct fitment)', 'Gloves'],
    warnings: ['Do not touch bulb glass with bare hands', 'Test before reassembly', 'Some vehicles require bumper or assembly removal'],
    steps: ['Access bulb from engine bay or wheel well', 'Disconnect electrical connector', 'Remove retaining clip or ring', 'Remove old bulb', 'Install new bulb without touching glass', 'Reconnect and test before reassembly'],
  },
  'cabin-air-filter-replacement': {
    difficulty: 'Easy', time: '10-20 minutes',
    tools: ['Screwdriver (possibly)', 'Flashlight'],
    parts: ['Cabin air filter'],
    warnings: ['Note filter direction arrow', 'Clean housing before installing new filter'],
    steps: ['Locate cabin filter (usually behind glove box)', 'Remove access panel', 'Slide out old filter', 'Install new filter with arrow pointing correct direction', 'Reinstall panel'],
  },
  'engine-air-filter-replacement': {
    difficulty: 'Easy', time: '5-10 minutes',
    tools: ['Screwdriver (possibly)'],
    parts: ['Engine air filter'],
    warnings: ['Do not over-oil if using reusable filter', 'Ensure housing seals properly'],
    steps: ['Locate air filter box', 'Release clips or screws', 'Remove old filter', 'Clean housing if dirty', 'Install new filter', 'Secure housing'],
  },
  'starter-replacement': {
    difficulty: 'Intermediate', time: '1-2 hours',
    tools: ['Socket wrench set', 'Extensions', 'Floor jack', 'Wire brush'],
    parts: ['Starter motor', 'Starter bolts (if corroded)'],
    warnings: ['Disconnect battery first', 'Starter may be heavy — support before removing bolts', 'Clean mounting surface for good ground'],
    steps: ['Disconnect battery negative terminal', 'Locate starter (usually near transmission bell housing)', 'Remove electrical connections', 'Remove mounting bolts', 'Install new starter', 'Reconnect wiring and battery'],
  },
  'alternator-replacement': {
    difficulty: 'Intermediate', time: '1-2 hours',
    tools: ['Socket wrench set', 'Serpentine belt tool', 'Multimeter', 'Memory saver (optional)'],
    parts: ['Alternator', 'Serpentine belt (inspect/replace if worn)'],
    warnings: ['Disconnect battery before starting', 'Note belt routing before removal', 'Test new alternator output before closing up'],
    steps: ['Disconnect battery negative terminal', 'Remove serpentine belt', 'Disconnect electrical connectors', 'Remove mounting bolts', 'Install new alternator', 'Reinstall belt and connectors'],
  },
  'radiator-replacement': {
    difficulty: 'Intermediate', time: '2-3 hours',
    tools: ['Drain pan', 'Pliers', 'Socket set', 'Funnel', 'Torque wrench'],
    parts: ['Radiator', 'Coolant', 'Radiator hoses (inspect)', 'Thermostat (recommended)'],
    warnings: ['Never open hot cooling system', 'Coolant is toxic to pets', 'Bleed air from system after refill'],
    steps: ['Drain coolant into pan', 'Disconnect hoses and transmission cooler lines', 'Remove mounting hardware', 'Remove old radiator', 'Install new radiator', 'Reconnect hoses and refill system'],
  },
};

// ── Task → Search Terms ──────────────────────────────────────────────

const TASK_SEARCH_CONFIG = {
  'oil-change': {
    titleTerms: ['oil service', 'oil change', 'engine oil', 'lubrication', 'oil filter', 'oil capacity', 'oil specification', 'oil draining'],
    contentTerms: ['quart', 'liter', 'capacity', 'viscosity', '5w-', '0w-', '10w-', 'drain plug', 'oil filter', 'torque'],
  },
  'spark-plug-replacement': {
    titleTerms: ['spark plug', 'ignition coil', 'coil on plug'],
    contentTerms: ['spark plug', 'gap', 'torque', 'iridium', 'platinum', 'ngk', 'bosch', 'ignition'],
  },
  'battery-replacement': {
    titleTerms: ['battery', 'charging system'],
    contentTerms: ['group size', 'cca', 'ah', 'amp hour', 'terminal', 'hold-down', 'battery registration'],
  },
  'serpentine-belt-replacement': {
    titleTerms: ['drive belt', 'serpentine belt', 'accessory belt', 'belt tensioner'],
    contentTerms: ['belt', 'tensioner', 'routing', 'rib', 'pulley', 'gates'],
  },
  'brake-pad-replacement': {
    titleTerms: ['brake pad', 'disc brake', 'caliper'],
    contentTerms: ['brake pad', 'caliper', 'rotor', 'hardware', 'piston', 'torque'],
  },
  'transmission-fluid-change': {
    titleTerms: ['transmission fluid', 'atf', 'transaxle fluid', 'gear oil', 'transmission service'],
    contentTerms: ['transmission fluid', 'atf', 'capacity', 'dipstick', 'drain', 'refill', 'dexron', 'mercon'],
  },
  'thermostat-replacement': {
    titleTerms: ['thermostat', 'cooling system'],
    contentTerms: ['thermostat', 'housing', 'gasket', 'o-ring', 'torque', 'temperature'],
  },
  'water-pump-replacement': {
    titleTerms: ['water pump', 'cooling system'],
    contentTerms: ['water pump', 'gasket', 'coolant', 'pulley', 'torque'],
  },
  'headlight-bulb-replacement': {
    titleTerms: ['headlight', 'headlamp', 'bulb'],
    contentTerms: ['h7', 'h11', '9005', '9006', 'halogen', 'hid', 'led', 'bulb'],
  },
  'cabin-air-filter-replacement': {
    titleTerms: ['cabin air filter', 'cabin filter', 'hvac filter'],
    contentTerms: ['cabin filter', 'air filter', 'glove box'],
  },
  'engine-air-filter-replacement': {
    titleTerms: ['engine air filter', 'air cleaner', 'air filter'],
    contentTerms: ['air filter', 'airbox', 'intake'],
  },
  'starter-replacement': {
    titleTerms: ['starter', 'starting system'],
    contentTerms: ['starter', 'torque', 'mounting bolt', 'solenoid'],
  },
  'alternator-replacement': {
    titleTerms: ['alternator', 'charging system'],
    contentTerms: ['alternator', 'torque', 'mounting bolt', 'voltage'],
  },
  'radiator-replacement': {
    titleTerms: ['radiator', 'cooling system'],
    contentTerms: ['radiator', 'coolant', 'hose', 'torque'],
  },
};

// ── Extraction Regexes ───────────────────────────────────────────────

const EXTRACTION_PATTERNS = {
  torqueSpec: /(?:torque|tighten)\s+(?:to\s+)?(\d+(?:\.\d+)?)\s*(?:ft[- ]?lb|ft[- ]?lbs|ft\.?\s*lb|foot[- ]?pound|Nm|in[- ]?lb)/gi,
  capacity: /(\d+(?:\.\d+)?)\s*(?:quart|qt|quarts|liter|liters|L|gal|gallon|gallons)\b/gi,
  fluidType: /\b(0W-16|0W-20|0W-30|5W-20|5W-30|5W-40|10W-30|10W-40|15W-40|ATF|DEXRON\s*(?:III|IV|VI|HP)?|MERCON\s*(?:LV|V)?|Honda\s+(?:Type\s*2|ATF-Z1)|BMW\s+LL-0[14]|Toyota\s+ATF\s+WS|Mazda\s+ATF\s+FZ|VW\s+5[0-9]{3}\s+\d{2}\.\d{2})\b/gi,
  partNumber: /\b(?:OEM|Part\s*(?:#|No|Number)?[:\s]+)?([A-Z0-9]{5,}(?:[-][A-Z0-9]{2,})?)\b/gi,
  groupSize: /\b(?:Group\s+)?([A-Z0-9]{1,3})\s*(?:battery|group size)\b/gi,
  cca: /(\d{3,4})\s*(?:CCA|cold cranking amp)/gi,
  bulbType: /\b(H7|H11|9005|9006|H1|H3|H4|H8|H9|H13|HB3|HB4|D1S|D2S|D3S|D4S)\b/gi,
  warning: /\b(WARNING|CAUTION|NOTE|IMPORTANT|CRITICAL|DANGER)\b[:\s]+([^\n]{10,500})/gi,
  stepPattern: /^\s*(?:Step\s+)?(\d+)[.:\)]\s+(.{10,300})$/gim,
  procedureLine: /^\s*(?:[-•*]|\d+[.\)])\s+(.{10,300})$/gm,
};

// ── Content Cleaning ─────────────────────────────────────────────────

function cleanContent(raw) {
  if (!raw) return '';
  return raw
    .replace(/LEMON Manuals:? Repair Knowledge Reimagined/gi, '')
    .replace(/~\s*LEMON Manuals/gi, '')
    .replace(/ scientia non olet · About LEMON Manuals/gi, '')
    .replace(/Home\s*>>\s*[\w\s().,%-]+(?:\s*>>\s*[\w\s().,%-]+)*/gi, '')
    .replace(/You are viewing the "split tree" of links[\s\S]*?Collapse All/gi, '')
    .replace(/Expand All \(for easy ctrl-f\)/gi, '')
    .replace(/Collapse All/gi, '')
    .replace(/\[IMAGE:\s*[^\]]+\]/gi, '')
    .replace(/Courtesy of [A-Z\s,]+/gi, '')
    .replace(/Publication date:.*?Reference number:.*/gi, '')
    .replace(/TECHNICAL SERVICE BULLETIN.*?APPLICABLE MODELS[\s\S]*?(?=CONDITION|SERVICE|TECHNICAL BACKGROUND)/gi, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Extract Specs from Content ───────────────────────────────────────

function extractSpecs(content, task) {
  const clean = cleanContent(content);
  const lower = clean.toLowerCase();
  const specs = {
    torqueSpecs: new Set(),
    capacities: new Set(),
    fluidTypes: new Set(),
    partNumbers: new Set(),
    groupSize: null,
    cca: null,
    bulbType: null,
    warnings: new Set(),
    vehicleNotes: new Set(),
  };

  // Torque specs
  let m;
  while ((m = EXTRACTION_PATTERNS.torqueSpec.exec(clean)) !== null) {
    specs.torqueSpecs.add(m[0].trim());
  }

  // Capacities
  while ((m = EXTRACTION_PATTERNS.capacity.exec(clean)) !== null) {
    specs.capacities.add(m[0].trim());
  }

  // Fluid types
  while ((m = EXTRACTION_PATTERNS.fluidType.exec(clean)) !== null) {
    specs.fluidTypes.add(m[0].trim());
  }

  // Part numbers (filter out short ones and common words)
  while ((m = EXTRACTION_PATTERNS.partNumber.exec(clean)) !== null) {
    const pn = m[1].trim();
    if (pn.length >= 6 && !/^(GROUP|MODEL|YEAR|ENGINE|FIG|NOTE)$/i.test(pn)) {
      specs.partNumbers.add(pn);
    }
  }

  // Battery group size
  const groupMatch = EXTRACTION_PATTERNS.groupSize.exec(clean);
  if (groupMatch) specs.groupSize = groupMatch[1];

  // CCA
  const ccaMatch = EXTRACTION_PATTERNS.cca.exec(clean);
  if (ccaMatch) specs.cca = ccaMatch[1];

  // Bulb type
  const bulbMatch = EXTRACTION_PATTERNS.bulbType.exec(clean);
  if (bulbMatch) specs.bulbType = bulbMatch[1];

  // Warnings
  while ((m = EXTRACTION_PATTERNS.warning.exec(clean)) !== null) {
    const warning = `${m[1]}: ${m[2].trim()}`;
    if (warning.length < 300) specs.warnings.add(warning);
  }

  // Vehicle-specific notes from TSB content
  if (lower.includes('applicable')) {
    const applicableMatch = clean.match(/APPLICABLE MODELS[\s\S]{0,500}?$/im);
    if (applicableMatch) {
      specs.vehicleNotes.add('Check TSB for applicable models and VIN ranges');
    }
  }

  return specs;
}

// ── Build VehicleRepairSpec ──────────────────────────────────────────

function buildSpec(make, year, model, task, minedSpecs, sections) {
  const template = GENERIC_TEMPLATES[task] || GENERIC_TEMPLATES['oil-change'];
  const key = `${make.toLowerCase().replace(/\s+/g, '-')}-${model.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)}-${year}-${task}`;

  // Merge generic parts with mined specs
  const parts = template.parts.map(name => {
    const part = { name, spec: '' };
    if (task === 'oil-change' && name === 'Engine oil' && minedSpecs.fluidTypes.size > 0) {
      part.spec = Array.from(minedSpecs.fluidTypes).join(', ');
    }
    if (task === 'battery-replacement' && name === 'Battery (correct group size)') {
      const specs = [];
      if (minedSpecs.groupSize) specs.push(`Group ${minedSpecs.groupSize}`);
      if (minedSpecs.cca) specs.push(`${minedSpecs.cca} CCA`);
      if (specs.length > 0) part.spec = specs.join(', ');
    }
    if (task === 'headlight-bulb-replacement' && name === 'Headlight bulb (correct fitment)' && minedSpecs.bulbType) {
      part.spec = `${minedSpecs.bulbType} — verify trim level`;
    }
    return part;
  });

  // Add OEM part numbers if found
  if (minedSpecs.partNumbers.size > 0) {
    const oemParts = Array.from(minedSpecs.partNumbers).slice(0, 3);
    oemParts.forEach(pn => {
      parts.push({ name: 'OEM Part', oem: pn, spec: 'Verify fitment' });
    });
  }

  // Build vehicle notes
  const vehicleNotes = [];
  if (minedSpecs.torqueSpecs.size > 0) {
    vehicleNotes.push(`Torque specs from factory TSB: ${Array.from(minedSpecs.torqueSpecs).slice(0, 3).join(' | ')}`);
  }
  if (minedSpecs.capacities.size > 0) {
    vehicleNotes.push(`Capacities: ${Array.from(minedSpecs.capacities).slice(0, 3).join(', ')}`);
  }
  if (minedSpecs.fluidTypes.size > 0) {
    vehicleNotes.push(`Specified fluid: ${Array.from(minedSpecs.fluidTypes).join(', ')}`);
  }
  if (vehicleNotes.length === 0) {
    vehicleNotes.push(`Refer to factory service manual for exact ${task.replace(/-/g, ' ')} specifications`);
  }

  // Merge warnings
  const warnings = [...template.warnings];
  minedSpecs.warnings.forEach(w => {
    if (!warnings.some(existing => existing.toLowerCase().includes(w.toLowerCase().substring(0, 20)))) {
      warnings.push(w);
    }
  });

  return {
    key,
    make,
    year,
    model,
    task,
    title: `${year} ${make} ${model} — ${task.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
    difficulty: template.difficulty,
    time: template.time,
    tools: template.tools,
    parts,
    warnings: warnings.slice(0, 8),
    steps: template.steps,
    torqueSpecs: minedSpecs.torqueSpecs.size > 0 ? Array.from(minedSpecs.torqueSpecs).slice(0, 3).join(' | ') : undefined,
    vehicleNotes,
    sources: sections.map(s => ({ path: s.path, title: s.sectionTitle })),
    _mined: {
      capacityCount: minedSpecs.capacities.size,
      torqueCount: minedSpecs.torqueSpecs.size,
      fluidCount: minedSpecs.fluidTypes.size,
      partNumberCount: minedSpecs.partNumbers.size,
      warningCount: minedSpecs.warnings.size,
    },
  };
}

// ── DB Client ────────────────────────────────────────────────────────

function getPool() {
  return new Pool({
    connectionString: DB_URL,
    max: 5,
    connectionTimeoutMillis: 10000,
    query_timeout: 30000,
  });
}

// ── Search for Relevant Sections ─────────────────────────────────────

async function findRelevantSections(pool, make, year, model, task) {
  const config = TASK_SEARCH_CONFIG[task];
  if (!config) return [];

  const allTerms = [...config.titleTerms, ...config.contentTerms];
  const titleConditions = config.titleTerms.map((t, i) => `LOWER(section_title) LIKE $${i + 3}`).join(' OR ');
  const contentConditions = config.contentTerms.map((t, i) => `LOWER(content_full) LIKE $${i + 3 + config.titleTerms.length}`).join(' OR ');

  const query = `
    SELECT path, make, year, model, section_title, content_full, content_preview
    FROM manual_embeddings
    WHERE LOWER(make) = LOWER($1)
      AND year = $2
      AND (
        (${titleConditions})
        OR (${contentConditions})
      )
    ORDER BY 
      CASE WHEN ${titleConditions} THEN 1 ELSE 2 END,
      LENGTH(content_full) DESC
    LIMIT 15
  `;

  const params = [make, year, ...allTerms.map(t => `%${t}%`)];

  try {
    const { rows } = await pool.query(query, params);
    return rows || [];
  } catch (err) {
    console.error(`[ERROR] query failed for ${make} ${year} ${task}:`, err.message);
    return [];
  }
}

// ── Mine Single Vehicle-Task ─────────────────────────────────────────

async function mineVehicleTask(pool, make, year, model, task) {
  const sections = await findRelevantSections(pool, make, year, model, task);
  if (sections.length === 0) return null;

  // Combine all matching content
  const combinedContent = sections.map(r =>
    `## ${r.section_title}\n\n${r.content_full || r.content_preview || ''}`
  ).join('\n\n');

  const minedSpecs = extractSpecs(combinedContent, task);

  // Skip if we didn't find any real specs
  const specScore = minedSpecs.torqueSpecs.size + minedSpecs.capacities.size + minedSpecs.fluidTypes.size + minedSpecs.partNumbers.size;
  if (specScore === 0 && minedSpecs.warnings.size === 0) {
    return null; // No valuable specs found
  }

  return buildSpec(make, year, model, task, minedSpecs, sections);
}

// ── Batch Mining ─────────────────────────────────────────────────────

async function mineBatch(pool, combinations) {
  const results = [];
  let done = 0;

  for (const { make, year, model, task } of combinations) {
    const spec = await mineVehicleTask(pool, make, year, model, task);
    if (spec) results.push(spec);
    done++;
    if (done % 10 === 0) {
      process.stdout.write(`\r  Progress: ${done}/${combinations.length} (${results.length} found)`);
    }
  }
  console.log(`\r  Progress: ${done}/${combinations.length} (${results.length} found)`);
  return results;
}

// ── Scan Makes for Available Models ──────────────────────────────────

async function scanMakes(pool) {
  console.log('\nScanning available make/year/model combinations...\n');
  const { rows } = await pool.query(`
    SELECT make, year, COUNT(DISTINCT model) as model_count, COUNT(*) as section_count
    FROM manual_embeddings
    GROUP BY make, year
    ORDER BY section_count DESC
    LIMIT 50
  `);

  console.log('Top make/year combinations by section count:');
  console.log('─'.repeat(70));
  for (const row of rows) {
    console.log(`${row.make.padEnd(20)} ${String(row.year).padEnd(6)} ${String(row.model_count).padStart(4)} models  ${String(row.section_count).padStart(6)} sections`);
  }
  return rows;
}

// ── CLI ──────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--make') result.make = args[++i];
    else if (args[i] === '--year') result.year = parseInt(args[++i]);
    else if (args[i] === '--model') result.model = args[++i];
    else if (args[i] === '--task') result.task = args[++i];
    else if (args[i] === '--batch') result.batchPath = args[++i];
    else if (args[i] === '--output') result.output = args[++i];
    else if (args[i] === '--scan-makes') result.scanMakes = true;
  }
  result.output = result.output || path.join(OUTPUT_DIR, 'mined-specs.json');
  return result;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     Manual Corpus Spec Miner — CHARM + LEMON Pipeline       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const { make, year, model, task, batchPath, output, scanMakes: doScan } = parseArgs();
  const pool = getPool();

  if (doScan) {
    await scanMakes(pool);
    await pool.end();
    return;
  }

  let combinations = [];

  if (batchPath && fs.existsSync(batchPath)) {
    const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
    combinations = batch.combinations || batch;
    console.log(`Loaded ${combinations.length} combinations from ${batchPath}`);
  } else if (make && year && task) {
    const modelValue = model || make;
    combinations = [{ make, year, model: modelValue, task }];
    console.log(`Single mode: ${make} ${year} ${modelValue} ${task}`);
  } else {
    // Default: high-data European combos where CHARM is richest
    combinations = [
      { make: 'BMW', year: 2008, model: 'X3', task: 'oil-change' },
      { make: 'BMW', year: 2008, model: 'X3', task: 'spark-plug-replacement' },
      { make: 'Audi', year: 2008, model: 'A4', task: 'oil-change' },
      { make: 'Audi', year: 2008, model: 'A4', task: 'transmission-fluid-change' },
      { make: 'BMW', year: 2008, model: '528i', task: 'oil-change' },
      { make: 'Audi', year: 2008, model: 'A3', task: 'serpentine-belt-replacement' },
      { make: 'BMW', year: 2004, model: 'X5', task: 'oil-change' },
      { make: 'Audi', year: 2008, model: 'A6', task: 'brake-pad-replacement' },
      { make: 'BMW', year: 2008, model: 'Z4', task: 'battery-replacement' },
      { make: 'Audi', year: 2008, model: 'TT', task: 'spark-plug-replacement' },
    ];
    console.log(`Default mode: ${combinations.length} high-data European combos`);
  }

  console.log('\nMining manual corpus for specs...\n');
  const specs = await mineBatch(pool, combinations);

  fs.writeFileSync(output, JSON.stringify(specs, null, 2));
  console.log(`\n✓ Saved ${specs.length} specs to ${output}`);

  // Print summary
  if (specs.length > 0) {
    console.log('\n─── Quality Summary ───');
    let totalTorque = 0, totalCapacity = 0, totalFluid = 0, totalParts = 0;
    for (const spec of specs) {
      totalTorque += spec._mined?.torqueCount || 0;
      totalCapacity += spec._mined?.capacityCount || 0;
      totalFluid += spec._mined?.fluidCount || 0;
      totalParts += spec._mined?.partNumberCount || 0;
    }
    console.log(`Total torque specs extracted:  ${totalTorque}`);
    console.log(`Total capacities extracted:    ${totalCapacity}`);
    console.log(`Total fluid types extracted:   ${totalFluid}`);
    console.log(`Total part numbers extracted:  ${totalParts}`);

    console.log('\n─── Sample output ───');
    const sample = specs[0];
    console.log(`Key:      ${sample.key}`);
    console.log(`Title:    ${sample.title}`);
    console.log(`Torque:   ${sample.torqueSpecs || 'N/A'}`);
    console.log(`Parts:    ${sample.parts.map(p => p.name + (p.spec ? ` (${p.spec})` : '')).join(', ')}`);
    console.log(`Warnings: ${sample.warnings.length}`);
    console.log(`Steps:    ${sample.steps.length}`);
    console.log(`Notes:    ${sample.vehicleNotes.join(' | ')}`);
  }

  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
