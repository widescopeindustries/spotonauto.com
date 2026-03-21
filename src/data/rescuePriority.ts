import { slugifyRoutePart } from '@/data/vehicles';

export interface RescuePriorityEntry {
  href: string;
  year: number;
  make: string;
  model: string;
  task: string;
  tier: 1;
}

export const TIER_1_RESCUE_PAGES: RescuePriorityEntry[] = [
  {
    href: '/repair/2013/honda/cr-v/spark-plug-replacement',
    year: 2013,
    make: 'Honda',
    model: 'CR-V',
    task: 'spark-plug-replacement',
    tier: 1,
  },
  {
    href: '/repair/2013/toyota/corolla/starter-replacement',
    year: 2013,
    make: 'Toyota',
    model: 'Corolla',
    task: 'starter-replacement',
    tier: 1,
  },
  {
    href: '/repair/2007/subaru/outback/water-pump-replacement',
    year: 2007,
    make: 'Subaru',
    model: 'Outback',
    task: 'water-pump-replacement',
    tier: 1,
  },
  {
    href: '/repair/1996/toyota/corolla/thermostat-replacement',
    year: 1996,
    make: 'Toyota',
    model: 'Corolla',
    task: 'thermostat-replacement',
    tier: 1,
  },
  {
    href: '/repair/2012/hyundai/elantra/spark-plug-replacement',
    year: 2012,
    make: 'Hyundai',
    model: 'Elantra',
    task: 'spark-plug-replacement',
    tier: 1,
  },
  {
    href: '/repair/2013/honda/cr-v/oil-change',
    year: 2013,
    make: 'Honda',
    model: 'CR-V',
    task: 'oil-change',
    tier: 1,
  },
  {
    href: '/repair/2010/toyota/corolla/spark-plug-replacement',
    year: 2010,
    make: 'Toyota',
    model: 'Corolla',
    task: 'spark-plug-replacement',
    tier: 1,
  },
  {
    href: '/repair/2012/hyundai/tucson/alternator-replacement',
    year: 2012,
    make: 'Hyundai',
    model: 'Tucson',
    task: 'alternator-replacement',
    tier: 1,
  },
  {
    href: '/repair/2010/honda/cr-v/battery-replacement',
    year: 2010,
    make: 'Honda',
    model: 'CR-V',
    task: 'battery-replacement',
    tier: 1,
  },
  {
    href: '/repair/2013/ford/fusion/starter-replacement',
    year: 2013,
    make: 'Ford',
    model: 'Fusion',
    task: 'starter-replacement',
    tier: 1,
  },
  {
    href: '/repair/2012/ford/fusion/oil-change',
    year: 2012,
    make: 'Ford',
    model: 'Fusion',
    task: 'oil-change',
    tier: 1,
  },
  {
    href: '/repair/2005/ford/f-150/oil-change',
    year: 2005,
    make: 'Ford',
    model: 'F-150',
    task: 'oil-change',
    tier: 1,
  },
  {
    href: '/repair/2012/ford/f-150/thermostat-replacement',
    year: 2012,
    make: 'Ford',
    model: 'F-150',
    task: 'thermostat-replacement',
    tier: 1,
  },
  {
    href: '/repair/2013/honda/odyssey/spark-plug-replacement',
    year: 2013,
    make: 'Honda',
    model: 'Odyssey',
    task: 'spark-plug-replacement',
    tier: 1,
  },
  {
    href: '/repair/2011/ford/f-150/thermostat-replacement',
    year: 2011,
    make: 'Ford',
    model: 'F-150',
    task: 'thermostat-replacement',
    tier: 1,
  },
];

export function getTier1RescuePagesForTask(task: string): RescuePriorityEntry[] {
  return TIER_1_RESCUE_PAGES.filter((entry) => entry.task === task);
}

function normalizeHref(value: string): string {
  return value.replace(/\/+$/, '');
}

function normalizeKey(value: string): string {
  return slugifyRoutePart(value);
}

export function isTier1RescueHref(href: string): boolean {
  const normalizedHref = normalizeHref(href);
  return TIER_1_RESCUE_PAGES.some((entry) => normalizeHref(entry.href) === normalizedHref);
}

export function getTier1RescueEntryByHref(href: string): RescuePriorityEntry | null {
  const normalizedHref = normalizeHref(href);
  return TIER_1_RESCUE_PAGES.find((entry) => normalizeHref(entry.href) === normalizedHref) || null;
}

export function getTier1RescuePagesForVehicle(make: string, model: string): RescuePriorityEntry[] {
  const normalizedMake = normalizeKey(make);
  const normalizedModel = normalizeKey(model);

  return TIER_1_RESCUE_PAGES.filter((entry) =>
    normalizeKey(entry.make) === normalizedMake &&
    normalizeKey(entry.model) === normalizedModel
  );
}

export function getTier1RescuePagesForExactVehicle(year: string | number, make: string, model: string): RescuePriorityEntry[] {
  const normalizedYear = Number(year);
  return getTier1RescuePagesForVehicle(make, model).filter((entry) => entry.year === normalizedYear);
}
