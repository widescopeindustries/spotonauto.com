/**
 * Slug Parser — Reverse-engineer tool page slugs into vehicle identities.
 *
 * Slug format: {make-slug}-{model-slug}-{tool-type}
 * Examples:
 *   kia-sportage-serpentine-belt        → Kia / Sportage / serpentine-belt
 *   land-rover-range-rover-sport-battery-location → Land Rover / Range Rover Sport / battery-location
 *   bmw-3-series-oil-type               → BMW / 3 Series / oil-type
 *   malibu-serpentine-belt              → Chevrolet / Malibu / serpentine-belt (inferred make)
 */

import validatedVehicles from '@/data/validated-vehicles.json';

// ─── Known tool types (must match ToolPage.toolType union) ──────────

export const KNOWN_TOOL_TYPES = [
  'oil-type',
  'battery-location',
  'tire-size',
  'serpentine-belt',
  'headlight-bulb',
  'fluid-capacity',
  'spark-plug-type',
  'wiper-blade-size',
  'coolant-type',
  'transmission-fluid-type',
  'brake-fluid-type',
] as const;

export type KnownToolType = (typeof KNOWN_TOOL_TYPES)[number];

// ─── Types ──────────────────────────────────────────────────────────

interface VehicleYearInfo {
  start: number;
  end: number;
  confirmedYears: number[];
}

export interface ParsedSlug {
  make: string;
  model: string;
  toolType: KnownToolType;
  yearStart: number;
  yearEnd: number;
}

// ─── Build lookup tables from imported JSON ─────────────────────────

const rawData = validatedVehicles as Record<string, Record<string, VehicleYearInfo>>;

const makeList: Array<{ make: string; slug: string }> = [];
const modelMap = new Map<string, Array<{ make: string; model: string; start: number; end: number }>>();
const makeToModels = new Map<string, Array<{ model: string; slug: string; start: number; end: number }>>();

for (const [make, modelObj] of Object.entries(rawData)) {
  const makeSlug = make.toLowerCase().replace(/\s+/g, '-');
  makeList.push({ make, slug: makeSlug });
  makeToModels.set(make, []);

  for (const [model, info] of Object.entries(modelObj)) {
    const modelSlug = model.toLowerCase().replace(/\s+/g, '-');
    if (!modelMap.has(modelSlug)) {
      modelMap.set(modelSlug, []);
    }
    modelMap.get(modelSlug)!.push({
      make,
      model,
      start: info.start,
      end: info.end,
    });
    makeToModels.get(make)!.push({
      model,
      slug: modelSlug,
      start: info.start,
      end: info.end,
    });
  }
}

// Sort makes by slug length descending so "mercedes-benz" matches before "benz"
makeList.sort((a, b) => b.slug.length - a.slug.length);

// ─── Find best model match for a make + model slug ──────────────────

function findBestModelForMake(make: string, modelSlug: string): { model: string; start: number; end: number } | null {
  const candidates = makeToModels.get(make);
  if (!candidates || candidates.length === 0) return null;

  // Try exact match first
  const exact = candidates.find((c) => c.slug === modelSlug);
  if (exact) return { model: exact.model, start: exact.start, end: exact.end };

  // Try prefix match (e.g., "silverado-1500" → "silverado")
  const prefix = candidates.find((c) => modelSlug.startsWith(c.slug + '-') || c.slug.startsWith(modelSlug + '-'));
  if (prefix) return { model: prefix.model, start: prefix.start, end: prefix.end };

  // Try substring match
  const partial = candidates.find((c) => c.slug.includes(modelSlug) || modelSlug.includes(c.slug));
  if (partial) return { model: partial.model, start: partial.start, end: partial.end };

  return null;
}

// ─── Find make by model slug (when make prefix is missing) ──────────

function findMakeByModel(modelSlug: string): { make: string; model: string; start: number; end: number } | null {
  const candidates = modelMap.get(modelSlug);
  if (candidates && candidates.length > 0) {
    const best = candidates.reduce((a, b) => (b.end - b.start > a.end - a.start ? b : a));
    return { make: best.make, model: best.model, start: best.start, end: best.end };
  }

  // Try partial model match across all makes
  for (const [slug, entries] of modelMap.entries()) {
    if (slug.startsWith(modelSlug) || modelSlug.startsWith(slug)) {
      const best = entries.reduce((a, b) => (b.end - b.start > a.end - a.start ? b : a));
      return { make: best.make, model: best.model, start: best.start, end: best.end };
    }
  }

  return null;
}

// ─── Public API ─────────────────────────────────────────────────────

export function parseToolSlug(slug: string): ParsedSlug | null {
  // 1. Match tool type suffix (longest first to avoid partial matches)
  const sortedToolTypes = [...KNOWN_TOOL_TYPES].sort((a, b) => b.length - a.length);
  let matchedToolType: KnownToolType | null = null;
  let vehiclePart = '';

  for (const toolType of sortedToolTypes) {
    const suffix = `-${toolType}`;
    if (slug.endsWith(suffix)) {
      matchedToolType = toolType;
      vehiclePart = slug.slice(0, -suffix.length);
      break;
    }
  }

  if (!matchedToolType || !vehiclePart) return null;

  // 2. Try to match make prefix (longest first)
  let matchedMake: string | null = null;
  let modelPart = '';

  for (const { make, slug: makeSlug } of makeList) {
    const prefix = `${makeSlug}-`;
    if (vehiclePart.startsWith(prefix)) {
      matchedMake = make;
      modelPart = vehiclePart.slice(prefix.length);
      break;
    }
  }

  // 3a. If make matched, find best model for that make
  if (matchedMake && modelPart) {
    const modelMatch = findBestModelForMake(matchedMake, modelPart);
    if (modelMatch) {
      return {
        make: matchedMake,
        model: modelMatch.model,
        toolType: matchedToolType,
        yearStart: modelMatch.start,
        yearEnd: modelMatch.end,
      };
    }
    // If no model match, use the raw model part as a fallback
    return {
      make: matchedMake,
      model: modelPart.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      toolType: matchedToolType,
      yearStart: 1990,
      yearEnd: 2024,
    };
  }

  // 3b. If no make prefix, try to infer make from model
  const inferred = findMakeByModel(vehiclePart);
  if (inferred) {
    return {
      make: inferred.make,
      model: inferred.model,
      toolType: matchedToolType,
      yearStart: inferred.start,
      yearEnd: inferred.end,
    };
  }

  return null;
}

/**
 * Check if a slug looks like it could be a tool page slug.
 * Useful for routing decisions.
 */
export function isPotentialToolSlug(slug: string): boolean {
  return parseToolSlug(slug) !== null;
}
