/**
 * SpotOn Auto - GA4 Analytics Report
 *
 * Pull analytics data from GA4 using the Google Analytics Data API.
 *
 * Usage:
 *   node scripts/analytics-report.js                    # Last 7 days (default)
 *   node scripts/analytics-report.js 28daysAgo today    # Last 28 days
 *   node scripts/analytics-report.js 2026-01-01 2026-02-16  # Custom range
 */

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const GA_PROPERTY_ID = '520432705';

async function getAuthClient() {
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error(`Credentials file not found at ${KEY_PATH}`);
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  return auth.getClient();
}

async function runReport(authClient, startDate, endDate) {
  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth: authClient });

  // Top pages by sessions
  console.log('=== TOP PAGES BY SESSIONS ===\n');
  const pagesReport = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 25,
    },
  });

  for (const row of pagesReport.data.rows || []) {
    const pagePath = row.dimensionValues?.[0]?.value;
    const sessions = row.metricValues?.[0]?.value;
    const users = row.metricValues?.[1]?.value;
    const bounce = (parseFloat(row.metricValues?.[2]?.value || '0') * 100).toFixed(1);
    const duration = parseFloat(row.metricValues?.[3]?.value || '0').toFixed(0);
    console.log(`  ${pagePath} | ${sessions} sessions | ${users} users | ${bounce}% bounce | ${duration}s avg`);
  }

  // Traffic sources
  console.log('\n=== TRAFFIC SOURCES ===\n');
  const sourcesReport = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 15,
    },
  });

  for (const row of sourcesReport.data.rows || []) {
    const source = row.dimensionValues?.[0]?.value;
    const medium = row.dimensionValues?.[1]?.value;
    const sessions = row.metricValues?.[0]?.value;
    const users = row.metricValues?.[1]?.value;
    console.log(`  ${source} / ${medium} | ${sessions} sessions | ${users} users`);
  }

  // Key events (spotonauto-specific)
  console.log('\n=== KEY EVENTS ===\n');
  const eventsReport = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: [
              'affiliate_click',
              'guide_generated',
              'diagnostic_start',
              'vehicle_search',
              'shop_all_click',
              'tool_affiliate_click',
              'begin_checkout',
              'upgrade_modal_shown',
              'vin_decode',
              'sign_up',
              'login',
            ],
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    },
  });

  for (const row of eventsReport.data.rows || []) {
    const event = row.dimensionValues?.[0]?.value;
    const count = row.metricValues?.[0]?.value;
    console.log(`  ${event}: ${count}`);
  }
  if (!eventsReport.data.rows?.length) {
    console.log('  No conversion events yet');
  }

  // Device breakdown
  console.log('\n=== DEVICE BREAKDOWN ===\n');
  const deviceReport = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
    },
  });

  for (const row of deviceReport.data.rows || []) {
    const device = row.dimensionValues?.[0]?.value;
    const sessions = row.metricValues?.[0]?.value;
    console.log(`  ${device}: ${sessions} sessions`);
  }

  // Top countries
  console.log('\n=== TOP COUNTRIES ===\n');
  const geoReport = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    },
  });

  for (const row of geoReport.data.rows || []) {
    const country = row.dimensionValues?.[0]?.value;
    const sessions = row.metricValues?.[0]?.value;
    console.log(`  ${country}: ${sessions} sessions`);
  }

  // Landing pages (organic only)
  console.log('\n=== TOP ORGANIC LANDING PAGES ===\n');
  const organicReport = await analyticsdata.properties.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'landingPagePlusQueryString' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'sessionMedium',
          stringFilter: { value: 'organic' },
        },
      },
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 15,
    },
  });

  for (const row of organicReport.data.rows || []) {
    const page = row.dimensionValues?.[0]?.value;
    const sessions = row.metricValues?.[0]?.value;
    const users = row.metricValues?.[1]?.value;
    console.log(`  ${page} | ${sessions} sessions | ${users} users`);
  }
  if (!organicReport.data.rows?.length) {
    console.log('  No organic traffic yet');
  }
}

async function main() {
  const startDate = process.argv[2] || '7daysAgo';
  const endDate = process.argv[3] || 'today';

  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║         SpotOn Auto - GA4 Analytics Report                  ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝`);
  console.log(`\n  Period: ${startDate} to ${endDate}`);
  console.log(`  Property: ${GA_PROPERTY_ID}\n`);
  console.log('='.repeat(60) + '\n');

  const authClient = await getAuthClient();
  await runReport(authClient, startDate, endDate);

  console.log('\n' + '='.repeat(60));
  console.log('Done!\n');
}

main().catch(err => {
  console.error('Error:', err.message);
  if (err.message.includes('403') || err.message.includes('Permission')) {
    console.error('\nMake sure the service account has Viewer access to GA4 property ' + GA_PROPERTY_ID);
    console.error('Go to: GA4 Admin > Property Access Management > Add the service account email');
  }
  process.exit(1);
});
