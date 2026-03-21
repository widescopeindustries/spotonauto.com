import 'server-only';

import * as fs from 'fs';
import * as path from 'path';
import { TIER_1_RESCUE_PAGES } from '@/data/rescuePriority';
import { SYMPTOM_CLUSTERS, buildSymptomHref, type SymptomCluster } from '@/data/symptomGraph';

interface GraphPriorityReportEntry {
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
  topOrphanPages?: GraphPriorityReportEntry[];
  topUnderlinkedPages?: GraphPriorityReportEntry[];
  highValueSymptomHubs?: GraphPriorityReportEntry[];
  tier1RepairSupportGaps?: GraphPriorityReportEntry[];
}

export interface GraphPriorityLink {
  id: string;
  kind: string;
  label: string;
  href: string;
  task: string | null;
  symptomSlug: string | null;
  businessScore: number;
  supportScore: number;
  opportunityScore: number;
  action: string;
}

const REPORTS_DIR = path.join(process.cwd(), 'scripts', 'seo-reports');

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
  'oxygen-sensor-replacement': 11,
  'ignition-coil-replacement': 11,
  'fuel-pump-replacement': 10,
  'catalytic-converter-replacement': 10,
  'wheel-bearing-replacement': 10,
  'tie-rod-replacement': 10,
  'radiator-replacement': 12,
  'coolant-flush': 8,
  'drive-belt-replacement': 8,
  'head-gasket-replacement': 8,
  'clutch-replacement': 8,
  'transmission-fluid-change': 8,
  'mass-air-flow-sensor-replacement': 11,
};

let cachedReport: GraphPriorityReport | null | undefined;

function toRelativeHref(href: string | null): string | null {
  if (!href) return null;
  if (href.startsWith('/')) return href;

  try {
    const url = new URL(href);
    if (url.hostname === 'spotonauto.com' || url.hostname === 'www.spotonauto.com') {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return null;
  }

  return null;
}

function parseTaskFromHref(href: string): string | null {
  const exactRepair = href.match(/^\/repair\/\d{4}\/[^/]+\/[^/]+\/([^/?#]+)/);
  if (exactRepair) return exactRepair[1];
  const categoryRepair = href.match(/^\/repairs\/([^/?#]+)/);
  if (categoryRepair) return categoryRepair[1];
  return null;
}

function parseSymptomSlug(href: string): string | null {
  const match = href.match(/^\/symptoms\/([^/?#]+)/);
  return match?.[1] || null;
}

function toGraphPriorityLink(entry: GraphPriorityReportEntry): GraphPriorityLink | null {
  const href = toRelativeHref(entry.href);
  if (!href) return null;

  return {
    id: entry.id,
    kind: entry.kind,
    label: entry.label,
    href,
    task: parseTaskFromHref(href),
    symptomSlug: parseSymptomSlug(href),
    businessScore: entry.businessScore,
    supportScore: entry.supportScore,
    opportunityScore: entry.opportunityScore,
    action: entry.action,
  };
}

function sortFallbackSymptoms(clusters: SymptomCluster[]): SymptomCluster[] {
  return [...clusters].sort((left, right) => {
    const leftScore = left.likelyTasks.reduce((sum, task) => sum + (TASK_SCORE[task] || 6), 0);
    const rightScore = right.likelyTasks.reduce((sum, task) => sum + (TASK_SCORE[task] || 6), 0);
    return rightScore - leftScore || left.label.localeCompare(right.label);
  });
}

function fallbackSymptomLinks(): GraphPriorityLink[] {
  return sortFallbackSymptoms(SYMPTOM_CLUSTERS).map((cluster, index) => {
    const businessScore = 84 + Math.min(cluster.likelyTasks.reduce((sum, task) => sum + (TASK_SCORE[task] || 6), 0), 40);
    return {
      id: `symptom:${cluster.slug}`,
      kind: 'symptom',
      label: cluster.label,
      href: buildSymptomHref(cluster.slug),
      task: null,
      symptomSlug: cluster.slug,
      businessScore,
      supportScore: 0,
      opportunityScore: Math.max(businessScore - index, 0),
      action: 'Strengthen links from homepage, diagnose, code, and repair surfaces',
    };
  });
}

function fallbackRepairLinks(): GraphPriorityLink[] {
  return TIER_1_RESCUE_PAGES.map((entry, index) => {
    const taskScore = TASK_SCORE[entry.task] || 10;
    const businessScore = 86 + 14 + 28 + taskScore;
    return {
      id: `repair:${entry.year}:${entry.make.toLowerCase()}:${entry.model.toLowerCase()}:${entry.task}`,
      kind: 'repair',
      label: `${entry.year} ${entry.make} ${entry.model} ${entry.task.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`,
      href: entry.href,
      task: entry.task,
      symptomSlug: null,
      businessScore,
      supportScore: 0,
      opportunityScore: Math.max(businessScore - index, 0),
      action: 'Add more links from symptom hubs, vehicle hubs, and code pages',
    };
  });
}

function loadReport(): GraphPriorityReport | null {
  if (cachedReport !== undefined) return cachedReport;

  try {
    const files = fs
      .readdirSync(REPORTS_DIR)
      .filter((name) => /^graph-priority-report-\d{4}-\d{2}-\d{2}\.json$/.test(name))
      .sort();

    const latest = files.at(-1);
    if (!latest) {
      cachedReport = null;
      return cachedReport;
    }

    const raw = fs.readFileSync(path.join(REPORTS_DIR, latest), 'utf8');
    cachedReport = JSON.parse(raw) as GraphPriorityReport;
    return cachedReport;
  } catch {
    cachedReport = null;
    return cachedReport;
  }
}

function normalizeEntries(entries: GraphPriorityReportEntry[] | undefined, kind?: string): GraphPriorityLink[] {
  if (!entries) return [];

  return entries
    .filter((entry) => !kind || entry.kind === kind)
    .map(toGraphPriorityLink)
    .filter((entry): entry is GraphPriorityLink => Boolean(entry));
}

function dedupeByHref(entries: GraphPriorityLink[]): GraphPriorityLink[] {
  const seen = new Set<string>();
  const output: GraphPriorityLink[] = [];

  for (const entry of entries) {
    if (seen.has(entry.href)) continue;
    seen.add(entry.href);
    output.push(entry);
  }

  return output;
}

export function getHighValueSymptomHubs(limit = 6): GraphPriorityLink[] {
  const report = loadReport();
  const reportEntries = normalizeEntries(report?.highValueSymptomHubs, 'symptom');
  const source = reportEntries.length > 0 ? reportEntries : fallbackSymptomLinks();
  return dedupeByHref(source).slice(0, limit);
}

export function getTopOrphanSymptoms(limit = 4): GraphPriorityLink[] {
  const report = loadReport();
  const reportEntries = normalizeEntries(report?.topOrphanPages, 'symptom');
  const source = reportEntries.length > 0 ? reportEntries : fallbackSymptomLinks();
  return dedupeByHref(source).slice(0, limit);
}

export function getTopUnderlinkedRepairPages(limit = 6): GraphPriorityLink[] {
  const report = loadReport();
  const reportEntries = normalizeEntries(report?.topUnderlinkedPages, 'repair')
    .filter((entry) => entry.href.startsWith('/repair/'));
  const source = reportEntries.length > 0 ? reportEntries : fallbackRepairLinks();
  return dedupeByHref(source).slice(0, limit);
}

export function getTier1RepairSupportGaps(limit = 6): GraphPriorityLink[] {
  const report = loadReport();
  const reportEntries = normalizeEntries(report?.tier1RepairSupportGaps, 'repair')
    .filter((entry) => entry.href.startsWith('/repair/'));
  const source = reportEntries.length > 0 ? reportEntries : fallbackRepairLinks();
  return dedupeByHref(source).slice(0, limit);
}

export function getSupportGapRepairsForTasks(tasks: string[], limit = 6): GraphPriorityLink[] {
  const normalizedTasks = new Set(tasks);
  const reportBacked = dedupeByHref([
    ...getTier1RepairSupportGaps(24),
    ...getTopUnderlinkedRepairPages(36),
  ]).filter((entry) => entry.task && normalizedTasks.has(entry.task));

  if (reportBacked.length > 0) {
    return reportBacked.slice(0, limit);
  }

  const fallback = fallbackRepairLinks().filter((entry) => entry.task && normalizedTasks.has(entry.task));
  return fallback.slice(0, limit);
}
