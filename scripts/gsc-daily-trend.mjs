import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const KEY_PATH = path.join(process.cwd(), 'credentials', 'google-service-account.json');
const SITE_URL = 'sc-domain:alloemmanuals.com';

const credentials = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});
const searchconsole = google.searchconsole({ version: 'v1', auth });

const endDate = '2026-07-09';
const startDate = '2026-04-01';

async function fetchAllRows(dimensions, startDate, endDate) {
  const all = [];
  const rowLimit = 25000;
  let startRow = 0;
  for (;;) {
    const res = await searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: { startDate, endDate, dimensions, rowLimit, startRow },
    });
    const rows = res.data.rows || [];
    all.push(...rows);
    if (rows.length < rowLimit) break;
    startRow += rowLimit;
    if (startRow > 500000) break;
  }
  return all;
}

const daily = await fetchAllRows(['date'], startDate, endDate);
daily.sort((a, b) => a.keys[0].localeCompare(b.keys[0]));
console.log('Date,Clicks,Impressions,CTR,Position');
let totalClicks = 0, totalImp = 0;
for (const row of daily) {
  totalClicks += row.clicks;
  totalImp += row.impressions;
  console.log(`${row.keys[0]},${row.clicks},${row.impressions},${(row.ctr * 100).toFixed(1)}%,${row.position.toFixed(1)}`);
}
console.log(`\nTOTAL,${totalClicks},${totalImp},,`);
