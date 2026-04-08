#!/usr/bin/env node

/**
 * warm-charm-cache.mjs
 *
 * Crawls the CHARM proxy Worker to pre-populate the R2 cache.
 * Works breadth-first by make so coverage is spread evenly.
 *
 * Usage:
 *   node scripts/warm-charm-cache.mjs                   # crawl everything
 *   node scripts/warm-charm-cache.mjs --make Toyota     # one make only
 *   node scripts/warm-charm-cache.mjs --dry-run         # log URLs, don't fetch
 *   WORKER_URL=http://localhost:8787 node scripts/warm-charm-cache.mjs --make Acura
 *
 * Environment:
 *   WORKER_URL  — base URL of the charm-proxy Worker
 *                 (default: https://spotonauto-charm-proxy.wandering-frog-3cea.workers.dev)
 */

import { parseArgs } from 'node:util';

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------

const { values: flags } = parseArgs({
  options: {
    make:    { type: 'string',  short: 'm' },
    'dry-run': { type: 'boolean', short: 'd', default: false },
    help:    { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
});

if (flags.help) {
  console.log(`
Usage: node scripts/warm-charm-cache.mjs [options]

Options:
  --make, -m <name>   Crawl only this make (e.g. Toyota)
  --dry-run, -d       Log discovered URLs without fetching them
  --help, -h          Show this help message
`);
  process.exit(0);
}

const WORKER_URL = (process.env.WORKER_URL ||
  'https://spotonauto-charm-proxy.wandering-frog-3cea.workers.dev').replace(/\/+$/, '');

const DRY_RUN  = flags['dry-run'];
const ONLY_MAKE = flags.make || null;
const CONCURRENCY = 10;

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

const stats = { total: 0, hits: 0, misses: 0, errors: 0 };
const visited = new Set();      // absolute paths already queued / fetched
let   discovered = 0;           // total URLs discovered (for progress counter)

// ---------------------------------------------------------------------------
// Semaphore — limits concurrent fetches
// ---------------------------------------------------------------------------

class Semaphore {
  constructor(max) {
    this.max = max;
    this.current = 0;
    this.queue = [];
  }
  acquire() {
    return new Promise(resolve => {
      if (this.current < this.max) { this.current++; resolve(); }
      else { this.queue.push(resolve); }
    });
  }
  release() {
    if (this.queue.length > 0) { this.queue.shift()(); }
    else { this.current--; }
  }
}

const sem = new Semaphore(CONCURRENCY);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Links we should never follow. */
const SKIP_PATTERNS = [
  /^https?:/i,
  /^javascript:/i,
  /^mailto:/i,
  /^#/,
  /\/style\.css/i,
  /\/script\.js/i,
  /\/about\.html/i,
  /lemon-manuals/i,
  /\/bundle\//i,
  /\/icons\//i,
  /\/images\//i,
];

function shouldSkip(href) {
  return SKIP_PATTERNS.some(re => re.test(href));
}

/**
 * Extract all href values from an HTML string.
 * Handles both single-quote and double-quote attributes.
 */
function extractHrefs(html) {
  const hrefs = [];
  const re = /href=["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    hrefs.push(m[1]);
  }
  return hrefs;
}

/**
 * Resolve a relative href against a base path.
 * Both base and href are expected to be already-encoded URL paths.
 * Returns an absolute path starting with /.
 */
function resolveHref(base, href) {
  // Already absolute
  if (href.startsWith('/')) return href;

  // Strip trailing filename-like segment from base (keep the directory)
  // Since our bases always end with /, this is a no-op — but be safe.
  const dir = base.endsWith('/') ? base : base.replace(/[^/]*$/, '');
  return dir + href;
}

/**
 * True if the HTML looks like a leaf content page rather than a directory.
 * Leaf pages have no <ul> section inside <div class='main'> — they contain
 * headings, images, and text instead.  We detect them by checking for the
 * presence of <img class='big-img' (content imagery) or the absence of a
 * <ul> tag inside the main div.
 */
function isLeafPage(html) {
  // Extract the main div content for inspection
  const mainMatch = html.match(/<div class='main'>([\s\S]*?)<\/div>\s*<div class/);
  if (!mainMatch) return false;
  const main = mainMatch[1];

  // If there is no <ul> in the main section, it is a leaf
  if (!main.includes('<ul>')) return true;

  // If it has big-img content images, treat as leaf even if it also has a <ul>
  if (main.includes("class='big-img'") || main.includes('class="big-img"')) return true;

  return false;
}

/**
 * Fetch a URL through the Worker.  Returns { html, cacheStatus } or null on error.
 * Respects the semaphore and logs progress.
 */
async function warmUrl(urlPath) {
  stats.total++;
  const counter = stats.total;
  const shortPath = decodeURIComponent(urlPath).slice(0, 100);

  if (DRY_RUN) {
    console.log(`[${counter}/${discovered}] DRY  ${shortPath}`);
    return null;
  }

  await sem.acquire();
  try {
    const res = await fetch(`${WORKER_URL}${urlPath}`, {
      headers: { 'User-Agent': 'SpotOnAuto-CacheWarmer/1.0' },
    });

    const cacheStatus = res.headers.get('x-cache') || 'UNKNOWN';

    if (!res.ok) {
      stats.errors++;
      console.log(`[${counter}/${discovered}] ERR ${res.status} ${shortPath}`);
      // Drain body to free resources
      await res.text().catch(() => {});
      return null;
    }

    if (cacheStatus === 'HIT') stats.hits++;
    else stats.misses++;

    const html = await res.text();
    console.log(`[${counter}/${discovered}] ${cacheStatus.padEnd(4)} ${shortPath}`);
    return { html, cacheStatus };
  } catch (err) {
    stats.errors++;
    console.log(`[${counter}/${discovered}] ERR  ${shortPath}  ${err.message}`);
    return null;
  } finally {
    sem.release();
  }
}

/**
 * Fetch a URL and return its HTML body (for discovery / parsing).
 * Does NOT count toward warm stats — used during the discovery phase.
 */
async function fetchPage(urlPath) {
  await sem.acquire();
  try {
    const res = await fetch(`${WORKER_URL}${urlPath}`, {
      headers: { 'User-Agent': 'SpotOnAuto-CacheWarmer/1.0' },
    });
    if (!res.ok) {
      await res.text().catch(() => {});
      return null;
    }
    return await res.text();
  } catch {
    return null;
  } finally {
    sem.release();
  }
}

// ---------------------------------------------------------------------------
// Crawl stages
// ---------------------------------------------------------------------------

/**
 * Stage 1: Fetch root page and return list of make paths.
 * Each make is like "/Acura/", "/Toyota/", etc.
 */
async function discoverMakes() {
  console.log(`Fetching root page to discover makes...`);
  const html = await fetchPage('/');
  if (!html) { console.error('ERROR: Could not fetch root page'); process.exit(1); }

  const hrefs = extractHrefs(html);
  const makes = hrefs
    .filter(h => !shouldSkip(h) && h.endsWith('/') && !h.startsWith('/'))
    .map(h => '/' + h);

  // Deduplicate (shouldn't be needed but safety first)
  const unique = [...new Set(makes)];

  if (ONLY_MAKE) {
    const match = unique.find(m =>
      decodeURIComponent(m).toLowerCase() === `/${ONLY_MAKE.toLowerCase()}/`
    );
    if (!match) {
      console.error(`ERROR: Make "${ONLY_MAKE}" not found. Available makes:`);
      unique.forEach(m => console.log(`  ${decodeURIComponent(m)}`));
      process.exit(1);
    }
    return [match];
  }
  return unique;
}

/**
 * Stage 2: Given a make path, fetch its page and return year paths.
 * e.g. "/Toyota/" -> ["/Toyota/1982/", "/Toyota/1983/", ...]
 */
async function discoverYears(makePath) {
  const html = await fetchPage(makePath);
  if (!html) return [];

  const hrefs = extractHrefs(html);
  return hrefs
    .filter(h => !shouldSkip(h) && h.endsWith('/') && !h.startsWith('http'))
    .map(h => h.startsWith('/') ? h : makePath + h)
    .filter(h => /\/\d{4}\/$/.test(h));   // Only 4-digit year directories
}

/**
 * Stage 3: Given a make/year path, fetch its page and return variant paths.
 * Variant links on this page are absolute paths starting with /.
 * e.g. "/Toyota/2005/Camry%20L4-2.4L%20%282AZ-FE%29/"
 */
async function discoverVariants(yearPath) {
  const html = await fetchPage(yearPath);
  if (!html) return [];

  const hrefs = extractHrefs(html);
  return hrefs
    .filter(h => h.startsWith('/') && h.endsWith('/') && !shouldSkip(h))
    // Only keep paths that are deeper than the year level
    .filter(h => {
      const parts = h.split('/').filter(Boolean);
      return parts.length >= 3; // make/year/variant
    })
    // Remove breadcrumb paths (the year and make links themselves)
    .filter(h => !h.endsWith(yearPath) && h !== yearPath);
}

/**
 * Stage 4: Given a variant path, build the Repair and Diagnosis URL.
 * Returns the path or null if the variant page doesn't have that section.
 */
function repairAndDiagnosisPath(variantPath) {
  return variantPath + 'Repair%20and%20Diagnosis/';
}

/**
 * Stage 5: Recursively crawl a directory page.
 * Fetches the page, warms it, extracts relative links, and recurses
 * into sub-directories.  Leaf pages are warmed but not recursed.
 *
 * All links found on the R&D page are relative hrefs.
 * Sub-directory pages (e.g. "Alarm Module/") contain further <ul> lists.
 * Leaf pages contain images/text but no <ul> directory listing.
 */
async function crawlDirectory(basePath, html) {
  // Extract relative hrefs from this page (skip navigation/breadcrumb absolute links)
  const hrefs = extractHrefs(html)
    .filter(h => !shouldSkip(h) && !h.startsWith('/') && !h.startsWith('http') && !h.startsWith('#'));

  // Resolve to absolute paths and deduplicate
  const childPaths = [];
  for (const href of hrefs) {
    const abs = resolveHref(basePath, href);
    if (!visited.has(abs)) {
      visited.add(abs);
      childPaths.push(abs);
      discovered++;
    }
  }

  // Warm all children concurrently (bounded by semaphore)
  const results = await Promise.all(childPaths.map(async (path) => {
    const result = await warmUrl(path);
    return { path, result };
  }));

  // Recurse into sub-directories (pages that have <ul> listings)
  const recursePromises = [];
  for (const { path, result } of results) {
    if (!result || !result.html) continue;
    if (!isLeafPage(result.html)) {
      // It is a directory — recurse into it
      recursePromises.push(crawlDirectory(path, result.html));
    }
  }

  // Wait for all recursive crawls to finish
  await Promise.all(recursePromises);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const startTime = Date.now();

  console.log('='.repeat(60));
  console.log('CHARM Cache Warmer');
  console.log('='.repeat(60));
  console.log(`Worker URL : ${WORKER_URL}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Mode       : ${DRY_RUN ? 'DRY RUN (no fetching)' : 'LIVE'}`);
  if (ONLY_MAKE) console.log(`Filter     : --make ${ONLY_MAKE}`);
  console.log('='.repeat(60));
  console.log();

  // Stage 1: Discover makes
  const makes = await discoverMakes();
  console.log(`Found ${makes.length} make(s): ${makes.map(m => decodeURIComponent(m).replace(/\//g, '')).join(', ')}\n`);

  // Warm the root page itself
  if (!visited.has('/')) {
    visited.add('/');
    discovered++;
    await warmUrl('/');
  }

  // Process each make breadth-first
  for (const makePath of makes) {
    const makeName = decodeURIComponent(makePath).replace(/\//g, '');
    console.log(`\n--- ${makeName} ---`);

    // Warm the make page
    if (!visited.has(makePath)) {
      visited.add(makePath);
      discovered++;
      await warmUrl(makePath);
    }

    // Stage 2: Discover years for this make
    const yearPaths = await discoverYears(makePath);
    console.log(`  ${yearPaths.length} year(s)`);

    // Warm each year page
    for (const yearPath of yearPaths) {
      if (visited.has(yearPath)) continue;
      visited.add(yearPath);
      discovered++;
      await warmUrl(yearPath);
    }

    // Stage 3: Discover variants for each year
    // Collect all variants across all years first (breadth-first by make)
    const allVariants = [];
    for (const yearPath of yearPaths) {
      const variants = await discoverVariants(yearPath);
      for (const v of variants) {
        if (!visited.has(v)) {
          visited.add(v);
          allVariants.push(v);
          discovered++;
        }
      }
    }
    console.log(`  ${allVariants.length} variant(s)`);

    // Warm all variant pages
    await Promise.all(allVariants.map(v => warmUrl(v)));

    // Stage 4 & 5: For each variant, fetch Repair and Diagnosis, then crawl it
    let rdCount = 0;
    for (const variantPath of allVariants) {
      const rdPath = repairAndDiagnosisPath(variantPath);
      if (visited.has(rdPath)) continue;
      visited.add(rdPath);
      discovered++;

      const result = await warmUrl(rdPath);
      if (!result || !result.html) continue;

      rdCount++;

      // The R&D page is a large directory listing — crawl all its children
      await crawlDirectory(rdPath, result.html);
    }
    console.log(`  ${rdCount} Repair & Diagnosis section(s) crawled`);
  }

  // Final report
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log('CRAWL COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total pages warmed : ${stats.total}`);
  console.log(`Cache HITs         : ${stats.hits}`);
  console.log(`Cache MISSes       : ${stats.misses}`);
  console.log(`Errors             : ${stats.errors}`);
  console.log(`Unique URLs visited: ${visited.size}`);
  console.log(`Elapsed time       : ${elapsed}s`);
  console.log('='.repeat(60));

  // Exit with error code if more than 10% of requests failed
  if (stats.errors > stats.total * 0.1 && stats.total > 10) {
    console.log('\nWARNING: Error rate exceeded 10%.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
