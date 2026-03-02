const { google } = require('googleapis');
const path = require('path');
const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const GA_PROPERTY_ID = '520432705';
const auth = new google.auth.GoogleAuth({ keyFile: KEY_PATH, scopes: ['https://www.googleapis.com/auth/analytics.readonly'] });
const ga = google.analyticsdata({ version: 'v1beta', auth });

ga.properties.runReport({
  property: 'properties/' + GA_PROPERTY_ID,
  requestBody: {
    dateRanges: [{ startDate: '2026-01-01', endDate: 'today' }],
    dimensions: [{ name: 'date' }, { name: 'sessionMedium' }],
    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
    limit: 500,
  }
}).then(r => {
  const byDate = {};
  (r.data.rows || []).forEach(row => {
    const d = row.dimensionValues[0].value;
    const medium = row.dimensionValues[1].value;
    if (!byDate[d]) byDate[d] = { organic: 0, cpc: 0, direct: 0, other: 0 };
    const sessions = parseInt(row.metricValues[0].value);
    if (medium === 'organic') byDate[d].organic += sessions;
    else if (medium === 'cpc') byDate[d].cpc += sessions;
    else if (medium === '(none)') byDate[d].direct += sessions;
    else byDate[d].other += sessions;
  });
  console.log('DATE       ORGANIC   CPC  DIRECT  OTHER  TOTAL');
  Object.keys(byDate).sort().forEach(d => {
    const o = byDate[d];
    const total = o.organic + o.cpc + o.direct + o.other;
    const df = d.slice(0,4)+'-'+d.slice(4,6)+'-'+d.slice(6);
    console.log(df, o.organic.toString().padStart(8), o.cpc.toString().padStart(6), o.direct.toString().padStart(8), o.other.toString().padStart(7), total.toString().padStart(7));
  });
}).catch(e => console.error(e.message));
