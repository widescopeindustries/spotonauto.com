#!/usr/bin/env node
/**
 * mine-torque.mjs — Pure corpus extractor for torque specs.
 *
 * Crawls /Quick Lookups/Common Specs & Procedures/Specifications Index/
 * and component-level "Torque Specifications" pages.
 */

import fs from 'fs';
import path from 'path';
import { fetchPage, encodePath, discoverModels, runBatch } from './lib/lmdb-client.mjs';

const OUTPUT_DIR = process.argv.includes('--output')
  ? process.argv[process.argv.indexOf('--output') + 1]
  : '/data/mined/torque';

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

function extractInlineTorque(html) {
  const specs = [];
  // Match patterns like: "294 N*m (2, 998 kgf*cm, 217 ft.*lbf)"
  const regex = />([^<]{3,200}?(?:N\*m|N·m|kgf\*cm|ft\.\*lbf|ft-lb|in\.\*lbf|lbf)[^<]{0,200})</gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const text = m[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (text.length > 10 && !text.includes('href=')) {
      specs.push({ component: 'inline', values: text });
    }
  }
  return specs;
}

function parseTorqueTable(html) {
  const specs = [];
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
    const joined = cells.join(' ').toLowerCase();
    if (cells.length >= 2 && (joined.includes('n*m') || joined.includes('n·m') || joined.includes('ft.lbf') || joined.includes('ft-lb') || joined.includes('lbf') || joined.includes('in.lbf'))) {
      specs.push({ component: cells[0], values: cells.slice(1).join(' | '), rawCells: cells });
    }
  }
  return specs;
}

async function discoverSpecPaths(make, year, model) {
  const basePath = '/' + encodePath(make) + '/' + year + '/' + encodePath(model) + '/Repair%20and%20Diagnosis/';
  const baseHtml = await fetchPage(basePath);
  if (!baseHtml) return [];

  const paths = [];
  // Look for Quick Lookups links
  const qlRegex = /<a\s+href=["']([^"']*Quick%20Lookups[^"']*)["'][^>]*>([^<]+)<\/a>/gi;
  let m;
  while ((m = qlRegex.exec(baseHtml)) !== null) {
    const href = m[1];
    const text = m[2].trim();
    if (text.toLowerCase().includes('spec') || text.toLowerCase().includes('torque')) {
      paths.push({ href, text });
    }
  }
  return paths;
}

async function mineVehicle(make, year, model) {
  // Try multiple spec index paths
  const specPaths = [
    '/' + encodePath(make) + '/' + year + '/' + encodePath(model) + '/Repair%20and%20Diagnosis/Quick%20Lookups/Common%20Specs%20%26%20Procedures%20%28Except%20Hybrid%29/Specifications%20Index/',
    '/' + encodePath(make) + '/' + year + '/' + encodePath(model) + '/Repair%20and%20Diagnosis/Quick%20Lookups/Common%20Specs%20%26%20Procedures/Specifications%20Index/',
    '/' + encodePath(make) + '/' + year + '/' + encodePath(model) + '/Repair%20and%20Diagnosis/Quick%20Lookups/Specifications%20Index/',
    '/' + encodePath(make) + '/' + year + '/' + encodePath(model) + '/Repair%20and%20Diagnosis/Specifications/',
  ];

  const allSpecs = [];
  let foundPath = null;

  for (const specPath of specPaths) {
    const html = await fetchPage(specPath);
    if (!html) continue;

    // Try table parsing first
    const tableSpecs = parseTorqueTable(html);
    if (tableSpecs.length > 0) {
      allSpecs.push(...tableSpecs);
      foundPath = specPath;
    }

    // Also extract inline torque values from the index page
    const inlineSpecs = extractInlineTorque(html);
    if (inlineSpecs.length > 0) {
      allSpecs.push(...inlineSpecs);
      if (!foundPath) foundPath = specPath;
    }

    // Follow links to deeper torque spec pages
    const torqueLinkRegex = /<a\s+href=["']([^"']*Torque%20Specifications[^"']*)["'][^>]*>[^<]*<\/a>/gi;
    let tl;
    while ((tl = torqueLinkRegex.exec(html)) !== null) {
      const torqueHref = tl[1];
      if (!torqueHref.startsWith('http')) continue;
      const torqueHtml = await fetchPage(torqueHref);
      if (torqueHtml) {
        const deepSpecs = parseTorqueTable(torqueHtml);
        if (deepSpecs.length > 0) {
          allSpecs.push(...deepSpecs.map(s => ({ ...s, source: torqueHref })));
        }
      }
    }
  }

  if (allSpecs.length === 0) {
    return { make, year, model, found: false, specs: [], sourcePaths: specPaths };
  }

  return {
    make,
    year,
    model,
    found: true,
    specs: allSpecs,
    sourcePath: foundPath,
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
    console.log('Usage: node mine-torque.mjs --make Toyota --years 2015-2024');
    process.exit(1);
  }

  console.log('\nMining torque specs for ' + vehicles.length + ' vehicles...');
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
