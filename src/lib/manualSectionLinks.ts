import 'server-only';

import type { DTCCode } from '@/data/dtc-codes-data';
import {
  WIRING_SEO_SYSTEMS,
  type WiringSeoVehicle,
  type WiringSystemSlug,
} from '@/data/wiring-seo-cluster';
import type { DiagnosticCrossLink } from '@/lib/diagnosticCrossLinks';
import {
  findDiagnosticTroubleCodeSections,
  findManualSectionsByTerms,
} from '@/lib/manualEmbeddingsStore';

function buildManualUrl(path: string): string {
  const segments = path.split('/').filter(Boolean).map((segment) => encodeURIComponent(decodeURIComponent(segment)));
  return `/manual/${segments.join('/')}`;
}

function clip(value: string, maxLength = 140): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

export async function getManualSectionLinksForCode(code: DTCCode, limit = 4): Promise<DiagnosticCrossLink[]> {
  const rows = await findDiagnosticTroubleCodeSections(code.code, limit);

  return rows.map((row) => ({
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
  const rows = await findManualSectionsByTerms({
    make: vehicle.make,
    year: vehicle.year,
    model: vehicle.model,
    terms: systemMeta.matchTerms,
    limit,
  });

  return rows.map((row) => ({
    href: buildManualUrl(row.path),
    label: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${row.sectionTitle}`,
    description: clip(row.contentPreview || `${systemMeta.shortLabel} references from the OEM service manual for this vehicle.`),
    badge: 'OEM Manual',
  }));
}
