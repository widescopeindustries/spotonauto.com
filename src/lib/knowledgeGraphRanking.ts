import overrides from '@/data/knowledge-graph-overrides.json';

export type KnowledgeGraphSurface = 'repair' | 'code' | 'wiring';
export type KnowledgeGraphKind = 'manual' | 'spec' | 'tool' | 'wiring' | 'dtc' | 'repair';

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
    tool: 60,
    wiring: 50,
    dtc: 40,
    repair: 30,
  },
  code: {
    manual: 90,
    repair: 80,
    wiring: 70,
    dtc: 50,
    tool: 30,
    spec: 20,
  },
  wiring: {
    manual: 90,
    repair: 75,
    dtc: 70,
    wiring: 50,
    tool: 30,
    spec: 20,
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
