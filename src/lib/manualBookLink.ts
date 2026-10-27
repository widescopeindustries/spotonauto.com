/** Display names that are not the archive folder. The reader rewrites Dodge, not Ram. */
export function manualMakeName(make: string): string {
  if (make === 'Ram') return 'Dodge and Ram';
  return make;
}

export function manualYearHref(make: string, year: string | number): string {
  return `/manual/${encodeURIComponent(manualMakeName(make))}/${year}`;
}

export function manualVehicleHref(make: string, year: string | number, variant: string): string {
  return `${manualYearHref(make, year)}/${encodeURIComponent(variant)}`;
}
