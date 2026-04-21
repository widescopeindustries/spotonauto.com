#!/usr/bin/env node

import { pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';
import { auditSnapshots, collectSnapshots, type SurfaceSnapshot } from './audit-knowledge-graph.ts';

interface SnapshotCoverage {
  surface: string;
  rootNodeId: string;
  nodeCount: number;
  edgeCount: number;
  reachableRatio: number;
  reachableNodes: number;
  missingManualEvidence: boolean;
  weakBranchCount: number;
}

interface CoverageAuditReport {
  generatedAt: string;
  totals: {
    snapshots: number;
    nodes: number;
    edges: number;
    orphanNodes: number;
  };
  coverage: {
    averageReachableRatio: number;
    snapshotsBelowThreshold: number;
    threshold: number;
  };
  manualEvidence: {
    snapshotsMissingManualEvidence: number;
  };
  weakBranches: {
    total: number;
    snapshotsWithWeakBranches: number;
  };
  topCoverageGaps: SnapshotCoverage[];
  topWeakBranches: SnapshotCoverage[];
}

function loadLocalEnvFiles() {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  const files = ['.env.local', '.env'];
  for (const file of files) {
    const filePath = path.join(root, file);
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      if (!key || process.env[key] !== undefined) continue;
      let value = trimmed.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

function parseThreshold(argName: string, fallback: number): number {
  const flag = process.argv.find((arg) => arg.startsWith(`${argName}=`));
  if (!flag) return fallback;
  const raw = Number(flag.split('=').slice(1).join('='));
  return Number.isFinite(raw) ? raw : fallback;
}

function parseIntegerArg(argName: string): number | null {
  const flag = process.argv.find((arg) => arg.startsWith(`${argName}=`));
  if (!flag) return null;
  const value = Number(flag.split('=').slice(1).join('='));
  if (!Number.isFinite(value)) return null;
  const rounded = Math.floor(value);
  return rounded > 0 ? rounded : null;
}

function buildOutgoingMap(snapshot: SurfaceSnapshot): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const edge of snapshot.edges) {
    const list = map.get(edge.source) || [];
    list.push(edge.target);
    map.set(edge.source, list);
  }
  return map;
}

function computeReachableNodes(snapshot: SurfaceSnapshot): number {
  const outgoing = buildOutgoingMap(snapshot);
  const seen = new Set<string>([snapshot.rootNodeId]);
  const queue = [snapshot.rootNodeId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const next = outgoing.get(current) || [];
    for (const nodeId of next) {
      if (seen.has(nodeId)) continue;
      seen.add(nodeId);
      queue.push(nodeId);
    }
  }

  return seen.size;
}

function hasManualEvidence(snapshot: SurfaceSnapshot): boolean {
  if (!['repair', 'vehicle', 'wiring', 'code'].includes(snapshot.surface)) return true;
  return snapshot.edges.some((edge) => edge.targetKind === 'manual');
}

function computeWeakBranches(snapshot: SurfaceSnapshot): number {
  const outgoingCount = new Map<string, number>();
  for (const edge of snapshot.edges) {
    outgoingCount.set(edge.source, (outgoingCount.get(edge.source) || 0) + 1);
  }

  const expandableKinds = new Set(['repair', 'vehicle', 'wiring', 'symptom']);
  return snapshot.nodes.filter((node) => {
    if (!expandableKinds.has(node.kind)) return false;
    if (node.id === snapshot.rootNodeId) return false;
    return (outgoingCount.get(node.id) || 0) === 0;
  }).length;
}

async function buildCoverageReport(reachableThreshold = 0.72, sampleLimit: number | null = null): Promise<CoverageAuditReport> {
  const rawSnapshots = await collectSnapshots(sampleLimit ? { limit: sampleLimit } : undefined);
  const snapshots = sampleLimit ? rawSnapshots.slice(0, sampleLimit) : rawSnapshots;
  const audit = auditSnapshots(snapshots);
  const rootIds = new Set(snapshots.map((snapshot) => snapshot.rootNodeId));
  const inboundCount = new Map<string, number>();

  for (const snapshot of snapshots) {
    for (const edge of snapshot.edges) {
      inboundCount.set(edge.target, (inboundCount.get(edge.target) || 0) + 1);
    }
  }

  const coverageRows: SnapshotCoverage[] = snapshots.map((snapshot) => {
    const reachableNodes = computeReachableNodes(snapshot);
    const nodeCount = Math.max(1, snapshot.nodes.length);
    const reachableRatio = reachableNodes / nodeCount;
    const missingManualEvidence = !hasManualEvidence(snapshot);
    const weakBranchCount = computeWeakBranches(snapshot);

    return {
      surface: snapshot.surface,
      rootNodeId: snapshot.rootNodeId,
      nodeCount: snapshot.nodes.length,
      edgeCount: snapshot.edges.length,
      reachableRatio,
      reachableNodes,
      missingManualEvidence,
      weakBranchCount,
    };
  });

  const orphanNodes = [...new Set(
    snapshots.flatMap((snapshot) => snapshot.nodes.map((node) => node.id)),
  )].filter((nodeId) => !rootIds.has(nodeId) && (inboundCount.get(nodeId) || 0) === 0);

  const belowThreshold = coverageRows.filter((row) => row.reachableRatio < reachableThreshold);
  const weakBranchRows = coverageRows.filter((row) => row.weakBranchCount > 0);
  const missingManualRows = coverageRows.filter((row) => row.missingManualEvidence);

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      snapshots: snapshots.length,
      nodes: audit.totals.uniqueNodes,
      edges: audit.totals.uniqueEdges,
      orphanNodes: orphanNodes.length,
    },
    coverage: {
      averageReachableRatio:
        coverageRows.reduce((sum, row) => sum + row.reachableRatio, 0) / Math.max(1, coverageRows.length),
      snapshotsBelowThreshold: belowThreshold.length,
      threshold: reachableThreshold,
    },
    manualEvidence: {
      snapshotsMissingManualEvidence: missingManualRows.length,
    },
    weakBranches: {
      total: weakBranchRows.reduce((sum, row) => sum + row.weakBranchCount, 0),
      snapshotsWithWeakBranches: weakBranchRows.length,
    },
    topCoverageGaps: belowThreshold
      .sort((a, b) => a.reachableRatio - b.reachableRatio || b.nodeCount - a.nodeCount)
      .slice(0, 25),
    topWeakBranches: weakBranchRows
      .sort((a, b) => b.weakBranchCount - a.weakBranchCount || a.reachableRatio - b.reachableRatio)
      .slice(0, 25),
  };
}

async function main(): Promise<void> {
  loadLocalEnvFiles();
  const threshold = parseThreshold('--reachable-threshold', 0.72);
  const sampleLimit = parseIntegerArg('--sample');
  const report = await buildCoverageReport(threshold, sampleLimit);
  console.log(JSON.stringify(report, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
