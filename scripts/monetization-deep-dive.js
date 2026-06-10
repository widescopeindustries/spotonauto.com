/**
 * Monetization Deep Dive — June 1-8, 2026
 * Pages driving affiliate clicks + GSC performance + indexing spot-check
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
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });
  return google.searchconsole({ version: 'v1', auth });
}

function fmt(n) {
  return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const normDate = (d) => d.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');

async function main() {
  const [ga4, gsc] = await Promise.all([getGA4Client(), getGSCClient()]);

  // 1. Affiliate clicks by page path
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║  GA4 — AFFILIATE CLICKS BY PAGE (June 1–8)                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  const affRes = await ga4.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: START_DATE, endDate: END_DATE }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: { matchType: 'EXACT', value: 'affiliate_click' },
        },
      },
      limit: 25,
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    },
  });

  if ((affRes.data.rows || []).length === 0) {
    console.log('No affiliate_click events recorded in GA4 for this period.');
  } else {
    console.log('Page Path'.padEnd(65) + ' | Clicks');
    console.log('-'.repeat(75));
    for (const row of affRes.data.rows) {
      const p = row.dimensionValues[0]?.value.substring(0, 64);
      const c = Number(row.metricValues[0]?.value || 0);
      console.log(`${p.padEnd(65)} | ${fmt(c).padStart(6)}`);
    }
  }

  // 2. Top pages by real (non-direct) sessions
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║  GA4 — TOP PAGES BY REAL SESSIONS (June 1–8, excluding direct)              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  const pageRes = await ga4.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: START_DATE, endDate: END_DATE }],
      dimensions: [{ name: 'pagePath' }, { name: 'sessionSource' }],
      metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }, { name: 'averageSessionDuration' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'sessionMedium',
                stringFilter: { matchType: 'NOT_CONTAINS', value: 'none' },
              },
            },
            {
              filter: {
                fieldName: 'sessionMedium',
                stringFilter: { matchType: 'NOT_CONTAINS', value: 'not set' },
              },
            },
            {
              filter: {
                fieldName: 'sessionSource',
                stringFilter: { matchType: 'NOT_CONTAINS', value: '(direct)' },
              },
            },
          ],
        },
      },
      limit: 50,
    },
  });

  // Roll up by page path across sources
  const pageMap = {};
  for (const row of pageRes.data.rows || []) {
    const p = row.dimensionValues[0]?.value;
    const sess = Number(row.metricValues[0]?.value || 0);
    const pvs = Number(row.metricValues[1]?.value || 0);
    const dur = Number(row.metricValues[2]?.value || 0);
    if (!pageMap[p]) pageMap[p] = { sessions: 0, pageviews: 0, duration: 0 };
    pageMap[p].sessions += sess;
    pageMap[p].pageviews += pvs;
    pageMap[p].duration += dur * sess; // weighted
  }

  const sortedPages = Object.entries(pageMap)
    .sort((a, b) => b[1].sessions - a[1].sessions)
    .slice(0, 20);

  console.log('Page Path'.padEnd(60) + ' | Sessions | Pageviews | Avg Time');
  console.log('-'.repeat(95));
  for (const [p, data] of sortedPages) {
    const avgDur = data.sessions > 0 ? data.duration / data.sessions : 0;
    const m = Math.floor(avgDur / 60);
    const s = Math.round(avgDur % 60);
    const timeStr = `${m}m${s.toString().padStart(2, '0')}s`;
    console.log(`${p.substring(0, 59).padEnd(60)} | ${fmt(data.sessions).padStart(8)} | ${fmt(data.pageviews).padStart(9)} | ${timeStr.padStart(8)}`);
  }

  // 3. GSC top pages
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║  GSC — TOP PAGES BY CLICKS (June 1–6)                                       ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  let startRow = 0;
  const gscPages = [];
  for (;;) {
    const res = await gsc.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: START_DATE,
        endDate: '2026-06-06',
        dimensions: ['page'],
        rowLimit: 25000,
        startRow,
      },
    });
    const rows = res.data.rows || [];
    gscPages.push(...rows);
    if (rows.length < 25000) break;
    startRow += 25000;
    if (startRow > 500000) break;
  }

  console.log('Page'.padEnd(65) + ' | Clicks | Impressions |  CTR  | Position');
  console.log('-'.repeat(100));
  for (const row of gscPages.sort((a, b) => b.clicks - a.clicks).slice(0, 20)) {
    const p = row.keys[0].substring(0, 64);
    console.log(
      `${p.padEnd(65)} | ${fmt(row.clicks).padStart(6)} | ${fmt(row.impressions).padStart(11)} | ${(row.ctr * 100).toFixed(1).padStart(5)}% | ${row.position.toFixed(1).padStart(8)}`
    );
  }

  // 4. URL Inspection spot-check on top 5 GSC pages + top 5 GA4 pages
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║  GSC — INDEXING STATUS SPOT-CHECK (Top 5 performing pages)                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  const pagesToCheck = [
    ...gscPages.sort((a, b) => b.clicks - a.clicks).slice(0, 3).map((r) => r.keys[0]),
    ...sortedPages.slice(0, 3).map(([p]) => `https://alloemmanuals.com${p}`),
  ].filter((v, i, a) => a.indexOf(v) === i); // dedupe

  for (const url of pagesToCheck.slice(0, 5)) {
    try {
      const res = await gsc.urlInspection.index.inspect({
        siteUrl: SITE_URL,
        inspectionUrl: url,
      });
      const data = res.data.inspectionResult;
      const indexStatus = data?.indexStatusResult?.verdict || 'unknown';
      const coverage = data?.indexStatusResult?.coverageState || 'unknown';
      const lastCrawl = data?.indexStatusResult?.lastCrawlTime || 'never';
      console.log(`\n${url}`);
      console.log(`  Index status: ${indexStatus}`);
      console.log(`  Coverage:     ${coverage}`);
      console.log(`  Last crawled: ${lastCrawl}`);
    } catch (err) {
      console.log(`\n${url}`);
      console.log(`  Error: ${err.message}`);
    }
  }

  console.log('');
}

main().catch((err) => {
  console.error('Error:', err.message);
  if (err.response?.data?.error) console.error(JSON.stringify(err.response.data.error, null, 2));
  process.exit(1);
});
