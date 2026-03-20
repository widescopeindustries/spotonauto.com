#!/usr/bin/env node

import { DTC_CODES } from '../src/data/dtc-codes-data.ts';
import {
  WIRING_SEO_SYSTEMS,
  WIRING_SEO_VEHICLES,
  supportsWiringSystem,
  type WiringSystemSlug,
} from '../src/data/wiring-seo-cluster.ts';
import {
  getCodeLinksForWiringSystem,
  getRepairLinksForCode,
  getRepairLinksForWiringVehicle,
  getWiringLinksForCode,
} from '../src/lib/diagnosticCrossLinks.ts';
import { buildCodeNodeId, buildWiringNodeId } from '../src/lib/knowledgeGraph.ts';
import {
  buildKnowledgeGraphExport,
  type KnowledgeGraphExportBlockInput,
  type KnowledgeGraphExportEdge,
  type KnowledgeGraphExportNode,
} from '../src/lib/knowledgeGraphExport.ts';
import { rankKnowledgeGraphBlocks, type KnowledgeGraphSurface } from '../src/lib/knowledgeGraphRanking.ts';
import { buildVehicleHubGraph } from '../src/lib/vehicleHubGraph.ts';
import { slugifyRoutePart } from '../src/data/vehicles.ts';
import { buildVehicleNodeId } from '../src/lib/vehicleIdentity.ts';
import { buildVehicleHubLinkForWiring, buildVehicleHubLinksForCode } from '../src/lib/vehicleHubLinks.ts';

interface SurfaceSnapshot {
  surface: KnowledgeGraphSurface;
  rootNodeId: string;
  nodes: KnowledgeGraphExportNode[];
  edges: KnowledgeGraphExportEdge[];
}

interface Conflict {
  id: string;
  first: string;
  second: string;
}

interface AuditResult {
  totals: {
    snapshots: number;
    nodes: number;
    edges: number;
    uniqueNodes: number;
    uniqueEdges: number;
  };
  surfaces: Record<string, {
    snapshots: number;
    uniqueNodes: number;
    uniqueEdges: number;
  }>;
  danglingEdges: string[];
  nodeConflicts: {
    count: number;
    samples: Conflict[];
  };
  edgeConflicts: {
    count: number;
    samples: Conflict[];
  };
}

function describeNode(node: KnowledgeGraphExportNode): string {
  return JSON.stringify({
    kind: node.kind,
    label: node.label,
    href: node.href,
  });
}

function describeEdge(edge: KnowledgeGraphExportEdge): string {
  return JSON.stringify({
    source: edge.source,
    target: edge.target,
    targetKind: edge.targetKind,
    href: edge.href,
    label: edge.label,
    description: edge.description,
    badge: edge.badge,
  });
}

function mergeNodeMetadata(
  previous: KnowledgeGraphExportNode,
  next: KnowledgeGraphExportNode,
): { merged: KnowledgeGraphExportNode; conflict: Conflict | null } {
  const keys: Array<keyof KnowledgeGraphExportNode> = ['kind', 'label', 'href'];

  for (const key of keys) {
    const prevValue = previous[key];
    const nextValue = next[key];
    if (prevValue && nextValue && prevValue !== nextValue) {
      return {
        merged: previous,
        conflict: {
          id: previous.id,
          first: describeNode(previous),
          second: describeNode(next),
        },
      };
    }
  }

  return {
    merged: {
      ...previous,
      ...next,
      kind: previous.kind || next.kind,
      label: previous.label || next.label,
      href: previous.href || next.href,
    },
    conflict: null,
  };
}

function mergeEdgeMetadata(
  previous: KnowledgeGraphExportEdge,
  next: KnowledgeGraphExportEdge,
): { merged: KnowledgeGraphExportEdge; conflict: Conflict | null } {
  const keys: Array<keyof KnowledgeGraphExportEdge> = ['source', 'target', 'sourceKind', 'targetKind', 'href', 'label', 'description', 'badge'];

  for (const key of keys) {
    const prevValue = previous[key];
    const nextValue = next[key];
    if (prevValue && nextValue && prevValue !== nextValue) {
      return {
        merged: previous,
        conflict: {
          id: previous.id,
          first: describeEdge(previous),
          second: describeEdge(next),
        },
      };
    }
  }

  return {
    merged: {
      ...previous,
      ...next,
      sourceKind: previous.sourceKind || next.sourceKind,
      targetKind: previous.targetKind || next.targetKind,
      href: previous.href || next.href,
      label: previous.label || next.label,
      description: previous.description || next.description,
      badge: previous.badge || next.badge,
    },
    conflict: null,
  };
}

function buildCodeBlocks(code: (typeof DTC_CODES)[number]): KnowledgeGraphExportBlockInput[] {
  const repairLinks = getRepairLinksForCode(code, 6);
  const wiringLinks = getWiringLinksForCode(code, 6);
  const vehicleHubLinks = buildVehicleHubLinksForCode({
    code: code.code,
    repairLinks,
    wiringLinks,
    manualLinks: [],
    limit: 6,
  });

  return rankKnowledgeGraphBlocks('code', [
    ...(vehicleHubLinks.length > 0 ? [{
      kind: 'vehicle' as const,
      title: 'Exact Vehicle Hubs',
      browseHref: '/repair',
      theme: 'emerald' as const,
      nodes: vehicleHubLinks.map((link) => ({
        ...link,
        targetKind: 'vehicle' as const,
      })),
    }] : []),
    ...(repairLinks.length > 0 ? [{
      kind: 'repair' as const,
      title: 'Exact Repair Workflows',
      browseHref: '/repair',
      theme: 'cyan' as const,
      nodes: repairLinks.map((link) => ({
        ...link,
        targetKind: 'repair' as const,
      })),
    }] : []),
    ...(wiringLinks.length > 0 ? [{
      kind: 'wiring' as const,
      title: 'Wiring Diagram Paths',
      browseHref: '/wiring',
      theme: 'violet' as const,
      nodes: wiringLinks.map((link) => ({
        ...link,
        targetKind: 'wiring' as const,
      })),
    }] : []),
  ]).map((block) => ({
    kind: block.kind,
    title: block.title,
    browseHref: block.browseHref,
    nodes: block.nodes.map((node) => ({
      nodeId: node.nodeId,
      edgeId: node.edgeId,
      sourceNodeId: node.sourceNodeId,
      targetNodeId: node.targetNodeId,
      vehicleNodeId: node.vehicleNodeId,
      taskNodeId: node.taskNodeId,
      systemNodeId: node.systemNodeId,
      codeNodeId: node.codeNodeId,
      href: node.href,
      label: node.label,
      description: node.description,
      badge: node.badge,
      targetKind: node.targetKind,
    })),
  }));
}

function buildWiringBlocks(system: WiringSystemSlug, vehicle: typeof WIRING_SEO_VEHICLES[number]): KnowledgeGraphExportBlockInput[] {
  const relatedRepairLinks = getRepairLinksForWiringVehicle(vehicle, system, 4);
  const relatedCodeLinks = getCodeLinksForWiringSystem(system, 6);
  const vehicleHubLink = buildVehicleHubLinkForWiring({
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    system,
  });

  return rankKnowledgeGraphBlocks('wiring', [
    {
      kind: 'vehicle' as const,
      title: 'Exact Vehicle Hub',
      browseHref: vehicleHubLink.href,
      theme: 'emerald' as const,
      nodes: [{
        ...vehicleHubLink,
        targetKind: 'vehicle' as const,
      }],
    },
    ...(relatedRepairLinks.length > 0 ? [{
      kind: 'repair' as const,
      title: 'Repairs That Intersect This Wiring',
      browseHref: '/repair',
      theme: 'cyan' as const,
      nodes: relatedRepairLinks.map((link) => ({
        ...link,
        targetKind: 'repair' as const,
      })),
    }] : []),
    ...(relatedCodeLinks.length > 0 ? [{
      kind: 'dtc' as const,
      title: 'Likely Trouble Codes for This System',
      browseHref: '/codes',
      theme: 'amber' as const,
      nodes: relatedCodeLinks.map((link) => ({
        ...link,
        targetKind: 'dtc' as const,
      })),
    }] : []),
  ]).map((block) => ({
    kind: block.kind,
    title: block.title,
    browseHref: block.browseHref,
    nodes: block.nodes.map((node) => ({
      nodeId: node.nodeId,
      edgeId: node.edgeId,
      sourceNodeId: node.sourceNodeId,
      targetNodeId: node.targetNodeId,
      vehicleNodeId: node.vehicleNodeId,
      taskNodeId: node.taskNodeId,
      systemNodeId: node.systemNodeId,
      codeNodeId: node.codeNodeId,
      href: node.href,
      label: node.label,
      description: node.description,
      badge: node.badge,
      targetKind: node.targetKind,
    })),
  }));
}

async function collectSnapshots(): Promise<SurfaceSnapshot[]> {
  const snapshots: SurfaceSnapshot[] = [];

  for (const code of DTC_CODES) {
    const exportData = buildKnowledgeGraphExport({
      surface: 'code',
      rootNodeId: buildCodeNodeId(code.code),
      rootKind: 'dtc',
      rootLabel: `${code.code}: ${code.title}`,
      blocks: buildCodeBlocks(code),
    });

    snapshots.push({
      surface: 'code',
      rootNodeId: exportData.rootNodeId,
      nodes: exportData.nodes,
      edges: exportData.edges,
    });
  }

  const systems = Object.keys(WIRING_SEO_SYSTEMS) as WiringSystemSlug[];
  for (const vehicle of WIRING_SEO_VEHICLES) {
    for (const system of systems) {
      if (!supportsWiringSystem(vehicle, system)) continue;

      const exportData = buildKnowledgeGraphExport({
        surface: 'wiring',
        rootNodeId: buildWiringNodeId(vehicle.year, vehicle.make, vehicle.model, system),
        rootKind: 'wiring',
        rootLabel: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${WIRING_SEO_SYSTEMS[system].title}`,
        blocks: buildWiringBlocks(system, vehicle),
      });

      snapshots.push({
        surface: 'wiring',
        rootNodeId: exportData.rootNodeId,
        nodes: exportData.nodes,
        edges: exportData.edges,
      });
    }

    const vehicleHub = await buildVehicleHubGraph({
      year: String(vehicle.year),
      make: slugifyRoutePart(vehicle.make),
      model: slugifyRoutePart(vehicle.model),
      displayMake: vehicle.make,
      displayModel: vehicle.model,
    });
    const rankedGroups = rankKnowledgeGraphBlocks('vehicle', vehicleHub.groups);
    const vehicleExport = buildKnowledgeGraphExport({
      surface: 'vehicle',
      rootNodeId: buildVehicleNodeId(vehicle.year, vehicle.make, vehicle.model),
      rootKind: 'vehicle',
      rootLabel: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      blocks: rankedGroups.map((block) => ({
        kind: block.kind,
        title: block.title,
        browseHref: block.browseHref,
        nodes: block.nodes.map((node) => ({
          nodeId: node.nodeId,
          edgeId: node.edgeId,
          sourceNodeId: node.sourceNodeId,
          targetNodeId: node.targetNodeId,
          vehicleNodeId: node.vehicleNodeId,
          taskNodeId: node.taskNodeId,
          systemNodeId: node.systemNodeId,
          codeNodeId: node.codeNodeId,
          href: node.href,
          label: node.label,
          description: node.description,
          badge: node.badge,
          targetKind: node.kind,
        })),
      })),
    });

    snapshots.push({
      surface: 'vehicle',
      rootNodeId: vehicleExport.rootNodeId,
      nodes: vehicleExport.nodes,
      edges: vehicleExport.edges,
    });
  }

  return snapshots;
}

function auditSnapshots(snapshots: SurfaceSnapshot[]): AuditResult {
  const uniqueNodes = new Map<string, KnowledgeGraphExportNode>();
  const uniqueEdges = new Map<string, KnowledgeGraphExportEdge>();
  const surfaces = new Map<string, { snapshots: number; nodeIds: Set<string>; edgeIds: Set<string> }>();
  const danglingEdges = new Set<string>();
  const nodeConflicts = new Map<string, Conflict>();
  const edgeConflicts = new Map<string, Conflict>();

  let totalNodes = 0;
  let totalEdges = 0;

  for (const snapshot of snapshots) {
    totalNodes += snapshot.nodes.length;
    totalEdges += snapshot.edges.length;

    let surfaceStats = surfaces.get(snapshot.surface);
    if (!surfaceStats) {
      surfaceStats = {
        snapshots: 0,
        nodeIds: new Set<string>(),
        edgeIds: new Set<string>(),
      };
      surfaces.set(snapshot.surface, surfaceStats);
    }
    surfaceStats.snapshots += 1;

    const snapshotNodeIds = new Set(snapshot.nodes.map((node) => node.id));

    for (const node of snapshot.nodes) {
      surfaceStats.nodeIds.add(node.id);
      const previous = uniqueNodes.get(node.id);
      if (previous) {
        const { merged, conflict } = mergeNodeMetadata(previous, node);
        uniqueNodes.set(node.id, merged);
        if (conflict) {
          nodeConflicts.set(`${conflict.id}:${conflict.first}:${conflict.second}`, conflict);
        }
      } else {
        uniqueNodes.set(node.id, node);
      }
    }

    for (const edge of snapshot.edges) {
      surfaceStats.edgeIds.add(edge.id);
      const previous = uniqueEdges.get(edge.id);
      if (previous) {
        const { merged, conflict } = mergeEdgeMetadata(previous, edge);
        uniqueEdges.set(edge.id, merged);
        if (conflict) {
          edgeConflicts.set(`${conflict.id}:${conflict.first}:${conflict.second}`, conflict);
        }
      } else {
        uniqueEdges.set(edge.id, edge);
      }

      if (!snapshotNodeIds.has(edge.source) || !snapshotNodeIds.has(edge.target)) {
        danglingEdges.add(`${snapshot.surface}:${snapshot.rootNodeId}:${edge.id}`);
      }
    }
  }

  return {
    totals: {
      snapshots: snapshots.length,
      nodes: totalNodes,
      edges: totalEdges,
      uniqueNodes: uniqueNodes.size,
      uniqueEdges: uniqueEdges.size,
    },
    surfaces: Object.fromEntries(
      [...surfaces.entries()].map(([surface, stats]) => [
        surface,
        {
          snapshots: stats.snapshots,
          uniqueNodes: stats.nodeIds.size,
          uniqueEdges: stats.edgeIds.size,
        },
      ]),
    ),
    danglingEdges: [...danglingEdges].sort(),
    nodeConflicts: {
      count: nodeConflicts.size,
      samples: [...nodeConflicts.values()].slice(0, 25),
    },
    edgeConflicts: {
      count: edgeConflicts.size,
      samples: [...edgeConflicts.values()].slice(0, 25),
    },
  };
}

async function main(): Promise<void> {
  const snapshots = await collectSnapshots();
  const audit = auditSnapshots(snapshots);
  console.log(JSON.stringify(audit, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
