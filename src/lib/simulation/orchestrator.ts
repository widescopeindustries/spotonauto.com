import { GoogleGenAI } from '@google/genai';
import { extractRealitySeed } from '@/lib/simulation/extraction';
import { getSimulationRun, saveSimulationRun, updateSimulationRun } from '@/lib/simulation/store';
import {
  PersonaProfile,
  PredictionRequirement,
  RealitySeedInput,
  SimulationChatMessage,
  SimulationMemory,
  SimulationReport,
  SimulationRun,
  SimulationTurn,
} from '@/lib/simulation/types';
import { clipText, dedupeStrings, safeJsonParse, sentenceSplit, simulationId } from '@/lib/simulation/utils';

const geminiApiKey = process.env.GEMINI_API_KEY || '';
const genAI = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

interface GeneratedTurnPayload {
  summary?: string;
  observations?: string[];
  memoryUpdates?: Array<{
    owner?: string;
    content?: string;
    salience?: number;
    tags?: string[];
  }>;
}

interface GeneratedReportPayload {
  headline?: string;
  executiveSummary?: string;
  notableIndividuals?: string[];
  majorShifts?: string[];
  risks?: string[];
  opportunities?: string[];
  toolNotes?: string[];
}

function rankTextScore(haystack: string, terms: string[]): number {
  const normalized = haystack.toLowerCase();
  return terms.reduce((score, term) => score + (normalized.includes(term) ? 1 : 0), 0);
}

export function querySimulationRun(run: SimulationRun, query: string) {
  const terms = dedupeStrings(query.toLowerCase().match(/[a-z0-9]{3,}/g) || []);
  const nodes = [...run.graph.nodes]
    .map((node) => ({
      node,
      score: rankTextScore(`${node.label} ${node.summary} ${Object.values(node.attributes).join(' ')}`, terms),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((item) => item.node);

  const memories = [...run.graph.memories]
    .map((memory) => ({
      memory,
      score: rankTextScore(`${memory.content} ${memory.tags.join(' ')}`, terms) + memory.salience / 10,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((item) => item.memory);

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = run.graph.edges
    .filter((edge) => nodeIds.has(edge.from) || nodeIds.has(edge.to))
    .slice(0, 8);

  return { nodes, memories, edges };
}

function buildContextSnippet(run: SimulationRun, query: string): string {
  const { nodes, memories, edges } = querySimulationRun(run, query);
  const sections: string[] = [];

  if (nodes.length > 0) {
    sections.push(`Nodes:\n${nodes.map((node) => `- ${node.label} (${node.kind}): ${node.summary}`).join('\n')}`);
  }
  if (edges.length > 0) {
    sections.push(`Edges:\n${edges.map((edge) => `- ${edge.type}: ${edge.from} -> ${edge.to} (${edge.evidence})`).join('\n')}`);
  }
  if (memories.length > 0) {
    sections.push(`Memories:\n${memories.map((memory) => `- [${memory.scope}] ${memory.content}`).join('\n')}`);
  }

  return sections.join('\n\n');
}

function attachMemoryUpdates(run: SimulationRun, updates: SimulationMemory[]): SimulationRun {
  if (updates.length === 0) return run;

  const next = {
    ...run,
    graph: {
      ...run.graph,
      memories: [...run.graph.memories, ...updates],
      nodes: run.graph.nodes.map((node) => {
        const matchingIds = updates.filter((memory) => memory.ownerId === node.id).map((memory) => memory.id);
        if (matchingIds.length === 0) return node;
        return {
          ...node,
          memoryIds: dedupeStrings([...node.memoryIds, ...matchingIds]),
        };
      }),
    },
    personas: run.personas.map((persona) => {
      const ownedNode = run.graph.nodes.find((node) => node.label === persona.name);
      const matchingIds = updates.filter((memory) => memory.ownerId === ownedNode?.id).map((memory) => memory.id);
      if (matchingIds.length === 0) return persona;
      return {
        ...persona,
        memoryIds: dedupeStrings([...persona.memoryIds, ...matchingIds]),
      };
    }),
  };

  return next;
}

function buildHeuristicMemories(run: SimulationRun, persona: PersonaProfile, requirement: PredictionRequirement, turnNumber: number, platform: 'gemini' | 'heuristic'): SimulationMemory[] {
  const ownerNode = run.graph.nodes.find((node) => node.label === persona.name);
  const sourceSentence = run.graph.memories[(turnNumber - 1) % Math.max(1, run.graph.memories.length)]?.content || run.environment.summary;

  return [
    {
      id: simulationId('memory'),
      scope: 'derived',
      ownerId: ownerNode?.id,
      content: `${persona.name} updates their assessment during turn ${turnNumber} on ${platform}: ${clipText(sourceSentence, 120)}`,
      salience: Math.max(4, 9 - turnNumber),
      timestamp: new Date().toISOString(),
      tags: dedupeStrings([platform, requirement.title, persona.role]).map((value) => value.toLowerCase()).slice(0, 5),
      source: 'simulation',
    },
  ];
}

async function buildGeminiTurn(run: SimulationRun, turnNumber: number): Promise<SimulationTurn> {
  const leadPersona = run.personas[(turnNumber - 1) % run.personas.length];
  const requirement = run.predictionRequirements[(turnNumber - 1) % run.predictionRequirements.length];
  const heuristicFallback = buildHeuristicTurn(run, turnNumber, 'gemini');

  if (!genAI) {
    return heuristicFallback;
  }

  const prompt = `You are the primary simulation engine for a GraphRAG-backed world model.

Environment:
${run.environment.summary}

Temporal context:
${run.environment.temporalContext}

Lead persona:
- Name: ${leadPersona.name}
- Role: ${leadPersona.role}
- Goals: ${leadPersona.goals.join('; ')}
- Fears: ${leadPersona.fears.join('; ')}

Prediction requirement:
- ${requirement.title}: ${requirement.rationale}

Recent memory context:
${run.graph.memories.slice(-6).map((memory) => `- ${memory.content}`).join('\n')}

Return strict JSON with keys:
- summary
- observations[]
- memoryUpdates[{ owner, content, salience, tags[] }]

Keep it concise and simulation-oriented.`;

  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const payload = safeJsonParse<GeneratedTurnPayload>((result.text || '').trim().replace(/^```json\s*|```$/g, ''));
    if (!payload?.summary) {
      return heuristicFallback;
    }

    const memoryUpdates = (payload.memoryUpdates || []).flatMap((update) => {
      const ownerNode = run.graph.nodes.find((node) => node.label === update.owner);
      if (!update.content?.trim()) return [];
      return [{
        id: simulationId('memory'),
        scope: 'derived' as const,
        ownerId: ownerNode?.id,
        content: update.content.trim(),
        salience: Math.min(10, Math.max(1, Number(update.salience || 6))),
        timestamp: new Date().toISOString(),
        tags: dedupeStrings(update.tags || []).slice(0, 5),
        source: 'simulation' as const,
      }];
    });

    return {
      id: simulationId('turn'),
      platform: 'gemini',
      turnNumber,
      summary: payload.summary.trim(),
      memoryUpdates,
      observations: dedupeStrings(payload.observations || []).slice(0, 5),
    };
  } catch (error) {
    console.warn('[SIMULATION] Gemini turn failed, falling back to heuristic:', error);
    return heuristicFallback;
  }
}

function buildHeuristicTurn(run: SimulationRun, turnNumber: number, platform: 'gemini' | 'heuristic'): SimulationTurn {
  const requirement = run.predictionRequirements[(turnNumber - 1) % run.predictionRequirements.length];
  const focusPersonas = run.personas.slice(0, 3);
  const observations = focusPersonas.map((persona) =>
    `${persona.name} is likely to respond to ${requirement.title.toLowerCase()} with ${persona.goals[0]?.toLowerCase() || 'self-preservation'}.`,
  );

  const memoryUpdates = focusPersonas.flatMap((persona) =>
    buildHeuristicMemories(run, persona, requirement, turnNumber, platform),
  );

  return {
    id: simulationId('turn'),
    platform,
    turnNumber,
    summary: `${platform} platform turn ${turnNumber} forecasts movement around "${requirement.title}" across ${focusPersonas.length} core personas.`,
    memoryUpdates,
    observations,
  };
}

export async function createSimulationRun(input: RealitySeedInput): Promise<SimulationRun> {
  const extraction = await extractRealitySeed(input);
  const run: SimulationRun = {
    id: simulationId('run'),
    title: input.title || 'Untitled Simulation',
    createdAt: new Date().toISOString(),
    sourceText: input.seedText,
    graph: extraction.graph,
    personas: extraction.personas,
    environment: extraction.environment,
    predictionRequirements: extraction.predictionRequirements,
    turns: [],
  };

  return saveSimulationRun(run);
}

export async function startSimulationRun(runId: string, turnCount: number = 2): Promise<SimulationRun | null> {
  const run = getSimulationRun(runId);
  if (!run) return null;

  let current = run;
  for (let turnNumber = 1; turnNumber <= Math.max(1, turnCount); turnNumber++) {
    const [geminiTurn, heuristicTurn] = await Promise.all([
      buildGeminiTurn(current, turnNumber),
      Promise.resolve(buildHeuristicTurn(current, turnNumber, 'heuristic')),
    ]);

    current = attachMemoryUpdates({
      ...current,
      turns: [...current.turns, geminiTurn, heuristicTurn],
      environment: {
        ...current.environment,
        temporalContext: `Simulation advanced to turn ${turnNumber}.`,
      },
    }, [...geminiTurn.memoryUpdates, ...heuristicTurn.memoryUpdates]);
  }

  return updateSimulationRun(runId, () => current);
}

function buildHeuristicReport(run: SimulationRun): SimulationReport {
  const topMemories = [...run.graph.memories]
    .sort((a, b) => b.salience - a.salience)
    .slice(0, 4)
    .map((memory) => memory.content);

  return {
    headline: `${run.title}: simulated environment report`,
    executiveSummary: clipText(
      `${run.environment.summary} Recent changes: ${run.turns.slice(-2).map((turn) => turn.summary).join(' ')}`,
      280,
    ),
    notableIndividuals: run.personas.slice(0, 5).map((persona) => `${persona.name} (${persona.role})`),
    majorShifts: run.turns.slice(-4).map((turn) => turn.summary),
    risks: dedupeStrings([...run.environment.pressures, ...topMemories]).slice(0, 4),
    opportunities: run.predictionRequirements.slice(0, 4).map((requirement) => requirement.title),
    toolNotes: [
      `Graph nodes: ${run.graph.nodes.length}`,
      `Graph edges: ${run.graph.edges.length}`,
      `Memories tracked: ${run.graph.memories.length}`,
      `Simulation turns: ${run.turns.length}`,
    ],
  };
}

export async function generateSimulationReport(runId: string): Promise<SimulationRun | null> {
  const run = getSimulationRun(runId);
  if (!run) return null;

  let report = buildHeuristicReport(run);

  if (genAI) {
    const toolContext = [
      `Environment: ${run.environment.summary}`,
      `Prediction requirements: ${run.predictionRequirements.map((requirement) => requirement.title).join('; ')}`,
      `Recent turns: ${run.turns.slice(-4).map((turn) => turn.summary).join(' | ')}`,
      `Top memories: ${run.graph.memories.slice(-6).map((memory) => memory.content).join(' | ')}`,
    ].join('\n');

    try {
      const result = await genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `You are ReportAgent. Use the tool context below to generate a concise post-simulation report as JSON with keys headline, executiveSummary, notableIndividuals, majorShifts, risks, opportunities, toolNotes.\n\n${toolContext}`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const payload = safeJsonParse<GeneratedReportPayload>((result.text || '').trim().replace(/^```json\s*|```$/g, ''));
      if (payload?.headline && payload.executiveSummary) {
        report = {
          headline: payload.headline.trim(),
          executiveSummary: payload.executiveSummary.trim(),
          notableIndividuals: dedupeStrings(payload.notableIndividuals || []).slice(0, 6),
          majorShifts: dedupeStrings(payload.majorShifts || []).slice(0, 6),
          risks: dedupeStrings(payload.risks || []).slice(0, 6),
          opportunities: dedupeStrings(payload.opportunities || []).slice(0, 6),
          toolNotes: dedupeStrings(payload.toolNotes || []).slice(0, 6),
        };
      }
    } catch (error) {
      console.warn('[SIMULATION] ReportAgent fell back to heuristic report:', error);
    }
  }

  return updateSimulationRun(runId, (current) => ({ ...current, report }));
}

function buildHeuristicPersonaReply(run: SimulationRun, persona: PersonaProfile, message: string): string {
  const context = buildContextSnippet(run, `${persona.name} ${message}`);
  const privateLine = persona.privateKnowledge[0] ? `What I keep to myself: ${persona.privateKnowledge[0]}.` : '';
  return `${persona.name} (${persona.role}) responds in a ${persona.voice.toLowerCase()} tone.\n\nMy priorities are ${persona.goals.join(', ')}. ${privateLine}\n\nBased on the current world state: ${clipText(context || run.environment.summary, 420)}`;
}

function buildHeuristicReportReply(run: SimulationRun, message: string): string {
  const context = buildContextSnippet(run, message);
  const report = run.report || buildHeuristicReport(run);
  return `${report.headline}\n\n${report.executiveSummary}\n\nRelevant graph context:\n${clipText(context || report.majorShifts.join(' '), 420)}`;
}

export async function chatWithSimulationActor(runId: string, actorId: string, messages: SimulationChatMessage[]): Promise<string | null> {
  const run = getSimulationRun(runId);
  if (!run) return null;

  const persona = run.personas.find((item) => item.id === actorId);
  if (!persona) return null;

  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content || '';
  const heuristicReply = buildHeuristicPersonaReply(run, persona, lastUserMessage);

  if (!genAI) {
    return heuristicReply;
  }

  const context = buildContextSnippet(run, `${persona.name} ${lastUserMessage}`);

  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `You are ${persona.name}, a simulated individual in a world model.

Role: ${persona.role}
Voice: ${persona.voice}
Goals: ${persona.goals.join('; ')}
Fears: ${persona.fears.join('; ')}
Public knowledge: ${persona.publicKnowledge.join(' | ')}
Private knowledge: ${persona.privateKnowledge.join(' | ')}

Relevant graph context:
${context || run.environment.summary}

Conversation history:
${messages.slice(-8).map((message) => `${message.role.toUpperCase()}: ${message.content}`).join('\n')}

Reply as the individual. Stay grounded in the simulation.`,
    });

    return (result.text || '').trim() || heuristicReply;
  } catch (error) {
    console.warn('[SIMULATION] Persona chat fell back to heuristic reply:', error);
    return heuristicReply;
  }
}

export async function chatWithReportAgent(runId: string, messages: SimulationChatMessage[]): Promise<string | null> {
  const run = getSimulationRun(runId);
  if (!run) return null;

  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content || '';
  const heuristicReply = buildHeuristicReportReply(run, lastUserMessage);

  if (!genAI) {
    return heuristicReply;
  }

  const context = buildContextSnippet(run, lastUserMessage);
  const report = run.report || buildHeuristicReport(run);

  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `You are ReportAgent for a simulated world.

Current report headline: ${report.headline}
Executive summary: ${report.executiveSummary}
Tool notes: ${report.toolNotes.join('; ')}

Relevant graph context:
${context || run.environment.summary}

Conversation history:
${messages.slice(-8).map((message) => `${message.role.toUpperCase()}: ${message.content}`).join('\n')}

Answer as a post-simulation analyst with direct, evidence-based reasoning.`,
    });

    return (result.text || '').trim() || heuristicReply;
  } catch (error) {
    console.warn('[SIMULATION] ReportAgent chat fell back to heuristic reply:', error);
    return heuristicReply;
  }
}
