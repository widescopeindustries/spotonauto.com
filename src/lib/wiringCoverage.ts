import 'server-only';

import verifiedWiringCoverage from '@/data/wiring-coverage.json';

export interface WiringCoverageVehicle {
  year: number;
  make: string;
  model: string;
}

export interface WiringSelectorData {
  years: number[];
  makesByYear: Record<string, string[]>;
  modelsByYearMake: Record<string, string[]>;
}

const WIRING_COVERAGE = (verifiedWiringCoverage as { vehicles?: WiringCoverageVehicle[] }).vehicles || [];

/**
 * Normalize CHARM make names by merging "X Truck", "X Fuso" etc. into base make.
 * "Ford Truck" → "Ford", "Chevy Truck" → "Chevy Truck" (no plain "Chevy"),
 * "Dodge or Ram Truck" → "Dodge" (special case).
 */
const CHARM_MAKE_MERGE: Record<string, string> = {};

// Build merge map: if both "X" and "X Truck" exist, merge truck into base.
// If only "X Truck" exists (e.g. Chevy Truck, GMC Truck, Jeep Truck), keep as-is
// but strip " Truck" for display.
const allCharmMakes = new Set(WIRING_COVERAGE.map(v => v.make));
for (const make of allCharmMakes) {
  if (make.endsWith(' Truck') || make.endsWith(' Fuso')) {
    const base = make.replace(/ (Truck|Fuso)$/, '');
    // Always merge into the cleaner display name
    if (allCharmMakes.has(base)) {
      CHARM_MAKE_MERGE[make] = base;
    } else if (make === 'Dodge or Ram Truck') {
      CHARM_MAKE_MERGE[make] = 'Dodge';
    } else {
      // No car counterpart — use base name for display
      CHARM_MAKE_MERGE[make] = base;
    }
  }
}

/** Get the display make name for a CHARM make. */
export function getDisplayMake(charmMake: string): string {
  return CHARM_MAKE_MERGE[charmMake] ?? charmMake;
}

/** Get all CHARM make names that map to a display make (e.g. "Ford" → ["Ford", "Ford Truck"]). */
export function getCharmMakesForDisplay(displayMake: string): string[] {
  const makes = [displayMake];
  for (const [charm, display] of Object.entries(CHARM_MAKE_MERGE)) {
    if (display === displayMake && !makes.includes(charm)) {
      makes.push(charm);
    }
  }
  return makes;
}

function buildWiringSelectorData(): WiringSelectorData {
  const years = new Set<number>();
  const makesByYear = new Map<string, Set<string>>();
  const modelsByYearMake = new Map<string, Set<string>>();

  for (const vehicle of WIRING_COVERAGE) {
    if (!Number.isFinite(vehicle.year)) continue;

    const yearKey = String(vehicle.year);
    const displayMake = getDisplayMake(vehicle.make);
    const yearMakes = makesByYear.get(yearKey) || new Set<string>();
    const yearMakeKey = `${yearKey}:${displayMake}`;
    const yearMakeModels = modelsByYearMake.get(yearMakeKey) || new Set<string>();

    years.add(vehicle.year);
    yearMakes.add(displayMake);
    yearMakeModels.add(vehicle.model);

    makesByYear.set(yearKey, yearMakes);
    modelsByYearMake.set(yearMakeKey, yearMakeModels);
  }

  return {
    years: [...years].sort((a, b) => b - a),
    makesByYear: Object.fromEntries(
      [...makesByYear.entries()].map(([year, makes]) => [year, [...makes].sort((left, right) => left.localeCompare(right))]),
    ),
    modelsByYearMake: Object.fromEntries(
      [...modelsByYearMake.entries()].map(([yearMake, models]) => [yearMake, [...models].sort((left, right) => left.localeCompare(right))]),
    ),
  };
}

const wiringSelectorData = buildWiringSelectorData();

export function getWiringSelectorData(): WiringSelectorData {
  return wiringSelectorData;
}
