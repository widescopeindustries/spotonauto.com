export type AnalyticsPageSurface =
  | 'home'
  | 'repair_guide'
  | 'vehicle_hub'
  | 'wiring'
  | 'code'
  | 'symptom'
  | 'diagnostic'
  | 'parts'
  | 'manual'
  | 'other';

export type AnalyticsIntentCluster =
  | 'battery_starting'
  | 'lighting'
  | 'brakes'
  | 'oil_fluids'
  | 'cooling'
  | 'filters_tuneup'
  | 'fuel'
  | 'wiring'
  | 'codes'
  | 'diagnostic'
  | 'repair'
  | 'manual_reference'
  | 'vehicle_hub'
  | 'parts'
  | 'other';

export interface AnalyticsContextInput {
  pageSurface?: AnalyticsPageSurface;
  intentCluster?: AnalyticsIntentCluster;
  task?: string;
  taskSlug?: string;
  system?: string;
  systemSlug?: string;
  code?: string;
  codeFamily?: string;
  vehicle?: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
}

const MULTIWORD_MAKES = new Set([
  'alfa romeo',
  'am general',
  'aston martin',
  'land rover',
  'mercedes benz',
  'mercedes-benz',
  'rolls royce',
]);

function slugifyAnalyticsPart(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeAnalyticsSlug(value: string): string {
  return slugifyAnalyticsPart(value);
}

export function deriveCodeFamily(code?: string): string | undefined {
  const raw = String(code || '').trim().toUpperCase();
  if (!raw) return undefined;
  const match = raw.match(/^([BCPU])(\d)/);
  if (!match) return undefined;
  return `${match[1]}${match[2]}`;
}

function normalizeSignalText(value: string): string {
  return normalizeAnalyticsSlug(value).replace(/-/g, ' ');
}

export function deriveIntentCluster(args: {
  pageSurface?: AnalyticsPageSurface;
  task?: string;
  system?: string;
  code?: string;
  vehicle?: string;
}): AnalyticsIntentCluster {
  const taskText = normalizeSignalText(args.task || '');
  const systemText = normalizeSignalText(args.system || '');
  const codeText = normalizeSignalText(args.code || '');

  if (taskText) {
    if (/(battery|alternator|starter|charging|crank|no start)/.test(taskText)) return 'battery_starting';
    if (/(headlight|taillight|tail light|bulb|lighting|lamp)/.test(taskText)) return 'lighting';
    if (/(brake|rotor|pad|caliper)/.test(taskText)) return 'brakes';
    if (/(coolant|radiator|thermostat|water pump|cooling)/.test(taskText)) return 'cooling';
    if (/(oil|fluid|transmission)/.test(taskText)) return 'oil_fluids';
    if (/(filter|spark|tune up|tune-up)/.test(taskText)) return 'filters_tuneup';
    if (/(fuel|injector|pump)/.test(taskText)) return 'fuel';
    if (/(wire|wiring|diagram|connector|circuit)/.test(taskText)) return 'wiring';
    if (/(code|dtc|obd|cel|check engine)/.test(taskText)) return 'codes';
    if (/(diagnose|symptom|rough idle|misfire|overheating|noise|no start)/.test(taskText)) return 'diagnostic';
    if (/(manual|spec|torque|capacity|service)/.test(taskText)) return 'manual_reference';
  }

  if (systemText) {
    if (/(battery|starting|charging|alternator|starter|ignition)/.test(systemText)) return 'battery_starting';
    if (/(lighting|headlight|tail light|taillight|lamp|bulb)/.test(systemText)) return 'lighting';
    if (/(brake|abs)/.test(systemText)) return 'brakes';
    if (/(cooling|radiator|thermostat|water pump)/.test(systemText)) return 'cooling';
    if (/(oil|fluid|transmission)/.test(systemText)) return 'oil_fluids';
    if (/(fuel|injector|pump)/.test(systemText)) return 'fuel';
    if (/(wire|wiring|electrical|connector|circuit)/.test(systemText)) return 'wiring';
  }

  if (codeText) return 'codes';
  if (args.pageSurface === 'repair_guide') return 'repair';
  if (args.pageSurface === 'vehicle_hub') return 'vehicle_hub';
  if (args.pageSurface === 'parts') return 'parts';
  if (args.pageSurface === 'manual') return 'manual_reference';
  return args.pageSurface === 'diagnostic' ? 'diagnostic' : 'other';
}

export function parseVehicleLabel(vehicle?: string): Pick<
  AnalyticsContextInput,
  'vehicleYear' | 'vehicleMake' | 'vehicleModel'
> {
  const trimmed = String(vehicle || '').trim();
  if (!trimmed) return {};

  const match = trimmed.match(/^(\d{4})\s+(.+)$/);
  if (!match) return {};

  const [, vehicleYear, remainder] = match;
  const parts = remainder.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return { vehicleYear };
  }

  const firstTwo = `${parts[0]} ${parts[1]}`.toLowerCase();
  const makeParts = parts.length >= 3 && MULTIWORD_MAKES.has(firstTwo)
    ? parts.slice(0, 2)
    : parts.slice(0, 1);
  const modelParts = parts.slice(makeParts.length);

  return {
    vehicleYear,
    vehicleMake: normalizeAnalyticsSlug(makeParts.join(' ')),
    vehicleModel: normalizeAnalyticsSlug(modelParts.join(' ')),
  };
}

export function buildAnalyticsContext(input: AnalyticsContextInput = {}): Record<string, string> {
  const taskSlug = input.taskSlug || (input.task ? normalizeAnalyticsSlug(input.task) : '');
  const systemSlug = input.systemSlug || (input.system ? normalizeAnalyticsSlug(input.system) : '');
  const codeFamily = input.codeFamily || deriveCodeFamily(input.code);
  const parsedVehicle = input.vehicleYear || input.vehicleMake || input.vehicleModel
    ? {
        vehicleYear: input.vehicleYear,
        vehicleMake: input.vehicleMake,
        vehicleModel: input.vehicleModel,
      }
    : parseVehicleLabel(input.vehicle);

  const context: Record<string, string> = {};

  if (input.pageSurface) context.page_surface = input.pageSurface;
  if (input.intentCluster) context.intent_cluster = input.intentCluster;
  if (taskSlug) context.task_slug = taskSlug;
  if (systemSlug) context.system_slug = systemSlug;
  if (codeFamily) context.code_family = codeFamily;
  if (parsedVehicle.vehicleYear) context.vehicle_year = parsedVehicle.vehicleYear;
  if (parsedVehicle.vehicleMake) context.vehicle_make = parsedVehicle.vehicleMake;
  if (parsedVehicle.vehicleModel) context.vehicle_model = parsedVehicle.vehicleModel;

  return context;
}
