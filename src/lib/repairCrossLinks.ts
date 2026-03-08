import { DTC_CODES, type DTCCode } from '@/data/dtc-codes-data';
import {
  buildWiringSeoHref,
  slugifyWiringSegment,
  WIRING_SEO_SYSTEMS,
  WIRING_SEO_VEHICLES,
  type WiringSeoVehicle,
  type WiringSystemSlug,
} from '@/data/wiring-seo-cluster';

export interface RepairCrossLink {
  href: string;
  label: string;
  description: string;
  badge: string;
}

const TASK_TO_WIRING_SYSTEMS: Partial<Record<string, WiringSystemSlug[]>> = {
  'alternator-replacement': ['alternator'],
  'battery-replacement': ['alternator', 'starter'],
  'starter-replacement': ['starter'],
  'fuel-pump-replacement': ['fuel-pump'],
  'spark-plug-replacement': ['starter'],
  'ignition-coil-replacement': ['starter'],
  'crankshaft-sensor-replacement': ['starter'],
  'camshaft-sensor-replacement': ['starter'],
};

const DTC_SEVERITY_RANK: Record<DTCCode['severity'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function matchesVehicle(
  vehicle: WiringSeoVehicle,
  year: string,
  makeCandidates: Set<string>,
  modelCandidates: Set<string>,
): boolean {
  return (
    vehicle.year === Number(year) &&
    makeCandidates.has(slugifyWiringSegment(vehicle.make)) &&
    modelCandidates.has(slugifyWiringSegment(vehicle.model))
  );
}

function getExactWiringVehicle(
  year: string,
  make: string,
  displayMake: string,
  model: string,
  displayModel: string,
): WiringSeoVehicle | null {
  const makeCandidates = new Set<string>([
    slugifyWiringSegment(make),
    slugifyWiringSegment(displayMake),
    slugifyWiringSegment(`${displayMake} Truck`),
  ]);
  const modelCandidates = new Set<string>([
    slugifyWiringSegment(model),
    slugifyWiringSegment(displayModel),
  ]);

  return WIRING_SEO_VEHICLES.find((vehicle) =>
    matchesVehicle(vehicle, year, makeCandidates, modelCandidates)
  ) || null;
}

function buildWiringBrowserHref(year: string, displayMake: string, system: WiringSystemSlug): string {
  const params = new URLSearchParams({
    year,
    make: displayMake,
    q: WIRING_SEO_SYSTEMS[system].shortLabel,
  });
  return `/wiring?${params.toString()}`;
}

export function getRepairWiringLinks(args: {
  year: string;
  make: string;
  displayMake: string;
  model: string;
  displayModel: string;
  task: string;
}): RepairCrossLink[] {
  const systems = TASK_TO_WIRING_SYSTEMS[args.task] || [];
  if (!systems.length) return [];

  const exactVehicle = getExactWiringVehicle(
    args.year,
    args.make,
    args.displayMake,
    args.model,
    args.displayModel,
  );

  return systems.map((system) => {
    const meta = WIRING_SEO_SYSTEMS[system];
    const href = exactVehicle
      ? buildWiringSeoHref(exactVehicle, system)
      : buildWiringBrowserHref(args.year, args.displayMake, system);

    return {
      href,
      label: exactVehicle ? meta.title : `${meta.shortLabel} Wiring Browser`,
      description: exactVehicle
        ? `Open OEM-style ${meta.shortLabel.toLowerCase()} schematics for this exact vehicle.`
        : `Open the wiring browser prefilled for ${meta.shortLabel.toLowerCase()} diagnosis on this vehicle.`,
      badge: exactVehicle ? 'Exact Vehicle' : 'Prefilled Browser',
    };
  });
}

export function getRepairDtcLinks(task: string, limit: number = 4): RepairCrossLink[] {
  return DTC_CODES
    .filter((code) => code.repairTaskSlug === task)
    .sort((a, b) => {
      const severityDiff = DTC_SEVERITY_RANK[a.severity] - DTC_SEVERITY_RANK[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return a.code.localeCompare(b.code);
    })
    .slice(0, limit)
    .map((code) => ({
      href: `/codes/${code.code.toLowerCase()}`,
      label: `${code.code}: ${code.title}`,
      description: `${code.affectedSystem} code. ${code.commonFix}`,
      badge: code.severity.toUpperCase(),
    }));
}
