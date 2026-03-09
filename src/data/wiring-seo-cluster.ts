import validatedVehicles from '@/data/validated-vehicles.json';
import verifiedWiringCoverage from '@/data/wiring-coverage.json';

export interface WiringSeoVehicle {
  year: number;
  make: string;
  model: string;
  systems: WiringSystemSlug[];
}

export interface WiringSeoVehiclePriorityOptions {
  system?: WiringSystemSlug;
  task?: string;
  make?: string;
  model?: string;
  year?: number;
  excludeVehicle?: WiringSeoVehicle | null;
  dedupeByModel?: boolean;
  limit?: number;
}

export type WiringSystemSlug = 'starter' | 'alternator' | 'fuel-pump';

export interface WiringSeoSystem {
  slug: WiringSystemSlug;
  title: string;
  shortLabel: string;
  intro: string;
  matchTerms: string[];
  keywords: string[];
}

interface ValidatedModelEntry {
  start: number;
  end: number;
  confirmedYears: number[];
  tasks: string[];
}

type ValidatedVehiclesMap = Record<string, Record<string, ValidatedModelEntry>>;

const VALIDATED_WIRING_VEHICLES = validatedVehicles as ValidatedVehiclesMap;
const VERIFIED_WIRING_COVERAGE = verifiedWiringCoverage as {
  generatedAt?: string;
  source?: string;
  vehicles?: WiringSeoVehicle[];
};
const WIRING_YEAR_MIN = 1982;
const WIRING_YEAR_MAX = 2013;
const PRIORITY_MAKES = [
  'Toyota',
  'Honda',
  'Ford',
  'Chevrolet',
  'Nissan',
  'Hyundai',
  'Kia',
  'Subaru',
  'BMW',
  'Jeep',
  'Dodge',
  'GMC',
  'Acura',
  'Lincoln',
  'Volkswagen',
  'Mercedes',
  'Lexus',
];
const PRIORITY_MAKE_RANK = new Map(PRIORITY_MAKES.map((make, index) => [make, index]));

const WIRING_TASKS_BY_SYSTEM: Record<WiringSystemSlug, string[]> = {
  alternator: ['alternator-replacement', 'battery-replacement'],
  starter: ['starter-replacement', 'battery-replacement'],
  'fuel-pump': ['fuel-pump-replacement'],
};

const NON_ROAD_VEHICLE_PATTERN = /\b(trailer|scooter|motorcycle|motocross|enduro|atv|utv|quad|snowmobile|roadking|softail|sportster|electra\s+glide|heritage\s+classic|fat\s+boy|shadow\s+ace|gold\s+wing|vulcan|hayabusa|ninja|gsx-r|rm-z|xr\d|crf\d|dr\d|yz[f]?\d|vt\d|cbr\d|klr\d|intruder|boulevard|virago|v-star|roadstar|nighthawk|speedfight|manufacturing)\b/i;

export const WIRING_SEO_SYSTEMS: Record<WiringSystemSlug, WiringSeoSystem> = {
  starter: {
    slug: 'starter',
    title: 'Starter Wiring Diagram',
    shortLabel: 'Starter',
    intro:
      'Find starter circuit schematics, relay paths, and ignition-switch to solenoid wiring references for this vehicle.',
    matchTerms: ['starter', 'starting', 'start circuit', 'crank', 'ignition switch'],
    keywords: ['starter wiring diagram', 'starter relay wiring', 'no crank wiring diagram'],
  },
  alternator: {
    slug: 'alternator',
    title: 'Alternator Wiring Diagram',
    shortLabel: 'Alternator',
    intro:
      'Find charging-system schematics including alternator field/control wiring, battery feeds, and fuse/relay paths.',
    matchTerms: ['alternator', 'charging', 'generator', 'charge indicator', 'charging system'],
    keywords: ['alternator wiring diagram', 'charging system wiring', 'battery charging circuit diagram'],
  },
  'fuel-pump': {
    slug: 'fuel-pump',
    title: 'Fuel Pump Wiring Diagram',
    shortLabel: 'Fuel Pump',
    intro:
      'Find fuel-pump power and control wiring, relay paths, and fuel-level sender references to speed up no-start diagnosis.',
    matchTerms: ['fuel pump', 'fuel sender', 'fuel level', 'fuel delivery', 'fuel system'],
    keywords: ['fuel pump wiring diagram', 'fuel pump relay wiring', 'fuel sender wiring diagram'],
  },
};

function getMakeRank(make: string): number {
  return PRIORITY_MAKE_RANK.get(make) ?? 999;
}

function getSupportedWiringSystems(entry: ValidatedModelEntry): WiringSystemSlug[] {
  const systems = Object.entries(WIRING_TASKS_BY_SYSTEM)
    .filter(([, tasks]) => tasks.some((task) => entry.tasks.includes(task)))
    .map(([system]) => system as WiringSystemSlug);
  return systems.sort();
}

function getVehicleTasks(vehicle: WiringSeoVehicle): string[] {
  return VALIDATED_WIRING_VEHICLES[vehicle.make]?.[vehicle.model]?.tasks || [];
}

function isPublicRoadVehicle(make: string, model: string): boolean {
  const haystack = `${make} ${model}`.toLowerCase();
  return !NON_ROAD_VEHICLE_PATTERN.test(haystack);
}

export function slugifyWiringSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function compareVehicles(a: WiringSeoVehicle, b: WiringSeoVehicle): number {
  const rankDiff = getMakeRank(a.make) - getMakeRank(b.make);
  if (rankDiff !== 0) return rankDiff;
  const makeDiff = a.make.localeCompare(b.make);
  if (makeDiff !== 0) return makeDiff;
  const modelDiff = a.model.localeCompare(b.model);
  if (modelDiff !== 0) return modelDiff;
  return b.year - a.year;
}

function buildWiringSeoVehicles(): WiringSeoVehicle[] {
  if (Array.isArray(VERIFIED_WIRING_COVERAGE.vehicles) && VERIFIED_WIRING_COVERAGE.vehicles.length > 0) {
    return VERIFIED_WIRING_COVERAGE.vehicles
      .filter((vehicle) => isPublicRoadVehicle(vehicle.make, vehicle.model))
      .sort(compareVehicles);
  }

  const vehicles: WiringSeoVehicle[] = [];

  for (const [make, models] of Object.entries(VALIDATED_WIRING_VEHICLES)) {
    for (const [model, entry] of Object.entries(models)) {
      if (!entry || !Array.isArray(entry.tasks) || !Array.isArray(entry.confirmedYears)) continue;
      if (!isPublicRoadVehicle(make, model)) continue;

      const systems = getSupportedWiringSystems(entry);
      if (systems.length === 0) continue;

      const years = [...new Set(entry.confirmedYears)]
        .filter((year) => year >= WIRING_YEAR_MIN && year <= WIRING_YEAR_MAX)
        .sort((a, b) => b - a);

      for (const year of years) {
        vehicles.push({ year, make, model, systems });
      }
    }
  }

  return vehicles.sort(compareVehicles);
}

export const WIRING_SEO_VEHICLES: WiringSeoVehicle[] = buildWiringSeoVehicles();

const WIRING_SEO_VEHICLE_BY_KEY = new Map(
  WIRING_SEO_VEHICLES.map((vehicle) => [
    `${vehicle.year}:${slugifyWiringSegment(vehicle.make)}:${slugifyWiringSegment(vehicle.model)}`,
    vehicle,
  ]),
);

export function getWiringSeoPaths(): Array<{
  year: string;
  make: string;
  model: string;
  system: WiringSystemSlug;
}> {
  const paths: Array<{ year: string; make: string; model: string; system: WiringSystemSlug }> = [];

  for (const vehicle of WIRING_SEO_VEHICLES) {
    for (const system of vehicle.systems) {
      paths.push({
        year: String(vehicle.year),
        make: slugifyWiringSegment(vehicle.make),
        model: slugifyWiringSegment(vehicle.model),
        system,
      });
    }
  }

  return paths;
}

export function findWiringSeoVehicleBySlug(
  year: string,
  makeSlug: string,
  modelSlug: string,
): WiringSeoVehicle | null {
  const targetYear = Number(year);
  if (!Number.isFinite(targetYear)) return null;

  return WIRING_SEO_VEHICLE_BY_KEY.get(`${targetYear}:${makeSlug}:${modelSlug}`) || null;
}

export function supportsWiringSystem(vehicle: WiringSeoVehicle, system: WiringSystemSlug): boolean {
  return vehicle.systems.includes(system);
}

export function getRelatedWiringSeoVehicles(
  vehicle: WiringSeoVehicle,
  system: WiringSystemSlug,
  limit = 8,
): WiringSeoVehicle[] {
  const primaryTask = WIRING_TASKS_BY_SYSTEM[system]?.[0];
  return getPriorityWiringSeoVehicles({
    system,
    task: primaryTask,
    make: vehicle.make,
    year: vehicle.year,
    excludeVehicle: vehicle,
    limit,
  });
}

export function scoreWiringSeoVehicle(
  vehicle: WiringSeoVehicle,
  options: Omit<WiringSeoVehiclePriorityOptions, 'excludeVehicle' | 'dedupeByModel' | 'limit'> = {},
): number {
  const tasks = getVehicleTasks(vehicle);
  let score = 0;

  score += Math.max(0, 72 - getMakeRank(vehicle.make) * 3);
  score += vehicle.systems.length * 8;
  if (vehicle.year >= 2010) score += 10;
  else if (vehicle.year >= 2005) score += 6;
  else if (vehicle.year >= 2000) score += 3;

  if (typeof options.year === 'number' && Number.isFinite(options.year)) {
    score += Math.max(0, 20 - Math.min(Math.abs(options.year - vehicle.year), 20));
  }

  if (options.system) {
    if (!supportsWiringSystem(vehicle, options.system)) return Number.NEGATIVE_INFINITY;
    score += 30;
    score += WIRING_TASKS_BY_SYSTEM[options.system].filter((task) => tasks.includes(task)).length * 14;
  }

  if (options.task && tasks.includes(options.task)) {
    score += 40;
  }

  if (options.make && slugifyWiringSegment(vehicle.make) === slugifyWiringSegment(options.make)) {
    score += 55;
  }

  if (options.model && slugifyWiringSegment(vehicle.model) === slugifyWiringSegment(options.model)) {
    score += 65;
  }

  return score;
}

export function getPriorityWiringSeoVehicles(
  options: WiringSeoVehiclePriorityOptions,
): WiringSeoVehicle[] {
  const seen = new Set<string>();
  const limit = Math.max(1, options.limit ?? 8);
  const excludeKey = options.excludeVehicle
    ? `${options.excludeVehicle.year}:${slugifyWiringSegment(options.excludeVehicle.make)}:${slugifyWiringSegment(options.excludeVehicle.model)}`
    : null;

  return WIRING_SEO_VEHICLES
    .filter((candidate) => {
      const candidateKey = `${candidate.year}:${slugifyWiringSegment(candidate.make)}:${slugifyWiringSegment(candidate.model)}`;
      if (excludeKey && candidateKey === excludeKey) return false;
      if (options.system && !supportsWiringSystem(candidate, options.system)) return false;
      return true;
    })
    .sort((a, b) => {
      const scoreDiff = scoreWiringSeoVehicle(b, options) - scoreWiringSeoVehicle(a, options);
      if (scoreDiff !== 0) return scoreDiff;
      return compareVehicles(a, b);
    })
    .filter((candidate) => {
      const dedupeKey = options.dedupeByModel === false
        ? `${candidate.year}:${candidate.make}:${candidate.model}`
        : `${candidate.make}:${candidate.model}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    })
    .slice(0, limit);
}

export function buildWiringSeoHref(vehicle: WiringSeoVehicle, system: WiringSystemSlug): string {
  return `/wiring/${vehicle.year}/${slugifyWiringSegment(vehicle.make)}/${slugifyWiringSegment(vehicle.model)}/${system}`;
}

export function buildWiringLibraryHref(vehicle: WiringSeoVehicle, system: WiringSystemSlug): string {
  const params = new URLSearchParams({
    year: String(vehicle.year),
    make: vehicle.make,
    model: vehicle.model,
    q: WIRING_SEO_SYSTEMS[system].shortLabel,
    open: '1',
  });
  return `/wiring?${params.toString()}#diagram-browser`;
}
