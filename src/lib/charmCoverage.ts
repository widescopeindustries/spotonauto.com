import coverageJson from '@/data/charmLiCoverage.json';
import ambiguityIndexJson from '@/data/charmLiAmbiguityIndex.json';
import pathIndexJson from '@/data/charmLiPathIndex.json';

type CharmCoverageMap = Record<string, Record<string, number[]>>;
type CharmAmbiguityIndex = Record<string, Record<string, Record<string, ResolvedCharmManualCandidate[]>>>;
type CharmPathIndex = Record<string, Record<string, Record<string, string>>>;

const coverage = coverageJson as CharmCoverageMap;
const ambiguityIndex = ambiguityIndexJson as CharmAmbiguityIndex;
const pathIndex = pathIndexJson as CharmPathIndex;
const makeNames = Object.keys(coverage).sort();
const availableYears = Array.from(
  new Set(
    makeNames.flatMap((make) =>
      Object.values(coverage[make]).flatMap((years) => years),
    ),
  ),
).sort((a, b) => b - a);

const modelCount = makeNames.reduce((sum, make) => sum + Object.keys(coverage[make]).length, 0);
const comboCount = makeNames.reduce(
  (sum, make) => sum + Object.values(coverage[make]).reduce((inner, years) => inner + years.length, 0),
  0,
);

export function getCharmCoverageStats() {
  return {
    makeCount: makeNames.length,
    modelCount,
    comboCount,
  };
}

export function getCharmCoverageAvailableYears(): number[] {
  return availableYears;
}

export function getCharmCoverageMakesForYear(year: number): string[] {
  return makeNames.filter((make) =>
    Object.values(coverage[make]).some((years) => years.includes(year)),
  );
}

export function getCharmCoverageModelsForYearMake(year: number, make: string): string[] {
  const makeData = coverage[make];
  if (!makeData) return [];

  return Object.entries(makeData)
    .filter(([, years]) => years.includes(year))
    .map(([model]) => model)
    .sort();
}

export function getCharmCoverageYears(make: string, model: string): number[] {
  return coverage[make]?.[model] || [];
}

export function isInCharmCoverage(year: number, make: string, model: string): boolean {
  return getCharmCoverageYears(make, model).includes(year);
}

export interface ResolvedCharmManualPath {
  path: string;
  exact: boolean;
  candidates: ResolvedCharmManualCandidate[];
}

export interface ResolvedCharmManualCandidate {
  label: string;
  path: string;
}

function encodeManualSegments(path: string): string {
  const segments = path
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    });

  return `/manual/${segments.join('/')}`;
}

export function resolveCharmManualPath(year: number, make: string, model: string): ResolvedCharmManualPath {
  const yearKey = String(year);
  const exactPath = pathIndex[make]?.[model]?.[yearKey];
  const ambiguousCandidates = ambiguityIndex[make]?.[model]?.[yearKey];

  if (exactPath) {
    return {
      path: encodeManualSegments(exactPath),
      exact: true,
      candidates: [],
    };
  }

  if (ambiguousCandidates?.length) {
    return {
      path: `/manual/${encodeURIComponent(make)}/${encodeURIComponent(yearKey)}`,
      exact: false,
      candidates: ambiguousCandidates.map((candidate) => ({
        label: candidate.label,
        path: encodeManualSegments(candidate.path),
      })),
    };
  }

  return {
    path: `/manual/${encodeURIComponent(make)}/${encodeURIComponent(yearKey)}`,
    exact: false,
    candidates: [],
  };
}
