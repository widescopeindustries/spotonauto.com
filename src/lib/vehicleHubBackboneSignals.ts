import 'server-only';

import { WIRING_SEO_SYSTEMS, type WiringSystemSlug } from '@/data/wiring-seo-cluster';
import { findVehicleManualSections, getManualEmbeddingsBackend } from '@/lib/manualEmbeddingsStore';
import { getRepairTaskProfile } from '@/lib/repairTaskProfiles';
import { slugifyRoutePart } from '@/data/vehicles';

interface BackboneSignalArgs {
  year: string;
  make: string;
  displayMake: string;
  model: string;
  displayModel: string;
  tasks: string[];
  systems: string[];
}

export interface VehicleHubBackboneSignal {
  mode: 'backbone' | 'legacy';
  backend: string;
  evidenceCount: number;
  taskScores: Record<string, number>;
  systemScores: Record<string, number>;
}

function tokenize(value: string): string[] {
  return slugifyRoutePart(value)
    .split('-')
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length >= 3);
}

function scoreNeedleInText(haystack: string, needle: string): number {
  if (!needle) return 0;
  if (!haystack.includes(needle)) return 0;
  return needle.includes(' ') ? 2 : 1;
}

function scoreNeedles(haystack: string, needles: string[]): number {
  return needles.reduce((sum, needle) => sum + scoreNeedleInText(haystack, needle), 0);
}

function buildTaskNeedles(task: string): string[] {
  const profile = getRepairTaskProfile(task);
  const taskLabel = task.replace(/-/g, ' ');

  return [...new Set([
    taskLabel,
    ...tokenize(task).filter((part) => part.length >= 4),
    ...profile.keywords.map((keyword) => slugifyRoutePart(keyword).replace(/-/g, ' ')),
  ].map((value) => value.trim().toLowerCase()).filter(Boolean))];
}

function buildSystemNeedles(system: string): string[] {
  const key = slugifyRoutePart(system) as WiringSystemSlug;
  const meta = WIRING_SEO_SYSTEMS[key];
  if (!meta) return [system.replace(/-/g, ' ').toLowerCase()];

  return [...new Set([
    meta.title,
    meta.shortLabel,
    ...meta.matchTerms,
    key.replace(/-/g, ' '),
  ].map((value) => slugifyRoutePart(value).replace(/-/g, ' ').trim().toLowerCase()).filter(Boolean))];
}

export async function buildVehicleHubBackboneSignal(args: BackboneSignalArgs): Promise<VehicleHubBackboneSignal> {
  const backend = getManualEmbeddingsBackend();
  if (backend === 'none') {
    return {
      mode: 'legacy',
      backend,
      evidenceCount: 0,
      taskScores: {},
      systemScores: {},
    };
  }

  const year = Number(args.year);
  if (!Number.isFinite(year)) {
    return {
      mode: 'legacy',
      backend,
      evidenceCount: 0,
      taskScores: {},
      systemScores: {},
    };
  }

  const rows = await findVehicleManualSections({
    make: args.displayMake,
    year,
    model: args.displayModel,
    limit: 700,
  });

  if (!rows.length) {
    return {
      mode: 'legacy',
      backend,
      evidenceCount: 0,
      taskScores: {},
      systemScores: {},
    };
  }

  const taskNeedles = new Map<string, string[]>(
    args.tasks.map((task) => [task, buildTaskNeedles(task)]),
  );
  const systemNeedles = new Map<string, string[]>(
    args.systems.map((system) => [system, buildSystemNeedles(system)]),
  );

  const taskScores: Record<string, number> = Object.fromEntries(args.tasks.map((task) => [task, 0]));
  const systemScores: Record<string, number> = Object.fromEntries(args.systems.map((system) => [system, 0]));

  for (const row of rows) {
    const haystack = `${row.sectionTitle} ${row.contentPreview} ${row.contentFull || ''}`
      .toLowerCase()
      .replace(/\s+/g, ' ');

    for (const [task, needles] of taskNeedles.entries()) {
      taskScores[task] += scoreNeedles(haystack, needles);
    }
    for (const [system, needles] of systemNeedles.entries()) {
      systemScores[system] += scoreNeedles(haystack, needles);
    }
  }

  return {
    mode: 'backbone',
    backend,
    evidenceCount: rows.length,
    taskScores,
    systemScores,
  };
}
