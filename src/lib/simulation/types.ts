export type SimulationNodeKind =
  | 'person'
  | 'organization'
  | 'place'
  | 'event'
  | 'artifact'
  | 'environment'
  | 'theme';

export interface SimulationMemory {
  id: string;
  scope: 'individual' | 'collective' | 'environmental' | 'derived';
  ownerId?: string;
  content: string;
  salience: number;
  timestamp: string;
  tags: string[];
  source: 'seed' | 'extraction' | 'simulation' | 'report';
}

export interface SimulationNode {
  id: string;
  kind: SimulationNodeKind;
  label: string;
  summary: string;
  attributes: Record<string, string>;
  memoryIds: string[];
}

export interface SimulationEdge {
  id: string;
  from: string;
  to: string;
  type: string;
  weight: number;
  evidence: string;
}

export interface PersonaProfile {
  id: string;
  name: string;
  role: string;
  voice: string;
  goals: string[];
  fears: string[];
  publicKnowledge: string[];
  privateKnowledge: string[];
  memoryIds: string[];
}

export interface EnvironmentProfile {
  label: string;
  summary: string;
  temporalContext: string;
  pressures: string[];
  constraints: string[];
}

export interface PredictionRequirement {
  id: string;
  title: string;
  rationale: string;
  priority: 'low' | 'medium' | 'high';
}

export interface SimulationTurn {
  id: string;
  platform: 'gemini' | 'heuristic';
  turnNumber: number;
  summary: string;
  memoryUpdates: SimulationMemory[];
  observations: string[];
}

export interface SimulationReport {
  headline: string;
  executiveSummary: string;
  notableIndividuals: string[];
  majorShifts: string[];
  risks: string[];
  opportunities: string[];
  toolNotes: string[];
}

export interface SimulationGraph {
  nodes: SimulationNode[];
  edges: SimulationEdge[];
  memories: SimulationMemory[];
}

export interface SimulationRun {
  id: string;
  title: string;
  createdAt: string;
  sourceText: string;
  graph: SimulationGraph;
  personas: PersonaProfile[];
  environment: EnvironmentProfile;
  predictionRequirements: PredictionRequirement[];
  turns: SimulationTurn[];
  report?: SimulationReport;
}

export interface SimulationChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RealitySeedInput {
  title: string;
  seedText: string;
  collectiveMemory?: string;
}

export interface RealitySeedExtraction {
  graph: SimulationGraph;
  personas: PersonaProfile[];
  environment: EnvironmentProfile;
  predictionRequirements: PredictionRequirement[];
}
