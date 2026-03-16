#!/usr/bin/env npx tsx
/**
 * index-lmdb-vectors.ts
 *
 * Crawls the LMDB-backed factory manual archive at data.spotonauto.com,
 * extracts text from each Repair & Diagnosis section page, generates
 * vector embeddings via Gemini text-embedding-004, and upserts them
 * into the configured manual_embeddings backend.
 *
 * Usage:
 *   node --experimental-strip-types scripts/index-lmdb-vectors.ts                      # Index all makes
 *   node --experimental-strip-types scripts/index-lmdb-vectors.ts --make Toyota         # Index one make
 *   node --experimental-strip-types scripts/index-lmdb-vectors.ts --make Toyota --year 2010  # One make+year
 *   node --experimental-strip-types scripts/index-lmdb-vectors.ts --dry-run             # Preview without writing
 *
 * Requirements:
 *   - .env.local must contain GEMINI_API_KEY and either:
 *     - VPS_DATABASE_URL (preferred), or
 *     - NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   - The manual_embeddings table must exist (run the SQL migration first)
 *   - data.spotonauto.com must be reachable
 *
 * Features:
 *   - Incremental: skips paths already in the database
 *   - Rate-limited: respects Gemini embedding API limits (~1500 req/min)
 *   - Resumable: can be stopped and restarted safely
 *   - Progress logging with per-variant summaries
 */

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  getIndexedPaths,
  getManualEmbeddingsBackend,
  testManualEmbeddingsConnection,
  upsertManualEmbedding,
} from '../src/lib/manualEmbeddingsStore.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Load environment variables from .env.local ─────────────────────────────

function loadEnv(): void {
  // Try multiple possible locations for .env.local
  const candidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(__dirname, '..', '.env.local'),
    path.resolve(__dirname, '.env.local'),
  ];
  const envPath = candidates.find(p => fs.existsSync(p));
  if (!envPath) {
    console.error('ERROR: .env.local not found. Tried:', candidates.join(', '));
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

// ─── Configuration ───────────────────────────────────────────────────────────

const CHARM_BASE = 'https://data.spotonauto.com';
const EMBEDDING_MODEL = 'gemini-embedding-001';
const MAX_CONTENT_LENGTH = 8000;     // Max chars of content to store per section
const CONTENT_PREVIEW_LENGTH = 500;  // Chars for content_preview column
const MAX_SECTION_DEPTH = 2;         // How deep to crawl into sub-sections
const EMBEDDING_DELAY_MS = 45;       // ~1300 req/min, well under 1500 limit
const FETCH_DELAY_MS = 100;          // Politeness delay between HTTP fetches
const FETCH_TIMEOUT_MS = 15000;      // Timeout for HTTP requests
const MAX_SECTIONS_PER_VARIANT = 50; // Cap sections per vehicle variant

// CLI args
const args = process.argv.slice(2);
const filterMake = getArg('--make');
const filterYear = getArg('--year');
const dryRun = args.includes('--dry-run');

function getArg(flag: string): string | null {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

// ─── Initialize clients ─────────────────────────────────────────────────────

const geminiApiKey = process.env.GEMINI_API_KEY;
const embeddingsBackend = getManualEmbeddingsBackend();

if (!geminiApiKey || embeddingsBackend === 'none') {
  console.error('ERROR: Missing required env vars. Need GEMINI_API_KEY and a manual embeddings backend (VPS_DATABASE_URL preferred).');
  process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

// ─── Stats tracking ─────────────────────────────────────────────────────────

const stats = {
  totalIndexed: 0,
  totalSkipped: 0,
  totalErrors: 0,
  totalVariants: 0,
  startTime: Date.now(),
};

// ─── Utility Functions ──────────────────────────────────────────────────────

const fetchOpts = {
  headers: { 'User-Agent': 'SpotOnAuto-Indexer/1.0 (+https://spotonauto.com)' },
};

async function fetchPage(urlPath: string): Promise<string | null> {
  const url = urlPath.startsWith('http') ? urlPath : `${CHARM_BASE}${urlPath}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const resp = await fetch(url, { ...fetchOpts, signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    return await resp.text();
  } catch (error) {
    return null;
  }
}

function extractLinks(html: string): string[] {
  const results: string[] = [];
  const re = /href=['"]([^'"]+\/)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    results.push(m[1]);
  }
  return results;
}

function sanitizeManualArchiveText(text: string): string {
  return text
    .replace(/Operation\s+CHARM/gi, '')
    .replace(/charm\.li/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();
}

function extractText(html: string, baseUrl: string = ''): string {
  const htmlWithImages = html.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, (_match, src) => {
    const absoluteSrc = baseUrl && !src.startsWith('http')
      ? new URL(src, baseUrl).href
      : src;
    return ` [IMAGE: ${absoluteSrc}] `;
  });

  return sanitizeManualArchiveText(
    htmlWithImages
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract directory-style links from an HTML index page.
 * Filters out parent navigation links and returns only child paths.
 */
function getChildLinks(html: string, currentPath: string): string[] {
  const links = extractLinks(html);
  // Only keep links that are children of the current path
  return links.filter(link => {
    // Absolute path that starts with current path and goes one level deeper
    if (link.startsWith(currentPath) && link !== currentPath) {
      const remainder = link.slice(currentPath.length);
      // Should be a single segment (possibly with trailing /)
      const segments = remainder.split('/').filter(Boolean);
      return segments.length === 1;
    }
    // Relative link (just a segment name with trailing /)
    if (!link.startsWith('/') && !link.startsWith('http') && link.endsWith('/')) {
      const segments = link.split('/').filter(Boolean);
      return segments.length === 1;
    }
    return false;
  }).map(link => {
    // Normalize to absolute path
    if (link.startsWith('/')) return link;
    return `${currentPath}${link}`;
  });
}

/**
 * Parse a variant path segment to extract the model name.
 * e.g., "Camry%20LE%20(2AZ-FE)" -> "Camry LE (2AZ-FE)"
 */
function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment).replace(/\/$/, '');
  } catch {
    return segment.replace(/\/$/, '');
  }
}

/**
 * Extract the last meaningful segment from a path as the section title.
 */
function extractSectionTitle(path: string): string {
  const segments = path.split('/').filter(Boolean);
  return decodeSegment(segments[segments.length - 1] || 'Unknown');
}

// ─── Embedding Generation ────────────────────────────────────────────────────

async function generateEmbedding(text: string): Promise<number[] | null> {
  // Truncate very long content for embedding (model has token limits)
  const truncated = text.slice(0, 4000);
  try {
    const response = await genAI.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: truncated,
      config: {
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 768,
      },
    });

    const embedding = response.embeddings?.[0]?.values;
    if (!embedding || embedding.length !== 768) {
      console.warn(`  [WARN] Unexpected embedding dimensions: ${embedding?.length}`);
      return null;
    }

    return embedding;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    // Handle rate limiting with exponential backoff
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      console.warn('  [RATE LIMIT] Backing off 60s...');
      await sleep(60000);
      return generateEmbedding(text); // Retry once
    }
    console.error(`  [ERROR] Embedding failed: ${msg}`);
    return null;
  }
}

// ─── Database Operations ─────────────────────────────────────────────────────

/**
 * Check which paths are already indexed to support incremental runs.
 */
async function upsertSection(section: {
  path: string;
  make: string;
  year: number;
  model: string;
  sectionTitle: string;
  contentPreview: string;
  contentFull: string;
  embedding: number[];
}): Promise<boolean> {
  if (dryRun) {
    console.log(`  [DRY RUN] Would upsert: ${section.path}`);
    return true;
  }

  try {
    await upsertManualEmbedding(section);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`  [ERROR] Upsert failed for ${section.path}: ${msg}`);
    return false;
  }

  return true;
}

// ─── Crawling Logic ──────────────────────────────────────────────────────────

/**
 * Recursively crawl Repair & Diagnosis sections, fetching content and
 * generating embeddings for leaf pages.
 */
async function crawlSections(
  basePath: string,
  make: string,
  year: number,
  model: string,
  indexedPaths: Set<string>,
  depth: number = 0
): Promise<number> {
  if (depth > MAX_SECTION_DEPTH) return 0;

  let indexed = 0;

  await sleep(FETCH_DELAY_MS);
  const html = await fetchPage(basePath);
  if (!html) return 0;

  const childLinks = getChildLinks(html, basePath);

  // If this is a leaf page (no child directories) or at max depth, index it
  if (childLinks.length === 0 || depth === MAX_SECTION_DEPTH) {
    // This page has content worth indexing
    const text = extractText(html, `${CHARM_BASE}${basePath}`);
    if (text.length < 50) return 0; // Skip near-empty pages

    const normalizedPath = basePath.replace(/\/+$/, '');

    if (indexedPaths.has(normalizedPath)) {
      stats.totalSkipped++;
      return 0;
    }

    // Generate embedding
    await sleep(EMBEDDING_DELAY_MS);
    const embedding = await generateEmbedding(text);
    if (!embedding) {
      stats.totalErrors++;
      return 0;
    }

    // Upsert into database
    const success = await upsertSection({
      path: normalizedPath,
      make,
      year,
      model,
      sectionTitle: extractSectionTitle(basePath),
      contentPreview: text.slice(0, CONTENT_PREVIEW_LENGTH),
      contentFull: text.slice(0, MAX_CONTENT_LENGTH),
      embedding,
    });

    if (success) {
      stats.totalIndexed++;
      indexed++;
    } else {
      stats.totalErrors++;
    }

    return indexed;
  }

  // Recurse into child sections (cap total per variant)
  const cappedLinks = childLinks.slice(0, MAX_SECTIONS_PER_VARIANT);
  for (const link of cappedLinks) {
    if (stats.totalIndexed + indexed >= MAX_SECTIONS_PER_VARIANT * stats.totalVariants + MAX_SECTIONS_PER_VARIANT) {
      break; // Safety cap
    }
    const subCount = await crawlSections(link, make, year, model, indexedPaths, depth + 1);
    indexed += subCount;
  }

  return indexed;
}

/**
 * Process a single vehicle variant (e.g., Toyota/2010/Camry LE).
 */
async function processVariant(
  make: string,
  year: number,
  variantPath: string,
  indexedPaths: Set<string>
): Promise<void> {
  const variantSegment = variantPath.split('/').filter(Boolean).pop() || '';
  const model = decodeSegment(variantSegment);

  // Look for the "Repair and Diagnosis" section
  const rdPath = `${variantPath}Repair%20and%20Diagnosis/`;
  const rdHtml = await fetchPage(rdPath);

  if (!rdHtml) {
    // Try alternate path patterns
    const altPath = `${variantPath}Repair%20And%20Diagnosis/`;
    const altHtml = await fetchPage(altPath);
    if (!altHtml) {
      return; // No repair section for this variant
    }
    // Use alt path
    const count = await crawlSections(altPath, make, year, model, indexedPaths, 0);
    if (count > 0) {
      console.log(`  Indexed ${make}/${year}/${model}: ${count} sections`);
    }
    stats.totalVariants++;
    return;
  }

  const count = await crawlSections(rdPath, make, year, model, indexedPaths, 0);
  if (count > 0) {
    console.log(`  Indexed ${make}/${year}/${model}: ${count} sections`);
  }
  stats.totalVariants++;
}

/**
 * Process all variants for a make+year combination.
 */
async function processYear(make: string, year: number): Promise<void> {
  console.log(`\n--- ${make} ${year} ---`);

  // Get already-indexed paths to support incremental runs
  const indexedPaths = await getIndexedPaths(make, year);
  if (indexedPaths.size > 0) {
    console.log(`  (${indexedPaths.size} sections already indexed)`);
  }

  // Fetch the year page to get variant links
  const yearPath = `/${encodeURIComponent(make)}/${year}/`;
  const yearHtml = await fetchPage(yearPath);
  if (!yearHtml) {
    console.warn(`  [SKIP] Year page not found: ${make}/${year}`);
    return;
  }

  // Extract variant links — CHARM returns relative hrefs (e.g., "Camry%20L4-2.5L/")
  const allLinks = extractLinks(yearHtml);
  const variantLinks: string[] = [];

  for (const link of allLinks) {
    if (link.startsWith('/')) {
      // Absolute link — check if it's a variant (3 segments: /Make/Year/Variant/)
      const segments = link.split('/').filter(Boolean);
      if (segments.length === 3) {
        variantLinks.push(link);
      }
    } else if (!link.startsWith('http') && link.endsWith('/')) {
      // Relative link (e.g., "Camry%20L4-2.5L%20%282AR-FE%29/") — convert to absolute
      // Skip nav links like style.css, breadcrumb links starting with /
      const segments = link.split('/').filter(Boolean);
      if (segments.length === 1) {
        variantLinks.push(`${yearPath}${link}`);
      }
    }
  }

  if (variantLinks.length === 0) {
    console.warn(`  [SKIP] No variants found for ${make}/${year}`);
    return;
  }

  console.log(`  Found ${variantLinks.length} variant(s)`);
  for (const variantLink of variantLinks) {
    await processVariant(make, year, variantLink, indexedPaths);
  }
}

/**
 * Process all years for a given make.
 */
async function processMake(make: string): Promise<void> {
  console.log(`\n=== Processing: ${make} ===`);

  const makePath = `/${encodeURIComponent(make)}/`;
  const makeHtml = await fetchPage(makePath);
  if (!makeHtml) {
    console.warn(`[SKIP] Make page not found: ${make}`);
    return;
  }

  // Extract year links — they should be 4-digit numbers
  const links = extractLinks(makeHtml);
  const yearLinks = links
    .map(l => {
      const segments = l.split('/').filter(Boolean);
      const lastSeg = segments[segments.length - 1];
      const yearNum = parseInt(lastSeg, 10);
      return { link: l, year: yearNum };
    })
    .filter(({ year }) => !isNaN(year) && year >= 1982 && year <= 2013)
    .sort((a, b) => a.year - b.year);

  if (yearLinks.length === 0) {
    console.warn(`[SKIP] No valid years found for ${make}`);
    return;
  }

  // Apply year filter if specified
  const filteredYears = filterYear
    ? yearLinks.filter(y => y.year === parseInt(filterYear, 10))
    : yearLinks;

  console.log(`  Found ${filteredYears.length} year(s) to index`);

  for (const { year } of filteredYears) {
    await processYear(make, year);
  }
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  SpotOnAuto LMDB Vector Indexer                    ║');
  console.log('║  Embedding model: text-embedding-004 (768 dims)    ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  if (dryRun) console.log('[DRY RUN MODE] No data will be written to the embeddings store.\n');
  if (filterMake) console.log(`Filtering to make: ${filterMake}`);
  if (filterYear) console.log(`Filtering to year: ${filterYear}`);
  console.log(`Embeddings backend: ${embeddingsBackend}\n`);

  const health = await testManualEmbeddingsConnection();
  if (!health.ok) {
    console.error(`ERROR: Cannot connect to the ${health.backend} embeddings backend.`);
    console.error('  Make sure the manual_embeddings table exists and the backend is reachable.');
    console.error(`  Error: ${health.error}`);
    process.exit(1);
  }

  console.log(`Embeddings backend verified. Indexed sections: ${health.totalSections ?? 'unknown'}\n`);

  if (filterMake) {
    // Index a single make
    await processMake(filterMake);
  } else {
    // Discover all makes from the root page
    console.log('Fetching make list from root page...');
    const rootHtml = await fetchPage('/');
    if (!rootHtml) {
      console.error('ERROR: Cannot fetch root page from data.spotonauto.com');
      process.exit(1);
    }

    const rootLinks = extractLinks(rootHtml);
    const makes = rootLinks
      .filter(l => {
        const segments = l.split('/').filter(Boolean);
        // Top-level make links: single segment, not a file, not a dot-path
        return segments.length === 1 && !segments[0].includes('.') && !segments[0].startsWith('_');
      })
      .map(l => decodeSegment(l.split('/').filter(Boolean)[0]))
      .sort();

    if (makes.length === 0) {
      console.error('ERROR: No makes found on root page');
      process.exit(1);
    }

    console.log(`Found ${makes.length} makes: ${makes.join(', ')}\n`);

    for (const make of makes) {
      await processMake(make);
    }
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  Indexing Complete                                  ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Sections indexed:  ${String(stats.totalIndexed).padStart(6)}                         ║`);
  console.log(`║  Sections skipped:  ${String(stats.totalSkipped).padStart(6)}  (already in DB)        ║`);
  console.log(`║  Errors:            ${String(stats.totalErrors).padStart(6)}                         ║`);
  console.log(`║  Variants processed:${String(stats.totalVariants).padStart(6)}                         ║`);
  console.log(`║  Time elapsed:      ${elapsed.padStart(6)} min                     ║`);
  console.log('╚══════════════════════════════════════════════════════╝');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
