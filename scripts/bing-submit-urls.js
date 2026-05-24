#!/usr/bin/env node
/**
 * Bing URL Submission API — bulk submit URLs for fast indexing.
 *
 * Bing allows up to 10,000 URLs/day via the Webmaster Tools API.
 * This script submits high-priority URLs in batches of 100.
 *
 * Usage:
 *   node scripts/bing-submit-urls.js                # Submit winner + tool pages
 *   node scripts/bing-submit-urls.js --full         # Submit all sitemap URLs
 *   node scripts/bing-submit-urls.js --dry-run      # Preview only
 *   node scripts/bing-submit-urls.js --limit 500    # Cap submissions
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.BING_WEBMASTER_API_KEY || '';
const SITE_URL = 'https://alloemmanuals.com';
const BATCH_SIZE = 100;
const DELAY_MS = 500;

function bingPost(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'ssl.bing.com',
      path: `/webmaster/api.svc/json${path}?apikey=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(data),
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
    req.write(data);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchSitemapUrls(sitemapUrl) {
  const urls = [];
  try {
    const xml = await new Promise((resolve, reject) => {
      https.get(sitemapUrl, { headers: { 'User-Agent': 'AllOEMManuals-BingBot/1.0' } }, (res) => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });

    let idx = 0;
    while (true) {
      const start = xml.indexOf('<loc>', idx);
      if (start === -1) break;
      const end = xml.indexOf('</loc>', start + 5);
      if (end === -1) break;
      urls.push(xml.substring(start + 5, end).trim());
      idx = end + 6;
    }

    // If it's a sitemap index, recurse
    if (xml.includes('<sitemapindex')) {
      let all = [];
      for (const child of urls) {
        const childUrls = await fetchSitemapUrls(child);
        all = all.concat(childUrls);
      }
      return all;
    }
  } catch (err) {
    console.log(`  [error] ${sitemapUrl}: ${err.message}`);
  }
  return urls;
}

async function submitBatch(urlList) {
  return bingPost('/SubmitUrlBatch', {
    siteUrl: SITE_URL,
    urlList,
  });
}

async function main() {
  if (!API_KEY) {
    console.error('❌ BING_WEBMASTER_API_KEY not set');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fullMode = args.includes('--full');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : Infinity;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              Bing Webmaster Tools — URL Submission           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  if (dryRun) console.log('[DRY RUN]\n');

  let urls = [];

  if (fullMode) {
    console.log('Fetching URLs from all sitemaps...');
    const sitemaps = [
      'https://alloemmanuals.com/sitemap.xml',
      'https://alloemmanuals.com/vehicles/sitemap.xml',
      'https://alloemmanuals.com/codes/sitemap.xml',
      'https://alloemmanuals.com/repair/sitemap.xml',
      'https://alloemmanuals.com/manual/sitemap.xml',
      'https://alloemmanuals.com/wiring/sitemap.xml',
      'https://alloemmanuals.com/tools/sitemap.xml',
    ];
    for (const sm of sitemaps) {
      const found = await fetchSitemapUrls(sm);
      console.log(`  ${sm} → ${found.length} URLs`);
      urls.push(...found);
    }
  } else {
    // Priority mode: homepage, key tool pages, vehicle hubs, codes, wiring
    console.log('Loading priority URLs...');
    urls.push('https://alloemmanuals.com/');
    urls.push('https://alloemmanuals.com/diagnose');
    urls.push('https://alloemmanuals.com/repair');
    urls.push('https://alloemmanuals.com/codes');
    urls.push('https://alloemmanuals.com/wiring');
    urls.push('https://alloemmanuals.com/tools');
    urls.push('https://alloemmanuals.com/guides');
    urls.push('https://alloemmanuals.com/vehicles');
    urls.push('https://alloemmanuals.com/about');
    urls.push('https://alloemmanuals.com/contact');

    // Tool pages
    const toolPages = await fetchSitemapUrls('https://alloemmanuals.com/sitemap.xml');
    urls.push(...toolPages.filter((u) => u.includes('/tools/')));

    // Vehicle hub pages (sample: first 200)
    const vehicleUrls = await fetchSitemapUrls('https://alloemmanuals.com/vehicles/sitemap.xml');
    urls.push(...vehicleUrls.slice(0, 200));

    // Codes (first 100)
    const codeUrls = await fetchSitemapUrls('https://alloemmanuals.com/codes/sitemap.xml');
    urls.push(...codeUrls.slice(0, 100));
  }

  // Deduplicate
  urls = [...new Set(urls)];
  console.log(`\nTotal unique URLs: ${urls.length}`);

  const toSubmit = urls.slice(0, limit);
  if (limit < urls.length) {
    console.log(`Capped to ${limit} URLs`);
  }

  if (dryRun) {
    console.log('\n[DRY RUN] Sample URLs:');
    for (const u of toSubmit.slice(0, 15)) console.log('  ' + u);
    if (toSubmit.length > 15) console.log(`  ... and ${toSubmit.length - 15} more`);
    return;
  }

  const totalBatches = Math.ceil(toSubmit.length / BATCH_SIZE);
  console.log(`\nSubmitting ${toSubmit.length} URLs in ${totalBatches} batch(es) of ${BATCH_SIZE}...\n`);

  let submitted = 0;
  let errors = 0;

  for (let i = 0; i < toSubmit.length; i += BATCH_SIZE) {
    const batch = toSubmit.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} URLs)... `);

    try {
      const res = await submitBatch(batch);
      if (res.status === 200 || res.status === 202) {
        console.log(`✓ (HTTP ${res.status})`);
        submitted += batch.length;
      } else {
        console.log(`✗ (HTTP ${res.status}: ${JSON.stringify(res.data).slice(0, 120)})`);
        errors += batch.length;
      }
    } catch (err) {
      console.log(`✗ (${err.message})`);
      errors += batch.length;
    }

    if (i + BATCH_SIZE < toSubmit.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Submitted: ${submitted}`);
  if (errors > 0) console.log(`  Errors:    ${errors}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
