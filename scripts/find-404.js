const { google } = require('googleapis');
const { execFileSync } = require('child_process');
const path = require('path');
const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const GA_PROPERTY_ID = '520432705';
const args = new Set(process.argv.slice(2));
const shouldNotifyIndexNow = args.has('--notify-indexnow');
const auth = new google.auth.GoogleAuth({ keyFile: KEY_PATH, scopes: ['https://www.googleapis.com/auth/analytics.readonly'] });
const ga = google.analyticsdata({ version: 'v1beta', auth });

// Find pages that generate 404 hits (page title = "404: This page could not be found.")
ga.properties.runReport({
  property: 'properties/' + GA_PROPERTY_ID,
  requestBody: {
    dateRanges: [{ startDate: '2026-02-01', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }, { name: 'sessionSource' }],
    metrics: [{ name: 'screenPageViews' }],
    dimensionFilter: {
      filter: {
        fieldName: 'pageTitle',
        stringFilter: { matchType: 'CONTAINS', value: '404' }
      }
    },
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 50,
  }
}).then(r => {
    console.log('=== 404 PAGES (Feb-Mar 2026) ===\n');
    console.log('Views  Source          Path');
    console.log('-----  ------          ----');
    const deadPaths = [];
    (r.data.rows || []).forEach(row => {
        const pagePath = row.dimensionValues[0].value;
        const source = row.dimensionValues[2].value;
        const views = row.metricValues[0].value;
        console.log(`${views.padStart(5)}  ${source.padEnd(14)}  ${pagePath}`);
        if (pagePath.startsWith('/')) deadPaths.push(pagePath);
    });
    if (!r.data.rows) console.log('No 404 hits found');

    if (shouldNotifyIndexNow && deadPaths.length) {
        const uniquePaths = [...new Set(deadPaths)].slice(0, 200);
        console.log(`\nNotifying IndexNow about ${uniquePaths.length} dead path(s)...`);
        const scriptPath = path.join(__dirname, 'submit-indexnow.js');
        const args = ['--dead', ...uniquePaths];
        execFileSync('node', [scriptPath, ...args], { stdio: 'inherit' });
    }
}).catch(e => console.error(e.message));
