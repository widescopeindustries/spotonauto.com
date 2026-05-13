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

  console.log(`Pulling GSC data from ${startDate} to ${endDate}...\n`);

  // Daily summary
  const dailyRows = await fetchAllRows(searchconsole, ['date'], startDate, endDate);
  console.log('=== DAILY SUMMARY ===');
  console.log('Date       | Impressions | Clicks  | CTR    | Position');
  console.log('-----------|-------------|---------|--------|----------');
  let totalImp = 0, totalClk = 0;
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

  // Top queries
  const queryRows = await fetchAllRows(searchconsole, ['query'], startDate, endDate);
  console.log('\n=== TOP 20 QUERIES ===');
  console.log('Query | Clicks | Impressions | CTR | Position');
  for (const row of queryRows.sort((a,b) => b.clicks - a.clicks).slice(0,20)) {
    const q = row.keys[0].substring(0,50);
    console.log(`${q} | ${row.clicks} | ${row.impressions} | ${(row.ctr*100).toFixed(1)}% | ${row.position.toFixed(1)}`);
  }

  // Top pages
  const pageRows = await fetchAllRows(searchconsole, ['page'], startDate, endDate);
  console.log('\n=== TOP 20 PAGES ===');
  console.log('Page | Clicks | Impressions | CTR | Position');
  for (const row of pageRows.sort((a,b) => b.clicks - a.clicks).slice(0,20)) {
    const p = row.keys[0].substring(0,60);
    console.log(`${p} | ${row.clicks} | ${row.impressions} | ${(row.ctr*100).toFixed(1)}% | ${row.position.toFixed(1)}`);
  }

  // Countries
  const countryRows = await fetchAllRows(searchconsole, ['country'], startDate, endDate);
  console.log('\n=== TOP 10 COUNTRIES ===');
  for (const row of countryRows.sort((a,b) => b.clicks - a.clicks).slice(0,10)) {
    console.log(`${row.keys[0]}: ${row.clicks} clicks, ${row.impressions} impressions`);
  }

  // Devices
  const deviceRows = await fetchAllRows(searchconsole, ['device'], startDate, endDate);
  console.log('\n=== DEVICES ===');
  for (const row of deviceRows.sort((a,b) => b.clicks - a.clicks)) {
    console.log(`${row.keys[0]}: ${row.clicks} clicks, ${row.impressions} impressions`);
  }
}

main().catch(console.error);
