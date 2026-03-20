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

function buildWiringSelectorData(): WiringSelectorData {
  const years = new Set<number>();
  const makesByYear = new Map<string, Set<string>>();
  const modelsByYearMake = new Map<string, Set<string>>();

  for (const vehicle of WIRING_COVERAGE) {
    if (!Number.isFinite(vehicle.year)) continue;

    const yearKey = String(vehicle.year);
    const yearMakes = makesByYear.get(yearKey) || new Set<string>();
    const yearMakeKey = `${yearKey}:${vehicle.make}`;
    const yearMakeModels = modelsByYearMake.get(yearMakeKey) || new Set<string>();

    years.add(vehicle.year);
    yearMakes.add(vehicle.make);
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
