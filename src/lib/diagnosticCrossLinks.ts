import type { DTCCode } from '@/data/dtc-codes-data';
import { DTC_CODES, DTC_CODES_MAP } from '@/data/dtc-codes-data';
import validatedVehicles from '@/data/validated-vehicles.json';
import {
  buildWiringSeoHref,
  WIRING_SEO_VEHICLES,
  type WiringSeoVehicle,
  type WiringSystemSlug,
} from '@/data/wiring-seo-cluster';
import { getRepairTaskProfile } from '@/lib/repairTaskProfiles';

export interface DiagnosticCrossLink {
  href: string;
  label: string;
  description: string;
  badge: string;
}

interface ValidatedModelEntry {
  start: number;
  end: number;
  confirmedYears: number[];
  tasks: string[];
}

type ValidatedVehiclesMap = Record<string, Record<string, ValidatedModelEntry>>;

const VALIDATED_VEHICLES = validatedVehicles as ValidatedVehiclesMap;

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
  'Mazda',
  'Volkswagen',
  'Mercedes',
  'Lexus',
];

const PRIORITY_MAKE_RANK = new Map(PRIORITY_MAKES.map((make, index) => [make, index]));

const WIRING_SYSTEM_TO_REPAIR_TASKS: Record<WiringSystemSlug, string[]> = {
  alternator: ['alternator-replacement', 'battery-replacement', 'serpentine-belt-replacement'],
  starter: ['starter-replacement', 'battery-replacement'],
  'fuel-pump': ['fuel-pump-replacement', 'fuel-filter-replacement'],
};

const WIRING_SYSTEM_TO_SEARCH_TERMS: Record<WiringSystemSlug, string[]> = {
  alternator: ['alternator', 'charging', 'battery', 'voltage', 'regulator'],
  starter: ['starter', 'starting', 'crank', 'no start', 'solenoid'],
  'fuel-pump': ['fuel pump', 'fuel pressure', 'fuel relay', 'no start', 'stalling'],
};

function normalizeTaskLabel(task: string): string {
  return task.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function getMakeRank(make: string): number {
  return PRIORITY_MAKE_RANK.get(make) ?? 999;
}

function getRepresentativeYear(entry: ValidatedModelEntry): number {
  const confirmed = entry.confirmedYears || [];
  if (confirmed.includes(2013)) return 2013;
  return confirmed[0] || Math.min(2013, entry.end);
}

function scoreVehicle(make: string, model: string, tasks: string[], task?: string): number {
  let score = 0;
  score += Math.max(0, 40 - getMakeRank(make) * 2);
  score += Math.min(tasks.length, 20);
  if (task && tasks.includes(task)) score += 40;
  if (model.length <= 8) score += 2;
  return score;
}

function getVehiclesForTask(task: string, limit = 6): Array<{ make: string; model: string; year: number }> {
  const results: Array<{ make: string; model: string; year: number; score: number }> = [];

  for (const [make, models] of Object.entries(VALIDATED_VEHICLES)) {
    for (const [model, entry] of Object.entries(models)) {
      if (!entry.tasks.includes(task)) continue;
      results.push({
        make,
        model,
        year: getRepresentativeYear(entry),
        score: scoreVehicle(make, model, entry.tasks, task),
      });
    }
  }

  return results
    .sort((a, b) => b.score - a.score || a.make.localeCompare(b.make) || a.model.localeCompare(b.model))
    .slice(0, Math.max(1, limit))
    .map(({ make, model, year }) => ({ make, model, year }));
}

function slugifyPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function getEntryForVehicle(make: string, model: string): ValidatedModelEntry | null {
  return VALIDATED_VEHICLES[make]?.[model] || null;
}

function hasVehicleTask(vehicle: WiringSeoVehicle, task: string): boolean {
  const entry = getEntryForVehicle(vehicle.make, vehicle.model);
  return Boolean(entry && entry.tasks.includes(task));
}

function scoreCodeForSystem(code: DTCCode, system: WiringSystemSlug): number {
  let score = 0;
  if (code.repairTaskSlug && getRepairTaskProfile(code.repairTaskSlug).wiringSystems.includes(system)) score += 70;

  const haystack = `${code.title} ${code.description} ${code.commonFix} ${code.affectedSystem} ${code.symptoms.join(' ')} ${code.diagnosticSteps.join(' ')}`.toLowerCase();
  for (const term of WIRING_SYSTEM_TO_SEARCH_TERMS[system]) {
    if (haystack.includes(term.toLowerCase())) score += term.includes(' ') ? 10 : 6;
  }

  if (system === 'alternator' && /electrical|body\/electrical/i.test(code.affectedSystem)) score += 10;
  if (system === 'starter' && /electrical|engine/i.test(code.affectedSystem)) score += 10;
  if (system === 'fuel-pump' && /fuel/i.test(code.affectedSystem)) score += 10;

  return score;
}

export function getRepairLinksForCode(code: DTCCode, limit = 6): DiagnosticCrossLink[] {
  if (!code.repairTaskSlug) return [];

  return getVehiclesForTask(code.repairTaskSlug, limit).map((vehicle) => ({
    href: `/repair/${vehicle.year}/${slugifyPart(vehicle.make)}/${slugifyPart(vehicle.model)}/${code.repairTaskSlug}`,
    label: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${normalizeTaskLabel(code.repairTaskSlug!)}`,
    description: `Open the exact repair flow most commonly associated with ${code.code} on this vehicle.`,
    badge: 'Repair',
  }));
}

export function getWiringLinksForCode(code: DTCCode, limit = 6): DiagnosticCrossLink[] {
  const systems = code.repairTaskSlug ? getRepairTaskProfile(code.repairTaskSlug).wiringSystems : [];
  if (!systems.length) return [];

  const links: Array<DiagnosticCrossLink & { score: number }> = [];

  for (const system of systems) {
    for (const vehicle of WIRING_SEO_VEHICLES) {
      if (!hasVehicleTask(vehicle, code.repairTaskSlug!)) continue;
      links.push({
        href: buildWiringSeoHref(vehicle, system),
        label: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${system.replace(/-/g, ' ')} wiring`,
        description: `Open the exact ${system.replace(/-/g, ' ')} diagram cluster for a vehicle that commonly triggers ${code.code}.`,
        badge: 'Exact Wiring',
        score: Math.max(0, 40 - getMakeRank(vehicle.make) * 2) + (vehicle.year >= 2011 ? 4 : 0),
      });
    }
  }

  return links
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, Math.max(1, limit))
    .map(({ score: _score, ...link }) => link);
}

export function getRepairLinksForWiringVehicle(vehicle: WiringSeoVehicle, system: WiringSystemSlug, limit = 4): DiagnosticCrossLink[] {
  const entry = getEntryForVehicle(vehicle.make, vehicle.model);
  if (!entry) return [];

  return WIRING_SYSTEM_TO_REPAIR_TASKS[system]
    .filter((task) => entry.tasks.includes(task))
    .slice(0, Math.max(1, limit))
    .map((task) => ({
      href: `/repair/${vehicle.year}/${slugifyPart(vehicle.make)}/${slugifyPart(vehicle.model)}/${task}`,
      label: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${normalizeTaskLabel(task)}`,
      description: `Open the matching repair workflow that usually intersects with ${system.replace(/-/g, ' ')} diagnosis on this vehicle.`,
      badge: 'Repair',
    }));
}

export function getCodeLinksForWiringSystem(system: WiringSystemSlug, limit = 6): DiagnosticCrossLink[] {
  return DTC_CODES
    .map((code) => ({ code, score: scoreCodeForSystem(code, system) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.code.code.localeCompare(b.code.code))
    .slice(0, Math.max(1, limit))
    .map(({ code }) => ({
      href: `/codes/${code.code.toLowerCase()}`,
      label: `${code.code}: ${code.title}`,
      description: `${code.affectedSystem} code commonly seen during ${system.replace(/-/g, ' ')} diagnosis.`,
      badge: 'Code',
    }));
}

export function getRelatedCodeLinks(code: DTCCode, limit = 6): DiagnosticCrossLink[] {
  const direct = code.relatedCodes
    .map((relatedCode) => DTC_CODES_MAP.get(relatedCode.toUpperCase()))
    .filter((entry): entry is DTCCode => Boolean(entry))
    .slice(0, Math.max(1, limit));

  return direct.map((entry) => ({
    href: `/codes/${entry.code.toLowerCase()}`,
    label: `${entry.code}: ${entry.title}`,
    description: entry.description,
    badge: 'Related',
  }));
}
