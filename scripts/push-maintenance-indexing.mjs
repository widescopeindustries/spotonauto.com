#!/usr/bin/env node
/**
 * Push maintenance hub & spec pages through Google Indexing API.
 *
 * Usage:
 *   node scripts/push-maintenance-indexing.mjs --urls url1 url2 ...
 *   node scripts/push-maintenance-indexing.mjs --from-tools
 *   node scripts/push-maintenance-indexing.mjs --from-db
 *
 * --from-tools  : Generate URLs for every vehicle that has a tool page
 * --from-db     : Generate URLs from manual_embeddings DB (requires DB connection)
 * --urls        : Push explicit URL list
 */
import { google } from 'googleapis';
import { existsSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const KEY_PATH = join(__dirname, '..', 'credentials', 'google-service-account.json');
const BASE_URL = 'https://alloemmanuals.com';

async function getAuth() {
  if (!existsSync(KEY_PATH)) {
    throw new Error(`Service account not found at ${KEY_PATH}`);
  }
  const credentials = JSON.parse(readFileSync(KEY_PATH, 'utf8'));
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });
}

async function submitUrls(urls) {
  const auth = await getAuth();
  const indexing = google.indexing({ version: 'v3', auth });

  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      await indexing.urlNotifications.publish({
        requestBody: { url, type: 'URL_UPDATED' },
      });
      results.success++;
      process.stdout.write('.');
    } catch (err) {
      results.failed++;
      const msg = err?.response?.data?.error?.message || err.message;
      results.errors.push({ url, error: msg });
      process.stdout.write('x');
      if (msg.includes('quota') || msg.includes('429') || msg.includes('rateLimitExceeded')) {
        console.log(`\n\nQuota exhausted after ${i + 1} URLs. Resume with remaining URLs.`);
        break;
      }
    }
    if ((i + 1) % 50 === 0) console.log(` [${i + 1}/${urls.length}]`);
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n\nDone: ${results.success} succeeded, ${results.failed} failed.`);
  if (results.errors.length > 0 && results.errors.length <= 10) {
    for (const e of results.errors) console.log(`  ERR ${e.url}: ${e.error}`);
  }
  return results;
}

// ── URL generators ──────────────────────────────────────────────────

async function urlsFromTools() {
  // Dynamic import so we can use the project's vehicle data
  const { TOOL_PAGES } = await import('../src/data/tools-pages.ts');
  const urls = new Set();
  for (const page of TOOL_PAGES) {
    const makeSlug = page.make.toLowerCase().replace(/\s+/g, '-');
    const modelSlug = page.model.toLowerCase().replace(/\s+/g, '-');
    const year = page.generations[0]?.years?.split('-')[0] || '2020';
    urls.add(`${BASE_URL}/maintenance/${year}/${makeSlug}/${modelSlug}`);
    urls.add(`${BASE_URL}/maintenance/${year}/${makeSlug}/${modelSlug}/oil-type`);
    urls.add(`${BASE_URL}/maintenance/${year}/${makeSlug}/${modelSlug}/tire-size`);
    urls.add(`${BASE_URL}/maintenance/${year}/${makeSlug}/${modelSlug}/coolant-type`);
  }
  return [...urls];
}

async function urlsFromDb() {
  const pg = await import('pg');
  const { Pool } = pg.default || pg;
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.LOCAL_DATABASE_URL ||
    'postgresql://spotonauto:pnjkD6ip8hRXsLEj9A087u71@127.0.0.1:5432/spotonauto';
  const pool = new Pool({ connectionString, connectionTimeoutMillis: 10000 });

  const { rows } = await pool.query(`
    SELECT DISTINCT make, year, model
    FROM manual_embeddings
    ORDER BY make, year, model
  `);
  await pool.end();

  const urls = [];
  for (const row of rows) {
    const makeSlug = row.make.toLowerCase().trim().replace(/\s+/g, '-');
    const modelSlug = row.model.toLowerCase().trim().replace(/\s+/g, '-');
    const year = Number(row.year);
    urls.push(`${BASE_URL}/maintenance/${year}/${makeSlug}/${modelSlug}`);
    urls.push(`${BASE_URL}/maintenance/${year}/${makeSlug}/${modelSlug}/oil-type`);
    urls.push(`${BASE_URL}/maintenance/${year}/${makeSlug}/${modelSlug}/tire-size`);
    urls.push(`${BASE_URL}/maintenance/${year}/${makeSlug}/${modelSlug}/coolant-type`);
  }
  return urls;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    console.log(`Usage:
  node scripts/push-maintenance-indexing.mjs --urls <url1> <url2> ...
  node scripts/push-maintenance-indexing.mjs --from-tools
  node scripts/push-maintenance-indexing.mjs --from-db
`);
    process.exit(0);
  }

  let urls = [];

  if (args.includes('--urls')) {
    const idx = args.indexOf('--urls');
    urls = args.slice(idx + 1).filter((u) => u.startsWith('http'));
  } else if (args.includes('--from-tools')) {
    console.log('Generating URLs from tool pages...');
    urls = await urlsFromTools();
  } else if (args.includes('--from-db')) {
    console.log('Generating URLs from DB...');
    urls = await urlsFromDb();
  }

  if (urls.length === 0) {
    console.log('No URLs to push.');
    process.exit(0);
  }

  // Google Indexing API quota: ~200/day
  const DAILY_LIMIT = 200;
  const toPush = urls.slice(0, DAILY_LIMIT);

  console.log(`Prepared ${urls.length} maintenance URLs (capped to ${DAILY_LIMIT}/day).`);
  console.log(`Pushing ${toPush.length} URLs...\n`);

  await submitUrls(toPush);

  if (urls.length > DAILY_LIMIT) {
    console.log(`\n${urls.length - DAILY_LIMIT} URLs remaining. Run again tomorrow.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
