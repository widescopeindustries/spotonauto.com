/**
 * Daily Metrics Report — June 1-8, 2026
 * Pulls GA4 + GSC day-by-day for alloemmanuals.com
 */
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const GA_PROPERTY_ID = '537013586';
const SITE_URL = 'sc-domain:alloemmanuals.com';

const START_DATE = '2026-06-01';
const END_DATE = '2026-06-08';

async function getGA4Client() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  return google.analyticsdata({ version: 'v1beta', auth: await auth.getClient() });
}

async function getGSCClient() {
  const credentials = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  return google.searchconsole({ version: 'v1', auth });
}

async function runGA4Report(client, dimensions, metrics, dimensionFilter) {
  const res = await client.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: START_DATE, endDate: END_DATE }],
      dimensions: dimensions.map((name) => ({ name })),
      metrics: metrics.map((name) => ({ name })),
      dimensionFilter,
      limit: 10000,
    },
  });
  return res.data.rows || [];
}

async function fetchGSCRows(searchconsole, dimensions) {
  const all = [];
  const rowLimit = 25000;
  let startRow = 0;
  for (;;) {
    const res = await searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: { startDate: START_DATE, endDate: END_DATE, dimensions, rowLimit, startRow },
    });
    const rows = res.data.rows || [];
    all.push(...rows);
    if (rows.length < rowLimit) break;
    startRow += rowLimit;
    if (startRow > 500000) break;
  }
  return all;
}

function fmt(n, digits = 0) {
  return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

async function main() {
  const [ga4, gsc] = await Promise.all([getGA4Client(), getGSCClient()]);

  // GA4 pulls
  const allTraffic = await runGA4Report(ga4, ['date', 'sessionSource', 'sessionMedium'],
    ['sessions', 'totalUsers', 'screenPageViews', 'averageSessionDuration', 'bounceRate']);

  const keyEvents = await runGA4Report(ga4, ['date', 'eventName'], ['eventCount'], {
    filter: {
      fieldName: 'eventName',
      inListFilter: {
        values: ['affiliate_click', 'repair_answer_click', 'knowledge_graph_click', 'guide_generated',
                 'guide_completion', 'wiring_diagram_open', 'wiring_diagram_interact', 'pricing_cta_click'],
      },
    },
  });

  // GSC pull
  const gscDaily = await fetchGSCRows(gsc, ['date']);
  const gscQueries = await fetchGSCRows(gsc, ['query']);
  const gscPages = await fetchGSCRows(gsc, ['page']);

  // Build daily map
  const days = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06', '2026-06-07', '2026-06-08'];
  const daily = {};
  for (const d of days) {
    daily[d] = {
      date: d,
      sessions: 0, users: 0, pageviews: 0, avgDuration: 0, bounceRate: 0,
      google: 0, bing: 0, yahoo: 0, duckduckgo: 0, chatgpt: 0, direct: 0, other: 0,
      events: 0,
      gscImpressions: 0, gscClicks: 0, gscCtr: 0, gscPosition: 0,
    };
  }

  // Roll up GA4
  for (const row of allTraffic) {
    const d = row.dimensionValues[0]?.value;
    if (!daily[d]) continue;
    const src = row.dimensionValues[1]?.value || '(not set)';
    const med = row.dimensionValues[2]?.value || '(not set)';
    const sess = Number(row.metricValues[0]?.value || 0);

    daily[d].sessions += sess;
    daily[d].users += Number(row.metricValues[1]?.value || 0);
    daily[d].pageviews += Number(row.metricValues[2]?.value || 0);

    // Source bucketing
    const key = `${src} / ${med}`;
    if (src === '(direct)' || med === '(none)' || med === '(not set)') daily[d].direct += sess;
    else if (src === 'google' && med === 'organic') daily[d].google += sess;
    else if (src === 'bing' && med === 'organic') daily[d].bing += sess;
    else if (src === 'yahoo' && med === 'organic') daily[d].yahoo += sess;
    else if (src === 'duckduckgo' && med === 'organic') daily[d].duckduckgo += sess;
    else if (src.includes('chatgpt')) daily[d].chatgpt += sess;
    else daily[d].other += sess;
  }

  // Roll up key events
  for (const row of keyEvents) {
    const d = row.dimensionValues[0]?.value;
    if (!daily[d]) continue;
    daily[d].events += Number(row.metricValues[0]?.value || 0);
  }

  // Roll up GSC
  for (const row of gscDaily) {
    const d = row.keys[0];
    if (!daily[d]) continue;
    daily[d].gscImpressions = row.impressions || 0;
    daily[d].gscClicks = row.clicks || 0;
    daily[d].gscCtr = ((row.ctr || 0) * 100);
    daily[d].gscPosition = row.position || 0;
  }

  // Print combined daily table
  console.log(`\n╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║                    ALLOEMMANUALS.COM — DAILY METRICS: JUNE 1–8, 2026                                                 ║`);
  console.log(`╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n`);

  console.log('Date       | Sessions |  Direct |  Google |   Bing | ChatGPT | DDG | Pageviews | Events | GSC Clicks | GSC Impressions | GSC CTR | GSC Pos');
  console.log('-----------+----------+---------+---------+--------+---------+-----+-----------+--------+------------+-----------------+---------+--------');

  let totals = { sessions: 0, direct: 0, google: 0, bing: 0, chatgpt: 0, duckduckgo: 0, pageviews: 0, events: 0, gscClicks: 0, gscImpressions: 0 };

  for (const d of days) {
    const r = daily[d];
    totals.sessions += r.sessions;
    totals.direct += r.direct;
    totals.google += r.google;
    totals.bing += r.bing;
    totals.chatgpt += r.chatgpt;
    totals.duckduckgo += r.duckduckgo;
    totals.pageviews += r.pageviews;
    totals.events += r.events;
    totals.gscClicks += r.gscClicks;
    totals.gscImpressions += r.gscImpressions;

    console.log(
      `${r.date} | ${fmt(r.sessions).padStart(8)} | ${fmt(r.direct).padStart(7)} | ${fmt(r.google).padStart(7)} | ${fmt(r.bing).padStart(6)} | ${fmt(r.chatgpt).padStart(7)} | ${fmt(r.duckduckgo).padStart(3)} | ${fmt(r.pageviews).padStart(9)} | ${fmt(r.events).padStart(6)} | ${fmt(r.gscClicks).padStart(10)} | ${fmt(r.gscImpressions).padStart(15)} | ${(r.gscCtr).toFixed(1).padStart(6)}% | ${r.gscPosition.toFixed(1).padStart(6)}`
    );
  }

  console.log('-----------+----------+---------+---------+--------+---------+-----+-----------+--------+------------+-----------------+---------+--------');
  console.log(
    `TOTAL      | ${fmt(totals.sessions).padStart(8)} | ${fmt(totals.direct).padStart(7)} | ${fmt(totals.google).padStart(7)} | ${fmt(totals.bing).padStart(6)} | ${fmt(totals.chatgpt).padStart(7)} | ${fmt(totals.duckduckgo).padStart(3)} | ${fmt(totals.pageviews).padStart(9)} | ${fmt(totals.events).padStart(6)} | ${fmt(totals.gscClicks).padStart(10)} | ${fmt(totals.gscImpressions).padStart(15)} |         |`
  );

  // Source percentages
  console.log(`\n=== SOURCE BREAKDOWN (June 1–8) ===`);
  const realTraffic = totals.sessions - totals.direct;
  console.log(`Total sessions:        ${fmt(totals.sessions)}`);
  console.log(`Direct (likely bots):  ${fmt(totals.direct)} (${((totals.direct/totals.sessions)*100).toFixed(1)}%)`);
  console.log(`Real traffic:          ${fmt(realTraffic)} (${((realTraffic/totals.sessions)*100).toFixed(1)}%)`);
  console.log(`  Google organic:      ${fmt(totals.google)}`);
  console.log(`  Bing organic:        ${fmt(totals.bing)}`);
  console.log(`  ChatGPT:             ${fmt(totals.chatgpt)}`);
  console.log(`  DuckDuckGo:          ${fmt(totals.duckduckgo)}`);
  console.log(`  Yahoo + other:       ${fmt(totals.sessions - totals.direct - totals.google - totals.bing - totals.chatgpt - totals.duckduckgo)}`);

  // Top GSC queries
  console.log(`\n=== TOP 15 GSC QUERIES (June 1–8) ===`);
  console.log('Query'.padEnd(50) + ' | Clicks | Impressions |  CTR  | Position');
  for (const row of gscQueries.sort((a,b) => b.clicks - a.clicks).slice(0,15)) {
    const q = row.keys[0].substring(0,50);
    console.log(`${q.padEnd(50)} | ${fmt(row.clicks).padStart(6)} | ${fmt(row.impressions).padStart(11)} | ${(row.ctr*100).toFixed(1).padStart(5)}% | ${row.position.toFixed(1).padStart(8)}`);
  }

  // Top GSC pages
  console.log(`\n=== TOP 15 GSC PAGES (June 1–8) ===`);
  console.log('Page'.padEnd(60) + ' | Clicks | Impressions');
  for (const row of gscPages.sort((a,b) => b.clicks - a.clicks).slice(0,15)) {
    const p = row.keys[0].substring(0,60);
    console.log(`${p.padEnd(60)} | ${fmt(row.clicks).padStart(6)} | ${fmt(row.impressions).padStart(11)}`);
  }

  console.log('');
}

main().catch((err) => {
  console.error('Error:', err.message);
  if (err.response?.data?.error) console.error(JSON.stringify(err.response.data.error, null, 2));
  process.exit(1);
});
