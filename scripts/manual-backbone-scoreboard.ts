#!/usr/bin/env npx tsx

import * as fs from 'fs';
import * as path from 'path';
import { google } from 'googleapis';
import { getManualEmbeddingsBackend, testManualEmbeddingsConnection } from '../src/lib/manualEmbeddingsStore';

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const OUTPUT_DIR = path.join(__dirname, 'seo-reports');
const SITE_URL = 'sc-domain:spotonauto.com';
const GA_PROPERTY_ID = '520432705';

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

function getArg(name: string, fallback: string | null = null): string | null {
  const idx = process.argv.indexOf(`--${name}`);
  return idx === -1 ? fallback : (process.argv[idx + 1] || fallback);
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);

  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function avg(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function toNum(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function fmtNum(value: number, digits = 0): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function pct(numerator: number, denominator: number): number {
  return denominator > 0 ? (numerator / denominator) * 100 : 0;
}

async function buildGoogleClients() {
  if (!fs.existsSync(KEY_PATH)) {
    return null;
  }

  const credentials = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/analytics.readonly',
    ],
  });

  return {
    searchconsole: google.searchconsole({ version: 'v1', auth }),
    analyticsdata: google.analyticsdata({ version: 'v1beta', auth }),
  };
}

async function fetchGscDaily(
  searchconsole: ReturnType<typeof google.searchconsole>,
  startDate: string,
  endDate: string,
) {
  const response = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['date'],
      rowLimit: 5000,
    },
  });

  const map = new Map<string, { impressions: number; clicks: number; position: number }>();
  for (const row of response.data.rows || []) {
    map.set(String(row.keys?.[0] || ''), {
      impressions: toNum(row.impressions),
      clicks: toNum(row.clicks),
      position: toNum(row.position),
    });
  }
  return map;
}

async function fetchGaDailyOrganic(
  analyticsdata: ReturnType<typeof google.analyticsdata>,
  startDate: string,
  endDate: string,
) {
  const response = await (analyticsdata.properties.runReport as any)({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }, { name: 'sessionMedium' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
      limit: 20000,
    },
  });

  const map = new Map<string, { organicSessions: number; totalSessions: number }>();
  for (const row of response.data.rows || []) {
    const rawDate = row.dimensionValues?.[0]?.value || '';
    const date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    const medium = row.dimensionValues?.[1]?.value || '(not set)';
    const sessions = toNum(row.metricValues?.[0]?.value);
    if (!map.has(date)) {
      map.set(date, { organicSessions: 0, totalSessions: 0 });
    }
    const current = map.get(date)!;
    current.totalSessions += sessions;
    if (medium === 'organic') {
      current.organicSessions += sessions;
    }
  }
  return map;
}

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

async function main(): Promise<void> {
  loadEnv();

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = addDays(today, -1);
  const startDate = getArg('start', '2026-02-01')!;
  const endDate = getArg('end', yesterday)!;
  const baselineStart = getArg('baseline-start', '2026-02-24')!;
  const baselineEnd = getArg('baseline-end', '2026-02-28')!;
  const eventDate = getArg('event-date', '2026-03-01')!;

  const backend = getManualEmbeddingsBackend();
  const health = await testManualEmbeddingsConnection();
  const googleClients = await buildGoogleClients();

  let recovery: null | {
    latestGscDate: string;
    latestGaDate: string;
    baselineImpressions: number;
    baselineOrganicSessions: number;
    latestImpressions3d: number;
    latestOrganicSessions3d: number;
    impressionRecoveryPct: number;
    organicRecoveryPct: number;
    baselinePosition: number;
    latestPosition3d: number;
    positionDelta: number;
    status: string;
  } = null;

  if (googleClients) {
    const [gscMap, gaMap] = await Promise.all([
      fetchGscDaily(googleClients.searchconsole, startDate, endDate),
      fetchGaDailyOrganic(googleClients.analyticsdata, startDate, endDate),
    ]);

    const rows = dateRange(startDate, endDate).map((date) => ({
      date,
      gscImpressions: gscMap.get(date)?.impressions ?? null,
      gscPosition: gscMap.get(date)?.position ?? null,
      gaOrganicSessions: gaMap.get(date)?.organicSessions ?? null,
    }));

    const baselineRows = rows.filter((row) => row.date >= baselineStart && row.date <= baselineEnd);
    const latestGscRows = rows.filter((row) => row.date >= eventDate && row.gscImpressions !== null).slice(-3);
    const latestGaRows = rows.filter((row) => row.date >= eventDate && row.gaOrganicSessions !== null).slice(-3);
    const latestPositionRows = rows.filter((row) => row.date >= eventDate && row.gscPosition !== null).slice(-3);
    const latestGscDate = [...rows].reverse().find((row) => row.gscImpressions !== null)?.date || endDate;
    const latestGaDate = [...rows].reverse().find((row) => row.gaOrganicSessions !== null)?.date || endDate;

    const baselineImpressions = avg(baselineRows.map((row) => toNum(row.gscImpressions)));
    const baselineOrganicSessions = avg(baselineRows.map((row) => toNum(row.gaOrganicSessions)));
    const baselinePosition = avg(baselineRows.map((row) => toNum(row.gscPosition)));
    const latestImpressions3d = avg(latestGscRows.map((row) => toNum(row.gscImpressions)));
    const latestOrganicSessions3d = avg(latestGaRows.map((row) => toNum(row.gaOrganicSessions)));
    const latestPosition3d = avg(latestPositionRows.map((row) => toNum(row.gscPosition)));
    const impressionRecoveryPct = pct(latestImpressions3d, baselineImpressions);
    const organicRecoveryPct = pct(latestOrganicSessions3d, baselineOrganicSessions);
    const positionDelta = latestPosition3d - baselinePosition;

    let status = 'NOT RECOVERED';
    if (impressionRecoveryPct >= 80 && organicRecoveryPct >= 70 && positionDelta <= 2) {
      status = 'REBOUNDED';
    } else if (impressionRecoveryPct >= 40 || organicRecoveryPct >= 35) {
      status = 'RECOVERING';
    }

    recovery = {
      latestGscDate,
      latestGaDate,
      baselineImpressions,
      baselineOrganicSessions,
      latestImpressions3d,
      latestOrganicSessions3d,
      impressionRecoveryPct,
      organicRecoveryPct,
      baselinePosition,
      latestPosition3d,
      positionDelta,
      status,
    };
  }

  console.log('Manual Backbone Scoreboard');
  console.log('==========================');
  console.log(`Backend: ${backend}`);
  console.log(`Backbone healthy: ${health.ok ? 'yes' : 'no'}`);
  console.log(`Sections indexed: ${health.totalSections ?? 0}`);
  if (health.totalMakes !== undefined) console.log(`Makes: ${health.totalMakes}`);
  if (health.totalYears !== undefined) console.log(`Years: ${health.totalYears}`);
  if (health.totalMakeYears !== undefined) console.log(`Make-years: ${health.totalMakeYears}`);
  if (health.newestEntry) console.log(`Newest entry: ${health.newestEntry}`);

  if (recovery) {
    console.log('');
    console.log('Recovery');
    console.log('--------');
    console.log(`Status: ${recovery.status}`);
    console.log(`Baseline impressions/day: ${fmtNum(recovery.baselineImpressions, 1)}`);
    console.log(`Latest 3d impressions/day: ${fmtNum(recovery.latestImpressions3d, 1)} (${fmtNum(recovery.impressionRecoveryPct, 1)}%)`);
    console.log(`Baseline organic sessions/day: ${fmtNum(recovery.baselineOrganicSessions, 1)}`);
    console.log(`Latest 3d organic sessions/day: ${fmtNum(recovery.latestOrganicSessions3d, 1)} (${fmtNum(recovery.organicRecoveryPct, 1)}%)`);
    console.log(`Baseline avg position: ${fmtNum(recovery.baselinePosition, 1)}`);
    console.log(`Latest 3d avg position: ${fmtNum(recovery.latestPosition3d, 1)} (${recovery.positionDelta >= 0 ? '+' : ''}${fmtNum(recovery.positionDelta, 1)})`);
    console.log(`Latest GSC date: ${recovery.latestGscDate}`);
    console.log(`Latest GA date: ${recovery.latestGaDate}`);
  } else {
    console.log('');
    console.log('Recovery');
    console.log('--------');
    console.log('Google credentials unavailable. Recovery metrics skipped.');
  }

  ensureOutputDir();
  const reportDate = today;
  const reportPath = path.join(OUTPUT_DIR, `manual-backbone-scoreboard-${reportDate}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    backend,
    health,
    recovery,
  }, null, 2));

  console.log('');
  console.log(`Saved: ${reportPath}`);

  if (!health.ok) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('FATAL:', error);
  process.exit(1);
});
