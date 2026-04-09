import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(new URL('..', import.meta.url).pathname);
const sourcePath = process.env.CHARM_VEHICLE_INDEX || '/home/lyndon/lab/vehicle-index.json';
const exactOutPath = path.join(repoRoot, 'src/data/charmLiPathIndex.json');
const ambiguityOutPath = path.join(repoRoot, 'src/data/charmLiAmbiguityIndex.json');

const vehicles = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

function extractModel(variant) {
  const match = variant.match(/\s+(?:[LVHWI]\d+|[A-Z]\d+)-\d+cc|\s+\d+\.\dL\s/);
  if (match && match.index > 0) {
    return variant.slice(0, match.index).trim();
  }
  return variant.trim();
}

function decodeLeafLabel(rawPath) {
  const leaf = rawPath.split('/').filter(Boolean).at(-1) || '';
  try {
    return decodeURIComponent(leaf);
  } catch {
    return leaf;
  }
}

const grouped = new Map();

for (const vehicle of vehicles) {
  const make = vehicle.make;
  const year = String(vehicle.year);
  const model = extractModel(vehicle.variant);
  const key = `${make}\t${model}\t${year}`;
  const candidate = {
    label: decodeLeafLabel(vehicle.path),
    path: vehicle.path,
  };
  const existing = grouped.get(key);
  if (existing) {
    existing.set(candidate.path, candidate);
  } else {
    grouped.set(key, new Map([[candidate.path, candidate]]));
  }
}

const exactIndex = {};
const ambiguityIndex = {};

let uniqueCount = 0;
let ambiguousCount = 0;

for (const [key, candidateMap] of grouped.entries()) {
  const [make, model, year] = key.split('\t');
  const candidates = Array.from(candidateMap.values()).sort((a, b) => a.label.localeCompare(b.label));

  if (candidates.length === 1) {
    uniqueCount += 1;
    exactIndex[make] ??= {};
    exactIndex[make][model] ??= {};
    exactIndex[make][model][year] = candidates[0].path;
    continue;
  }

  ambiguousCount += 1;
  ambiguityIndex[make] ??= {};
  ambiguityIndex[make][model] ??= {};
  ambiguityIndex[make][model][year] = candidates;
}

fs.writeFileSync(exactOutPath, `${JSON.stringify(exactIndex)}\n`);
fs.writeFileSync(ambiguityOutPath, `${JSON.stringify(ambiguityIndex)}\n`);

console.log(JSON.stringify({
  sourcePath,
  exactOutPath,
  ambiguityOutPath,
  uniqueCount,
  ambiguousCount,
}, null, 2));
