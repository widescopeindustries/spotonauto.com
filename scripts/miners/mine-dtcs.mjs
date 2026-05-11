#!/usr/bin/env node
/**
 * mine-dtcs.mjs — Pure corpus extractor for DTC codes.
 *
 * Crawls /A L L Diagnostic Trouble Codes/ tree and extracts
 * code → description mappings from P-Code Charts.
 */

import fs from 'fs';
import path from 'path';
import { fetchPage, encodePath, discoverModels, runBatch } from './lib/lmdb-client.mjs';

const OUTPUT_DIR = process.argv.includes('--output')
  ? process.argv[process.argv.indexOf('--output') + 1]
  : '/data/mined/dtcs';

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

async function discoverDtcSections(make, year, model) {
  const dtcBase = '/' + encodePath(make) + '/' + year + '/' + encodePath(model) + '/Repair%20and%20Diagnosis/A%20L%20L%20Diagnostic%20Trouble%20Codes/';
  const html = await fetchPage(dtcBase);
  if (!html) return [];

  const sections = [];
  const regex = /<a\s+href=["'](\/[^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const href = m[1];
    const text = m[2].trim();
    if (href.includes('P-Code') || href.includes('P%20Code') || href.includes('Testing')) {
      sections.push({ href, text });
    }
  }
  return sections;
}

function parseDtcList(html) {
  const dtcs = [];
  // Look for P0XXX, P1XXX, B0XXX, C0XXX, U0XXX patterns
  const regex = /\b([PBCU]\d{4})\b[^\n]*/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const code = m[1];
    const surrounding = html.substring(Math.max(0, m.index - 100), m.index + 200);
    const descMatch = surrounding.match(new RegExp(code + '\\s*[-:]?\\s*([^<\n]{5,200})'));
    const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim().substring(0, 200) : '';
    dtcs.push({ code, description });
  }
  // Deduplicate
  const seen = new Set();
  return dtcs.filter(d => { if (seen.has(d.code)) return false; seen.add(d.code); return true; });
}

async function mineVehicle(make, year, model) {
  const sections = await discoverDtcSections(make, year, model);
  if (sections.length === 0) {
    return { make, year, model, found: false, dtcs: [], sourcePath: null };
  }

  const allDtcs = [];
  const sourcePaths = [];

  for (const section of sections) {
    const html = await fetchPage(section.href);
    if (!html) continue;
    const dtcs = parseDtcList(html);
    if (dtcs.length > 0) {
      allDtcs.push(...dtcs);
      sourcePaths.push(section.href);
    }
  }

  if (allDtcs.length === 0) {
    return { make, year, model, found: false, dtcs: [], sourcePaths };
  }

  // Deduplicate across sections
  const seen = new Set();
  const uniqueDtcs = allDtcs.filter(d => { if (seen.has(d.code)) return false; seen.add(d.code); return true; });

  return {
    make,
    year,
    model,
    found: true,
    dtcs: uniqueDtcs,
    sourcePaths,
    minedAt: new Date().toISOString(),
  };
}

async function main() {
  const args = parseArgs();
  let vehicles = [];

  if (args.batchPath && fs.existsSync(args.batchPath)) {
    const batch = JSON.parse(fs.readFileSync(args.batchPath, 'utf8'));
    vehicles = batch.map(v => ({ make: v.make, year: v.year, model: v.model }));
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
    console.log('Usage: node mine-dtcs.mjs --make Toyota --years 2015-2024');
    process.exit(1);
  }

  console.log('\nMining DTCs for ' + vehicles.length + ' vehicles...');
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
