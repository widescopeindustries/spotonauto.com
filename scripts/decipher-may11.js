const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const GA_PROPERTY_ID = '537013586';
const GSC_SITE_URL = 'sc-domain:alloemmanuals.com';

async function buildGaClient() {
  const credentials = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  return google.analyticsdata({ version: 'v1beta', auth });
}

async function buildGscClient() {
  const credentials = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  return google.searchconsole({ version: 'v1', auth });
}

async function main() {
  const date = '2026-05-11';
  const analyticsdata = await buildGaClient();
  const searchconsole = await buildGscClient();

  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║        May 11, 2026 — Traffic Flurry Decoded                ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝\n`);

  // ── GA4: Sources & Mediums ──
  const sourcesReport = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: date, endDate: date }],
      dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    },
  });

  console.log('=== TRAFFIC SOURCES (May 11) ===\n');
  console.log('Source / Medium        | Sessions | Users | Page Views');
  console.log('-----------------------|----------|-------|------------');
  for (const row of sourcesReport.data.rows || []) {
    const source = (row.dimensionValues[0].value || '(direct)').padEnd(20);
    const medium = (row.dimensionValues[1].value || '(none)').padEnd(10);
    const sessions = (row.metricValues[0].value || 0).toString().padStart(8);
    const users = (row.metricValues[1].value || 0).toString().padStart(5);
    const views = (row.metricValues[2].value || 0).toString().padStart(10);
    console.log(`${source} ${medium} | ${sessions} | ${users} | ${views}`);
  }

  // ── GA4: Landing Pages by Source ──
  const landingReport = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: date, endDate: date }],
      dimensions: [{ name: 'landingPage' }, { name: 'sessionSource' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 20,
    },
  });

  console.log('\n=== LANDING PAGES BY SOURCE (May 11) ===\n');
  console.log('Source               | Sessions | Landing Page');
  console.log('---------------------|----------|----------------------------------------');
  for (const row of landingReport.data.rows || []) {
    const page = row.dimensionValues[0].value || '/';
    const source = (row.dimensionValues[1].value || '(direct)').padEnd(20);
    const sessions = (row.metricValues[0].value || 0).toString().padStart(8);
    console.log(`${source} | ${sessions} | ${page.substring(0, 50)}`);
  }

  // ── GA4: Events on May 11 ──
  const eventsReport = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: date, endDate: date }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 20,
    },
  });

  console.log('\n=== EVENTS (May 11) ===\n');
  for (const row of eventsReport.data.rows || []) {
    const event = (row.dimensionValues[0].value || '').padEnd(30);
    const count = (row.metricValues[0].value || 0).toString().padStart(5);
    console.log(`  ${event} ${count}`);
  }

  // ── GA4: Pages with most engagement ──
  const pagesReport = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: date, endDate: date }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }, { name: 'averageSessionDuration' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 15,
    },
  });

  console.log('\n=== TOP PAGES (May 11) ===\n');
  console.log('Sessions | Views | Avg Time | Path');
  console.log('---------|-------|----------|--------------------------------------');
  for (const row of pagesReport.data.rows || []) {
    const path = row.dimensionValues[0].value || '/';
    const sessions = (row.metricValues[0].value || 0).toString().padStart(8);
    const views = (row.metricValues[1].value || 0).toString().padStart(5);
    const time = Math.round(Number(row.metricValues[2].value || 0)).toString().padStart(8);
    console.log(`${sessions} | ${views} | ${time}s     | ${path.substring(0, 50)}`);
  }

  // ── GSC: May 11 specifics ──
  const gscReport = await searchconsole.searchanalytics.query({
    siteUrl: GSC_SITE_URL,
    requestBody: {
      startDate: date,
      endDate: date,
      dimensions: ['query', 'page'],
      rowLimit: 25,
    },
  });

  console.log('\n=== GSC: QUERIES + PAGES (May 11) ===\n');
  console.log('Query                                      | Clicks | Impressions | Position | Page');
  console.log('-------------------------------------------|--------|-------------|----------|------');
  for (const row of gscReport.data.rows || []) {
    const query = (row.keys[0] || '').substring(0, 40).padEnd(40);
    const page = (row.keys[1] || '').replace('https://alloemmanuals.com', '').substring(0, 30);
    const clicks = row.clicks.toString().padStart(6);
    const impressions = row.impressions.toString().padStart(11);
    const position = row.position.toFixed(1).padStart(8);
    console.log(`${query} | ${clicks} | ${impressions} | ${position} | ${page}`);
  }

  // ── GSC: Countries/devices for May 11 ──
  const gscGeo = await searchconsole.searchanalytics.query({
    siteUrl: GSC_SITE_URL,
    requestBody: {
      startDate: date,
      endDate: date,
      dimensions: ['country', 'device'],
      rowLimit: 10,
    },
  });

  console.log('\n=== GSC: GEO + DEVICE (May 11) ===\n');
  for (const row of gscGeo.data.rows || []) {
    const country = row.keys[0];
    const device = row.keys[1];
    console.log(`  ${country} / ${device}: ${row.clicks} clicks, ${row.impressions} impressions`);
  }

  console.log('\n' + '═'.repeat(62) + '\n');
}

main().catch(console.error);
