import { VALID_TASKS, slugifyRoutePart } from '@/data/vehicles';

export interface SymptomCluster {
  slug: string;
  label: string;
  shortLabel: string;
  summary: string;
  aliases: string[];
  likelyTasks: string[];
  systems: string[];
}

const VALID_TASK_SET = new Set(VALID_TASKS);

function keepValidTasks(tasks: string[]): string[] {
  return tasks.filter((task) => VALID_TASK_SET.has(task));
}

export const SYMPTOM_CLUSTERS: SymptomCluster[] = [
  {
    slug: 'shakes-when-braking',
    label: 'Shakes when braking',
    shortLabel: 'Brake vibration',
    summary: 'Steering wheel shake, brake pedal pulsation, or front-end vibration under braking usually points to rotor, pad, or suspension-related brake issues.',
    aliases: [
      'shakes when i slam on the brakes',
      'shakes when braking',
      'vibrates under braking',
      'steering wheel shakes when braking',
      'brake pedal pulsates',
      'front end shakes when i brake',
      'brake vibration',
      'brake shake',
    ],
    likelyTasks: keepValidTasks([
      'brake-rotor-replacement',
      'brake-pad-replacement',
      'wheel-bearing-replacement',
      'tie-rod-replacement',
      'shock-absorber-replacement',
      'strut-replacement',
      'ball-joint-replacement',
    ]),
    systems: ['Brakes', 'Steering', 'Suspension'],
  },
  {
    slug: 'car-wont-start',
    label: "Car won't start",
    shortLabel: 'No-start',
    summary: 'No-crank and no-start complaints usually resolve into battery, starter, alternator, crank sensor, or fuel-delivery diagnosis.',
    aliases: [
      "car won't start",
      'won t start',
      'no start',
      'no crank',
      'clicks but wont start',
      'engine wont turn over',
      'won t crank',
      'cranks but wont start',
    ],
    likelyTasks: keepValidTasks([
      'battery-replacement',
      'starter-replacement',
      'alternator-replacement',
      'crankshaft-sensor-replacement',
      'fuel-pump-replacement',
      'ignition-coil-replacement',
      'camshaft-sensor-replacement',
    ]),
    systems: ['Starting and Charging', 'Engine', 'Fuel'],
  },
  {
    slug: 'overheating',
    label: 'Engine overheating',
    shortLabel: 'Overheating',
    summary: 'Overheating and coolant-temperature complaints usually map to thermostat, radiator, water pump, coolant flow, or fan-system faults.',
    aliases: [
      'overheating',
      'engine overheating',
      'runs hot',
      'temp gauge high',
      'car overheating at idle',
      'coolant boiling over',
      'engine temp high',
      'temperature gauge high',
    ],
    likelyTasks: keepValidTasks([
      'thermostat-replacement',
      'radiator-replacement',
      'water-pump-replacement',
      'coolant-flush',
      'head-gasket-replacement',
      'serpentine-belt-replacement',
      'drive-belt-replacement',
    ]),
    systems: ['Cooling', 'Engine'],
  },
  {
    slug: 'battery-light-on',
    label: 'Battery light on',
    shortLabel: 'Battery light',
    summary: 'A battery or charging warning light usually means alternator output, battery health, belt drive, or cable/ground faults need to be checked first.',
    aliases: [
      'battery light on',
      'charging light on',
      'battery warning light',
      'alternator light on',
      'battery not charging',
      'charge light on',
    ],
    likelyTasks: keepValidTasks([
      'alternator-replacement',
      'battery-replacement',
      'serpentine-belt-replacement',
      'drive-belt-replacement',
    ]),
    systems: ['Starting and Charging'],
  },
  {
    slug: 'rough-idle',
    label: 'Rough idle',
    shortLabel: 'Rough idle',
    summary: 'Rough idle often traces back to ignition, air metering, vacuum leaks, or timing-related faults before it becomes a full misfire complaint.',
    aliases: [
      'rough idle',
      'idles rough',
      'engine shaking at idle',
      'misfire at idle',
      'engine stumbles at idle',
      'rough running',
      'idle vibration',
    ],
    likelyTasks: keepValidTasks([
      'spark-plug-replacement',
      'ignition-coil-replacement',
      'mass-air-flow-sensor-replacement',
      'oxygen-sensor-replacement',
      'timing-chain-replacement',
      'fuel-pump-replacement',
      'crankshaft-sensor-replacement',
      'camshaft-sensor-replacement',
      'egr-valve-replacement',
    ]),
    systems: ['Ignition', 'Fuel', 'Engine'],
  },
  {
    slug: 'steers-to-the-right',
    label: 'Steers to the right',
    shortLabel: 'Pulling steering',
    summary: 'Steering pull and drift complaints commonly involve alignment, tires, tie rods, ball joints, wheel bearings, or brake drag.',
    aliases: [
      'steers to the right',
      'pulls to the right',
      'drifts right while driving',
      'car pulls to one side',
      'pulls right',
      'drifts right',
    ],
    likelyTasks: keepValidTasks([
      'tie-rod-replacement',
      'ball-joint-replacement',
      'wheel-bearing-replacement',
      'brake-pad-replacement',
      'strut-replacement',
      'shock-absorber-replacement',
      'cv-axle-replacement',
    ]),
    systems: ['Steering', 'Suspension', 'Brakes'],
  },
  {
    slug: 'squeaky-brakes',
    label: 'Squeaky brakes',
    shortLabel: 'Brake squeal',
    summary: 'Brake squeal and brake-noise complaints usually resolve into pad wear, rotor condition, hardware, or brake dust contamination.',
    aliases: [
      'squeaky brakes',
      'brake squeal',
      'brakes squeak',
      'brakes making noise',
      'squealing when braking',
      'brake noise',
      'squeal when braking',
    ],
    likelyTasks: keepValidTasks([
      'brake-pad-replacement',
      'brake-rotor-replacement',
      'brake-fluid-flush',
      'wheel-bearing-replacement',
      'shock-absorber-replacement',
      'strut-replacement',
    ]),
    systems: ['Brakes'],
  },
  {
    slug: 'transmission-slipping',
    label: 'Transmission slipping',
    shortLabel: 'Transmission slip',
    summary: 'Slipping, flare, or delayed-shift complaints usually need fluid condition, hydraulic pressure, and internal wear checks before major replacement.',
    aliases: [
      'transmission slipping',
      'gear slipping',
      'rpm flares between shifts',
      'delayed engagement',
      'slips between gears',
      'gear flare',
      'slipping gears',
    ],
    likelyTasks: keepValidTasks([
      'transmission-fluid-change',
      'clutch-replacement',
      'differential-fluid-change',
      'drive-belt-replacement',
    ]),
    systems: ['Transmission and Drivetrain'],
  },
  {
    slug: 'check-engine-light-on',
    label: 'Check engine light on',
    shortLabel: 'Check engine light',
    summary: 'A check-engine light is a graph entry point into code pages, symptom-specific diagnosis, and the exact repair categories most often associated with those failures.',
    aliases: [
      'check engine light on',
      'check engine light',
      'cel on',
      'service engine soon light',
      'engine light on',
      'malfunction indicator lamp',
    ],
    likelyTasks: keepValidTasks([
      'oxygen-sensor-replacement',
      'mass-air-flow-sensor-replacement',
      'ignition-coil-replacement',
      'spark-plug-replacement',
      'catalytic-converter-replacement',
      'crankshaft-sensor-replacement',
      'camshaft-sensor-replacement',
      'egr-valve-replacement',
    ]),
    systems: ['Engine', 'Emissions', 'Fuel', 'Ignition'],
  },
  {
    slug: 'ac-not-cold',
    label: 'AC not cold',
    shortLabel: 'Weak AC',
    summary: 'Weak air conditioning usually points to refrigerant loss, airflow issues, blower faults, or electrical problems in the HVAC circuit.',
    aliases: [
      'ac not cold',
      'air conditioning not cold',
      'ac blows warm',
      'no cold air from vents',
      'ac blows hot',
      'weak ac',
    ],
    likelyTasks: keepValidTasks([
      'serpentine-belt-replacement',
      'drive-belt-replacement',
      'cabin-air-filter-replacement',
    ]),
    systems: ['Heating and Air Conditioning'],
  },
];

function normalizeSymptomText(value: string): string {
  return slugifyRoutePart(value).replace(/-/g, ' ').trim();
}

export function getSymptomClusterBySlug(slug: string): SymptomCluster | null {
  const normalized = slugifyRoutePart(slug);
  return SYMPTOM_CLUSTERS.find((cluster) => cluster.slug === normalized) || null;
}

export function getSymptomClusterFromText(text: string): SymptomCluster | null {
  const normalized = normalizeSymptomText(text);
  if (!normalized) return null;

  const exact = SYMPTOM_CLUSTERS.find((cluster) =>
    cluster.slug === slugifyRoutePart(text) ||
    cluster.aliases.some((alias) => normalizeSymptomText(alias) === normalized) ||
    normalizeSymptomText(cluster.label) === normalized
  );
  if (exact) return exact;

  return SYMPTOM_CLUSTERS.find((cluster) =>
    cluster.aliases.some((alias) => normalized.includes(normalizeSymptomText(alias)) || normalizeSymptomText(alias).includes(normalized))
  ) || null;
}

export function getSymptomClustersForTexts(texts: string[], limit = 6): SymptomCluster[] {
  const seen = new Set<string>();
  const clusters: SymptomCluster[] = [];

  for (const text of texts) {
    const cluster = getSymptomClusterFromText(text);
    if (!cluster || seen.has(cluster.slug)) continue;
    seen.add(cluster.slug);
    clusters.push(cluster);
    if (clusters.length >= limit) break;
  }

  return clusters;
}

export function getSymptomClustersForRepairTask(task: string, texts: string[] = [], limit = 4): SymptomCluster[] {
  const normalizedTask = slugifyRoutePart(task);
  const normalizedTexts = texts
    .map((text) => normalizeSymptomText(text))
    .filter(Boolean);

  return SYMPTOM_CLUSTERS
    .map((cluster) => {
      let score = cluster.likelyTasks.includes(normalizedTask) ? 100 : 0;
      if (score === 0) return { cluster, score };

      for (const text of normalizedTexts) {
        if (normalizeSymptomText(cluster.label) === text) score += 40;
        if (normalizeSymptomText(cluster.shortLabel) === text) score += 24;
        if (cluster.aliases.some((alias) => normalizeSymptomText(alias) === text)) score += 32;
        if (cluster.aliases.some((alias) => text.includes(normalizeSymptomText(alias)))) score += 16;
        if (cluster.systems.some((system) => text.includes(normalizeSymptomText(system)))) score += 8;
      }

      return { cluster, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.cluster.label.localeCompare(right.cluster.label))
    .slice(0, limit)
    .map((entry) => entry.cluster);
}

export function buildSymptomHref(slug: string): string {
  return `/symptoms/${slugifyRoutePart(slug)}`;
}
