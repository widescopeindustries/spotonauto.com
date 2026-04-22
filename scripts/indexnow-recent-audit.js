#!/usr/bin/env node
/**
 * IndexNow recent-publish audit for SpotOnAuto.
 *
 * What it does:
 * 1) Finds URLs added to sitemap XML files since a given date.
 * 2) Cross-checks whether those URLs appear in the latest Bing page report.
 * 3) Writes an audit CSV.
 * 4) Optionally submits a prioritized batch via IndexNow.
 *
 * Usage:
 *   node scripts/indexnow-recent-audit.js --since 2026-03-23
 *   node scripts/indexnow-recent-audit.js --since 2026-03-23 --submit --limit 10000
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'scripts', 'seo-reports');
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';
const HOST = 'spotonauto.com';

function getArg(name, fallback = null) {
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

function readLatestBingPagesCsv() {
  const files = fs.readdirSync(REPORT_DIR)
    .filter((f) => /^bing-pages-\d{4}-\d{2}-\d{2}\.csv$/.test(f))
    .sort();
  if (files.length === 0) return null;
  return path.join(REPORT_DIR, files[files.length - 1]);
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

function getBingPaths(csvPath) {
  const text = fs.readFileSync(csvPath, 'utf8').trim();
  const lines = text.split(/\r?\n/).slice(1);
  const paths = new Set();
  for (const line of lines) {
    const [page] = parseCsvLine(line);
    if (!page || !page.startsWith('/')) continue;
    paths.add(page);
  }
  return paths;
}

function getBaseCommit(sinceDate) {
  const cmd = `git rev-list -1 --before='${sinceDate} 00:00' HEAD`;
  const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
  if (!out) {
    throw new Error(`Could not find a base commit before ${sinceDate}`);
  }
  return out;
}

function getRecentSitemapUrls(baseCommit) {
  const cmd = [
    `git diff --unified=0 ${baseCommit}..HEAD --`,
    'public/repair/sitemap/*.xml',
    'public/wiring/sitemap/*.xml',
    'public/vehicles/sitemap/*.xml',
    'public/codes/sitemap/*.xml',
  ].join(' ');

  let out = '';
  try {
    out = execSync(cmd, {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 256,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    out = '';
  }

  const urls = new Set();
  const re = /^\+.*<loc>(https:\/\/spotonauto\.com[^<]+)<\/loc>/gm;
  let match;
  while ((match = re.exec(out)) !== null) {
    urls.add(match[1]);
  }
  return [...urls];
}

function urlToPath(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return '';
  }
}

function pathPrefix(pathname) {
  const parts = String(pathname || '').split('/').filter(Boolean);
  return parts.length ? `/${parts[0]}` : '/';
}

function submissionPriority(prefix) {
  const rank = {
    '/codes': 1,
    '/vehicles': 2,
    '/repair': 3,
    '/tools': 4,
    '/wiring': 9,
  };
  return rank[prefix] || 5;
}

function buildCsv(rows) {
  const header = ['url', 'path', 'prefix', 'seen_on_bing_pages_report'];
  const lines = [header.join(',')];
  for (const row of rows) {
    lines.push([
      `"${row.url}"`,
      `"${row.path}"`,
      `"${row.prefix}"`,
      row.seenOnBing ? 'yes' : 'no',
    ].join(','));
  }
  return `${lines.join('\n')}\n`;
}

function getIndexNowKey() {
  if (process.env.INDEXNOW_KEY && process.env.INDEXNOW_KEY.trim()) {
    return process.env.INDEXNOW_KEY.trim();
  }
  const publicDir = path.join(ROOT, 'public');
  const keyFile = fs.readdirSync(publicDir).find((f) => /^[a-f0-9]{32}\.txt$/i.test(f));
  if (!keyFile) return null;
  const key = fs.readFileSync(path.join(publicDir, keyFile), 'utf8').trim();
  return key || null;
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
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: responseBody }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function submitIndexNow(urls, key) {
  const chunkSize = 100;
  let submitted = 0;
  let failed = 0;
  for (let i = 0; i < urls.length; i += chunkSize) {
    const chunk = urls.slice(i, i + chunkSize);
    const payload = {
      host: HOST,
      key,
      keyLocation: `https://${HOST}/${key}.txt`,
      urlList: chunk,
    };
    try {
      const res = await postJson(INDEXNOW_ENDPOINT, payload);
      if (res.status === 200 || res.status === 202) {
        submitted += chunk.length;
      } else {
        failed += chunk.length;
      }
    } catch {
      failed += chunk.length;
    }
  }
  return { submitted, failed };
}

async function main() {
  const since = getArg('since', '2026-03-23');
  const limit = Number(getArg('limit', '10000'));
  const shouldSubmit = hasFlag('submit');
  const reportDate = isoDate();

  const bingCsv = readLatestBingPagesCsv();
  if (!bingCsv) {
    throw new Error('No bing-pages-YYYY-MM-DD.csv found in scripts/seo-reports');
  }
  const bingPaths = getBingPaths(bingCsv);

  const baseCommit = getBaseCommit(since);
  const recentUrls = getRecentSitemapUrls(baseCommit);
  const rows = recentUrls.map((url) => {
    const p = urlToPath(url);
    const prefix = pathPrefix(p);
    return {
      url,
      path: p,
      prefix,
      seenOnBing: bingPaths.has(p),
      priority: submissionPriority(prefix),
    };
  });

  rows.sort((a, b) => {
    if (a.seenOnBing !== b.seenOnBing) return a.seenOnBing ? 1 : -1;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.path.localeCompare(b.path);
  });

  const unseen = rows.filter((r) => !r.seenOnBing);
  const byPrefix = rows.reduce((acc, row) => {
    if (!acc[row.prefix]) acc[row.prefix] = { total: 0, unseen: 0 };
    acc[row.prefix].total += 1;
    if (!row.seenOnBing) acc[row.prefix].unseen += 1;
    return acc;
  }, {});

  const outCsv = path.join(REPORT_DIR, `indexnow-recent-audit-${reportDate}.csv`);
  fs.writeFileSync(outCsv, buildCsv(rows), 'utf8');

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║      SpotOnAuto - IndexNow Recent Publish Audit             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\nSince: ${since}`);
  console.log(`Base commit: ${baseCommit}`);
  console.log(`Latest Bing pages report: ${path.basename(bingCsv)}`);
  console.log(`Recently published URLs from sitemap diffs: ${rows.length}`);
  console.log(`Not seen in Bing pages report yet: ${unseen.length}`);
  console.log(`\nAudit CSV: ${outCsv}\n`);

  const prefixes = Object.keys(byPrefix).sort((a, b) => byPrefix[b].total - byPrefix[a].total);
  for (const prefix of prefixes) {
    const stat = byPrefix[prefix];
    console.log(`${prefix.padEnd(10)} total=${String(stat.total).padStart(7)} unseen=${String(stat.unseen).padStart(7)}`);
  }

  if (!shouldSubmit) return;

  const key = getIndexNowKey();
  if (!key) {
    throw new Error('Could not find IndexNow key (set INDEXNOW_KEY or add key file in /public)');
  }

  const queue = unseen.slice(0, Math.max(0, limit)).map((r) => r.url);
  if (queue.length === 0) {
    console.log('\nNo unseen URLs to submit.');
    return;
  }

  const submittedListPath = path.join(REPORT_DIR, `indexnow-recent-submitted-${reportDate}.txt`);
  fs.writeFileSync(submittedListPath, `${queue.join('\n')}\n`, 'utf8');

  console.log(`\nSubmitting ${queue.length} unseen URL(s) to IndexNow...`);
  const result = await submitIndexNow(queue, key);
  console.log(`Submitted: ${result.submitted}`);
  if (result.failed > 0) console.log(`Failed: ${result.failed}`);
  console.log(`Submitted URL list: ${submittedListPath}`);
}

main().catch((err) => {
  console.error(`\nError: ${err.message}`);
  process.exit(1);
});
