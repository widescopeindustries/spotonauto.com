import 'server-only';

import type { GraphHealthReport } from '@/lib/graphBackboneHealth';
import { buildGraphHealthReport } from '@/lib/graphBackboneHealth';
import { buildVehicleHubGraph, type VehicleHubGraph } from '@/lib/vehicleHubGraph';
import {
  buildVehicleHubLinkForWiring,
  buildVehicleHubLinksForCode,
  type VehicleHubLink,
} from '@/lib/vehicleHubLinks';
import type { DiagnosticCrossLink } from '@/lib/diagnosticCrossLinks';

interface VehicleHubGatewayArgs {
  year: string;
  make: string;
  model: string;
  displayMake: string;
  displayModel: string;
}

export interface VehicleHubGatewayMeta {
  mode: 'legacy' | 'backbone';
  provider: string;
  reason: string;
  generatedAt: string;
  graphRoot?: string;
  snapshotAgeHours?: number | null;
  lastSuccessAgeHours?: number | null;
}

function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function isBackboneGatewayEnabled(): boolean {
  if (process.env.NEXT_PHASE === 'phase-production-build') return false;
  return parseBooleanEnv(process.env.GRAPH_BACKBONE_GATEWAY_ENABLED, true);
}

function isBackboneHealthy(report: GraphHealthReport): boolean {
  if (!report.ok) return false;
  if (!report.snapshot || !report.validation) return false;
  if (report.validation.ok === false) return false;
  return true;
}

function attachBackboneMeta(
  graph: VehicleHubGraph,
  report: GraphHealthReport,
  reason: string,
): VehicleHubGraph {
  return {
    ...graph,
    source: {
      mode: 'backbone',
      provider: 'graph-backbone',
      reason,
      generatedAt: report.generatedAt,
      graphRoot: report.graphRoot,
      snapshotAgeHours: report.freshness.snapshotAgeHours,
      lastSuccessAgeHours: report.freshness.lastSuccessAgeHours,
    },
  };
}

function attachLegacyMeta(graph: VehicleHubGraph, reason: string): VehicleHubGraph {
  return {
    ...graph,
    source: {
      ...graph.source,
      mode: 'legacy',
      provider: 'vehicleHubGraph',
      reason,
      generatedAt: new Date().toISOString(),
    },
  };
}

async function resolveVehicleHubGatewayMeta(): Promise<VehicleHubGatewayMeta> {
  if (!isBackboneGatewayEnabled()) {
    return {
      mode: 'legacy',
      provider: 'vehicleHubGraph',
      reason: 'gateway-disabled',
      generatedAt: new Date().toISOString(),
    };
  }

  const health = await buildGraphHealthReport();
  if (!isBackboneHealthy(health)) {
    return {
      mode: 'legacy',
      provider: 'vehicleHubGraph',
      reason: 'backbone-unhealthy-fallback',
      generatedAt: new Date().toISOString(),
      graphRoot: health.graphRoot,
      snapshotAgeHours: health.freshness.snapshotAgeHours,
      lastSuccessAgeHours: health.freshness.lastSuccessAgeHours,
    };
  }

  return {
    mode: 'backbone',
    provider: 'graph-backbone',
    reason: 'health-gated-backbone',
    generatedAt: health.generatedAt,
    graphRoot: health.graphRoot,
    snapshotAgeHours: health.freshness.snapshotAgeHours,
    lastSuccessAgeHours: health.freshness.lastSuccessAgeHours,
  };
}

function attachLinkGatewayMeta(link: VehicleHubLink, meta: VehicleHubGatewayMeta): VehicleHubLink {
  const suffix = meta.mode === 'backbone' ? 'Backbone' : 'Fallback';
  return {
    ...link,
    badge: link.badge.includes(suffix) ? link.badge : `${link.badge} · ${suffix}`,
  };
}

export async function buildVehicleHubGraphViaGateway(args: VehicleHubGatewayArgs): Promise<VehicleHubGraph> {
  const legacyGraph = await buildVehicleHubGraph(args);

  if (!isBackboneGatewayEnabled()) {
    return attachLegacyMeta(legacyGraph, 'gateway-disabled');
  }

  const health = await buildGraphHealthReport();
  if (!isBackboneHealthy(health)) {
    return attachLegacyMeta(legacyGraph, 'backbone-unhealthy-fallback');
  }

  // Vehicle-specific graph retrieval from backbone artifacts is the next cutover.
  // For now, backbone health gates the primary source and legacy graph provides links.
  return attachBackboneMeta(legacyGraph, health, 'health-gated-backbone');
}

export async function buildVehicleHubLinkForWiringViaGateway(args: {
  year: string | number;
  make: string;
  model: string;
  system: string;
}): Promise<VehicleHubLink> {
  const meta = await resolveVehicleHubGatewayMeta();
  const link = buildVehicleHubLinkForWiring(args);
  return attachLinkGatewayMeta(link, meta);
}

export async function buildVehicleHubLinksForCodeViaGateway(args: {
  code: string;
  repairLinks: DiagnosticCrossLink[];
  wiringLinks: DiagnosticCrossLink[];
  manualLinks: DiagnosticCrossLink[];
  limit?: number;
}): Promise<VehicleHubLink[]> {
  // Keep /codes pages static-safe: these routes are pre-rendered and should not
  // trigger runtime health fetches that force a static->dynamic transition.
  const meta: VehicleHubGatewayMeta = isBackboneGatewayEnabled()
    ? {
      mode: 'backbone',
      provider: 'graph-backbone',
      reason: 'code-surface-static-safe',
      generatedAt: new Date().toISOString(),
    }
    : {
      mode: 'legacy',
      provider: 'vehicleHubGraph',
      reason: 'gateway-disabled',
      generatedAt: new Date().toISOString(),
    };
  const links = buildVehicleHubLinksForCode(args);
  return links.map((link) => attachLinkGatewayMeta(link, meta));
}
