import 'server-only';

import * as fs from 'fs';
import * as path from 'path';
import { DTC_CODES, type DTCCode } from '@/data/dtc-codes-data';
import { TIER_1_RESCUE_PAGES } from '@/data/rescuePriority';
import { SYMPTOM_CLUSTERS, buildSymptomHref, getSymptomClustersForTexts, type SymptomCluster } from '@/data/symptomGraph';

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

export interface GraphPrioritySymptomLink extends GraphPriorityLink {
  symptomSlug: string;
  likelyTasks: string[];
  systems: string[];
  summary: string;
}

export interface GraphPriorityCodeLink extends GraphPriorityLink {
  kind: 'dtc';
  code: string;
  affectedSystem: string;
  repairTaskSlug: string | null;
  severity: DTCCode['severity'];
  symptoms: string[];
}

const REPORTS_DIR = path.join(process.cwd(), 'scripts', 'seo-reports');
const SYMPTOM_CLUSTER_MAP = new Map(SYMPTOM_CLUSTERS.map((cluster) => [cluster.slug, cluster]));
const DTC_CODE_MAP = new Map(DTC_CODES.map((code) => [code.code.toUpperCase(), code]));

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

function parseCodeFromHref(href: string): string | null {
  const match = href.match(/^\/codes\/([^/?#]+)/i);
  return match?.[1]?.toUpperCase() || null;
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

function toSymptomPriorityLink(cluster: SymptomCluster, opportunityScore: number, action: string): GraphPrioritySymptomLink {
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
    opportunityScore,
    action,
    likelyTasks: cluster.likelyTasks,
    systems: cluster.systems,
    summary: cluster.summary,
  };
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

function fallbackPrioritySymptomLinks(): GraphPrioritySymptomLink[] {
  return sortFallbackSymptoms(SYMPTOM_CLUSTERS).map((cluster, index) =>
    toSymptomPriorityLink(
      cluster,
      Math.max(96 + cluster.likelyTasks.reduce((sum, task) => sum + (TASK_SCORE[task] || 6), 0) - index, 0),
      'Strengthen links from homepage, diagnose, code, and repair surfaces',
    ),
  );
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

function fallbackPriorityCodeLinks(): GraphPriorityCodeLink[] {
  return DTC_CODES
    .filter((code) => Boolean(code.repairTaskSlug))
    .map((code, index) => {
      const taskScore = TASK_SCORE[code.repairTaskSlug || ''] || 6;
      const businessScore = 68 + 8 + taskScore;

      return {
        id: `dtc:${code.code.toUpperCase()}`,
        kind: 'dtc',
        label: `${code.code}: ${code.title}`,
        href: `/codes/${code.code.toLowerCase()}`,
        task: code.repairTaskSlug || null,
        symptomSlug: null,
        businessScore,
        supportScore: 0,
        opportunityScore: Math.max(businessScore - index, 0),
        action: 'Promote from symptom hubs and repair pages',
        code: code.code.toUpperCase(),
        affectedSystem: code.affectedSystem,
        repairTaskSlug: code.repairTaskSlug || null,
        severity: code.severity,
        symptoms: code.symptoms,
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

function dedupeByHref<T extends { href: string }>(entries: T[]): T[] {
  const seen = new Set<string>();
  const output: T[] = [];

  for (const entry of entries) {
    if (seen.has(entry.href)) continue;
    seen.add(entry.href);
    output.push(entry);
  }

  return output;
}

function toGraphPrioritySymptomLink(entry: GraphPriorityReportEntry): GraphPrioritySymptomLink | null {
  const link = toGraphPriorityLink(entry);
  if (!link?.symptomSlug) return null;

  const cluster = SYMPTOM_CLUSTER_MAP.get(link.symptomSlug);
  if (!cluster) return null;

  return {
    ...link,
    symptomSlug: cluster.slug,
    likelyTasks: cluster.likelyTasks,
    systems: cluster.systems,
    summary: cluster.summary,
  };
}

function toGraphPriorityCodeLink(entry: GraphPriorityReportEntry): GraphPriorityCodeLink | null {
  const href = toRelativeHref(entry.href);
  if (!href) return null;

  const codeValue = parseCodeFromHref(href);
  if (!codeValue) return null;

  const codeMeta = DTC_CODE_MAP.get(codeValue);

  return {
    id: entry.id,
    kind: 'dtc',
    label: codeMeta ? `${codeMeta.code}: ${codeMeta.title}` : entry.label,
    href,
    task: codeMeta?.repairTaskSlug || null,
    symptomSlug: null,
    businessScore: entry.businessScore,
    supportScore: entry.supportScore,
    opportunityScore: entry.opportunityScore,
    action: entry.action,
    code: codeMeta?.code.toUpperCase() || codeValue,
    affectedSystem: codeMeta?.affectedSystem || 'Unknown',
    repairTaskSlug: codeMeta?.repairTaskSlug || null,
    severity: codeMeta?.severity || 'medium',
    symptoms: codeMeta?.symptoms || [],
  };
}

function getReportBackedSymptomLinks(): GraphPrioritySymptomLink[] {
  const report = loadReport();

  return dedupeByHref([
    ...((report?.highValueSymptomHubs ?? []).map(toGraphPrioritySymptomLink).filter((entry): entry is GraphPrioritySymptomLink => Boolean(entry))),
    ...((report?.topOrphanPages ?? []).map(toGraphPrioritySymptomLink).filter((entry): entry is GraphPrioritySymptomLink => Boolean(entry))),
  ]);
}

function getReportBackedCodeLinks(): GraphPriorityCodeLink[] {
  const report = loadReport();

  return dedupeByHref([
    ...((report?.topOrphanPages ?? []).map(toGraphPriorityCodeLink).filter((entry): entry is GraphPriorityCodeLink => Boolean(entry))),
    ...((report?.topUnderlinkedPages ?? []).map(toGraphPriorityCodeLink).filter((entry): entry is GraphPriorityCodeLink => Boolean(entry))),
  ]);
}

function getMatchedSymptomSlugsForCode(code: DTCCode): string[] {
  return getSymptomClustersForTexts([
    code.title,
    code.description,
    code.commonFix,
    code.affectedSystem,
    ...code.symptoms,
  ], 8).map((cluster) => cluster.slug);
}

function scoreCodeForTaskSet(link: GraphPriorityCodeLink, tasks: Set<string>): number {
  let score = 0;

  if (link.repairTaskSlug && tasks.has(link.repairTaskSlug)) {
    score += 120;
  }

  const codeMeta = DTC_CODE_MAP.get(link.code);
  if (!codeMeta) return score;

  const matchedClusters = getMatchedSymptomSlugsForCode(codeMeta);
  const overlapCount = matchedClusters.reduce((sum, slug) => {
    const cluster = SYMPTOM_CLUSTER_MAP.get(slug);
    return sum + (cluster?.likelyTasks.some((task) => tasks.has(task)) ? 1 : 0);
  }, 0);

  return score + overlapCount * 24;
}

function scoreCodeForSymptomCluster(link: GraphPriorityCodeLink, cluster: SymptomCluster): number {
  let score = 0;

  if (link.repairTaskSlug && cluster.likelyTasks.includes(link.repairTaskSlug)) {
    score += 120;
  }

  const codeMeta = DTC_CODE_MAP.get(link.code);
  if (!codeMeta) return score;

  const matchedClusters = getMatchedSymptomSlugsForCode(codeMeta);
  if (matchedClusters.includes(cluster.slug)) {
    score += 72;
  }

  const textHaystack = [
    codeMeta.title,
    codeMeta.description,
    codeMeta.commonFix,
    codeMeta.affectedSystem,
    ...codeMeta.symptoms,
  ].join(' ').toLowerCase();

  const phraseMatches = [
    cluster.label,
    cluster.shortLabel,
    ...cluster.aliases,
    ...cluster.systems,
  ].reduce((sum, phrase) => sum + (textHaystack.includes(phrase.toLowerCase()) ? 1 : 0), 0);

  return score + phraseMatches * 10;
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

export function getPrioritySymptomHubsForTasks(tasks: string[], limit = 6): GraphPrioritySymptomLink[] {
  const normalizedTasks = new Set(tasks);
  const reportBacked = getReportBackedSymptomLinks()
    .filter((entry) => entry.likelyTasks.some((task) => normalizedTasks.has(task)))
    .sort((left, right) =>
      right.opportunityScore - left.opportunityScore ||
      right.businessScore - left.businessScore ||
      left.label.localeCompare(right.label),
    );

  if (reportBacked.length > 0) {
    return reportBacked.slice(0, limit);
  }

  return fallbackPrioritySymptomLinks()
    .filter((entry) => entry.likelyTasks.some((task) => normalizedTasks.has(task)))
    .slice(0, limit);
}

export function getPriorityCodePagesForTasks(tasks: string[], limit = 6): GraphPriorityCodeLink[] {
  const normalizedTasks = new Set(tasks);
  const reportBacked = getReportBackedCodeLinks()
    .map((entry) => ({
      entry,
      score: scoreCodeForTaskSet(entry, normalizedTasks),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) =>
      right.score - left.score ||
      right.entry.opportunityScore - left.entry.opportunityScore ||
      left.entry.label.localeCompare(right.entry.label),
    )
    .map((entry) => entry.entry);

  if (reportBacked.length > 0) {
    return reportBacked.slice(0, limit);
  }

  return fallbackPriorityCodeLinks()
    .map((entry) => ({
      entry,
      score: scoreCodeForTaskSet(entry, normalizedTasks),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) =>
      right.score - left.score ||
      right.entry.opportunityScore - left.entry.opportunityScore ||
      left.entry.label.localeCompare(right.entry.label),
    )
    .slice(0, limit)
    .map((entry) => entry.entry);
}

export function getPriorityCodePagesForSymptomCluster(cluster: SymptomCluster, limit = 6): GraphPriorityCodeLink[] {
  const reportBacked = getReportBackedCodeLinks()
    .map((entry) => ({
      entry,
      score: scoreCodeForSymptomCluster(entry, cluster),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) =>
      right.score - left.score ||
      right.entry.opportunityScore - left.entry.opportunityScore ||
      left.entry.label.localeCompare(right.entry.label),
    )
    .map((entry) => entry.entry);

  if (reportBacked.length > 0) {
    return reportBacked.slice(0, limit);
  }

  return fallbackPriorityCodeLinks()
    .map((entry) => ({
      entry,
      score: scoreCodeForSymptomCluster(entry, cluster),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) =>
      right.score - left.score ||
      right.entry.opportunityScore - left.entry.opportunityScore ||
      left.entry.label.localeCompare(right.entry.label),
    )
    .slice(0, limit)
    .map((entry) => entry.entry);
}
