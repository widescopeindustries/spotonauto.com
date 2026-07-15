#!/usr/bin/env node
/**
 * Stripe daily audit — checkout sessions, charges, customers for alloemmanuals.com
 */
const https = require('https');

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const DAYS = 21;

function stripeGet(path) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.stripe.com',
      path: path,
      headers: { 'Authorization': `Bearer ${STRIPE_KEY}` },
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
function dayFromUnix(ts) { return new Date(ts * 1000).toISOString().slice(0, 10); }

async function fetchAll(url) {
  const all = [];
  let nextUrl = url;
  for (let i = 0; i < 20 && nextUrl; i++) {
    const res = await stripeGet(nextUrl);
    all.push(...(res.data || []));
    nextUrl = res.has_more && res.data.length ? `${url.split('?')[0]}?starting_after=${res.data[res.data.length-1].id}&${url.split('?')[1] || ''}` : null;
  }
  return all;
}

async function main() {
  if (!STRIPE_KEY) { console.error('Set STRIPE_SECRET_KEY'); process.exit(1); }
  const endDate = addDays(new Date().toISOString().slice(0, 10), -1);
  const startDate = addDays(endDate, -(DAYS - 1));
  const startTs = Math.floor(new Date(`${startDate}T00:00:00Z`).getTime() / 1000);
  const endTs = Math.ceil(new Date(`${endDate}T23:59:59Z`).getTime() / 1000);

  console.log(`\n╔════════════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║  STRIPE AUDIT: ${startDate} to ${endDate}                            ║`);
  console.log(`╚════════════════════════════════════════════════════════════════════════════════════╝\n`);

  // Checkout sessions
  const sessions = await fetchAll(`/v1/checkout/sessions?created[gte]=${startTs}&created[lte]=${endTs}&limit=100`);
  const byDay = {};
  for (const d of [...Array(DAYS).keys()].map(i => addDays(startDate, i))) byDay[d] = { sessions: 0, paid: 0, amount: 0, expired: 0, open: 0 };
  for (const s of sessions) {
    const d = dayFromUnix(s.created);
    if (!byDay[d]) continue;
    byDay[d].sessions++;
    if (s.payment_status === 'paid') { byDay[d].paid++; byDay[d].amount += s.amount_total || 0; }
    else if (s.status === 'expired') byDay[d].expired++;
    else if (s.status === 'open') byDay[d].open++;
  }

  console.log('Date       | Sessions | Paid | Expired | Open | Revenue');
  console.log('-----------+----------+------+---------+------+--------');
  let t = { sessions: 0, paid: 0, expired: 0, open: 0, amount: 0 };
  for (const d of Object.keys(byDay).sort()) {
    const r = byDay[d];
    t.sessions += r.sessions; t.paid += r.paid; t.expired += r.expired; t.open += r.open; t.amount += r.amount;
    console.log(`${d} | ${fmt(r.sessions).padStart(8)} | ${fmt(r.paid).padStart(4)} | ${fmt(r.expired).padStart(7)} | ${fmt(r.open).padStart(4)} | $${(r.amount/100).toFixed(2).padStart(7)}`);
  }
  console.log('-----------+----------+------+---------+------+--------');
  console.log(`TOTAL      | ${fmt(t.sessions).padStart(8)} | ${fmt(t.paid).padStart(4)} | ${fmt(t.expired).padStart(7)} | ${fmt(t.open).padStart(4)} | $${(t.amount/100).toFixed(2).padStart(7)}`);

  // Charges + customers
  const charges = await fetchAll(`/v1/charges?created[gte]=${startTs}&created[lte]=${endTs}&limit=100`);
  const customers = await fetchAll(`/v1/customers?created[gte]=${startTs}&created[lte]=${endTs}&limit=100`);
  console.log(`\nCharges in period:   ${fmt(charges.length)}`);
  console.log(`Customers in period: ${fmt(customers.length)}`);
  console.log(`Total revenue:       $${(charges.reduce((a,c)=>a+(c.amount-c.amount_refunded),0)/100).toFixed(2)}`);

  // Pack breakdown
  const packCounts = {};
  for (const s of sessions) {
    const line = s.line_items?.data?.[0];
    const name = line?.price?.product?.name || s.metadata?.pack || 'unknown';
    packCounts[name] = (packCounts[name] || 0) + 1;
  }
  console.log(`\n=== CHECKOUT PACK BREAKDOWN ===`);
  for (const [k, v] of Object.entries(packCounts).sort((a,b)=>b[1]-a[1])) {
    console.log(`  ${k.padEnd(15)} ${fmt(v).padStart(4)} sessions`);
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
