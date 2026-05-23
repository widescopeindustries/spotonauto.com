const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const GA_PROPERTY_ID = '537013586'; // alloemmanuals.com
const GSC_SITE_URL = 'sc-domain:alloemmanuals.com';

async function main() {
  if (!fs.existsSync(KEY_PATH)) {
    console.error(`Credentials file not found at ${KEY_PATH}`);
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/analytics.readonly'
    ],
  });

  const authClient = await auth.getClient();
  const searchconsole = google.searchconsole({ version: 'v1', auth: authClient });
  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth: authClient });

  // Range from May 1 to today (or yesterday since today is incomplete)
  const startDate = '2026-05-01';
  // Get today's date in YYYY-MM-DD
  const today = new Date();
  const endDate = today.toISOString().slice(0, 10);

  console.log(`Pulling metrics from ${startDate} to ${endDate}...`);

  const metrics = {};

  // Initialize date range keys in the map
  let curr = new Date(startDate);
  const end = new Date(endDate);
  while (curr <= end) {
    const dStr = curr.toISOString().slice(0, 10);
    metrics[dStr] = {
      date: dStr,
      gscImpressions: 0,
      gscClicks: 0,
      gscCtr: '0.0%',
      gscPosition: '0.0',
      gaSessions: 0,
      gaOrganicSessions: 0,
      gaUsers: 0,
      gaPageviews: 0
    };
    curr.setDate(curr.getDate() + 1);
  }

  // 1. Pull GSC data
  console.log('Querying Search Console...');
  try {
    const resGsc = await searchconsole.searchanalytics.query({
      siteUrl: GSC_SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['date'],
        rowLimit: 1000
      }
    });

    const gscRows = resGsc.data.rows || [];
    console.log(`  GSC returned ${gscRows.length} rows`);
    for (const row of gscRows) {
      const date = row.keys[0];
      if (metrics[date]) {
        metrics[date].gscImpressions = row.impressions;
        metrics[date].gscClicks = row.clicks;
        metrics[date].gscCtr = (row.ctr * 100).toFixed(1) + '%';
        metrics[date].gscPosition = row.position.toFixed(1);
      }
    }
  } catch (err) {
    console.error('Error fetching GSC data:', err.message);
  }

  // 2. Pull GA4 Overview (sessions, users, pageviews)
  console.log('Querying GA4 Overview...');
  try {
    const resGaAll = await analyticsdata.properties.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'screenPageViews' }
        ],
        limit: 1000
      }
    });

    const gaAllRows = resGaAll.data.rows || [];
    console.log(`  GA4 Overview returned ${gaAllRows.length} rows`);
    for (const row of gaAllRows) {
      let rawDate = row.dimensionValues[0].value; // YYYYMMDD
      const date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
      if (metrics[date]) {
        metrics[date].gaSessions = Number(row.metricValues[0].value);
        metrics[date].gaUsers = Number(row.metricValues[1].value);
        metrics[date].gaPageviews = Number(row.metricValues[2].value);
      }
    }
  } catch (err) {
    console.error('Error fetching GA4 Overview data:', err.message);
  }

  // 3. Pull GA4 Organic sessions
  console.log('Querying GA4 Organic...');
  try {
    const resGaOrg = await analyticsdata.properties.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }],
        dimensionFilter: {
          filter: {
            fieldName: 'sessionMedium',
            stringFilter: { value: 'organic', matchType: 'EXACT' }
          }
        },
        limit: 1000
      }
    });

    const gaOrgRows = resGaOrg.data.rows || [];
    console.log(`  GA4 Organic returned ${gaOrgRows.length} rows`);
    for (const row of gaOrgRows) {
      let rawDate = row.dimensionValues[0].value;
      const date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
      if (metrics[date]) {
        metrics[date].gaOrganicSessions = Number(row.metricValues[0].value);
      }
    }
  } catch (err) {
    console.error('Error fetching GA4 Organic data:', err.message);
  }

  // Write out results
  console.log('\n=== METRICS BREAKDOWN ===\n');
  console.log('| Date       | GSC Clicks | GSC Imp | GSC Position | GA4 Sessions | GA4 Organic | GA4 Users | GA4 Pageviews |');
  console.log('| :---       | :---:      | :---:   | :---:        | :---:        | :---:       | :---:     | :---:         |');
  
  const sortedDates = Object.keys(metrics).sort((a, b) => b.localeCompare(a));
  
  for (const date of sortedDates) {
    const m = metrics[date];
    // Don't show dates where both GSC and GA4 are 0 (e.g. before domain was active)
    if (m.gscImpressions === 0 && m.gaSessions === 0 && date < '2026-05-07') {
      continue;
    }
    console.log(`| ${m.date} | ${m.gscClicks} | ${m.gscImpressions} | ${m.gscPosition} | ${m.gaSessions} | ${m.gaOrganicSessions} | ${m.gaUsers} | ${m.gaPageviews} |`);
  }
}

main().catch(console.error);
