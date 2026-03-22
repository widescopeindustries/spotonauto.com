import 'server-only';

import * as fs from 'fs';
import * as path from 'path';
import { TIER_1_RESCUE_PAGES } from '@/data/rescuePriority';
import { slugifyRoutePart } from '@/data/vehicles';
import { buildRepairUrl, buildVehicleHubUrl } from '@/lib/vehicleIdentity';

export interface CommandCenterOpportunityTask {
  task: string;
  label: string;
  weight: number;
  cluster: string;
}

export interface CommandCenterOpportunityCluster {
  cluster: string;
  label: string;
  weight: number;
}

export interface CommandCenterOpportunitySymptomHub {
  label: string;
  href: string;
  opportunityScore: number;
  action: string;
}

export interface CommandCenterOpportunity {
  year: string;
  make: string;
  model: string;
  label: string;
  hubPath: string;
  hubUrl: string;
  score: number;
  note: string;
  query24hCount: number;
  query24hImpressions: number;
  gscCurrentImpressions: number;
  gscPreviousImpressions: number;
  gscDeltaImpressions: number;
  gscCurrentClicks: number;
  gaCurrentSessions: number;
  gaPreviousSessions: number;
  gaDeltaSessions: number;
  topTasks: CommandCenterOpportunityTask[];
  topClusters: CommandCenterOpportunityCluster[];
  symptomHubs: CommandCenterOpportunitySymptomHub[];
}

export interface CommandCenterQuerySignal {
  year: string;
  make: string;
  model: string;
  label: string;
  hubPath: string;
  hubUrl: string;
  queryCount: number;
  impressions: number;
}

export interface CommandCenterQueryClusterSummary {
  cluster: string;
  queries: number;
  clicks: number;
  impressions: number;
}

export interface HomepageMomentumLink {
  href: string;
  label: string;
}

export interface HomepageMomentumClusterCard {
  cluster: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  queries: number;
  impressions: number;
  links: HomepageMomentumLink[];
}

export interface HomepageCommandCenterCard {
  year: string;
  make: string;
  model: string;
  label: string;
  note: string;
  href: string;
  score: number;
}

export interface HomepageMomentumData {
  clusters: HomepageMomentumClusterCard[];
  commandCenters: HomepageCommandCenterCard[];
  popularRepairLinks: HomepageMomentumLink[];
}

interface CommandCenterReport {
  generatedAt?: string;
  currentRange?: {
    startDate: string;
    endDate: string;
  };
  previousRange?: {
    startDate: string;
    endDate: string;
  };
  querySnapshot?: {
    exactVehicles?: CommandCenterQuerySignal[];
    clusters?: CommandCenterQueryClusterSummary[];
  };
  homepageRecommendations?: Array<{
    year: string;
    make: string;
    model: string;
    note: string;
    hubPath: string;
    hubUrl: string;
    score: number;
  }>;
  topCommandCenters?: CommandCenterOpportunity[];
}

interface VehicleLookupOptions {
  excludeYear?: string | number;
  limit?: number;
}

const REPORTS_DIR = path.join(process.cwd(), 'scripts', 'seo-reports');
const HOMEPAGE_CLUSTER_META: Record<string, {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}> = {
  lighting: {
    eyebrow: 'Lighting',
    title: 'Headlights and tail lights',
    description: 'Open the right bulb or lamp guide before you pull trim or order parts for your vehicle.',
    href: '/repairs/headlight-bulb-replacement',
    cta: 'Browse lighting guides',
  },
  brakes: {
    eyebrow: 'Brakes',
    title: 'Pads, rotors, and brake service',
    description: 'Find the exact brake guide with the parts, tools, and first steps that fit your vehicle.',
    href: '/repairs/brake-pad-replacement',
    cta: 'Browse brake guides',
  },
  battery: {
    eyebrow: 'Battery',
    title: 'Battery and quick no-start wins',
    description: 'Check the right battery size and replacement steps before you buy parts or disconnect anything.',
    href: '/repairs/battery-replacement',
    cta: 'Browse battery guides',
  },
  oil_fluids: {
    eyebrow: 'Fluids',
    title: 'Oil, transmission fluid, and coolant',
    description: 'Get the right fluid type, quantity, and refill path before you start the job.',
    href: '/repairs/oil-change',
    cta: 'Browse fluid guides',
  },
  filters: {
    eyebrow: 'Filters',
    title: 'Filters and light maintenance',
    description: 'Start with a simple maintenance job when you want a quick win and the correct fitment fast.',
    href: '/repairs/cabin-air-filter-replacement',
    cta: 'Browse filter guides',
  },
  belts_cooling: {
    eyebrow: 'Cooling',
    title: 'Belts, thermostats, and cooling',
    description: 'Use the exact cooling or belt guide when you are chasing overheating, leaks, or belt noise.',
    href: '/repairs/water-pump-replacement',
    cta: 'Browse cooling guides',
  },
  starting_charging: {
    eyebrow: 'Starting',
    title: 'Alternators and starter checks',
    description: 'Start here when the car will not crank, will not start, or is not charging properly.',
    href: '/repairs/alternator-replacement',
    cta: 'Browse starting guides',
  },
  ignition_tuneup: {
    eyebrow: 'Tune-up',
    title: 'Spark plugs and ignition',
    description: 'Spark plug and ignition jobs get easier when the exact fitment, gap, and steps are already narrowed down.',
    href: '/repairs/spark-plug-replacement',
    cta: 'Browse ignition guides',
  },
};

let cachedReport: CommandCenterReport | null | undefined;

function normalizeVehiclePart(value: string): string {
  return slugifyRoutePart(value);
}

function yearMatches(value: string, candidate?: string | number): boolean {
  if (candidate === undefined || candidate === null) return false;
  return value === String(candidate);
}

function matchesFamily(make: string, model: string, candidateMake: string, candidateModel: string): boolean {
  return normalizeVehiclePart(make) === normalizeVehiclePart(candidateMake)
    && normalizeVehiclePart(model) === normalizeVehiclePart(candidateModel);
}

function loadReport(): CommandCenterReport | null {
  if (cachedReport !== undefined) return cachedReport;

  try {
    const latest = fs
      .readdirSync(REPORTS_DIR)
      .filter((name) => /^command-center-opportunities-\d{4}-\d{2}-\d{2}\.json$/.test(name))
      .sort()
      .at(-1);

    if (!latest) {
      cachedReport = null;
      return cachedReport;
    }

    cachedReport = JSON.parse(
      fs.readFileSync(path.join(REPORTS_DIR, latest), 'utf8'),
    ) as CommandCenterReport;
    return cachedReport;
  } catch {
    cachedReport = null;
    return cachedReport;
  }
}

export function getExactVehicleCommandCenterOpportunity(
  year: string | number,
  make: string,
  model: string,
): CommandCenterOpportunity | null {
  const report = loadReport();
  if (!report?.topCommandCenters?.length) return null;

  return report.topCommandCenters.find((entry) =>
    yearMatches(entry.year, year) && matchesFamily(make, model, entry.make, entry.model),
  ) || null;
}

export function getVehicleFamilyCommandCenterOpportunities(
  make: string,
  model: string,
  options: VehicleLookupOptions = {},
): CommandCenterOpportunity[] {
  const report = loadReport();
  if (!report?.topCommandCenters?.length) return [];

  return report.topCommandCenters
    .filter((entry) =>
      matchesFamily(make, model, entry.make, entry.model)
      && !yearMatches(entry.year, options.excludeYear),
    )
    .slice(0, options.limit ?? 6);
}

export function getVehicleFamilyQuerySignals(
  make: string,
  model: string,
  options: VehicleLookupOptions = {},
): CommandCenterQuerySignal[] {
  const report = loadReport();
  const exactVehicles = report?.querySnapshot?.exactVehicles;
  if (!exactVehicles?.length) return [];

  return exactVehicles
    .filter((entry) =>
      matchesFamily(make, model, entry.make, entry.model)
      && !yearMatches(entry.year, options.excludeYear),
    )
    .sort((left, right) =>
      right.queryCount - left.queryCount
      || right.impressions - left.impressions
      || left.label.localeCompare(right.label),
    )
    .slice(0, options.limit ?? 6);
}

function dedupeLinks(links: HomepageMomentumLink[], limit: number): HomepageMomentumLink[] {
  const out: HomepageMomentumLink[] = [];
  const seen = new Set<string>();

  for (const link of links) {
    if (!link.href || seen.has(link.href)) continue;
    seen.add(link.href);
    out.push(link);
    if (out.length >= limit) break;
  }

  return out;
}

function toSentenceList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function buildHomepageCommandCenterNote(opportunity?: CommandCenterOpportunity): string {
  const tasks = opportunity?.topTasks
    ?.slice(0, 3)
    .map((task) => task.label.toLowerCase()) || [];

  if (tasks.length > 0) {
    return `Open this exact vehicle hub first for ${toSentenceList(tasks)}.`;
  }

  return 'Open this exact vehicle hub first for common repairs, wiring, codes, and diagnosis paths.';
}

function buildFallbackCommandCenters(): HomepageCommandCenterCard[] {
  const seen = new Set<string>();
  const out: HomepageCommandCenterCard[] = [];

  for (const entry of TIER_1_RESCUE_PAGES) {
    const key = `${entry.year}:${normalizeVehiclePart(entry.make)}:${normalizeVehiclePart(entry.model)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      year: String(entry.year),
      make: entry.make,
      model: entry.model,
      label: `${entry.year} ${entry.make} ${entry.model}`,
      note: 'Open this exact vehicle hub first for common repairs, wiring, codes, and diagnosis paths.',
      href: buildVehicleHubUrl(entry.year, entry.make, entry.model),
      score: 0,
    });
    if (out.length >= 2) break;
  }

  return out;
}

function buildFallbackPopularRepairLinks(): HomepageMomentumLink[] {
  return TIER_1_RESCUE_PAGES.slice(0, 5).map((entry) => ({
    href: entry.href,
    label: `${entry.year} ${entry.make} ${entry.model} ${entry.task.replace(/-/g, ' ')}`,
  }));
}

export function getHomepageMomentumData(): HomepageMomentumData {
  const report = loadReport();
  const clusterSummaries = report?.querySnapshot?.clusters || [];
  const topCommandCenters = report?.topCommandCenters || [];

  const clusters = clusterSummaries
    .filter((entry) => entry.cluster in HOMEPAGE_CLUSTER_META)
    .sort((left, right) => right.impressions - left.impressions || right.queries - left.queries)
    .slice(0, 5)
    .map((entry) => {
      const meta = HOMEPAGE_CLUSTER_META[entry.cluster];
      const links = dedupeLinks(
        topCommandCenters.flatMap((vehicle) =>
          vehicle.topTasks
            .filter((task) => task.cluster === entry.cluster)
            .map((task) => ({
              href: buildRepairUrl(vehicle.year, vehicle.make, vehicle.model, task.task),
              label: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${task.label}`,
            })),
        ),
        3,
      );

      return {
        cluster: entry.cluster,
        eyebrow: meta.eyebrow,
        title: meta.title,
        description: meta.description,
        href: meta.href,
        cta: meta.cta,
        queries: entry.queries,
        impressions: entry.impressions,
        links,
      };
    });

  const commandCenters = (report?.homepageRecommendations || [])
    .map((entry) => {
      const matchingOpportunity = topCommandCenters.find((candidate) =>
        candidate.year === entry.year
        && matchesFamily(entry.make, entry.model, candidate.make, candidate.model),
      );

      return {
        year: entry.year,
        make: entry.make,
        model: entry.model,
        label: `${entry.year} ${entry.make} ${entry.model}`,
        note: buildHomepageCommandCenterNote(matchingOpportunity),
        href: entry.hubPath || buildVehicleHubUrl(entry.year, entry.make, entry.model),
        score: entry.score,
      };
    });

  const popularRepairLinks = dedupeLinks(
    clusters.flatMap((cluster) => cluster.links),
    5,
  );

  return {
    clusters: clusters.length > 0
      ? clusters
      : Object.entries(HOMEPAGE_CLUSTER_META).slice(0, 5).map(([cluster, meta]) => ({
        cluster,
        eyebrow: meta.eyebrow,
        title: meta.title,
        description: meta.description,
        href: meta.href,
        cta: meta.cta,
        queries: 0,
        impressions: 0,
        links: [],
      })),
    commandCenters: commandCenters.length > 0 ? commandCenters : buildFallbackCommandCenters(),
    popularRepairLinks: popularRepairLinks.length > 0 ? popularRepairLinks : buildFallbackPopularRepairLinks(),
  };
}
