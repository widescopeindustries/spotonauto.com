import 'server-only';

import type { DTCCode } from '@/data/dtc-codes-data';
import {
  WIRING_SEO_SYSTEMS,
  type WiringSeoVehicle,
  type WiringSystemSlug,
} from '@/data/wiring-seo-cluster';
import type { DiagnosticCrossLink } from '@/lib/diagnosticCrossLinks';
import { getRepairTaskProfile } from '@/lib/repairTaskProfiles';
import {
  findDiagnosticTroubleCodeSections,
  findManualSectionsByTerms,
} from '@/lib/manualEmbeddingsStore';
import {
  buildCodeNodeId,
  buildEdgeReference,
  buildManualNodeId,
  buildRepairNodeId,
  buildWiringNodeId,
} from '@/lib/knowledgeGraph';

function buildManualUrl(path: string): string {
  const segments = path.split('/').filter(Boolean).map((segment) => encodeURIComponent(decodeURIComponent(segment)));
  return `/manual/${segments.join('/')}`;
}

function clip(value: string, maxLength = 140): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

async function safeFindRows<T>(label: string, lookup: () => Promise<T[]>): Promise<T[]> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return [];
  }

  try {
    return await lookup();
  } catch (error) {
    console.warn(`[manualSectionLinks] ${label} lookup unavailable`, error);
    return [];
  }
}

export async function getManualSectionLinksForCode(code: DTCCode, limit = 4): Promise<DiagnosticCrossLink[]> {
  const rows = await safeFindRows(`code:${code.code}`, () => findDiagnosticTroubleCodeSections(code.code, limit));

  return rows.map((row) => ({
    ...buildEdgeReference({
      sourceNodeId: buildCodeNodeId(code.code),
      targetNodeId: buildManualNodeId(row.path),
      relation: 'has-manual',
      year: row.year,
      make: row.make,
      model: row.model,
      code: code.code,
    }),
    href: buildManualUrl(row.path),
    label: `${row.year} ${row.make} ${row.model} ${row.sectionTitle}`,
    description: clip(row.contentPreview || `${code.code} appears in this OEM diagnostic section.`),
    badge: 'OEM Manual',
  }));
}

export async function getManualSectionLinksForWiringVehicle(
  vehicle: WiringSeoVehicle,
  system: WiringSystemSlug,
  limit = 4,
): Promise<DiagnosticCrossLink[]> {
  const systemMeta = WIRING_SEO_SYSTEMS[system];
  const rows = await safeFindRows(
    `wiring:${vehicle.year}-${vehicle.make}-${vehicle.model}-${system}`,
    () =>
      findManualSectionsByTerms({
        make: vehicle.make,
        year: vehicle.year,
        model: vehicle.model,
        terms: systemMeta.matchTerms,
        limit,
      }),
  );

  return rows.map((row) => ({
    ...buildEdgeReference({
      sourceNodeId: buildWiringNodeId(vehicle.year, vehicle.make, vehicle.model, system),
      targetNodeId: buildManualNodeId(row.path),
      relation: 'has-manual',
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      system,
    }),
    href: buildManualUrl(row.path),
    label: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${row.sectionTitle}`,
    description: clip(row.contentPreview || `${systemMeta.shortLabel} references from the OEM service manual for this vehicle.`),
    badge: 'OEM Manual',
  }));
}

// ─── OEM Excerpt support ────────────────────────────────────────────────────

export interface OEMExcerptData {
  path: string;
  make: string;
  year: number;
  model: string;
  sectionTitle: string;
  contentPreview: string;
  manualHref: string;
}

export async function getOEMExcerptsForRepair(args: {
  make: string;
  year: number;
  model: string;
  task: string;
  displayMake: string;
  displayModel: string;
  limit?: number;
}): Promise<OEMExcerptData[]> {
  const profile = getRepairTaskProfile(args.task);
  const taskLabel = args.task.replace(/-/g, ' ');
  const rows = await safeFindRows(
    `excerpt:${args.year}-${args.displayMake}-${args.displayModel}-${args.task}`,
    () =>
      findManualSectionsByTerms({
        make: args.displayMake,
        year: args.year,
        model: args.displayModel,
        terms: [...profile.keywords, taskLabel],
        limit: args.limit || 3,
      }),
  );

  return rows
    .filter((row) => row.contentPreview && row.contentPreview.length > 80)
    .map((row) => ({
      path: row.path,
      make: row.make,
      year: row.year,
      model: row.model,
      sectionTitle: row.sectionTitle,
      contentPreview: row.contentPreview,
      manualHref: buildManualUrl(row.path),
    }));
}

export async function getManualSectionLinksForRepair(args: {
  make: string;
  year: number;
  model: string;
  task: string;
  displayMake: string;
  displayModel: string;
  limit?: number;
}): Promise<DiagnosticCrossLink[]> {
  const profile = getRepairTaskProfile(args.task);
  const taskLabel = args.task.replace(/-/g, ' ');
  const rows = await safeFindRows(
    `repair:${args.year}-${args.displayMake}-${args.displayModel}-${args.task}`,
    () =>
      findManualSectionsByTerms({
        make: args.displayMake,
        year: args.year,
        model: args.displayModel,
        terms: [...profile.keywords, taskLabel],
        limit: args.limit || 4,
      }),
  );

  return rows.map((row) => ({
    ...buildEdgeReference({
      sourceNodeId: buildRepairNodeId(args.year, args.displayMake, args.displayModel, args.task),
      targetNodeId: buildManualNodeId(row.path),
      relation: 'has-manual',
      year: args.year,
      make: args.displayMake,
      model: args.displayModel,
      task: args.task,
    }),
    href: buildManualUrl(row.path),
    label: `${args.year} ${args.displayMake} ${args.displayModel} ${row.sectionTitle}`,
    description: clip(row.contentPreview || `${taskLabel} procedures from the OEM service manual for this vehicle.`),
    badge: 'OEM Manual',
  }));
}
