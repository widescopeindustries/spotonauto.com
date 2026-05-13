const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'credentials', 'google-service-account.json');
const GA_PROPERTY_ID = '520432705';

async function buildGaClient() {
  const credentials = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  return google.analyticsdata({ version: 'v1beta', auth });
}

async function main() {
  const analyticsdata = await buildGaClient();
  
  console.log('\n=== ORGANIC + REFERRAL TRAFFIC: MAY 7–12 ===\n');
  console.log('Date       | Google | Bing | ChatGPT | Yahoo | DDG  | Direct | Total');
  console.log('-----------|--------|------|---------|-------|------|--------|------');
  
  for (let day = 7; day <= 12; day++) {
    const date = `2026-05-${day.toString().padStart(2, '0')}`;
    
    const res = await analyticsdata.properties.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate: date, endDate: date }],
        dimensions: [{ name: 'sessionSource' }],
        metrics: [{ name: 'sessions' }],
      },
    });
    
    const sources = {};
    let total = 0;
    for (const row of res.data.rows || []) {
      const src = row.dimensionValues[0].value || '(direct)';
      const sess = Number(row.metricValues[0].value);
      sources[src] = sess;
      total += sess;
    }
    
    const google = sources['google'] || 0;
    const bing = sources['bing'] || 0;
    const chatgpt = sources['chatgpt.com'] || 0;
    const yahoo = sources['yahoo'] || 0;
    const ddg = sources['duckduckgo'] || 0;
    const direct = sources['(direct)'] || 0;
    
    console.log(
      `${date} | ${google.toString().padStart(6)} | ${bing.toString().padStart(4)} | ${chatgpt.toString().padStart(7)} | ${yahoo.toString().padStart(5)} | ${ddg.toString().padStart(4)} | ${direct.toString().padStart(6)} | ${total.toString().padStart(5)}`
    );
  }
  
  // Also check spotonauto.com property if there is one
  console.log('\n=== Checking if spotonauto.com has its own GA4 property... ===');
  console.log('(We only have access to property 520432705 which is alloemmanuals.com)');
}

main().catch(console.error);
