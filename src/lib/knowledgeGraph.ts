import { slugifyRoutePart } from '@/data/vehicles';
import { buildVehicleKey, buildVehicleNodeId } from '@/lib/vehicleIdentity';

export type KnowledgeGraphRelation =
  | 'has-manual'
  | 'has-spec'
  | 'has-tool'
  | 'has-wiring'
  | 'has-code'
  | 'has-vehicle'
  | 'has-repair'
  | 'has-symptom'
  | 'references'
  | 'related';

export interface KnowledgeGraphEvidence {
  source: 'manual-embedding' | 'manual-archive' | 'vector' | 'kv' | 'graph';
  href?: string;
  path?: string;
  snippet?: string;
  matchedTerms?: string[];
  score?: number;
  observedAt?: string;
}

export interface KnowledgeGraphReference {
  nodeId?: string;
  edgeId?: string;
  sourceNodeId?: string;
  targetNodeId?: string;
  vehicleNodeId?: string;
  taskNodeId?: string;
  systemNodeId?: string;
  codeNodeId?: string;
  confidence?: number;
  evidence?: KnowledgeGraphEvidence[];
}

function slugifyGraphPart(value: string): string {
  return slugifyRoutePart(value);
}

export function buildTaskNodeId(task: string): string {
  return `task:${slugifyGraphPart(task)}`;
}

export function buildSymptomNodeId(symptom: string): string {
  return `symptom:${slugifyGraphPart(symptom)}`;
}

export function buildCodeNodeId(code: string): string {
  return `dtc:${code.toUpperCase()}`;
}

export function buildSystemNodeId(system: string): string {
  return `system:${slugifyGraphPart(system)}`;
}

export function buildRepairNodeId(year: string | number, make: string, model: string, task: string): string {
  return `repair:${buildVehicleKey(year, make, model)}:${slugifyGraphPart(task)}`;
}

export function buildWiringNodeId(year: string | number, make: string, model: string, system: string): string {
  return `wiring:${buildVehicleKey(year, make, model)}:${slugifyGraphPart(system)}`;
}

export function buildManualNodeId(path: string): string {
  const normalized = path
    .split('/')
    .filter(Boolean)
    .map((segment) => slugifyGraphPart(decodeURIComponent(segment)))
    .join('/');
  return `manual:${normalized}`;
}

export function buildToolNodeId(href: string): string {
  return `tool:${href
    .replace(/^\/+/, '')
    .split('/')
    .map((segment) => slugifyGraphPart(segment))
    .join('/')}`;
}

export function buildSpecNodeId(scope: string, slug: string): string {
  return `spec:${slugifyGraphPart(scope)}:${slugifyGraphPart(slug)}`;
}

export function buildKnowledgeEdgeId(
  sourceNodeId: string,
  relation: KnowledgeGraphRelation,
  targetNodeId: string,
): string {
  return `${sourceNodeId}->${relation}->${targetNodeId}`;
}

export function buildEdgeReference(args: {
  sourceNodeId: string;
  targetNodeId: string;
  relation: KnowledgeGraphRelation;
  year?: string | number;
  make?: string;
  model?: string;
  task?: string;
  system?: string;
  code?: string;
  confidence?: number;
  evidence?: KnowledgeGraphEvidence[];
}): KnowledgeGraphReference {
  return {
    nodeId: args.targetNodeId,
    edgeId: buildKnowledgeEdgeId(args.sourceNodeId, args.relation, args.targetNodeId),
    sourceNodeId: args.sourceNodeId,
    targetNodeId: args.targetNodeId,
    vehicleNodeId:
      args.year !== undefined && args.make && args.model
        ? buildVehicleNodeId(args.year, args.make, args.model)
        : undefined,
    taskNodeId: args.task ? buildTaskNodeId(args.task) : undefined,
    systemNodeId: args.system ? buildSystemNodeId(args.system) : undefined,
    codeNodeId: args.code ? buildCodeNodeId(args.code) : undefined,
    confidence: args.confidence,
    evidence: args.evidence,
  };
}
