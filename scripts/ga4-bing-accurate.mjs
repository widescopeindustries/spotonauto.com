import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials/google-service-account.json',
  scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
});
const ga4 = google.analyticsdata({ version: 'v1beta', auth: await auth.getClient() });
const PROPERTY = 'properties/537013586';

const endDate = '2026-07-09';
const startDate = '2026-06-01';

async function run(dimensions, name) {
  const req = {
    property: PROPERTY,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: dimensions.map(d => ({ name: d })),
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'screenPageViews' }, { name: 'eventCount' }],
      limit: 50,
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    },
  };
  const res = await ga4.properties.runReport(req);
  console.log(`\n=== ${name} ===`);
  let totalSessions = 0, totalUsers = 0, totalViews = 0;
  for (const row of res.data.rows || []) {
    const dims = row.dimensionValues.map(v => v.value).join(' / ');
    const s = Number(row.metricValues[0]?.value || 0);
    const u = Number(row.metricValues[1]?.value || 0);
    const v = Number(row.metricValues[2]?.value || 0);
    totalSessions += s; totalUsers += u; totalViews += v;
    console.log(`${dims.substring(0, 70).padEnd(70)} | s: ${s.toString().padStart(6)} | u: ${u.toString().padStart(6)} | v: ${v.toString().padStart(6)}`);
  }
  console.log(`TOTAL | sessions: ${totalSessions} | users: ${totalUsers} | views: ${totalViews}`);
}

await run(['sessionSource', 'sessionMedium'], 'Source / Medium');
await run(['date', 'sessionSource'], 'Daily by source');
await run(['sessionSource', 'pagePath'], 'Source + Page (Bing only)', 'sessionSource', 'bing');
