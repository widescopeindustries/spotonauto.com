#!/usr/bin/env node
/**
 * Cloudflare status-code breakdown by day + top UAs/countries.
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
        try { resolve(JSON.parse(body)); } catch { reject(new Error(body.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function fmt(n) { return Number(n || 0).toLocaleString(); }
function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  if (!EMAIL || !KEY) { console.error('Set CF_EMAIL and CF_KEY'); process.exit(1); }
  const endDate = addDays(new Date().toISOString().slice(0, 10), -1);
  const startDate = addDays(endDate, -6); // last 7 days

  // Status code breakdown by date + responseStatus
  const q = `{
    viewer {
      zones(filter: { zoneTag: "${ZONE_ID}" }) {
        httpRequests1dGroups(
          limit: 100,
          filter: { date_geq: "${startDate}", date_leq: "${endDate}" }
          dimensions: [DATE, RESPONSE_STATUS]
        ) {
          dimensions { date responseStatus }
          sum { requests pageViews bytes }
        }
      }
    }
  }`;
  const res = await cfGql(q);
  if (res.errors) { console.error(JSON.stringify(res.errors, null, 2)); process.exit(1); }

  const byDay = {};
  for (const g of res.data?.viewer?.zones?.[0]?.httpRequests1dGroups || []) {
    const d = g.dimensions.date;
    const status = Number(g.dimensions.responseStatus);
    if (!byDay[d]) byDay[d] = { r2:0, r3:0, r4:0, r5:0, total:0, pv:0, bytes:0 };
    byDay[d].total += g.sum.requests;
    byDay[d].pv += g.sum.pageViews;
    byDay[d].bytes += g.sum.bytes;
    if (status >= 200 && status < 300) byDay[d].r2 += g.sum.requests;
    else if (status >= 300 && status < 400) byDay[d].r3 += g.sum.requests;
    else if (status >= 400 && status < 500) byDay[d].r4 += g.sum.requests;
    else if (status >= 500 && status < 600) byDay[d].r5 += g.sum.requests;
  }

  const days = Object.keys(byDay).sort();
  console.log(`\n╔════════════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║  CLOUDFLARE STATUS BREAKDOWN: ${startDate} to ${endDate}           ║`);
  console.log(`╚════════════════════════════════════════════════════════════════════════════════════╝\n`);
  console.log('Date       | 2xx       | 3xx       | 4xx      | 5xx     | Total     | Page Views | GB    ');
  console.log('-----------+-----------+-----------+----------+---------+-----------+------------+-------');
  let t = { r2:0, r3:0, r4:0, r5:0, total:0, pv:0, bytes:0 };
  for (const d of days) {
    const g = byDay[d];
    const gb = (g.bytes / 1024/1024/1024).toFixed(2);
    t.r2 += g.r2; t.r3 += g.r3; t.r4 += g.r4; t.r5 += g.r5; t.total += g.total; t.pv += g.pv; t.bytes += g.bytes;
    console.log(`${d} | ${fmt(g.r2).padStart(9)} | ${fmt(g.r3).padStart(9)} | ${fmt(g.r4).padStart(8)} | ${fmt(g.r5).padStart(7)} | ${fmt(g.total).padStart(9)} | ${fmt(g.pv).padStart(10)} | ${gb.padStart(5)}`);
  }
  console.log('-----------+-----------+-----------+----------+---------+-----------+------------+-------');
  console.log(`TOTAL      | ${fmt(t.r2).padStart(9)} | ${fmt(t.r3).padStart(9)} | ${fmt(t.r4).padStart(8)} | ${fmt(t.r5).padStart(7)} | ${fmt(t.total).padStart(9)} | ${fmt(t.pv).padStart(10)} | ${(t.bytes/1024/1024/1024).toFixed(2).padStart(5)}`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
