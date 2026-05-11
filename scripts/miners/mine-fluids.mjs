#!/usr/bin/env node
/**
 * mine-fluids.mjs — Pure corpus extractor for LEMON Fluids tables.
 *
 * Outputs RAW factory manual data only. No generic templates.
 * No difficulty ratings, no tool lists, no procedural steps.
 * Just the exact rows from the Fluids page.
 *
 * Usage:
 *   node mine-fluids.mjs --make Toyota --year 2015 --model "Camry LE"
 *   node mine-fluids.mjs --make Toyota --years 2015-2024 --output /data/mined/fluids/
 *   node mine-fluids.mjs --batch vehicles.json --output /data/mined/fluids/
 */

import fs from 'fs';
import path from 'path';
import { fetchPage, encodePath, discoverModels, runBatch } from './lib/lmdb-client.mjs';

const OUTPUT_DIR = process.argv.includes('--output')
  ? process.argv[process.argv.indexOf('--output') + 1]
  : '/data/mined/fluids';

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

function parseFluidTable(html) {
  const fluids = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      const text = cellMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s{2,}/g, ' ')
        .trim();
      cells.push(text);
    }
    if (cells.length >= 6 && cells[0] && cells[0] !== 'Fluid Type' && !cells[0].startsWith('FLUID')) {
      fluids.push({
        fluidType: cells[0],
        application: cells[1] || '',
        condition: cells[2] || '',
        standard: cells[3] || '',
        metric: cells[4] || '',
        spec: cells[5] || '',
        note: cells[6] || '',
      });
    }
  }
  return fluids;
}

async function mineVehicle(make, year, model) {
  const fluidsPath = '/' + encodePath(make) + '/' + year + '/' + encodePath(model) + '/Repair%20and%20Diagnosis/Quick%20Lookups/Fluids/';
  const html = await fetchPage(fluidsPath);

  if (!html) {
    return { make, year, model, found: false, fluids: [], sourcePath: null };
  }

  const fluids = parseFluidTable(html);
  if (fluids.length === 0) {
    return { make, year, model, found: false, fluids: [], sourcePath: fluidsPath };
  }

  return {
    make,
    year,
    model,
    found: true,
    fluids,
    sourcePath: fluidsPath,
    minedAt: new Date().toISOString(),
  };
}

function slugifyModel(model) {
  return model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 40);
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
      for (const m of models) {
        vehicles.push({ make: args.make, year: y, model: m.name });
      }
    }
  }
  else if (args.make && args.year) {
    const models = await discoverModels(args.make, args.year);
    console.log('Discovered ' + models.length + ' models for ' + args.make + ' ' + args.year);
    vehicles = models.map(m => ({ make: args.make, year: args.year, model: m.name }));
  }
  else {
    console.log('Usage:');
    console.log('  node mine-fluids.mjs --make Toyota --year 2015 --model "Camry LE"');
    console.log('  node mine-fluids.mjs --make Toyota --years 2015-2024');
    console.log('  node mine-fluids.mjs --batch vehicles.json');
    process.exit(1);
  }

  console.log('\nMining fluids for ' + vehicles.length + ' vehicles...');
  console.log('Output: ' + OUTPUT_DIR);
  console.log('Concurrency: ' + args.concurrency);

  let found = 0, missed = 0;
  const startTime = Date.now();

  await runBatch(vehicles, args.concurrency, async (v, i) => {
    const result = await mineVehicle(v.make, v.year, v.model);
    const outFile = path.join(OUTPUT_DIR, v.make.toLowerCase() + '-' + v.year + '-' + slugifyModel(v.model) + '.json');
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2));

    if (result.found) {
      found++;
      if (i % 20 === 0) {
        process.stdout.write('\r  ' + (i + 1) + '/' + vehicles.length + ' | found:' + found + ' missed:' + missed + ' | ' + v.year + ' ' + v.make + ' ' + v.model.substring(0, 30));
      }
    } else {
      missed++;
    }
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n\nDone in ' + elapsed + 's');
  console.log('Found:  ' + found + ' / ' + vehicles.length);
  console.log('Missed: ' + missed + ' / ' + vehicles.length);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
