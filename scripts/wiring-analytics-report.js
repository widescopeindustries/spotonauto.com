/**
 * SpotOn Auto - Wiring Analytics Report (GA4 + GSC)
 *
 * Focused analytics for /wiring pages only.
 *
 * Usage:
 *   node scripts/wiring-analytics-report.js
 *   node scripts/wiring-analytics-report.js --start 2026-03-01 --end 2026-03-31
 *   node scripts/wiring-analytics-report.js --export
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

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
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

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmt(n, digits = 0) {
  return Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function pct(n, d) {
  if (!d) return 0;
  return (n / d) * 100;
}

function percentDelta(current, previous) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
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

async function fetchGscDatePageRows(searchconsole, startDate, endDate) {
  const allRows = [];
  let startRow = 0;
  const rowLimit = 25000;

  while (true) {
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

    const chunk = res.data.rows || [];
    allRows.push(...chunk);
    if (chunk.length < rowLimit) break;
    startRow += chunk.length;

    // Safety cap for extremely large pulls.
    if (startRow >= 250000) break;
  }

  return allRows.filter(row => String(row.keys?.[1] || '').includes('/wiring'));
}

async function fetchGaWiringRows(analyticsdata, startDate, endDate) {
  const res = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }, { name: 'pagePath' }, { name: 'sessionMedium' }],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'BEGINS_WITH',
            value: '/wiring',
          },
        },
      },
      orderBys: [{ dimension: { dimensionName: 'date' } }],
      limit: 100000,
    },
  });

  return res.data.rows || [];
}

function aggregateGsc(rows) {
  const byDate = {};
  const byPage = {};

  for (const row of rows) {
    const date = row.keys?.[0];
    const page = row.keys?.[1];
    if (!date || !page) continue;

    const clicks = toNum(row.clicks);
    const impressions = toNum(row.impressions);
    const position = toNum(row.position);

    if (!byDate[date]) byDate[date] = { clicks: 0, impressions: 0, posWeighted: 0 };
    byDate[date].clicks += clicks;
    byDate[date].impressions += impressions;
    byDate[date].posWeighted += position * impressions;

    if (!byPage[page]) byPage[page] = { clicks: 0, impressions: 0, posWeighted: 0 };
    byPage[page].clicks += clicks;
    byPage[page].impressions += impressions;
    byPage[page].posWeighted += position * impressions;
  }

  return { byDate, byPage };
}

function aggregateGa(rows) {
  const byDate = {};
  const byPage = {};

  for (const row of rows) {
    const rawDate = row.dimensionValues?.[0]?.value || '';
    const date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    const page = row.dimensionValues?.[1]?.value || '';
    const medium = row.dimensionValues?.[2]?.value || '(not set)';
    const views = toNum(row.metricValues?.[0]?.value);

    if (!byDate[date]) {
      byDate[date] = { totalViews: 0, organicViews: 0, directViews: 0, referralViews: 0, otherViews: 0 };
    }
    byDate[date].totalViews += views;
    if (medium === 'organic') byDate[date].organicViews += views;
    else if (medium === '(none)') byDate[date].directViews += views;
    else if (medium === 'referral') byDate[date].referralViews += views;
    else byDate[date].otherViews += views;

    if (!byPage[page]) byPage[page] = { views: 0, organicViews: 0 };
    byPage[page].views += views;
    if (medium === 'organic') byPage[page].organicViews += views;
  }

  return { byDate, byPage };
}

function summarizeWindow(rows, field, startDate, endDate) {
  return rows
    .filter(r => r.date >= startDate && r.date <= endDate)
    .reduce((acc, row) => acc + toNum(row[field]), 0);
}

function printTable(rows, columns) {
  if (rows.length === 0) {
    console.log('  No rows\n');
    return;
  }
  const widths = {};
  for (const col of columns) {
    widths[col] = Math.max(col.length, ...rows.map(r => String(r[col] ?? '').length));
  }
  const header = columns.map(c => String(c).padEnd(widths[c])).join(' | ');
  const divider = columns.map(c => '-'.repeat(widths[c])).join('-+-');
  console.log('  ' + header);
  console.log('  ' + divider);
  for (const row of rows) {
    const line = columns.map(c => String(row[c] ?? '').padEnd(widths[c])).join(' | ');
    console.log('  ' + line);
  }
  console.log('');
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const endDate = getArg('end', addDays(today, -1));
  const startDate = getArg('start', addDays(endDate, -34));
  const shouldExport = hasFlag('export');

  const { searchconsole, analyticsdata } = await buildClients();
  const [gscRows, gaRows] = await Promise.all([
    fetchGscDatePageRows(searchconsole, startDate, endDate),
    fetchGaWiringRows(analyticsdata, startDate, endDate),
  ]);

  const gsc = aggregateGsc(gscRows);
  const ga = aggregateGa(gaRows);
  const dates = dateRange(startDate, endDate);

  const daily = dates.map(date => {
    const g = gsc.byDate[date];
    const a = ga.byDate[date];
    const gImpr = g ? g.impressions : 0;
    const gClicks = g ? g.clicks : 0;
    return {
      date,
      gsc_impr: gImpr,
      gsc_clicks: gClicks,
      gsc_ctr: gImpr ? pct(gClicks, gImpr) : 0,
      gsc_pos: g && g.impressions ? g.posWeighted / g.impressions : 0,
      ga_views: a ? a.totalViews : 0,
      ga_organic: a ? a.organicViews : 0,
      ga_direct: a ? a.directViews : 0,
      ga_referral: a ? a.referralViews : 0,
    };
  });

  const totalGscImpressions = daily.reduce((acc, d) => acc + d.gsc_impr, 0);
  const totalGscClicks = daily.reduce((acc, d) => acc + d.gsc_clicks, 0);
  const totalGaViews = daily.reduce((acc, d) => acc + d.ga_views, 0);
  const totalGaOrganic = daily.reduce((acc, d) => acc + d.ga_organic, 0);

  const last7Start = addDays(endDate, -6);
  const prev7End = addDays(last7Start, -1);
  const prev7Start = addDays(prev7End, -6);

  const last7GscImpr = summarizeWindow(daily, 'gsc_impr', last7Start, endDate);
  const prev7GscImpr = summarizeWindow(daily, 'gsc_impr', prev7Start, prev7End);
  const last7GscClicks = summarizeWindow(daily, 'gsc_clicks', last7Start, endDate);
  const prev7GscClicks = summarizeWindow(daily, 'gsc_clicks', prev7Start, prev7End);
  const last7GaViews = summarizeWindow(daily, 'ga_views', last7Start, endDate);
  const prev7GaViews = summarizeWindow(daily, 'ga_views', prev7Start, prev7End);
  const last7GaOrganic = summarizeWindow(daily, 'ga_organic', last7Start, endDate);
  const prev7GaOrganic = summarizeWindow(daily, 'ga_organic', prev7Start, prev7End);

  const gscTopPages = Object.entries(gsc.byPage)
    .map(([page, stats]) => ({
      page,
      clicks: stats.clicks,
      impressions: stats.impressions,
      ctr: stats.impressions ? pct(stats.clicks, stats.impressions) : 0,
      position: stats.impressions ? stats.posWeighted / stats.impressions : 0,
    }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);

  const gaTopPages = Object.entries(ga.byPage)
    .map(([page, stats]) => ({
      page,
      views: stats.views,
      organicViews: stats.organicViews,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 15);

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║            SpotOn Auto - Wiring Analytics Report            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`Period: ${startDate} to ${endDate}`);
  console.log(`GSC rows (/wiring): ${gscRows.length}`);
  console.log(`GA rows (/wiring): ${gaRows.length}\n`);

  console.log('Summary');
  console.log(`  GSC impressions: ${fmt(totalGscImpressions)} | clicks: ${fmt(totalGscClicks)} | CTR: ${fmt(pct(totalGscClicks, totalGscImpressions), 2)}%`);
  console.log(`  GA wiring views: ${fmt(totalGaViews)} | organic views: ${fmt(totalGaOrganic)} (${fmt(pct(totalGaOrganic, totalGaViews), 1)}%)\n`);

  console.log('Last 7 vs Previous 7');
  console.log(`  GSC impressions: ${fmt(last7GscImpr)} vs ${fmt(prev7GscImpr)} (${fmt(percentDelta(last7GscImpr, prev7GscImpr), 1)}%)`);
  console.log(`  GSC clicks: ${fmt(last7GscClicks)} vs ${fmt(prev7GscClicks)} (${fmt(percentDelta(last7GscClicks, prev7GscClicks), 1)}%)`);
  console.log(`  GA wiring views: ${fmt(last7GaViews)} vs ${fmt(prev7GaViews)} (${fmt(percentDelta(last7GaViews, prev7GaViews), 1)}%)`);
  console.log(`  GA organic views: ${fmt(last7GaOrganic)} vs ${fmt(prev7GaOrganic)} (${fmt(percentDelta(last7GaOrganic, prev7GaOrganic), 1)}%)\n`);

  console.log('Daily (Last 21 days)');
  const last21 = daily.slice(-21).map(d => ({
    date: d.date,
    gsc_impr: fmt(d.gsc_impr),
    gsc_clicks: fmt(d.gsc_clicks),
    gsc_ctr: `${fmt(d.gsc_ctr, 1)}%`,
    gsc_pos: d.gsc_pos ? fmt(d.gsc_pos, 1) : '-',
    ga_views: fmt(d.ga_views),
    ga_organic: fmt(d.ga_organic),
  }));
  printTable(last21, ['date', 'gsc_impr', 'gsc_clicks', 'gsc_ctr', 'gsc_pos', 'ga_views', 'ga_organic']);

  console.log('Top Wiring Pages (GSC by impressions)');
  printTable(
    gscTopPages.map(p => ({
      page: p.page,
      impressions: fmt(p.impressions),
      clicks: fmt(p.clicks),
      ctr: `${fmt(p.ctr, 1)}%`,
      position: fmt(p.position, 1),
    })),
    ['page', 'impressions', 'clicks', 'ctr', 'position'],
  );

  console.log('Top Wiring Pages (GA by views)');
  printTable(
    gaTopPages.map(p => ({
      page: p.page,
      views: fmt(p.views),
      organicViews: fmt(p.organicViews),
    })),
    ['page', 'views', 'organicViews'],
  );

  if (shouldExport) {
    const outputDir = path.join(__dirname, 'seo-reports');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const outPath = path.join(outputDir, `wiring-analytics-${endDate}.csv`);
    const header = 'date,gsc_impressions,gsc_clicks,gsc_ctr,gsc_position,ga_views,ga_organic,ga_direct,ga_referral';
    const lines = daily.map(d => [
      d.date,
      d.gsc_impr,
      d.gsc_clicks,
      d.gsc_ctr,
      d.gsc_pos,
      d.ga_views,
      d.ga_organic,
      d.ga_direct,
      d.ga_referral,
    ].join(','));
    fs.writeFileSync(outPath, [header, ...lines].join('\n'));
    console.log(`Exported CSV: ${outPath}`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

