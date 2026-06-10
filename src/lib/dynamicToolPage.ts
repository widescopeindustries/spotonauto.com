/**
 * Dynamic Tool Page Generator — Build ToolPage structures on-demand from corpus data.
 *
 * When a slug is not in the static TOOL_PAGES array, this module attempts to:
 * 1. Parse the slug into make/model/tool-type
 * 2. Query manual_embeddings for relevant sections across all confirmed years
 * 3. Extract specs using regex patterns
 * 4. Assemble a ToolPage-compatible object
 */

import 'server-only';

import type { ToolPage, ToolGeneration, ToolFAQ } from '@/data/tools-pages';
import { TOOL_TYPE_META } from '@/data/tools-pages';
import { findManualSectionsByTerms, type ManualSectionMatchRow } from '@/lib/manualEmbeddingsStore';
import { parseToolSlug, type KnownToolType } from '@/lib/slugParser';
import { getToolPage } from '@/data/tools-pages';
import { generateLegacyToolPage } from '@/data/tool-machine';

// ─── Tool-type keyword mappings for corpus search ───────────────────

const TOOL_SEARCH_TERMS: Record<KnownToolType, string[]> = {
  'oil-type': ['engine oil', 'motor oil', 'oil capacity', 'oil specification', 'oil type', 'lubrication'],
  'coolant-type': ['coolant', 'antifreeze', 'cooling system', 'coolant capacity', 'coolant type'],
  'transmission-fluid-type': ['transmission fluid', 'ATF', 'transaxle fluid', 'automatic transmission', 'manual transmission', 'gear oil'],
  'brake-fluid-type': ['brake fluid', 'hydraulic brake', 'master cylinder', 'brake system', 'DOT'],
  'battery-location': ['battery', 'battery removal', 'battery replacement', 'battery specifications', 'charging system', 'group size', 'CCA'],
  'serpentine-belt': ['serpentine belt', 'drive belt', 'accessory belt', 'belt routing', 'accessory drive', 'drive belt replacement'],
  'tire-size': ['tire', 'tire size', 'tire pressure', 'wheel specification', 'tires and wheels', 'wheel and tire'],
  'spark-plug-type': ['spark plug', 'spark plug gap', 'ignition system', 'ignition plug', 'tune-up', 'spark plug replacement'],
  'wiper-blade-size': ['wiper', 'wiper blade', 'windshield wiper', 'windshield washer', 'wiper replacement'],
  'headlight-bulb': ['headlight', 'headlamp', 'bulb replacement', 'lighting system', 'exterior lighting', 'headlamp bulb'],
  'fluid-capacity': ['fluid capacity', 'capacities', 'specifications', 'maintenance', 'fluid specification'],
};

// ─── Best-effort spec extraction patterns ───────────────────────────

interface ExtractionPatterns {
  specs: Array<{ label: string; pattern: RegExp; transform?: (m: RegExpMatchArray) => string }>;
}

const EXTRACTION_PATTERNS: Partial<Record<KnownToolType, ExtractionPatterns>> = {
  'oil-type': {
    specs: [
      { label: 'Viscosity', pattern: /\b(\dW-\d{1,2})\b/i, transform: (m) => m[1] },
      { label: 'Capacity', pattern: /(\d+\.?\d*)\s*(QTS?\.?|quarts?|qt\.?|L|liters?)/i, transform: (m) => `${m[1]} ${m[2].toLowerCase().startsWith('l') ? 'L' : 'qt'}` },
      { label: 'API Spec', pattern: /\b(API\s+[A-Z]-\d+|[A-Z]-\d+\s+API|ILSAC\s+GF-\d|SN\+|SP)\b/i, transform: (m) => m[1] },
    ],
  },
  'coolant-type': {
    specs: [
      { label: 'Coolant Type', pattern: /\b(OAT|HOAT|IAT|pink|blue|orange|green|red|yellow|purple|SLLC|Super Long Life|Ethylene Glycol)\b/i, transform: (m) => m[1] },
      { label: 'Capacity', pattern: /(\d+\.?\d*)\s*(QTS?\.?|quarts?|qt\.?|L|liters?|gal\.?|gallons?)/i, transform: (m) => `${m[1]} ${m[2].toLowerCase().startsWith('l') ? 'L' : m[2].toLowerCase().startsWith('g') ? 'gal' : 'qt'}` },
    ],
  },
  'transmission-fluid-type': {
    specs: [
      { label: 'Fluid Type', pattern: /\b(ATF|Mercon|Dexron|CVT-TC|CVT|WS|NS-[23]|Type\s+(T-IV|F|J|HK)\b|Toyota\s+ATF)\b/i, transform: (m) => m[1] },
      { label: 'Capacity', pattern: /(\d+\.?\d*)\s*(QTS?\.?|quarts?|qt\.?|L|liters?)/i, transform: (m) => `${m[1]} ${m[2].toLowerCase().startsWith('l') ? 'L' : 'qt'}` },
    ],
  },
  'brake-fluid-type': {
    specs: [
      { label: 'Brake Fluid', pattern: /\b(DOT\s*\d(?:\.\d)?)\b/i, transform: (m) => m[1].toUpperCase() },
    ],
  },
  'battery-location': {
    specs: [
      { label: 'Group Size', pattern: /\b(Group\s*[A-Z0-9]+|BCI\s*[A-Z0-9]+)\b/i, transform: (m) => m[1] },
      { label: 'CCA Rating', pattern: /\b(\d{3,4})\s*CCA\b/i, transform: (m) => `${m[1]} CCA` },
      { label: 'Location', pattern: /(?:located|positioned|mounted)\s+(?:in|under|behind|at)\s+(?:the\s+)?([^\.\n]{3,60})/i, transform: (m) => m[1].trim() },
    ],
  },
  'serpentine-belt': {
    specs: [
      { label: 'Belt Part Number', pattern: /\b(\d{3,4}[-\s]?[A-Z]{2,4}[-\s]?\d{3,4})\b/, transform: (m) => m[1] },
      { label: 'Routing Note', pattern: /(?:route|routing)\s+(?:the\s+)?belt\s+([^\.\n]{10,120})/i, transform: (m) => m[1].trim() },
    ],
  },
  'tire-size': {
    specs: [
      { label: 'Tire Size', pattern: /\b(\d{3}\/\d{2,3}[RZ]\d{2})\b/, transform: (m) => m[1] },
      { label: 'Tire Pressure', pattern: /(\d{2,3})\s*PSI/i, transform: (m) => `${m[1]} PSI` },
    ],
  },
  'spark-plug-type': {
    specs: [
      { label: 'Plug Type', pattern: /\b(Iridium|Platinum|Copper|Double\s+Iridium|Laser\s+Iridium)\b/i, transform: (m) => m[1] },
      { label: 'Gap', pattern: /(\d\.\d{2,3})\s*mm/i, transform: (m) => `${m[1]} mm` },
      { label: 'Part Number', pattern: /\b([A-Z]{1,3}\d{3,5}[A-Z]?|\d{5,6})\b/, transform: (m) => m[1] },
    ],
  },
  'wiper-blade-size': {
    specs: [
      { label: 'Driver Side', pattern: /(?:driver|left)\s*(?:side)?\s*:?\s*(\d{2,3})\s*(?:in|inch|\"|mm)/i, transform: (m) => `${m[1]}\"` },
      { label: 'Passenger Side', pattern: /(?:passenger|right)\s*(?:side)?\s*:?\s*(\d{2,3})\s*(?:in|inch|\"|mm)/i, transform: (m) => `${m[1]}\"` },
      { label: 'Rear', pattern: /rear\s*(?:wiper)?\s*[:\-]?\s*(\d{2,3})\s*(?:in|inch|\"|mm)/i, transform: (m) => `${m[1]}"` },
    ],
  },
  'headlight-bulb': {
    specs: [
      { label: 'Low Beam', pattern: /\b(H\d{1,2}|9\d{3,4}|D\dS?)\b/, transform: (m) => m[1] },
      { label: 'High Beam', pattern: /\b(H\d{1,2}|9\d{3,4}|D\dS?)\b/, transform: (m) => m[1] },
    ],
  },
  'fluid-capacity': {
    specs: [
      { label: 'Capacity', pattern: /(\d+\.?\d*)\s*(QTS?\.?|quarts?|qt\.?|L|liters?|gal\.?)/i, transform: (m) => `${m[1]} ${m[2].toLowerCase().startsWith('l') ? 'L' : m[2].toLowerCase().startsWith('g') ? 'gal' : 'qt'}` },
    ],
  },
};

// ─── Spec extraction from raw text ──────────────────────────────────

function extractSpecs(toolType: KnownToolType, text: string): Record<string, string> {
  const patterns = EXTRACTION_PATTERNS[toolType];
  if (!patterns) return {};

  const specs: Record<string, string> = {};
  const seen = new Set<string>();

  for (const { label, pattern, transform } of patterns.specs) {
    if (seen.has(label)) continue;
    const match = text.match(pattern);
    if (match) {
      const value = transform ? transform(match) : match[0];
      if (value && value.length > 1) {
        specs[label] = value;
        seen.add(label);
      }
    }
  }

  return specs;
}

// ─── Corpus query across confirmed years ────────────────────────────

async function queryCorpusForTool(
  make: string,
  model: string,
  toolType: KnownToolType,
  confirmedYears: number[],
): Promise<ManualSectionMatchRow[]> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return [];
  }

  const terms = TOOL_SEARCH_TERMS[toolType];
  if (!terms || terms.length === 0) return [];

  // Query all confirmed years in parallel
  const results = await Promise.all(
    confirmedYears.map(async (year) => {
      try {
        return await findManualSectionsByTerms({
          make,
          year,
          model,
          terms,
          limit: 8,
        });
      } catch (err) {
        console.warn(`[dynamicToolPage] DB query failed for ${make} ${model} ${year}:`, err);
        return [];
      }
    }),
  );

  // Flatten, dedupe by path, and sort by relevance
  const byPath = new Map<string, ManualSectionMatchRow>();
  for (const yearResults of results) {
    for (const row of yearResults) {
      if (!byPath.has(row.path)) {
        byPath.set(row.path, row);
      }
    }
  }

  return Array.from(byPath.values()).sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
}

// ─── Build generation groups from year-scattered rows ───────────────

function buildGenerations(
  rows: ManualSectionMatchRow[],
  toolType: KnownToolType,
  yearStart: number,
  yearEnd: number,
): ToolGeneration[] {
  // Group rows by year
  const byYear = new Map<number, ManualSectionMatchRow[]>();
  for (const row of rows) {
    if (!byYear.has(row.year)) byYear.set(row.year, []);
    byYear.get(row.year)!.push(row);
  }

  // For each year, extract specs from all matching sections
  const yearSpecs = new Map<number, { specs: Record<string, string>; notes: string[] }>();

  for (const [year, yearRows] of byYear) {
    const specs: Record<string, string> = {};
    const notes: string[] = [];

    for (const row of yearRows) {
      const text = `${row.sectionTitle}\n${row.contentPreview}\n${row.contentFull || ''}`;
      const extracted = extractSpecs(toolType, text);
      for (const [k, v] of Object.entries(extracted)) {
        if (!specs[k]) specs[k] = v;
      }
      if (row.sectionTitle && !notes.includes(row.sectionTitle)) {
        notes.push(row.sectionTitle);
      }
    }

    if (Object.keys(specs).length > 0) {
      yearSpecs.set(year, { specs, notes });
    }
  }

  if (yearSpecs.size === 0) return [];

  // Merge consecutive years with identical specs
  const sortedYears = Array.from(yearSpecs.keys()).sort((a, b) => a - b);
  const generations: ToolGeneration[] = [];

  let currentStart = sortedYears[0];
  let currentEnd = sortedYears[0];
  let currentData = yearSpecs.get(currentStart)!;

  function specHash(data: { specs: Record<string, string> }) {
    return JSON.stringify(data.specs);
  }

  for (let i = 1; i < sortedYears.length; i++) {
    const y = sortedYears[i];
    const data = yearSpecs.get(y)!;
    if (specHash(data) === specHash(currentData)) {
      currentEnd = y;
    } else {
      generations.push({
        name: `${currentStart}${currentEnd !== currentStart ? '-' + currentEnd : ''}`,
        years: currentStart === currentEnd ? String(currentStart) : `${currentStart}-${currentEnd}`,
        specs: currentData.specs,
        notes: currentData.notes,
      });
      currentStart = y;
      currentEnd = y;
      currentData = data;
    }
  }

  generations.push({
    name: `${currentStart}${currentEnd !== currentStart ? '-' + currentEnd : ''}`,
    years: currentStart === currentEnd ? String(currentStart) : `${currentStart}-${currentEnd}`,
    specs: currentData.specs,
    notes: currentData.notes,
  });

  // Sort newest first
  generations.sort((a, b) => {
    const aStart = parseInt(a.years.split('-')[0], 10);
    const bStart = parseInt(b.years.split('-')[0], 10);
    return bStart - aStart;
  });

  return generations;
}

// ─── Build FAQ from extracted data ──────────────────────────────────

function buildDynamicFAQ(make: string, model: string, toolType: KnownToolType, generations: ToolGeneration[]): ToolFAQ[] {
  const vehicle = `${make} ${model}`;
  const label = TOOL_TYPE_META[toolType]?.label || 'spec';
  const faq: ToolFAQ[] = [];

  faq.push({
    q: `What ${label.toLowerCase()} does a ${vehicle} use?`,
    a: generations.length > 0
      ? `Factory manual data shows ${generations[0].specs[Object.keys(generations[0].specs)[0]] || 'varies by year and engine'}. Exact specifications depend on model year and engine code.`
      : `Consult the factory service manual for your exact ${vehicle} year and engine configuration.`,
  });

  faq.push({
    q: `Where is this ${label.toLowerCase()} data from?`,
    a: `Extracted directly from the LEMON and CHARM factory service manual archives. Sources are cited per generation with links to the original manual sections.`,
  });

  if (toolType === 'oil-type') {
    faq.push({
      q: `How often should I change the oil in a ${vehicle}?`,
      a: `Most factory service manuals recommend oil changes every 5,000–7,500 miles under normal driving conditions. Severe conditions may require more frequent changes.`,
    });
  } else if (toolType === 'serpentine-belt') {
    faq.push({
      q: `How do I know if my ${vehicle} serpentine belt is bad?`,
      a: `Common signs include squealing on startup, visible cracks or fraying, and accessory failure. The factory manual includes inspection criteria and replacement intervals.`,
    });
  } else if (toolType === 'battery-location') {
    faq.push({
      q: `What battery size for a ${vehicle}?`,
      a: `Check the factory manual for exact group size, CCA rating, and terminal orientation. Using the wrong size can cause fitment issues or electrical problems.`,
    });
  }

  return faq.slice(0, 5);
}

// ─── Main entry point ───────────────────────────────────────────────

export interface DynamicToolPageResult {
  page: ToolPage & { isDynamic: true };
  quality: 'high' | 'medium' | 'low';
  totalSections: number;
}

export async function generateDynamicToolPage(slug: string): Promise<DynamicToolPageResult | null> {
  const parsed = parseToolSlug(slug);
  if (!parsed) return null;

  const { make, model, toolType, yearStart, yearEnd } = parsed;

  // Build confirmed years list (sample every few years to keep queries reasonable)
  const confirmedYears: number[] = [];
  const step = yearEnd - yearStart > 30 ? 3 : yearEnd - yearStart > 15 ? 2 : 1;
  for (let y = yearStart; y <= yearEnd; y += step) {
    confirmedYears.push(y);
  }
  // Always include start and end
  if (!confirmedYears.includes(yearStart)) confirmedYears.unshift(yearStart);
  if (!confirmedYears.includes(yearEnd)) confirmedYears.push(yearEnd);

  // Query corpus
  const rows = await queryCorpusForTool(make, model, toolType, confirmedYears);
  if (rows.length === 0) return null;

  // Build generations
  const generations = buildGenerations(rows, toolType, yearStart, yearEnd);
  if (generations.length === 0) return null;

  // Determine quality
  const totalSpecs = generations.reduce((sum, g) => sum + Object.keys(g.specs).length, 0);
  let quality: 'high' | 'medium' | 'low';
  if (totalSpecs >= 3 && generations.length >= 2) quality = 'high';
  else if (totalSpecs >= 1) quality = 'medium';
  else quality = 'low';

  // Low quality = return null (will 404)
  if (quality === 'low') return null;

  // Build quick answer from newest generation
  const newestGen = generations[0];
  const firstSpecKey = Object.keys(newestGen.specs)[0];
  const firstSpecValue = firstSpecKey ? newestGen.specs[firstSpecKey] : '';
  const quickAnswer = firstSpecValue
    ? `${newestGen.years} ${make} ${model}: ${firstSpecKey} — ${firstSpecValue}`
    : `${make} ${model} ${TOOL_TYPE_META[toolType]?.label || 'specifications'} — see generation details below.`;

  const label = TOOL_TYPE_META[toolType]?.label || 'Spec';
  const page: ToolPage & { isDynamic: true } = {
    slug,
    make,
    model,
    toolType,
    title: `${make} ${model} ${label} — Exact Factory Manual Spec`,
    description: `Exact ${label.toLowerCase()} for the ${make} ${model} from the factory service manual. ${generations.length > 1 ? `Covers ${generations[0].years}+.` : ''} Don't guess — use the OEM spec technicians use.`,
    keywords: [`${make} ${model} ${toolType.replace(/-/g, ' ')}`, `${make} ${model} factory manual`, `${slug}`],
    quickAnswer,
    generations,
    faq: buildDynamicFAQ(make, model, toolType, generations),
    isDynamic: true,
  };

  return { page, quality, totalSections: rows.length };
}

// ─── Async wrapper that tries static first, then dynamic ────────────

export interface ToolPageResult {
  page: ToolPage & { isDynamic?: boolean };
  quality?: 'high' | 'medium' | 'low';
}

export async function getToolPageAsync(slug: string): Promise<ToolPageResult | null> {
  // Static always wins
  const staticPage = getToolPage(slug);
  if (staticPage) return { page: staticPage };

  // Try dynamic generation from corpus DB
  try {
    const dynamic = await generateDynamicToolPage(slug);
    if (dynamic) return { page: dynamic.page, quality: dynamic.quality };
  } catch (err) {
    console.error(`[dynamicToolPage] Failed to generate dynamic page for ${slug}:`, err);
  }

  // Fallback: legacy template for tool types not yet mined from corpus
  try {
    const parsed = parseToolSlug(slug);
    if (parsed) {
      const legacy = generateLegacyToolPage(parsed.make, parsed.model, parsed.toolType);
      if (legacy) {
        console.log(`[dynamicToolPage] Legacy fallback for ${slug}`);
        return { page: legacy };
      }
    }
  } catch (err) {
    console.error(`[dynamicToolPage] Legacy fallback failed for ${slug}:`, err);
  }

  return null;
}
