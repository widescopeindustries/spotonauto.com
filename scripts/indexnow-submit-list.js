#!/usr/bin/env node
/**
 * Submit an explicit list of URLs to IndexNow.
 *
 * Usage:
 *   node scripts/indexnow-submit-list.js url1 url2 ...
 *   node scripts/indexnow-submit-list.js --file urls.txt
 *   node scripts/indexnow-submit-list.js --file urls.txt --dry-run
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const HOST = 'alloemmanuals.com';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';
const DEFAULT_DELAY_MS = 150;

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
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
    https.get(url, { headers: { 'User-Agent': 'AllOEMManuals-IndexNow/2.0' } }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function submitSingleUrl(url, key) {
  const encodedUrl = encodeURIComponent(url);
  const endpoint = `${INDEXNOW_ENDPOINT}?url=${encodedUrl}&key=${key}`;
  return getJson(endpoint);
}

async function main() {
  const dryRun = hasFlag('dry-run');
  const filePath = getArg('file');
  const delay = Number(getArg('delay', String(DEFAULT_DELAY_MS))) || DEFAULT_DELAY_MS;

  let urls = [];
  if (filePath) {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    urls = fs.readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
  } else {
    urls = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  }

  if (urls.length === 0) {
    console.error('Usage: node scripts/indexnow-submit-list.js [--file urls.txt] [--dry-run] url1 url2 ...');
    process.exit(1);
  }

  const key = getIndexNowKey();
  if (!dryRun && !key) {
    console.error('IndexNow key not found. Set INDEXNOW_KEY env or add <key>.txt to /public');
    process.exit(1);
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║       AllOEMManuals - IndexNow Explicit URL Submission         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`Mode:    ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`URLs:    ${urls.length}`);
  console.log(`Delay:   ${delay}ms\n`);

  let submitted = 0;
  let failed = 0;
  const logLines = [`# IndexNow Explicit Submission - ${new Date().toISOString()}`, `# URLs: ${urls.length}`, ''];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    process.stdout.write(`  [${String(i + 1).padStart(String(urls.length).length)}/${urls.length}] ${url} ... `);

    if (dryRun) {
      console.log('DRY RUN');
      continue;
    }

    try {
      const res = await submitSingleUrl(url, key);
      if (res.status === 200 || res.status === 202) {
        submitted++;
        console.log('OK');
        logLines.push(`OK  ${url}`);
      } else {
        failed++;
        console.log(`ERR HTTP ${res.status}`);
        logLines.push(`ERR ${url} HTTP_${res.status}`);
      }
    } catch (err) {
      failed++;
      console.log(`ERR ${err.message}`);
      logLines.push(`ERR ${url} ${err.message}`);
    }

    if (i < urls.length - 1) {
      await sleep(delay);
    }
  }

  if (!dryRun) {
    const reportDir = path.join(ROOT, 'scripts', 'seo-reports');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    const logFile = path.join(reportDir, `indexnow-explicit-${new Date().toISOString().slice(0, 10)}.log`);
    logLines.push('', `# Summary: ${submitted} OK, ${failed} failed, ${urls.length} total`);
    fs.writeFileSync(logFile, logLines.join('\n') + '\n', 'utf8');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Submitted: ${submitted}`);
    if (failed > 0) console.log(`  Errors:    ${failed}`);
    console.log(`  Log:       ${logFile}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
