import type { KnowledgeGraphKind, KnowledgeGraphSurface } from '@/lib/knowledgeGraphRanking';
import type { KnowledgeGraphReference } from '@/lib/knowledgeGraph';

export interface KnowledgeGraphExportNode extends KnowledgeGraphReference {
  id: string;
  kind: string;
  label?: string;
  href?: string;
}

export interface KnowledgeGraphExportEdge {
  id: string;
  source: string;
  target: string;
  sourceKind?: string;
  targetKind?: string;
  href?: string;
  label?: string;
  description?: string;
  badge?: string;
}

export interface KnowledgeGraphExportNodeInput extends KnowledgeGraphReference {
  href: string;
  label: string;
  description: string;
  badge: string;
  targetKind: KnowledgeGraphKind;
}

export interface KnowledgeGraphExportBlockInput {
  kind: KnowledgeGraphKind;
  title: string;
  browseHref?: string;
  nodes: KnowledgeGraphExportNodeInput[];
}

function inferKindFromNodeId(nodeId: string): string {
  return nodeId.split(':')[0] || 'node';
}

function addNode(map: Map<string, KnowledgeGraphExportNode>, node: KnowledgeGraphExportNode | null) {
  if (!node) return;
  if (!map.has(node.id)) {
    map.set(node.id, node);
  }
}

function addEdge(map: Map<string, KnowledgeGraphExportEdge>, edge: KnowledgeGraphExportEdge | null) {
  if (!edge) return;
  if (!map.has(edge.id)) {
    map.set(edge.id, edge);
  }
}

export function buildKnowledgeGraphExport(args: {
  surface: KnowledgeGraphSurface;
  rootNodeId: string;
  rootKind: string;
  rootLabel: string;
  blocks: KnowledgeGraphExportBlockInput[];
}) {
  const nodes = new Map<string, KnowledgeGraphExportNode>();
  const edges = new Map<string, KnowledgeGraphExportEdge>();

  addNode(nodes, {
    id: args.rootNodeId,
    nodeId: args.rootNodeId,
    kind: args.rootKind,
    label: args.rootLabel,
  });

  for (const block of args.blocks) {
    for (const node of block.nodes) {
      if (node.vehicleNodeId) {
        addNode(nodes, {
          id: node.vehicleNodeId,
          nodeId: node.vehicleNodeId,
          kind: inferKindFromNodeId(node.vehicleNodeId),
        });
      }
      if (node.taskNodeId) {
        addNode(nodes, {
          id: node.taskNodeId,
          nodeId: node.taskNodeId,
          kind: inferKindFromNodeId(node.taskNodeId),
        });
      }
      if (node.systemNodeId) {
        addNode(nodes, {
          id: node.systemNodeId,
          nodeId: node.systemNodeId,
          kind: inferKindFromNodeId(node.systemNodeId),
        });
      }
      if (node.codeNodeId) {
        addNode(nodes, {
          id: node.codeNodeId,
          nodeId: node.codeNodeId,
          kind: inferKindFromNodeId(node.codeNodeId),
        });
      }

      if (!node.nodeId) continue;

      addNode(nodes, {
        id: node.nodeId,
        nodeId: node.nodeId,
        kind: node.targetKind,
        label: node.label,
        href: node.href,
        vehicleNodeId: node.vehicleNodeId,
        taskNodeId: node.taskNodeId,
        systemNodeId: node.systemNodeId,
        codeNodeId: node.codeNodeId,
      });

      addEdge(edges, node.edgeId && node.sourceNodeId && node.targetNodeId ? {
        id: node.edgeId,
        source: node.sourceNodeId,
        target: node.targetNodeId,
        sourceKind: inferKindFromNodeId(node.sourceNodeId),
        targetKind: node.targetKind,
        href: node.href,
        label: node.label,
        description: node.description,
        badge: node.badge,
      } : null);
    }
  }

  return {
    version: 1,
    surface: args.surface,
    rootNodeId: args.rootNodeId,
    generatedAt: new Date().toISOString(),
    nodes: [...nodes.values()],
    edges: [...edges.values()],
  };
}
