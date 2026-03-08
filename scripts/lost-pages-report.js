/**
 * SpotOn Auto - Lost Pages Report
 *
 * Compares a run-up day to a post-event window and highlights pages that lost impressions.
 *
 * Usage:
 *   node scripts/lost-pages-report.js
 *   node scripts/lost-pages-report.js --runup-date 2026-02-28 --compare-start 2026-03-01 --compare-end 2026-03-07
 *   node scripts/lost-pages-report.js --min-runup-impressions 8 --check-status
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const SITE_URL = 'sc-domain:spotonauto.com';

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtNum(n, digits = 0) {
  return Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function csvEscape(v) {
  const str = String(v ?? '');
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function buildClient() {
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error(`Credentials file not found at ${KEY_PATH}`);
  }
  const credentials = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  return google.searchconsole({ version: 'v1', auth });
}

async function fetchGscDatePageRows(searchconsole, startDate, endDate) {
  const all = [];
  const rowLimit = 25000;
  let startRow = 0;

  for (;;) {
    const res = await searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['date', 'page'],
        rowLimit,
        startRow,
      },
    });

    const rows = res.data.rows || [];
    all.push(...rows);
    if (rows.length < rowLimit) break;
    startRow += rowLimit;
    if (startRow > 500000) break;
  }

  return all;
}

function toPageMap(rows, runupDate, compareStart, compareEnd) {
  const runup = new Map();
  const compare = new Map();

  for (const row of rows) {
    const date = row.keys[0];
    const page = row.keys[1];
    const impressions = toNum(row.impressions);
    const clicks = toNum(row.clicks);

    if (date === runupDate) {
      if (!runup.has(page)) runup.set(page, { impressions: 0, clicks: 0 });
      const item = runup.get(page);
      item.impressions += impressions;
      item.clicks += clicks;
    }

    if (date >= compareStart && date <= compareEnd) {
      if (!compare.has(page)) compare.set(page, { impressions: 0, clicks: 0 });
      const item = compare.get(page);
      item.impressions += impressions;
      item.clicks += clicks;
    }
  }

  return { runup, compare };
}

async function checkStatuses(items) {
  const concurrency = 20;
  const queue = items.map((item, idx) => ({ item, idx }));
  const out = new Array(items.length);

  async function checkPage(page) {
    try {
      const res = await fetch(page, {
        redirect: 'manual',
        headers: { 'user-agent': 'SpotOnAuto-LostPagesAudit/1.0' },
      });
      return {
        status: res.status,
        location: res.headers.get('location') || '',
      };
    } catch (err) {
      return {
        status: 'ERR',
        location: String(err.message || err),
      };
    }
  }

  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const next = queue.pop();
      const status = await checkPage(next.item.page);
      out[next.idx] = { ...next.item, ...status };
    }
  });

  await Promise.all(workers);
  return out;
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = addDays(today, -1);
  const runupDate = getArg('runup-date', '2026-02-28');
  const compareStart = getArg('compare-start', '2026-03-01');
  const compareEnd = getArg('compare-end', yesterday);
  const minRunupImpressions = toNum(getArg('min-runup-impressions', '5'));
  const shouldCheckStatus = hasFlag('check-status');
  const compareDays = Math.floor((new Date(`${compareEnd}T00:00:00Z`) - new Date(`${compareStart}T00:00:00Z`)) / 86400000) + 1;

  if (compareStart > compareEnd) {
    throw new Error('compare-start must be <= compare-end');
  }
  if (runupDate > compareEnd) {
    throw new Error('runup-date must be <= compare-end');
  }

  const searchconsole = await buildClient();
  const rows = await fetchGscDatePageRows(searchconsole, runupDate, compareEnd);
  const { runup, compare } = toPageMap(rows, runupDate, compareStart, compareEnd);

  let lost = [...runup.entries()]
    .map(([page, r]) => {
      const c = compare.get(page) || { impressions: 0, clicks: 0 };
      const compareAvgImpressions = compareDays > 0 ? c.impressions / compareDays : 0;
      const compareAvgClicks = compareDays > 0 ? c.clicks / compareDays : 0;
      const deltaImpressions = compareAvgImpressions - r.impressions;
      const deltaPct = r.impressions ? (deltaImpressions / r.impressions) * 100 : 0;
      return {
        page,
        runupImpressions: r.impressions,
        compareAvgImpressions,
        compareImpressions: c.impressions,
        deltaImpressions,
        deltaPct,
        runupClicks: r.clicks,
        compareAvgClicks,
        compareClicks: c.clicks,
      };
    })
    .filter(r => r.runupImpressions >= minRunupImpressions)
    .sort((a, b) => {
      if (a.deltaImpressions !== b.deltaImpressions) return a.deltaImpressions - b.deltaImpressions;
      return b.runupImpressions - a.runupImpressions;
    });

  if (shouldCheckStatus) {
    lost = await checkStatuses(lost);
  } else {
    lost = lost.map(item => ({ ...item, status: '', location: '' }));
  }

  const outputDir = path.join(__dirname, 'seo-reports');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outPath = path.join(
    outputDir,
    `lost-pages-${runupDate}-vs-${compareStart}_to_${compareEnd}.csv`,
  );

  const header = [
    'page',
    'runup_impressions',
    'compare_avg_daily_impressions',
    'compare_impressions',
    'delta_avg_daily_impressions',
    'delta_pct',
    'runup_clicks',
    'compare_avg_daily_clicks',
    'compare_clicks',
    'http_status',
    'redirect_location',
  ];

  const lines = [
    header.join(','),
    ...lost.map(item => [
      csvEscape(item.page),
      item.runupImpressions,
      item.compareAvgImpressions.toFixed(2),
      item.compareImpressions,
      item.deltaImpressions.toFixed(2),
      item.deltaPct.toFixed(2),
      item.runupClicks,
      item.compareAvgClicks.toFixed(2),
      item.compareClicks,
      csvEscape(item.status),
      csvEscape(item.location),
    ].join(',')),
  ];

  fs.writeFileSync(outPath, lines.join('\n'));

  const runupTotal = [...runup.values()].reduce((sum, x) => sum + x.impressions, 0);
  const compareTotal = [...compare.values()].reduce((sum, x) => sum + x.impressions, 0);

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                 SpotOn Auto - Lost Pages Report             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`Run-up day:        ${runupDate}`);
  console.log(`Compare window:    ${compareStart} to ${compareEnd}`);
  console.log(`Compare days:      ${compareDays}`);
  console.log(`Run-up total impr: ${fmtNum(runupTotal)}`);
  console.log(`Compare total impr:${fmtNum(compareTotal)}`);
  console.log(`Rows in report:    ${fmtNum(lost.length)} (min run-up impr ${minRunupImpressions})`);
  console.log(`Status checks:     ${shouldCheckStatus ? 'enabled' : 'disabled'}`);
  console.log(`CSV export:        ${outPath}\n`);

  console.log('Top lost pages:\n');
  for (const item of lost.slice(0, 30)) {
    const statusText = item.status ? ` | status ${item.status}` : '';
    console.log(
      `${item.page} | ${fmtNum(item.runupImpressions)} -> ${fmtNum(item.compareAvgImpressions, 2)} avg/day (${fmtNum(item.deltaPct, 1)}%)${statusText}`,
    );
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
