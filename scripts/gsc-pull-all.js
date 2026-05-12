const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const SITE_URL = 'sc-domain:alloemmanuals.com';

async function buildClient() {
  const credentials = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  return google.searchconsole({ version: 'v1', auth });
}

async function fetchAllRows(searchconsole, dimensions, startDate, endDate) {
  const all = [];
  const rowLimit = 25000;
  let startRow = 0;

  for (;;) {
    const res = await searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions,
        rowLimit,
        startRow,
      },
    });

    const rows = res.data.rows || [];
    all.push(...rows);
    if (rows.length < rowLimit) break;
    startRow += rowLimit;
    if (startRow > 500000) break;
  }

  return all;
}

async function main() {
  const startDate = '2026-02-25';
  const endDate = '2026-02-28';
  const searchconsole = await buildClient();

  console.log(`Pulling ALL queries from ${startDate} to ${endDate}...`);
  const queryRows = await fetchAllRows(searchconsole, ['query'], startDate, endDate);
  console.log(`  Found ${queryRows.length} query rows`);

  console.log(`Pulling ALL pages from ${startDate} to ${endDate}...`);
  const pageRows = await fetchAllRows(searchconsole, ['page'], startDate, endDate);
  console.log(`  Found ${pageRows.length} page rows`);

  const outputDir = path.join(__dirname, 'seo-reports');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Queries CSV
  const qCsv = 'Query,Clicks,Impressions,CTR,Position\n' +
    queryRows.map(r => `"${r.keys[0]}",${r.clicks},${r.impressions},${(r.ctr * 100).toFixed(2)}%,${r.position.toFixed(1)}`).join('\n');
  fs.writeFileSync(path.join(outputDir, `queries-${startDate}-to-${endDate}.csv`), qCsv);

  // Pages CSV
  const pCsv = 'Page,Clicks,Impressions,CTR,Position\n' +
    pageRows.map(r => `"${r.keys[0]}",${r.clicks},${r.impressions},${(r.ctr * 100).toFixed(2)}%,${r.position.toFixed(1)}`).join('\n');
  fs.writeFileSync(path.join(outputDir, `pages-${startDate}-to-${endDate}.csv`), pCsv);

  const qImp = queryRows.reduce((s, r) => s + r.impressions, 0);
  const qClk = queryRows.reduce((s, r) => s + r.clicks, 0);
  const pImp = pageRows.reduce((s, r) => s + r.impressions, 0);
  const pClk = pageRows.reduce((s, r) => s + r.clicks, 0);

  console.log(`\nQueries: ${queryRows.length.toLocaleString()} rows, ${qImp.toLocaleString()} impressions, ${qClk} clicks`);
  console.log(`Pages:   ${pageRows.length.toLocaleString()} rows, ${pImp.toLocaleString()} impressions, ${pClk} clicks`);
  console.log(`\nSaved to:`);
  console.log(`  ${path.join(outputDir, `queries-${startDate}-to-${endDate}.csv`)}`);
  console.log(`  ${path.join(outputDir, `pages-${startDate}-to-${endDate}.csv`)}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
