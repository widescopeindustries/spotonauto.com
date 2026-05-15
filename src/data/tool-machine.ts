/**
 * THE MACHINE — Corpus-first tool page generator.
 *
 * Priority:
 *   1. Corpus-mined pages from LEMON factory manuals (src/data/corpus/corpus-tool-pages.json)
 *   2. Legacy template generation (only as fallback if corpus data is missing)
 *
 * The corpus JSON is produced by scripts/assemblers/build-tool-pages.mjs on the VPS.
 * It contains ~3,700 tool pages with exact factory fluid specs, capacities, and part numbers.
 */

import fs from 'fs';
import path from 'path';
import { NOINDEX_MAKES, isNonUsModel, VEHICLE_PRODUCTION_YEARS, isEvModel } from './vehicles.ts';
import type { ToolPage, ToolType, ToolGeneration, ToolFAQ } from './tools-pages.ts';

// ── Corpus loading ───────────────────────────────────────────────────

const CORPUS_PATH = path.join(process.cwd(), 'src', 'data', 'corpus', 'corpus-tool-pages.json');

let corpusPages: ToolPage[] | null = null;

function loadCorpusPages(): ToolPage[] {
  if (corpusPages) return corpusPages;
  try {
    if (!fs.existsSync(CORPUS_PATH)) {
      console.warn('[tool-machine] Corpus not found at', CORPUS_PATH, '— falling back to legacy templates');
      corpusPages = [];
      return corpusPages;
    }
    const raw = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf8')) as any[];
    // Strip internal metadata before returning
    corpusPages = raw.map(p => ({
      slug: p.slug,
      make: p.make,
      model: p.model,
      toolType: p.toolType,
      title: p.title,
      description: p.description,
      keywords: p.keywords,
      quickAnswer: p.quickAnswer,
      generations: p.generations,
      faq: p.faq,
    }));
    console.log('[tool-machine] Loaded', corpusPages.length, 'corpus-backed tool pages');
  } catch (err) {
    console.error('[tool-machine] Failed to load corpus:', err);
    corpusPages = [];
  }
  return corpusPages;
}

// ── Legacy template generation (fallback only) ───────────────────────

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function splitGenerations(start: number, end: number): { name: string; years: string; startYear: number; endYear: number }[] {
  const gens: { name: string; years: string; startYear: number; endYear: number }[] = [];
  let cursor = end;
  while (cursor >= start) {
    const genStart = Math.max(cursor - 5, start);
    const genEnd = cursor;
    gens.push({
      name: `${genStart}-${genEnd}`,
      years: `${genStart}-${genEnd}`,
      startYear: genStart,
      endYear: genEnd,
    });
    cursor = genStart - 1;
  }
  return gens;
}

interface ToolTypeTemplate {
  label: string;
  slugSuffix: string;
  titleTemplate: string;
  descTemplate: string;
  quickAnswerTemplate: string;
  specsForGen: (make: string, model: string, gen: { startYear: number; endYear: number }) => Record<string, string>;
  notesForGen: (make: string, model: string, gen: { startYear: number; endYear: number }) => string[];
  faqTemplates: (make: string, model: string) => ToolFAQ[];
  keywordTemplates: (make: string, model: string) => string[];
}

const TEMPLATES: Record<string, ToolTypeTemplate> = {
  'oil-type': {
    label: 'Oil Type & Capacity',
    slugSuffix: 'oil-type',
    titleTemplate: '{make} {model} Oil Type & Capacity | All Years Guide',
    descTemplate: 'Find the correct oil type, weight, and capacity for your {make} {model}. Covers all model years with filter recommendations and drain intervals.',
    quickAnswerTemplate: 'The {make} {model} uses synthetic motor oil — typically 0W-20 for newer models (2010+) or 5W-30 for older ones. Check your owner\'s manual for exact capacity.',
    specsForGen: (make, model, gen) => {
      const isModern = gen.endYear >= 2012;
      return {
        'Recommended Oil': isModern ? '0W-20 Full Synthetic' : '5W-30 Conventional or Synthetic',
        'Oil Capacity (with filter)': 'Varies by engine — check owner\'s manual (typically 4-8+ quarts)',
        'Oil Change Interval': isModern ? '5,000 - 10,000 miles' : '3,000 - 5,000 miles',
        'Drain Plug Torque': '25 - 35 ft-lbs (check service manual)',
      };
    },
    notesForGen: (make, model, gen) => {
      const tips = [];
      if (gen.endYear >= 2012) tips.push('Modern engines require full synthetic — conventional oil may void warranty');
      if (gen.endYear >= 2018) tips.push('Many newer models have extended drain intervals up to 10,000 miles');
      tips.push(`Always verify oil weight on the oil cap or in your ${make} owner's manual`);
      if (gen.startYear < 2005) tips.push('Older engines may benefit from high-mileage formula if over 75,000 miles');
      return tips;
    },
    faqTemplates: (make, model) => [
      { q: `What type of oil does a ${make} ${model} use?`, a: `Most newer ${make} ${model} models (2010+) use 0W-20 full synthetic oil. Older models typically use 5W-30. The exact specification depends on your engine — check the oil cap or owner's manual for the definitive answer.` },
      { q: `How many quarts of oil does a ${make} ${model} take?`, a: `Oil capacity for the ${make} ${model} varies by engine — four-cylinder engines typically take 4-5 quarts, V6 engines 5-6 quarts, and V8 or truck engines can take 7-8+ quarts (all with filter).` },
    ],
    keywordTemplates: (make, model) => [
      `${make} ${model} oil type`.toLowerCase(),
      `${make} ${model} oil capacity`.toLowerCase(),
      `${make} ${model} oil weight`.toLowerCase(),
    ],
  },
  'battery-location': {
    label: 'Battery Location',
    slugSuffix: 'battery-location',
    titleTemplate: '{make} {model} Battery Location | Where Is the Battery?',
    descTemplate: 'Find the battery location, group size, and replacement procedure for the {make} {model}. Covers all years and engine options.',
    quickAnswerTemplate: 'The {make} {model} battery is typically located in the engine compartment on the driver or passenger side. Some models have it in the trunk or under the rear seat.',
    specsForGen: (make, model, gen) => ({
      'Typical Location': 'Engine compartment (driver or passenger side)',
      'Group Size': 'Check existing battery label or owner\'s manual',
      'Voltage': '12V',
      'Terminal Type': 'Top post or side post (varies by year)',
    }),
    notesForGen: (make, model, gen) => [
      'Disconnect negative terminal first when removing',
      'Some models require radio code reset after battery replacement',
    ],
    faqTemplates: (make, model) => [
      { q: `Where is the battery in a ${make} ${model}?`, a: `Most ${make} ${model} models have the battery in the engine compartment. Some newer models or hybrids may have it in the trunk or under the rear seat. Check your owner's manual for the exact location.` },
    ],
    keywordTemplates: (make, model) => [
      `${make} ${model} battery location`.toLowerCase(),
      `${make} ${model} battery size`.toLowerCase(),
    ],
  },
  'coolant-type': {
    label: 'Coolant Type',
    slugSuffix: 'coolant-type',
    titleTemplate: '{make} {model} Coolant Type & Capacity | All Years Guide',
    descTemplate: 'Find the correct coolant type, color, and capacity for the {make} {model}. Covers all years including hybrid and performance models.',
    quickAnswerTemplate: 'The {make} {model} coolant type depends on model year. Newer models use long-life OAT or HOAT coolant (often pink, blue, or orange). Older models use traditional green IAT coolant.',
    specsForGen: (make, model, gen) => {
      if (gen.endYear >= 2015) return {
        'Coolant Type': 'OAT/HOAT long-life (pink, blue, or orange)',
        'Coolant Color': 'Green, orange, or pink',
        'Total Capacity': '6.0 - 10.0 quarts',
        'Drain & Fill Volume': '3.0 - 5.0 quarts',
        'Change Interval': '60,000 miles or 5 years',
        'Concentration': '50/50 with distilled water',
      };
      return {
        'Coolant Type': 'IAT (traditional green)',
        'Coolant Color': 'Green',
        'Total Capacity': '6.0 - 10.0 quarts',
        'Drain & Fill Volume': '3.0 - 5.0 quarts',
        'Change Interval': '30,000 miles or 2 years',
        'Concentration': '50/50 with distilled water',
      };
    },
    notesForGen: (make, model, gen) => {
      const tips = [];
      tips.push('NEVER mix different coolant types or colors — flush completely when changing brands');
      tips.push('Always use distilled water, not tap water, when mixing coolant concentrate');
      if (gen.endYear >= 2015) tips.push('Modern OAT/HOAT coolants last much longer than traditional green coolant');
      tips.push('Check coolant level when engine is COLD');
      return tips;
    },
    faqTemplates: (make, model) => [
      { q: `What type of coolant does a ${make} ${model} use?`, a: `The ${make} ${model} coolant type depends on the model year. Newer models use long-life OAT or HOAT coolant. Older models use traditional green IAT coolant. Never mix types.` },
    ],
    keywordTemplates: (make, model) => [
      `${make} ${model} coolant type`.toLowerCase(),
      `${make} ${model} antifreeze type`.toLowerCase(),
    ],
  },
  'transmission-fluid-type': {
    label: 'Transmission Fluid',
    slugSuffix: 'transmission-fluid-type',
    titleTemplate: '{make} {model} Transmission Fluid Type & Capacity | Guide',
    descTemplate: 'Find the correct transmission fluid type and capacity for your {make} {model}. Covers automatic and manual transmissions for all years.',
    quickAnswerTemplate: 'The {make} {model} transmission fluid type depends on your transmission — automatic models require the manufacturer-specified ATF. See the year breakdown below.',
    specsForGen: (make, model, gen) => {
      if (gen.endYear >= 2015) return {
        'Automatic Fluid Type': 'Manufacturer-specified ATF (check owner\'s manual)',
        'Auto Drain & Fill': '3.5 - 4.0 quarts',
        'Auto Total Capacity': '7.0 - 12.0 quarts',
        'Manual Fluid Type': 'Manufacturer-specified MTF (if equipped)',
        'Manual Capacity': '2.0 - 3.0 quarts',
        'Change Interval': '60,000 - 100,000 miles (auto), 30,000 - 60,000 (manual)',
      };
      return {
        'Automatic Fluid Type': 'Manufacturer-specified ATF',
        'Auto Drain & Fill': '3.0 - 4.0 quarts',
        'Auto Total Capacity': '7.0 - 12.0 quarts',
        'Manual Fluid Type': 'Manufacturer-specified MTF',
        'Manual Capacity': '2.0 - 3.0 quarts',
        'Change Interval': '30,000 - 60,000 miles',
      };
    },
    notesForGen: (make, model, gen) => [
      'Use ONLY the manufacturer-specified fluid — wrong ATF can damage the transmission',
      'Check transmission fluid level with engine running and at operating temperature',
      'Dark, burnt-smelling fluid indicates overheating — change immediately',
    ],
    faqTemplates: (make, model) => [
      { q: `What transmission fluid does a ${make} ${model} use?`, a: `The ${make} ${model} transmission fluid type depends on the year and transmission. Automatic transmissions require the manufacturer-recommended ATF.` },
    ],
    keywordTemplates: (make, model) => [
      `${make} ${model} transmission fluid`.toLowerCase(),
      `${make} ${model} transmission fluid type`.toLowerCase(),
    ],
  },
  'tire-size': {
    label: 'Tire Size',
    slugSuffix: 'tire-size',
    titleTemplate: '{make} {model} Tire Size | All Years Guide',
    descTemplate: 'Find OEM tire sizes for the {make} {model} by year and trim level.',
    quickAnswerTemplate: 'The {make} {model} tire size varies by year and trim. Check the driver\'s door jamb sticker for your exact factory size.',
    specsForGen: () => ({ 'OEM Tire Size': 'Varies by year and trim — check door jamb sticker', 'Wheel Size': 'Varies by trim level' }),
    notesForGen: () => ['Always match the speed rating and load index of your original tires'],
    faqTemplates: (make, model) => [{ q: `What size tires fit a ${make} ${model}?`, a: `Tire sizes vary by year and trim. Check the driver's door jamb sticker for the exact factory specification.` }],
    keywordTemplates: (make, model) => [`${make} ${model} tire size`.toLowerCase()],
  },
  'serpentine-belt': {
    label: 'Serpentine Belt',
    slugSuffix: 'serpentine-belt',
    titleTemplate: '{make} {model} Serpentine Belt | Routing & Replacement',
    descTemplate: 'Find serpentine belt routing, size, and replacement info for the {make} {model}.',
    quickAnswerTemplate: 'The {make} {model} serpentine belt routing diagram is typically found on a sticker under the hood. Belt size varies by engine.',
    specsForGen: () => ({ 'Belt Type': 'Serpentine (multi-rib)', 'Routing': 'Check under-hood diagram', 'Tensioner': 'Automatic spring-loaded tensioner' }),
    notesForGen: () => ['Replace tensioner pulley at the same time as the belt'],
    faqTemplates: (make, model) => [{ q: `How do I replace the serpentine belt on a ${make} ${model}?`, a: `Use a breaker bar on the tensioner to relieve tension, then slip the old belt off and route the new one according to the under-hood diagram.` }],
    keywordTemplates: (make, model) => [`${make} ${model} serpentine belt`.toLowerCase()],
  },
  'headlight-bulb': {
    label: 'Headlight Bulb Size',
    slugSuffix: 'headlight-bulb',
    titleTemplate: '{make} {model} Headlight Bulb Size | All Years Guide',
    descTemplate: 'Find headlight bulb sizes for the {make} {model} by year and trim.',
    quickAnswerTemplate: 'The {make} {model} headlight bulb size varies by year and trim. Check your owner\'s manual or existing bulb for the exact part number.',
    specsForGen: () => ({ 'Low Beam': 'Varies by year — check existing bulb', 'High Beam': 'Varies by year — check existing bulb', 'Fog Light': 'Varies by trim' }),
    notesForGen: () => ['Never touch halogen bulb glass with bare hands — oils cause hot spots and early failure'],
    faqTemplates: (make, model) => [{ q: `What headlight bulb does a ${make} ${model} use?`, a: `Bulb sizes vary by year and trim. Check your owner's manual or remove the existing bulb to verify the part number.` }],
    keywordTemplates: (make, model) => [`${make} ${model} headlight bulb`.toLowerCase()],
  },
  'fluid-capacity': {
    label: 'Fluid Capacities',
    slugSuffix: 'fluid-capacity',
    titleTemplate: '{make} {model} Fluid Capacities | All Fluids Guide',
    descTemplate: 'Find all fluid capacities for the {make} {model} — engine oil, coolant, transmission, brake, differential, and more.',
    quickAnswerTemplate: 'The {make} {model} fluid capacities vary by engine and year. See the detailed breakdown below for oil, coolant, transmission, brake, and other fluids.',
    specsForGen: (make, model, gen) => ({
      'Engine Oil': 'Varies by engine (typically 4-8+ quarts)',
      'Coolant': 'Varies by engine (typically 6-10 quarts)',
      'Transmission Fluid': 'Varies by transmission (auto: 7-12 quarts total)',
      'Brake Fluid': 'Varies by system (typically 0.5-1.0 quart)',
    }),
    notesForGen: () => ['Always use the manufacturer-specified fluid types'],
    faqTemplates: (make, model) => [{ q: `How much oil does a ${make} ${model} take?`, a: `Oil capacity varies by engine — check the detailed specs below.` }],
    keywordTemplates: (make, model) => [`${make} ${model} fluid capacity`.toLowerCase()],
  },
  'spark-plug-type': {
    label: 'Spark Plug Type',
    slugSuffix: 'spark-plug-type',
    titleTemplate: '{make} {model} Spark Plug Type | All Years Guide',
    descTemplate: 'Find the correct spark plug type, gap, and torque for the {make} {model}.',
    quickAnswerTemplate: 'The {make} {model} spark plug type varies by engine. Most modern engines use iridium or platinum long-life plugs.',
    specsForGen: () => ({ 'Plug Type': 'Iridium or platinum long-life', 'Gap': 'Check service manual (typically 0.039-0.043")', 'Torque': '13-20 ft-lbs (check service manual)' }),
    notesForGen: () => ['Use anti-seize on the threads when installing new plugs'],
    faqTemplates: (make, model) => [{ q: `What spark plugs does a ${make} ${model} use?`, a: `Most modern engines use iridium or platinum long-life plugs. Check your service manual for the exact part number and gap specification.` }],
    keywordTemplates: (make, model) => [`${make} ${model} spark plug`.toLowerCase()],
  },
  'wiper-blade-size': {
    label: 'Wiper Blade Size',
    slugSuffix: 'wiper-blade-size',
    titleTemplate: '{make} {model} Wiper Blade Size | All Years Guide',
    descTemplate: 'Find wiper blade sizes for the {make} {model} — driver side, passenger side, and rear wiper.',
    quickAnswerTemplate: 'The {make} {model} wiper blade sizes vary by year. Driver side is typically 24-26 inches, passenger side 17-19 inches.',
    specsForGen: () => ({ 'Driver Side': 'Typically 24-26" (check existing blade)', 'Passenger Side': 'Typically 17-19"', 'Rear Wiper': 'Typically 10-14" (if equipped)' }),
    notesForGen: () => ['Replace wiper blades every 6-12 months or when streaking occurs'],
    faqTemplates: (make, model) => [{ q: `What size wiper blades fit a ${make} ${model}?`, a: `Driver side is typically 24-26 inches, passenger side 17-19 inches. Verify by checking your existing blades or owner\'s manual.` }],
    keywordTemplates: (make, model) => [`${make} ${model} wiper blade size`.toLowerCase()],
  },
};

function generateToolPage(make: string, model: string, typeKey: string): ToolPage | null {
  const template = TEMPLATES[typeKey];
  if (!template) return null;
  const prodData = VEHICLE_PRODUCTION_YEARS[make]?.[model];
  if (!prodData) return null;
  const slug = `${slugify(make)}-${slugify(model)}-${template.slugSuffix}`;
  const yearRange = `${prodData.start}-${prodData.end}`;
  const genBlocks = splitGenerations(prodData.start, prodData.end);
  const generations: ToolGeneration[] = genBlocks.map(gen => ({
    name: gen.name,
    years: gen.years,
    specs: template.specsForGen(make, model, gen),
    notes: template.notesForGen(make, model, gen),
  }));
  return {
    slug,
    make,
    model,
    toolType: typeKey as ToolType,
    title: template.titleTemplate.replace('{make}', make).replace('{model}', model),
    description: template.descTemplate.replace(/{make}/g, make).replace(/{model}/g, model),
    keywords: template.keywordTemplates(make, model),
    quickAnswer: template.quickAnswerTemplate.replace(/{make}/g, make).replace(/{model}/g, model).replace('{yearRange}', yearRange),
    generations,
    faq: template.faqTemplates(make, model),
  };
}

function generateLegacyPages(): ToolPage[] {
  const pages: ToolPage[] = [];
  const toolTypes = Object.keys(TEMPLATES);
  for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
    if (NOINDEX_MAKES.has(make.toLowerCase())) continue;
    for (const model of Object.keys(models)) {
      if (isNonUsModel(make.toLowerCase(), model.toLowerCase().replace(/\s+/g, '-'))) continue;
      if (isEvModel(make, model)) continue;
      for (const typeKey of toolTypes) {
        const page = generateToolPage(make, model, typeKey);
        if (page) pages.push(page);
      }
    }
  }
  return pages;
}

// ── Main export ──────────────────────────────────────────────────────

/**
 * Generate ALL tool pages.
 * Returns corpus-backed pages first; falls back to legacy templates if corpus is unavailable.
 */
export function generateAllToolPages(): ToolPage[] {
  const corpus = loadCorpusPages();
  if (corpus.length > 0) {
    return corpus;
  }
  console.warn('[tool-machine] No corpus data available — returning legacy template pages');
  return generateLegacyPages();
}

export const TOOL_TYPE_KEYS = Object.keys(TEMPLATES);

export function getToolTypeTemplate(typeKey: string) {
  return TEMPLATES[typeKey] ?? null;
}
