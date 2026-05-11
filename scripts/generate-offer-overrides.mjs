#!/usr/bin/env node
/**
 * generate-offer-overrides.mjs — Bulk-generate TOP_PAGE_OFFER_OVERRIDES
 * for the top 200 corpus-backed tool pages.
 *
 * Reads src/data/corpus/corpus-tool-pages.json
 * Appends overrides to src/lib/toolIntentOffers.ts
 */

import fs from 'fs';
import path from 'path';

const CORPUS_PATH = path.join(process.cwd(), 'src', 'data', 'corpus', 'corpus-tool-pages.json');
const TOOLS_PAGES_PATH = path.join(process.cwd(), 'src', 'data', 'tools-pages.ts');
const TARGET_PATH = path.join(process.cwd(), 'src', 'lib', 'toolIntentOffers.ts');

// Scoring constants (mirrored from tools-pages.ts)
const PRIORITY_MAKES = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai',
  'Kia', 'Jeep', 'Subaru', 'BMW', 'Dodge', 'GMC', 'Mazda',
  'Volkswagen', 'Lexus', 'Mercedes',
];
const HIGH_DEMAND_MODELS = new Set([
  'Camry', 'Corolla', 'RAV4', 'Tacoma', 'F-150', 'Escape', 'Focus', 'Fusion',
  'Civic', 'Accord', 'CR-V', 'Odyssey', 'Pathfinder', 'Rogue', 'Altima', 'Sentra',
  'X3', 'X5', 'Grand Cherokee', 'Wrangler', 'Elantra', 'Sonata', 'Tucson',
  'Santa Fe', 'Soul', 'Sportage', 'Malibu', 'Silverado', 'Explorer', 'Pilot',
]);
const TOOL_TYPE_PRIORITY_SCORES = {
  'serpentine-belt': 44,
  'battery-location': 38,
  'oil-type': 36,
  'headlight-bulb': 32,
  'spark-plug-type': 30,
  'coolant-type': 24,
  'transmission-fluid-type': 22,
  'fluid-capacity': 20,
  'tire-size': 18,
  'wiper-blade-size': 14,
};
const PRIORITY_MAKE_RANK = new Map(PRIORITY_MAKES.map((m, i) => [m, i]));

function makeRank(make) {
  return PRIORITY_MAKE_RANK.get(make) ?? 999;
}

function getScore(page) {
  const makeScore = Math.max(0, 55 - (makeRank(page.make) * 3));
  const toolTypeScore = TOOL_TYPE_PRIORITY_SCORES[page.toolType] ?? 0;
  const modelScore = HIGH_DEMAND_MODELS.has(page.model) ? 16 : 0;
  return makeScore + toolTypeScore + modelScore;
}

// ─── Spec extractors ────────────────────────────────────────────────

const VISCOSITY_RE = /\b\d{1,2}W-\d{2}\b/i;
const CAPACITY_RE = /\b(\d+(?:\.\d+)?)\s*(QTS?|quarts?|L|liters?)\b/i;
const SPEC_RE = /(TOYOTA Genuine|Motorcraft|Honda|Subaru|Mobil 1|Castrol|Valvoline|Penzoil|Pennzoil|ACDelco|Dexos|SAE\s+\d{1,2}W-\d{2}|\d{1,2}W-\d{2}\s+(?:Full )?Synthetic)/i;

function findSpec(page, keywords) {
  const newest = page.generations?.[0];
  if (!newest) return '';
  const entries = Object.entries(newest.specs);
  for (const key of keywords) {
    const match = entries.find(([k]) => k.toLowerCase().includes(key.toLowerCase()));
    if (match) return match[1];
  }
  return '';
}

function extractViscosity(text) {
  const m = text?.match(VISCOSITY_RE);
  return m ? m[0] : '';
}

function extractCapacity(text) {
  const m = text?.match(CAPACITY_RE);
  return m ? `${m[1]} ${m[2]}` : '';
}

function extractBrand(text) {
  const m = text?.match(SPEC_RE);
  return m ? m[1] : '';
}

// ─── Override generators by tool type ───────────────────────────────

function generateOilOverride(page) {
  const vehicle = `${page.make} ${page.model}`;
  const specText = findSpec(page, ['Engine Oil', 'Oil Type', 'Recommended Oil']);
  const visc = extractViscosity(specText) || extractViscosity(page.quickAnswer);
  const cap = extractCapacity(specText) || extractCapacity(page.quickAnswer);
  const brand = extractBrand(specText);

  const title = cap
    ? `${page.model} ${visc || 'synthetic'} oil service kit (${cap})`
    : `${page.model} ${visc || 'synthetic'} oil change bundle`;

  const desc = visc
    ? `Buy the exact ${visc} oil and filter the ${vehicle} requires.`
    : `Buy the correct oil and filter for the ${vehicle}.`;

  const reason = visc
    ? `Using the wrong viscosity risks engine wear and warranty issues. The factory spec is ${visc}.`
    : `Factory spec matters — the wrong oil weight causes wear and voids warranty coverage.`;

  const query = `${vehicle} ${visc || 'synthetic'} motor oil`.trim();

  return {
    primaryTitle: title,
    primaryDescription: desc,
    primaryReason: reason,
    primaryQuery: query,
    secondaryQuery: `${vehicle} oil filter`,
    tertiaryQuery: `${vehicle} oil drain plug gasket`,
  };
}

function generateCoolantOverride(page) {
  const vehicle = `${page.make} ${page.model}`;
  const specText = findSpec(page, ['Engine Coolant', 'Coolant Type']);
  const cap = extractCapacity(specText);
  const brand = extractBrand(specText);
  const coolantName = brand || 'OEM-spec coolant';

  return {
    primaryTitle: `${page.model} coolant flush kit${cap ? ` (${cap})` : ''}`,
    primaryDescription: `Find ${coolantName} that matches the ${vehicle} factory spec before top-off or flush.`,
    primaryReason: `Coolant chemistry mismatch causes sludge and overheating. The factory manual specifies ${coolantName}.`,
    primaryQuery: `${vehicle} ${coolantName}`.trim(),
    secondaryQuery: `${vehicle} coolant flush kit`,
    tertiaryQuery: `${vehicle} spill free coolant funnel`,
  };
}

function generateTransmissionOverride(page) {
  const vehicle = `${page.make} ${page.model}`;
  const specText = findSpec(page, ['Automatic Transmission Fluid', 'Transmission Fluid', 'ATF']);
  const brand = extractBrand(specText);
  const atfName = brand || 'OEM ATF';

  return {
    primaryTitle: `${page.model} transmission fluid service set`,
    primaryDescription: `Find ${atfName} and fill tools for the ${vehicle}.`,
    primaryReason: `Wrong ATF causes shifting problems and premature wear. The factory manual specifies ${atfName}.`,
    primaryQuery: `${vehicle} ${atfName}`.trim(),
    secondaryQuery: `${vehicle} transmission filter kit`,
    tertiaryQuery: `transmission fluid transfer pump`,
  };
}

function generateBrakeFluidOverride(page) {
  const vehicle = `${page.make} ${page.model}`;
  const specText = findSpec(page, ['Brake Fluid']);
  const brand = extractBrand(specText) || 'DOT-rated brake fluid';

  return {
    primaryTitle: `${page.model} brake fluid and bleed kit`,
    primaryDescription: `Find ${brand} and simple bleeding tools for the ${vehicle}.`,
    primaryReason: `Moisture-heavy brake fluid lowers boiling performance. The factory spec is ${brand}.`,
    primaryQuery: `${vehicle} ${brand}`.trim(),
    secondaryQuery: `${vehicle} brake bleed kit`,
    tertiaryQuery: `brake fluid tester automotive`,
  };
}

function generateFluidCapacityOverride(page) {
  const vehicle = `${page.make} ${page.model}`;
  return {
    primaryTitle: `${page.model} multi-fluid service bundle`,
    primaryDescription: `Shop oil, coolant, and transmission fluid for the ${vehicle} in one cart.`,
    primaryReason: `Fluid-capacity searchers usually plan more than one fluid job per session.`,
    primaryQuery: `${vehicle} fluid service kit`,
    secondaryQuery: `${vehicle} coolant oil transmission fluid bundle`,
    tertiaryQuery: `long neck funnel automotive`,
  };
}

function generateOverride(page) {
  switch (page.toolType) {
    case 'oil-type': return generateOilOverride(page);
    case 'coolant-type': return generateCoolantOverride(page);
    case 'transmission-fluid-type': return generateTransmissionOverride(page);
    case 'brake-fluid-type': return generateBrakeFluidOverride(page);
    case 'fluid-capacity': return generateFluidCapacityOverride(page);
    default: return null;
  }
}

// ─── Main ───────────────────────────────────────────────────────────

const corpus = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf8'));

// Load existing hand-crafted slugs so we don't duplicate
const toolsPagesContent = fs.readFileSync(TOOLS_PAGES_PATH, 'utf8');
const handCraftedMatch = toolsPagesContent.match(/const HAND_CRAFTED.*?=\s*\[(.*?)\];/s);
const handCraftedSlugs = new Set();
if (handCraftedMatch) {
  const slugMatches = handCraftedMatch[1].matchAll(/slug:\s*['"]([^'"]+)['"]/g);
  for (const m of slugMatches) handCraftedSlugs.add(m[1]);
}
console.log('Hand-crafted slugs found:', handCraftedSlugs.size);

// Filter to corpus-only pages, score, sort
const corpusOnly = corpus.filter(p => !handCraftedSlugs.has(p.slug));
corpusOnly.forEach(p => { p._score = getScore(p); });
corpusOnly.sort((a, b) => b._score - a._score);

const top200 = corpusOnly.slice(0, 200);
console.log('Top 200 corpus pages selected. Score range:', top200[0]._score, 'to', top200[199]._score);

// Generate overrides
const newOverrides = [];
for (const page of top200) {
  const override = generateOverride(page);
  if (!override) continue;

  const lines = [
    `  '${page.slug}': {`,
    `    primaryTitle: '${escapeJs(override.primaryTitle)}',`,
    `    primaryDescription: '${escapeJs(override.primaryDescription)}',`,
    `    primaryReason: '${escapeJs(override.primaryReason)}',`,
    `    primaryQuery: '${escapeJs(override.primaryQuery)}',`,
  ];
  if (override.secondaryQuery) lines.push(`    secondaryQuery: '${escapeJs(override.secondaryQuery)}',`);
  if (override.tertiaryQuery) lines.push(`    tertiaryQuery: '${escapeJs(override.tertiaryQuery)}',`);
  lines.push(`  },`);
  newOverrides.push(lines.join('\n'));
}

function escapeJs(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// Read existing file and find insertion point
let targetContent = fs.readFileSync(TARGET_PATH, 'utf8');

// Find the closing of TOP_PAGE_OFFER_OVERRIDES: `};` followed by `\n\nfunction getPrimaryGeneration`
const insertMarker = '\n};\n\nfunction getPrimaryGeneration';
const insertIdx = targetContent.indexOf(insertMarker);
if (insertIdx === -1) {
  console.error('Could not find insertion point in toolIntentOffers.ts');
  process.exit(1);
}

// Insert new overrides before the closing `};`
const beforeInsert = targetContent.substring(0, insertIdx);
const afterInsert = targetContent.substring(insertIdx);

const output = beforeInsert + '\n' + newOverrides.join('\n') + afterInsert;
fs.writeFileSync(TARGET_PATH, output);

console.log(`\n✓ Appended ${newOverrides.length} new overrides to ${TARGET_PATH}`);
console.log('Sample overrides:');
for (const o of newOverrides.slice(0, 3)) {
  console.log(o.split('\n')[0]);
}
