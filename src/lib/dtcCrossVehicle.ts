import 'server-only';

export interface DtcVehicleEntry {
  id: string;
  make: string;
  year: number;
  model: string;
}

export interface DtcCrossVehicleDetail {
  code: string;
  vehicleCount: number;
  systems: string[];
  contentHashes: string[];
  sampleTitles: string[];
  vehicles: DtcVehicleEntry[];
}

export interface DtcCrossVehicleSummary {
  n: number;
  sys: string[];
  makes: Array<{ make: string; count: number }>;
  yr: [number, number] | null;
}

export async function getDtcCrossVehicleDetail(_code: string): Promise<DtcCrossVehicleDetail | null> {
  return null;
}

export async function getDtcCrossVehicleSummary(_code: string): Promise<DtcCrossVehicleSummary | null> {
  return null;
}

export function formatDtcCoverage(summary: DtcCrossVehicleSummary): string {
  const parts: string[] = [];
  parts.push(`Found in OEM manuals for ${summary.n} vehicle${summary.n === 1 ? '' : 's'}`);
  if (summary.yr) {
    parts[0] += ` (${summary.yr[0]}–${summary.yr[1]})`;
  }
  return parts.join('. ');
}

export function getTopMakesDisplay(summary: DtcCrossVehicleSummary, limit: number = 5): string {
  return summary.makes
    .slice(0, limit)
    .map((m) => m.make)
    .join(', ');
}
