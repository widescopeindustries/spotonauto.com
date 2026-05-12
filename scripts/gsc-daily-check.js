const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const SITE_URL = 'sc-domain:alloemmanuals.com';

async function main() {
  const credentials = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const startDate = '2026-02-20';
  const endDate = '2026-03-01';

  const res = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['date'],
      rowLimit: 1000,
    },
  });

  const rows = res.data.rows || [];
  console.log(`Daily impressions from ${startDate} to ${endDate}:\n`);
  console.log('Date        | Impressions | Clicks   | CTR     | Position');
  console.log('------------|-------------|----------|---------|----------');

  let peak = { date: '', impressions: 0 };
  for (const row of rows) {
    const date = row.keys[0];
    const imp = row.impressions;
    const clk = row.clicks;
    const ctr = (row.ctr * 100).toFixed(1);
    const pos = row.position.toFixed(1);
    console.log(`${date} | ${imp.toString().padStart(11)} | ${clk.toString().padStart(8)} | ${ctr.padStart(6)}% | ${pos.padStart(8)}`);
    if (imp > peak.impressions) {
      peak = { date, impressions: imp };
    }
  }

  console.log(`\nPeak day: ${peak.date} with ${peak.impressions.toLocaleString()} impressions`);
}

main().catch(console.error);
