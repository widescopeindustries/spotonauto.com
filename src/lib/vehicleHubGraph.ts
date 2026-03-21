import 'server-only';

import { buildSymptomHref } from '@/data/symptomGraph';
import {
  NOINDEX_MAKES,
  VALID_TASKS,
  VEHICLE_PRODUCTION_YEARS,
  slugifyRoutePart,
} from '@/data/vehicles';
import {
  TOOL_TYPE_META,
  getToolPagesForVehicle,
} from '@/data/tools-pages';
import {
  WIRING_SEO_SYSTEMS,
  buildWiringSeoHref,
  findWiringSeoVehicleBySlug,
  type WiringSystemSlug,
} from '@/data/wiring-seo-cluster';
import { getCodeLinksForWiringSystem } from '@/lib/diagnosticCrossLinks';
import { getPriorityCodePagesForTasks, getPrioritySymptomHubsForTasks } from '@/lib/graphPriorityLinks';
import {
  type KnowledgeGraphReference,
  buildCodeNodeId,
  buildEdgeReference,
  buildManualNodeId,
  buildRepairNodeId,
  buildSymptomNodeId,
  buildToolNodeId,
  buildWiringNodeId,
} from '@/lib/knowledgeGraph';
import { buildRepairUrl, buildVehicleNodeId } from '@/lib/vehicleIdentity';

export type VehicleHubKind = 'manual' | 'tool' | 'wiring' | 'dtc' | 'repair' | 'symptom';
export type VehicleHubTheme = 'cyan' | 'emerald' | 'amber' | 'violet' | 'slate';

export interface VehicleHubNode extends KnowledgeGraphReference {
  kind: VehicleHubKind;
  href: string;
  label: string;
  description: string;
  badge: string;
}

export interface VehicleHubGroup {
  kind: VehicleHubKind;
  title: string;
  browseHref?: string;
  theme: VehicleHubTheme;
  nodes: VehicleHubNode[];
}

export interface VehicleHubGraph {
  groups: VehicleHubGroup[];
  totalNodes: number;
  repairCount: number;
  wiringCount: number;
  toolCount: number;
  codeCount: number;
  symptomCount: number;
}

const PRIORITY_TASKS = [
  'battery-replacement',
  'alternator-replacement',
  'starter-replacement',
  'oil-change',
  'brake-pad-replacement',
  'spark-plug-replacement',
  'serpentine-belt-replacement',
  'thermostat-replacement',
  'headlight-bulb-replacement',
  'radiator-replacement',
  'engine-air-filter-replacement',
  'cabin-air-filter-replacement',
];

function toTaskLabel(task: string): string {
  return task.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function getVehicleProductionRange(make: string, model: string) {
  const makeEntry = Object.entries(VEHICLE_PRODUCTION_YEARS).find(
    ([displayMake]) => slugifyRoutePart(displayMake) === slugifyRoutePart(make),
  );
  if (!makeEntry) return null;

  const [, models] = makeEntry;
  const modelEntry = Object.entries(models).find(
    ([displayModel]) => slugifyRoutePart(displayModel) === slugifyRoutePart(model),
  );
  if (!modelEntry) return null;

  return modelEntry[1];
}

function getOrderedVehicleTasks(year: string, make: string, model: string): string[] {
  const production = getVehicleProductionRange(make, model);
  const yearNum = Number(year);
  if (!production || !Number.isInteger(yearNum)) return [];
  if (yearNum < production.start || yearNum > production.end) return [];

  const ordered = [...PRIORITY_TASKS, ...VALID_TASKS];
  return Array.from(new Set(ordered));
}

function getRepairNodes(args: {
  year: string;
  make: string;
  model: string;
  displayMake: string;
  displayModel: string;
  limit: number;
}): VehicleHubNode[] {
  const sourceNodeId = buildVehicleNodeId(args.year, args.make, args.model);

  return getOrderedVehicleTasks(args.year, args.make, args.model)
    .slice(0, Math.max(1, args.limit))
    .map((task) => ({
      ...buildEdgeReference({
        sourceNodeId,
        targetNodeId: buildRepairNodeId(args.year, args.make, args.model, task),
        relation: 'has-repair',
        year: args.year,
        make: args.make,
        model: args.model,
        task,
      }),
      kind: 'repair',
      href: buildRepairUrl(args.year, args.make, args.model, task),
      label: `${args.year} ${args.displayMake} ${args.displayModel} ${toTaskLabel(task)}`,
      description: `Open the exact ${task.replace(/-/g, ' ')} workflow for this vehicle.`,
      badge: 'Exact Repair',
    }));
}

function getManualNodes(args: {
  year: string;
  displayMake: string;
  displayModel: string;
  sourceNodeId: string;
}): VehicleHubNode[] {
  const makeHref = `/manual/${encodeURIComponent(args.displayMake)}`;
  const yearHref = `/manual/${encodeURIComponent(args.displayMake)}/${encodeURIComponent(args.year)}`;

  return [
    {
      ...buildEdgeReference({
        sourceNodeId: args.sourceNodeId,
        targetNodeId: buildManualNodeId(args.displayMake),
        relation: 'has-manual',
        year: args.year,
        make: args.displayMake,
        model: args.displayModel,
      }),
      kind: 'manual',
      href: makeHref,
      label: `${args.displayMake} Factory Manual Archive`,
      description: `Browse the full factory manual tree for ${args.displayMake} vehicles.`,
      badge: 'OEM Archive',
    },
    {
      ...buildEdgeReference({
        sourceNodeId: args.sourceNodeId,
        targetNodeId: buildManualNodeId(`${args.displayMake}/${args.year}`),
        relation: 'has-manual',
        year: args.year,
        make: args.displayMake,
        model: args.displayModel,
      }),
      kind: 'manual',
      href: yearHref,
      label: `${args.year} ${args.displayMake} Factory Manual Index`,
      description: `Open the ${args.year} factory service manual index and drill down into the procedures that match ${args.displayModel}.`,
      badge: 'Year Index',
    },
  ];
}

function getToolNodes(args: {
  year: string;
  make: string;
  model: string;
  displayMake: string;
  displayModel: string;
  sourceNodeId: string;
  limit: number;
}): VehicleHubNode[] {
  if (NOINDEX_MAKES.has(slugifyRoutePart(args.make))) return [];

  return getToolPagesForVehicle(args.displayMake, args.displayModel)
    .slice(0, Math.max(1, args.limit))
    .map((page) => ({
      ...buildEdgeReference({
        sourceNodeId: args.sourceNodeId,
        targetNodeId: buildToolNodeId(`/tools/${page.slug}`),
        relation: 'has-tool',
        year: args.year,
        make: args.displayMake,
        model: args.displayModel,
      }),
      kind: 'tool',
      href: `/tools/${page.slug}`,
      label: `${args.displayMake} ${args.displayModel} ${TOOL_TYPE_META[page.toolType]?.label || 'Spec Page'}`,
      description: page.quickAnswer,
      badge: TOOL_TYPE_META[page.toolType]?.icon || 'REF',
    }));
}

function getSymptomNodes(args: {
  sourceNodeId: string;
  tasks: string[];
  limit: number;
}): VehicleHubNode[] {
  return getPrioritySymptomHubsForTasks(args.tasks, Math.max(1, args.limit))
    .map((entry) => ({
      ...buildEdgeReference({
        sourceNodeId: args.sourceNodeId,
        targetNodeId: buildSymptomNodeId(entry.symptomSlug),
        relation: 'has-symptom',
      }),
      kind: 'symptom' as const,
      href: buildSymptomHref(entry.symptomSlug),
      label: entry.label,
      description: `${entry.summary} Likely systems: ${entry.systems.slice(0, 3).join(', ')}.`,
      badge: 'Symptom Hub',
    }));
}

function getWiringNodes(args: {
  year: string;
  make: string;
  model: string;
  displayMake: string;
  displayModel: string;
  sourceNodeId: string;
}): VehicleHubNode[] {
  const exactVehicle = findWiringSeoVehicleBySlug(args.year, slugifyRoutePart(args.make), slugifyRoutePart(args.model));
  if (!exactVehicle) return [];

  return exactVehicle.systems.map((system) => ({
    ...buildEdgeReference({
      sourceNodeId: args.sourceNodeId,
      targetNodeId: buildWiringNodeId(exactVehicle.year, exactVehicle.make, exactVehicle.model, system),
      relation: 'has-wiring',
      year: exactVehicle.year,
      make: exactVehicle.make,
      model: exactVehicle.model,
      system,
    }),
    kind: 'wiring',
    href: buildWiringSeoHref(exactVehicle, system),
    label: `${args.year} ${args.displayMake} ${args.displayModel} ${WIRING_SEO_SYSTEMS[system].title}`,
    description: `Open the exact ${WIRING_SEO_SYSTEMS[system].shortLabel.toLowerCase()} diagram cluster for this vehicle.`,
    badge: 'Exact Wiring',
  }));
}

function getCodeNodes(args: {
  year: string;
  displayMake: string;
  displayModel: string;
  sourceNodeId: string;
  systems: WiringSystemSlug[];
  tasks: string[];
  limit: number;
}): VehicleHubNode[] {
  const codeMap = new Map<string, { label: string; href: string; systems: Set<string> }>();

  for (const system of args.systems) {
    for (const link of getCodeLinksForWiringSystem(system, args.limit)) {
      const code = link.label.split(':')[0]?.trim();
      if (!code) continue;
      const existing = codeMap.get(code) || {
        label: link.label,
        href: link.href,
        systems: new Set<string>(),
      };
      existing.systems.add(WIRING_SEO_SYSTEMS[system].shortLabel);
      codeMap.set(code, existing);
    }
  }

  if (codeMap.size < args.limit) {
    for (const entry of getPriorityCodePagesForTasks(args.tasks, Math.max(args.limit * 2, 8))) {
      if (codeMap.has(entry.code)) continue;

      codeMap.set(entry.code, {
        label: entry.label,
        href: entry.href,
        systems: new Set([
          entry.affectedSystem,
          ...(entry.symptoms.slice(0, 2)),
        ]),
      });
    }
  }

  return [...codeMap.entries()]
    .sort((a, b) => b[1].systems.size - a[1].systems.size || a[0].localeCompare(b[0]))
    .slice(0, Math.max(1, args.limit))
    .map(([code, entry]) => ({
      ...buildEdgeReference({
        sourceNodeId: args.sourceNodeId,
        targetNodeId: buildCodeNodeId(code),
        relation: 'has-code',
        year: args.year,
        make: args.displayMake,
        model: args.displayModel,
        code,
      }),
      kind: 'dtc',
      href: entry.href,
      label: entry.label,
      description: `Trouble code cluster tied to this vehicle’s ${[...entry.systems].join(', ').toLowerCase()} diagnostics.`,
      badge: entry.systems.size > 1 ? 'Multi-System' : 'Code',
    }));
}

export async function buildVehicleHubGraph(args: {
  year: string;
  make: string;
  model: string;
  displayMake: string;
  displayModel: string;
}): Promise<VehicleHubGraph> {
  const sourceNodeId = buildVehicleNodeId(args.year, args.make, args.model);
  const orderedTasks = getOrderedVehicleTasks(args.year, args.make, args.model).slice(0, 12);
  const repairNodes = getRepairNodes({ ...args, limit: 12 });
  const manualNodes = getManualNodes({
    year: args.year,
    displayMake: args.displayMake,
    displayModel: args.displayModel,
    sourceNodeId,
  });
  const toolNodes = getToolNodes({ ...args, sourceNodeId, limit: 6 });
  const symptomNodes = getSymptomNodes({
    sourceNodeId,
    tasks: orderedTasks,
    limit: 4,
  });
  const wiringNodes = getWiringNodes({ ...args, sourceNodeId });
  const codeNodes = getCodeNodes({
    year: args.year,
    displayMake: args.displayMake,
    displayModel: args.displayModel,
    sourceNodeId,
    systems: wiringNodes
      .map((node) => node.systemNodeId?.replace(/^system:/, '') as WiringSystemSlug | undefined)
      .filter((value): value is WiringSystemSlug => Boolean(value)),
    tasks: orderedTasks,
    limit: 8,
  });

  const groups: VehicleHubGroup[] = [
    ...(repairNodes.length > 0 ? [{
      kind: 'repair' as const,
      title: 'Exact Repair Workflows',
      browseHref: '/repairs',
      theme: 'cyan' as const,
      nodes: repairNodes,
    }] : []),
    ...(wiringNodes.length > 0 ? [{
      kind: 'wiring' as const,
      title: 'Exact Wiring Diagram Paths',
      browseHref: '/wiring',
      theme: 'violet' as const,
      nodes: wiringNodes,
    }] : []),
    ...(manualNodes.length > 0 ? [{
      kind: 'manual' as const,
      title: 'Factory Manual Paths',
      browseHref: '/manual',
      theme: 'slate' as const,
      nodes: manualNodes,
    }] : []),
    ...(symptomNodes.length > 0 ? [{
      kind: 'symptom' as const,
      title: 'Shared Symptom Entry Points',
      browseHref: '/symptoms',
      theme: 'amber' as const,
      nodes: symptomNodes,
    }] : []),
    ...(toolNodes.length > 0 ? [{
      kind: 'tool' as const,
      title: 'Specs, Fitment, and Reference Pages',
      browseHref: '/tools',
      theme: 'emerald' as const,
      nodes: toolNodes,
    }] : []),
    ...(codeNodes.length > 0 ? [{
      kind: 'dtc' as const,
      title: 'Likely Trouble Code Clusters',
      browseHref: '/codes',
      theme: 'amber' as const,
      nodes: codeNodes,
    }] : []),
  ];

  return {
    groups,
    totalNodes: groups.reduce((sum, group) => sum + group.nodes.length, 0),
    repairCount: repairNodes.length,
    wiringCount: wiringNodes.length,
    toolCount: toolNodes.length,
    codeCount: codeNodes.length,
    symptomCount: symptomNodes.length,
  };
}
