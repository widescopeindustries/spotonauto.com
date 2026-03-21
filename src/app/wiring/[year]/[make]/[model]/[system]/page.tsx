import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import {
  buildWiringSeoHref,
  findWiringSeoVehicleBySlug,
  getRelatedWiringSeoVehicles,
  WIRING_SEO_SYSTEMS,
  supportsWiringSystem,
  type WiringSystemSlug,
} from '@/data/wiring-seo-cluster';
import {
  fetchWiringDiagramIndex,
  fetchWiringVariants,
  resolveVariantForModel,
  type WiringDiagramIndex,
} from '@/lib/wiringData';
import WiringSeoTracker from '@/app/wiring/WiringSeoTracker';
import WiringTrackedLink from '@/app/wiring/WiringTrackedLink';
import KnowledgeGraphGroup from '@/components/KnowledgeGraphGroup';
import {
  getCodeLinksForWiringSystem,
  getRepairLinksForWiringVehicle,
} from '@/lib/diagnosticCrossLinks';
import { buildWiringNodeId } from '@/lib/knowledgeGraph';
import { buildKnowledgeGraphExport } from '@/lib/knowledgeGraphExport';
import { rankKnowledgeGraphBlocks } from '@/lib/knowledgeGraphRanking';
import { getManualSectionLinksForWiringVehicle } from '@/lib/manualSectionLinks';
import { buildVehicleHubLinkForWiring } from '@/lib/vehicleHubLinks';
import { buildVehicleHubUrl } from '@/lib/vehicleIdentity';

export const revalidate = 21600;

interface PageProps {
  params: Promise<{
    year: string;
    make: string;
    model: string;
    system: string;
  }>;
}

interface MatchedDiagram {
  name: string;
  url: string;
  system: string;
  score: number;
}

type WiringCtaTarget =
  | 'interactive_library'
  | 'diagram_jump'
  | 'cluster_nav'
  | 'vehicle_hub'
  | 'repair_path'
  | 'code_path'
  | 'manual_path'
  | 'same_system_vehicle';

type WiringCardTone = 'emerald' | 'cyan' | 'amber' | 'slate' | 'violet';

interface WiringActionLink {
  href: string;
  label: string;
  target: WiringCtaTarget;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripVehiclePrefix(label: string, vehicleLabel: string): string {
  const prefix = `${vehicleLabel} `;
  return label.startsWith(prefix) ? label.slice(prefix.length) : label;
}

function rankDiagramsForSystem(index: WiringDiagramIndex, terms: string[], limit = 60): MatchedDiagram[] {
  const normalizedTerms = terms.map(normalizeText);
  const ranked: MatchedDiagram[] = [];
  const seenUrls = new Set<string>();

  for (const group of index.systems) {
    const systemNorm = normalizeText(group.system);
    for (const diagram of group.diagrams) {
      let score = 0;
      const nameNorm = normalizeText(diagram.name);

      for (const term of normalizedTerms) {
        if (systemNorm.includes(term)) score += 3;
        if (nameNorm.includes(term)) score += 5;
      }

      if (score === 0 || seenUrls.has(diagram.url)) continue;
      seenUrls.add(diagram.url);
      ranked.push({
        name: diagram.name,
        url: diagram.url,
        system: group.system,
        score,
      });
    }
  }

  return ranked
    .sort((a, b) => (b.score - a.score) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function buildInteractiveHref(args: {
  year: number;
  make: string;
  variant: string;
  search: string;
  model?: string;
  autoOpen?: boolean;
}): string {
  const params = new URLSearchParams({
    year: String(args.year),
    make: args.make,
    variant: args.variant,
    q: args.search,
  });
  if (args.model) {
    params.set('model', args.model);
  }
  if (args.autoOpen) {
    params.set('open', '1');
  }
  return `/wiring?${params.toString()}#diagram-browser`;
}

const loadVehicleWiringData = cache(async (year: number, make: string, model: string) => {
  const variants = await fetchWiringVariants(make, String(year));
  if (variants.length === 0) return null;

  const resolvedVariant = resolveVariantForModel(variants, model) || variants[0];
  const index = await fetchWiringDiagramIndex(make, String(year), resolvedVariant);
  return {
    resolvedVariant,
    index,
  };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year, make, model, system } = await params;
  const vehicle = findWiringSeoVehicleBySlug(year, make, model);
  const systemSlug = system as WiringSystemSlug;
  const systemMeta = WIRING_SEO_SYSTEMS[systemSlug];

  if (!vehicle || !systemMeta) {
    return {
      title: 'Wiring Diagram Not Found | SpotOnAuto',
      description: 'Browse wiring diagrams by make, year, and model on SpotOnAuto.',
    };
  }
  if (!supportsWiringSystem(vehicle, systemSlug)) {
    return {
      title: 'Wiring Diagram Not Found | SpotOnAuto',
      description: 'Browse wiring diagrams by make, year, and model on SpotOnAuto.',
    };
  }

  const vehicleLabel = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const canonical = `https://spotonauto.com${buildWiringSeoHref(vehicle, systemSlug)}`;
  const title = `${vehicleLabel} ${systemMeta.title} | Free OEM Schematics`;
  const description = `${vehicleLabel} ${systemMeta.title}: ${systemMeta.intro} Free access with searchable OEM electrical schematics.`;

  return {
    title,
    description,
    keywords: [
      `${vehicleLabel} ${systemMeta.title}`.toLowerCase(),
      ...systemMeta.keywords,
      `${vehicle.make} ${vehicle.model} wiring`.toLowerCase(),
      'oem wiring schematic',
      'free wiring diagrams',
    ],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonical,
    },
  };
}

export default async function WiringSystemSeoPage({ params }: PageProps) {
  const { year, make, model, system } = await params;
  const vehicle = findWiringSeoVehicleBySlug(year, make, model);
  const systemSlug = system as WiringSystemSlug;
  const systemMeta = WIRING_SEO_SYSTEMS[systemSlug];

  if (!vehicle || !systemMeta) {
    notFound();
  }
  if (!supportsWiringSystem(vehicle, systemSlug)) {
    notFound();
  }

  const data = await loadVehicleWiringData(vehicle.year, vehicle.make, vehicle.model);
  if (!data) {
    notFound();
  }

  const systemDiagrams = rankDiagramsForSystem(data.index, systemMeta.matchTerms, 48);
  const vehicleLabel = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const vehicleHubHref = buildVehicleHubUrl(vehicle.year, vehicle.make, vehicle.model);
  const vehicleHubNode = buildVehicleHubLinkForWiring({
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    system: systemSlug,
  });
  const browserHref = buildInteractiveHref({
    year: vehicle.year,
    make: vehicle.make,
    variant: data.resolvedVariant,
    search: systemMeta.shortLabel,
    model: vehicle.model,
    autoOpen: true,
  });

  const relatedSystems = (Object.keys(WIRING_SEO_SYSTEMS) as WiringSystemSlug[])
    .filter((key) => key !== systemSlug && supportsWiringSystem(vehicle, key))
    .map(key => ({
      key,
      href: buildWiringSeoHref(vehicle, key),
      label: WIRING_SEO_SYSTEMS[key].title,
    }));

  const sameSystemVehicles = getRelatedWiringSeoVehicles(vehicle, systemSlug, 8);
  const relatedRepairLinks = getRepairLinksForWiringVehicle(vehicle, systemSlug, 4);
  const relatedCodeLinks = getCodeLinksForWiringSystem(systemSlug, 6);
  const manualSectionLinks = await getManualSectionLinksForWiringVehicle(vehicle, systemSlug, 4);
  const nextStepCards: Array<{
    eyebrow: string;
    title: string;
    description: string;
    tone: WiringCardTone;
    primaryLink: WiringActionLink;
    secondaryLinks: WiringActionLink[];
  }> = [
    {
      eyebrow: 'Keep context',
      title: 'Exact Vehicle Command Center',
      description: `Step out of raw diagrams and into the full ${vehicleLabel} hub with repairs, specs, codes, and other systems already tied to this car.`,
      tone: 'emerald',
      primaryLink: {
        href: vehicleHubHref,
        label: 'Open vehicle command center',
        target: 'vehicle_hub',
      },
      secondaryLinks: [
        ...(relatedRepairLinks.slice(0, 2).map((link) => ({
          href: link.href,
          label: stripVehiclePrefix(link.label, vehicleLabel),
          target: 'repair_path' as const,
        }))),
        ...(manualSectionLinks.slice(0, 1).map((link) => ({
          href: link.href,
          label: link.label,
          target: 'manual_path' as const,
        }))),
      ].slice(0, 3),
    },
    relatedRepairLinks.length > 0
      ? {
          eyebrow: 'Likely fix path',
          title: 'Exact Repair Guides',
          description: `These repair flows most often intersect with ${systemMeta.shortLabel.toLowerCase()} diagnosis on this exact vehicle.`,
          tone: 'cyan' as const,
          primaryLink: {
            href: relatedRepairLinks[0].href,
            label: stripVehiclePrefix(relatedRepairLinks[0].label, vehicleLabel),
            target: 'repair_path',
          },
          secondaryLinks: relatedRepairLinks.slice(1, 4).map((link) => ({
            href: link.href,
            label: stripVehiclePrefix(link.label, vehicleLabel),
            target: 'repair_path' as const,
          })),
        }
      : {
          eyebrow: 'OEM source',
          title: 'Factory Manual Evidence',
          description: 'When there is no clean repair shortcut for this system, drop into the OEM manual sections that usually carry the authoritative test path.',
          tone: 'slate' as const,
          primaryLink: {
            href: manualSectionLinks[0]?.href || browserHref,
            label: manualSectionLinks[0]?.label || 'Open interactive browser',
            target: manualSectionLinks[0] ? 'manual_path' : 'interactive_library',
          },
          secondaryLinks: manualSectionLinks.slice(1, 4).map((link) => ({
            href: link.href,
            label: link.label,
            target: 'manual_path' as const,
          })),
        },
    relatedCodeLinks.length > 0
      ? {
          eyebrow: 'Diagnostic signal',
          title: 'Codes Often Seen With This System',
          description: 'Use the code cluster when wiring faults overlap with check-engine or module-level diagnostics.',
          tone: 'amber' as const,
          primaryLink: {
            href: relatedCodeLinks[0].href,
            label: relatedCodeLinks[0].label,
            target: 'code_path',
          },
          secondaryLinks: relatedCodeLinks.slice(1, 4).map((link) => ({
            href: link.href,
            label: link.label,
            target: 'code_path' as const,
          })),
        }
      : {
          eyebrow: 'Stay in wiring',
          title: 'More System Pages for This Vehicle',
          description: 'Move laterally into the neighboring systems that usually share the same electrical neighborhood.',
          tone: 'violet' as const,
          primaryLink: {
            href: relatedSystems[0]?.href || '/wiring',
            label: relatedSystems[0]?.label || 'Browse all wiring pages',
            target: 'cluster_nav',
          },
          secondaryLinks: relatedSystems.slice(1, 4).map((link) => ({
            href: link.href,
            label: link.label,
            target: 'cluster_nav' as const,
          })),
        },
  ];
  const graphBlocks = rankKnowledgeGraphBlocks('wiring', [
    {
      kind: 'vehicle' as const,
      title: 'Exact Vehicle Hub',
      browseHref: vehicleHubHref,
      theme: 'emerald' as const,
      nodes: [{
        ...vehicleHubNode,
        targetKind: 'vehicle' as const,
      }],
    },
    ...(manualSectionLinks.length > 0 ? [{
      kind: 'manual' as const,
      title: 'OEM Manual Evidence',
      browseHref: '/manual',
      theme: 'slate' as const,
      nodes: manualSectionLinks.map((link) => ({
        ...link,
        targetKind: 'manual' as const,
      })),
    }] : []),
    ...(relatedRepairLinks.length > 0 ? [{
      kind: 'repair' as const,
      title: 'Repairs That Intersect This Wiring',
      browseHref: '/repair',
      theme: 'cyan' as const,
      nodes: relatedRepairLinks.map((link) => ({
        ...link,
        targetKind: 'repair' as const,
      })),
    }] : []),
    ...(relatedCodeLinks.length > 0 ? [{
      kind: 'dtc' as const,
      title: 'Likely Trouble Codes for This System',
      browseHref: '/codes',
      theme: 'amber' as const,
      nodes: relatedCodeLinks.map((link) => ({
        ...link,
        targetKind: 'dtc' as const,
      })),
    }] : []),
  ]);
  const knowledgeGraphExport = buildKnowledgeGraphExport({
    surface: 'wiring',
    rootNodeId: buildWiringNodeId(vehicle.year, vehicle.make, vehicle.model, systemSlug),
    rootKind: 'wiring',
    rootLabel: `${vehicleLabel} ${systemMeta.title}`,
    blocks: graphBlocks.map((block) => ({
      kind: block.kind,
      title: block.title,
      browseHref: block.browseHref,
      nodes: block.nodes.map((node) => ({
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
        targetKind: node.targetKind,
      })),
    })),
  });

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Where can I find the ${systemMeta.shortLabel.toLowerCase()} wiring diagram for ${vehicleLabel}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Use the interactive SpotOnAuto wiring browser for ${vehicleLabel}. Select ${vehicle.year}, ${vehicle.make}, ${data.resolvedVariant}, then search ${systemMeta.shortLabel}.`,
        },
      },
      {
        '@type': 'Question',
        name: `Does this include OEM factory wiring schematics?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Diagrams are sourced from factory manual archives and exposed through a searchable interface for faster diagnostics.',
        },
      },
      {
        '@type': 'Question',
        name: `What should I check first when diagnosing ${systemMeta.shortLabel.toLowerCase()} wiring issues?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Start with fuse and relay feeds, then verify power and ground at the component connector, and finally trace control signal paths using the specific diagram for your exact variant.',
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white">
      <WiringSeoTracker vehicle={vehicleLabel} system={systemMeta.shortLabel} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script
        id="knowledge-graph-export"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(knowledgeGraphExport) }}
      />

      <section className="max-w-6xl mx-auto px-4 pt-24 pb-12">
        <p className="text-cyan-400 text-xs uppercase tracking-[0.2em] font-bold mb-3">Wiring Diagram Cluster</p>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
          {vehicleLabel} <span className="text-cyan-400">{systemMeta.title}</span>
        </h1>
        <p className="text-gray-300 text-lg max-w-3xl">{systemMeta.intro}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <WiringTrackedLink
            href={vehicleHubHref}
            vehicle={vehicleLabel}
            system={systemMeta.shortLabel}
            target="vehicle_hub"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-emerald-400/30 text-emerald-200 hover:border-emerald-300/50 hover:text-white transition"
          >
            Open Exact Vehicle Repair Hub
          </WiringTrackedLink>
          <WiringTrackedLink
            href={browserHref}
            vehicle={vehicleLabel}
            system={systemMeta.shortLabel}
            target="interactive_library"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition"
          >
            Open Interactive Diagram Browser
          </WiringTrackedLink>
          <WiringTrackedLink
            href="/wiring"
            vehicle={vehicleLabel}
            system={systemMeta.shortLabel}
            target="cluster_nav"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/20 text-gray-200 hover:border-cyan-400/50 hover:text-white transition"
          >
            Browse All Wiring Diagrams
          </WiringTrackedLink>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8">
          <StatCard label="Matched Diagrams" value={String(systemDiagrams.length)} />
          <StatCard label="Variant Used" value={data.resolvedVariant} />
          <StatCard label="Total Vehicle Diagrams" value={String(data.index.totalDiagrams)} />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.05] p-6 md:p-8">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-300/85">From Diagram To Fix</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-3">Use this wiring page as the jump point, not the dead end</h2>
            <p className="text-sm md:text-base text-gray-300 mt-3">
              Open the exact diagram, then move directly into the vehicle hub, the repair most likely tied to this system, or the code cluster that usually shows up with it.
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-4 mt-6">
            {nextStepCards.map((card) => (
              <WiringStepCard
                key={card.title}
                vehicle={vehicleLabel}
                system={systemMeta.shortLabel}
                eyebrow={card.eyebrow}
                title={card.title}
                description={card.description}
                tone={card.tone}
                primaryLink={card.primaryLink}
                secondaryLinks={card.secondaryLinks}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-14">
        <h2 className="text-2xl font-bold mb-4">Top {systemMeta.shortLabel} Diagram Paths</h2>
        {systemDiagrams.length === 0 ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-200">
            No direct matches were found for this system label. Use the interactive browser and search by component name.
          </div>
        ) : (
          <div className="grid gap-2">
            {systemDiagrams.map((diagram, index) => (
              <WiringTrackedLink
                key={diagram.url}
                href={buildInteractiveHref({
                  year: vehicle.year,
                  make: vehicle.make,
                  variant: data.resolvedVariant,
                  search: diagram.name.slice(0, 90),
                  model: vehicle.model,
                  autoOpen: true,
                })}
                vehicle={vehicleLabel}
                system={systemMeta.shortLabel}
                target="diagram_jump"
                className="group rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:border-cyan-400/50 transition flex items-start justify-between gap-4"
              >
                <span className="text-gray-300 group-hover:text-white transition">
                  <strong className="text-cyan-400 mr-2">{index + 1}.</strong>
                  {diagram.name}
                  <span className="block text-xs text-gray-500 mt-1">{diagram.system}</span>
                </span>
                <span className="text-cyan-400 text-sm shrink-0 mt-0.5">Open</span>
              </WiringTrackedLink>
            ))}
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16 grid lg:grid-cols-2 gap-6">
        {graphBlocks.length > 0 && (
          <>
            {graphBlocks.map((block) => (
              <KnowledgeGraphGroup
                key={block.kind}
                surface="wiring"
                groupKind={block.kind}
                title={block.title}
                browseHref={block.browseHref}
                theme={block.theme}
                nodes={block.nodes}
                context={{ vehicle: vehicleLabel, system: systemMeta.shortLabel }}
              />
            ))}
          </>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="text-xl font-bold mb-4">More {vehicle.model} Wiring Pages</h3>
          <div className="grid gap-2">
            {relatedSystems.map(link => (
              <WiringTrackedLink
                key={link.key}
                href={link.href}
                vehicle={vehicleLabel}
                system={systemMeta.shortLabel}
                target="cluster_nav"
                className="rounded-lg border border-white/10 px-4 py-3 text-gray-300 hover:text-white hover:border-cyan-400/40 transition"
              >
                {link.label}
              </WiringTrackedLink>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="text-xl font-bold mb-4">Same System, Other Vehicles</h3>
          <div className="grid gap-2">
            {sameSystemVehicles.map(v => (
              <WiringTrackedLink
                key={`${v.year}-${v.make}-${v.model}`}
                href={buildWiringSeoHref(v, systemSlug)}
                vehicle={vehicleLabel}
                system={systemMeta.shortLabel}
                target="same_system_vehicle"
                className="rounded-lg border border-white/10 px-4 py-3 text-gray-300 hover:text-white hover:border-cyan-400/40 transition"
              >
                {v.year} {v.make} {v.model} {WIRING_SEO_SYSTEMS[systemSlug].shortLabel} Wiring Diagram
              </WiringTrackedLink>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className="text-sm text-white font-semibold">{value}</p>
    </div>
  );
}

const WIRING_CARD_TONE_CLASSES: Record<WiringCardTone, {
  shell: string;
  eyebrow: string;
  button: string;
  chip: string;
}> = {
  emerald: {
    shell: 'border-emerald-500/20 bg-emerald-500/[0.06]',
    eyebrow: 'text-emerald-300/80',
    button: 'border-emerald-400/35 text-emerald-200 hover:border-emerald-300/60 hover:bg-emerald-500/10',
    chip: 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-100',
  },
  cyan: {
    shell: 'border-cyan-500/20 bg-cyan-500/[0.06]',
    eyebrow: 'text-cyan-300/80',
    button: 'border-cyan-400/35 text-cyan-200 hover:border-cyan-300/60 hover:bg-cyan-500/10',
    chip: 'border-cyan-500/20 bg-cyan-500/[0.08] text-cyan-100',
  },
  amber: {
    shell: 'border-amber-500/20 bg-amber-500/[0.06]',
    eyebrow: 'text-amber-300/80',
    button: 'border-amber-400/35 text-amber-100 hover:border-amber-300/60 hover:bg-amber-500/10',
    chip: 'border-amber-500/20 bg-amber-500/[0.08] text-amber-100',
  },
  slate: {
    shell: 'border-slate-500/20 bg-slate-500/[0.08]',
    eyebrow: 'text-slate-300/80',
    button: 'border-slate-400/35 text-slate-100 hover:border-slate-300/60 hover:bg-slate-500/10',
    chip: 'border-slate-500/20 bg-slate-500/[0.10] text-slate-100',
  },
  violet: {
    shell: 'border-violet-500/20 bg-violet-500/[0.06]',
    eyebrow: 'text-violet-300/80',
    button: 'border-violet-400/35 text-violet-200 hover:border-violet-300/60 hover:bg-violet-500/10',
    chip: 'border-violet-500/20 bg-violet-500/[0.08] text-violet-100',
  },
};

function WiringStepCard({
  vehicle,
  system,
  eyebrow,
  title,
  description,
  tone,
  primaryLink,
  secondaryLinks,
}: {
  vehicle: string;
  system: string;
  eyebrow: string;
  title: string;
  description: string;
  tone: WiringCardTone;
  primaryLink: WiringActionLink;
  secondaryLinks: WiringActionLink[];
}) {
  const toneClasses = WIRING_CARD_TONE_CLASSES[tone];

  return (
    <div className={`rounded-2xl border p-5 ${toneClasses.shell}`}>
      <p className={`text-[11px] uppercase tracking-[0.2em] ${toneClasses.eyebrow}`}>{eyebrow}</p>
      <h3 className="text-xl font-semibold text-white mt-2">{title}</h3>
      <p className="text-sm leading-6 text-gray-300 mt-3">{description}</p>
      <WiringTrackedLink
        href={primaryLink.href}
        vehicle={vehicle}
        system={system}
        target={primaryLink.target}
        className={`mt-4 inline-flex rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${toneClasses.button}`}
      >
        {primaryLink.label} →
      </WiringTrackedLink>
      {secondaryLinks.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {secondaryLinks.map((link) => (
            <WiringTrackedLink
              key={`${title}-${link.href}-${link.label}`}
              href={link.href}
              vehicle={vehicle}
              system={system}
              target={link.target}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${toneClasses.chip}`}
            >
              {link.label}
            </WiringTrackedLink>
          ))}
        </div>
      )}
    </div>
  );
}
