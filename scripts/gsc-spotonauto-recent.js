const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const SITE_URL = 'sc-domain:spotonauto.com';

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

async function main() {
  const endDate = '2026-05-11';
  const startDate = '2026-04-13';
  const searchconsole = await buildClient();

  console.log(`=== SPOTONAUTO.COM GSC: ${startDate} to ${endDate} ===\n`);

  const dailyRows = await fetchAllRows(searchconsole, ['date'], startDate, endDate);
  let totalImp = 0, totalClk = 0;
  console.log('Date       | Impressions | Clicks  | CTR    | Position');
  console.log('-----------|-------------|---------|--------|----------');
  for (const row of dailyRows.sort((a,b) => a.keys[0].localeCompare(b.keys[0]))) {
    const date = row.keys[0];
    const imp = row.impressions;
    const clk = row.clicks;
    const ctr = (row.ctr * 100).toFixed(1);
    const pos = row.position.toFixed(1);
    totalImp += imp; totalClk += clk;
    console.log(`${date} | ${imp.toString().padStart(11)} | ${clk.toString().padStart(7)} | ${ctr.padStart(5)}% | ${pos.padStart(8)}`);
  }
  console.log(`\nTotal: ${totalImp.toLocaleString()} impressions, ${totalClk} clicks`);

  const queryRows = await fetchAllRows(searchconsole, ['query'], startDate, endDate);
  console.log('\n=== TOP 15 QUERIES (spotonauto.com) ===');
  for (const row of queryRows.sort((a,b) => b.clicks - a.clicks).slice(0,15)) {
    const q = row.keys[0].substring(0,55);
    console.log(`${q.padEnd(55)} | ${String(row.clicks).padStart(3)} clk | ${String(row.impressions).padStart(5)} imp | pos ${row.position.toFixed(1)}`);
  }

  const pageRows = await fetchAllRows(searchconsole, ['page'], startDate, endDate);
  console.log('\n=== TOP 10 PAGES (spotonauto.com) ===');
  for (const row of pageRows.sort((a,b) => b.clicks - a.clicks).slice(0,10)) {
    const p = row.keys[0].replace('https://spotonauto.com','').substring(0,60);
    console.log(`${p.padEnd(60)} | ${String(row.clicks).padStart(3)} clk | ${String(row.impressions).padStart(5)} imp`);
  }
}

main().catch(console.error);
