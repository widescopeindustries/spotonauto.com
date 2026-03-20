import { getDisplayName, slugifyRoutePart } from '@/data/vehicles';

export interface VehicleIdentityInput {
  year: string | number;
  make: string;
  model: string;
  variant?: string;
}

export interface CanonicalVehicleIdentity {
  year: string;
  make: string;
  model: string;
  makeSlug: string;
  modelSlug: string;
  variantSlug?: string;
  displayMake: string;
  displayModel: string;
  displayVariant?: string;
  key: string;
  nodeId: string;
}

function compactSlug(value: string): string {
  return slugifyRoutePart(value).replace(/-/g, '');
}

export function tokenizeVehicleSlug(value: string): string[] {
  return slugifyRoutePart(value)
    .split('-')
    .filter((token) => /\d/.test(token) || token.length >= 2);
}

export function scoreVehicleModelMatch(requestedModel: string, candidateModel: string): number {
  const requestedSlug = slugifyRoutePart(requestedModel);
  const candidateSlug = slugifyRoutePart(candidateModel);
  if (!requestedSlug || !candidateSlug) return 0;

  if (requestedSlug === candidateSlug) return 100;

  const requestedCompact = compactSlug(requestedSlug);
  const candidateCompact = compactSlug(candidateSlug);
  if (requestedCompact && requestedCompact === candidateCompact) return 95;

  const requestedTokens = tokenizeVehicleSlug(requestedSlug);
  const candidateTokens = tokenizeVehicleSlug(candidateSlug);
  if (!requestedTokens.length || !candidateTokens.length) return 0;

  const requestedNumericTokens = requestedTokens.filter((token) => /\d/.test(token));
  if (
    requestedNumericTokens.length > 0 &&
    !requestedNumericTokens.every((token) => candidateTokens.includes(token))
  ) {
    return 0;
  }

  if (requestedTokens.every((token) => candidateTokens.includes(token))) return 85;
  if (candidateTokens.every((token) => requestedTokens.includes(token))) return 80;

  if (requestedCompact.length >= 3 && candidateCompact.includes(requestedCompact)) return 70;

  const sharedTokens = requestedTokens.filter((token) => candidateTokens.includes(token));
  if (sharedTokens.length === 0) return 0;

  return 50 + Math.min(sharedTokens.length, 3) * 5;
}

export function buildVehicleKey(year: string | number, make: string, model: string): string {
  return `${String(year)}:${slugifyRoutePart(make)}:${slugifyRoutePart(model)}`;
}

export function buildVehicleNodeId(year: string | number, make: string, model: string): string {
  return `vehicle:${buildVehicleKey(year, make, model)}`;
}

export function parseVehicleNodeId(nodeId: string): { year: string; make: string; model: string } | null {
  const parts = nodeId.split(':');
  if (parts.length !== 4 || parts[0] !== 'vehicle') return null;

  const [, year, make, model] = parts;
  if (!year || !make || !model) return null;

  return { year, make, model };
}

export function buildVehicleHubUrl(year: string | number, make: string, model: string): string {
  return `/repair/${String(year)}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}`;
}

export function buildRepairUrl(year: string | number, make: string, model: string, task: string): string {
  return `/repair/${String(year)}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}/${slugifyRoutePart(task)}`;
}

export function canonicalizeVehicleIdentity(input: VehicleIdentityInput): CanonicalVehicleIdentity {
  const year = String(input.year);
  const makeSlug = slugifyRoutePart(input.make);
  const modelSlug = slugifyRoutePart(input.model);
  const variantSlug = input.variant ? slugifyRoutePart(input.variant) : undefined;

  return {
    year,
    make: input.make,
    model: input.model,
    makeSlug,
    modelSlug,
    variantSlug,
    displayMake: getDisplayName(makeSlug, 'make'),
    displayModel: getDisplayName(modelSlug, 'model'),
    displayVariant: input.variant,
    key: buildVehicleKey(year, input.make, input.model),
    nodeId: buildVehicleNodeId(year, input.make, input.model),
  };
}
