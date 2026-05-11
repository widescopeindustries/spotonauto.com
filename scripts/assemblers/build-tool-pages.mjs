#!/usr/bin/env node
/**
 * build-tool-pages.mjs — Assemble corpus-mined fluids into ToolPage structures.
 *
 * Reads /data/mined/fluids/*.json and the LEMON index to get clean model names.
 * Outputs structured ToolPage JSON ready for ingestion into the Next.js app.
 */

import fs from 'fs';
import path from 'path';

const FLUIDS_DIR = process.env.FLUIDS_DIR || '/data/mined/fluids';
const INDEX_PATH = process.env.INDEX_PATH || '/data/lemon-manuals/lemon/index.json';
const OUTPUT_PATH = process.env.OUTPUT_PATH || '/data/assembled/corpus-tool-pages.json';

if (!fs.existsSync(path.dirname(OUTPUT_PATH))) {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
}

// ─── Load LEMON index for clean model names ─────────────────────────
console.log('Loading LEMON index...');
const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
const uriToClean = new Map();
for (const v of index.vehicles) {
  uriToClean.set(v.uriPath, { make: v.make, model: v.model, engine: v.engine, year: v.years[0] });
}
console.log('Index loaded:', uriToClean.size, 'vehicles');

// ─── Helpers ────────────────────────────────────────────────────────
function encodePath(s) {
  return encodeURIComponent(s).replace(/%2C/g, ',').replace(/%20/g, '%20');
}

function getCleanModel(make, year, fullModel) {
  const encoded = encodePath(fullModel);
  const uriPath = `/${encodePath(make)}/${year}/${encoded}/`;
  const entry = uriToClean.get(uriPath);
  if (entry) return entry.model;
  // Fallback heuristic
  let name = fullModel.split(',')[0].trim();
  const trims = ['LE', 'SE', 'XLE', 'LX', 'EX', 'DX', 'L', 'S', 'SV', 'SL', 'SR', 'SR5', 'Platinum', 'Limited', 'Lariat', 'LT', 'LS', 'LTZ', 'WT', 'High Country', 'RST', 'XLT', 'Sport', 'Touring', 'Premium', 'Base', 'Ultimate', 'SEL', 'Titanium', 'TRD Pro', 'TRD Off-Road', 'TRD Sport', 'TRD', 'Trail', 'Nightshade', 'Adventure', 'Woodland', 'Wilderness', 'Onyx Edition', 'Calligraphy', 'N Line', 'Type R', 'Si', 'Type S', 'GS', 'GT', 'GTI', 'GLI', 'R-Line', 'Wolfsburg', 'Autobahn', 'S-Line', 'M Sport', 'Competition', 'xDrive', 'sDrive', '4Matic', 'Quattro'];
  const sortedTrims = [...trims].sort((a, b) => b.length - a.length);
  let changed = true;
  while (changed) {
    changed = false;
    for (const trim of sortedTrims) {
      const re = new RegExp('\\s+' + trim.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '$', 'i');
      if (re.test(name)) {
        name = name.replace(re, '').trim();
        changed = true;
        break;
      }
    }
  }
  return name || fullModel;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getToolLabel(toolType) {
  const labels = {
    'oil-type': 'Oil Type & Capacity',
    'coolant-type': 'Coolant Type & Capacity',
    'transmission-fluid-type': 'Transmission Fluid Type & Capacity',
    'brake-fluid-type': 'Brake Fluid Type',
    'fluid-capacity': 'Fluid Capacities',
  };
  return labels[toolType] || toolType;
}

function getFluidTypeFilter(toolType) {
  const filters = {
    'oil-type': f => f.fluidType.toLowerCase().includes('engine oil'),
    'coolant-type': f => f.fluidType.toLowerCase().includes('coolant') || f.fluidType.toLowerCase().includes('antifreeze'),
    'transmission-fluid-type': f => f.fluidType.toLowerCase().includes('transmission') || f.fluidType.toLowerCase().includes('transaxle'),
    'brake-fluid-type': f => f.fluidType.toLowerCase().includes('brake fluid'),
    'fluid-capacity': () => true,
  };
  return filters[toolType] || (() => false);
}

function formatFluidRow(f) {
  const parts = [];
  if (f.standard && f.standard !== 'N/A') parts.push(f.standard);
  if (f.metric && f.metric !== 'N/A') parts.push('(' + f.metric + ')');
  if (f.spec) parts.push('— ' + f.spec);
  if (f.note) parts.push('Note: ' + f.note);
  return parts.join(' ');
}

function buildQuickAnswer(generations, toolType) {
  const newest = generations[0];
  if (!newest) return '';
  const entries = Object.entries(newest.specs);
  if (entries.length === 0) return '';
  const main = entries.find(([k]) => k.includes('Capacity')) || entries[0];
  const model = newest._model || '';
  const make = newest._make || '';
  const years = newest.years;
  if (toolType === 'oil-type') {
    return `${years} ${make} ${model} uses ${main[1]}.`;
  }
  if (toolType === 'coolant-type') {
    return `${years} ${make} ${model} coolant: ${main[1]}.`;
  }
  if (toolType === 'transmission-fluid-type') {
    return `${years} ${make} ${model} ATF: ${main[1]}.`;
  }
  return `${years} ${make} ${model}: ${main[1]}`;
}

function buildFAQ(make, model, toolType, generations) {
  const faq = [];
  const newest = generations[0];
  if (!newest) return faq;
  const specs = newest.specs;

  if (toolType === 'oil-type') {
    const oilSpec = Object.entries(specs).find(([k]) => k.toLowerCase().includes('spec'));
    const capacity = Object.entries(specs).find(([k]) => k.toLowerCase().includes('capacity'));
    if (oilSpec) {
      faq.push({ q: `What oil type does the ${make} ${model} use?`, a: `${newest.years} ${make} ${model} models use ${oilSpec[1]} per the factory service manual.` });
    }
    if (capacity) {
      faq.push({ q: `How much oil does a ${make} ${model} take?`, a: `${capacity[1]} — exact capacity from the LEMON factory manual fluids table.` });
    }
  }
  if (toolType === 'coolant-type') {
    const coolantSpec = Object.entries(specs).find(([k]) => k.toLowerCase().includes('spec'));
    const capacity = Object.entries(specs).find(([k]) => k.toLowerCase().includes('capacity'));
    if (coolantSpec) {
      faq.push({ q: `What coolant does the ${make} ${model} use?`, a: `${newest.years} ${make} ${model} requires ${coolantSpec[1]} per the factory manual.` });
    }
    if (capacity) {
      faq.push({ q: `How much coolant does a ${make} ${model} hold?`, a: `${capacity[1]} — total system capacity from the factory manual.` });
    }
  }
  if (toolType === 'transmission-fluid-type') {
    const atfSpec = Object.entries(specs).find(([k]) => k.toLowerCase().includes('spec'));
    const capacity = Object.entries(specs).find(([k]) => k.toLowerCase().includes('capacity'));
    if (atfSpec) {
      faq.push({ q: `What transmission fluid does the ${make} ${model} use?`, a: `${newest.years} ${make} ${model} uses ${atfSpec[1]} per the factory service manual.` });
    }
    if (capacity) {
      faq.push({ q: `How much transmission fluid does a ${make} ${model} take?`, a: `${capacity[1]} — capacity from the factory manual fluids table.` });
    }
  }
  faq.push({ q: `Where is this data from?`, a: `Extracted directly from the LEMON factory service manual archive. Sources are cited per generation.` });
  return faq;
}

// ─── Read mined fluids ──────────────────────────────────────────────
console.log('Reading mined fluids from', FLUIDS_DIR);
const files = fs.readdirSync(FLUIDS_DIR).filter(f => f.endsWith('.json'));
console.log('Found', files.length, 'fluid records');

const groups = new Map();

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(FLUIDS_DIR, file), 'utf8'));
  if (!data.found) continue;
  const cleanModel = getCleanModel(data.make, data.year, data.model);
  const key = `${data.make}|${cleanModel}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push({
    year: data.year,
    fluids: data.fluids,
    variant: data.model,
    sourcePath: data.sourcePath,
  });
}

console.log('Grouped into', groups.size, 'make/model combinations');

// ─── Build tool pages ───────────────────────────────────────────────
const allToolPages = [];

for (const [groupKey, entries] of groups) {
  const [make, cleanModel] = groupKey.split('|');

  const byYear = new Map();
  for (const e of entries) {
    if (!byYear.has(e.year)) byYear.set(e.year, []);
    byYear.get(e.year).push(e);
  }

  const toolTypes = ['oil-type', 'coolant-type', 'transmission-fluid-type', 'brake-fluid-type', 'fluid-capacity'];

  for (const toolType of toolTypes) {
    const filterFn = getFluidTypeFilter(toolType);
    const yearSpecs = new Map();

    for (const [year, yearEntries] of byYear) {
      const allFluids = yearEntries.flatMap(e => e.fluids);
      const matched = allFluids.filter(filterFn);
      if (matched.length === 0) continue;

      const specs = {};
      const notes = [];
      const sources = new Set();

      for (const f of matched) {
        const key = f.application
          ? `${f.fluidType} (${f.application})`
          : f.fluidType;
        const val = formatFluidRow(f);
        specs[key] = val;
        if (f.note && !notes.includes(f.note)) notes.push(f.note);
      }

      for (const e of yearEntries) {
        if (e.sourcePath) sources.add(e.sourcePath);
      }

      yearSpecs.set(year, { specs, notes, sources: [...sources] });
    }

    if (yearSpecs.size === 0) continue;

    // Merge consecutive years with identical specs
    const sortedYears = [...yearSpecs.keys()].sort((a, b) => a - b);
    const generations = [];
    let currentStart = sortedYears[0];
    let currentEnd = sortedYears[0];
    let currentData = yearSpecs.get(currentStart);

    function specHash(data) {
      return JSON.stringify(data.specs);
    }

    for (let i = 1; i < sortedYears.length; i++) {
      const y = sortedYears[i];
      const data = yearSpecs.get(y);
      if (specHash(data) === specHash(currentData)) {
        currentEnd = y;
      } else {
        generations.push({
          name: `${currentStart}${currentEnd !== currentStart ? '-' + currentEnd : ''}`,
          years: currentStart === currentEnd ? String(currentStart) : `${currentStart}-${currentEnd}`,
          specs: currentData.specs,
          notes: currentData.notes,
          _sources: currentData.sources,
        });
        currentStart = y;
        currentEnd = y;
        currentData = data;
      }
    }
    generations.push({
      name: `${currentStart}${currentEnd !== currentStart ? '-' + currentEnd : ''}`,
      years: currentStart === currentEnd ? String(currentStart) : `${currentStart}-${currentEnd}`,
      specs: currentData.specs,
      notes: currentData.notes,
      _sources: currentData.sources,
    });

    generations.sort((a, b) => {
      const aStart = parseInt(a.years.split('-')[0], 10);
      const bStart = parseInt(b.years.split('-')[0], 10);
      return bStart - aStart;
    });

    for (const g of generations) {
      g._make = make;
      g._model = cleanModel;
    }

    const quickAnswer = buildQuickAnswer(generations, toolType);
    const faq = buildFAQ(make, cleanModel, toolType, generations);

    const slug = `${slugify(make)}-${slugify(cleanModel)}-${toolType}`;
    allToolPages.push({
      slug,
      make,
      model: cleanModel,
      toolType,
      title: `${make} ${cleanModel} ${getToolLabel(toolType)} | AllOEMManuals`,
      description: `Factory manual ${getToolLabel(toolType).toLowerCase()} for the ${make} ${cleanModel}. Exact capacities and specs extracted from the LEMON service manual archive.`,
      keywords: [`${make} ${cleanModel} ${toolType.replace(/-/g, ' ')}`, `${make} ${cleanModel} ${getToolLabel(toolType).toLowerCase()}`, `${slugify(cleanModel)} ${toolType.replace(/-/g, ' ')}`],
      quickAnswer,
      generations: generations.map(g => ({
        name: g.name,
        years: g.years,
        specs: g.specs,
        notes: g.notes,
      })),
      faq,
      _corpusSources: [...new Set(generations.flatMap(g => g._sources || []))],
      _minedAt: new Date().toISOString(),
    });
  }
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allToolPages, null, 2));
console.log('\nWrote', allToolPages.length, 'tool pages to', OUTPUT_PATH);

const byType = {};
for (const p of allToolPages) {
  byType[p.toolType] = (byType[p.toolType] || 0) + 1;
}
console.log('\nBy tool type:');
for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
  console.log('  ' + type + ': ' + count);
}

if (allToolPages.length > 0) {
  const sample = allToolPages.find(p => p.slug.includes('toyota-camry-oil-type')) || allToolPages[0];
  console.log('\n--- Sample page ---');
  console.log('Slug:', sample.slug);
  console.log('Title:', sample.title);
  console.log('QuickAnswer:', sample.quickAnswer);
  console.log('Generations:', sample.generations.length);
  console.log('First gen years:', sample.generations[0]?.years);
  console.log('First gen specs:', JSON.stringify(sample.generations[0]?.specs).substring(0, 200));
}
