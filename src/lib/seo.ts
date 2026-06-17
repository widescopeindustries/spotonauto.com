import { NOINDEX_MAKES, isNonUsModel, slugifyRoutePart } from '@/data/vehicles';

/**
 * Returns robots metadata for vehicle-specific pages when the make/model
 * should not be indexed (non-US models or low-value makes).
 */
export function getNoindexRobots(make: string, model: string) {
  const canonicalMake = slugifyRoutePart(make);
  const canonicalModel = slugifyRoutePart(model);
  return NOINDEX_MAKES.has(canonicalMake) || isNonUsModel(canonicalMake, canonicalModel)
    ? { index: false, follow: true }
    : undefined;
}
