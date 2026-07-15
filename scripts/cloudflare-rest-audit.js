#!/usr/bin/env node
/**
 * Cloudflare REST analytics dashboard — status breakdown, threats, etc.
 */
const https = require('https');

const ZONE_ID = process.env.CF_ZONE_ID || '39bc783c4300814591558911c805facc';
const EMAIL = process.env.CF_EMAIL;
const KEY = process.env.CF_KEY;

function cfGet(path) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.cloudflare.com',
      path,
      headers: { 'X-Auth-Email': EMAIL, 'X-Auth-Key': KEY },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch { reject(new Error(body.slice(0, 200))); }
      });
    }).on('error', reject);
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
  const startDate = addDays(endDate, -6);
  const since = `${startDate}T00:00:00Z`;
  const until = `${endDate}T23:59:59Z`;

  const res = await cfGet(`/client/v4/zones/${ZONE_ID}/analytics/dashboard?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&continuous=false`);
  if (!res.success) { console.error(JSON.stringify(res.errors, null, 2)); process.exit(1); }

  const data = res.result;
  const ts = data.timeseries || [];

  console.log(`\n╔════════════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║  CLOUDFLARE DASHBOARD: ${startDate} to ${endDate}                  ║`);
  console.log(`╚════════════════════════════════════════════════════════════════════════════════════╝\n`);

  console.log('Date       | Requests  | Page Views | Threats | 200s      | 4xx      | 5xx     | GB    ');
  console.log('-----------+-----------+------------+---------+-----------+----------+---------+-------');
  let t = { requests: 0, pageViews: 0, threats: 0, r2: 0, r4: 0, r5: 0, bytes: 0 };
  for (const d of ts) {
    const date = d.since.slice(0, 10);
    const r = d.requests.all || 0;
    const pv = d.pageviews.all || 0;
    const th = d.threats.all || 0;
    const r2 = d.requests.status_2xx || 0;
    const r4 = d.requests.status_4xx || 0;
    const r5 = d.requests.status_5xx || 0;
    const gb = ((d.bandwidth.all || 0) / 1024/1024/1024).toFixed(2);
    t.requests += r; t.pageViews += pv; t.threats += th; t.r2 += r2; t.r4 += r4; t.r5 += r5; t.bytes += d.bandwidth.all || 0;
    console.log(`${date} | ${fmt(r).padStart(9)} | ${fmt(pv).padStart(10)} | ${fmt(th).padStart(7)} | ${fmt(r2).padStart(9)} | ${fmt(r4).padStart(8)} | ${fmt(r5).padStart(7)} | ${gb.padStart(5)}`);
  }
  console.log('-----------+-----------+------------+---------+-----------+----------+---------+-------');
  console.log(`TOTAL      | ${fmt(t.requests).padStart(9)} | ${fmt(t.pageViews).padStart(10)} | ${fmt(t.threats).padStart(7)} | ${fmt(t.r2).padStart(9)} | ${fmt(t.r4).padStart(8)} | ${fmt(t.r5).padStart(7)} | ${(t.bytes/1024/1024/1024).toFixed(2).padStart(5)}`);

  console.log(`\n=== TOP COUNTRIES (requests) ===`);
  const countries = Object.entries(data.totals.requests.country || {}).sort((a,b) => b[1] - a[1]).slice(0, 10);
  for (const [c, n] of countries) console.log(`  ${c.padEnd(20)} ${fmt(n).padStart(10)}`);

  console.log(`\n=== TOP STATUS CODES ===`);
  const status = data.totals.requests;
  for (const k of Object.keys(status).filter(k => k.startsWith('status_')).sort()) {
    console.log(`  ${k.replace('status_', '').padEnd(6)} ${fmt(status[k]).padStart(10)}`);
  }

  console.log(`\n=== TOP THREAT COUNTRIES ===`);
  const threats = Object.entries(data.totals.threats.country || {}).sort((a,b) => b[1] - a[1]).slice(0, 10);
  for (const [c, n] of threats) console.log(`  ${c.padEnd(20)} ${fmt(n).padStart(10)}`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
