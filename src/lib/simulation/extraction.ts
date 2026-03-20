import { GoogleGenAI } from '@google/genai';
import {
  EnvironmentProfile,
  PersonaProfile,
  PredictionRequirement,
  RealitySeedExtraction,
  RealitySeedInput,
  SimulationEdge,
  SimulationGraph,
  SimulationMemory,
  SimulationNode,
} from '@/lib/simulation/types';
import { clipText, dedupeStrings, safeJsonParse, sentenceSplit, simulationId, slugifySimulationPart } from '@/lib/simulation/utils';

const geminiApiKey = process.env.GEMINI_API_KEY || '';
const genAI = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

interface LlmExtractionPayload {
  environment?: {
    label?: string;
    summary?: string;
    temporalContext?: string;
    pressures?: string[];
    constraints?: string[];
  };
  nodes?: Array<{
    kind?: string;
    label?: string;
    summary?: string;
    attributes?: Record<string, string>;
  }>;
  edges?: Array<{
    from?: string;
    to?: string;
    type?: string;
    weight?: number;
    evidence?: string;
  }>;
  personas?: Array<{
    name?: string;
    role?: string;
    voice?: string;
    goals?: string[];
    fears?: string[];
    publicKnowledge?: string[];
    privateKnowledge?: string[];
  }>;
  memories?: Array<{
    scope?: string;
    owner?: string;
    content?: string;
    salience?: number;
    tags?: string[];
  }>;
  predictionRequirements?: Array<{
    title?: string;
    rationale?: string;
    priority?: 'low' | 'medium' | 'high';
  }>;
}

function inferNodeKind(label: string): SimulationNode['kind'] {
  if (/(inc|corp|llc|agency|department|committee|university|group)$/i.test(label)) return 'organization';
  if (/(city|county|district|valley|harbor|station|school|hospital)$/i.test(label)) return 'place';
  if (/\b(crisis|election|strike|launch|summit|merger|trial)\b/i.test(label)) return 'event';
  if (label.split(' ').length >= 2) return 'person';
  return 'theme';
}

function buildNodeId(label: string): string {
  return `node_${slugifySimulationPart(label) || simulationId('node')}`;
}

function normalizeNode(raw: Partial<SimulationNode>): SimulationNode | null {
  if (!raw.label) return null;

  return {
    id: raw.id || buildNodeId(raw.label),
    kind: raw.kind || inferNodeKind(raw.label),
    label: raw.label,
    summary: raw.summary || `${raw.label} is part of the simulated environment.`,
    attributes: raw.attributes || {},
    memoryIds: raw.memoryIds || [],
  };
}

function buildFallbackExtraction(input: RealitySeedInput): RealitySeedExtraction {
  const sentences = sentenceSplit(input.seedText);
  const candidateLabels = dedupeStrings(
    (input.seedText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) || []).filter((label) => label.length > 3),
  ).slice(0, 12);

  const environmentNode: SimulationNode = {
    id: 'node_environment',
    kind: 'environment',
    label: input.title || 'Simulated Environment',
    summary: clipText(input.seedText, 220),
    attributes: {
      mode: 'fallback-extraction',
    },
    memoryIds: [],
  };

  const nodes: SimulationNode[] = [environmentNode];
  for (const label of candidateLabels) {
    if (label === input.title) continue;
    const node = normalizeNode({ label, kind: inferNodeKind(label), summary: `${label} appears in the seed context.` });
    if (node) nodes.push(node);
  }

  const memories: SimulationMemory[] = sentences.slice(0, 10).map((sentence, index) => ({
    id: simulationId('memory'),
    scope: 'collective',
    content: sentence,
    salience: Math.max(1, 10 - index),
    timestamp: new Date().toISOString(),
    tags: dedupeStrings(sentence.toLowerCase().match(/[a-z]{4,}/g) || []).slice(0, 5),
    source: 'seed',
  }));

  if (input.collectiveMemory?.trim()) {
    memories.unshift({
      id: simulationId('memory'),
      scope: 'collective',
      content: input.collectiveMemory.trim(),
      salience: 10,
      timestamp: new Date().toISOString(),
      tags: ['collective', 'injected'],
      source: 'seed',
    });
  }

  const edges: SimulationEdge[] = [];
  const nodeByLabel = new Map(nodes.map((node) => [node.label, node]));
  for (const sentence of sentences.slice(0, 20)) {
    const mentioned = nodes.filter((node) => node.label !== input.title && sentence.includes(node.label));
    if (mentioned.length < 2) continue;
    const [from, to] = mentioned;
    edges.push({
      id: simulationId('edge'),
      from: from.id,
      to: to.id,
      type: /\b(opposes|conflicts|disputes)\b/i.test(sentence) ? 'conflicts_with' : 'interacts_with',
      weight: 0.6,
      evidence: clipText(sentence, 180),
    });
  }

  const personas: PersonaProfile[] = nodes
    .filter((node) => node.kind === 'person')
    .slice(0, 6)
    .map((node, index) => {
      const relatedMemories = memories
        .filter((memory) => memory.content.includes(node.label))
        .slice(0, 3)
        .map((memory) => memory.id);

      node.memoryIds = relatedMemories;

      return {
        id: `persona_${slugifySimulationPart(node.label) || index}`,
        name: node.label,
        role: index === 0 ? 'Primary actor' : 'Stakeholder',
        voice: 'Concise, observant, and grounded in the seeded world.',
        goals: [`Protect ${input.title || 'the environment'} from instability`, `Advance ${node.label}'s interests`],
        fears: ['Losing influence', 'Being misread by other actors'],
        publicKnowledge: memories.slice(0, 2).map((memory) => memory.content),
        privateKnowledge: memories.filter((memory) => memory.content.includes(node.label)).slice(0, 2).map((memory) => memory.content),
        memoryIds: relatedMemories,
      };
    });

  if (personas.length === 0) {
    personas.push({
      id: 'persona_analyst',
      name: 'Embedded Analyst',
      role: 'Narrative observer',
      voice: 'Analytical, direct, and detail-oriented.',
      goals: ['Track changes in the environment', 'Explain cause-and-effect clearly'],
      fears: ['Missing hidden dependencies'],
      publicKnowledge: memories.slice(0, 3).map((memory) => memory.content),
      privateKnowledge: [],
      memoryIds: memories.slice(0, 2).map((memory) => memory.id),
    });
  }

  const graph: SimulationGraph = { nodes, edges, memories };

  const environment: EnvironmentProfile = {
    label: input.title || 'Simulated Environment',
    summary: clipText(input.seedText, 240),
    temporalContext: 'Seeded from an initial reality snapshot.',
    pressures: dedupeStrings(sentences.flatMap((sentence) => {
      if (/\b(conflict|pressure|shortage|deadline|threat|risk)\b/i.test(sentence)) return [clipText(sentence, 120)];
      return [];
    })).slice(0, 4),
    constraints: ['Derived from initial seed text', 'Updates depend on simulation turns'],
  };

  const predictionRequirements: PredictionRequirement[] = [
    {
      id: simulationId('requirement'),
      title: 'Track shifting alliances',
      rationale: 'The seed contains multiple entities whose relationships can change over time.',
      priority: 'high',
    },
    {
      id: simulationId('requirement'),
      title: 'Track memory drift',
      rationale: 'Collective and individual memories should evolve as the simulation progresses.',
      priority: 'medium',
    },
  ];

  return {
    graph,
    personas,
    environment,
    predictionRequirements,
  };
}

async function buildGeminiExtraction(input: RealitySeedInput): Promise<RealitySeedExtraction | null> {
  if (!genAI) return null;

  const prompt = `Extract a structured simulated world from the reality seed below.

Return strict JSON with keys:
- environment: { label, summary, temporalContext, pressures[], constraints[] }
- nodes: [{ kind, label, summary, attributes }]
- edges: [{ from, to, type, weight, evidence }]
- personas: [{ name, role, voice, goals[], fears[], publicKnowledge[], privateKnowledge[] }]
- memories: [{ scope, owner, content, salience, tags[] }]
- predictionRequirements: [{ title, rationale, priority }]

Rules:
- Keep nodes canonical and deduplicated.
- Prefer person, organization, place, event, artifact, environment, theme for node kinds.
- Use edge labels that read like knowledge-graph relations.
- Generate 3-8 personas when the seed supports them.
- Memories should mix collective and individual memory when available.

Reality seed title: ${input.title}
Collective memory injection: ${input.collectiveMemory || 'none'}
Reality seed text:
${input.seedText.slice(0, 16000)}`;

  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const payload = safeJsonParse<LlmExtractionPayload>((result.text || '').trim().replace(/^```json\s*|```$/g, ''));
    if (!payload) return null;

    const nodes = (payload.nodes || [])
      .map((node) => normalizeNode({
        label: node.label?.trim(),
        kind: (node.kind || inferNodeKind(node.label || '')) as SimulationNode['kind'],
        summary: node.summary?.trim(),
        attributes: node.attributes || {},
      }))
      .filter((node): node is SimulationNode => !!node);

    const nodeLookup = new Map(nodes.map((node) => [node.label, node]));
    const memories: SimulationMemory[] = (payload.memories || [])
      .filter((memory) => memory.content?.trim())
      .map((memory) => {
        const ownerNode = memory.owner ? nodeLookup.get(memory.owner) : null;
        return {
          id: simulationId('memory'),
          scope: memory.scope === 'individual' || memory.scope === 'environmental' || memory.scope === 'derived' ? memory.scope : 'collective',
          ownerId: ownerNode?.id,
          content: memory.content!.trim(),
          salience: Math.min(10, Math.max(1, Number(memory.salience || 5))),
          timestamp: new Date().toISOString(),
          tags: dedupeStrings(memory.tags || []).slice(0, 6),
          source: 'extraction',
        };
      });

    const edges: SimulationEdge[] = (payload.edges || [])
      .map((edge) => {
        const fromNode = edge.from ? nodeLookup.get(edge.from) : null;
        const toNode = edge.to ? nodeLookup.get(edge.to) : null;
        if (!fromNode || !toNode) return null;

        return {
          id: simulationId('edge'),
          from: fromNode.id,
          to: toNode.id,
          type: edge.type?.trim() || 'related_to',
          weight: Math.min(1, Math.max(0.1, Number(edge.weight || 0.7))),
          evidence: clipText(edge.evidence || `${fromNode.label} ${edge.type || 'relates to'} ${toNode.label}`, 180),
        };
      })
      .filter((edge): edge is SimulationEdge => !!edge);

    const personas: PersonaProfile[] = (payload.personas || [])
      .filter((persona) => persona.name?.trim())
      .map((persona) => {
        const matchingNode = nodeLookup.get(persona.name!.trim());
        const memoryIds = memories
          .filter((memory) => memory.ownerId === matchingNode?.id || memory.content.includes(persona.name!.trim()))
          .slice(0, 4)
          .map((memory) => memory.id);

        if (matchingNode) {
          matchingNode.memoryIds = memoryIds;
        }

        return {
          id: `persona_${slugifySimulationPart(persona.name!.trim())}`,
          name: persona.name!.trim(),
          role: persona.role?.trim() || 'Stakeholder',
          voice: persona.voice?.trim() || 'Observant and grounded in the simulation state.',
          goals: dedupeStrings(persona.goals || []).slice(0, 4),
          fears: dedupeStrings(persona.fears || []).slice(0, 4),
          publicKnowledge: dedupeStrings(persona.publicKnowledge || []).slice(0, 4),
          privateKnowledge: dedupeStrings(persona.privateKnowledge || []).slice(0, 4),
          memoryIds,
        };
      });

    const environment: EnvironmentProfile = {
      label: payload.environment?.label?.trim() || input.title,
      summary: payload.environment?.summary?.trim() || clipText(input.seedText, 220),
      temporalContext: payload.environment?.temporalContext?.trim() || 'Seeded from the current reality snapshot.',
      pressures: dedupeStrings(payload.environment?.pressures || []).slice(0, 5),
      constraints: dedupeStrings(payload.environment?.constraints || []).slice(0, 5),
    };

    const predictionRequirements: PredictionRequirement[] = (payload.predictionRequirements || [])
      .filter((requirement) => requirement.title?.trim())
      .map((requirement) => ({
        id: simulationId('requirement'),
        title: requirement.title!.trim(),
        rationale: requirement.rationale?.trim() || 'Derived from the seed and graph state.',
        priority: requirement.priority === 'low' || requirement.priority === 'medium' ? requirement.priority : 'high',
      }));

    if (nodes.length === 0) return null;

    return {
      graph: { nodes, edges, memories },
      personas: personas.length > 0 ? personas : buildFallbackExtraction(input).personas,
      environment,
      predictionRequirements: predictionRequirements.length > 0 ? predictionRequirements : buildFallbackExtraction(input).predictionRequirements,
    };
  } catch (error) {
    console.warn('[SIMULATION] Gemini extraction failed, falling back to deterministic extraction:', error);
    return null;
  }
}

export async function extractRealitySeed(input: RealitySeedInput): Promise<RealitySeedExtraction> {
  const geminiExtraction = await buildGeminiExtraction(input);
  if (geminiExtraction) {
    return geminiExtraction;
  }

  return buildFallbackExtraction(input);
}
