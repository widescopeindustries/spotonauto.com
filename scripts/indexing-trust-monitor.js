#!/usr/bin/env node

/**
 * SpotOnAuto Indexing Trust Monitor
 *
 * Purpose:
 * - Inspect a URL set with GSC URL Inspection API.
 * - Track whether "Crawled - currently not indexed" is growing or shrinking.
 * - Persist snapshots so trend can be monitored across runs.
 *
 * Usage:
 *   node scripts/indexing-trust-monitor.js
 *   node scripts/indexing-trust-monitor.js --input public/repair/winners/urls.txt --concurrency 6
 *   node scripts/indexing-trust-monitor.js --limit 100 --fail-on-increase --max-not-indexed-increase 0
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const KEY_PATH = path.join(ROOT, 'credentials', 'google-service-account.json');
const SITE_URL = 'sc-domain:spotonauto.com';
const DEFAULT_INPUT = path.join(ROOT, 'public', 'repair', 'winners', 'urls.txt');
const OUTPUT_DIR = path.join(__dirname, 'seo-reports');
const LATEST_PATH = path.join(OUTPUT_DIR, 'indexing-trust-latest.json');

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function toPosInt(v, fallback) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function resolveInputPath(inputArg) {
  if (!inputArg) return DEFAULT_INPUT;
  if (path.isAbsolute(inputArg)) return inputArg;
  return path.join(ROOT, inputArg);
}

function dedupeUrls(urls) {
  return [...new Set(urls)];
}

function extractUrl(line) {
  const trimmed = String(line || '').trim();
  if (!trimmed) return null;

  const direct = trimmed.replace(/^"|"$/g, '');
  if (/^https?:\/\//i.test(direct)) return direct;

  const match = trimmed.match(/https?:\/\/[^,"\s]+/i);
  return match ? match[0] : null;
}

function loadUrls(inputPath, limit = null) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input URL list not found: ${inputPath}`);
  }
  const all = fs
    .readFileSync(inputPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => extractUrl(line))
    .filter(Boolean);
  const unique = dedupeUrls(all);
  if (limit && unique.length > limit) return unique.slice(0, limit);
  return unique;
}

function classifyCoverage(coverageState) {
  const s = String(coverageState || 'UNKNOWN').toLowerCase();
  if (s.includes('not indexed')) return 'not_indexed';
  if (s.includes('indexed')) return 'indexed';
  if (s.includes('redirect')) return 'redirect';
  if (s.includes('soft 404')) return 'soft_404';
  if (s.includes('blocked')) return 'blocked';
  if (s === 'error') return 'error';
  return 'other';
}

function sanitizeTimestampForFile(iso) {
  return iso.replace(/[.:]/g, '-');
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function inspectResultFromApi(url, indexStatusResult) {
  const coverageState = indexStatusResult?.coverageState || 'UNKNOWN';
  const verdict = indexStatusResult?.verdict || 'UNKNOWN';
  const indexingState = indexStatusResult?.indexingState || 'UNKNOWN';
  return {
    url,
    coverageState,
    verdict,
    indexingState,
    lastCrawlTime: indexStatusResult?.lastCrawlTime || null,
    referringUrlsCount: Array.isArray(indexStatusResult?.referringUrls)
      ? indexStatusResult.referringUrls.length
      : 0,
    classification: classifyCoverage(coverageState),
  };
}

function inspectErrorResult(url, err) {
  return {
    url,
    coverageState: 'ERROR',
    verdict: 'ERROR',
    indexingState: 'ERROR',
    lastCrawlTime: null,
    referringUrlsCount: 0,
    classification: 'error',
    error: String(err?.message || err),
  };
}

async function buildSearchConsoleClient() {
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error(`Credentials file not found at ${KEY_PATH}`);
  }
  const credentials = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  return google.searchconsole({ version: 'v1', auth });
}

async function inspectUrls(searchconsole, urls, concurrency) {
  const out = new Array(urls.length);
  let next = 0;

  const workers = Array.from({ length: concurrency }, async () => {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= urls.length) return;

      const url = urls[index];
      try {
        const res = await searchconsole.urlInspection.index.inspect({
          requestBody: {
            inspectionUrl: url,
            siteUrl: SITE_URL,
          },
        });
        const indexStatusResult = res.data?.inspectionResult?.indexStatusResult || {};
        out[index] = inspectResultFromApi(url, indexStatusResult);
      } catch (err) {
        out[index] = inspectErrorResult(url, err);
      }
    }
  });

  await Promise.all(workers);
  return out;
}

function summarize(results) {
  const byCoverageState = {};
  const byVerdict = {};
  const byClass = {};

  for (const row of results) {
    byCoverageState[row.coverageState] = (byCoverageState[row.coverageState] || 0) + 1;
    byVerdict[row.verdict] = (byVerdict[row.verdict] || 0) + 1;
    byClass[row.classification] = (byClass[row.classification] || 0) + 1;
  }

  const total = results.length;
  const indexed = toNum(byClass.indexed);
  const notIndexed = toNum(byClass.not_indexed);
  const redirect = toNum(byClass.redirect);
  const errors = toNum(byClass.error);

  return {
    total,
    indexed,
    notIndexed,
    redirect,
    errors,
    indexedPct: total ? (indexed / total) * 100 : 0,
    notIndexedPct: total ? (notIndexed / total) * 100 : 0,
    byCoverageState,
    byVerdict,
    byClass,
  };
}

function readPreviousSnapshot() {
  if (!fs.existsSync(LATEST_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(LATEST_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function computeTransitions(previous, currentResults, currentSummary) {
  if (!previous || !Array.isArray(previous.results)) {
    return {
      hasBaseline: false,
      deltaNotIndexed: null,
      deltaIndexed: null,
      newlyNotIndexed: [],
      newlyIndexed: [],
      persistentlyNotIndexed: [],
      firstSeenNotIndexed: [],
    };
  }

  const prevSummary = previous.summary || {};
  const prevTotal = toNum(prevSummary.total);
  const prevErrors = toNum(prevSummary.errors);
  if (prevTotal > 0 && prevErrors >= prevTotal) {
    return {
      hasBaseline: false,
      deltaNotIndexed: null,
      deltaIndexed: null,
      newlyNotIndexed: [],
      newlyIndexed: [],
      persistentlyNotIndexed: [],
      firstSeenNotIndexed: [],
    };
  }

  const previousMap = new Map(previous.results.map((row) => [row.url, row.classification]));
  const newlyNotIndexed = [];
  const newlyIndexed = [];
  const persistentlyNotIndexed = [];
  const firstSeenNotIndexed = [];

  for (const row of currentResults) {
    const prevClass = previousMap.get(row.url) || null;

    if (row.classification === 'not_indexed') {
      if (!prevClass || prevClass === 'error') firstSeenNotIndexed.push(row.url);
      else if (prevClass === 'not_indexed') persistentlyNotIndexed.push(row.url);
      else if (prevClass === 'indexed') newlyNotIndexed.push(row.url);
    }

    if (row.classification === 'indexed' && prevClass === 'not_indexed') {
      newlyIndexed.push(row.url);
    }
  }

  return {
    hasBaseline: true,
    deltaNotIndexed: currentSummary.notIndexed - toNum(prevSummary.notIndexed),
    deltaIndexed: currentSummary.indexed - toNum(prevSummary.indexed),
    newlyNotIndexed,
    newlyIndexed,
    persistentlyNotIndexed,
    firstSeenNotIndexed,
  };
}

function printSummary({
  inputPath,
  concurrency,
  limit,
  summary,
  transitions,
  snapshotPath,
  startedAt,
  finishedAt,
}) {
  console.log('\nSpotOnAuto Indexing Trust Monitor');
  console.log(`Site:                ${SITE_URL}`);
  console.log(`Input list:          ${inputPath}`);
  console.log(`URLs inspected:      ${summary.total}`);
  console.log(`Concurrency:         ${concurrency}`);
  console.log(`Limit:               ${limit || 'none'}`);
  console.log(`Started:             ${startedAt}`);
  console.log(`Finished:            ${finishedAt}`);
  console.log(`Indexed:             ${summary.indexed} (${summary.indexedPct.toFixed(1)}%)`);
  console.log(`Not indexed:         ${summary.notIndexed} (${summary.notIndexedPct.toFixed(1)}%)`);
  console.log(`Redirect:            ${summary.redirect}`);
  console.log(`Errors:              ${summary.errors}`);

  if (transitions.hasBaseline) {
    const ni = transitions.deltaNotIndexed;
    const ix = transitions.deltaIndexed;
    console.log(`Delta not indexed:   ${ni >= 0 ? '+' : ''}${ni}`);
    console.log(`Delta indexed:       ${ix >= 0 ? '+' : ''}${ix}`);
    console.log(`Newly not indexed:   ${transitions.newlyNotIndexed.length}`);
    console.log(`Newly indexed:       ${transitions.newlyIndexed.length}`);
    console.log(`Still not indexed:   ${transitions.persistentlyNotIndexed.length}`);
    console.log(`First-seen bad:      ${transitions.firstSeenNotIndexed.length}`);
  } else {
    console.log('Delta:               no baseline snapshot yet');
  }

  console.log(`Snapshot:            ${snapshotPath}`);
}

async function main() {
  const inputPath = resolveInputPath(getArg('input', null));
  const concurrency = toPosInt(getArg('concurrency', '5'), 5);
  const limit = toPosInt(getArg('limit', null), null);
  const forceLatest = hasFlag('force-latest');
  const failOnIncrease = hasFlag('fail-on-increase');
  const maxIncrease = toNum(getArg('max-not-indexed-increase', '0'));

  const urls = loadUrls(inputPath, limit);
  if (!urls.length) {
    throw new Error(`No URLs found in ${inputPath}`);
  }

  ensureDir(OUTPUT_DIR);

  const startedAt = new Date().toISOString();
  const searchconsole = await buildSearchConsoleClient();
  const results = await inspectUrls(searchconsole, urls, concurrency);
  const finishedAt = new Date().toISOString();
  const summary = summarize(results);

  const previous = readPreviousSnapshot();
  const transitions = computeTransitions(previous, results, summary);

  const snapshot = {
    siteUrl: SITE_URL,
    inputPath,
    startedAt,
    finishedAt,
    options: {
      concurrency,
      limit,
    },
    summary,
    transitions: {
      hasBaseline: transitions.hasBaseline,
      deltaNotIndexed: transitions.deltaNotIndexed,
      deltaIndexed: transitions.deltaIndexed,
      newlyNotIndexedCount: transitions.newlyNotIndexed.length,
      newlyIndexedCount: transitions.newlyIndexed.length,
      persistentlyNotIndexedCount: transitions.persistentlyNotIndexed.length,
      firstSeenNotIndexedCount: transitions.firstSeenNotIndexed.length,
    },
    samples: {
      newlyNotIndexed: transitions.newlyNotIndexed.slice(0, 20),
      newlyIndexed: transitions.newlyIndexed.slice(0, 20),
      persistentlyNotIndexed: transitions.persistentlyNotIndexed.slice(0, 20),
      firstSeenNotIndexed: transitions.firstSeenNotIndexed.slice(0, 20),
    },
    results,
  };

  const timestampName = sanitizeTimestampForFile(finishedAt);
  const snapshotPath = path.join(OUTPUT_DIR, `indexing-trust-${timestampName}.json`);
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));

  const isCanonicalInput = path.resolve(inputPath) === path.resolve(DEFAULT_INPUT);
  const shouldUpdateLatest = forceLatest || (isCanonicalInput && !limit);
  if (shouldUpdateLatest) {
    fs.writeFileSync(LATEST_PATH, JSON.stringify(snapshot, null, 2));
  }

  printSummary({
    inputPath,
    concurrency,
    limit,
    summary,
    transitions,
    snapshotPath,
    startedAt,
    finishedAt,
  });

  if (
    failOnIncrease &&
    transitions.hasBaseline &&
    typeof transitions.deltaNotIndexed === 'number' &&
    transitions.deltaNotIndexed > maxIncrease
  ) {
    console.error(
      `\nFailing run: not-indexed increased by ${transitions.deltaNotIndexed} (max allowed ${maxIncrease}).`,
    );
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(`\nIndexing trust monitor failed: ${err.message || err}`);
  process.exit(1);
});
