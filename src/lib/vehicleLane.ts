import 'server-only';

import { findDiagnosticTroubleCodeSections, findVehicleManualSections, type ManualSectionMatchRow } from '@/lib/manualEmbeddingsStore';
import { slugifyRoutePart } from '@/data/vehicles';
import { getVehicleGraphData } from '@/lib/graphQueries';

export interface VehicleLaneContentEntry {
  path: string;
  title: string;
  type: 'dtc' | 'diagnostic' | 'procedure' | 'testing' | 'diagram' | 'location' | 'specification' | 'other';
}

export interface VehicleLaneDtcCode {
  code: string;
  title: string;
  system: string;
  /** Manual path strings used by the code page to fetch content. */
  flowHashes: string[];
  /** Related content: tests, procedures, diagrams in the same system */
  related: VehicleLaneContentEntry[];
}

export interface VehicleLaneSystem {
  name: string;
  slug: string;
  dtcCount: number;
  procedureCount: number;
  diagramCount: number;
  totalCount: number;
  entries: VehicleLaneContentEntry[];
}

export interface VehicleLaneData {
  vehicle: {
    year: string;
    make: string;
    model: string;
    variant: string;
  };
  systems: VehicleLaneSystem[];
  dtcCodes: VehicleLaneDtcCode[];
  totalSystems: number;
  totalContent: number;
  totalDtcCodes: number;
  graph?: {
    procedures: Array<{
      id: string;
      title: string;
      url: string | null;
      system: string;
      component: string | null;
    }>;
    dtcs: Array<{ code: string; description: string | null; component: string }>;
    systems: Array<{ name: string; procedureCount: number }>;
  };
}

const DTC_RE = /^([BPCU]\d{4})$/;
const DTC_TITLE_RE = /\b([BPCU]\d{4})\b/;

function extractCodeFromTitle(title: string): string | null {
  const exact = title.trim().match(DTC_RE);
  if (exact) return exact[1];

  const embedded = title.match(DTC_TITLE_RE);
  if (embedded) return embedded[1];

  return null;
}

function normalizeManualPath(path: string): string[] {
  const trimmed = path.replace(/^\/+/, '').replace(/^manual\//, '');
  return trimmed.split('/').filter(Boolean);
}

function getSystemNameFromRow(row: ManualSectionMatchRow): string {
  const segments = normalizeManualPath(row.path);
  if (segments.length >= 5) return decodeURIComponent(segments[4]);
  if (row.sectionTitle.includes(':')) {
    return row.sectionTitle.split(':')[0].trim();
  }
  return 'General';
}

function classifyEntryType(row: ManualSectionMatchRow): VehicleLaneContentEntry['type'] {
  const text = `${row.sectionTitle} ${row.contentPreview} ${row.contentFull || ''}`.toLowerCase();
  if (/\b(b|c|p|u)\d{4}\b/.test(text)) return 'dtc';
  if (text.includes('diagnostic trouble code') || text.includes('trouble code')) return 'diagnostic';
  if (text.includes('diagram')) return 'diagram';
  if (text.includes('location')) return 'location';
  if (text.includes('specification') || text.includes('specs')) return 'specification';
  if (text.includes('test') || text.includes('inspection')) return 'testing';
  if (text.includes('procedure') || text.includes('remove') || text.includes('replace') || text.includes('install')) return 'procedure';
  return 'other';
}

function toEntry(row: ManualSectionMatchRow): VehicleLaneContentEntry {
  return {
    path: row.path,
    title: row.sectionTitle,
    type: classifyEntryType(row),
  };
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function collectDtcCodes(rows: ManualSectionMatchRow[]): VehicleLaneDtcCode[] {
  const codeMap = new Map<string, VehicleLaneDtcCode>();

  for (const row of rows) {
    const text = `${row.sectionTitle} ${row.contentPreview} ${row.contentFull || ''}`;
    const matches = text.matchAll(/\b([BPCU]\d{4})\b/g);
    const system = getSystemNameFromRow(row);
    const entry = toEntry(row);

    for (const match of matches) {
      const code = match[1];
      const existing = codeMap.get(code);
      if (existing) {
        if (!existing.flowHashes.includes(row.path)) existing.flowHashes.push(row.path);
        if (!existing.related.some((item) => item.path === row.path)) existing.related.push(entry);
      } else {
        codeMap.set(code, {
          code,
          title: row.sectionTitle.replace(/\b([BPCU]\d{4})\b\s*/g, '').trim() || code,
          system,
          flowHashes: [row.path],
          related: [entry],
        });
      }
    }
  }

  return [...codeMap.values()].map((item) => ({
    ...item,
    flowHashes: uniqueSorted(item.flowHashes),
    related: [...item.related].sort((a, b) => a.title.localeCompare(b.title)),
  })).sort((a, b) => a.code.localeCompare(b.code));
}

function buildSystems(rows: ManualSectionMatchRow[]): VehicleLaneSystem[] {
  const systemMap = new Map<string, VehicleLaneSystem>();

  for (const row of rows) {
    const systemName = getSystemNameFromRow(row);
    const current = systemMap.get(systemName) ?? {
      name: systemName,
      slug: slugifyRoutePart(systemName),
      dtcCount: 0,
      procedureCount: 0,
      diagramCount: 0,
      totalCount: 0,
      entries: [],
    };

    const entry = toEntry(row);
    current.entries.push(entry);
    current.totalCount += 1;
    if (entry.type === 'dtc' || entry.type === 'diagnostic') current.dtcCount += 1;
    if (entry.type === 'procedure' || entry.type === 'testing') current.procedureCount += 1;
    if (entry.type === 'diagram') current.diagramCount += 1;

    systemMap.set(systemName, current);
  }

  return [...systemMap.values()]
    .map((system) => ({
      ...system,
      entries: system.entries.sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .sort((a, b) => b.totalCount - a.totalCount || a.name.localeCompare(b.name));
}

function filterRelatedEntries(rows: ManualSectionMatchRow[], systemName: string): VehicleLaneContentEntry[] {
  const relevant = rows.filter((row) => getSystemNameFromRow(row) === systemName);
  return relevant
    .map(toEntry)
    .filter((entry) => entry.type === 'diagram' || entry.type === 'testing' || entry.type === 'procedure' || entry.type === 'location')
    .slice(0, 20);
}

export async function buildVehicleLaneData(
  make: string,
  year: number,
  model: string,
): Promise<VehicleLaneData | null> {
  const rows = await findVehicleManualSections({
    make,
    year,
    model,
    limit: 500,
  });

  if (!rows.length) return null;

  const systems = buildSystems(rows);
  const dtcCodes = collectDtcCodes(rows);

  for (const dtc of dtcCodes) {
    const systemName = dtc.system;
    const related = filterRelatedEntries(rows, systemName);
    dtc.related = uniqueSorted([
      ...dtc.related.map((item) => item.path),
      ...related.map((item) => item.path),
    ]).map((path) => {
      const match = rows.find((row) => row.path === path);
      return match ? toEntry(match) : { path, title: path, type: 'other' as const };
    });
  }

  // Augment with Neo4j graph data
  let graphData: Awaited<ReturnType<typeof getVehicleGraphData>> = null;
  try {
    graphData = await getVehicleGraphData(year, make, model, 20);
  } catch (err) {
    console.warn(`[vehicleLane] Neo4j data unavailable for ${year} ${make} ${model}`, err);
  }

  return {
    vehicle: {
      year: String(year),
      make,
      model,
      variant: model,
    },
    systems,
    dtcCodes,
    totalSystems: systems.length,
    totalContent: rows.length,
    totalDtcCodes: dtcCodes.length,
    graph: graphData ? {
      procedures: graphData.procedures,
      dtcs: graphData.dtcs,
      systems: graphData.systems,
    } : undefined,
  };
}

export async function getVehicleDtcFlow(
  make: string,
  year: number,
  model: string,
  code: string,
): Promise<{
  vehicle: VehicleLaneData['vehicle'];
  code: string;
  flowHashes: string[];
  relatedByType: Record<string, VehicleLaneContentEntry[]>;
} | null> {
  const codeRows = await findDiagnosticTroubleCodeSections(code, 40);
  const filtered = codeRows.filter((row) => {
    const rowMake = row.make.trim().toLowerCase();
    const rowModel = row.model.trim().toLowerCase();
    return row.year === year && rowMake === make.trim().toLowerCase() && rowModel === model.trim().toLowerCase();
  });

  if (!filtered.length) return null;

  const flowHashes = uniqueSorted(filtered.map((row) => row.path));
  const relatedByType: Record<string, VehicleLaneContentEntry[]> = {
    diagram: [],
    procedure: [],
    testing: [],
    location: [],
    description: [],
    'fuse-relay': [],
    specification: [],
  };

  const allRelated = await findVehicleManualSections({
    make,
    year,
    model,
    limit: 500,
  });

  for (const row of allRelated) {
    const entry = toEntry(row);
    const text = `${row.sectionTitle} ${row.contentPreview} ${row.contentFull || ''}`.toLowerCase();
    if (entry.type === 'diagram') relatedByType.diagram.push(entry);
    if (entry.type === 'procedure') relatedByType.procedure.push(entry);
    if (entry.type === 'testing') relatedByType.testing.push(entry);
    if (entry.type === 'location') relatedByType.location.push(entry);
    if (text.includes('fuse') || text.includes('relay')) relatedByType['fuse-relay'].push(entry);
    if (entry.type === 'specification') relatedByType.specification.push(entry);
    if (text.includes('description') || text.includes('symptom')) relatedByType.description.push(entry);
  }

  for (const key of Object.keys(relatedByType)) {
    relatedByType[key] = uniqueSorted(relatedByType[key].map((entry) => entry.path))
      .map((path) => {
        const match = allRelated.find((row) => row.path === path);
        return match ? toEntry(match) : { path, title: path, type: 'other' as const };
      });
  }

  return {
    vehicle: {
      year: String(year),
      make,
      model,
      variant: model,
    },
    code: code.toUpperCase(),
    flowHashes,
    relatedByType,
  };
}
