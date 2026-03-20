import overrides from '@/data/knowledge-graph-overrides.json';

export type KnowledgeGraphSurface = 'repair' | 'code' | 'wiring' | 'vehicle' | 'symptom';
export type KnowledgeGraphKind = 'manual' | 'spec' | 'tool' | 'wiring' | 'dtc' | 'repair' | 'vehicle';

export interface KnowledgeGraphBlock<TNode = unknown> {
  kind: KnowledgeGraphKind;
  title: string;
  theme: 'cyan' | 'emerald' | 'amber' | 'violet' | 'slate';
  browseHref?: string;
  nodes: TNode[];
}

interface SurfaceOverride {
  groupWeights?: Partial<Record<KnowledgeGraphKind, number>>;
}

interface KnowledgeGraphOverrides {
  surfaces?: Partial<Record<KnowledgeGraphSurface, SurfaceOverride>>;
}

const GRAPH_OVERRIDES = overrides as KnowledgeGraphOverrides;

const DEFAULT_GROUP_WEIGHTS: Record<KnowledgeGraphSurface, Record<KnowledgeGraphKind, number>> = {
  repair: {
    manual: 90,
    spec: 80,
    vehicle: 72,
    tool: 60,
    wiring: 50,
    dtc: 40,
    repair: 30,
  },
  code: {
    manual: 90,
    vehicle: 85,
    repair: 80,
    wiring: 70,
    dtc: 50,
    tool: 30,
    spec: 20,
  },
  wiring: {
    vehicle: 95,
    manual: 90,
    repair: 75,
    dtc: 70,
    wiring: 50,
    tool: 30,
    spec: 20,
  },
  vehicle: {
    vehicle: 100,
    manual: 90,
    repair: 86,
    wiring: 82,
    tool: 74,
    dtc: 68,
    spec: 40,
  },
  symptom: {
    repair: 100,
    dtc: 88,
    vehicle: 76,
    manual: 70,
    wiring: 54,
    tool: 42,
    spec: 18,
  },
};

function getGroupWeight(surface: KnowledgeGraphSurface, kind: KnowledgeGraphKind): number {
  const overrideWeight = GRAPH_OVERRIDES.surfaces?.[surface]?.groupWeights?.[kind];
  if (typeof overrideWeight === 'number') return overrideWeight;
  return DEFAULT_GROUP_WEIGHTS[surface][kind] ?? 0;
}

export function rankKnowledgeGraphBlocks<TNode, TBlock extends KnowledgeGraphBlock<TNode>>(
  surface: KnowledgeGraphSurface,
  blocks: TBlock[],
): TBlock[] {
  return [...blocks].sort((a, b) => {
    const weightDiff = getGroupWeight(surface, b.kind) - getGroupWeight(surface, a.kind);
    if (weightDiff !== 0) return weightDiff;
    const nodeDiff = b.nodes.length - a.nodes.length;
    if (nodeDiff !== 0) return nodeDiff;
    return a.title.localeCompare(b.title);
  });
}

export function getKnowledgeGraphOverrides(): KnowledgeGraphOverrides {
  return GRAPH_OVERRIDES;
}
