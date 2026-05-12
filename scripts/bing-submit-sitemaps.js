#!/usr/bin/env node
/**
 * Submit sitemaps to Bing Webmaster Tools API
 *
 * Usage:
 *   node scripts/bing-submit-sitemaps.js              # Submit all sitemaps
 *   node scripts/bing-submit-sitemaps.js --list       # List already-submitted sitemaps
 */

const https = require('https');

const API_KEY = process.env.BING_WEBMASTER_API_KEY || '';
const SITE_URL = 'https://alloemmanuals.com';

const SITEMAPS = [
  'https://alloemmanuals.com/sitemap.xml',
  'https://alloemmanuals.com/vehicles/sitemap.xml',
  'https://alloemmanuals.com/codes/sitemap.xml',
  'https://alloemmanuals.com/repair/sitemap.xml',
  'https://alloemmanuals.com/manual/sitemap.xml',
  'https://alloemmanuals.com/wiring/sitemap.xml',
];

function bingRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'ssl.bing.com',
      path: `/webmaster/api.svc/json${path}?apikey=${API_KEY}`,
      method,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
        } catch {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function listFeeds() {
  console.log('Fetching submitted sitemaps from Bing...\n');
  const res = await bingRequest('/GetFeeds');
  if (res.status === 200 && Array.isArray(res.data?.d)) {
    console.log(`Found ${res.data.d.length} submitted feed(s):`);
    for (const feed of res.data.d) {
      console.log(`  • ${feed}`);
    }
  } else {
    console.log('Response:', res.status, JSON.stringify(res.data, null, 2));
  }
}

async function submitSitemap(feedUrl) {
  const res = await bingRequest('/SubmitFeed', 'POST', {
    siteUrl: SITE_URL,
    feedUrl,
  });
  if (res.status === 200) {
    console.log('✅ Submitted:', feedUrl);
  } else {
    const msg = res.data?.ErrorMessage || JSON.stringify(res.data);
    if (msg.includes('already') || msg.includes('exists') || msg.includes('duplicate')) {
      console.log('⚠️  Already exists:', feedUrl);
    } else {
      console.log('❌ Failed:', feedUrl, '-', msg);
    }
  }
}

async function main() {
  if (!API_KEY) {
    console.error('❌ BING_WEBMASTER_API_KEY not set in environment');
    process.exit(1);
  }

  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    await listFeeds();
    return;
  }

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        Bing Webmaster Tools — Sitemap Submission             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log('Site:', SITE_URL);
  console.log();

  for (const sitemap of SITEMAPS) {
    await submitSitemap(sitemap);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
