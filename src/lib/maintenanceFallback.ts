import { getToolPagesForVehicle, findGenerationForYear, type ToolType } from '@/data/tools-pages';
import { getClampedYear, slugifyRoutePart } from '@/data/vehicles';

/**
 * When a vehicle-specific maintenance page doesn't have CHARM corpus data,
 * try to find an equivalent tool page that covers the same make/model/toolType.
 * Tool pages cover all years generically and have real data for ~3,700 vehicles.
 */
export function getMaintenanceFallbackSlug(
  make: string,
  model: string,
  toolType: ToolType
): string | null {
  const pages = getToolPagesForVehicle(make, model);
  const match = pages.find((p) => p.toolType === toolType);
  return match?.slug ?? null;
}

/**
 * Build the redirect URL for a maintenance page fallback.
 */
export function getMaintenanceFallbackUrl(
  make: string,
  model: string,
  toolType: ToolType
): string | null {
  const slug = getMaintenanceFallbackSlug(make, model, toolType);
  if (!slug) return null;
  return `/tools/${slug}`;
}

/** Link only to covered year-specific specs, or an existing model reference. */
export function getMaintenanceSpecLink(
  year: string | number,
  make: string,
  model: string,
  toolType: ToolType
): string | null {
  const yearNum = Number(year);
  if (!Number.isInteger(yearNum) || getClampedYear(String(yearNum), make, model) !== null) return null;
  const page = getToolPagesForVehicle(make, model).find((p) => p.toolType === toolType);
  if (!page) return null;
  if (!findGenerationForYear(yearNum, page.generations)) return `/tools/${page.slug}`;
  return `/maintenance/${yearNum}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}/${toolType}`;
}
