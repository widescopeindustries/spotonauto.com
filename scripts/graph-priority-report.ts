#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { TIER_1_RESCUE_PAGES } from '../src/data/rescuePriority.ts';
import { SYMPTOM_CLUSTERS } from '../src/data/symptomGraph.ts';
import { buildSymptomNodeId } from '../src/lib/knowledgeGraph.ts';
import type { KnowledgeGraphExportNode } from '../src/lib/knowledgeGraphExport.ts';
import { auditSnapshots, collectSnapshots, type SurfaceSnapshot } from './audit-knowledge-graph.ts';

interface GraphNodeStats {
  id: string;
  kind: string;
  label: string;
  href: string | null;
  businessScore: number;
  supportScore: number;
  opportunityScore: number;
  inboundEdges: number;
  outboundEdges: number;
  inboundSurfaceCount: number;
  snapshotCount: number;
  rootSurfaceCount: number;
  isRoot: boolean;
  action: string;
  reasons: string[];
}

interface GraphPriorityReport {
  generatedAt: string;
  totals: {
    snapshots: number;
    uniqueNodes: number;
    uniqueEdges: number;
    hrefNodes: number;
  };
  surfaces: Record<string, {
    snapshots: number;
    uniqueNodes: number;
    uniqueEdges: number;
  }>;
  underlinkedSummary: Record<string, number>;
  topOrphanPages: GraphNodeStats[];
  topUnderlinkedPages: GraphNodeStats[];
  highValueSymptomHubs: GraphNodeStats[];
  tier1RepairSupportGaps: GraphNodeStats[];
  sitemapRecrawlCandidates: GraphNodeStats[];
}

interface NodeAccumulator {
  node: KnowledgeGraphExportNode;
  snapshotKeys: Set<string>;
  rootSurfaces: Set<string>;
  inboundEdges: number;
  outboundEdges: number;
  inboundSurfaces: Set<string>;
  outgoingTargets: Set<string>;
  isRoot: boolean;
}

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const REPORTS_DIR = path.join(ROOT, 'scripts', 'seo-reports');
const RESCUE_URLS = new Set(TIER_1_RESCUE_PAGES.map((entry) => entry.href));
const SYMPTOM_CLUSTER_MAP = new Map(SYMPTOM_CLUSTERS.map((cluster) => [cluster.slug, cluster]));

const BASE_KIND_SCORE: Record<string, number> = {
  repair: 86,
  symptom: 84,
  vehicle: 78,
  dtc: 68,
  wiring: 62,
  tool: 38,
  spec: 34,
  manual: 24,
};

const TASK_SCORE: Record<string, number> = {
  'battery-replacement': 18,
  'alternator-replacement': 17,
  'starter-replacement': 17,
  'brake-pad-replacement': 16,
  'brake-rotor-replacement': 14,
  'serpentine-belt-replacement': 15,
  'thermostat-replacement': 15,
  'water-pump-replacement': 14,
  'spark-plug-replacement': 14,
  'oil-change': 12,
  'radiator-replacement': 12,
  'headlight-bulb-replacement': 8,
  'engine-air-filter-replacement': 7,
  'cabin-air-filter-replacement': 7,
  'oxygen-sensor-replacement': 11,
  'ignition-coil-replacement': 11,
  'fuel-pump-replacement': 10,
  'catalytic-converter-replacement': 10,
  'coolant-flush': 8,
  'transmission-fluid-change': 8,
};

function ensureReportsDir() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function absoluteUrl(href: string | null): string | null {
  if (!href) return null;
  return href.startsWith('http') ? href : `https://spotonauto.com${href}`;
}

function inferHref(node: KnowledgeGraphExportNode): string | null {
  if (node.href) return node.href;
  if (node.kind === 'symptom' && node.id.startsWith('symptom:')) {
    return `/symptoms/${node.id.slice('symptom:'.length)}`;
  }
  if (node.kind === 'dtc' && node.id.startsWith('dtc:')) {
    return `/codes/${node.id.slice('dtc:'.length).toLowerCase()}`;
  }
  return null;
}

function csvEscape(value: string | number): string {
  const raw = String(value ?? '');
  if (raw.includes('"') || raw.includes(',') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function mergeNode(previous: KnowledgeGraphExportNode, next: KnowledgeGraphExportNode): KnowledgeGraphExportNode {
  return {
    ...previous,
    ...next,
    label: previous.label || next.label,
    href: previous.href || next.href,
    kind: previous.kind || next.kind,
  };
}

function parseTaskFromHref(href: string | null): string | null {
  if (!href) return null;
  const exactRepair = href.match(/^\/repair\/\d{4}\/[^/]+\/[^/]+\/([^/?#]+)/);
  if (exactRepair) return exactRepair[1];
  const categoryRepair = href.match(/^\/repairs\/([^/?#]+)/);
  if (categoryRepair) return categoryRepair[1];
  return null;
}

function parseSymptomSlug(href: string | null): string | null {
  if (!href) return null;
  const match = href.match(/^\/symptoms\/([^/?#]+)/);
  return match?.[1] || null;
}

function getActionLabel(kind: string, href: string | null): string {
  if (kind === 'symptom') {
    return 'Strengthen links from homepage, diagnose, code, and repair surfaces';
  }
  if (kind === 'repair') {
    if (href?.startsWith('/repair/')) {
      return 'Add more links from symptom hubs, vehicle hubs, and code pages';
    }
    return 'Promote from symptom hubs, homepage clusters, and vehicle directories';
  }
  if (kind === 'vehicle') {
    return 'Promote from guides, wiring pages, and code pages';
  }
  if (kind === 'dtc') {
    return 'Promote from symptom hubs and repair pages';
  }
  if (kind === 'wiring') {
    return 'Promote from vehicle hubs and exact repair pages';
  }
  return 'Review internal-link support and publishing priority';
}

function getBusinessScore(entry: NodeAccumulator): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const href = entry.node.href || null;
  const task = parseTaskFromHref(href);
  const symptomSlug = parseSymptomSlug(href);
  let score = BASE_KIND_SCORE[entry.node.kind] ?? 20;

  reasons.push(`base:${entry.node.kind}=${score}`);

  if (href?.startsWith('/repair/')) {
    score += 14;
    reasons.push('exact-repair-page:+14');
  } else if (href?.startsWith('/repairs/')) {
    score += 10;
    reasons.push('repair-category:+10');
  } else if (href?.startsWith('/symptoms/')) {
    score += 14;
    reasons.push('symptom-hub:+14');
  } else if (href?.startsWith('/codes/')) {
    score += 8;
    reasons.push('code-page:+8');
  } else if (href?.startsWith('/wiring/')) {
    score += 8;
    reasons.push('wiring-page:+8');
  }

  if (task && TASK_SCORE[task]) {
    score += TASK_SCORE[task];
    reasons.push(`task:${task}:+${TASK_SCORE[task]}`);
  }

  if (href && RESCUE_URLS.has(href)) {
    score += 28;
    reasons.push('tier1-rescue:+28');
  }

  if (symptomSlug) {
    const cluster = SYMPTOM_CLUSTER_MAP.get(symptomSlug);
    if (cluster) {
      const symptomTaskBonus = Math.max(
        ...cluster.likelyTasks.map((taskName) => TASK_SCORE[taskName] || 6),
        6,
      );
      score += symptomTaskBonus;
      reasons.push(`symptom-task-bonus:+${symptomTaskBonus}`);
      score += Math.min(cluster.likelyTasks.length * 2, 8);
      reasons.push(`symptom-coverage:+${Math.min(cluster.likelyTasks.length * 2, 8)}`);
    }
  }

  return { score, reasons };
}

function getSupportScore(entry: NodeAccumulator): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const inboundEdgeScore = Math.min(entry.inboundEdges * 9, 36);
  const surfaceScore = Math.min(entry.inboundSurfaces.size * 6, 24);
  const snapshotScore = Math.min(Math.max(entry.snapshotKeys.size - 1, 0) * 2, 10);
  const rootPenalty = entry.isRoot ? 0 : 0;
  const score = inboundEdgeScore + surfaceScore + snapshotScore + rootPenalty;

  reasons.push(`inbound-edges:${entry.inboundEdges}->${inboundEdgeScore}`);
  reasons.push(`inbound-surfaces:${entry.inboundSurfaces.size}->${surfaceScore}`);
  reasons.push(`snapshot-reuse:${entry.snapshotKeys.size}->${snapshotScore}`);

  return { score, reasons };
}

function isMeaningfulHrefNode(entry: NodeAccumulator): boolean {
  const href = inferHref(entry.node);
  if (!href) return false;
  return !href.startsWith('#');
}

function toStats(entry: NodeAccumulator): GraphNodeStats {
  const business = getBusinessScore(entry);
  const support = getSupportScore(entry);
  const orphanBonus = entry.inboundEdges === 0 ? 18 : entry.inboundEdges === 1 ? 8 : 0;
  const opportunityScore = Math.max(business.score - support.score + orphanBonus, 0);

  return {
    id: entry.node.id,
    kind: entry.node.kind,
    label: entry.node.label || entry.node.id,
    href: absoluteUrl(inferHref(entry.node)),
    businessScore: business.score,
    supportScore: support.score,
    opportunityScore,
    inboundEdges: entry.inboundEdges,
    outboundEdges: entry.outboundEdges,
    inboundSurfaceCount: entry.inboundSurfaces.size,
    snapshotCount: entry.snapshotKeys.size,
    rootSurfaceCount: entry.rootSurfaces.size,
    isRoot: entry.isRoot,
    action: getActionLabel(entry.node.kind, entry.node.href || null),
    reasons: [...business.reasons, ...support.reasons],
  };
}

function sortByOpportunity(items: GraphNodeStats[]): GraphNodeStats[] {
  return [...items].sort((left, right) =>
    right.opportunityScore - left.opportunityScore ||
    right.businessScore - left.businessScore ||
    left.label.localeCompare(right.label),
  );
}

function buildIndex(snapshots: SurfaceSnapshot[]): Map<string, NodeAccumulator> {
  const nodes = new Map<string, NodeAccumulator>();

  function ensure(id: string): NodeAccumulator {
    let entry = nodes.get(id);
    if (!entry) {
      entry = {
        node: { id, nodeId: id, kind: id.split(':')[0] || 'node' },
        snapshotKeys: new Set<string>(),
        rootSurfaces: new Set<string>(),
        inboundEdges: 0,
        outboundEdges: 0,
        inboundSurfaces: new Set<string>(),
        outgoingTargets: new Set<string>(),
        isRoot: false,
      };
      nodes.set(id, entry);
    }
    return entry;
  }

  for (const snapshot of snapshots) {
    const snapshotKey = `${snapshot.surface}:${snapshot.rootNodeId}`;

    for (const node of snapshot.nodes) {
      const entry = ensure(node.id);
      entry.node = mergeNode(entry.node, node);
      entry.snapshotKeys.add(snapshotKey);
      if (node.id === snapshot.rootNodeId) {
        entry.isRoot = true;
        entry.rootSurfaces.add(snapshot.surface);
      }
    }

    for (const edge of snapshot.edges) {
      const source = ensure(edge.source);
      const target = ensure(edge.target);
      source.outboundEdges += 1;
      source.outgoingTargets.add(edge.target);
      target.inboundEdges += 1;
      target.inboundSurfaces.add(snapshot.surface);
    }
  }

  return nodes;
}

function buildSymptomHubStats(nodeIndex: Map<string, NodeAccumulator>): GraphNodeStats[] {
  return SYMPTOM_CLUSTERS.map((cluster) => {
    const existing = nodeIndex.get(buildSymptomNodeId(cluster.slug));
    const synthetic: NodeAccumulator = existing || {
      node: {
        id: buildSymptomNodeId(cluster.slug),
        nodeId: buildSymptomNodeId(cluster.slug),
        kind: 'symptom',
        label: cluster.label,
        href: `/symptoms/${cluster.slug}`,
      },
      snapshotKeys: new Set<string>(['symptom-registry']),
      rootSurfaces: new Set<string>(['symptom']),
      inboundEdges: 0,
      outboundEdges: 0,
      inboundSurfaces: new Set<string>(),
      outgoingTargets: new Set<string>(),
      isRoot: true,
    };

    synthetic.node = {
      ...synthetic.node,
      kind: 'symptom',
      label: synthetic.node.label || cluster.label,
      href: synthetic.node.href || `/symptoms/${cluster.slug}`,
    };

    return toStats(synthetic);
  });
}

function renderMarkdown(report: GraphPriorityReport): string {
  function renderSection(title: string, items: GraphNodeStats[], limit = 12): string {
    const lines = [`## ${title}`];
    if (items.length === 0) {
      lines.push('', 'No items found.');
      return lines.join('\n');
    }

    for (const item of items.slice(0, limit)) {
      lines.push(
        '',
        `- ${item.label}`,
        `  - kind: ${item.kind}`,
        `  - url: ${item.href || 'n/a'}`,
        `  - opportunity: ${item.opportunityScore}`,
        `  - business: ${item.businessScore}`,
        `  - support: ${item.supportScore}`,
        `  - inbound edges: ${item.inboundEdges}`,
        `  - inbound surfaces: ${item.inboundSurfaceCount}`,
        `  - action: ${item.action}`,
      );
    }

    return lines.join('\n');
  }

  return [
    `# Graph Priority Report`,
    ``,
    `Generated: ${report.generatedAt}`,
    ``,
    `## Totals`,
    ``,
    `- snapshots: ${report.totals.snapshots}`,
    `- unique nodes: ${report.totals.uniqueNodes}`,
    `- unique edges: ${report.totals.uniqueEdges}`,
    `- href nodes: ${report.totals.hrefNodes}`,
    ``,
    `## Underlinked Summary`,
    ``,
    ...Object.entries(report.underlinkedSummary).map(([kind, count]) => `- ${kind}: ${count}`),
    ``,
    renderSection('Top Orphan Pages', report.topOrphanPages),
    ``,
    renderSection('Top Underlinked Pages', report.topUnderlinkedPages),
    ``,
    renderSection('High-Value Symptom Hubs', report.highValueSymptomHubs),
    ``,
    renderSection('Tier 1 Repair Support Gaps', report.tier1RepairSupportGaps),
    ``,
    renderSection('Sitemap / Recrawl Candidates', report.sitemapRecrawlCandidates),
    ``,
  ].join('\n');
}

async function main(): Promise<void> {
  ensureReportsDir();

  const snapshots = await collectSnapshots();
  const audit = auditSnapshots(snapshots);
  const nodeIndex = buildIndex(snapshots);
  const hrefNodes = [...nodeIndex.values()]
    .filter(isMeaningfulHrefNode)
    .map(toStats);
  const symptomHubStats = buildSymptomHubStats(nodeIndex);

  const topOrphanPages = sortByOpportunity(
    hrefNodes.filter((node) => node.inboundEdges === 0 && node.businessScore >= 60),
  ).slice(0, 25);

  const topUnderlinkedPages = sortByOpportunity(
    hrefNodes.filter((node) => node.inboundEdges <= 1 && node.businessScore >= 70),
  ).slice(0, 40);

  const highValueSymptomHubs = sortByOpportunity(
    symptomHubStats,
  ).slice(0, 15);

  const tier1RepairSupportGaps = sortByOpportunity(
    hrefNodes.filter((node) => node.href && RESCUE_URLS.has(node.href.replace('https://spotonauto.com', ''))),
  ).slice(0, 20);

  const sitemapRecrawlCandidates = sortByOpportunity(
    hrefNodes.filter((node) => node.businessScore >= 60),
  ).slice(0, 30);

  const underlinkedSummary = topUnderlinkedPages.reduce<Record<string, number>>((acc, node) => {
    acc[node.kind] = (acc[node.kind] || 0) + 1;
    return acc;
  }, {});

  const report: GraphPriorityReport = {
    generatedAt: new Date().toISOString(),
    totals: {
      snapshots: audit.totals.snapshots,
      uniqueNodes: audit.totals.uniqueNodes,
      uniqueEdges: audit.totals.uniqueEdges,
      hrefNodes: hrefNodes.length,
    },
    surfaces: audit.surfaces,
    underlinkedSummary,
    topOrphanPages,
    topUnderlinkedPages,
    highValueSymptomHubs,
    tier1RepairSupportGaps,
    sitemapRecrawlCandidates,
  };

  const date = new Date().toISOString().slice(0, 10);
  const jsonPath = path.join(REPORTS_DIR, `graph-priority-report-${date}.json`);
  const mdPath = path.join(REPORTS_DIR, `graph-priority-report-${date}.md`);
  const csvPath = path.join(REPORTS_DIR, `graph-priority-top-underlinked-${date}.csv`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(mdPath, `${renderMarkdown(report)}\n`);

  const csvLines = [
    'kind,label,url,opportunity_score,business_score,support_score,inbound_edges,inbound_surface_count,action',
    ...topUnderlinkedPages.map((item) => [
      csvEscape(item.kind),
      csvEscape(item.label),
      csvEscape(item.href || ''),
      csvEscape(item.opportunityScore),
      csvEscape(item.businessScore),
      csvEscape(item.supportScore),
      csvEscape(item.inboundEdges),
      csvEscape(item.inboundSurfaceCount),
      csvEscape(item.action),
    ].join(',')),
  ];
  fs.writeFileSync(csvPath, `${csvLines.join('\n')}\n`);

  console.log(JSON.stringify({
    generatedAt: date,
    totals: report.totals,
    topOrphanPages: report.topOrphanPages.length,
    topUnderlinkedPages: report.topUnderlinkedPages.length,
    highValueSymptomHubs: report.highValueSymptomHubs.length,
    tier1RepairSupportGaps: report.tier1RepairSupportGaps.length,
    jsonPath,
    mdPath,
    csvPath,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
