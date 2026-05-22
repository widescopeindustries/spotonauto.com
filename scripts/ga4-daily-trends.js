/**
 * GA4 Daily Trends — Pull day-by-day metrics for comparison.
 *
 * Usage:
 *   node scripts/ga4-daily-trends.js
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const GA_PROPERTY_ID = '537013586';

async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  return auth.getClient();
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function runReport(client, startDate, endDate, dimensions, metrics, dimensionFilter) {
  const property = `properties/${GA_PROPERTY_ID}`;
  const res = await client.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: dimensions.map((name) => ({ name })),
      metrics: metrics.map((name) => ({ name })),
      dimensionFilter,
      limit: 10000,
    },
  });
  return res.data.rows || [];
}

async function getDailyData(client, startDate, endDate) {
  // All traffic daily
  const allRows = await runReport(
    client,
    startDate,
    endDate,
    ['date'],
    ['sessions', 'totalUsers', 'screenPageViews', 'bounceRate', 'averageSessionDuration'],
    undefined,
  );

  // Organic traffic daily
  const organicRows = await runReport(
    client,
    startDate,
    endDate,
    ['date'],
    ['sessions', 'totalUsers', 'screenPageViews'],
    {
      filter: {
        fieldName: 'sessionMedium',
        stringFilter: { matchType: 'EXACT', value: 'organic' },
      },
    },
  );

  // Key events daily
  const eventRows = await runReport(
    client,
    startDate,
    endDate,
    ['date', 'eventName'],
    ['eventCount'],
    {
      filter: {
        fieldName: 'eventName',
        inListFilter: {
          values: [
            'affiliate_click',
            'repair_answer_click',
            'knowledge_graph_click',
            'guide_generated',
            'guide_completion',
            'wiring_diagram_open',
            'wiring_diagram_interact',
            'pricing_cta_click',
          ],
        },
      },
    },
  );

  // Source breakdown (organic only, total per period)
  const sourceRows = await runReport(
    client,
    startDate,
    endDate,
    ['sessionSource'],
    ['sessions'],
    {
      filter: {
        fieldName: 'sessionMedium',
        stringFilter: { matchType: 'EXACT', value: 'organic' },
      },
    },
  );

  return { allRows, organicRows, eventRows, sourceRows };
}

function summarize(rows, metrics) {
  const sums = {};
  for (const m of metrics) sums[m] = 0;
  for (const row of rows) {
    for (let i = 0; i < metrics.length; i++) {
      sums[metrics[i]] += Number(row.metricValues[i]?.value || 0);
    }
  }
  return sums;
}

function fmt(n, digits = 0) {
  return Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function pct(n, d) {
  if (!d) return 0;
  return ((n / d) * 100).toFixed(1);
}

async function main() {
  const client = google.analyticsdata({ version: 'v1beta', auth: await getAuthClient() });

  const currentEnd = '2026-05-15';
  const currentStart = addDays(currentEnd, -29);
  const prevEnd = addDays(currentStart, -1);
  const prevStart = addDays(prevEnd, -29);

  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║         GA4 Daily Trends — AllOEMManuals.com                ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝\n`);

  console.log(`Current period:  ${currentStart} to ${currentEnd}`);
  console.log(`Previous period: ${prevStart} to ${prevEnd}\n`);

  const [current, previous] = await Promise.all([
    getDailyData(client, currentStart, currentEnd),
    getDailyData(client, prevStart, prevEnd),
  ]);

  // Summaries
  const currAll = summarize(current.allRows, ['sessions', 'totalUsers', 'screenPageViews']);
  const prevAll = summarize(previous.allRows, ['sessions', 'totalUsers', 'screenPageViews']);
  const currOrg = summarize(current.organicRows, ['sessions', 'totalUsers', 'screenPageViews']);
  const prevOrg = summarize(previous.organicRows, ['sessions', 'totalUsers', 'screenPageViews']);

  console.log('=== PERIOD COMPARISON ===\n');
  console.log('  Metric          | Current     | Previous    | Change');
  console.log('  ----------------+-------------+-------------+--------');
  console.log(`  Total Sessions  | ${fmt(currAll.sessions).padEnd(11)} | ${fmt(prevAll.sessions).padEnd(11)} | ${pct(currAll.sessions - prevAll.sessions, prevAll.sessions)}%`);
  console.log(`  Total Users     | ${fmt(currAll.totalUsers).padEnd(11)} | ${fmt(prevAll.totalUsers).padEnd(11)} | ${pct(currAll.totalUsers - prevAll.totalUsers, prevAll.totalUsers)}%`);
  console.log(`  Total Pageviews | ${fmt(currAll.screenPageViews).padEnd(11)} | ${fmt(prevAll.screenPageViews).padEnd(11)} | ${pct(currAll.screenPageViews - prevAll.screenPageViews, prevAll.screenPageViews)}%`);
  console.log(`  Organic Sessions| ${fmt(currOrg.sessions).padEnd(11)} | ${fmt(prevOrg.sessions).padEnd(11)} | ${pct(currOrg.sessions - prevOrg.sessions, prevOrg.sessions)}%`);
  console.log(`  Organic Users   | ${fmt(currOrg.totalUsers).padEnd(11)} | ${fmt(prevOrg.totalUsers).padEnd(11)} | ${pct(currOrg.totalUsers - prevOrg.totalUsers, prevOrg.totalUsers)}%`);
  console.log(`  Organic PVs     | ${fmt(currOrg.screenPageViews).padEnd(11)} | ${fmt(prevOrg.screenPageViews).padEnd(11)} | ${pct(currOrg.screenPageViews - prevOrg.screenPageViews, prevOrg.screenPageViews)}%`);
  console.log();

  // Key events comparison
  const eventNames = ['affiliate_click', 'repair_answer_click', 'knowledge_graph_click', 'guide_generated', 'guide_completion', 'wiring_diagram_open', 'wiring_diagram_interact', 'pricing_cta_click'];
  const currEvents = {};
  const prevEvents = {};
  for (const e of eventNames) { currEvents[e] = 0; prevEvents[e] = 0; }

  for (const row of current.eventRows) {
    const ev = row.dimensionValues[1]?.value;
    if (ev && eventNames.includes(ev)) currEvents[ev] += Number(row.metricValues[0]?.value || 0);
  }
  for (const row of previous.eventRows) {
    const ev = row.dimensionValues[1]?.value;
    if (ev && eventNames.includes(ev)) prevEvents[ev] += Number(row.metricValues[0]?.value || 0);
  }

  console.log('=== KEY EVENTS COMPARISON ===\n');
  console.log('  Event                    | Current | Previous | Change');
  console.log('  -------------------------+---------+----------+--------');
  for (const e of eventNames) {
    const change = pct(currEvents[e] - prevEvents[e], prevEvents[e]);
    console.log(`  ${e.padEnd(24)} | ${fmt(currEvents[e]).padEnd(7)} | ${fmt(prevEvents[e]).padEnd(8)} | ${change}%`);
  }
  console.log();

  // Organic source comparison
  const sourceMap = (rows) => {
    const m = {};
    for (const row of rows) {
      const src = row.dimensionValues[0]?.value || '(not set)';
      m[src] = Number(row.metricValues[0]?.value || 0);
    }
    return m;
  };
  const currSources = sourceMap(current.sourceRows);
  const prevSources = sourceMap(previous.sourceRows);
  const allSources = new Set([...Object.keys(currSources), ...Object.keys(prevSources)]);

  console.log('=== ORGANIC SOURCE BREAKDOWN ===\n');
  console.log('  Source        | Current | Previous | Change');
  console.log('  --------------+---------+----------+--------');
  for (const src of [...allSources].sort((a, b) => (currSources[b] || 0) - (currSources[a] || 0))) {
    const c = currSources[src] || 0;
    const p = prevSources[src] || 0;
    console.log(`  ${src.padEnd(13)} | ${fmt(c).padEnd(7)} | ${fmt(p).padEnd(8)} | ${pct(c - p, p)}%`);
  }
  console.log();

  // Daily trend table (current period only)
  const byDate = {};
  for (let i = 0; i < 30; i++) {
    const d = addDays(currentStart, i);
    const dCompact = d.replace(/-/g, '');
    byDate[d] = { date: d, sessions: 0, users: 0, pageviews: 0, orgSessions: 0, orgUsers: 0, orgPvs: 0 };
    byDate[dCompact] = byDate[d];
  }

  for (const row of current.allRows) {
    const d = row.dimensionValues[0]?.value;
    if (!byDate[d]) continue;
    byDate[d].sessions = Number(row.metricValues[0]?.value || 0);
    byDate[d].users = Number(row.metricValues[1]?.value || 0);
    byDate[d].pageviews = Number(row.metricValues[2]?.value || 0);
  }
  for (const row of current.organicRows) {
    const d = row.dimensionValues[0]?.value;
    if (!byDate[d]) continue;
    byDate[d].orgSessions = Number(row.metricValues[0]?.value || 0);
    byDate[d].orgUsers = Number(row.metricValues[1]?.value || 0);
    byDate[d].orgPvs = Number(row.metricValues[2]?.value || 0);
  }

  // Remove compact-date duplicates so we only iterate YYYY-MM-DD keys
  for (let i = 0; i < 30; i++) {
    const d = addDays(currentStart, i);
    const dCompact = d.replace(/-/g, '');
    delete byDate[dCompact];
  }

  console.log('=== DAILY TREND — CURRENT PERIOD ===\n');
  console.log('  Date       | Sessions | Users | Pageviews | Org.Sess | Org.PVs');
  console.log('  -----------+----------+-------+-----------+----------+--------');
  for (let i = 0; i < 30; i++) {
    const d = addDays(currentStart, i);
    const r = byDate[d];
    console.log(`  ${r.date} | ${fmt(r.sessions).padEnd(8)} | ${fmt(r.users).padEnd(5)} | ${fmt(r.pageviews).padEnd(9)} | ${fmt(r.orgSessions).padEnd(8)} | ${fmt(r.orgPvs).padEnd(6)}`);
  }
  console.log();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
