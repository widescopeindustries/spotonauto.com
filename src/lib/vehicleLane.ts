import 'server-only';

import { getVehicleFromKV, findRelevantKVContent, type KVVehicleData, type KVContentEntry } from '@/lib/cloudflareKV';
import { slugifyRoutePart } from '@/data/vehicles';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VehicleLaneDtcCode {
  code: string;
  title: string;
  system: string;
  /** Content hashes for the diagnostic flow pages */
  flowHashes: string[];
  /** Related content: tests, procedures, diagrams in the same system */
  related: KVContentEntry[];
}

export interface VehicleLaneSystem {
  name: string;
  slug: string;
  dtcCount: number;
  procedureCount: number;
  diagramCount: number;
  totalCount: number;
  entries: KVContentEntry[];
}

export interface VehicleLaneData {
  vehicle: KVVehicleData['v'];
  systems: VehicleLaneSystem[];
  dtcCodes: VehicleLaneDtcCode[];
  totalSystems: number;
  totalContent: number;
  totalDtcCodes: number;
}

// ─── DTC Code Extraction ─────────────────────────────────────────────────────

const DTC_RE = /^([BPCU]\d{4})$/;
const DTC_TITLE_RE = /\b([BPCU]\d{4})\b/;

/**
 * Extract a DTC code from an entry title.
 * Many entries in the "Testing and Inspection" system have titles like
 * "P0420" or "DTC P0420 Catalyst System Efficiency".
 */
function extractCodeFromTitle(title: string): string | null {
  // Exact match: title IS the code
  const exact = title.trim().match(DTC_RE);
  if (exact) return exact[1];

  // Code embedded in title
  const embedded = title.match(DTC_TITLE_RE);
  if (embedded) return embedded[1];

  return null;
}

// ─── Vehicle Lane Builder ────────────────────────────────────────────────────

/**
 * Build the vehicle lane data from Cloudflare KV.
 * Returns null if the vehicle isn't found in KV.
 */
export async function buildVehicleLaneData(
  make: string,
  year: number,
  model: string,
): Promise<VehicleLaneData | null> {
  const kvData = await getVehicleFromKV(make, year, model);
  if (!kvData) return null;

  const systems: VehicleLaneSystem[] = [];
  const dtcCodeMap = new Map<string, VehicleLaneDtcCode>();

  for (const [systemName, entries] of Object.entries(kvData.sys)) {
    const slug = slugifyRoutePart(systemName);

    let dtcCount = 0;
    let procedureCount = 0;
    let diagramCount = 0;

    for (const entry of entries) {
      if (entry.type === 'dtc' || entry.type === 'diagnostic') {
        dtcCount++;

        // Try to extract a specific DTC code from the title
        const code = extractCodeFromTitle(entry.title);
        if (code) {
          const existing = dtcCodeMap.get(code);
          if (existing) {
            existing.flowHashes.push(entry.hash);
          } else {
            dtcCodeMap.set(code, {
              code,
              title: entry.title.replace(/^[BPCU]\d{4}\s*/, '').trim() || code,
              system: systemName,
              flowHashes: [entry.hash],
              related: [],
            });
          }
        }
      } else if (entry.type === 'procedure' || entry.type === 'testing') {
        procedureCount++;
      } else if (entry.type === 'diagram') {
        diagramCount++;
      }
    }

    systems.push({
      name: systemName,
      slug,
      dtcCount,
      procedureCount,
      diagramCount,
      totalCount: entries.length,
      entries,
    });
  }

  // For each DTC code, find related content in the same system
  // (diagrams, test procedures, locations that might be relevant)
  for (const dtc of dtcCodeMap.values()) {
    const system = systems.find((s) => s.name === dtc.system);
    if (!system) continue;

    dtc.related = system.entries
      .filter(
        (e) =>
          e.type === 'diagram' ||
          e.type === 'testing' ||
          e.type === 'procedure' ||
          e.type === 'location',
      )
      .slice(0, 20);
  }

  // Sort systems by total content (biggest first)
  systems.sort((a, b) => b.totalCount - a.totalCount);

  // Sort DTC codes alphabetically
  const dtcCodes = [...dtcCodeMap.values()].sort((a, b) =>
    a.code.localeCompare(b.code),
  );

  return {
    vehicle: kvData.v,
    systems,
    dtcCodes,
    totalSystems: systems.length,
    totalContent: kvData.cc,
    totalDtcCodes: dtcCodes.length,
  };
}

/**
 * Find the diagnostic flow entries for a specific DTC code on a specific vehicle.
 * Returns the content hashes and related supporting material.
 */
export async function getVehicleDtcFlow(
  make: string,
  year: number,
  model: string,
  code: string,
): Promise<{
  vehicle: KVVehicleData['v'];
  code: string;
  flowHashes: string[];
  relatedByType: Record<string, KVContentEntry[]>;
} | null> {
  const kvData = await getVehicleFromKV(make, year, model);
  if (!kvData) return null;

  const upperCode = code.toUpperCase();
  const flowHashes: string[] = [];
  const relatedByType: Record<string, KVContentEntry[]> = {
    diagram: [],
    procedure: [],
    testing: [],
    location: [],
    description: [],
    'fuse-relay': [],
    specification: [],
  };

  // Find all entries for this code across all systems
  for (const [, entries] of Object.entries(kvData.sys)) {
    for (const entry of entries) {
      // Check if this entry is the diagnostic flow for our code
      if (
        (entry.type === 'dtc' || entry.type === 'diagnostic') &&
        extractCodeFromTitle(entry.title) === upperCode
      ) {
        flowHashes.push(entry.hash);
      }
    }
  }

  if (flowHashes.length === 0) return null;

  // Gather supporting content from all systems
  // The graph will use this to power contextual links at each step
  for (const [, entries] of Object.entries(kvData.sys)) {
    for (const entry of entries) {
      if (entry.type in relatedByType) {
        relatedByType[entry.type].push(entry);
      }
    }
  }

  return {
    vehicle: kvData.v,
    code: upperCode,
    flowHashes,
    relatedByType,
  };
}
