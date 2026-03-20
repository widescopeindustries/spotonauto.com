import { DTC_CODES } from '@/data/dtc-codes-data';
import { type SymptomCluster, buildSymptomHref } from '@/data/symptomGraph';
import { getTier1RescuePagesForTask } from '@/data/rescuePriority';
import { type KnowledgeGraphReference, buildCodeNodeId, buildEdgeReference, buildRepairNodeId, buildSymptomNodeId } from '@/lib/knowledgeGraph';
import { buildVehicleNodeId } from '@/lib/vehicleIdentity';

export type SymptomHubKind = 'repair' | 'dtc' | 'vehicle';
export type SymptomHubTheme = 'cyan' | 'amber' | 'emerald';

export interface SymptomHubNode extends KnowledgeGraphReference {
  kind: SymptomHubKind;
  href: string;
  label: string;
  description: string;
  badge: string;
}

export interface SymptomHubGroup {
  kind: SymptomHubKind;
  title: string;
  browseHref?: string;
  theme: SymptomHubTheme;
  nodes: SymptomHubNode[];
}

export interface SymptomHubGraph {
  groups: SymptomHubGroup[];
  totalNodes: number;
  repairCount: number;
  codeCount: number;
  vehicleCount: number;
}

function normalize(value: string): string {
  return value.toLowerCase();
}

function getRepairNodes(cluster: SymptomCluster): SymptomHubNode[] {
  const sourceNodeId = buildSymptomNodeId(cluster.slug);

  return cluster.likelyTasks.map((task) => ({
    ...buildEdgeReference({
      sourceNodeId,
      targetNodeId: buildRepairNodeId('category', 'all', 'vehicles', task),
      relation: 'has-repair',
      task,
    }),
    kind: 'repair',
    href: `/repairs/${task}`,
    label: task.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    description: `Open the repair category that best matches ${cluster.shortLabel.toLowerCase()} complaints.`,
    badge: 'Likely Repair',
  }));
}

function getCodeNodes(cluster: SymptomCluster, limit: number): SymptomHubNode[] {
  const sourceNodeId = buildSymptomNodeId(cluster.slug);
  const symptomTerms = [cluster.label, cluster.shortLabel, ...cluster.aliases, ...cluster.systems]
    .map(normalize);

  return DTC_CODES
    .map((code) => {
      const haystack = normalize([
        code.title,
        code.description,
        code.affectedSystem,
        code.commonFix,
        ...code.symptoms,
        ...code.diagnosticSteps,
      ].join(' '));

      const score = symptomTerms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      return { code, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.code.code.localeCompare(right.code.code))
    .slice(0, Math.max(1, limit))
    .map(({ code }) => ({
      ...buildEdgeReference({
        sourceNodeId,
        targetNodeId: buildCodeNodeId(code.code),
        relation: 'has-code',
        code: code.code,
      }),
      kind: 'dtc',
      href: `/codes/${code.code.toLowerCase()}`,
      label: `${code.code}: ${code.title}`,
      description: code.description,
      badge: 'Related Code',
    }));
}

function getVehicleNodes(cluster: SymptomCluster, limit: number): SymptomHubNode[] {
  const sourceNodeId = buildSymptomNodeId(cluster.slug);
  const seen = new Set<string>();
  const nodes: SymptomHubNode[] = [];

  for (const task of cluster.likelyTasks) {
    for (const entry of getTier1RescuePagesForTask(task)) {
      const key = entry.href;
      if (seen.has(key)) continue;
      seen.add(key);

      nodes.push({
        ...buildEdgeReference({
          sourceNodeId,
          targetNodeId: buildVehicleNodeId(entry.year, entry.make, entry.model),
          relation: 'has-vehicle',
          year: entry.year,
          make: entry.make,
          model: entry.model,
          task,
        }),
        kind: 'vehicle',
        href: entry.href,
        label: `${entry.year} ${entry.make} ${entry.model}`,
        description: `Open an exact repair page tied to this symptom cluster.`,
        badge: 'Exact Vehicle',
      });

      if (nodes.length >= limit) return nodes;
    }
  }

  return nodes;
}

export function buildSymptomHubGraph(cluster: SymptomCluster): SymptomHubGraph {
  const repairNodes = getRepairNodes(cluster);
  const codeNodes = getCodeNodes(cluster, 8);
  const vehicleNodes = getVehicleNodes(cluster, 8);

  const groups: SymptomHubGroup[] = [
    {
      kind: 'repair' as const,
      title: 'Likely Repair Categories',
      browseHref: '/repairs',
      theme: 'cyan' as const,
      nodes: repairNodes,
    },
    {
      kind: 'dtc' as const,
      title: 'Codes Often Seen With This Symptom',
      browseHref: '/codes',
      theme: 'amber' as const,
      nodes: codeNodes,
    },
    {
      kind: 'vehicle' as const,
      title: 'Exact Vehicle Pages To Inspect',
      theme: 'emerald' as const,
      nodes: vehicleNodes,
    },
  ].filter((group) => group.nodes.length > 0);

  return {
    groups,
    totalNodes: groups.reduce((sum, group) => sum + group.nodes.length, 0),
    repairCount: repairNodes.length,
    codeCount: codeNodes.length,
    vehicleCount: vehicleNodes.length,
  };
}

export function getSymptomBrowseHref(cluster: SymptomCluster): string {
  return buildSymptomHref(cluster.slug);
}
