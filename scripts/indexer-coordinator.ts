#!/usr/bin/env node
/**
 * Indexer Army — Coordinator
 *
 * Spawns multiple parallel indexer workers, one per make, to saturate
 * the local CHARM server and PostgreSQL with concurrent I/O.
 *
 * Usage:
 *   node --experimental-strip-types scripts/indexer-coordinator.ts
 *   node --experimental-strip-types scripts/indexer-coordinator.ts --deep
 *   node --experimental-strip-types scripts/indexer-coordinator.ts --workers 8
 *   node --experimental-strip-types scripts/indexer-coordinator.ts --makes Toyota,Honda,Ford
 *   node --experimental-strip-types scripts/indexer-coordinator.ts --resume
 */

import { spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const GRAPH_BACKEND_BASE_URL =
  process.env.GRAPH_BACKEND_BASE_URL || 'http://127.0.0.1:8080';

const STATE_FILE = resolve(process.cwd(), '.indexer-army-state.json');
const POLL_INTERVAL_MS = 15_000;
const WORKER_SCRIPT = resolve(process.cwd(), 'scripts/index-lmdb-vectors.ts');

interface WorkerState {
  make: string;
  pid: number | null;
  status: 'pending' | 'running' | 'done' | 'failed';
  attempts: number;
  startTime: string | null;
  endTime: string | null;
  exitCode: number | null;
  logs: string[];
}

interface CoordinatorState {
  startedAt: string;
  deep: boolean;
  workers: WorkerState[];
  totalSectionsAtStart: number;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        flags[arg.slice(2)] = next;
        i++;
      } else {
        flags[arg.slice(2)] = true;
      }
    }
  }
  return flags;
}

async function fetchMakes(): Promise<string[]> {
  const url = GRAPH_BACKEND_BASE_URL + '/';
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'SpotOnAuto-Coordinator/1.0' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!resp.ok) throw new Error(`Root fetch failed: ${resp.status}`);
  const html = await resp.text();

  const links: string[] = [];
  for (const match of html.matchAll(/href=['"]([^'"]+\/)['"]/g)) {
    links.push(match[1]);
  }

  const makes = links
    .filter((link) => {
      if (!link || link.startsWith('/') || link.startsWith('http')) return false;
      const segments = link.split('/').filter(Boolean);
      if (segments.length !== 1) return false;
      const seg = segments[0];
      return !seg.includes('.') && !seg.startsWith('_') && !seg.includes(':');
    })
    .map((link) => decodeURIComponent(link.split('/').filter(Boolean)[0]));

  return [...new Set(makes)].sort();
}

function getDbStats(): Promise<{ totalSections: number; totalMakes: number }> {
  return import('../src/lib/manualEmbeddingsStore.ts')
    .then((mod) => mod.testManualEmbeddingsConnection())
    .then((health) => ({
      totalSections: health.totalSections ?? 0,
      totalMakes: health.totalMakes ?? 0,
    }))
    .catch(() => ({ totalSections: 0, totalMakes: 0 }));
}

function loadState(): CoordinatorState | null {
  if (!existsSync(STATE_FILE)) return null;
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

function saveState(state: CoordinatorState) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function spawnWorker(
  make: string,
  deep: boolean,
  workerConcurrency: number,
  onExit: (code: number | null, logs: string[]) => void,
): WorkerState {
  const args = [
    '--experimental-strip-types',
    WORKER_SCRIPT,
    '--make',
    make,
    '--concurrency',
    String(workerConcurrency),
  ];
  if (deep) args.push('--deep');

  const child = spawn(process.execPath, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  const logs: string[] = [];
  const pushLog = (line: string) => {
    const trimmed = line.trim();
    if (trimmed) logs.push(trimmed);
  };

  child.stdout?.on('data', (data: Buffer) => {
    data.toString().split('\n').forEach(pushLog);
  });
  child.stderr?.on('data', (data: Buffer) => {
    data.toString().split('\n').forEach((l) => pushLog(`[ERR] ${l}`));
  });

  child.on('exit', (code) => onExit(code, logs));

  return {
    make,
    pid: child.pid ?? null,
    status: 'running',
    attempts: 1,
    startTime: new Date().toISOString(),
    endTime: null,
    exitCode: null,
    logs,
  };
}

function printBanner() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           SPOTONAUTO INDEXER ARMY v1.0                   ║
║           Parallel manual section indexer                ║
╚══════════════════════════════════════════════════════════╝
`);
}

function printStats(
  state: CoordinatorState,
  currentDb: { totalSections: number; totalMakes: number },
) {
  const done = state.workers.filter((w) => w.status === 'done').length;
  const running = state.workers.filter((w) => w.status === 'running').length;
  const failed = state.workers.filter((w) => w.status === 'failed').length;
  const pending = state.workers.filter((w) => w.status === 'pending').length;
  const elapsedMin = Math.floor(
    (Date.now() - new Date(state.startedAt).getTime()) / 60_000,
  );

  console.clear();
  printBanner();
  console.log(`Mode        : ${state.deep ? 'DEEP' : 'STANDARD'}`);
  console.log(`Elapsed     : ${elapsedMin}m`);
  console.log(`Workers     : ${running} running | ${done} done | ${failed} failed | ${pending} pending`);
  console.log(`DB Sections : ${currentDb.totalSections.toLocaleString()} (+${(currentDb.totalSections - (state.totalSectionsAtStart || 0)).toLocaleString()})`);
  console.log(`DB Makes    : ${currentDb.totalMakes}`);
  console.log('─'.repeat(60));

  // Show running workers
  const runningWorkers = state.workers.filter((w) => w.status === 'running');
  if (runningWorkers.length) {
    console.log('\n🏃 RUNNING:');
    for (const w of runningWorkers) {
      const start = w.startTime ? new Date(w.startTime).getTime() : Date.now();
      const mins = Math.floor((Date.now() - start) / 60_000);
      console.log(`   ${w.make}  (pid:${w.pid}, ${mins}m)`);
    }
  }

  // Show recently failed
  const recentFailed = state.workers
    .filter((w) => w.status === 'failed')
    .slice(-5);
  if (recentFailed.length) {
    console.log('\n💥 RECENT FAILED:');
    for (const w of recentFailed) {
      console.log(`   ${w.make}  (exit:${w.exitCode}, attempts:${w.attempts})`);
    }
  }

  // Show recently completed
  const recentDone = state.workers
    .filter((w) => w.status === 'done')
    .slice(-5);
  if (recentDone.length) {
    console.log('\n✅ RECENT DONE:');
    for (const w of recentDone) {
      console.log(`   ${w.make}`);
    }
  }
}

async function main() {
  const flags = parseArgs();
  const deep = flags.deep === true;
  const maxWorkers = Math.max(1, Math.min(32, parseInt(String(flags.workers || '0'), 10) || Math.max(4, Math.ceil((await import('os')).cpus().length * 0.75))));
  const resume = flags.resume === true;
  const customMakes = flags.makes ? String(flags.makes).split(',').map((s) => s.trim()).filter(Boolean) : null;

  printBanner();

  let state: CoordinatorState;
  let initialDbStats = await getDbStats();

  if (resume) {
    const saved = loadState();
    if (saved) {
      console.log(`📂 Resuming from ${STATE_FILE}`);
      state = saved;
      // Reset any 'running' to 'pending' since they may have been killed
      for (const w of state.workers) {
        if (w.status === 'running') {
          w.status = 'pending';
          w.pid = null;
        }
      }
    } else {
      console.log('⚠️ No saved state found, starting fresh');
    }
  }

  if (!state!) {
    const makes = customMakes ?? await fetchMakes();
    console.log(`🔍 Discovered ${makes.length} makes`);
    state = {
      startedAt: new Date().toISOString(),
      deep,
      workers: makes.map((make) => ({
        make,
        pid: null,
        status: 'pending' as const,
        attempts: 0,
        startTime: null,
        endTime: null,
        exitCode: null,
        logs: [],
      })),
      totalSectionsAtStart: initialDbStats.totalSections,
    };
    saveState(state);
  }

  console.log(`⚡ Max concurrent workers: ${maxWorkers}`);
  console.log(`🔄 Worker concurrency: ${Math.max(2, Math.floor(16 / maxWorkers))} (parallel fetches per worker)`);
  console.log(`📁 State file: ${STATE_FILE}`);
  console.log('');

  let shuttingDown = false;

  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log('\n🛑 Shutting down gracefully...');
    for (const w of state.workers) {
      if (w.pid) {
        try {
          process.kill(w.pid, 'SIGTERM');
        } catch {
          // ignore
        }
      }
    }
    saveState(state);
    setTimeout(() => {
      console.log('💾 State saved. Exiting.');
      process.exit(0);
    }, 2000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Main loop
  const activeWorkers = new Map<string, WorkerState>();

  const tick = async () => {
    if (shuttingDown) return;

    // Replenish workers
    while (
      activeWorkers.size < maxWorkers &&
      !shuttingDown
    ) {
      const next = state.workers.find(
        (w) => w.status === 'pending' || (w.status === 'failed' && w.attempts < 3),
      );
      if (!next) break;

      next.status = 'running';
      next.attempts += 1;
      next.logs = [];
      next.startTime = new Date().toISOString();
      next.endTime = null;
      next.exitCode = null;

      const worker = spawnWorker(next.make, deep, Math.max(2, Math.floor(16 / maxWorkers)), (code, logs) => {
        next.exitCode = code;
        next.endTime = new Date().toISOString();
        next.logs = logs;
        activeWorkers.delete(next.make);

        if (code === 0) {
          next.status = 'done';
          console.log(`✅ ${next.make} completed`);
        } else {
          next.status = next.attempts < 3 ? 'failed' : 'failed';
          console.log(`💥 ${next.make} exited ${code} (attempt ${next.attempts})`);
          if (next.attempts >= 3) {
            console.log(`   Permanently failed: ${next.make}`);
          }
        }
        saveState(state);
      });

      activeWorkers.set(next.make, worker);
      console.log(`🚀 Started ${next.make} (attempt ${next.attempts}, ${activeWorkers.size}/${maxWorkers} active)`);
    }

    // Progress display
    const dbStats = await getDbStats();
    printStats(state, dbStats);

    // Check completion
    const incomplete = state.workers.filter(
      (w) => w.status !== 'done' && !(w.status === 'failed' && w.attempts >= 3),
    );
    if (incomplete.length === 0 && activeWorkers.size === 0) {
      console.log('\n🎉 ALL WORKERS COMPLETE');
      const finalDb = await getDbStats();
      console.log(`Total sections: ${finalDb.totalSections.toLocaleString()}`);
      console.log(`Total makes:    ${finalDb.totalMakes}`);
      if (existsSync(STATE_FILE)) {
        // Clean up state file on success
        // require('fs').unlinkSync(STATE_FILE);
      }
      process.exit(0);
    }
  };

  // Initial tick
  await tick();

  // Periodic ticks
  const interval = setInterval(tick, POLL_INTERVAL_MS);

  // Also keep process alive
  setInterval(() => {
    if (!shuttingDown && activeWorkers.size === 0) {
      const incomplete = state.workers.filter(
        (w) => w.status !== 'done' && !(w.status === 'failed' && w.attempts >= 3),
      );
      if (incomplete.length === 0) {
        clearInterval(interval);
        process.exit(0);
      }
    }
  }, 5000);
}

main().catch((err) => {
  console.error('Coordinator fatal error:', err);
  process.exit(1);
});
