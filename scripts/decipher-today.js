const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const GA_PROPERTY_ID = '520432705';

async function buildGaClient() {
  const credentials = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  return google.analyticsdata({ version: 'v1beta', auth });
}

async function main() {
  const date = '2026-05-12';
  const analyticsdata = await buildGaClient();

  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║   May 12, 2026 — The Real Flurry (184 sessions)            ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝\n`);

  // Sources with landing pages
  const res = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: date, endDate: date }],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'landingPage' },
      ],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'averageSessionDuration' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 30,
    },
  });

  console.log('=== SOURCE → LANDING PAGE (May 12) ===\n');
  console.log('Sessions | Avg Time | Source / Medium → Landing Page');
  console.log('---------|----------|---------------------------------------------');
  for (const row of res.data.rows || []) {
    const source = row.dimensionValues[0].value || '(direct)';
    const medium = row.dimensionValues[1].value || '(none)';
    const page = row.dimensionValues[2].value || '/';
    const sessions = Number(row.metricValues[0].value);
    const time = Math.round(Number(row.metricValues[2].value || 0));
    if (sessions >= 1) {
      console.log(`${sessions.toString().padStart(8)} | ${time.toString().padStart(6)}s | ${source} / ${medium} → ${page.substring(0, 45)}`);
    }
  }

  // Page title + path to see what content won
  const pagesRes = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: date, endDate: date }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }, { name: 'averageSessionDuration' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 20,
    },
  });

  console.log('\n=== TOP PAGES BY SESSIONS (May 12) ===\n');
  console.log('Sessions | Views | Time  | Page');
  console.log('---------|-------|-------|---------------------------------------------');
  for (const row of pagesRes.data.rows || []) {
    const path = row.dimensionValues[0].value;
    const title = row.dimensionValues[1].value;
    const sessions = Number(row.metricValues[0].value);
    const views = Number(row.metricValues[1].value);
    const time = Math.round(Number(row.metricValues[2].value || 0));
    console.log(`${sessions.toString().padStart(8)} | ${views.toString().padStart(5)} | ${time.toString().padStart(4)}s | ${path.substring(0, 40)}`);
    if (title && title !== path) {
      console.log(`                                                  (${title.substring(0, 45)})`);
    }
  }

  // Events to see what people DID
  const eventsRes = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: date, endDate: date }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 20,
    },
  });

  console.log('\n=== EVENTS (May 12) ===\n');
  for (const row of eventsRes.data.rows || []) {
    const event = row.dimensionValues[0].value;
    const count = Number(row.metricValues[0].value);
    console.log(`  ${event.padEnd(35)} ${count.toString().padStart(5)}`);
  }

  // Geo to see WHERE the traffic came from
  const geoRes = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: date, endDate: date }],
      dimensions: [{ name: 'country' }, { name: 'sessionSource' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 20,
    },
  });

  console.log('\n=== GEO + SOURCE (May 12) ===\n');
  console.log('Sessions | Country          | Source');
  console.log('---------|------------------|------------------');
  for (const row of geoRes.data.rows || []) {
    const country = row.dimensionValues[0].value;
    const source = row.dimensionValues[1].value;
    const sessions = Number(row.metricValues[0].value);
    console.log(`${sessions.toString().padStart(8)} | ${country.padEnd(16)} | ${source}`);
  }

  console.log('\n' + '═'.repeat(62) + '\n');
}

main().catch(console.error);
