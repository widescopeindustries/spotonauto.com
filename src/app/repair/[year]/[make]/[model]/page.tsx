import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import KnowledgeGraphGroup from '@/components/KnowledgeGraphGroup';
import {
  NOINDEX_MAKES,
  VEHICLE_PRODUCTION_YEARS,
  slugifyRoutePart,
} from '@/data/vehicles';
import { getTier1RescuePagesForExactVehicle, getTier1RescuePagesForVehicle } from '@/data/rescuePriority';
import { buildVehicleNodeId } from '@/lib/vehicleIdentity';
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
    title: `${vehicleLabel} Repair Hub | Guides, Wiring, Codes & Manuals`,
    description: `Graph-driven repair hub for the ${vehicleLabel}. Open exact DIY repair guides, wiring diagrams, factory manual paths, tool pages, and likely trouble code clusters from one place.`,
    alternates: {
      canonical: `https://spotonauto.com/repair/${resolvedYear}/${canonicalMake}/${canonicalModel}`,
    },
    ...(NOINDEX_MAKES.has(canonicalMake) ? { robots: { index: false, follow: true } } : {}),
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
  const rankedKnowledgeGroups = rankKnowledgeGraphBlocks('vehicle', vehicleHub.groups);
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
  const exactVehicleTier1Pages = getTier1RescuePagesForExactVehicle(canonicalYear, originalMake, originalModel).slice(0, 6);
  const modelTier1Pages = getTier1RescuePagesForVehicle(originalMake, originalModel)
    .filter((entry) => entry.year !== resolvedYear)
    .slice(0, 6);
  const relatedYears = getRelatedYears(resolvedYear, production.start, production.end);

  const faqItems = [
    {
      question: `What can I do from the ${vehicleLabel} repair hub?`,
      answer: `This hub connects the strongest pages for the ${vehicleLabel}: exact repair guides, factory manual entry points, wiring diagrams, spec pages, and likely trouble code clusters. It is meant to get you from vehicle selection to the right repair surface quickly.`,
    },
    {
      question: `Does this hub only show exact ${vehicleLabel} pages?`,
      answer: `Yes. Repair and wiring links are built around the exact ${vehicleLabel} identity. Manual archive links can step out to the make or year index when the source material is organized that way, but the hub itself stays tied to your exact vehicle.`,
    },
    {
      question: `Why are factory manual links at the make or year level?`,
      answer: `The factory manual archive is not always organized as a clean year-make-model tree. This hub normalizes the vehicle identity first, then links you into the closest exact OEM entry points without losing the canonical ${vehicleLabel} context.`,
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
    description: `Graph-driven repair hub for the ${vehicleLabel} with exact repair guides, wiring pages, factory manual entry points, and code clusters.`,
    url: `https://spotonauto.com/repair/${canonicalYear}/${canonicalMake}/${canonicalModel}`,
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white">
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

        <p className="text-cyan-400 text-xs uppercase tracking-[0.2em] font-bold mb-3">Exact Vehicle Cluster</p>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          {vehicleLabel} <span className="text-cyan-400">Repair Hub</span>
        </h1>
        <p className="text-lg text-gray-300 max-w-3xl">
          One canonical page for your exact vehicle. Use it to move between repair guides, wiring diagrams, factory manual paths,
          tool pages, and high-signal code clusters without losing the {canonicalYear} {originalMake} {originalModel} context.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          <StatCard label="Repair paths" value={String(vehicleHub.repairCount)} />
          <StatCard label="Wiring systems" value={String(vehicleHub.wiringCount)} />
          <StatCard label="Spec pages" value={String(vehicleHub.toolCount)} />
          <StatCard label="Code clusters" value={String(vehicleHub.codeCount)} />
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Link
            href="/diagnose"
            className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5 hover:border-cyan-400/45 transition-all"
          >
            <h2 className="text-lg font-semibold text-white">Diagnose symptoms first</h2>
            <p className="text-sm text-gray-300 mt-2">Jump into guided diagnosis if you know the problem but not the repair yet.</p>
          </Link>
          <Link
            href={`/guides/${canonicalMake}/${canonicalModel}`}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-cyan-500/40 transition-all"
          >
            <h2 className="text-lg font-semibold text-white">Open model guide cluster</h2>
            <p className="text-sm text-gray-300 mt-2">Step back to the broader {originalMake} {originalModel} guide directory.</p>
          </Link>
          <Link
            href={manualGroup?.nodes[1]?.href || '/manual'}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-cyan-500/40 transition-all"
          >
            <h2 className="text-lg font-semibold text-white">Start from the OEM manual</h2>
            <p className="text-sm text-gray-300 mt-2">Open the nearest factory manual entry point for this exact vehicle year.</p>
          </Link>
        </div>
      </section>

      {(exactVehicleTier1Pages.length > 0 || modelTier1Pages.length > 0) && (
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-6">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-white">Tier-1 winner pages tied to this vehicle line</h2>
              <p className="text-sm text-gray-300 mt-2">
                These are the strongest exact repair pages already connected to the {originalMake} {originalModel} cluster. Keep them close to the vehicle hub so authority flows into pages that can rank sooner.
              </p>
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              {exactVehicleTier1Pages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Exact {vehicleLabel} winner pages</h3>
                  <div className="space-y-3">
                    {exactVehicleTier1Pages.map((entry) => (
                      <Link
                        key={entry.href}
                        href={entry.href}
                        className="block rounded-xl border border-white/10 bg-black/20 p-4 hover:border-violet-400/35 hover:bg-black/30 transition-all"
                      >
                        <p className="text-base font-semibold text-white">{entry.year} {entry.make} {entry.model}</p>
                        <p className="mt-1 text-sm capitalize text-gray-300">{entry.task.replace(/-/g, ' ')}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {modelTier1Pages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">More winner pages for this model line</h3>
                  <div className="space-y-3">
                    {modelTier1Pages.map((entry) => (
                      <Link
                        key={entry.href}
                        href={entry.href}
                        className="block rounded-xl border border-white/10 bg-black/20 p-4 hover:border-violet-400/35 hover:bg-black/30 transition-all"
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
                These are the strongest exact-match repair flows currently connected to this vehicle cluster.
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
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-cyan-500/35 hover:bg-white/[0.06] transition-all group"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-400/80 mb-2">{node.badge}</p>
                <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  {node.label}
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
              <h2 className="text-2xl font-bold text-white">Exact Wiring Surfaces</h2>
              <p className="text-sm text-gray-400 mt-1">
                Wiring pages tied directly to the {vehicleLabel} node.
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
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-violet-500/35 hover:bg-white/[0.06] transition-all group"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-violet-300/80 mb-2">{node.badge}</p>
                <h3 className="text-base font-semibold text-white group-hover:text-violet-300 transition-colors">
                  {node.label}
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
            <h2 className="text-xl font-bold text-white">Knowledge Paths for This Vehicle</h2>
            <p className="text-sm text-gray-400 mt-1">
              Canonical graph blocks grounded in the exact {vehicleLabel} identity. These groups are exported in machine-readable form for audit and future hub generation.
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
                className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-gray-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all"
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
            <div key={faq.question} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <dt className="px-5 py-4 font-semibold text-white">{faq.question}</dt>
              <dd className="px-5 pb-4 text-sm leading-7 text-gray-400">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
