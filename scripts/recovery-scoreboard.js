/**
 * SpotOn Auto Recovery Scoreboard
 *
 * Combines GSC + GA4 daily metrics into one recovery dashboard.
 *
 * Usage:
 *   node scripts/recovery-scoreboard.js
 *   node scripts/recovery-scoreboard.js --baseline-start 2026-02-24 --baseline-end 2026-02-28
 *   node scripts/recovery-scoreboard.js --start 2026-02-01 --end 2026-03-31
 *   node scripts/recovery-scoreboard.js --event-date 2026-03-01
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const SITE_URL = 'sc-domain:spotonauto.com';
const GA_PROPERTY_ID = '520432705';

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dateRange(start, end) {
  const out = [];
  let d = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  while (d <= e) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function pct(n, d) {
  if (!d) return 0;
  return (n / d) * 100;
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toMaybeNum(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function fmtNum(n, digits = 0) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return '-';
  return Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function trailingAverage(rows, endDate, field, days) {
  const start = addDays(endDate, -(days - 1));
  const vals = rows
    .filter(r => r.date >= start && r.date <= endDate)
    .map(r => toMaybeNum(r[field]))
    .filter(v => v !== null);
  return avg(vals);
}

function getStatus(gscRecoveryPct, gaRecoveryPct, posDelta) {
  const strong = gscRecoveryPct >= 80 && gaRecoveryPct >= 70 && posDelta <= 2;
  const moderate = gscRecoveryPct >= 40 || gaRecoveryPct >= 35;
  if (strong) return 'REBOUNDED';
  if (moderate) return 'RECOVERING';
  return 'NOT RECOVERED';
}

async function buildClients() {
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error(`Credentials file not found at ${KEY_PATH}`);
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

async function fetchGscDaily(searchconsole, startDate, endDate) {
  const res = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['date'],
      rowLimit: 5000,
    },
  });

  const map = new Map();
  for (const row of res.data.rows || []) {
    map.set(row.keys[0], {
      gscClicks: toNum(row.clicks),
      gscImpressions: toNum(row.impressions),
      gscCtr: toNum(row.ctr),
      gscPosition: toNum(row.position),
    });
  }
  return map;
}

async function fetchGaDailyByMedium(analyticsdata, startDate, endDate) {
  const res = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }, { name: 'sessionMedium' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
      limit: 20000,
    },
  });

  const map = new Map();
  for (const row of res.data.rows || []) {
    const rawDate = row.dimensionValues?.[0]?.value || '';
    const date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    const medium = row.dimensionValues?.[1]?.value || '(not set)';
    const sessions = toNum(row.metricValues?.[0]?.value);
    if (!map.has(date)) {
      map.set(date, { gaOrganicSessions: 0, gaTotalSessions: 0 });
    }
    const item = map.get(date);
    item.gaTotalSessions += sessions;
    if (medium === 'organic') {
      item.gaOrganicSessions += sessions;
    }
  }
  return map;
}

function printTable(rows) {
  const cols = [
    'date',
    'gscImpressions',
    'gscClicks',
    'gscPosition',
    'gaOrganicSessions',
    'gaTotalSessions',
    'organicSharePct',
  ];
  const widths = {};
  for (const c of cols) {
    widths[c] = Math.max(
      c.length,
      ...rows.map(r => String(r[c] ?? '').length),
    );
  }
  const header = cols.map(c => c.padEnd(widths[c])).join(' | ');
  const divider = cols.map(c => '-'.repeat(widths[c])).join('-+-');
  console.log(header);
  console.log(divider);
  for (const row of rows) {
    const line = cols.map(c => String(row[c] ?? '').padEnd(widths[c])).join(' | ');
    console.log(line);
  }
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = addDays(today, -1);
  const startDate = getArg('start', '2026-02-01');
  const endDate = getArg('end', yesterday);
  const baselineStart = getArg('baseline-start', '2026-02-24');
  const baselineEnd = getArg('baseline-end', '2026-02-28');
  const eventDate = getArg('event-date', '2026-03-01');

  const { searchconsole, analyticsdata } = await buildClients();

  const [gscMap, gaMap] = await Promise.all([
    fetchGscDaily(searchconsole, startDate, endDate),
    fetchGaDailyByMedium(analyticsdata, startDate, endDate),
  ]);

  const dates = dateRange(startDate, endDate);
  const rows = dates.map(date => {
    const g = gscMap.get(date) || {};
    const a = gaMap.get(date) || {};
    const gaOrganicSessions = toMaybeNum(a.gaOrganicSessions);
    const gaTotalSessions = toMaybeNum(a.gaTotalSessions);
    return {
      date,
      gscImpressions: toMaybeNum(g.gscImpressions),
      gscClicks: toMaybeNum(g.gscClicks),
      gscCtr: toMaybeNum(g.gscCtr),
      gscPosition: toMaybeNum(g.gscPosition),
      gaOrganicSessions,
      gaTotalSessions,
      organicSharePct: gaTotalSessions ? pct(gaOrganicSessions || 0, gaTotalSessions) : null,
    };
  });

  const baselineRows = rows.filter(
    r =>
      r.date >= baselineStart &&
      r.date <= baselineEnd &&
      r.gscImpressions !== null &&
      r.gaOrganicSessions !== null,
  );
  if (!baselineRows.length) {
    throw new Error(`No baseline rows found for ${baselineStart} to ${baselineEnd}`);
  }

  const latestDate = rows[rows.length - 1]?.date;
  const gscLatestDate =
    [...rows].reverse().find(r => r.gscImpressions !== null)?.date || latestDate;
  const gaLatestDate =
    [...rows].reverse().find(r => r.gaOrganicSessions !== null)?.date || latestDate;
  const gscPostRows = rows.filter(r => r.date >= eventDate && r.gscImpressions !== null);
  const gaPostRows = rows.filter(r => r.date >= eventDate && r.gaOrganicSessions !== null);
  const gscPostRecent = gscPostRows.slice(-3);
  const gaPostRecent = gaPostRows.slice(-3);

  const baseline = {
    gscImpressionsAvg: avg(baselineRows.map(r => toNum(r.gscImpressions))),
    gscClicksAvg: avg(baselineRows.map(r => toNum(r.gscClicks))),
    gscPositionAvg: avg(baselineRows.map(r => toNum(r.gscPosition))),
    gaOrganicAvg: avg(baselineRows.map(r => toNum(r.gaOrganicSessions))),
    gaTotalAvg: avg(baselineRows.map(r => toNum(r.gaTotalSessions))),
  };

  const trailing = {
    gscImpr7: trailingAverage(rows, gscLatestDate, 'gscImpressions', 7),
    gscImpr3: trailingAverage(rows, gscLatestDate, 'gscImpressions', 3),
    gaOrg7: trailingAverage(rows, gaLatestDate, 'gaOrganicSessions', 7),
    gaOrg3: trailingAverage(rows, gaLatestDate, 'gaOrganicSessions', 3),
  };

  const post = {
    gscImprRecent: avg(gscPostRecent.map(r => toNum(r.gscImpressions))),
    gaOrgRecent: avg(gaPostRecent.map(r => toNum(r.gaOrganicSessions))),
  };

  const gscRecoveryPct = pct(post.gscImprRecent, baseline.gscImpressionsAvg);
  const gaRecoveryPct = pct(post.gaOrgRecent, baseline.gaOrganicAvg);
  const posDelta = trailingAverage(rows, gscLatestDate, 'gscPosition', 7) - baseline.gscPositionAvg;
  const status = getStatus(gscRecoveryPct, gaRecoveryPct, posDelta);

  const last14 = rows.slice(-14).map(r => ({
    date: r.date,
    gscImpressions: fmtNum(r.gscImpressions),
    gscClicks: fmtNum(r.gscClicks),
    gscPosition: fmtNum(r.gscPosition, 1),
    gaOrganicSessions: fmtNum(r.gaOrganicSessions),
    gaTotalSessions: fmtNum(r.gaTotalSessions),
    organicSharePct: r.organicSharePct === null ? '-' : `${fmtNum(r.organicSharePct, 1)}%`,
  }));

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║            SpotOn Auto - Recovery Scoreboard                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`Date range: ${startDate} to ${endDate}`);
  console.log(`Baseline:   ${baselineStart} to ${baselineEnd}`);
  console.log(`Event date: ${eventDate}`);
  console.log(`Latest day: ${latestDate}`);
  console.log(`GSC latest: ${gscLatestDate}`);
  console.log(`GA latest:  ${gaLatestDate}\n`);

  console.log('Recovery Status:', status);
  console.log(`GSC post-event recent vs baseline: ${fmtNum(gscRecoveryPct, 1)}% (${fmtNum(post.gscImprRecent, 1)} vs ${fmtNum(baseline.gscImpressionsAvg, 1)} impr/day)`);
  console.log(`GA organic post-event recent vs baseline: ${fmtNum(gaRecoveryPct, 1)}% (${fmtNum(post.gaOrgRecent, 1)} vs ${fmtNum(baseline.gaOrganicAvg, 1)} sessions/day)`);
  console.log(`GSC 7d trend avg: ${fmtNum(trailing.gscImpr7, 1)} impr/day`);
  console.log(`GA organic 7d trend avg: ${fmtNum(trailing.gaOrg7, 1)} sessions/day`);
  console.log(`GSC position delta (7d vs baseline): ${fmtNum(posDelta, 1)}\n`);

  console.log('Recent Daily Metrics:\n');
  printTable(last14);

  const outputDir = path.join(__dirname, 'seo-reports');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outPath = path.join(outputDir, `recovery-scoreboard-${latestDate}.csv`);
  const csvHeader = [
    'date',
    'gsc_impressions',
    'gsc_clicks',
    'gsc_ctr',
    'gsc_position',
    'ga_organic_sessions',
    'ga_total_sessions',
    'ga_organic_share_pct',
  ].join(',');
  const csvRows = rows.map(r => [
    r.date,
    r.gscImpressions ?? '',
    r.gscClicks ?? '',
    r.gscCtr ?? '',
    r.gscPosition ?? '',
    r.gaOrganicSessions ?? '',
    r.gaTotalSessions ?? '',
    r.organicSharePct ?? '',
  ].join(','));
  fs.writeFileSync(outPath, [csvHeader, ...csvRows].join('\n'));
  console.log(`\nExported CSV: ${outPath}\n`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
