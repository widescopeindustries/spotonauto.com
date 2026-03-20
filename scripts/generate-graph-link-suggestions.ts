#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { DTC_CODES } from '../src/data/dtc-codes-data.ts';
import {
  VEHICLE_PRODUCTION_YEARS,
  NOINDEX_MAKES,
  slugifyRoutePart,
} from '../src/data/vehicles.ts';
import {
  WIRING_SEO_VEHICLES,
} from '../src/data/wiring-seo-cluster.ts';
import { buildVehicleHubGraph } from '../src/lib/vehicleHubGraph.ts';
import { buildVehicleHubLinksForCode, buildVehicleHubLinkForWiring } from '../src/lib/vehicleHubLinks.ts';
import { getRepairLinksForCode, getWiringLinksForCode } from '../src/lib/diagnosticCrossLinks.ts';

interface Suggestion {
  priority: number;
  sourceUrl: string;
  targetUrl: string;
  sourceSurface: 'guide-model' | 'code' | 'wiring';
  targetSurface: 'vehicle';
  anchorText: string;
  rationale: string;
}

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const REPORTS_DIR = path.join(ROOT, 'scripts', 'seo-reports');

function ensureReportsDir() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function csvEscape(value: string | number): string {
  const raw = String(value ?? '');
  if (raw.includes('"') || raw.includes(',') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function buildRepresentativeYear(start: number, end: number): number {
  if (start <= 2013 && end >= 2013) return 2013;
  return Math.min(end, Math.max(start, 2013));
}

async function collectGuideModelSuggestions(): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
    if (NOINDEX_MAKES.has(make.toLowerCase())) continue;
    const makeSlug = slugifyRoutePart(make);

    for (const [model, production] of Object.entries(models)) {
      const modelSlug = slugifyRoutePart(model);
      const year = buildRepresentativeYear(production.start, production.end);
      const vehicleGraph = await buildVehicleHubGraph({
        year: String(year),
        make: makeSlug,
        model: modelSlug,
        displayMake: make,
        displayModel: model,
      });

      if (vehicleGraph.totalNodes === 0) continue;

      suggestions.push({
        priority: vehicleGraph.totalNodes + vehicleGraph.wiringCount * 4 + vehicleGraph.codeCount * 2,
        sourceUrl: `https://spotonauto.com/guides/${makeSlug}/${modelSlug}`,
        targetUrl: `https://spotonauto.com/repair/${year}/${makeSlug}/${modelSlug}`,
        sourceSurface: 'guide-model',
        targetSurface: 'vehicle',
        anchorText: `Open ${year} ${make} ${model} repair hub`,
        rationale: `Representative year hub has ${vehicleGraph.repairCount} repair paths, ${vehicleGraph.wiringCount} wiring pages, and ${vehicleGraph.codeCount} code clusters.`,
      });
    }
  }

  return suggestions;
}

function collectCodeSuggestions(): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const code of DTC_CODES) {
    const repairLinks = getRepairLinksForCode(code, 6);
    const wiringLinks = getWiringLinksForCode(code, 6);
    const hubLinks = buildVehicleHubLinksForCode({
      code: code.code,
      repairLinks,
      wiringLinks,
      manualLinks: [],
      limit: 6,
    });

    for (const [index, link] of hubLinks.entries()) {
      suggestions.push({
        priority: 90 - index * 5,
        sourceUrl: `https://spotonauto.com/codes/${code.code.toLowerCase()}`,
        targetUrl: `https://spotonauto.com${link.href}`,
        sourceSurface: 'code',
        targetSurface: 'vehicle',
        anchorText: link.label,
        rationale: link.description,
      });
    }
  }

  return suggestions;
}

function collectWiringSuggestions(): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const vehicle of WIRING_SEO_VEHICLES) {
    for (const system of vehicle.systems) {
      const link = buildVehicleHubLinkForWiring({
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        system,
      });

      suggestions.push({
        priority: 80,
        sourceUrl: `https://spotonauto.com/wiring/${vehicle.year}/${slugifyRoutePart(vehicle.make)}/${slugifyRoutePart(vehicle.model)}/${system}`,
        targetUrl: `https://spotonauto.com${link.href}`,
        sourceSurface: 'wiring',
        targetSurface: 'vehicle',
        anchorText: link.label,
        rationale: link.description,
      });
    }
  }

  return suggestions;
}

async function main(): Promise<void> {
  ensureReportsDir();

  const suggestions = [
    ...(await collectGuideModelSuggestions()),
    ...collectCodeSuggestions(),
    ...collectWiringSuggestions(),
  ].sort((a, b) => b.priority - a.priority || a.sourceUrl.localeCompare(b.sourceUrl) || a.targetUrl.localeCompare(b.targetUrl));

  const date = new Date().toISOString().slice(0, 10);
  const jsonPath = path.join(REPORTS_DIR, `graph-link-suggestions-${date}.json`);
  const csvPath = path.join(REPORTS_DIR, `graph-link-suggestions-${date}.csv`);

  fs.writeFileSync(jsonPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalSuggestions: suggestions.length,
    suggestions,
  }, null, 2));

  const csvLines = [
    'priority,source_url,target_url,source_surface,target_surface,anchor_text,rationale',
    ...suggestions.map((row) => [
      csvEscape(row.priority),
      csvEscape(row.sourceUrl),
      csvEscape(row.targetUrl),
      csvEscape(row.sourceSurface),
      csvEscape(row.targetSurface),
      csvEscape(row.anchorText),
      csvEscape(row.rationale),
    ].join(',')),
  ];
  fs.writeFileSync(csvPath, `${csvLines.join('\n')}\n`);

  const bySurface = suggestions.reduce<Record<string, number>>((acc, row) => {
    acc[row.sourceSurface] = (acc[row.sourceSurface] || 0) + 1;
    return acc;
  }, {});

  console.log(JSON.stringify({
    generatedAt: date,
    totalSuggestions: suggestions.length,
    bySurface,
    jsonPath,
    csvPath,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
