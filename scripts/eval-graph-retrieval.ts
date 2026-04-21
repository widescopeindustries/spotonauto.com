#!/usr/bin/env node

import { pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';
import goldenCases from '../src/data/graph-retrieval-golden.json' with { type: 'json' };
import { retrieveGraphManualContext } from '../src/services/manualGraphRetrieval.ts';

interface GoldenCase {
  id: string;
  year: number;
  make: string;
  model: string;
  task: string;
  expectedTerms: string[];
}

interface CaseResult {
  id: string;
  mode: string;
  confidence: number;
  passedGate: boolean;
  sourceCount: number;
  precision: number;
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

function parseThreshold(name: string, fallback: number): number {
  const raw = process.argv.find((entry) => entry.startsWith(`${name}=`));
  if (!raw) return fallback;
  const value = Number(raw.split('=').slice(1).join('='));
  return Number.isFinite(value) ? value : fallback;
}

function clip(value: string, maxLength = 120): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function scorePrecision(
  expectedTerms: string[],
  sources: Array<{ title: string; snippet?: string; path?: string }>,
): number {
  if (sources.length === 0) return 0;
  const terms = [...new Set(expectedTerms.map((term) => term.toLowerCase().trim()).filter(Boolean))];
  if (terms.length === 0) return 1;

  let matched = 0;
  for (const source of sources) {
    const haystack = `${source.title} ${source.snippet || ''} ${source.path || ''}`.toLowerCase();
    if (terms.some((term) => haystack.includes(term))) matched += 1;
  }
  return matched / sources.length;
}

async function evaluateCase(entry: GoldenCase): Promise<CaseResult> {
  const result = await retrieveGraphManualContext({
    year: entry.year,
    make: entry.make,
    model: entry.model,
    task: entry.task,
    maxCandidates: 4,
  });

  const precision = scorePrecision(entry.expectedTerms, result.sources);
  return {
    id: entry.id,
    mode: result.mode,
    confidence: result.confidence,
    passedGate: result.gate.passed,
    sourceCount: result.sources.length,
    precision,
  };
}

async function main(): Promise<void> {
  loadLocalEnvFiles();
  const minPrecision = parseThreshold('--min-precision', 0.58);
  const maxFallbackRate = parseThreshold('--max-fallback-rate', 0.45);
  const minPassRate = parseThreshold('--min-pass-rate', 0.55);
  const cases = goldenCases as GoldenCase[];

  const results = await Promise.all(cases.map((entry) => evaluateCase(entry)));
  const fallbackCount = results.filter((result) => result.mode === 'none' || !result.passedGate).length;
  const passCount = results.filter((result) => result.passedGate && result.mode !== 'none').length;
  const avgPrecision = results.reduce((sum, result) => sum + result.precision, 0) / Math.max(1, results.length);
  const fallbackRate = fallbackCount / Math.max(1, results.length);
  const passRate = passCount / Math.max(1, results.length);

  const report = {
    generatedAt: new Date().toISOString(),
    thresholds: {
      minPrecision,
      maxFallbackRate,
      minPassRate,
    },
    metrics: {
      totalCases: results.length,
      averagePrecision: Number(avgPrecision.toFixed(4)),
      fallbackRate: Number(fallbackRate.toFixed(4)),
      passRate: Number(passRate.toFixed(4)),
    },
    cases: results.map((result) => ({
      ...result,
      confidence: Number(result.confidence.toFixed(4)),
      precision: Number(result.precision.toFixed(4)),
    })),
  };

  console.log(JSON.stringify(report, null, 2));

  const failures: string[] = [];
  if (avgPrecision < minPrecision) failures.push(`avg precision ${clip(String(avgPrecision))} < ${minPrecision}`);
  if (fallbackRate > maxFallbackRate) failures.push(`fallback rate ${clip(String(fallbackRate))} > ${maxFallbackRate}`);
  if (passRate < minPassRate) failures.push(`pass rate ${clip(String(passRate))} < ${minPassRate}`);

  if (failures.length > 0) {
    console.error(`Graph retrieval eval failed: ${failures.join('; ')}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
