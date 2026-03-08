import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import {
  buildWiringSeoHref,
  findWiringSeoVehicleBySlug,
  WIRING_SEO_SYSTEMS,
  WIRING_SEO_VEHICLES,
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
import {
  getCodeLinksForWiringSystem,
  getRepairLinksForWiringVehicle,
} from '@/lib/diagnosticCrossLinks';
import { getManualSectionLinksForWiringVehicle } from '@/lib/manualSectionLinks';

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

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
}): string {
  const params = new URLSearchParams({
    year: String(args.year),
    make: args.make,
    variant: args.variant,
    q: args.search,
  });
  return `/wiring?${params.toString()}`;
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

  const data = await loadVehicleWiringData(vehicle.year, vehicle.make, vehicle.model);
  if (!data) {
    notFound();
  }

  const systemDiagrams = rankDiagramsForSystem(data.index, systemMeta.matchTerms, 48);
  const vehicleLabel = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const browserHref = buildInteractiveHref({
    year: vehicle.year,
    make: vehicle.make,
    variant: data.resolvedVariant,
    search: systemMeta.shortLabel,
  });

  const relatedSystems = (Object.keys(WIRING_SEO_SYSTEMS) as WiringSystemSlug[])
    .filter(key => key !== systemSlug)
    .map(key => ({
      key,
      href: buildWiringSeoHref(vehicle, key),
      label: WIRING_SEO_SYSTEMS[key].title,
    }));

  const sameSystemVehicles = WIRING_SEO_VEHICLES
    .filter(v => !(v.year === vehicle.year && v.make === vehicle.make && v.model === vehicle.model))
    .slice(0, 8);
  const relatedRepairLinks = getRepairLinksForWiringVehicle(vehicle, systemSlug, 4);
  const relatedCodeLinks = getCodeLinksForWiringSystem(systemSlug, 6);
  const manualSectionLinks = await getManualSectionLinksForWiringVehicle(vehicle, systemSlug, 4);

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

      <section className="max-w-6xl mx-auto px-4 pt-24 pb-12">
        <p className="text-cyan-400 text-xs uppercase tracking-[0.2em] font-bold mb-3">Wiring Diagram Cluster</p>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
          {vehicleLabel} <span className="text-cyan-400">{systemMeta.title}</span>
        </h1>
        <p className="text-gray-300 text-lg max-w-3xl">{systemMeta.intro}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <WiringTrackedLink
            href={browserHref}
            vehicle={vehicleLabel}
            system={systemMeta.shortLabel}
            target="interactive_library"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition"
          >
            Open Interactive Diagram Browser
          </WiringTrackedLink>
          <Link
            href="/wiring"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/20 text-gray-200 hover:border-cyan-400/50 hover:text-white transition"
          >
            Browse All Wiring Diagrams
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8">
          <StatCard label="Matched Diagrams" value={String(systemDiagrams.length)} />
          <StatCard label="Variant Used" value={data.resolvedVariant} />
          <StatCard label="Total Vehicle Diagrams" value={String(data.index.totalDiagrams)} />
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
        {(manualSectionLinks.length > 0 || relatedRepairLinks.length > 0 || relatedCodeLinks.length > 0) && (
          <>
            {manualSectionLinks.length > 0 && (
              <div className="rounded-2xl border border-slate-500/20 bg-slate-500/10 p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-xl font-bold text-slate-200">OEM Manual Evidence</h3>
                  <Link href="/manual" className="text-xs text-slate-300 hover:underline">
                    Browse manuals →
                  </Link>
                </div>
                <div className="grid gap-3">
                  {manualSectionLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-xl border border-slate-500/20 bg-black/20 px-4 py-3 hover:border-slate-400/40 hover:bg-black/30 transition"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-white">{link.label}</span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">{link.badge}</span>
                      </div>
                      <p className="text-sm text-gray-300 mt-2">{link.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {relatedRepairLinks.length > 0 && (
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-xl font-bold text-cyan-300">Repairs That Intersect This Wiring</h3>
                  <Link href="/repair" className="text-xs text-cyan-400 hover:underline">
                    Browse repairs →
                  </Link>
                </div>
                <div className="grid gap-3">
                  {relatedRepairLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-xl border border-cyan-500/20 bg-black/20 px-4 py-3 hover:border-cyan-400/40 hover:bg-black/30 transition"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-white">{link.label}</span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">{link.badge}</span>
                      </div>
                      <p className="text-sm text-gray-300 mt-2">{link.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {relatedCodeLinks.length > 0 && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-xl font-bold text-amber-300">Likely Trouble Codes for This System</h3>
                  <Link href="/codes" className="text-xs text-amber-400 hover:underline">
                    Browse codes →
                  </Link>
                </div>
                <div className="grid gap-3">
                  {relatedCodeLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-xl border border-amber-500/20 bg-black/20 px-4 py-3 hover:border-amber-400/40 hover:bg-black/30 transition"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-white">{link.label}</span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">{link.badge}</span>
                      </div>
                      <p className="text-sm text-gray-300 mt-2">{link.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
              <Link
                key={`${v.year}-${v.make}-${v.model}`}
                href={buildWiringSeoHref(v, systemSlug)}
                className="rounded-lg border border-white/10 px-4 py-3 text-gray-300 hover:text-white hover:border-cyan-400/40 transition"
              >
                {v.year} {v.make} {v.model} {WIRING_SEO_SYSTEMS[systemSlug].shortLabel} Wiring Diagram
              </Link>
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
