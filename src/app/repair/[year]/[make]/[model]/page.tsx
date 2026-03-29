import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import KnowledgeGraphGroup from '@/components/KnowledgeGraphGroup';
import VehicleHubTracker from '@/components/VehicleHubTracker';
import {
  NOINDEX_MAKES,
  isNonUsModel,
  VEHICLE_PRODUCTION_YEARS,
  slugifyRoutePart,
} from '@/data/vehicles';
import { getTier1RescuePagesForExactVehicle, getTier1RescuePagesForVehicle } from '@/data/rescuePriority';
import {
  getExactVehicleCommandCenterOpportunity,
  getVehicleFamilyCommandCenterOpportunities,
} from '@/lib/commandCenterOpportunities';
import { buildRepairUrl, buildVehicleNodeId } from '@/lib/vehicleIdentity';
import { buildKnowledgeGraphExport } from '@/lib/knowledgeGraphExport';
import { rankKnowledgeGraphBlocks } from '@/lib/knowledgeGraphRanking';
import { buildVehicleHubGraph } from '@/lib/vehicleHubGraph';

interface PageProps {
  params: Promise<{
    year: string;
    make: string;
    model: string;
  }>;
}

interface PreviewLink {
  href: string;
  label: string;
}

interface DiyQuickStartBlueprint {
  eyebrow: string;
  title: string;
  description: string;
  guideHint: string;
  tone: CommandCardTone;
  primaryTask: string;
  primaryLabel: string;
  relatedTasks: Array<{ task: string; label: string }>;
  matchTerms: string[];
  supportGroup?: 'wiring' | 'tool';
  supportPatterns?: RegExp[];
}

type CommandCardTone = 'cyan' | 'emerald' | 'amber' | 'violet' | 'slate';

const DIY_QUICK_START_BLUEPRINTS: DiyQuickStartBlueprint[] = [
  {
    eyebrow: 'DIY favorite',
    title: 'Brakes',
    description: 'Brake jobs stay one of the clearest DIY wins when the page gives you the exact pad, rotor, and hardware path for this vehicle.',
    guideHint: 'Use the exact guide for pad hardware, rotor notes, torque path, and the consumables people forget to buy.',
    tone: 'cyan',
    primaryTask: 'brake-pad-replacement',
    primaryLabel: 'Open brake pad guide',
    relatedTasks: [
      { task: 'brake-rotor-replacement', label: 'Rotor guide' },
    ],
    matchTerms: ['brake', 'rotor', 'pad', 'pads', 'braking'],
    supportGroup: 'tool',
    supportPatterns: [/brake/i, /pad/i, /rotor/i, /fluid/i],
  },
  {
    eyebrow: 'DIY favorite',
    title: 'Lighting',
    description: 'When the job is a headlight, tail light, or bulb issue, owners want the fastest exact guide and fitment answer first.',
    guideHint: 'Use the exact guide for bulb fitment, access path, and purchase links before you pull trim.',
    tone: 'amber',
    primaryTask: 'headlight-bulb-replacement',
    primaryLabel: 'Open headlight guide',
    relatedTasks: [
      { task: 'tail-light-replacement', label: 'Tail light guide' },
    ],
    matchTerms: ['lighting', 'headlight', 'headlight bulb', 'tail light', 'bulb'],
    supportGroup: 'wiring',
    supportPatterns: [/lighting/i, /headlight/i, /tail/i, /exterior/i],
  },
  {
    eyebrow: 'Stranded-car fix',
    title: 'Battery and Starting',
    description: 'Start with the battery, then move cleanly into alternator or starter checks without leaving the exact vehicle context.',
    guideHint: 'Use the exact guide for group size, terminal order, and the install supplies people forget to buy.',
    tone: 'emerald',
    primaryTask: 'battery-replacement',
    primaryLabel: 'Open battery guide',
    relatedTasks: [
      { task: 'alternator-replacement', label: 'Alternator guide' },
      { task: 'starter-replacement', label: 'Starter guide' },
    ],
    matchTerms: ['battery', 'starting', 'starter', 'alternator', 'charging'],
    supportGroup: 'wiring',
    supportPatterns: [/charging/i, /starting/i, /ignition/i, /battery/i, /power/i],
  },
  {
    eyebrow: 'Recurring maintenance',
    title: 'Oil and Fluids',
    description: 'Routine fluid work needs a direct path because oil, coolant, and transmission jobs are easy to do when the exact spec is clear.',
    guideHint: 'Use the exact guide for oil type, capacity, filter support, and the basic consumables to buy in one pass.',
    tone: 'violet',
    primaryTask: 'oil-change',
    primaryLabel: 'Open oil guide',
    relatedTasks: [
      { task: 'transmission-fluid-change', label: 'Transmission fluid' },
      { task: 'coolant-flush', label: 'Coolant flush' },
    ],
    matchTerms: ['oil', 'fluid', 'fluids', 'coolant', 'transmission', 'capacity', 'spec'],
    supportGroup: 'tool',
    supportPatterns: [/oil/i, /fluid/i, /capacity/i, /spec/i, /transmission/i, /coolant/i],
  },
  {
    eyebrow: 'Low-risk win',
    title: 'Filters and Tune-Up',
    description: 'Filters, plugs, and light maintenance jobs are confidence-builders when the page gives a direct parts-and-fitment answer.',
    guideHint: 'Use the exact guide to keep the job simple, then hand off to the right parts and fitment notes before checkout.',
    tone: 'slate',
    primaryTask: 'cabin-air-filter-replacement',
    primaryLabel: 'Open cabin filter guide',
    relatedTasks: [
      { task: 'engine-air-filter-replacement', label: 'Engine air filter' },
      { task: 'spark-plug-replacement', label: 'Spark plug guide' },
    ],
    matchTerms: ['filter', 'filters', 'spark plug', 'ignition', 'tune up', 'maintenance'],
    supportGroup: 'tool',
    supportPatterns: [/filter/i, /spark/i, /plug/i, /maintenance/i],
  },
];

function toTitleCase(value: string): string {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveVehicle(makeSlug: string, modelSlug: string) {
  const originalMake = Object.keys(VEHICLE_PRODUCTION_YEARS).find(
    (make) => slugifyRoutePart(make) === makeSlug,
  );
  if (!originalMake) return null;

  const originalModel = Object.keys(VEHICLE_PRODUCTION_YEARS[originalMake]).find(
    (model) => slugifyRoutePart(model) === modelSlug,
  );
  if (!originalModel) return null;

  return {
    originalMake,
    originalModel,
    production: VEHICLE_PRODUCTION_YEARS[originalMake][originalModel],
    canonicalMake: slugifyRoutePart(originalMake),
    canonicalModel: slugifyRoutePart(originalModel),
  };
}

function getRelatedYears(year: number, start: number, end: number): number[] {
  const candidates = new Set<number>([
    year - 2,
    year - 1,
    year + 1,
    year + 2,
    start,
    end,
  ]);

  return [...candidates]
    .filter((candidate) => candidate >= start && candidate <= end && candidate !== year)
    .sort((a, b) => Math.abs(a - year) - Math.abs(b - year) || a - b)
    .slice(0, 6);
}

function stripVehiclePrefix(label: string, vehicleLabel: string): string {
  const prefix = `${vehicleLabel} `;
  return label.startsWith(prefix) ? label.slice(prefix.length) : label;
}

function buildPreviewLinks(
  nodes: Array<{ href: string; label: string }>,
  vehicleLabel: string,
  limit: number,
): PreviewLink[] {
  return nodes.slice(0, limit).map((node) => ({
    href: node.href,
    label: stripVehiclePrefix(node.label, vehicleLabel),
  }));
}

function buildExactTaskLink(
  year: string,
  make: string,
  model: string,
  task: string,
  label: string,
): PreviewLink {
  return {
    href: buildRepairUrl(year, make, model, task),
    label,
  };
}

function findSupportingPreviewLink(
  nodes: Array<{ href: string; label: string }>,
  vehicleLabel: string,
  patterns: RegExp[],
): PreviewLink | null {
  const match = nodes.find((node) => patterns.some((pattern) => pattern.test(node.label)));
  if (!match) return null;

  return {
    href: match.href,
    label: stripVehiclePrefix(match.label, vehicleLabel),
  };
}

function buildPriorityRepairPreviewLinks(
  exactPages: PreviewLink[],
  repairNodes: Array<{ href: string; label: string }>,
  vehicleLabel: string,
  priorityLinks: PreviewLink[] = [],
): PreviewLink[] {
  const brakeLinks = repairNodes
    .filter((node) => /brake/i.test(node.label))
    .map((node) => ({
      href: node.href,
      label: stripVehiclePrefix(node.label, vehicleLabel),
    }));

  const fallbackLinks = repairNodes
    .filter((node) => !/brake/i.test(node.label))
    .map((node) => ({
      href: node.href,
      label: stripVehiclePrefix(node.label, vehicleLabel),
    }));

  const combined = [...priorityLinks, ...brakeLinks, ...exactPages, ...fallbackLinks];
  const deduped: PreviewLink[] = [];
  const seen = new Set<string>();

  for (const link of combined) {
    if (seen.has(link.href)) continue;
    seen.add(link.href);
    deduped.push(link);
    if (deduped.length >= 3) break;
  }

  return deduped;
}

function toRelativeHref(href: string): string {
  if (href.startsWith('/')) return href;

  try {
    const url = new URL(href);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

function dedupePreviewLinks(links: PreviewLink[], limit: number): PreviewLink[] {
  const out: PreviewLink[] = [];
  const seen = new Set<string>();

  for (const link of links) {
    if (!link.href || seen.has(link.href)) continue;
    seen.add(link.href);
    out.push(link);
    if (out.length >= limit) break;
  }

  return out;
}

function normalizeIntentText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesIntentTerms(text: string, terms: string[]): boolean {
  const normalizedText = normalizeIntentText(text);
  return terms.some((term) => normalizedText.includes(normalizeIntentText(term)));
}

function scoreQuickStartBlueprint(
  blueprint: DiyQuickStartBlueprint,
  opportunityTasks: Array<{ task: string; label: string; weight: number; cluster: string }>,
): number {
  if (!opportunityTasks.length) return 0;

  const primaryTask = normalizeIntentText(blueprint.primaryTask);
  const relatedTasks = new Set(blueprint.relatedTasks.map((task) => normalizeIntentText(task.task)));

  return opportunityTasks.reduce((score, task) => {
    const taskText = `${task.task} ${task.label} ${task.cluster}`;
    if (!matchesIntentTerms(taskText, blueprint.matchTerms)) return score;

    let boostedScore = score + task.weight;
    const normalizedTask = normalizeIntentText(task.task);
    if (normalizedTask === primaryTask) boostedScore += 18;
    if (relatedTasks.has(normalizedTask)) boostedScore += 10;
    if (matchesIntentTerms(taskText, [blueprint.title])) boostedScore += 6;
    return boostedScore;
  }, 0);
}

function buildQuickStartSpotlight(
  blueprint: DiyQuickStartBlueprint,
  opportunityTasks: Array<{ task: string; label: string; weight: number; cluster: string }>,
): string | null {
  const matches = opportunityTasks.filter((task) =>
    matchesIntentTerms(`${task.task} ${task.label} ${task.cluster}`, blueprint.matchTerms),
  );

  if (!matches.length) return null;

  return matches
    .slice(0, 2)
    .map((task) => task.label)
    .join(' • ');
}

function buildDemandSummary(cards: Array<{ title: string }>): string {
  if (!cards.length) {
    return 'Battery, lighting, brakes, oil, and filter jobs are the main DIY lanes to keep first.';
  }

  const titles = cards.map((card) => card.title);
  if (titles.length === 1) return titles[0];
  if (titles.length === 2) return `${titles[0]} and ${titles[1]}`;
  if (titles.length === 3) return `${titles[0]}, ${titles[1]}, and ${titles[2]}`;
  return `${titles[0]}, ${titles[1]}, ${titles[2]}, and ${titles[3]}`;
}

function formatSignedDelta(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year, make, model } = await params;
  const resolvedYear = Number(year);
  const resolvedVehicle = resolveVehicle(make.toLowerCase(), model.toLowerCase());

  if (!resolvedVehicle || !Number.isInteger(resolvedYear)) {
    return {
      title: 'Vehicle Repair Hub Not Found | SpotOnAuto',
      description: 'Browse DIY repair hubs by exact year, make, and model on SpotOnAuto.',
    };
  }

  const { originalMake, originalModel, production, canonicalMake, canonicalModel } = resolvedVehicle;
  if (resolvedYear < production.start || resolvedYear > production.end) {
    return {
      title: 'Vehicle Repair Hub Not Found | SpotOnAuto',
      description: 'Browse DIY repair hubs by exact year, make, and model on SpotOnAuto.',
    };
  }

  const vehicleLabel = `${resolvedYear} ${originalMake} ${originalModel}`;
  return {
    title: `${vehicleLabel} Repair Hub — Free DIY Guides & Specs | SpotOnAuto`,
    description: `Fix your ${vehicleLabel} yourself. Free step-by-step repair guides, wiring diagrams, trouble codes, and factory specs. Save hundreds vs. the shop.`,
    alternates: {
      canonical: `https://spotonauto.com/repair/${resolvedYear}/${canonicalMake}/${canonicalModel}`,
    },
    ...(NOINDEX_MAKES.has(canonicalMake) || isNonUsModel(canonicalMake, canonicalModel) ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function VehicleRepairHubPage({ params }: PageProps) {
  const { year, make, model } = await params;
  const resolvedVehicle = resolveVehicle(make.toLowerCase(), model.toLowerCase());
  const resolvedYear = Number(year);

  if (!resolvedVehicle || !Number.isInteger(resolvedYear)) notFound();

  const {
    originalMake,
    originalModel,
    production,
    canonicalMake,
    canonicalModel,
  } = resolvedVehicle;

  if (resolvedYear < production.start || resolvedYear > production.end) notFound();

  const canonicalYear = String(resolvedYear);
  if (make !== canonicalMake || model !== canonicalModel || year !== canonicalYear) {
    permanentRedirect(`/repair/${canonicalYear}/${canonicalMake}/${canonicalModel}`);
  }

  const vehicleLabel = `${canonicalYear} ${originalMake} ${originalModel}`;
  const vehicleHub = await buildVehicleHubGraph({
    year: canonicalYear,
    make: canonicalMake,
    model: canonicalModel,
    displayMake: originalMake,
    displayModel: originalModel,
  });
  const exactOpportunity = getExactVehicleCommandCenterOpportunity(canonicalYear, originalMake, originalModel);
  const rankedKnowledgeGroups = rankKnowledgeGraphBlocks('vehicle', vehicleHub.groups, {
    vehicle: vehicleLabel,
    task: exactOpportunity?.topTasks[0]?.task,
    query: exactOpportunity?.topTasks
      ?.slice(0, 4)
      .map((task) => `${task.label} ${task.cluster}`)
      .join(' '),
  });
  const knowledgeGraphExport = buildKnowledgeGraphExport({
    surface: 'vehicle',
    rootNodeId: buildVehicleNodeId(canonicalYear, canonicalMake, canonicalModel),
    rootKind: 'vehicle',
    rootLabel: vehicleLabel,
    blocks: rankedKnowledgeGroups.map((group) => ({
      kind: group.kind,
      title: group.title,
      browseHref: group.browseHref,
      nodes: group.nodes.map((node) => ({
        nodeId: node.nodeId,
        edgeId: node.edgeId,
        sourceNodeId: node.sourceNodeId,
        targetNodeId: node.targetNodeId,
        vehicleNodeId: node.vehicleNodeId,
        taskNodeId: node.taskNodeId,
        systemNodeId: node.systemNodeId,
        codeNodeId: node.codeNodeId,
        href: node.href,
        label: node.label,
        description: node.description,
        badge: node.badge,
        targetKind: node.kind,
      })),
    })),
  });

  const repairGroup = rankedKnowledgeGroups.find((group) => group.kind === 'repair');
  const wiringGroup = rankedKnowledgeGroups.find((group) => group.kind === 'wiring');
  const manualGroup = rankedKnowledgeGroups.find((group) => group.kind === 'manual');
  const symptomGroup = rankedKnowledgeGroups.find((group) => group.kind === 'symptom');
  const toolGroup = rankedKnowledgeGroups.find((group) => group.kind === 'tool');
  const codeGroup = rankedKnowledgeGroups.find((group) => group.kind === 'dtc');
  const exactVehicleTier1Pages = getTier1RescuePagesForExactVehicle(canonicalYear, originalMake, originalModel).slice(0, 4);
  const modelTier1Pages = getTier1RescuePagesForVehicle(originalMake, originalModel)
    .filter((entry) => entry.year !== resolvedYear)
    .slice(0, 4);
  const familyOpportunities = getVehicleFamilyCommandCenterOpportunities(originalMake, originalModel, {
    excludeYear: canonicalYear,
    limit: 4,
  });
  const opportunityTaskPreviewLinks = dedupePreviewLinks(
    (exactOpportunity?.topTasks ?? []).map((task) => ({
      href: buildRepairUrl(canonicalYear, canonicalMake, canonicalModel, task.task),
      label: task.label,
    })),
    4,
  );
  const relatedYears = getRelatedYears(resolvedYear, production.start, production.end);
  const diyQuickStartCards = DIY_QUICK_START_BLUEPRINTS.map((blueprint) => {
    const supportNodes = blueprint.supportGroup === 'wiring'
      ? (wiringGroup?.nodes ?? [])
      : blueprint.supportGroup === 'tool'
        ? (toolGroup?.nodes ?? [])
        : [];
    const supportLink = blueprint.supportPatterns
      ? findSupportingPreviewLink(supportNodes, vehicleLabel, blueprint.supportPatterns)
      : null;
    const priorityScore = scoreQuickStartBlueprint(blueprint, exactOpportunity?.topTasks ?? []);
    const spotlight = buildQuickStartSpotlight(blueprint, exactOpportunity?.topTasks ?? []);

    return {
      ...blueprint,
      priorityScore,
      spotlight,
      primaryHref: buildRepairUrl(canonicalYear, canonicalMake, canonicalModel, blueprint.primaryTask),
      previewLinks: [
        ...blueprint.relatedTasks.map((task) => buildExactTaskLink(
          canonicalYear,
          canonicalMake,
          canonicalModel,
          task.task,
          task.label,
        )),
        ...(supportLink ? [supportLink] : []),
      ].slice(0, 3),
    };
  }).sort((left, right) => right.priorityScore - left.priorityScore || left.title.localeCompare(right.title));
  const commandCards: Array<{
    eyebrow: string;
    title: string;
    description: string;
    countLabel: string;
    tone: CommandCardTone;
    primaryHref: string;
    primaryLabel: string;
    previewLinks: PreviewLink[];
  }> = [
    {
      eyebrow: 'Most-used path',
      title: 'Exact Repair Guides',
      description: `Step-by-step repair guides for the most common ${vehicleLabel} jobs — brakes, oil, battery, and more.`,
      countLabel: `${vehicleHub.repairCount} guides`,
      tone: 'cyan',
      primaryHref: repairGroup?.nodes[0]?.href || '/repairs',
      primaryLabel: repairGroup ? 'Open highest-demand repairs' : 'Browse repair categories',
      previewLinks: buildPriorityRepairPreviewLinks(
        exactVehicleTier1Pages.length > 0 ? exactVehicleTier1Pages.map((entry) => ({
          href: entry.href,
          label: toTitleCase(entry.task),
        })) : [],
        repairGroup?.nodes ?? [],
        vehicleLabel,
        opportunityTaskPreviewLinks,
      ),
    },
    {
      eyebrow: 'Electrical first',
      title: 'Wiring Diagrams',
      description: 'Factory electrical diagrams for this vehicle — headlights, starting, charging, fuel injection, and more.',
      countLabel: `${vehicleHub.wiringCount} diagrams`,
      tone: 'violet',
      primaryHref: wiringGroup?.nodes[0]?.href || '/wiring',
      primaryLabel: wiringGroup ? 'Open exact wiring' : 'Browse wiring pages',
      previewLinks: buildPreviewLinks(wiringGroup?.nodes ?? [], vehicleLabel, 3),
    },
    {
      eyebrow: 'Complaint-led path',
      title: 'Symptoms and Diagnosis',
      description: 'Describe what your car is doing and get help narrowing down the problem before you start a repair.',
      countLabel: `${vehicleHub.symptomCount} symptoms`,
      tone: 'amber',
      primaryHref: symptomGroup?.nodes[0]?.href || '/diagnose',
      primaryLabel: symptomGroup ? 'Open symptom hubs' : 'Start diagnosis',
      previewLinks: [
        { href: '/diagnose', label: 'Guided diagnosis' },
        ...buildPreviewLinks(symptomGroup?.nodes ?? [], vehicleLabel, 2),
      ].slice(0, 3),
    },
    {
      eyebrow: 'If you have a code',
      title: 'Trouble Code Pages',
      description: 'Look up check engine light codes commonly seen on this vehicle, with causes, symptoms, and fix costs.',
      countLabel: `${vehicleHub.codeCount} codes`,
      tone: 'emerald',
      primaryHref: codeGroup?.nodes[0]?.href || '/codes',
      primaryLabel: codeGroup ? 'Open code pages' : 'Browse all codes',
      previewLinks: buildPreviewLinks(codeGroup?.nodes ?? [], vehicleLabel, 3),
    },
    {
      eyebrow: 'Fitment and reference',
      title: 'Specs and Tools',
      description: 'Oil type, tire size, battery group size, fluid capacities, and other specs for your vehicle.',
      countLabel: `${vehicleHub.toolCount} spec pages`,
      tone: 'emerald',
      primaryHref: toolGroup?.nodes[0]?.href || '/tools',
      primaryLabel: toolGroup ? 'Open specs and tools' : 'Browse tool pages',
      previewLinks: buildPreviewLinks(toolGroup?.nodes ?? [], vehicleLabel, 3),
    },
    {
      eyebrow: 'OEM source',
      title: 'Factory Manual Paths',
      description: 'Browse factory service manual sections and OEM repair procedures for this vehicle.',
      countLabel: `${manualGroup?.nodes.length || 0} manual sections`,
      tone: 'slate',
      primaryHref: manualGroup?.nodes[1]?.href || manualGroup?.nodes[0]?.href || '/manual',
      primaryLabel: 'Open OEM manual paths',
      previewLinks: buildPreviewLinks(manualGroup?.nodes ?? [], vehicleLabel, 3),
    },
  ];

  const faqItems = [
    {
      question: `What can I find on the ${vehicleLabel} repair hub?`,
      answer: `This page brings together everything for the ${vehicleLabel}: step-by-step repair guides, factory wiring diagrams, trouble codes, vehicle specs, and factory manual references — all in one place.`,
    },
    {
      question: `Is this information specific to the ${vehicleLabel}?`,
      answer: `Yes. Repair guides and wiring diagrams are tailored to the exact ${vehicleLabel}. Factory manual links may point to make-level or year-level sections depending on how the original manuals are organized.`,
    },
    {
      question: `Why do some factory manual links go to a make or year page?`,
      answer: `Factory service manuals aren't always split by exact year, make, and model. We link you to the closest matching section so you can find the right procedure for your ${vehicleLabel}.`,
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Repair Hub', item: 'https://spotonauto.com/repair' },
      { '@type': 'ListItem', position: 2, name: originalMake, item: `https://spotonauto.com/guides/${canonicalMake}` },
      { '@type': 'ListItem', position: 3, name: `${originalMake} ${originalModel}`, item: `https://spotonauto.com/guides/${canonicalMake}/${canonicalModel}` },
      { '@type': 'ListItem', position: 4, name: vehicleLabel, item: `https://spotonauto.com/repair/${canonicalYear}/${canonicalMake}/${canonicalModel}` },
    ],
  };

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${vehicleLabel} Repair Hub`,
    description: `Repair guides, wiring diagrams, trouble codes, and factory manual references for the ${vehicleLabel}.`,
    url: `https://spotonauto.com/repair/${canonicalYear}/${canonicalMake}/${canonicalModel}`,
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-[#141a1f] to-[#1b2126] text-white">
      <VehicleHubTracker vehicle={vehicleLabel} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script
        id="knowledge-graph-export"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(knowledgeGraphExport) }}
      />

      <section className="max-w-6xl mx-auto px-4 pt-12 pb-10">
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/repair" className="hover:text-cyan-400 transition-colors">Repair Hub</Link>
          <span className="mx-2">/</span>
          <Link href={`/guides/${canonicalMake}`} className="hover:text-cyan-400 transition-colors">{originalMake}</Link>
          <span className="mx-2">/</span>
          <Link href={`/guides/${canonicalMake}/${canonicalModel}`} className="hover:text-cyan-400 transition-colors">{originalModel}</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">{canonicalYear}</span>
        </nav>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          {vehicleLabel} <span className="text-cyan-400">Repair Hub</span>
        </h1>
        <p className="text-lg text-gray-300 max-w-3xl">
          Everything you need for your {canonicalYear} {originalMake} {originalModel} in one place — repair guides, wiring diagrams, trouble codes, specs, and factory manual references.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-8">
          <StatCard label="Repair guides" value={String(vehicleHub.repairCount)} />
          <StatCard label="Wiring diagrams" value={String(vehicleHub.wiringCount)} />
          <StatCard label="Related symptoms" value={String(vehicleHub.symptomCount)} />
          <StatCard label="Spec pages" value={String(vehicleHub.toolCount)} />
          <StatCard label="Trouble codes" value={String(vehicleHub.codeCount)} />
        </div>

        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.05] p-6 md:p-8 mt-8">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-300/85">DIY Quick Starts</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-3">Start with the jobs owners actually do themselves</h2>
            <p className="text-sm md:text-base text-gray-300 mt-3">
              These are the lighter-maintenance paths most searchers are willing to take on: brakes, lights, battery, oil, fluids,
              and filters. Each exact guide already carries the tools, parts, fitment notes, and consumable-buying context that make the job easier to finish.
            </p>
          </div>
          {exactOpportunity && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/45 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">Most popular repairs</p>
              <p className="mt-2 text-sm leading-6 text-gray-200">
                {buildDemandSummary(diyQuickStartCards.slice(0, 4))} — these are the most common DIY jobs for this vehicle right now.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {opportunityTaskPreviewLinks.slice(0, 4).map((link) => (
                  <Link
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-100 transition-colors hover:border-white/20 hover:bg-white/10"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4 mt-6">
            {diyQuickStartCards.map((card) => (
              <DiyQuickStartCard
                key={card.title}
                eyebrow={card.eyebrow}
                title={card.title}
                description={card.description}
                guideHint={card.guideHint}
                spotlight={card.spotlight}
                tone={card.tone}
                primaryHref={card.primaryHref}
                primaryLabel={card.primaryLabel}
                previewLinks={card.previewLinks}
              />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.05] p-6 md:p-8 mt-8">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-300/85">Start Here</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-3">Everything for this vehicle, arranged by job</h2>
            <p className="text-sm md:text-base text-gray-300 mt-3">
              Browse repair guides, wiring diagrams, trouble codes, specs, factory manuals, and more — all for your {vehicleLabel}.
            </p>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
            {commandCards.map((card) => (
              <HubActionCard
                key={card.title}
                eyebrow={card.eyebrow}
                title={card.title}
                description={card.description}
                countLabel={card.countLabel}
                tone={card.tone}
                primaryHref={card.primaryHref}
                primaryLabel={card.primaryLabel}
                previewLinks={card.previewLinks}
              />
            ))}
          </div>
        </div>
      </section>

      {(exactOpportunity || familyOpportunities.length > 0) && (
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6 md:p-8">
            <div className="max-w-4xl">
              <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-300/85">Popular Right Now</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mt-3">
                {exactOpportunity
                  ? `What ${vehicleLabel} owners are looking for`
                  : `Popular repairs for the ${originalMake} ${originalModel}`}
              </h2>
              <p className="text-sm md:text-base text-gray-300 mt-3">
                {exactOpportunity
                  ? `${exactOpportunity.note} These are the repairs and topics ${vehicleLabel} owners search for most.`
                  : `See what other ${originalMake} ${originalModel} owners are fixing right now.`}
              </p>
            </div>

            {exactOpportunity?.topTasks.length ? (
              <div className="mt-6">
                <div className="flex items-end justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Most-searched repairs for this vehicle</h3>
                    <p className="text-sm text-gray-300 mt-2">
                      These are the repairs {vehicleLabel} owners search for most often.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {exactOpportunity.topTasks.slice(0, 4).map((task) => (
                    <Link
                      key={`${vehicleLabel}-${task.task}`}
                      href={buildRepairUrl(canonicalYear, canonicalMake, canonicalModel, task.task)}
                      className="rounded-xl border border-white/10 bg-slate-900/45 p-4 transition-all hover:border-emerald-400/35 hover:bg-slate-900/65"
                    >
                      <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/85 mb-2">{task.cluster}</p>
                      <h3 className="text-base font-semibold text-white">{task.label}</h3>
                      <p className="text-sm text-gray-400 mt-2">Popular repair</p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {exactOpportunity?.symptomHubs.length ? (
              <div className="mt-6">
                <h3 className="text-xl font-semibold text-white">Common symptoms for this vehicle</h3>
                <div className="flex flex-wrap gap-2 mt-4">
                  {exactOpportunity.symptomHubs.slice(0, 4).map((hub) => (
                    <Link
                      key={`${vehicleLabel}-${hub.href}`}
                      href={toRelativeHref(hub.href)}
                      className="rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-3 py-1.5 text-xs text-amber-100 transition-colors hover:border-amber-400/40 hover:bg-amber-500/[0.14]"
                    >
                      {hub.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {familyOpportunities.length > 0 && (
              <div className="mt-6">
                <div className="flex items-end justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Other {originalMake} {originalModel} years</h3>
                    <p className="text-sm text-gray-300 mt-2">
                      Popular repair hubs for other model years of the {originalMake} {originalModel}.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {familyOpportunities.map((entry) => (
                    <div
                      key={entry.hubPath}
                      className="rounded-xl border border-white/10 bg-slate-900/45 p-4"
                    >
                      <Link
                        href={entry.hubPath}
                        className="block transition-colors hover:text-emerald-300"
                      >
                        <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/85 mb-2">Other model year</p>
                        <h3 className="text-base font-semibold text-white">{entry.label}</h3>
                      </Link>
                      <p className="text-sm text-gray-400 mt-2">{entry.note}</p>
                      {entry.topTasks.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {entry.topTasks.slice(0, 2).map((task) => (
                            <Link
                              key={`${entry.hubPath}-${task.task}`}
                              href={buildRepairUrl(entry.year, canonicalMake, canonicalModel, task.task)}
                              className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-1.5 text-xs text-emerald-100 transition-colors hover:border-emerald-400/40 hover:bg-emerald-500/[0.14]"
                            >
                              {task.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {(symptomGroup || codeGroup) && (
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <div className="grid gap-6 lg:grid-cols-2">
            {symptomGroup && (
              <EntryPanel
                title="Start from the complaint"
                description={`Not sure what the problem is? Start from what your ${vehicleLabel} is doing — noise, warning light, leak, or other symptom.`}
                tone="amber"
                browseHref="/symptoms"
                entries={[
                  { href: '/diagnose', label: 'Guided diagnosis', description: 'Use the AI flow when the symptom needs follow-up questions.' },
                  ...symptomGroup.nodes.slice(0, 5).map((node) => ({
                    href: node.href,
                    label: node.label,
                    description: node.description,
                  })),
                ].slice(0, 5)}
              />
            )}
            {codeGroup && (
              <EntryPanel
                title="Have a code already"
                description="Got a check engine light code? Look it up to see what it means, common causes, and how much it costs to fix."
                tone="emerald"
                browseHref="/codes"
                entries={codeGroup.nodes.slice(0, 5).map((node) => ({
                  href: node.href,
                  label: node.label,
                  description: node.description,
                }))}
              />
            )}
          </div>
        </section>
      )}

      {(exactVehicleTier1Pages.length > 0 || modelTier1Pages.length > 0) && (
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-6">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-white">Featured Repair Guides</h2>
              <p className="text-sm text-gray-300 mt-2">
                Popular repair guides for the {vehicleLabel} and nearby model years.
              </p>
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              {exactVehicleTier1Pages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">{vehicleLabel} Guides</h3>
                  <div className="space-y-3">
                    {exactVehicleTier1Pages.map((entry) => (
                      <Link
                        key={entry.href}
                        href={entry.href}
                        className="block rounded-xl border border-white/10 bg-slate-900/45 p-4 transition-all hover:border-violet-400/35 hover:bg-slate-900/65"
                      >
                        <p className="text-base font-semibold text-white">{toTitleCase(entry.task)}</p>
                        <p className="mt-1 text-sm text-gray-300">{entry.year} {entry.make} {entry.model}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {modelTier1Pages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">More {originalMake} {originalModel} Guides</h3>
                  <div className="space-y-3">
                    {modelTier1Pages.map((entry) => (
                      <Link
                        key={entry.href}
                        href={entry.href}
                        className="block rounded-xl border border-white/10 bg-slate-900/45 p-4 transition-all hover:border-violet-400/35 hover:bg-slate-900/65"
                      >
                        <p className="text-base font-semibold text-white">{entry.year} {entry.make} {entry.model}</p>
                        <p className="mt-1 text-sm capitalize text-gray-300">{entry.task.replace(/-/g, ' ')}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {repairGroup && (
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <div className="flex items-end justify-between gap-3 mb-5">
            <div>
              <h2 className="text-2xl font-bold text-white">Exact Repair Guides for {vehicleLabel}</h2>
              <p className="text-sm text-gray-400 mt-1">
                Step-by-step guides for common {vehicleLabel} repairs.
              </p>
            </div>
            <Link href="/repairs" className="text-sm text-cyan-400 hover:underline">
              Browse all repair categories →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {repairGroup.nodes.map((node) => (
              <Link
                key={node.nodeId || node.href}
                href={node.href}
                className="rounded-xl border border-white/10 bg-slate-900/45 p-4 transition-all group hover:border-cyan-500/35 hover:bg-slate-900/65"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-400/80 mb-2">{node.badge}</p>
                <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  {stripVehiclePrefix(node.label, vehicleLabel)}
                </h3>
                <p className="text-sm text-gray-400 mt-2">{node.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {wiringGroup && (
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <div className="flex items-end justify-between gap-3 mb-5">
            <div>
              <h2 className="text-2xl font-bold text-white">Wiring Diagrams</h2>
              <p className="text-sm text-gray-400 mt-1">
                Factory electrical diagrams for the {vehicleLabel}.
              </p>
            </div>
            <Link href="/wiring" className="text-sm text-cyan-400 hover:underline">
              Browse all wiring pages →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {wiringGroup.nodes.map((node) => (
              <Link
                key={node.nodeId || node.href}
                href={node.href}
                className="rounded-xl border border-white/10 bg-slate-900/45 p-4 transition-all group hover:border-violet-500/35 hover:bg-slate-900/65"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-violet-300/80 mb-2">{node.badge}</p>
                <h3 className="text-base font-semibold text-white group-hover:text-violet-300 transition-colors">
                  {stripVehiclePrefix(node.label, vehicleLabel)}
                </h3>
                <p className="text-sm text-gray-400 mt-2">{node.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {rankedKnowledgeGroups.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-12 border-t border-white/10 pt-10">
          <div className="max-w-3xl mb-6">
            <h2 className="text-xl font-bold text-white">Related Resources</h2>
            <p className="text-sm text-gray-400 mt-1">
              More guides, diagrams, and reference pages connected to the {vehicleLabel}.
            </p>
          </div>
          <div className="grid xl:grid-cols-2 gap-6">
            {rankedKnowledgeGroups.map((group) => (
              <KnowledgeGraphGroup
                key={group.kind}
                surface="vehicle"
                groupKind={group.kind}
                title={group.title}
                browseHref={group.browseHref}
                theme={group.theme}
                nodes={group.nodes.map((node) => ({
                  nodeId: node.nodeId,
                  edgeId: node.edgeId,
                  sourceNodeId: node.sourceNodeId,
                  targetNodeId: node.targetNodeId,
                  vehicleNodeId: node.vehicleNodeId,
                  taskNodeId: node.taskNodeId,
                  systemNodeId: node.systemNodeId,
                  codeNodeId: node.codeNodeId,
                  href: node.href,
                  label: node.label,
                  description: node.description,
                  badge: node.badge,
                  targetKind: node.kind,
                }))}
                context={{ vehicle: vehicleLabel }}
              />
            ))}
          </div>
        </section>
      )}

      {relatedYears.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <h2 className="text-xl font-bold text-white mb-4">Nearby {originalMake} {originalModel} Year Hubs</h2>
          <div className="flex flex-wrap gap-2">
            {relatedYears.map((relatedYear) => (
              <Link
                key={relatedYear}
                href={`/repair/${relatedYear}/${canonicalMake}/${canonicalModel}`}
                className="rounded-lg border border-white/10 bg-slate-900/45 px-3 py-2 text-sm text-gray-300 transition-all hover:border-cyan-500/40 hover:text-cyan-300"
              >
                {relatedYear} {originalMake} {originalModel}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-xl font-bold text-white mb-4">Frequently Asked Questions</h2>
        <dl className="space-y-4">
          {faqItems.map((faq) => (
            <div key={faq.question} className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/45">
              <dt className="px-5 py-4 font-semibold text-white">{faq.question}</dt>
              <dd className="px-5 pb-4 text-sm leading-7 text-gray-400">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}

const CARD_TONE_CLASSES: Record<CommandCardTone, {
  shell: string;
  eyebrow: string;
  count: string;
  button: string;
  chip: string;
}> = {
  cyan: {
    shell: 'border-cyan-500/20 bg-cyan-500/[0.06]',
    eyebrow: 'text-cyan-300/80',
    count: 'text-cyan-300',
    button: 'border-cyan-400/35 text-cyan-200 hover:border-cyan-300/60 hover:bg-cyan-500/10',
    chip: 'border-cyan-500/20 bg-cyan-500/[0.08] text-cyan-100',
  },
  emerald: {
    shell: 'border-emerald-500/20 bg-emerald-500/[0.06]',
    eyebrow: 'text-emerald-300/80',
    count: 'text-emerald-300',
    button: 'border-emerald-400/35 text-emerald-200 hover:border-emerald-300/60 hover:bg-emerald-500/10',
    chip: 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-100',
  },
  amber: {
    shell: 'border-amber-500/20 bg-amber-500/[0.06]',
    eyebrow: 'text-amber-300/80',
    count: 'text-amber-300',
    button: 'border-amber-400/35 text-amber-100 hover:border-amber-300/60 hover:bg-amber-500/10',
    chip: 'border-amber-500/20 bg-amber-500/[0.08] text-amber-100',
  },
  violet: {
    shell: 'border-violet-500/20 bg-violet-500/[0.06]',
    eyebrow: 'text-violet-300/80',
    count: 'text-violet-300',
    button: 'border-violet-400/35 text-violet-200 hover:border-violet-300/60 hover:bg-violet-500/10',
    chip: 'border-violet-500/20 bg-violet-500/[0.08] text-violet-100',
  },
  slate: {
    shell: 'border-slate-500/20 bg-slate-500/[0.08]',
    eyebrow: 'text-slate-300/80',
    count: 'text-slate-200',
    button: 'border-slate-400/35 text-slate-100 hover:border-slate-300/60 hover:bg-slate-500/10',
    chip: 'border-slate-500/20 bg-slate-500/[0.10] text-slate-100',
  },
};

function HubActionCard({
  eyebrow,
  title,
  description,
  countLabel,
  tone,
  primaryHref,
  primaryLabel,
  previewLinks,
}: {
  eyebrow: string;
  title: string;
  description: string;
  countLabel: string;
  tone: CommandCardTone;
  primaryHref: string;
  primaryLabel: string;
  previewLinks: PreviewLink[];
}) {
  const toneClasses = CARD_TONE_CLASSES[tone];

  return (
    <div className={`rounded-2xl border p-5 ${toneClasses.shell}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[11px] uppercase tracking-[0.2em] ${toneClasses.eyebrow}`}>{eyebrow}</p>
          <h3 className="text-xl font-semibold text-white mt-2">{title}</h3>
        </div>
        <span className={`text-xs font-medium ${toneClasses.count}`}>{countLabel}</span>
      </div>
      <p className="text-sm leading-6 text-gray-300 mt-3">{description}</p>
      <Link
        href={primaryHref}
        className={`mt-4 inline-flex rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${toneClasses.button}`}
      >
        {primaryLabel} →
      </Link>
      {previewLinks.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {previewLinks.map((link) => (
            <Link
              key={`${title}-${link.href}-${link.label}`}
              href={link.href}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${toneClasses.chip}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function DiyQuickStartCard({
  eyebrow,
  title,
  description,
  guideHint,
  spotlight,
  tone,
  primaryHref,
  primaryLabel,
  previewLinks,
}: {
  eyebrow: string;
  title: string;
  description: string;
  guideHint: string;
  spotlight?: string | null;
  tone: CommandCardTone;
  primaryHref: string;
  primaryLabel: string;
  previewLinks: PreviewLink[];
}) {
  const toneClasses = CARD_TONE_CLASSES[tone];

  return (
    <div className={`rounded-2xl border p-5 ${toneClasses.shell}`}>
      <p className={`text-[11px] uppercase tracking-[0.2em] ${toneClasses.eyebrow}`}>{eyebrow}</p>
      <h3 className="text-xl font-semibold text-white mt-2">{title}</h3>
      {spotlight && (
        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mt-2">{spotlight}</p>
      )}
      <p className="text-sm leading-6 text-gray-300 mt-3">{description}</p>
      <p className="text-xs leading-5 text-gray-400 mt-3">{guideHint}</p>
      <Link
        href={primaryHref}
        className={`mt-4 inline-flex rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${toneClasses.button}`}
      >
        {primaryLabel} →
      </Link>
      {previewLinks.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {previewLinks.map((link) => (
            <Link
              key={`${title}-${link.href}-${link.label}`}
              href={link.href}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${toneClasses.chip}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EntryPanel({
  title,
  description,
  tone,
  browseHref,
  entries,
}: {
  title: string;
  description: string;
  tone: CommandCardTone;
  browseHref: string;
  entries: Array<{ href: string; label: string; description: string }>;
}) {
  const toneClasses = CARD_TONE_CLASSES[tone];

  return (
    <div className={`rounded-2xl border p-6 ${toneClasses.shell}`}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="text-sm text-gray-300 mt-2">{description}</p>
        </div>
        <Link href={browseHref} className={`text-sm hover:underline ${toneClasses.count}`}>
          Browse →
        </Link>
      </div>
      <div className="space-y-3 mt-5">
        {entries.map((entry) => (
          <Link
            key={`${title}-${entry.href}-${entry.label}`}
            href={entry.href}
            className="block rounded-xl border border-white/10 bg-slate-900/45 p-4 transition-all hover:border-white/20 hover:bg-slate-900/65"
          >
            <p className="text-base font-semibold text-white">{entry.label}</p>
            <p className="text-sm text-gray-400 mt-2">{entry.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function DemandStatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/45 p-4">
      <p className="text-xs uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-2xl font-semibold text-white mt-2">{value}</p>
      <p className="text-xs text-gray-500 mt-2">{detail}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/45 p-4">
      <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
