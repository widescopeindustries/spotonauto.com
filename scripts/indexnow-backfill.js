#!/usr/bin/env node
/**
 * Sequential IndexNow backlog submitter.
 *
 * Reads the latest (or specified) indexnow-recent-audit CSV and submits the next
 * unseen URLs in bounded batches, while persisting a submitted log so repeated
 * runs continue where the previous run left off.
 *
 * Usage:
 *   node scripts/indexnow-backfill.js
 *   node scripts/indexnow-backfill.js --csv scripts/seo-reports/indexnow-recent-audit-2026-04-22.csv --batch 5000
 *   node scripts/indexnow-backfill.js --dry-run
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const REPORT_DIR = path.join(__dirname, 'seo-reports');
const HOST = 'spotonauto.com';
const ENDPOINT = 'https://api.indexnow.org/IndexNow';

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

function latestAuditCsv() {
  const files = fs.readdirSync(REPORT_DIR)
    .filter((name) => /^indexnow-recent-audit-\d{4}-\d{2}-\d{2}\.csv$/.test(name))
    .sort();
  if (!files.length) return null;
  return path.join(REPORT_DIR, files[files.length - 1]);
}

function getIndexNowKey() {
  if (process.env.INDEXNOW_KEY && process.env.INDEXNOW_KEY.trim()) return process.env.INDEXNOW_KEY.trim();
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

async function submitBatch(urls, key) {
  const payload = {
    host: HOST,
    key,
    keyLocation: `https://${HOST}/${key}.txt`,
    urlList: urls,
  };
  return postJson(ENDPOINT, payload);
}

async function main() {
  const csvPath = getArg('csv') ? path.resolve(getArg('csv')) : latestAuditCsv();
  const batch = Math.max(100, Number(getArg('batch', '5000')) || 5000);
  const dryRun = hasFlag('dry-run');

  if (!csvPath || !fs.existsSync(csvPath)) {
    throw new Error('No indexnow-recent-audit CSV found. Run scripts/indexnow-recent-audit.js first.');
  }

  const key = getIndexNowKey();
  if (!dryRun && !key) {
    throw new Error('Could not locate IndexNow key (env INDEXNOW_KEY or public/<key>.txt).');
  }

  const auditDateMatch = path.basename(csvPath).match(/(\d{4}-\d{2}-\d{2})/);
  const auditDate = auditDateMatch ? auditDateMatch[1] : isoDate();
  const submittedLog = path.join(REPORT_DIR, `indexnow-backfill-submitted-${auditDate}.txt`);

  const alreadySubmitted = new Set(
    fs.existsSync(submittedLog)
      ? fs.readFileSync(submittedLog, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
      : []
  );

  const lines = fs.readFileSync(csvPath, 'utf8').trim().split(/\r?\n/);
  const header = lines.shift();
  if (!header) throw new Error('CSV is empty.');

  const candidates = [];
  for (const line of lines) {
    const [url, _path, _prefix, seenOnBing] = parseCsvLine(line);
    if (!url) continue;
    if (seenOnBing === 'yes') continue;
    if (alreadySubmitted.has(url)) continue;
    candidates.push(url);
  }

  const toSubmit = candidates.slice(0, batch);

  console.log(`Audit CSV: ${csvPath}`);
  console.log(`Submitted log: ${submittedLog}`);
  console.log(`Already submitted from this audit: ${alreadySubmitted.size}`);
  console.log(`Remaining unseen candidates: ${candidates.length}`);
  console.log(`This run batch size: ${toSubmit.length}`);

  if (!toSubmit.length) {
    console.log('No URLs left to submit for this audit file.');
    return;
  }

  if (dryRun) {
    console.log('\n[DRY RUN] Sample URLs:');
    for (const url of toSubmit.slice(0, 15)) console.log(`  ${url}`);
    if (toSubmit.length > 15) console.log(`  ... and ${toSubmit.length - 15} more`);
    return;
  }

  const chunkSize = 100;
  let okCount = 0;
  let failCount = 0;

  for (let i = 0; i < toSubmit.length; i += chunkSize) {
    const chunk = toSubmit.slice(i, i + chunkSize);
    const res = await submitBatch(chunk, key);
    if (res.status === 200 || res.status === 202) {
      okCount += chunk.length;
    } else {
      failCount += chunk.length;
      console.error(`Chunk failed: HTTP ${res.status} body=${res.body || '(empty)'}`);
    }
  }

  if (okCount > 0) {
    fs.appendFileSync(submittedLog, `${toSubmit.slice(0, okCount).join('\n')}\n`, 'utf8');
  }

  console.log(`\nSubmitted OK: ${okCount}`);
  console.log(`Submitted failed: ${failCount}`);
  console.log(`Estimated remaining after this run: ${Math.max(0, candidates.length - okCount)}`);
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
