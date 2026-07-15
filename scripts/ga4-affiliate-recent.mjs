import { google } from 'googleapis';
import fs from 'fs';

const KEY_PATH = 'credentials/google-service-account.json';
const PROPERTY = 'properties/537013586';

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_PATH,
  scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
});
const ga4 = google.analyticsdata({ version: 'v1beta', auth: await auth.getClient() });

const endDate = '2026-07-09';
const startDate = '2026-06-01';

async function run(dimensions, name) {
  const res = await ga4.properties.runReport({
    property: PROPERTY,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: dimensions.map(d => ({ name: d })),
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'affiliate_click' } },
      },
      limit: 30,
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    },
  });
  console.log(`\n=== ${name} ===`);
  console.log('Dimension | Clicks');
  for (const row of res.data.rows || []) {
    const dims = row.dimensionValues.map(v => v.value).join(' / ');
    const c = Number(row.metricValues[0]?.value || 0);
    console.log(`${dims.substring(0, 70).padEnd(70)} | ${c}`);
  }
}

await run(['sessionDefaultChannelGroup'], 'Affiliate clicks by channel');
await run(['pagePath'], 'Affiliate clicks by page');
await run(['date'], 'Affiliate clicks by date');
