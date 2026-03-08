export interface WiringSeoVehicle {
  year: number;
  make: string;
  model: string;
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

export const WIRING_SEO_VEHICLES: WiringSeoVehicle[] = [
  { year: 2012, make: 'Ford', model: 'Fusion' },
  { year: 2012, make: 'Ford', model: 'Taurus' },
  { year: 2010, make: 'Honda', model: 'Accord' },
  { year: 2010, make: 'Honda', model: 'Civic' },
  { year: 2011, make: 'Chevrolet', model: 'Cruze' },
  { year: 2011, make: 'Chevrolet', model: 'Malibu' },
  { year: 2011, make: 'Chevrolet', model: 'Impala' },
  { year: 2011, make: 'Chevrolet', model: 'Camaro' },
  { year: 2011, make: 'GMC Truck', model: 'Sierra 1500' },
  { year: 2011, make: 'GMC Truck', model: 'Yukon' },
  { year: 2012, make: 'Acura', model: 'TL' },
  { year: 2012, make: 'Acura', model: 'TSX' },
  { year: 2011, make: 'Kia', model: 'Optima' },
  { year: 2011, make: 'Hyundai', model: 'Sonata' },
  { year: 2011, make: 'Hyundai', model: 'Elantra' },
  { year: 2010, make: 'Subaru', model: 'Outback' },
  { year: 2011, make: 'Lincoln', model: 'MKZ' },
];

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

export function slugifyWiringSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getWiringSeoPaths(): Array<{
  year: string;
  make: string;
  model: string;
  system: WiringSystemSlug;
}> {
  const systems = Object.keys(WIRING_SEO_SYSTEMS) as WiringSystemSlug[];
  const paths: Array<{ year: string; make: string; model: string; system: WiringSystemSlug }> = [];

  for (const vehicle of WIRING_SEO_VEHICLES) {
    for (const system of systems) {
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

  for (const vehicle of WIRING_SEO_VEHICLES) {
    if (
      vehicle.year === targetYear &&
      slugifyWiringSegment(vehicle.make) === makeSlug &&
      slugifyWiringSegment(vehicle.model) === modelSlug
    ) {
      return vehicle;
    }
  }

  return null;
}

export function buildWiringSeoHref(vehicle: WiringSeoVehicle, system: WiringSystemSlug): string {
  return `/wiring/${vehicle.year}/${slugifyWiringSegment(vehicle.make)}/${slugifyWiringSegment(vehicle.model)}/${system}`;
}
