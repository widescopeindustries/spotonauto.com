import fs from 'node:fs/promises';
import path from 'node:path';
import validatedVehicles from '../src/data/validated-vehicles.json' with { type: 'json' };

const CHARM_BASE = 'https://data.spotonauto.com';
const OUTPUT_PATH = path.resolve(process.cwd(), 'src/data/wiring-coverage.json');
const YEAR_MIN = 1982;
const YEAR_MAX = 2013;
const DEFAULT_CONCURRENCY = 6;
const DEFAULT_WRITE_EVERY = 50;

const WIRING_SYSTEMS = {
  starter: {
    matchTerms: ['starter', 'starting', 'start circuit', 'crank', 'ignition switch'],
    tasks: ['starter-replacement', 'battery-replacement'],
  },
  alternator: {
    matchTerms: ['alternator', 'charging', 'generator', 'charge indicator', 'charging system'],
    tasks: ['alternator-replacement', 'battery-replacement'],
  },
  'fuel-pump': {
    matchTerms: ['fuel pump', 'fuel sender', 'fuel level', 'fuel delivery', 'fuel system'],
    tasks: ['fuel-pump-replacement'],
  },
};

const NON_ROAD_VEHICLE_PATTERN = /\b(trailer|scooter|motorcycle|motocross|enduro|atv|utv|quad|snowmobile|roadking|softail|sportster|electra\s+glide|heritage\s+classic|fat\s+boy|shadow\s+ace|gold\s+wing|vulcan|hayabusa|ninja|gsx-r|rm-z|xr\d|crf\d|dr\d|yz[f]?\d|vt\d|cbr\d|klr\d|intruder|boulevard|virago|v-star|roadstar|nighthawk|speedfight|manufacturing)\b/i;

function parseArgs(argv) {
  const args = {
    concurrency: DEFAULT_CONCURRENCY,
    limit: null,
    writeEvery: DEFAULT_WRITE_EVERY,
    resume: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--limit') args.limit = Number(argv[i + 1] || 0) || null;
    if (arg === '--concurrency') args.concurrency = Number(argv[i + 1] || 0) || DEFAULT_CONCURRENCY;
    if (arg === '--write-every') args.writeEvery = Number(argv[i + 1] || 0) || DEFAULT_WRITE_EVERY;
    if (arg === '--no-resume') args.resume = false;
  }

  return args;
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreVariantMatch(variant, model) {
  const variantNorm = normalizeText(variant);
  const modelNorm = normalizeText(model);

  if (!variantNorm || !modelNorm) return 0;
  if (variantNorm === modelNorm) return 100;
  if (variantNorm.startsWith(`${modelNorm} `)) return 95;
  if (variantNorm.includes(` ${modelNorm} `)) return 88;
  if (variantNorm.includes(modelNorm)) return 80;

  let tokenHits = 0;
  for (const token of modelNorm.split(' ')) {
    if (token.length > 1 && variantNorm.includes(token)) tokenHits += 1;
  }
  return tokenHits > 0 ? 45 + tokenHits * 10 : 0;
}

function resolveVariantForModel(variants, model) {
  let bestVariant = null;
  let bestScore = 0;

  for (const variant of variants) {
    const score = scoreVariantMatch(variant, model);
    if (score > bestScore) {
      bestScore = score;
      bestVariant = variant;
    }
  }

  return bestScore >= 60 ? bestVariant : null;
}

function buildCandidates() {
  const candidates = [];

  for (const [make, models] of Object.entries(validatedVehicles)) {
    for (const [model, entry] of Object.entries(models)) {
      if (!entry || !Array.isArray(entry.tasks) || !Array.isArray(entry.confirmedYears)) continue;
      if (NON_ROAD_VEHICLE_PATTERN.test(`${make} ${model}`.toLowerCase())) continue;

      const systems = Object.entries(WIRING_SYSTEMS)
        .filter(([, config]) => config.tasks.some((task) => entry.tasks.includes(task)))
        .map(([system]) => system);
      if (!systems.length) continue;

      const years = [...new Set(entry.confirmedYears)]
        .filter((year) => year >= YEAR_MIN && year <= YEAR_MAX)
        .sort((a, b) => b - a);

      for (const year of years) {
        candidates.push({ year, make, model, systems });
      }
    }
  }

  candidates.sort((a, b) =>
    a.make.localeCompare(b.make) ||
    a.model.localeCompare(b.model) ||
    b.year - a.year
  );

  return candidates;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'SpotOnAuto/1.0 (+https://spotonauto.com) wiring-coverage-verifier',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  return response.text();
}

function extractLinks(html) {
  return [...html.matchAll(/href=['"]([^'"]+)['"]/g)].map((match) => match[1]);
}

function decodeSegment(value) {
  try {
    return decodeURIComponent(value).replace(/\/$/, '');
  } catch {
    return String(value).replace(/\/$/, '');
  }
}

async function fetchVariants(make, year) {
  const html = await fetchText(`${CHARM_BASE}/${encodeURIComponent(make)}/${year}/`);
  return [...new Set(
    extractLinks(html)
      .filter((link) => {
        if (
          link.startsWith('/') ||
          link.startsWith('http') ||
          link.includes('.css') ||
          link.includes('.js')
        ) {
          return false;
        }
        const segments = link.split('/').filter(Boolean);
        return segments.length === 1 && link.endsWith('/');
      })
      .map((link) => decodeSegment(link.split('/').filter(Boolean)[0]))
  )].sort((a, b) => a.localeCompare(b));
}

async function fetchDiagramIndex(make, year, variant) {
  const repairUrl = `${CHARM_BASE}/${encodeURIComponent(make)}/${year}/${encodeURIComponent(variant)}/Repair%20and%20Diagnosis/`;
  const html = await fetchText(repairUrl);
  const diagramLinks = extractLinks(html).filter((link) => link.includes('Diagrams/'));
  const systems = [];

  for (const link of diagramLinks) {
    const parts = link.split('/').filter(Boolean);
    const diagramIndex = parts.findIndex((part) => decodeSegment(part) === 'Diagrams');
    if (diagramIndex === -1) continue;

    const systemParts = parts.slice(0, diagramIndex);
    const system = decodeSegment(systemParts[0] || 'General');
    const component = systemParts.length > 1
      ? systemParts.slice(1).map((segment) => decodeSegment(segment)).join(' > ')
      : '';
    const subPath = parts.slice(diagramIndex + 1).map((segment) => decodeSegment(segment)).join(' > ') || 'Diagram';
    systems.push({
      system,
      name: component ? `${component} ${subPath}` : subPath,
    });
  }

  return systems;
}

function hasSystemCoverage(indexEntries, matchTerms) {
  const normalizedTerms = matchTerms.map(normalizeText);

  return indexEntries.some((entry) => {
    const systemNorm = normalizeText(entry.system);
    const nameNorm = normalizeText(entry.name);
    return normalizedTerms.some((term) => systemNorm.includes(term) || nameNorm.includes(term));
  });
}

async function loadExisting() {
  try {
    const raw = await fs.readFile(OUTPUT_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.vehicles) ? parsed : { generatedAt: '', source: 'verified-charm', vehicles: [] };
  } catch {
    return { generatedAt: '', source: 'verified-charm', vehicles: [] };
  }
}

async function saveCoverage(vehicles) {
  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'verified-charm',
    vehicles,
  };
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

async function runPool(items, concurrency, worker) {
  let index = 0;
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await worker(current);
    }
  });
  await Promise.all(workers);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const allCandidates = buildCandidates();
  const existing = args.resume ? await loadExisting() : { generatedAt: '', source: 'verified-charm', vehicles: [] };
  const existingKeys = new Set(existing.vehicles.map((vehicle) => `${vehicle.year}:${vehicle.make}:${vehicle.model}`));
  const variantsCache = new Map();
  const indexCache = new Map();
  const verifiedVehicles = [...existing.vehicles];

  const pending = allCandidates
    .filter((candidate) => !existingKeys.has(`${candidate.year}:${candidate.make}:${candidate.model}`))
    .slice(0, args.limit || undefined);

  console.log(`Candidates: ${allCandidates.length}`);
  console.log(`Resuming with ${existing.vehicles.length} verified entries already cached`);
  console.log(`Pending this run: ${pending.length}`);

  let processed = 0;

  await runPool(pending, args.concurrency, async (candidate) => {
    const vehicleKey = `${candidate.year}:${candidate.make}:${candidate.model}`;

    try {
      const variantCacheKey = `${candidate.make}:${candidate.year}`;
      let variants = variantsCache.get(variantCacheKey);
      if (!variants) {
        variants = await fetchVariants(candidate.make, candidate.year);
        variantsCache.set(variantCacheKey, variants);
      }

      const variant = resolveVariantForModel(variants, candidate.model);
      if (!variant) {
        processed += 1;
      } else {
        const indexKey = `${candidate.make}:${candidate.year}:${variant}`;
        let indexEntries = indexCache.get(indexKey);
        if (!indexEntries) {
          indexEntries = await fetchDiagramIndex(candidate.make, candidate.year, variant);
          indexCache.set(indexKey, indexEntries);
        }

        const systems = candidate.systems.filter((system) =>
          hasSystemCoverage(indexEntries, WIRING_SYSTEMS[system].matchTerms)
        );

        if (systems.length > 0) {
          verifiedVehicles.push({
            year: candidate.year,
            make: candidate.make,
            model: candidate.model,
            systems,
          });
        }
        processed += 1;
      }

      if (processed % args.writeEvery === 0) {
        await saveCoverage(verifiedVehicles);
        console.log(`Processed ${processed}/${pending.length} (${vehicleKey})`);
      }
    } catch (error) {
      processed += 1;
      console.error(`Failed ${vehicleKey}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  verifiedVehicles.sort((a, b) =>
    a.make.localeCompare(b.make) ||
    a.model.localeCompare(b.model) ||
    b.year - a.year
  );

  await saveCoverage(verifiedVehicles);
  console.log(`Saved ${verifiedVehicles.length} verified vehicle-year entries to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
