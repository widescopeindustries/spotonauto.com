import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials/google-service-account.json',
  scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
});
const ga4 = google.analyticsdata({ version: 'v1beta', auth: await auth.getClient() });
const PROPERTY = 'properties/537013586';

const endDate = '2026-07-09';
const startDate = '2026-06-01';

async function run(dimensions, name, filterField = null, filterValue = null) {
  const req = {
    property: PROPERTY,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: dimensions.map(d => ({ name: d })),
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'screenPageViews' }],
      limit: 30,
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    },
  };
  if (filterField) {
    req.requestBody.dimensionFilter = {
      filter: { fieldName: filterField, stringFilter: { matchType: 'EXACT', value: filterValue } },
    };
  }
  const res = await ga4.properties.runReport(req);
  console.log(`\n=== ${name} ===`);
  let totalSessions = 0, totalUsers = 0, totalViews = 0;
  for (const row of res.data.rows || []) {
    const dims = row.dimensionValues.map(v => v.value).join(' / ');
    const s = Number(row.metricValues[0]?.value || 0);
    const u = Number(row.metricValues[1]?.value || 0);
    const v = Number(row.metricValues[2]?.value || 0);
    totalSessions += s; totalUsers += u; totalViews += v;
    console.log(`${dims.substring(0, 60).padEnd(60)} | sessions: ${s.toString().padStart(6)} | users: ${u.toString().padStart(6)} | views: ${v.toString().padStart(6)}`);
  }
  console.log(`TOTAL | sessions: ${totalSessions} | users: ${totalUsers} | views: ${totalViews}`);
}

await run(['sessionDefaultChannelGroup'], 'All channels');
await run(['date'], 'Bing sessions by date', 'sessionDefaultChannelGroup', 'Organic Search');
await run(['pagePath'], 'Bing organic top pages', 'sessionDefaultChannelGroup', 'Organic Search');
await run(['sessionSource'], 'All sources');
