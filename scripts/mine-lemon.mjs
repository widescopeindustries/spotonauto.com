/**
 * Crawl LEMON Manuals backend (2014+) to extract repair specs.
 * LEMON has full service manuals with torque specs, capacities, and procedures.
 *
 * Usage:
 *   node scripts/mine-lemon.mjs --make Toyota --year 2015 --model Camry --task oil-change
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LMDB_BASE = process.env.LMDB_BASE || 'http://127.0.0.1:8080';
const OUTPUT_DIR = path.join(__dirname, 'generated-specs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Generic Templates (same as CHARM miner) ──────────────────────────

const GENERIC_TEMPLATES = {
  'oil-change': {
    difficulty: 'Easy', time: '30-45 minutes',
    tools: ['Socket wrench set', 'Oil filter wrench', 'Drain pan', 'Funnel', 'Jack and jack stands', 'Torque wrench'],
    parts: ['Engine oil', 'Oil filter', 'Drain plug washer/gasket'],
    warnings: ['Allow engine to cool before starting', 'Properly dispose of used oil', 'Do not overtighten drain plug'],
    steps: ['Lift vehicle and secure on jack stands', 'Locate and remove drain plug', 'Drain old oil completely', 'Replace oil filter', 'Reinstall drain plug with new washer', 'Add new oil to specified level', 'Start engine and check for leaks', 'Verify oil level on dipstick'],
  },
  'spark-plug-replacement': {
    difficulty: 'Easy to Intermediate', time: '30 minutes - 2 hours',
    tools: ['Spark plug socket', 'Torque wrench', 'Gap gauge', 'Dielectric grease', 'Extension bars'],
    parts: ['Spark plugs (vehicle specific)', 'Anti-seize compound'],
    warnings: ['Work on cool engine only', 'Do not overtighten plugs', 'Check and set gap if required'],
    steps: ['Remove engine cover if equipped', 'Disconnect ignition coil', 'Remove old spark plug', 'Check gap on new plug', 'Install new plug to torque spec', 'Reinstall coil and repeat for all cylinders'],
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
    warnings: ['Never compress brake pedal with caliper removed', 'Check brake fluid level after compressing piston', 'Bed in new pads properly'],
    steps: ['Remove wheel', 'Remove caliper bolts and suspend caliper', 'Remove old pads', 'Compress caliper piston', 'Install new pads with hardware', 'Reinstall caliper and torque to spec', 'Pump brake pedal before driving'],
  },
  'battery-replacement': {
    difficulty: 'Easy', time: '15-30 minutes',
    tools: ['Wrench set', 'Wire brush', 'Battery terminal cleaner'],
    parts: ['Battery (correct group size)', 'Terminal protector spray'],
    warnings: ['Remove negative terminal first', 'Install positive terminal first', 'Properly dispose of old battery'],
    steps: ['Turn off all electronics', 'Remove negative then positive terminals', 'Remove battery hold-down', 'Remove old battery', 'Clean terminals', 'Install new battery in reverse order'],
  },
  'transmission-fluid-change': {
    difficulty: 'Intermediate', time: '1-2 hours',
    tools: ['Drain pan', 'Funnel', 'Socket set', 'Torque wrench'],
    parts: ['Correct transmission fluid', 'Drain plug washer/gasket'],
    warnings: ['Use ONLY the specified transmission fluid type', 'Measure exactly — overfilling causes damage', 'Check fluid level at correct temperature'],
    steps: ['Warm transmission to operating temperature', 'Remove drain plug and drain into pan', 'Replace drain plug washer and reinstall', 'Refill through dipstick tube to specified level', 'Check level with engine running in Park'],
  },
  'headlight-bulb-replacement': {
    difficulty: 'Easy', time: '10-30 minutes',
    tools: ['Gloves', 'Screwdriver (possibly)'],
    parts: ['Headlight bulb (correct fitment)', 'Gloves'],
    warnings: ['Do not touch bulb glass with bare hands', 'Test before reassembly', 'Some vehicles require bumper or assembly removal'],
    steps: ['Access bulb from engine bay or wheel well', 'Disconnect electrical connector', 'Remove retaining clip or ring', 'Remove old bulb', 'Install new bulb without touching glass', 'Reconnect and test before reassembly'],
  },
};

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

function parseLinks(html) {
  const links = [];
  const regex = /<a\s+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const href = m[1];
    const text = m[2].trim();
    if (href.startsWith('/') && !href.includes('?')) {
      links.push({ href, text });
    } else if (!href.startsWith('http') && !href.startsWith('#')) {
      links.push({ href, text });
    }
  }
  return links;
}

function extractTextContent(html) {
  // Very basic HTML to text extraction
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ── Spec Extraction from Text ────────────────────────────────────────

function extractSpecs(text, task) {
  const specs = {
    torqueSpecs: new Set(),
    capacities: new Set(),
    fluidTypes: new Set(),
    partNumbers: new Set(),
    warnings: new Set(),
    bulbType: null,
    groupSize: null,
    cca: null,
  };

  const lower = text.toLowerCase();

  // Torque specs: "294 N*m (2,998 kgf*cm, 217 ft.*lbf)"
  const torqueRe = /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:N\*m|N·m|Nm)[\s\S]{0,50}?\(([^)]+)\)/gi;
  let m;
  while ((m = torqueRe.exec(text)) !== null) {
    specs.torqueSpecs.add(`${m[1]} N*m (${m[2]})`);
  }
  // Also catch "ft.*lbf" patterns
  const ftLbsRe = /(\d+(?:,\d{3})*(?:\.\d+)?)\s*ft\.?\*?lbf?/gi;
  while ((m = ftLbsRe.exec(text)) !== null) {
    specs.torqueSpecs.add(`${m[1]} ft-lbs`);
  }

  // Capacities with units
  const capRe = /(\d+(?:\.\d+)?)\s*(?:qt|quart|quarts|L|liter|liters|gal|gallon|gallons|US gal)\b/gi;
  while ((m = capRe.exec(text)) !== null) {
    specs.capacities.add(m[0].trim());
  }

  // Fluid types
  const fluidRe = /\b(0W-16|0W-20|0W-30|5W-20|5W-30|5W-40|10W-30|10W-40|15W-40|ATF WS|ATF T-IV|ATF\s+Type\s*(?:T-IV|WS|HP|LL|IV)?|DEXRON\s*(?:III|IV|VI|HP)?|MERCON\s*(?:LV|V)?)\b/gi;
  while ((m = fluidRe.exec(text)) !== null) {
    specs.fluidTypes.add(m[0].trim());
  }

  // Bulb types
  const bulbRe = /\b(H7|H11|9005|9006|H1|H3|H4|H8|H9|H13|HB3|HB4|D1S|D2S|D3S|D4S)\b/gi;
  const bulbMatch = bulbRe.exec(text);
  if (bulbMatch) specs.bulbType = bulbMatch[1];

  // Battery group size
  const groupRe = /group\s+([A-Z0-9]{1,3})/gi;
  const groupMatch = groupRe.exec(lower);
  if (groupMatch) specs.groupSize = groupMatch[1];

  // CCA
  const ccaRe = /(\d{3,4})\s*cca/gi;
  const ccaMatch = ccaRe.exec(lower);
  if (ccaMatch) specs.cca = ccaMatch[1];

  return specs;
}

// ── Crawl LEMON Tree ─────────────────────────────────────────────────

async function crawlForSpecs(make, year, model, task) {
  const results = [];

  // Encode path segments
  const encode = (s) => encodeURIComponent(s).replace(/%2C/g, ',').replace(/%20/g, '%20');
  const basePath = `/${encode(make)}/${year}/${encode(model)}/`;

  // Fetch vehicle root
  const rootHtml = await fetchPage(basePath);
  if (!rootHtml) return null;

  // Find "Repair and Diagnosis" link
  const rootLinks = parseLinks(rootHtml);
  const repairLink = rootLinks.find(l => l.text.toLowerCase().includes('repair and diagnosis') && !l.text.toLowerCase().includes('single page'));
  if (!repairLink) return null;

  const repairPath = repairLink.href.startsWith('/') ? repairLink.href : basePath + repairLink.href;
  const repairHtml = await fetchPage(repairPath);
  if (!repairHtml) return null;

  // Look for relevant sections based on task
  const repairLinks = parseLinks(repairHtml);

  const taskKeywords = {
    'oil-change': ['oil', 'lubrication', 'engine mechanical', 'maintenance'],
    'spark-plug-replacement': ['ignition', 'spark', 'engine mechanical', 'engine control'],
    'serpentine-belt-replacement': ['belt', 'drive belt', 'accessory drive'],
    'brake-pad-replacement': ['brake', 'disc brake'],
    'battery-replacement': ['battery', 'charging'],
    'transmission-fluid-change': ['transmission', 'automatic transmission', 'axle'],
    'headlight-bulb-replacement': ['lighting', 'headlight', 'lamp'],
    'thermostat-replacement': ['cooling', 'engine coolant', 'water pump'],
    'water-pump-replacement': ['cooling', 'engine coolant', 'water pump'],
  };

  const keywords = taskKeywords[task] || [];
  const relevantLinks = repairLinks.filter(l =>
    keywords.some(k => l.text.toLowerCase().includes(k))
  );

  // Also look for "Quick Lookups" / "Common Specs"
  const quickLookup = repairLinks.find(l => l.text.toLowerCase().includes('quick lookups') || l.text.toLowerCase().includes('common specs'));
  if (quickLookup) {
    const quickPath = quickLookup.href.startsWith('/') ? quickLookup.href : repairPath + quickLookup.href;
    const quickHtml = await fetchPage(quickPath);
    if (quickHtml) {
      const quickLinks = parseLinks(quickHtml);
      const specLinks = quickLinks.filter(l =>
        l.text.toLowerCase().includes('spec') ||
        l.text.toLowerCase().includes('torque') ||
        l.text.toLowerCase().includes('fluid') ||
        l.text.toLowerCase().includes('capacity')
      );
      for (const link of specLinks.slice(0, 5)) {
        const specPath = link.href.startsWith('/') ? link.href : quickPath + link.href;
        const specHtml = await fetchPage(specPath);
        if (specHtml) {
          const text = extractTextContent(specHtml);
          const specs = extractSpecs(text, task);
          results.push({ path: specPath, title: link.text, specs, text: text.substring(0, 2000) });
        }
      }
    }
  }

  // Crawl relevant sections
  for (const link of relevantLinks.slice(0, 5)) {
    const sectionPath = link.href.startsWith('/') ? link.href : repairPath + link.href;
    const sectionHtml = await fetchPage(sectionPath);
    if (!sectionHtml) continue;

    const text = extractTextContent(sectionHtml);
    const specs = extractSpecs(text, task);
    results.push({ path: sectionPath, title: link.text, specs, text: text.substring(0, 2000) });

    // Go one level deeper for torque specs
    const subLinks = parseLinks(sectionHtml);
    const specSubLinks = subLinks.filter(l =>
      l.text.toLowerCase().includes('torque') ||
      l.text.toLowerCase().includes('spec') ||
      l.text.toLowerCase().includes('procedure')
    );
    for (const sub of specSubLinks.slice(0, 3)) {
      const subPath = sub.href.startsWith('/') ? sub.href : sectionPath + sub.href;
      const subHtml = await fetchPage(subPath);
      if (subHtml) {
        const subText = extractTextContent(subHtml);
        const subSpecs = extractSpecs(subText, task);
        results.push({ path: subPath, title: sub.text, specs: subSpecs, text: subText.substring(0, 2000) });
      }
    }
  }

  return results;
}

// ── Build Spec ───────────────────────────────────────────────────────

function buildSpec(make, year, model, task, crawlResults) {
  const template = GENERIC_TEMPLATES[task] || GENERIC_TEMPLATES['oil-change'];
  if (!template) return null;

  // Merge all extracted specs
  const merged = {
    torqueSpecs: new Set(),
    capacities: new Set(),
    fluidTypes: new Set(),
    partNumbers: new Set(),
    warnings: new Set(),
    bulbType: null,
    groupSize: null,
    cca: null,
  };

  for (const r of crawlResults) {
    r.specs.torqueSpecs.forEach(s => merged.torqueSpecs.add(s));
    r.specs.capacities.forEach(s => merged.capacities.add(s));
    r.specs.fluidTypes.forEach(s => merged.fluidTypes.add(s));
    r.specs.partNumbers.forEach(s => merged.partNumbers.add(s));
    r.specs.warnings.forEach(s => merged.warnings.add(s));
    if (r.specs.bulbType) merged.bulbType = r.specs.bulbType;
    if (r.specs.groupSize) merged.groupSize = r.specs.groupSize;
    if (r.specs.cca) merged.cca = r.specs.cca;
  }

  const parts = template.parts.map(name => {
    const part = { name, spec: '' };
    if (task === 'oil-change' && name === 'Engine oil' && merged.fluidTypes.size > 0) {
      part.spec = Array.from(merged.fluidTypes).join(', ');
    }
    if (task === 'battery-replacement' && name === 'Battery (correct group size)') {
      const specs = [];
      if (merged.groupSize) specs.push(`Group ${merged.groupSize}`);
      if (merged.cca) specs.push(`${merged.cca} CCA`);
      if (specs.length > 0) part.spec = specs.join(', ');
    }
    if (task === 'headlight-bulb-replacement' && name === 'Headlight bulb (correct fitment)' && merged.bulbType) {
      part.spec = `${merged.bulbType} — verify trim level`;
    }
    return part;
  });

  const vehicleNotes = [];
  if (merged.torqueSpecs.size > 0) {
    vehicleNotes.push(`Torque specs: ${Array.from(merged.torqueSpecs).slice(0, 3).join(' | ')}`);
  }
  if (merged.capacities.size > 0) {
    vehicleNotes.push(`Capacities: ${Array.from(merged.capacities).slice(0, 3).join(', ')}`);
  }
  if (merged.fluidTypes.size > 0) {
    vehicleNotes.push(`Specified fluid: ${Array.from(merged.fluidTypes).join(', ')}`);
  }
  if (vehicleNotes.length === 0) {
    vehicleNotes.push(`Refer to factory service manual for exact ${task.replace(/-/g, ' ')} specifications`);
  }

  return {
    key: `${make.toLowerCase().replace(/\s+/g, '-')}-${model.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)}-${year}-${task}`,
    make, year, model, task,
    title: `${year} ${make} ${model} — ${task.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
    difficulty: template.difficulty,
    time: template.time,
    tools: template.tools,
    parts,
    warnings: [...template.warnings, ...Array.from(merged.warnings)].slice(0, 8),
    steps: template.steps,
    torqueSpecs: merged.torqueSpecs.size > 0 ? Array.from(merged.torqueSpecs).slice(0, 3).join(' | ') : undefined,
    vehicleNotes,
    sources: crawlResults.map(r => ({ path: r.path, title: r.title })),
    _mined: {
      torqueCount: merged.torqueSpecs.size,
      capacityCount: merged.capacities.size,
      fluidCount: merged.fluidTypes.size,
    },
  };
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
    else if (args[i] === '--output') result.output = args[++i];
  }
  result.output = result.output || path.join(OUTPUT_DIR, 'lemon-specs.json');
  return result;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║           LEMON Manuals Crawler — Spec Extractor            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const { make, year, model, task, output } = parseArgs();

  if (!make || !year || !model || !task) {
    console.log('Usage: node scripts/mine-lemon.mjs --make Toyota --year 2015 --model "Camry LE" --task oil-change');
    process.exit(1);
  }

  console.log(`Crawling LEMON backend for ${year} ${make} ${model} — ${task}...\n`);
  const results = await crawlForSpecs(make, year, model, task);

  if (!results || results.length === 0) {
    console.log('No relevant sections found.');
    process.exit(0);
  }

  console.log(`Found ${results.length} relevant sections`);
  for (const r of results) {
    console.log(`  - ${r.title}: ${r.specs.torqueSpecs.size} torque, ${r.specs.capacities.size} capacities, ${r.specs.fluidTypes.size} fluids`);
  }

  const spec = buildSpec(make, year, model, task, results);
  fs.writeFileSync(output, JSON.stringify([spec], null, 2));
  console.log(`\n✓ Saved spec to ${output}`);

  console.log('\n─── Sample output ───');
  console.log(`Key:      ${spec.key}`);
  console.log(`Torque:   ${spec.torqueSpecs || 'N/A'}`);
  console.log(`Parts:    ${spec.parts.map(p => p.name + (p.spec ? ` (${p.spec})` : '')).join(', ')}`);
  console.log(`Notes:    ${spec.vehicleNotes.join(' | ')}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
