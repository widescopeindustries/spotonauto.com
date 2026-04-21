#!/usr/bin/env node
/**
 * IndexNow URL Submission for spotonauto.com
 *
 * DEFAULT (streaming mode): Detects which files changed in the latest deploy
 * via git diff, maps them to affected sitemaps, and submits only those URLs.
 * This avoids server overload and gets changed pages indexed faster.
 *
 * Usage:
 *   node scripts/submit-indexnow.js              # Streaming: submit only changed URLs
 *   node scripts/submit-indexnow.js --full        # Full: submit ALL URLs from all sitemaps
 *   node scripts/submit-indexnow.js --dry-run     # Just show what would be submitted
 *   node scripts/submit-indexnow.js --limit 500   # Cap total URLs submitted
 *   node scripts/submit-indexnow.js --dead /pricing /scanner  # Notify about dead/removed URLs
 */

const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

const INDEXNOW_KEY = 'b2e1ed9a4693444c8bf73f80fe75f1e0';
const HOST = 'spotonauto.com';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';
const BATCH_SIZE = 100; // Small batches for streaming
const DELAY_BETWEEN_BATCHES_MS = 3000; // 3s between batches

// ── Sitemap sections and their git triggers ─────────────────────────
// Each entry maps a sitemap URL to file patterns that, when changed,
// mean that sitemap's URLs need resubmission.
const SITEMAP_TRIGGERS = [
  {
    sitemap: 'https://spotonauto.com/sitemap.xml',
    triggers: ['src/app/page.tsx', 'src/app/tools/', 'src/app/guides/', 'src/app/symptoms/',
               'src/app/cel/', 'src/app/about/', 'src/app/contact/', 'src/app/parts/',
               'src/app/second-opinion/', 'src/data/tools-pages', 'src/data/symptomGraph',
               'src/data/vehicles', 'src/app/sitemap.ts', 'src/app/wiring/page'],
  },
  {
    sitemap: 'https://spotonauto.com/vehicles/sitemap.xml',
    triggers: ['src/app/vehicles/', 'src/data/vehicles', 'src/data/knowledge-graph',
               'src/lib/knowledge-graph'],
  },
  {
    sitemap: 'https://spotonauto.com/codes/sitemap.xml',
    triggers: ['src/app/codes/', 'src/data/dtc', 'src/data/codes'],
  },
  {
    sitemap: 'https://spotonauto.com/community/sitemap.xml',
    triggers: ['src/app/community/'],
  },
  {
    sitemap: 'https://spotonauto.com/repair/sitemap.xml',
    triggers: ['src/app/repair/', 'scripts/generate-repair-sitemaps', 'src/data/repair',
               'src/app/charm-repair/'],
  },
  {
    sitemap: 'https://spotonauto.com/repair/winners/sitemap.xml',
    triggers: ['src/app/repair/winners/'],
  },
  {
    sitemap: 'https://spotonauto.com/manual/sitemap.xml',
    triggers: ['src/app/manual/', 'src/data/manual'],
  },
  {
    sitemap: 'https://spotonauto.com/wiring/sitemap.xml',
    triggers: ['src/app/wiring/', 'scripts/generate-wiring-sitemaps', 'src/data/wiring'],
  },
];

// Global files: if these change, submit a sample from every sitemap
const GLOBAL_TRIGGERS = [
  'src/app/layout.tsx', 'src/components/', 'src/lib/', 'tailwind.config',
  'next.config', 'package.json',
];

// ── Helpers ──────────────────────────────────────────────────────────

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'SpotOnAuto-IndexNow/2.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
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
  if (depth > 3) return [];
  try {
    const xml = await fetchUrl(sitemapUrl);
    const urls = extractUrls(xml);
    if (isSitemapIndex(xml)) {
      console.log(`  [index] ${sitemapUrl} → ${urls.length} child sitemaps`);
      const allUrls = [];
      for (const childUrl of urls) {
        const childUrls = await fetchSitemapUrls(childUrl, depth + 1);
        allUrls.push(...childUrls);
      }
      return allUrls;
    } else {
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

// ── Change detection ────────────────────────────────────────────────

function getChangedFiles() {
  try {
    // Try git diff against the previous commit
    const output = execSync('git diff HEAD~1 --name-only 2>/dev/null', {
      encoding: 'utf-8',
      timeout: 10000,
    });
    const files = output.trim().split('\n').filter(Boolean);
    if (files.length > 0) return files;
  } catch {
    // git not available or no previous commit
  }

  try {
    // Fallback: files changed in the last commit
    const output = execSync('git show --name-only --format="" HEAD 2>/dev/null', {
      encoding: 'utf-8',
      timeout: 10000,
    });
    const files = output.trim().split('\n').filter(Boolean);
    if (files.length > 0) return files;
  } catch {
    // git not available
  }

  return null; // Can't determine changes
}

function getAffectedSitemaps(changedFiles) {
  const affected = new Set();
  let isGlobalChange = false;

  for (const file of changedFiles) {
    // Check global triggers
    for (const trigger of GLOBAL_TRIGGERS) {
      if (file.startsWith(trigger) || file === trigger) {
        isGlobalChange = true;
        break;
      }
    }

    // Check per-sitemap triggers
    for (const entry of SITEMAP_TRIGGERS) {
      for (const trigger of entry.triggers) {
        if (file.startsWith(trigger) || file === trigger) {
          affected.add(entry.sitemap);
        }
      }
    }
  }

  if (isGlobalChange) {
    // Global change: include all sitemaps but we'll cap URLs later
    return { sitemaps: SITEMAP_TRIGGERS.map(e => e.sitemap), isGlobal: true };
  }

  return { sitemaps: [...affected], isGlobal: false };
}

// ── Submission ──────────────────────────────────────────────────────

async function submitBatch(urls) {
  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };
  return postJson(INDEXNOW_ENDPOINT, payload);
}

async function submitUrls(urls, dryRun) {
  if (urls.length === 0) {
    console.log('\nNo URLs to submit.');
    return;
  }

  if (dryRun) {
    console.log(`\n[DRY RUN] Would submit ${urls.length} URLs`);
    console.log('Sample URLs:');
    for (const url of urls.slice(0, 15)) console.log('  ' + url);
    if (urls.length > 15) console.log(`  ... and ${urls.length - 15} more`);
    return;
  }

  const totalBatches = Math.ceil(urls.length / BATCH_SIZE);
  console.log(`\nSubmitting ${urls.length} URLs in ${totalBatches} batch(es) of ${BATCH_SIZE}...`);

  let submitted = 0;
  let errors = 0;

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} URLs)... `);

    try {
      const res = await submitBatch(batch);
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
    if (i + BATCH_SIZE < urls.length) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Submitted: ${submitted}`);
  if (errors > 0) console.log(`  Errors:    ${errors}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fullMode = args.includes('--full');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : Infinity;

  // ── Dead-link mode ────────────────────────────────────────────────
  // Submit specific removed/dead URLs so search engines re-crawl and
  // discover the 404 or redirect, then drop them from the index.
  const deadIdx = args.indexOf('--dead');
  if (deadIdx !== -1) {
    const paths = args.slice(deadIdx + 1).filter(a => !a.startsWith('--'));
    if (paths.length === 0) {
      console.error('Usage: --dead /path1 /path2 ...');
      process.exit(1);
    }
    const deadUrls = paths.map(p => `https://${HOST}${p.startsWith('/') ? p : '/' + p}`);
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║       SpotOnAuto - IndexNow Dead Link Notification          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log(`Notifying IndexNow about ${deadUrls.length} dead/removed URL(s):`);
    for (const u of deadUrls) console.log(`  • ${u}`);
    console.log();
    await submitUrls(deadUrls, dryRun);
    return;
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║       SpotOnAuto - IndexNow Streaming Submission            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (dryRun) console.log('[DRY RUN MODE]\n');

  // ── Determine which sitemaps to process ───────────────────────────
  let sitemapsToFetch;
  let globalSampleCap = Infinity; // Per-sitemap URL cap for global changes

  if (fullMode) {
    console.log('[FULL MODE] Submitting all URLs from all sitemaps.\n');
    sitemapsToFetch = SITEMAP_TRIGGERS.map(e => e.sitemap);
  } else {
    // Streaming mode: detect changes
    console.log('Detecting changed files...');
    const changedFiles = getChangedFiles();

    if (!changedFiles) {
      console.log('  Could not detect changes (no git). Falling back to full mode.\n');
      sitemapsToFetch = SITEMAP_TRIGGERS.map(e => e.sitemap);
    } else if (changedFiles.length === 0) {
      console.log('  No files changed. Nothing to submit.\n');
      return;
    } else {
      console.log(`  ${changedFiles.length} file(s) changed.`);
      const { sitemaps, isGlobal } = getAffectedSitemaps(changedFiles);

      if (sitemaps.length === 0) {
        console.log('  No sitemap-affecting changes detected. Nothing to submit.\n');
        return;
      }

      if (isGlobal) {
        console.log('  Global change detected — sampling from all sitemaps.');
        // For global changes, cap to 50 URLs per sitemap to keep total reasonable
        globalSampleCap = 50;
      }

      console.log(`  Affected sitemaps: ${sitemaps.length}`);
      for (const s of sitemaps) console.log(`    • ${s}`);
      console.log();
      sitemapsToFetch = sitemaps;
    }
  }

  // ── Fetch URLs from affected sitemaps ─────────────────────────────
  console.log('Fetching sitemaps...');
  let allUrls = [];

  for (const sitemapUrl of sitemapsToFetch) {
    const urls = await fetchSitemapUrls(sitemapUrl);
    // Apply per-sitemap cap for global changes
    if (globalSampleCap < Infinity && urls.length > globalSampleCap) {
      // Take evenly spaced sample
      const step = Math.floor(urls.length / globalSampleCap);
      const sampled = [];
      for (let i = 0; i < urls.length && sampled.length < globalSampleCap; i += step) {
        sampled.push(urls[i]);
      }
      console.log(`    ↳ Sampled ${sampled.length} of ${urls.length} URLs`);
      allUrls.push(...sampled);
    } else {
      allUrls.push(...urls);
    }
  }

  // Deduplicate
  const uniqueUrls = [...new Set(allUrls)];
  console.log(`\nTotal unique URLs: ${uniqueUrls.length}`);

  // Apply limit
  const urlsToSubmit = uniqueUrls.slice(0, limit);
  if (limit < uniqueUrls.length) {
    console.log(`Capped to ${limit} URLs`);
  }

  // ── Submit ────────────────────────────────────────────────────────
  await submitUrls(urlsToSubmit, dryRun);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
