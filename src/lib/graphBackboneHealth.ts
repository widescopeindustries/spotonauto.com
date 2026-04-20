import fs from 'node:fs';
import path from 'node:path';

import {
  resolveGraphBackendBaseUrl,
  resolveGraphRoot,
  safeReadJson,
} from '@/lib/graphBackboneHealthHelpers';

export interface RunStatusFile {
  status?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  exitCode?: number | null;
  logFile?: string;
  manifestSummary?: unknown;
  graphSnapshot?: unknown;
  validationReport?: unknown;
}

export interface ManifestSummaryFile {
  generatedAt?: string;
  rawRecordCount?: number;
  expandedRecordCount?: number;
  uniqueVehicleCount?: number;
  uniqueVariantCount?: number;
  overlappingVehicleCount?: number;
}

export interface GraphSnapshotFile {
  generatedAt?: string;
  nodeCount?: number;
  edgeCount?: number;
  validation?: ValidationReportFile | null;
}

export interface ValidationReportFile {
  generatedAt?: string;
  ok?: boolean;
  duplicateNodeIds?: number;
  duplicateEdgeIds?: number;
  danglingEdgeCount?: number;
  nodeKinds?: Record<string, number>;
  edgeKinds?: Record<string, number>;
}

export interface GraphProgressFile {
  generatedAt?: string;
  requestedStage?: string;
  currentStage?: string | null;
  completedStages?: string[];
  stageStatus?: 'running' | 'complete' | 'failed';
  totalStages?: number;
  completedStageCount?: number;
  pendingStageCount?: number;
  message?: string;
  corpusRoot?: string;
  graphRoot?: string;
  counts?: {
    manifest?: {
      rawRecordCount?: number;
      expandedRecordCount?: number;
      uniqueVehicleCount?: number;
      uniqueVariantCount?: number;
    };
    normalized?: {
      documents?: number;
      sections?: number;
      evidence?: number;
    };
    graph?: {
      nodes?: number;
      edges?: number;
    };
    validation?: {
      ok?: boolean;
      duplicateNodes?: number;
      duplicateEdges?: number;
      danglingEdges?: number;
    };
  };
}

export interface GraphHealthReport {
  graphRoot: string;
  ok: boolean;
  generatedAt: string;
  freshness: {
    latestRunAgeHours: number | null;
    lastSuccessAgeHours: number | null;
    manifestAgeHours: number | null;
    snapshotAgeHours: number | null;
    validationAgeHours: number | null;
  };
  status: {
    current: RunStatusFile | null;
    latest: RunStatusFile | null;
    lastSuccess: RunStatusFile | null;
    lastFailure: RunStatusFile | null;
    skipped: RunStatusFile | null;
  };
  progress: GraphProgressFile | null;
  files: {
    manifestSummaryExists: boolean;
    graphSnapshotExists: boolean;
    validationReportExists: boolean;
    logDirExists: boolean;
  };
  checks: Array<{
    name: string;
    ok: boolean;
    detail: string;
  }>;
  manifest?: ManifestSummaryFile | null;
  snapshot?: GraphSnapshotFile | null;
  validation?: ValidationReportFile | null;
}

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return safeReadJson<T>(filePath);
  } catch {
    return null;
  }
}

function readTime(value?: string | null): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function hoursSince(value?: string | null): number | null {
  const time = readTime(value);
  if (time === null) return null;
  return (Date.now() - time) / (1000 * 60 * 60);
}

function statusDetail(entry: RunStatusFile | null): string {
  if (!entry) return 'missing';
  const parts = [entry.status || 'unknown'];
  if (entry.exitCode !== undefined) parts.push(`exit=${entry.exitCode}`);
  if (entry.durationMs !== undefined) parts.push(`duration=${Math.round(entry.durationMs)}ms`);
  return parts.join(' ');
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function remoteUrl(baseUrl: string, relativePath: string): string {
  return `${trimSlash(baseUrl)}/${relativePath.replace(/^\/+/, '')}`;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'cache-control': 'no-cache',
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function buildGraphHealthReport(graphRootInput?: string | null): Promise<GraphHealthReport> {
  const graphRootLocal = path.resolve(graphRootInput || resolveGraphRoot());
  const backendBaseUrl = resolveGraphBackendBaseUrl();
  const localAvailable = fs.existsSync(graphRootLocal);
  const useLocal = localAvailable;

  const graphRoot = useLocal ? graphRootLocal : backendBaseUrl;
  const statusDir = useLocal ? path.join(graphRoot, 'status') : remoteUrl(graphRoot, 'status');
  const manifestPath = useLocal ? path.join(graphRoot, 'manifest', 'summary.json') : remoteUrl(graphRoot, 'manifest/summary.json');
  const snapshotPath = useLocal ? path.join(graphRoot, 'graph', 'snapshot.json') : remoteUrl(graphRoot, 'graph/snapshot.json');
  const validationPath = useLocal ? path.join(graphRoot, 'validate', 'report.json') : remoteUrl(graphRoot, 'validate/report.json');
  const progressPath = useLocal ? path.join(statusDir, 'progress.json') : remoteUrl(statusDir, 'progress.json');
  const logDir = useLocal ? path.join(graphRoot, 'logs') : remoteUrl(graphRoot, 'logs');

  const current = useLocal
    ? readJson<RunStatusFile>(path.join(statusDir, 'current-run.json'))
    : await fetchJson<RunStatusFile>(remoteUrl(graphRoot, 'status/current-run.json'));
  const latest = useLocal
    ? readJson<RunStatusFile>(path.join(statusDir, 'latest-run.json'))
    : await fetchJson<RunStatusFile>(remoteUrl(graphRoot, 'status/latest-run.json'));
  const lastSuccess = useLocal
    ? readJson<RunStatusFile>(path.join(statusDir, 'last-success.json'))
    : await fetchJson<RunStatusFile>(remoteUrl(graphRoot, 'status/last-success.json'));
  const lastFailure = useLocal
    ? readJson<RunStatusFile>(path.join(statusDir, 'last-failure.json'))
    : await fetchJson<RunStatusFile>(remoteUrl(graphRoot, 'status/last-failure.json'));
  const skipped = useLocal
    ? readJson<RunStatusFile>(path.join(statusDir, 'skipped-run.json'))
    : await fetchJson<RunStatusFile>(remoteUrl(graphRoot, 'status/skipped-run.json'));
  const manifest = useLocal
    ? readJson<ManifestSummaryFile>(manifestPath)
    : await fetchJson<ManifestSummaryFile>(remoteUrl(graphRoot, 'manifest/summary.json'));
  const snapshot = useLocal
    ? readJson<GraphSnapshotFile>(snapshotPath)
    : await fetchJson<GraphSnapshotFile>(remoteUrl(graphRoot, 'graph/snapshot.json'));
  const validation = useLocal
    ? readJson<ValidationReportFile>(validationPath)
    : await fetchJson<ValidationReportFile>(remoteUrl(graphRoot, 'validate/report.json'));
  const progress = useLocal
    ? readJson<GraphProgressFile>(progressPath)
    : await fetchJson<GraphProgressFile>(remoteUrl(graphRoot, 'status/progress.json'));

  const remoteReachable = !useLocal && Boolean(latest || manifest || snapshot || validation || progress || current);

  const checks = [
    {
      name: 'graph-root-present',
      ok: useLocal ? localAvailable : remoteReachable,
      detail: useLocal
        ? localAvailable
          ? `found ${graphRootLocal}`
          : `missing ${graphRootLocal}`
        : `backend reachable at ${graphRoot}`,
    },
    {
      name: 'manifest-present',
      ok: Boolean(manifest),
      detail: manifest ? 'manifest summary exists' : 'manifest summary missing',
    },
    {
      name: 'snapshot-present',
      ok: Boolean(snapshot),
      detail: snapshot ? 'graph snapshot exists' : 'graph snapshot missing',
    },
    {
      name: 'validation-present',
      ok: Boolean(validation),
      detail: validation ? 'validation report exists' : 'validation report missing',
    },
    {
      name: 'latest-successful',
      ok: latest?.status === 'succeeded' && (latest?.exitCode ?? 0) === 0,
      detail: statusDetail(latest),
    },
    {
      name: 'validation-ok',
      ok: validation?.ok !== false,
      detail: validation?.ok === false ? 'validation failed' : 'validation ok or unavailable',
    },
    {
      name: 'no-current-run',
      ok: current === null,
      detail: current ? 'current run still active' : 'no active run',
    },
    {
      name: 'log-dir-present',
      ok: useLocal ? fs.existsSync(logDir) : Boolean(progress),
      detail: useLocal ? (fs.existsSync(logDir) ? 'log directory present' : 'log directory missing') : 'progress endpoint reachable',
    },
  ];

  const ok = checks.every((check) => check.ok) && Boolean(latest) && latest?.status === 'succeeded';

  return {
    graphRoot,
    ok,
    generatedAt: new Date().toISOString(),
    freshness: {
      latestRunAgeHours: hoursSince(latest?.finishedAt || latest?.startedAt),
      lastSuccessAgeHours: hoursSince(lastSuccess?.finishedAt || lastSuccess?.startedAt),
      manifestAgeHours: hoursSince(manifest?.generatedAt),
      snapshotAgeHours: hoursSince(snapshot?.generatedAt),
      validationAgeHours: hoursSince(validation?.generatedAt),
    },
    status: {
      current,
      latest,
      lastSuccess,
      lastFailure,
      skipped,
    },
    progress,
    files: {
      manifestSummaryExists: fs.existsSync(manifestPath),
      graphSnapshotExists: fs.existsSync(snapshotPath),
      validationReportExists: fs.existsSync(validationPath),
      logDirExists: fs.existsSync(logDir),
    },
    checks,
    manifest,
    snapshot,
    validation,
  };
}
