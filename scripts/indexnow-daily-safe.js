#!/usr/bin/env node
/**
 * Safe Daily IndexNow Submitter for alloemmanuals.com
 *
 * Rules:
 * - Only submits URLs with lastmod within the last 48 hours
 * - Hard cap: 100 URLs per run
 * - 150ms delay between individual submissions
 * - 3s delay between batches of 100
 * - Logs every submission to scripts/seo-reports/indexnow-daily-YYYY-MM-DD.log
 * - Never submits more than 100 URLs even if 10,000 changed
 *
 * Usage:
 *   node scripts/indexnow-daily-safe.js
 *   node scripts/indexnow-daily-safe.js --dry-run
 *   node scripts/indexnow-daily-safe.js --hours 72 --limit 50
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'scripts', 'seo-reports');
const HOST = 'alloemmanuals.com';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';
const DEFAULT_LIMIT = 100;
const DEFAULT_HOURS = 48;
const DELAY_BETWEEN_URLS_MS = 150;
const DELAY_BETWEEN_BATCHES_MS = 3000;
const BATCH_SIZE = 100;
const DEDUP_DAYS = 7; // Don't resubmit same URL within 7 days
const HISTORY_FILE = path.join(REPORT_DIR, 'indexnow-submission-history.json');

// Sitemap entry points
const SITEMAP_INDEXES = [
  'https://alloemmanuals.com/sitemap.xml',
  'https://alloemmanuals.com/vehicles/sitemap.xml',
  'https://alloemmanuals.com/codes/sitemap.xml',
  'https://alloemmanuals.com/repair/sitemap.xml',
  'https://alloemmanuals.com/tools/sitemap.xml',
  'https://alloemmanuals.com/wiring/sitemap.xml',
];

function getArg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function isoDateTime(d = new Date()) {
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

function loadSubmissionHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
  } catch {
    // corrupted, start fresh
  }
  return {};
}

function saveSubmissionHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
}

function filterRecentlySubmitted(entries, history, days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffMs = cutoff.getTime();

  return entries.filter(entry => {
    const last = history[entry.url];
    if (!last) return true;
    return new Date(last).getTime() < cutoffMs;
  });
}

function fetchXml(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'AllOEMManuals-IndexNow/2.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchXml(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

function extractUrlsWithLastmod(xml) {
  const entries = [];
  const urlRe = /<url>([\s\S]*?)<\/url>/g;
  let match;
  while ((match = urlRe.exec(xml)) !== null) {
    const block = match[1];
    const locMatch = block.match(/<loc>([^<]+)<\/loc>/);
    const lastmodMatch = block.match(/<lastmod>([^<]+)<\/lastmod>/);
    if (locMatch) {
      entries.push({
        url: locMatch[1].trim(),
        lastmod: lastmodMatch ? lastmodMatch[1].trim() : null,
      });
    }
  }
  return entries;
}

function extractSitemaps(xml) {
  const urls = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = re.exec(xml)) !== null) {
    urls.push(match[1].trim());
  }
  return urls;
}

function isSitemapIndex(xml) {
  return xml.includes('<sitemapindex');
}

async function fetchAllSitemapUrls(indexUrl, depth = 0) {
  if (depth > 3) return [];
  try {
    const xml = await fetchXml(indexUrl);
    if (isSitemapIndex(xml)) {
      const children = extractSitemaps(xml);
      const results = [];
      for (const child of children) {
        const childEntries = await fetchAllSitemapUrls(child, depth + 1);
        for (const e of childEntries) results.push(e);
      }
      return results;
    }
    return extractUrlsWithLastmod(xml);
  } catch (err) {
    console.error(`  [error] ${indexUrl}: ${err.message}`);
    return [];
  }
}

function parseLastmodDate(lastmod) {
  if (!lastmod) return null;
  try {
    return new Date(lastmod);
  } catch {
    return null;
  }
}

function getIndexNowKey() {
  if (process.env.INDEXNOW_KEY && process.env.INDEXNOW_KEY.trim()) {
    return process.env.INDEXNOW_KEY.trim();
  }
  const publicDir = path.join(ROOT, 'public');
  if (!fs.existsSync(publicDir)) return null;
  const keyFile = fs.readdirSync(publicDir).find((f) => /^[a-f0-9]{32}\.txt$/i.test(f));
  if (!keyFile) return null;
  return fs.readFileSync(path.join(publicDir, keyFile), 'utf8').trim();
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'AllOEMManuals-IndexNow/2.0' } }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error(`Timeout`));
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function submitSingleUrl(url, key) {
  const encodedUrl = encodeURIComponent(url);
  const endpoint = `${INDEXNOW_ENDPOINT}?url=${encodedUrl}&key=${key}`;
  return getJson(endpoint);
}

async function main() {
  const dryRun = hasFlag('dry-run');
  const hours = Math.max(1, Math.min(168, Number(getArg('hours', String(DEFAULT_HOURS))) || DEFAULT_HOURS));
  const limit = Math.max(1, Math.min(1000, Number(getArg('limit', String(DEFAULT_LIMIT))) || DEFAULT_LIMIT));

  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  const logFile = path.join(REPORT_DIR, `indexnow-daily-${isoDate()}.log`);
  const key = getIndexNowKey();
  if (!dryRun && !key) {
    throw new Error('IndexNow key not found. Set INDEXNOW_KEY env or add <key>.txt to /public');
  }

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hours);

  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║     AllOEMManuals - Safe Daily IndexNow Submitter            ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝`);
  console.log(`\nMode:        ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Cutoff:      lastmod >= ${cutoff.toISOString().slice(0, 19)} (${hours}h)`);
  console.log(`Daily cap:   ${limit} URLs`);
  console.log(`Log file:    ${logFile}\n`);

  // Fetch all sitemap entries
  console.log('Fetching sitemaps...');
  const allEntries = [];
  for (const sitemapUrl of SITEMAP_INDEXES) {
    const entries = await fetchAllSitemapUrls(sitemapUrl);
    console.log(`  ${sitemapUrl} → ${entries.length} URLs`);
    for (const e of entries) allEntries.push(e);
  }
  console.log(`Total sitemap entries: ${allEntries.length}\n`);

  // Filter to recent URLs only
  const recentEntries = allEntries.filter(entry => {
    const date = parseLastmodDate(entry.lastmod);
    if (!date) return false;
    return date >= cutoff;
  });

  // Deduplicate by URL
  const seen = new Set();
  const uniqueEntries = [];
  for (const entry of recentEntries) {
    if (seen.has(entry.url)) continue;
    seen.add(entry.url);
    uniqueEntries.push(entry);
  }

  // Deduplicate against submission history
  const history = loadSubmissionHistory();
  const freshEntries = filterRecentlySubmitted(uniqueEntries, history, DEDUP_DAYS);

  console.log(`Recent URLs (last ${hours}h): ${uniqueEntries.length}`);
  console.log(`Already submitted (last ${DEDUP_DAYS}d): ${uniqueEntries.length - freshEntries.length}`);

  // Hard cap
  const toSubmit = freshEntries.slice(0, limit);
  if (toSubmit.length < freshEntries.length) {
    console.log(`(capped to ${limit})`);
  }
  console.log(`\nSubmitting: ${toSubmit.length} URL(s)\n`);

  if (dryRun) {
    console.log('[DRY RUN] Sample URLs:');
    for (const entry of toSubmit.slice(0, 20)) {
      console.log(`  ${entry.lastmod?.slice(0, 10) || '????-??-??'}  ${entry.url}`);
    }
    if (toSubmit.length > 20) console.log(`  ... and ${toSubmit.length - 20} more`);
    return;
  }

  // Submit with rate limiting
  const logLines = [`# IndexNow Daily Submission - ${isoDateTime()}`, `# Cutoff: ${cutoff.toISOString()}`, `# Cap: ${limit}`, ''];
  let submitted = 0;
  let failed = 0;
  const totalBatches = Math.ceil(toSubmit.length / BATCH_SIZE);

  for (let i = 0; i < toSubmit.length; i++) {
    const entry = toSubmit[i];
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    if (i % BATCH_SIZE === 0) {
      process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${Math.min(BATCH_SIZE, toSubmit.length - i)} URLs)... `);
    }

    try {
      const res = await submitSingleUrl(entry.url, key);
      if (res.status === 200 || res.status === 202) {
        submitted++;
        logLines.push(`OK  ${entry.url}`);
      } else {
        failed++;
        logLines.push(`ERR ${entry.url} HTTP_${res.status}`);
      }
    } catch (err) {
      failed++;
      logLines.push(`ERR ${entry.url} ${err.message}`);
    }

    // Delay between URLs
    if (i < toSubmit.length - 1) {
      await sleep(DELAY_BETWEEN_URLS_MS);
    }

    // Progress at end of batch
    if (i % BATCH_SIZE === BATCH_SIZE - 1 || i === toSubmit.length - 1) {
      console.log(`✓ (${submitted} ok${failed > 0 ? `, ${failed} err` : ''})`);
    }

    // Extra delay between batches
    if ((i + 1) % BATCH_SIZE === 0 && i + 1 < toSubmit.length) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  // Update submission history for successfully submitted URLs
  if (submitted > 0) {
    const now = new Date().toISOString();
    for (const entry of toSubmit) {
      history[entry.url] = now;
    }
    saveSubmissionHistory(history);
  }

  logLines.push('', `# Summary: ${submitted} OK, ${failed} failed, ${toSubmit.length} total`);
  fs.writeFileSync(logFile, logLines.join('\n') + '\n', 'utf8');

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Submitted: ${submitted}`);
  if (failed > 0) console.log(`  Errors:    ${failed}`);
  console.log(`  Skipped:   ${uniqueEntries.length - toSubmit.length} (over cap)`);
  console.log(`  Log:       ${logFile}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(err => {
  console.error(`\nFatal error: ${err.message}\n`);
  process.exit(1);
});
