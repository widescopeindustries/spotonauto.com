#!/usr/bin/env node
/**
 * IndexNow Bulk URL Submission for spotonauto.com
 *
 * Fetches all sitemaps, extracts URLs, and submits them to IndexNow
 * (picked up by Bing, Yandex, Seznam, Naver).
 *
 * Usage:
 *   node scripts/submit-indexnow.js              # Submit all URLs from all sitemaps
 *   node scripts/submit-indexnow.js --dry-run    # Just count URLs, don't submit
 *   node scripts/submit-indexnow.js --limit 1000 # Submit first N URLs only
 */

const https = require('https');
const http = require('http');

const INDEXNOW_KEY = 'b2e1ed9a4693444c8bf73f80fe75f1e0';
const HOST = 'spotonauto.com';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';
const BATCH_SIZE = 10000; // IndexNow max per request
const DELAY_BETWEEN_BATCHES_MS = 2000;

// All sitemaps from robots.ts
const SITEMAP_URLS = [
  'https://spotonauto.com/sitemap.xml',
  'https://spotonauto.com/community/sitemap.xml',
  'https://spotonauto.com/codes/sitemap.xml',
  'https://spotonauto.com/codes/sitemap/0.xml',
  'https://spotonauto.com/vehicles/sitemap.xml',
  'https://spotonauto.com/repair/sitemap.xml',
  'https://spotonauto.com/repair/winners/sitemap.xml',
  'https://spotonauto.com/manual/sitemap.xml',
  'https://spotonauto.com/wiring/sitemap.xml',
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'SpotOnAuto-IndexNow/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function extractUrls(xml) {
  const urls = [];
  let idx = 0;
  while (true) {
    const start = xml.indexOf('<loc>', idx);
    if (start === -1) break;
    const end = xml.indexOf('</loc>', start + 5);
    if (end === -1) break;
    urls.push(xml.substring(start + 5, end).trim());
    idx = end + 6;
  }
  return urls;
}

function isSitemapIndex(xml) {
  return xml.includes('<sitemapindex');
}

async function fetchSitemapUrls(sitemapUrl, depth = 0) {
  if (depth > 3) {
    console.log(`  [skip] Max depth reached for ${sitemapUrl}`);
    return [];
  }

  try {
    const xml = await fetch(sitemapUrl);
    const urls = extractUrls(xml);

    if (isSitemapIndex(xml)) {
      // It's a sitemap index — URLs are child sitemaps
      console.log(`  [index] ${sitemapUrl} → ${urls.length} child sitemaps`);
      const allUrls = [];
      for (const childUrl of urls) {
        const childUrls = await fetchSitemapUrls(childUrl, depth + 1);
        allUrls.push(...childUrls);
      }
      return allUrls;
    } else {
      // Regular sitemap — URLs are page URLs
      console.log(`  [sitemap] ${sitemapUrl} → ${urls.length} URLs`);
      return urls;
    }
  } catch (err) {
    console.log(`  [error] ${sitemapUrl}: ${err.message}`);
    return [];
  }
}

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function submitBatch(urls) {
  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };

  const res = await postJson(INDEXNOW_ENDPOINT, payload);
  return res;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : Infinity;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║         SpotOnAuto - IndexNow Bulk Submission               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (dryRun) console.log('[DRY RUN MODE — no URLs will be submitted]\n');

  // Step 1: Fetch all URLs from all sitemaps
  console.log('Fetching sitemaps...');
  let allUrls = [];

  for (const sitemapUrl of SITEMAP_URLS) {
    const urls = await fetchSitemapUrls(sitemapUrl);
    for (const u of urls) allUrls.push(u);
  }

  // Deduplicate
  const seen = new Set();
  const uniqueUrls = [];
  for (const url of allUrls) {
    if (!seen.has(url)) {
      seen.add(url);
      uniqueUrls.push(url);
    }
  }
  console.log(`\nTotal URLs found: ${allUrls.length}`);
  console.log(`Unique URLs: ${uniqueUrls.length}`);

  // Apply limit
  const urlsToSubmit = uniqueUrls.slice(0, limit);
  if (limit < uniqueUrls.length) {
    console.log(`Limiting to first ${limit} URLs`);
  }

  if (dryRun) {
    console.log('\n[DRY RUN] Would submit ' + urlsToSubmit.length + ' URLs');
    console.log('Sample URLs:');
    for (const url of urlsToSubmit.slice(0, 10)) {
      console.log('  ' + url);
    }
    if (urlsToSubmit.length > 10) {
      console.log('  ... and ' + (urlsToSubmit.length - 10) + ' more');
    }
    return;
  }

  // Step 2: Submit in batches
  const totalBatches = Math.ceil(urlsToSubmit.length / BATCH_SIZE);
  console.log(`\nSubmitting ${urlsToSubmit.length} URLs in ${totalBatches} batch(es)...`);

  let submitted = 0;
  let errors = 0;

  for (let i = 0; i < urlsToSubmit.length; i += BATCH_SIZE) {
    const batch = urlsToSubmit.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} URLs)... `);

    try {
      const res = await submitBatch(batch);
      // 200 = OK, 202 = Accepted (key validation pending)
      if (res.status === 200 || res.status === 202) {
        console.log(`✓ (HTTP ${res.status})`);
        submitted += batch.length;
      } else {
        console.log(`✗ (HTTP ${res.status}: ${res.body})`);
        errors += batch.length;
      }
    } catch (err) {
      console.log(`✗ (${err.message})`);
      errors += batch.length;
    }

    // Rate limit between batches
    if (i + BATCH_SIZE < urlsToSubmit.length) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Submitted: ${submitted}`);
  console.log(`  Errors:    ${errors}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
