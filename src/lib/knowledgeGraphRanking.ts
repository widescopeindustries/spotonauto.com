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

export function getKnowledgeGraphOverrides(): KnowledgeGraphOverrides {
  return GRAPH_OVERRIDES;
}
