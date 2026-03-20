import { SimulationRun } from '@/lib/simulation/types';

declare global {
  // eslint-disable-next-line no-var
  var __spotOnSimulationRuns: Map<string, SimulationRun> | undefined;
}

function getRunStore(): Map<string, SimulationRun> {
  if (!globalThis.__spotOnSimulationRuns) {
    globalThis.__spotOnSimulationRuns = new Map<string, SimulationRun>();
  }

  return globalThis.__spotOnSimulationRuns;
}

export function saveSimulationRun(run: SimulationRun): SimulationRun {
  getRunStore().set(run.id, run);
  return run;
}

export function getSimulationRun(runId: string): SimulationRun | null {
  return getRunStore().get(runId) || null;
}

export function updateSimulationRun(runId: string, updater: (run: SimulationRun) => SimulationRun): SimulationRun | null {
  const current = getSimulationRun(runId);
  if (!current) return null;

  const next = updater(current);
  saveSimulationRun(next);
  return next;
}

export function listSimulationRuns(): SimulationRun[] {
  return [...getRunStore().values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
