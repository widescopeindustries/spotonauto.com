#!/usr/bin/env node
/**
 * Cloudflare daily edge analytics — alloemmanuals.com
 * Pulls requests, page views, bandwidth, threats, status codes by day.
 */
const https = require('https');

const ZONE_ID = process.env.CF_ZONE_ID || '39bc783c4300814591558911c805facc';
const EMAIL = process.env.CF_EMAIL;
const KEY = process.env.CF_KEY;

function cfGql(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query });
    const req = https.request({
      hostname: 'api.cloudflare.com',
      path: '/client/v4/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'X-Auth-Email': EMAIL,
        'X-Auth-Key': KEY,
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Invalid JSON: ' + body.slice(0, 200)));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function fmt(n) {
  return Number(n || 0).toLocaleString();
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  if (!EMAIL || !KEY) {
    console.error('Set CF_EMAIL and CF_KEY env vars');
    process.exit(1);
  }

  const endDate = addDays(new Date().toISOString().slice(0, 10), -1);
  const startDate = addDays(endDate, -13);

  const query = `
{
  viewer {
    zones(filter: { zoneTag: "${ZONE_ID}" }) {
      httpRequests1dGroups(
        limit: 20,
        filter: { date_geq: "${startDate}", date_leq: "${endDate}" }
      ) {
        dimensions { date }
        sum { requests pageViews bytes threats }
        uniq { uniques }
      }
    }
  }
}`;

  const res = await cfGql(query);
  if (res.errors) {
    console.error('Cloudflare GraphQL errors:', JSON.stringify(res.errors, null, 2));
    process.exit(1);
  }

  const groups = res.data?.viewer?.zones?.[0]?.httpRequests1dGroups || [];
  groups.sort((a, b) => a.dimensions.date.localeCompare(b.dimensions.date));

  console.log(`\n╔════════════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║     CLOUDFLARE EDGE ANALYTICS: ${startDate} to ${endDate}          ║`);
  console.log(`╚════════════════════════════════════════════════════════════════════════════════════╝\n`);
  console.log('Date       | Requests  | Page Views | Bandwidth (GB) | Threats | Uniques');
  console.log('-----------+-----------+------------+----------------+---------+--------');

  let totals = { requests: 0, pageViews: 0, bytes: 0, threats: 0, uniques: 0 };
  for (const g of groups) {
    const d = g.dimensions.date;
    const r = g.sum.requests;
    const pv = g.sum.pageViews;
    const gb = (g.sum.bytes / 1024 / 1024 / 1024).toFixed(2);
    const t = g.sum.threats;
    const u = g.uniq.uniques;
    totals.requests += r;
    totals.pageViews += pv;
    totals.bytes += g.sum.bytes;
    totals.threats += t;
    totals.uniques += u;
    console.log(`${d} | ${fmt(r).padStart(9)} | ${fmt(pv).padStart(10)} | ${gb.padStart(14)} | ${fmt(t).padStart(7)} | ${fmt(u).padStart(7)}`);
  }
  console.log('-----------+-----------+------------+----------------+---------+--------');
  console.log(`TOTAL      | ${fmt(totals.requests).padStart(9)} | ${fmt(totals.pageViews).padStart(10)} | ${(totals.bytes / 1024 / 1024 / 1024).toFixed(2).padStart(14)} | ${fmt(totals.threats).padStart(7)} | ${fmt(totals.uniques).padStart(7)}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
