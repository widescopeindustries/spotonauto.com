import 'server-only';

import type { ToolPage, ToolType } from '@/data/tools-pages';
import { findManualSectionsByTerms, type ManualSectionMatchRow } from '@/lib/manualEmbeddingsStore';

const TOOL_TERM_MAP: Record<ToolType, string[]> = {
  'oil-type': ['engine oil', 'oil capacity', 'lubrication', 'specifications'],
  'battery-location': ['battery', 'battery removal', 'jump starting', 'charging system'],
  'tire-size': ['tires and wheels', 'specifications', 'wheel and tire'],
  'serpentine-belt': ['drive belt', 'serpentine belt', 'belt routing', 'accessory drive'],
  'headlight-bulb': ['headlamp', 'bulb replacement', 'lighting system', 'exterior lighting'],
  'fluid-capacity': ['fluid capacity', 'capacities', 'specifications', 'maintenance'],
  'spark-plug-type': ['spark plug', 'spark plug gap', 'ignition system', 'tune-up'],
  'wiper-blade-size': ['wiper', 'windshield washer', 'wiper blade', 'visibility'],
  'coolant-type': ['coolant', 'cooling system', 'coolant capacity', 'specifications'],
  'transmission-fluid-type': ['transmission fluid', 'automatic transmission', 'manual transmission', 'capacities'],
};

export interface ToolManualCitation {
  path: string;
  href: string;
  model: string;
  sectionTitle: string;
  contentPreview: string;
}

export interface ToolManualCitationGroup {
  generationLabel: string;
  yearsLabel: string;
  year: number;
  manualIndexHref: string;
  citations: ToolManualCitation[];
}

function buildManualUrl(path: string): string {
  const segments = path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)));
  return `/manual/${segments.join('/')}`;
}

function buildMakeYearIndexHref(make: string, year: number): string {
  return `/manual/${encodeURIComponent(make)}/${year}`;
}

function clip(value: string, maxLength = 185): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function parseRepresentativeYear(yearsLabel: string): number | null {
  const matches = yearsLabel.match(/\b(19|20)\d{2}\b/g);
  if (!matches || matches.length === 0) return null;

  const year = Number(matches[0]);
  return Number.isFinite(year) ? year : null;
}

function buildSearchTerms(page: ToolPage): string[] {
  const baseTerms = TOOL_TERM_MAP[page.toolType] ?? ['specifications'];
  const specKeyTerms = page.generations
    .flatMap((generation) => Object.keys(generation.specs))
    .map((key) => key.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim().toLowerCase())
    .filter((key) => key.length >= 4)
    .slice(0, 6);

  return [...new Set([...baseTerms, ...specKeyTerms])];
}

async function safeFindRows(args: {
  make: string;
  year: number;
  model: string;
  terms: string[];
  limit: number;
}): Promise<ManualSectionMatchRow[]> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return [];
  }

  try {
    return await findManualSectionsByTerms(args);
  } catch (error) {
    console.warn('[toolManualCitations] lookup unavailable', error);
    return [];
  }
}

export function getToolVerificationNote(toolType: ToolType): string {
  switch (toolType) {
    case 'battery-location':
      return 'Battery access can move between the engine bay, cargo floor, cowl, or under-seat trays depending on hybrid hardware and trim.';
    case 'serpentine-belt':
      return 'Belt routing and length change with engine code, accessory package, and tensioner layout. Do not order parts off a generic diagram.';
    case 'spark-plug-type':
      return 'Spark plug type and gap depend on the exact engine. Confirm the engine code before buying plugs or setting the gap.';
    case 'fluid-capacity':
    case 'coolant-type':
    case 'transmission-fluid-type':
    case 'oil-type':
      return 'Fluid type and capacity can change by engine, drivetrain, and transmission. Verify the exact branch before filling anything.';
    case 'headlight-bulb':
      return 'Bulb size can change between reflector, projector, HID, LED, and market-specific housings.';
    case 'wiper-blade-size':
      return 'Blade length can change with body style and rain-sensing packages. Confirm the exact arm setup before ordering.';
    case 'tire-size':
      return 'Wheel and tire sizes change by trim, package, and wheel diameter. Use the door-jamb placard as the final authority.';
    default:
      return 'Exact service data can change by engine, trim, and production date. Verify the exact branch in the factory manual before ordering parts.';
  }
}

export async function getToolManualCitationGroups(
  page: ToolPage,
  options: { groupLimit?: number; citationsPerGroup?: number } = {},
): Promise<ToolManualCitationGroup[]> {
  const groupLimit = options.groupLimit ?? 3;
  const citationsPerGroup = options.citationsPerGroup ?? 2;
  const terms = buildSearchTerms(page);

  const generationTargets = page.generations
    .map((generation) => ({
      generation,
      year: parseRepresentativeYear(generation.years),
    }))
    .filter((entry): entry is { generation: ToolPage['generations'][number]; year: number } => entry.year !== null)
    .slice(0, groupLimit);

  const groups = await Promise.all(
    generationTargets.map(async ({ generation, year }) => {
      const rows = await safeFindRows({
        make: page.make,
        year,
        model: page.model,
        terms,
        limit: citationsPerGroup,
      });

      return {
        generationLabel: generation.name,
        yearsLabel: generation.years,
        year,
        manualIndexHref: buildMakeYearIndexHref(page.make, year),
        citations: rows.map((row) => ({
          path: row.path,
          href: buildManualUrl(row.path),
          model: row.model,
          sectionTitle: row.sectionTitle,
          contentPreview: clip(row.contentPreview),
        })),
      } satisfies ToolManualCitationGroup;
    }),
  );

  return groups.filter((group) => group.citations.length > 0);
}
