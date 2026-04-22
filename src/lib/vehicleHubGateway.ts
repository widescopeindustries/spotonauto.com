import 'server-only';

import type { GraphHealthReport } from '@/lib/graphBackboneHealth';
import { buildGraphHealthReport } from '@/lib/graphBackboneHealth';
import { buildVehicleHubGraph, type VehicleHubGraph } from '@/lib/vehicleHubGraph';
import { buildVehicleHubBackboneSignal } from '@/lib/vehicleHubBackboneSignals';
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

function parseTaskFromNodeId(nodeId?: string): string | null {
  if (!nodeId || !nodeId.startsWith('repair:')) return null;
  const parts = nodeId.split(':');
  return parts.length >= 5 ? parts[4] : null;
}

function parseSystemFromNodeId(nodeId?: string): string | null {
  if (!nodeId || !nodeId.startsWith('wiring:')) return null;
  const parts = nodeId.split(':');
  return parts.length >= 5 ? parts[4] : null;
}

async function buildBackbonePrioritizedVehicleGraph(args: VehicleHubGatewayArgs, legacyGraph: VehicleHubGraph): Promise<VehicleHubGraph> {
  const repairGroup = legacyGraph.groups.find((group) => group.kind === 'repair');
  const wiringGroup = legacyGraph.groups.find((group) => group.kind === 'wiring');

  const repairTasks = [...new Set((repairGroup?.nodes || [])
    .map((node) => parseTaskFromNodeId(node.nodeId))
    .filter((value): value is string => Boolean(value)))];
  const wiringSystems = [...new Set((wiringGroup?.nodes || [])
    .map((node) => parseSystemFromNodeId(node.nodeId))
    .filter((value): value is string => Boolean(value)))];

  const signal = await buildVehicleHubBackboneSignal({
    year: args.year,
    make: args.make,
    displayMake: args.displayMake,
    model: args.model,
    displayModel: args.displayModel,
    tasks: repairTasks,
    systems: wiringSystems,
  });

  if (signal.mode !== 'backbone' || signal.evidenceCount === 0) {
    return attachLegacyMeta(legacyGraph, `backbone-no-vehicle-evidence-${signal.backend}`);
  }

  const groups = legacyGraph.groups.map((group) => {
    if (group.kind === 'repair') {
      return {
        ...group,
        nodes: [...group.nodes].sort((left, right) => {
          const leftTask = parseTaskFromNodeId(left.nodeId) || '';
          const rightTask = parseTaskFromNodeId(right.nodeId) || '';
          const leftScore = signal.taskScores[leftTask] || 0;
          const rightScore = signal.taskScores[rightTask] || 0;
          if (leftScore !== rightScore) return rightScore - leftScore;
          return left.label.localeCompare(right.label);
        }),
      };
    }

    if (group.kind === 'wiring') {
      return {
        ...group,
        nodes: [...group.nodes].sort((left, right) => {
          const leftSystem = parseSystemFromNodeId(left.nodeId) || '';
          const rightSystem = parseSystemFromNodeId(right.nodeId) || '';
          const leftScore = signal.systemScores[leftSystem] || 0;
          const rightScore = signal.systemScores[rightSystem] || 0;
          if (leftScore !== rightScore) return rightScore - leftScore;
          return left.label.localeCompare(right.label);
        }),
      };
    }

    return group;
  });

  return {
    ...legacyGraph,
    groups,
    source: {
      mode: 'backbone',
      provider: 'graph-backbone',
      reason: `backbone-vehicle-signal-${signal.backend}`,
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

  try {
    const graph = await buildBackbonePrioritizedVehicleGraph(args, legacyGraph);
    return attachBackboneMeta(graph, health, graph.source?.reason || 'backbone-prioritized');
  } catch {
    return attachLegacyMeta(legacyGraph, 'backbone-prioritization-error-fallback');
  }
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
