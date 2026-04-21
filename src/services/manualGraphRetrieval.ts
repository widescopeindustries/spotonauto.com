import { slugifyRoutePart } from '@/data/vehicles';
import type { KnowledgeGraphEvidence } from '@/lib/knowledgeGraph';
import { findManualSectionsByTerms, type ManualSectionMatchRow } from '@/lib/manualEmbeddingsStore';
import { getRepairTaskProfile } from '@/lib/repairTaskProfiles';
import { scoreVehicleModelMatch } from '@/lib/vehicleIdentity';
import type { GroundingSource } from '@/types';
import { searchManualSections } from './vectorSearch';

export type ManualRetrievalMode = 'graph' | 'hybrid' | 'vector' | 'kv' | 'live' | 'none';

export interface ManualConfidenceGate {
  applied: boolean;
  passed: boolean;
  strict: boolean;
  threshold: number;
  confidence: number;
  reason: string;
}

export interface GraphManualCandidate {
  path: string;
  sectionTitle: string;
  make: string;
  year: number;
  model: string;
  contentPreview: string;
  contentFull: string;
  matchedTerms: string[];
  graphRelevance: number;
  vectorSimilarity: number;
  confidence: number;
  evidence: KnowledgeGraphEvidence[];
}

export interface GraphManualRetrievalResult {
  mode: 'graph' | 'hybrid' | 'none';
  confidence: number;
  candidates: GraphManualCandidate[];
  gate: ManualConfidenceGate;
}

function toDisplayLabel(value: string): string {
  const decoded = decodeURIComponent(String(value || '').replace(/-/g, ' ')).trim();
  if (!decoded) return '';
  return decoded.replace(/\b\w/g, (char) => char.toUpperCase());
}

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function clip(value: string, maxLength = 280): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function normalizeTaskToken(value: string): string {
  return slugifyRoutePart(value).replace(/-/g, ' ').trim();
}

function buildTaskTerms(task: string): string[] {
  const normalizedTask = slugifyRoutePart(task);
  const taskLabel = normalizeTaskToken(task);
  const profile = getRepairTaskProfile(normalizedTask);

  const taskWords = taskLabel
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !['and', 'for', 'with', 'the'].includes(token));

  return uniqueNonEmpty([
    taskLabel,
    ...taskWords,
    ...profile.keywords.map((keyword) => normalizeTaskToken(keyword)),
  ]);
}

function computeGraphRelevance(row: ManualSectionMatchRow, termCount: number): number {
  const fallback = Math.max(1, row.matchedTerms?.length || 0);
  if (typeof row.relevance === 'number' && Number.isFinite(row.relevance)) {
    const normalized = row.relevance / Math.max(termCount, 1);
    return Math.max(0, Math.min(1, normalized));
  }
  return Math.max(0, Math.min(1, fallback / Math.max(termCount, 1)));
}

function computeCandidateConfidence(args: {
  graphRelevance: number;
  vectorSimilarity: number;
  modelScore: number;
  matchedTerms: number;
  termCount: number;
}): number {
  const lexicalCoverage = args.termCount > 0 ? Math.min(1, args.matchedTerms / args.termCount) : 0;
  const base =
    args.graphRelevance * 0.52 +
    args.vectorSimilarity * 0.33 +
    args.modelScore * 0.1 +
    lexicalCoverage * 0.05;
  return Math.max(0, Math.min(1, base));
}

function isHighIntentTask(task: string): boolean {
  const normalized = slugifyRoutePart(task);
  return /(replace|replacement|repair|change|flush|install|diagnose|diagnostic)/.test(normalized);
}

function parseBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function parseNumberEnv(name: string, fallback: number): number {
  const raw = Number(process.env[name] || '');
  if (!Number.isFinite(raw)) return fallback;
  return raw;
}

function evaluateConfidenceGate(args: {
  task: string;
  confidence: number;
  sourceCount: number;
}): ManualConfidenceGate {
  const strict = parseBooleanEnv('GRAPH_RETRIEVAL_STRICT', false);
  const baseThreshold = parseNumberEnv('GRAPH_RETRIEVAL_MIN_CONFIDENCE', 0.43);
  const highIntent = isHighIntentTask(args.task);
  const threshold =
    baseThreshold +
    (highIntent ? 0.05 : 0) +
    (args.sourceCount < 2 ? 0.03 : 0);
  const passed = args.confidence >= threshold;

  if (passed) {
    return {
      applied: true,
      passed: true,
      strict,
      threshold,
      confidence: args.confidence,
      reason: 'confidence-pass',
    };
  }

  return {
    applied: true,
    passed: false,
    strict,
    threshold,
    confidence: args.confidence,
    reason: highIntent ? 'high-intent-confidence-fail' : 'confidence-fail',
  };
}

function toManualSource(candidate: GraphManualCandidate): GroundingSource {
  const segments = candidate.path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)));

  return {
    uri: `https://spotonauto.com/manual/${segments.join('/')}`,
    title: candidate.sectionTitle,
    path: candidate.path,
    snippet: clip(candidate.contentPreview, 220),
    similarity: candidate.vectorSimilarity || candidate.graphRelevance,
    confidence: candidate.confidence,
    matchedTerms: candidate.matchedTerms,
    kind: 'manual',
  };
}

async function findGraphRows(args: {
  make: string;
  year: number;
  model: string;
  terms: string[];
  limit: number;
}): Promise<ManualSectionMatchRow[]> {
  const makeCandidates = uniqueNonEmpty([args.make, toDisplayLabel(args.make)]);
  const modelCandidates = uniqueNonEmpty([args.model, toDisplayLabel(args.model)]);
  const merged = new Map<string, ManualSectionMatchRow>();

  for (const make of makeCandidates) {
    for (const model of modelCandidates) {
      const rows = await findManualSectionsByTerms({
        make,
        year: args.year,
        model,
        terms: args.terms,
        limit: args.limit,
      });

      for (const row of rows) {
        const current = merged.get(row.path);
        if (!current || (row.relevance || 0) > (current.relevance || 0)) {
          merged.set(row.path, row);
        }
      }
    }
  }

  return [...merged.values()]
    .sort((left, right) => (right.relevance || 0) - (left.relevance || 0))
    .slice(0, args.limit);
}

export async function retrieveGraphManualContext(args: {
  year: number;
  make: string;
  model: string;
  task: string;
  maxCandidates?: number;
}): Promise<{
  mode: 'graph' | 'hybrid' | 'none';
  confidence: number;
  gate: ManualConfidenceGate;
  content: string | null;
  sources: GroundingSource[];
  candidates: GraphManualCandidate[];
}> {
  const terms = buildTaskTerms(args.task);
  if (terms.length === 0) {
    return {
      mode: 'none',
      confidence: 0,
      gate: evaluateConfidenceGate({ task: args.task, confidence: 0, sourceCount: 0 }),
      content: null,
      sources: [],
      candidates: [],
    };
  }

  const maxCandidates = Math.max(2, Math.min(args.maxCandidates || 5, 8));
  const graphRows = await findGraphRows({
    make: args.make,
    year: args.year,
    model: args.model,
    terms,
    limit: Math.max(maxCandidates * 2, 8),
  });

  if (graphRows.length === 0) {
    return {
      mode: 'none',
      confidence: 0,
      gate: evaluateConfidenceGate({ task: args.task, confidence: 0, sourceCount: 0 }),
      content: null,
      sources: [],
      candidates: [],
    };
  }

  const vectorResults = await searchManualSections(
    args.task,
    { make: args.make, year: args.year, model: args.model },
    Math.max(maxCandidates * 2, 8),
    0.22,
  );
  const vectorMap = new Map<string, number>(
    (vectorResults || []).map((row) => [row.path, row.similarity]),
  );

  const candidates = graphRows
    .map((row) => {
      const graphRelevance = computeGraphRelevance(row, terms.length);
      const vectorSimilarity = vectorMap.get(row.path) || 0;
      const matchedTerms = row.matchedTerms || [];
      const modelScore = scoreVehicleModelMatch(args.model, row.model) / 100;
      const confidence = computeCandidateConfidence({
        graphRelevance,
        vectorSimilarity,
        modelScore,
        matchedTerms: matchedTerms.length,
        termCount: terms.length,
      });
      const evidence: KnowledgeGraphEvidence[] = [{
        source: 'manual-embedding',
        path: row.path,
        snippet: clip(row.contentPreview, 220),
        matchedTerms: matchedTerms.slice(0, 8),
        score: row.relevance,
        observedAt: new Date().toISOString(),
      }];

      return {
        path: row.path,
        sectionTitle: row.sectionTitle,
        make: row.make,
        year: row.year,
        model: row.model,
        contentPreview: row.contentPreview,
        contentFull: row.contentFull || row.contentPreview,
        matchedTerms,
        graphRelevance,
        vectorSimilarity,
        confidence,
        evidence,
      } satisfies GraphManualCandidate;
    })
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, maxCandidates);

  const aggregateConfidence =
    candidates.length === 0
      ? 0
      : candidates
        .slice(0, Math.min(3, candidates.length))
        .reduce((sum, candidate) => sum + candidate.confidence, 0) /
        Math.min(3, candidates.length);

  const gate = evaluateConfidenceGate({
    task: args.task,
    confidence: aggregateConfidence,
    sourceCount: candidates.length,
  });

  const mode: 'graph' | 'hybrid' = candidates.some((candidate) => candidate.vectorSimilarity > 0)
    ? 'hybrid'
    : 'graph';

  const content = [
    `=== Factory Service Manual Graph Context: ${args.year} ${args.make} ${args.model} ===`,
    ...candidates.map((candidate) => {
      const termText = candidate.matchedTerms.length > 0
        ? `matched terms: ${candidate.matchedTerms.slice(0, 6).join(', ')}`
        : 'matched terms: semantic';
      return `=== ${candidate.sectionTitle} (confidence ${(candidate.confidence * 100).toFixed(0)}%, ${termText}) ===\n${candidate.contentFull}`;
    }),
  ].join('\n\n');

  return {
    mode,
    confidence: aggregateConfidence,
    gate,
    content,
    sources: candidates.map(toManualSource),
    candidates,
  };
}
