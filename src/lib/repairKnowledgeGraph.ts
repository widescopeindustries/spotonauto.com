import { DTC_CODES, type DTCCode } from '@/data/dtc-codes-data';
import {
  getRelatedToolLinksForRepair,
  TOOL_TYPE_META,
} from '@/data/tools-pages';
import type { VehicleRepairSpec } from '@/data/vehicle-repair-specs';
import {
  buildWiringSeoHref,
  getPriorityWiringSeoVehicles,
  slugifyWiringSegment,
  supportsWiringSystem,
  WIRING_SEO_SYSTEMS,
  WIRING_SEO_VEHICLES,
  type WiringSeoVehicle,
  type WiringSystemSlug,
} from '@/data/wiring-seo-cluster';
import { fetchCharmPage, type CharmLink } from '@/lib/charmParser';
import {
  type KnowledgeGraphReference,
  buildCodeNodeId,
  buildEdgeReference,
  buildManualNodeId,
  buildRepairNodeId,
  buildSpecNodeId,
  buildTaskNodeId,
  buildToolNodeId,
  buildWiringNodeId,
} from '@/lib/knowledgeGraph';
import { getManualSectionLinksForRepair } from '@/lib/manualSectionLinks';
import { rankKnowledgeGraphNodesHybrid } from '@/lib/knowledgeGraphRanking';
import { getRepairTaskProfile, type RepairTaskProfile } from '@/lib/repairTaskProfiles';

export type RepairKnowledgeKind = 'manual' | 'spec' | 'tool' | 'wiring' | 'dtc';
export type RepairKnowledgeTheme = 'cyan' | 'emerald' | 'amber' | 'violet' | 'slate';

export interface RepairKnowledgeNode extends KnowledgeGraphReference {
  kind: RepairKnowledgeKind;
  href: string;
  label: string;
  description: string;
  badge: string;
  score: number;
}

export interface RepairKnowledgeGroup {
  kind: RepairKnowledgeKind;
  title: string;
  browseHref?: string;
  theme: RepairKnowledgeTheme;
  nodes: RepairKnowledgeNode[];
}

export interface RepairKnowledgeGraph {
  groups: RepairKnowledgeGroup[];
  totalNodes: number;
}

interface ManualCandidate {
  href: string;
  label: string;
  fullLabel: string;
}

const DTC_SEVERITY_RANK: Record<DTCCode['severity'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

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

function buildWiringBrowserHref(
  year: string,
  displayMake: string,
  displayModel: string,
  system: WiringSystemSlug,
): string {
  const params = new URLSearchParams({
    year,
    make: displayMake,
    model: displayModel,
    q: WIRING_SEO_SYSTEMS[system].shortLabel,
    open: '1',
  });
  return `/wiring?${params.toString()}#diagram-browser`;
}

function getWiringNodes(args: {
  year: string;
  make: string;
  displayMake: string;
  model: string;
  displayModel: string;
  task: string;
}): RepairKnowledgeNode[] {
  const profile = getRepairTaskProfile(args.task);
  if (!profile.wiringSystems.length) return [];
  const sourceNodeId = buildRepairNodeId(args.year, args.displayMake, args.displayModel, args.task);

  const exactVehicle = getExactWiringVehicle(
    args.year,
    args.make,
    args.displayMake,
    args.model,
    args.displayModel,
  );

  return profile.wiringSystems.flatMap((system, index) => {
    const meta = WIRING_SEO_SYSTEMS[system];
    const exact = Boolean(exactVehicle && supportsWiringSystem(exactVehicle, system));
    const primaryNode: RepairKnowledgeNode = {
      ...buildEdgeReference({
        sourceNodeId,
        targetNodeId: buildWiringNodeId(
          exactVehicle?.year || args.year,
          exactVehicle?.make || args.displayMake,
          exactVehicle?.model || args.displayModel,
          system,
        ),
        relation: 'has-wiring',
        year: exactVehicle?.year || args.year,
        make: exactVehicle?.make || args.displayMake,
        model: exactVehicle?.model || args.displayModel,
        task: args.task,
        system,
      }),
      kind: 'wiring',
      href: exactVehicle && supportsWiringSystem(exactVehicle, system)
        ? buildWiringSeoHref(exactVehicle, system)
        : buildWiringBrowserHref(args.year, args.displayMake, args.displayModel, system),
      label: exact ? meta.title : `${meta.shortLabel} Wiring Browser`,
      description: exact
        ? `Open OEM-style ${meta.shortLabel.toLowerCase()} schematics for this exact vehicle.`
        : `Open the wiring browser prefilled for ${meta.shortLabel.toLowerCase()} diagnosis on this vehicle.`,
      badge: exact ? 'Exact Vehicle' : 'Prefilled Browser',
      score: exact ? 96 - index : 72 - index,
    };

    if (exact) {
      return [primaryNode];
    }

    const referenceVehicle = getPriorityWiringSeoVehicles({
      system,
      task: args.task,
      make: args.displayMake,
      year: Number(args.year),
      limit: 1,
    })[0];

    if (!referenceVehicle) {
      return [primaryNode];
    }

    return [
      primaryNode,
      {
        ...buildEdgeReference({
          sourceNodeId,
          targetNodeId: buildWiringNodeId(referenceVehicle.year, referenceVehicle.make, referenceVehicle.model, system),
          relation: 'has-wiring',
          year: referenceVehicle.year,
          make: referenceVehicle.make,
          model: referenceVehicle.model,
          task: args.task,
          system,
        }),
        kind: 'wiring',
        href: buildWiringSeoHref(referenceVehicle, system),
        label: `${referenceVehicle.year} ${referenceVehicle.make} ${referenceVehicle.model} ${meta.title}`,
        description: `Verified ${meta.shortLabel.toLowerCase()} entry page tied to a strong matching repair cluster.`,
        badge: 'Verified Reference',
        score: 66 - index,
      },
    ];
  });
}

function scoreDtc(code: DTCCode, task: string, profile: RepairTaskProfile): number {
  let score = 0;
  if (code.repairTaskSlug === task) score += 100;
  if (profile.dtcSystems.includes(code.affectedSystem)) score += 24;

  const haystack = normalizeText([
    code.title,
    code.description,
    code.commonFix,
    ...code.symptoms,
    ...code.diagnosticSteps,
    ...code.commonCauses.map((cause) => cause.cause),
  ].join(' '));

  for (const keyword of profile.keywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) continue;
    if (haystack.includes(normalizedKeyword)) score += normalizedKeyword.includes(' ') ? 14 : 8;
  }

  return score;
}

function getDtcNodes(task: string, limit: number): RepairKnowledgeNode[] {
  const profile = getRepairTaskProfile(task);

  return DTC_CODES
    .map((code) => ({ code, score: scoreDtc(code, task, profile) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const severityDiff = DTC_SEVERITY_RANK[a.code.severity] - DTC_SEVERITY_RANK[b.code.severity];
      if (severityDiff !== 0) return severityDiff;
      return a.code.code.localeCompare(b.code.code);
    })
    .slice(0, limit)
    .map(({ code, score }) => ({
      ...buildEdgeReference({
        sourceNodeId: buildTaskNodeId(task),
        targetNodeId: buildCodeNodeId(code.code),
        relation: 'has-code',
        task,
        code: code.code,
      }),
      kind: 'dtc' as const,
      href: `/codes/${code.code.toLowerCase()}`,
      label: `${code.code}: ${code.title}`,
      description: `${code.affectedSystem} code. ${code.commonFix}`,
      badge: code.severity.toUpperCase(),
      score,
    }));
}

function getToolNodes(year: string, displayMake: string, displayModel: string, task: string): RepairKnowledgeNode[] {
  const sourceNodeId = buildRepairNodeId(year, displayMake, displayModel, task);
  return getRelatedToolLinksForRepair(displayMake, displayModel, task, 5).map((link, index) => ({
    ...buildEdgeReference({
      sourceNodeId,
      targetNodeId: buildToolNodeId(link.href),
      relation: 'has-tool',
      year,
      make: displayMake,
      model: displayModel,
      task,
    }),
    kind: 'tool',
    href: link.href,
    label: `${displayMake} ${displayModel} ${link.label}`,
    description: `Open the ${TOOL_TYPE_META[link.toolType]?.label.toLowerCase() || 'spec'} page for this vehicle.`,
    badge: TOOL_TYPE_META[link.toolType]?.icon || 'REF',
    score: 78 - index,
  }));
}

function clip(value: string, maxLength: number = 110): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function getSpecNodes(
  year: string,
  displayMake: string,
  displayModel: string,
  task: string,
  repairTools: string[],
  vehicleSpec?: VehicleRepairSpec,
): RepairKnowledgeNode[] {
  const nodes: RepairKnowledgeNode[] = [];
  const sourceNodeId = buildRepairNodeId(year, displayMake, displayModel, task);

  if (vehicleSpec?.torqueSpecs) {
    nodes.push({
      ...buildEdgeReference({
        sourceNodeId,
        targetNodeId: buildSpecNodeId(sourceNodeId, 'torque-specs'),
        relation: 'has-spec',
        year,
        make: displayMake,
        model: displayModel,
        task,
      }),
      kind: 'spec',
      href: '#vehicle-specific-data',
      label: 'Torque Specs & Vehicle Notes',
      description: clip(vehicleSpec.torqueSpecs),
      badge: 'On Page',
      score: 98,
    });
  }

  if (vehicleSpec?.parts?.length) {
    const partSummary = vehicleSpec.parts
      .slice(0, 2)
      .map((part) => part.aftermarket || part.oem || part.name)
      .join(' · ');
    nodes.push({
      ...buildEdgeReference({
        sourceNodeId,
        targetNodeId: buildSpecNodeId(sourceNodeId, 'parts-fitment'),
        relation: 'has-spec',
        year,
        make: displayMake,
        model: displayModel,
        task,
      }),
      kind: 'spec',
      href: '#parts-needed',
      label: 'OEM Part Numbers & Fitment',
      description: partSummary ? `Key parts: ${partSummary}.` : 'Jump to the parts list and fitment notes for this job.',
      badge: 'On Page',
      score: 94,
    });
  }

  if (repairTools.length > 0) {
    nodes.push({
      ...buildEdgeReference({
        sourceNodeId,
        targetNodeId: buildSpecNodeId(sourceNodeId, 'tools-required'),
        relation: 'has-spec',
        year,
        make: displayMake,
        model: displayModel,
        task,
      }),
      kind: 'spec',
      href: '#tools-required',
      label: `${task.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())} Tools`,
      description: `Jump to the required tool list for this repair: ${clip(repairTools.slice(0, 3).join(', '), 90)}`,
      badge: 'On Page',
      score: 88,
    });
  }

  if (vehicleSpec?.beltRouting) {
    nodes.push({
      ...buildEdgeReference({
        sourceNodeId,
        targetNodeId: buildSpecNodeId(sourceNodeId, 'belt-routing'),
        relation: 'has-spec',
        year,
        make: displayMake,
        model: displayModel,
        task,
      }),
      kind: 'spec',
      href: '#vehicle-specific-data',
      label: 'Belt Routing Reference',
      description: clip(vehicleSpec.beltRouting),
      badge: 'On Page',
      score: 86,
    });
  }

  return nodes;
}

function buildManualHref(...segments: string[]): string {
  return `/manual/${segments.map((segment) => encodeURIComponent(segment)).join('/')}`;
}

function collectManualCandidates(links: CharmLink[], lineage: string[] = []): ManualCandidate[] {
  const candidates: ManualCandidate[] = [];

  for (const link of links) {
    const nextLineage = link.label ? [...lineage, link.label] : lineage;

    if (link.href) {
      candidates.push({
        href: link.href,
        label: link.label,
        fullLabel: nextLineage.join(' '),
      });
    }

    if (link.children?.length) {
      candidates.push(...collectManualCandidates(link.children, nextLineage));
    }
  }

  return candidates;
}

function scoreManualCandidate(candidate: ManualCandidate, model: string, displayModel: string): number {
  const label = normalizeText(candidate.fullLabel || candidate.label);
  const exactModel = normalizeText(displayModel);
  const fallbackModel = normalizeText(model.replace(/-/g, ' '));

  let score = 0;
  if (exactModel && label.includes(exactModel)) score += 120;
  if (fallbackModel && label.includes(fallbackModel)) score += 90;

  for (const token of new Set([...tokenize(displayModel), ...tokenize(model)])) {
    if (label.includes(token)) score += 15;
  }

  return score;
}

async function getManualNodes(args: {
  year: string;
  make: string;
  displayMake: string;
  model: string;
  displayModel: string;
  task: string;
}): Promise<RepairKnowledgeNode[]> {
  const nodes: RepairKnowledgeNode[] = [];
  const sourceNodeId = buildRepairNodeId(args.year, args.displayMake, args.displayModel, args.task);
  const makeCandidates = [args.displayMake, `${args.displayMake} Truck`];
  const evidenceLinks = await getManualSectionLinksForRepair({
    make: args.make,
    year: Number(args.year),
    model: args.model,
    task: args.task,
    displayMake: args.displayMake,
    displayModel: args.displayModel,
    limit: 4,
  });
  const seenHrefs = new Set<string>();

  for (const [index, link] of evidenceLinks.entries()) {
    nodes.push({
      nodeId: link.nodeId,
      edgeId: link.edgeId,
      sourceNodeId: link.sourceNodeId,
      targetNodeId: link.targetNodeId,
      vehicleNodeId: link.vehicleNodeId,
      taskNodeId: link.taskNodeId,
      systemNodeId: link.systemNodeId,
      codeNodeId: link.codeNodeId,
      confidence: link.confidence,
      evidence: link.evidence,
      kind: 'manual',
      href: link.href,
      label: link.label,
      description: link.description,
      badge: index === 0 ? 'OEM Evidence' : link.badge,
      score: 120 - index,
    });
    seenHrefs.add(link.href);
  }

  let matchedMake = args.displayMake;
  let exactVariant: ManualCandidate | null = null;

  for (const makeCandidate of makeCandidates) {
    try {
      const yearPage = await fetchCharmPage([makeCandidate, args.year]);
      if (yearPage.status !== 200 || !yearPage.isNavigation) continue;

      matchedMake = makeCandidate;
      const candidates = collectManualCandidates(yearPage.links)
        .map((candidate) => ({
          candidate,
          score: scoreManualCandidate(candidate, args.model, args.displayModel),
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score);

      exactVariant = candidates[0]?.candidate || null;
      break;
    } catch {
      // Fall through to deterministic manual browser links.
    }
  }

  if (exactVariant) {
    const node: RepairKnowledgeNode = {
      ...buildEdgeReference({
        sourceNodeId,
        targetNodeId: buildManualNodeId(exactVariant.href),
        relation: 'has-manual',
        year: args.year,
        make: args.displayMake,
        model: args.displayModel,
        task: args.task,
        confidence: 0.68,
        evidence: [{
          source: 'manual-archive',
          href: exactVariant.href,
          path: exactVariant.href,
          snippet: `Exact manual branch candidate for ${args.year} ${args.displayMake} ${args.displayModel}.`,
          observedAt: new Date().toISOString(),
        }],
      }),
      kind: 'manual',
      href: exactVariant.href,
      label: `Factory Manual: ${exactVariant.label}`,
      description: `Open the closest matching OEM manual branch for ${args.year} ${args.displayMake} ${args.displayModel}.`,
      badge: 'Exact Branch',
      score: 100,
    };
    if (!seenHrefs.has(node.href)) {
      nodes.push(node);
      seenHrefs.add(node.href);
    }
  }

  const yearIndexHref = buildManualHref(matchedMake, args.year);
  if (!seenHrefs.has(yearIndexHref)) {
    nodes.push({
      ...buildEdgeReference({
        sourceNodeId,
        targetNodeId: buildManualNodeId(yearIndexHref),
        relation: 'has-manual',
        year: args.year,
        make: args.displayMake,
        model: args.displayModel,
        task: args.task,
        confidence: 0.56,
        evidence: [{
          source: 'manual-archive',
          href: yearIndexHref,
          path: yearIndexHref,
          snippet: `${args.year} ${args.displayMake} manual index for variant selection.`,
          observedAt: new Date().toISOString(),
        }],
      }),
      kind: 'manual',
      href: yearIndexHref,
      label: `${args.year} ${args.displayMake} Manual Index`,
      description: `Browse the ${args.year} factory manual tree and pick the exact variant before drilling into procedures.`,
      badge: 'Year Index',
      score: 82,
    });
    seenHrefs.add(yearIndexHref);
  }

  const libraryHref = buildManualHref(matchedMake);
  if (!seenHrefs.has(libraryHref)) {
    nodes.push({
      ...buildEdgeReference({
        sourceNodeId,
        targetNodeId: buildManualNodeId(libraryHref),
        relation: 'has-manual',
        year: args.year,
        make: args.displayMake,
        model: args.displayModel,
        task: args.task,
        confidence: 0.48,
        evidence: [{
          source: 'manual-archive',
          href: libraryHref,
          path: libraryHref,
          snippet: `${args.displayMake} manual library root.`,
          observedAt: new Date().toISOString(),
        }],
      }),
      kind: 'manual',
      href: libraryHref,
      label: `${args.displayMake} Factory Manual Library`,
      description: `Open the OEM manual library for ${args.displayMake}, including service procedures, wiring, and diagnostics.`,
      badge: 'OEM Source',
      score: 74,
    });
  }

  return nodes;
}

function getGroups(args: {
  manualNodes: RepairKnowledgeNode[];
  specNodes: RepairKnowledgeNode[];
  toolNodes: RepairKnowledgeNode[];
  wiringNodes: RepairKnowledgeNode[];
  dtcNodes: RepairKnowledgeNode[];
  task: string;
  vehicleLabel: string;
}): RepairKnowledgeGroup[] {
  const groups: RepairKnowledgeGroup[] = [
    {
      kind: 'manual',
      title: 'OEM Manual Evidence & Paths',
      browseHref: '/manual',
      theme: 'slate',
      nodes: rankKnowledgeGraphNodesHybrid('repair', args.manualNodes, {
        task: args.task,
        vehicle: args.vehicleLabel,
      }),
    },
    {
      kind: 'spec',
      title: 'Specs Already on This Page',
      browseHref: '#parts-needed',
      theme: 'emerald',
      nodes: rankKnowledgeGraphNodesHybrid('repair', args.specNodes, {
        task: args.task,
        vehicle: args.vehicleLabel,
      }),
    },
    {
      kind: 'tool',
      title: 'Specs & Reference Pages',
      browseHref: '/tools',
      theme: 'cyan',
      nodes: rankKnowledgeGraphNodesHybrid('repair', args.toolNodes, {
        task: args.task,
        vehicle: args.vehicleLabel,
      }),
    },
    {
      kind: 'wiring',
      title: 'Relevant Wiring Paths',
      browseHref: '/wiring',
      theme: 'violet',
      nodes: rankKnowledgeGraphNodesHybrid('repair', args.wiringNodes, {
        task: args.task,
        vehicle: args.vehicleLabel,
      }),
    },
    {
      kind: 'dtc',
      title: 'Likely Trouble Codes',
      browseHref: '/codes',
      theme: 'amber',
      nodes: rankKnowledgeGraphNodesHybrid('repair', args.dtcNodes, {
        task: args.task,
        vehicle: args.vehicleLabel,
      }),
    },
  ];

  return groups.filter((group) => group.nodes.length > 0);
}

export async function buildRepairKnowledgeGraph(args: {
  year: string;
  make: string;
  displayMake: string;
  model: string;
  displayModel: string;
  task: string;
  repairTools: string[];
  vehicleSpec?: VehicleRepairSpec;
}): Promise<RepairKnowledgeGraph> {
  const [manualNodes] = await Promise.all([
    getManualNodes(args),
  ]);

  const specNodes = getSpecNodes(args.year, args.displayMake, args.displayModel, args.task, args.repairTools, args.vehicleSpec);
  const toolNodes = getToolNodes(args.year, args.displayMake, args.displayModel, args.task);
  const wiringNodes = getWiringNodes(args);
  const dtcNodes = getDtcNodes(args.task, 4);
  const groups = getGroups({
    manualNodes,
    specNodes,
    toolNodes,
    wiringNodes,
    dtcNodes,
    task: args.task,
    vehicleLabel: `${args.year} ${args.displayMake} ${args.displayModel}`,
  });

  return {
    groups,
    totalNodes: groups.reduce((sum, group) => sum + group.nodes.length, 0),
  };
}
