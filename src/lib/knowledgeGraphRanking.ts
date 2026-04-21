import overrides from '@/data/knowledge-graph-overrides.json';

export type KnowledgeGraphSurface = 'repair' | 'code' | 'wiring' | 'vehicle' | 'symptom';
export type KnowledgeGraphKind = 'manual' | 'spec' | 'tool' | 'wiring' | 'dtc' | 'repair' | 'vehicle' | 'symptom';

export interface KnowledgeGraphBlock<TNode = unknown> {
  kind: KnowledgeGraphKind;
  title: string;
  theme: 'cyan' | 'emerald' | 'amber' | 'violet' | 'slate';
  browseHref?: string;
  nodes: TNode[];
}

export interface KnowledgeGraphRankingContext {
  task?: string;
  system?: string;
  code?: string;
  vehicle?: string;
  query?: string;
}

export interface HybridKnowledgeGraphNode {
  kind: KnowledgeGraphKind;
  label?: string;
  description?: string;
  score?: number;
  confidence?: number;
  evidence?: unknown[];
}

interface KnowledgeGraphRankingRuleMatch {
  tasks?: string[];
  systems?: string[];
  codes?: string[];
  keywords?: string[];
}

interface KnowledgeGraphRankingRule {
  when: KnowledgeGraphRankingRuleMatch;
  groupBoosts: Partial<Record<KnowledgeGraphKind, number>>;
  note?: string;
}

interface SurfaceOverride {
  groupWeights?: Partial<Record<KnowledgeGraphKind, number>>;
  contextRules?: KnowledgeGraphRankingRule[];
}

interface KnowledgeGraphOverrides {
  surfaces?: Partial<Record<KnowledgeGraphSurface, SurfaceOverride>>;
}

const GRAPH_OVERRIDES = overrides as KnowledgeGraphOverrides;

const DEFAULT_GROUP_WEIGHTS: Record<KnowledgeGraphSurface, Record<KnowledgeGraphKind, number>> = {
  repair: {
    symptom: 84,
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
    symptom: 84,
    repair: 80,
    wiring: 70,
    dtc: 50,
    tool: 30,
    spec: 20,
  },
  wiring: {
    vehicle: 95,
    manual: 90,
    symptom: 66,
    repair: 75,
    dtc: 70,
    wiring: 50,
    tool: 30,
    spec: 20,
  },
  vehicle: {
    vehicle: 100,
    manual: 90,
    symptom: 78,
    repair: 86,
    wiring: 82,
    tool: 74,
    dtc: 68,
    spec: 40,
  },
  symptom: {
    symptom: 100,
    repair: 100,
    dtc: 88,
    vehicle: 76,
    manual: 70,
    wiring: 54,
    tool: 42,
    spec: 18,
  },
};

function normalizeRankingToken(value: string): string {
  const raw = String(value || '').trim();
  if (!raw) return '';

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }

  return decoded
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[_\s/]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildContextTerms(context?: KnowledgeGraphRankingContext): Set<string> {
  const terms = new Set<string>();
  const rawValues = [context?.task, context?.system, context?.code, context?.vehicle, context?.query];

  for (const value of rawValues) {
    if (!value) continue;
    const normalized = normalizeRankingToken(value);
    if (!normalized) continue;
    terms.add(normalized);
    for (const token of normalized.split('-')) {
      if (token) terms.add(token);
    }
  }

  return terms;
}

function ruleMatches(contextTerms: Set<string>, match: KnowledgeGraphRankingRuleMatch): boolean {
  const selectors = [
    ...(match.tasks || []),
    ...(match.systems || []),
    ...(match.codes || []),
    ...(match.keywords || []),
  ];

  if (!selectors.length) return false;

  return selectors.some((selector) => {
    const normalized = normalizeRankingToken(selector);
    return normalized ? contextTerms.has(normalized) : false;
  });
}

function getGroupWeight(
  surface: KnowledgeGraphSurface,
  kind: KnowledgeGraphKind,
  contextTerms: Set<string>,
): number {
  const surfaceOverride = GRAPH_OVERRIDES.surfaces?.[surface];
  const overrideWeight = surfaceOverride?.groupWeights?.[kind];
  const baseWeight = typeof overrideWeight === 'number' ? overrideWeight : DEFAULT_GROUP_WEIGHTS[surface][kind] ?? 0;

  if (!surfaceOverride?.contextRules?.length || contextTerms.size === 0) {
    return baseWeight;
  }

  let boostedWeight = baseWeight;
  for (const rule of surfaceOverride.contextRules) {
    if (!ruleMatches(contextTerms, rule.when)) continue;
    const boost = rule.groupBoosts?.[kind];
    if (typeof boost === 'number') {
      boostedWeight += boost;
    }
  }

  return boostedWeight;
}

export function rankKnowledgeGraphBlocks<TNode, TBlock extends KnowledgeGraphBlock<TNode>>(
  surface: KnowledgeGraphSurface,
  blocks: TBlock[],
  context?: KnowledgeGraphRankingContext,
): TBlock[] {
  const contextTerms = buildContextTerms(context);

  return [...blocks].sort((a, b) => {
    const weightDiff = getGroupWeight(surface, b.kind, contextTerms) - getGroupWeight(surface, a.kind, contextTerms);
    if (weightDiff !== 0) return weightDiff;
    const nodeDiff = b.nodes.length - a.nodes.length;
    if (nodeDiff !== 0) return nodeDiff;
    return a.title.localeCompare(b.title);
  });
}

function computeContextMatchScore(
  contextTerms: Set<string>,
  node: { label?: string; description?: string },
): number {
  if (contextTerms.size === 0) return 0;
  const terms = buildContextTerms({
    task: node.label,
    query: node.description,
  });
  if (terms.size === 0) return 0;
  let matches = 0;
  for (const token of terms) {
    if (contextTerms.has(token)) matches += 1;
  }
  return matches;
}

export function rankKnowledgeGraphNodesHybrid<TNode extends HybridKnowledgeGraphNode>(
  surface: KnowledgeGraphSurface,
  nodes: TNode[],
  context?: KnowledgeGraphRankingContext,
): TNode[] {
  const contextTerms = buildContextTerms(context);

  return [...nodes].sort((a, b) => {
    const baseA = Number.isFinite(a.score) ? Number(a.score) : 0;
    const baseB = Number.isFinite(b.score) ? Number(b.score) : 0;
    const groupWeightA = getGroupWeight(surface, a.kind, contextTerms) * 0.4;
    const groupWeightB = getGroupWeight(surface, b.kind, contextTerms) * 0.4;
    const confidenceA = (a.confidence || 0) * 100;
    const confidenceB = (b.confidence || 0) * 100;
    const evidenceA = (a.evidence?.length || 0) * 6;
    const evidenceB = (b.evidence?.length || 0) * 6;
    const contextScoreA = computeContextMatchScore(contextTerms, a) * 8;
    const contextScoreB = computeContextMatchScore(contextTerms, b) * 8;
    const totalA = baseA + groupWeightA + confidenceA + evidenceA + contextScoreA;
    const totalB = baseB + groupWeightB + confidenceB + evidenceB + contextScoreB;

    if (totalB !== totalA) return totalB - totalA;
    return (a.label || '').localeCompare(b.label || '');
  });
}

export function getKnowledgeGraphOverrides(): KnowledgeGraphOverrides {
  return GRAPH_OVERRIDES;
}
