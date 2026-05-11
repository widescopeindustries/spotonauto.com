#!/usr/bin/env node
/**
 * mine-labor.mjs — Pure corpus extractor for LEMON/CHARM Labor Times.
 *
 * Crawls /Parts and Labor/ tree and extracts operation tables.
 * Output: RAW labor time rows with Standard/Warranty hours and skill levels.
 */

import fs from 'fs';
import path from 'path';
import { fetchPage, encodePath, discoverModels, runBatch, parseTable } from './lib/lmdb-client.mjs';

const OUTPUT_DIR = process.argv.includes('--output')
  ? process.argv[process.argv.indexOf('--output') + 1]
  : '/data/mined/labor';

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { vehicles: [] };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--make') result.make = args[++i];
    else if (args[i] === '--year') result.year = parseInt(args[++i]);
    else if (args[i] === '--years') {
      const [start, end] = args[++i].split('-').map(Number);
      result.yearRange = { start, end };
    }
    else if (args[i] === '--model') result.model = args[++i];
    else if (args[i] === '--batch') result.batchPath = args[++i];
    else if (args[i] === '--output') result.output = args[++i];
    else if (args[i] === '--concurrency') result.concurrency = parseInt(args[++i], 10);
  }
  result.concurrency = result.concurrency || 8;
  return result;
}

function slugifyModel(model) {
  return model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 40);
}

async function crawlLaborTree(make, year, model, basePath) {
  const html = await fetchPage(basePath);
  if (!html) return [];

  const entries = [];

  // Look for operation tables on this page
  const tables = extractAllTables(html);
  for (const table of tables) {
    for (const row of table.rows) {
      const operation = row['Operation'] || row['OPERATION'] || row['operation'] || row['Description'] || row['description'] || '';
      const standard = row['Standard Hours'] || row['STANDARD HOURS'] || row['Standard'] || row['standard'] || '';
      const warranty = row['Warranty Hours'] || row['WARRANTY HOURS'] || row['Warranty'] || row['warranty'] || '';
      const skill = row['Skill Level'] || row['SKILL LEVEL'] || row['Skill'] || row['skill'] || '';
      const notes = row['Notes'] || row['NOTE'] || row['notes'] || '';

      if (operation && (standard || warranty)) {
        entries.push({
          operation,
          standardHours: standard,
          warrantyHours: warranty,
          skillLevel: skill,
          notes,
        });
      }
    }
  }

  // Recurse into sub-links
  const linkRegex = /<a\s+href=["'](\/[^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  let m;
  const subPaths = [];
  while ((m = linkRegex.exec(html)) !== null) {
    const href = m[1];
    const text = m[2].trim();
    if (href.includes('Parts%20and%20Labor') || href.includes('Parts and Labor')) {
      if (href !== basePath && !href.toLowerCase().includes('download') && !href.toLowerCase().includes('.zip')) {
        subPaths.push(href);
      }
    }
  }

  for (const subPath of subPaths) {
    const subEntries = await crawlLaborTree(make, year, model, subPath);
    entries.push(...subEntries);
  }

  return entries;
}

function extractAllTables(html) {
  const tables = [];
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tm;
  while ((tm = tableRegex.exec(html)) !== null) {
    const rows = parseTable('<table>' + tm[1] + '</table>');
    if (rows.length > 0) tables.push({ rows });
  }
  return tables;
}

async function mineVehicle(make, year, model) {
  const laborPath = '/' + encodePath(make) + '/' + year + '/' + encodePath(model) + '/Parts%20and%20Labor/';
  const entries = await crawlLaborTree(make, year, model, laborPath);

  if (entries.length === 0) {
    return { make, year, model, found: false, operations: [], sourcePath: laborPath };
  }

  return {
    make,
    year,
    model,
    found: true,
    operations: entries,
    sourcePath: laborPath,
    minedAt: new Date().toISOString(),
  };
}

async function main() {
  const args = parseArgs();
  let vehicles = [];

  if (args.batchPath && fs.existsSync(args.batchPath)) {
    const batch = JSON.parse(fs.readFileSync(args.batchPath, 'utf8'));
    vehicles = batch.map(v => ({ make: v.make, year: v.year, model: v.model }));
    console.log('Loaded ' + vehicles.length + ' vehicles from batch file');
  }
  else if (args.make && args.model && args.year) {
    vehicles = [{ make: args.make, year: args.year, model: args.model }];
  }
  else if (args.make && args.yearRange) {
    const { start, end } = args.yearRange;
    console.log('Discovering models for ' + args.make + ' (' + start + '-' + end + ')...');
    for (let y = start; y <= end; y++) {
      const models = await discoverModels(args.make, y);
      console.log('  ' + y + ': ' + models.length + ' models');
      for (const m of models) vehicles.push({ make: args.make, year: y, model: m.name });
    }
  }
  else if (args.make && args.year) {
    const models = await discoverModels(args.make, args.year);
    vehicles = models.map(m => ({ make: args.make, year: args.year, model: m.name }));
  }
  else {
    console.log('Usage: node mine-labor.mjs --make Toyota --years 2015-2024');
    process.exit(1);
  }

  console.log('\nMining labor times for ' + vehicles.length + ' vehicles...');
  let found = 0, missed = 0;
  const startTime = Date.now();

  await runBatch(vehicles, args.concurrency, async (v, i) => {
    const result = await mineVehicle(v.make, v.year, v.model);
    const outFile = path.join(OUTPUT_DIR, v.make.toLowerCase() + '-' + v.year + '-' + slugifyModel(v.model) + '.json');
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
    if (result.found) found++; else missed++;
    if (i % 10 === 0) {
      process.stdout.write('\r  ' + (i + 1) + '/' + vehicles.length + ' found:' + found + ' missed:' + missed);
    }
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n\nDone in ' + elapsed + 's | found:' + found + ' missed:' + missed);
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
