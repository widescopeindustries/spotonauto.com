#!/usr/bin/env npx tsx

import * as fs from 'fs';
import * as path from 'path';
import { getManualEmbeddingsBackend, testManualEmbeddingsConnection } from '../src/lib/manualEmbeddingsStore';

function loadEnv(): void {
  const candidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(__dirname, '..', '.env.local'),
    path.resolve(__dirname, '.env.local'),
  ];
  const envPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!envPath) return;

  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main(): Promise<void> {
  loadEnv();

  const backend = getManualEmbeddingsBackend();
  const health = await testManualEmbeddingsConnection();

  console.log('Manual backbone health');
  console.log('======================');
  console.log(`Backend: ${backend}`);
  console.log(`Healthy: ${health.ok ? 'yes' : 'no'}`);

  if (health.totalSections !== undefined) {
    console.log(`Sections: ${health.totalSections}`);
  }
  if (health.totalMakes !== undefined) {
    console.log(`Makes: ${health.totalMakes}`);
  }
  if (health.totalYears !== undefined) {
    console.log(`Years: ${health.totalYears}`);
  }
  if (health.totalMakeYears !== undefined) {
    console.log(`Make-years: ${health.totalMakeYears}`);
  }
  if (health.newestEntry) {
    console.log(`Newest entry: ${health.newestEntry}`);
  }

  if (!health.ok) {
    console.error(`Error: ${health.error}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('FATAL:', error);
  process.exit(1);
});
