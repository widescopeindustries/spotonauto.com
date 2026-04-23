import React from 'react';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTier1RescuePagesForVehicle } from '@/data/rescuePriority';
import SearchLandingMonetizationRail from '@/components/SearchLandingMonetizationRail';

export const revalidate = 86400; // 1 day ISR
import { VEHICLE_PRODUCTION_YEARS, VALID_TASKS, NOINDEX_MAKES, isNonUsModel, slugifyRoutePart } from '@/data/vehicles';
import { getToolPagesForVehicle, TOOL_TYPE_META } from '@/data/tools-pages';
import { FadeInUp, StaggerContainer, StaggerItem } from '@/components/MotionWrappers';
import { Wrench } from 'lucide-react';
import {
  getVehicleFamilyCommandCenterOpportunities,
  getVehicleFamilyQuerySignals,
} from '@/lib/commandCenterOpportunities';
import { buildRepairUrl } from '@/lib/vehicleIdentity';
import { buildVehicleHubGraph } from '@/lib/vehicleHubGraph';

interface PageProps {
  params: Promise<{
    make: string;
    model: string;
  }>;
}

function slugifyPart(value: string): string {
  return slugifyRoutePart(value);
}

function clampRepresentativeYear(preferredYear: number | null, start: number, end: number): number {
  if (preferredYear && preferredYear >= start && preferredYear <= end) return preferredYear;
  return Math.max(start, Math.min(2025, end));
}

export async function generateMetadata({ params }: PageProps) {
  const { make, model } = await params;
  const originalMake = Object.keys(VEHICLE_PRODUCTION_YEARS).find(
    (m) => slugifyPart(m) === make.toLowerCase()
  );
  const originalModel = originalMake
    ? Object.keys(VEHICLE_PRODUCTION_YEARS[originalMake]).find((m) => slugifyPart(m) === model.toLowerCase())
    : null;
  const canonicalMake = originalMake ? slugifyPart(originalMake) : make.toLowerCase();
  const canonicalModel = originalModel ? slugifyPart(originalModel) : model.toLowerCase();
  const displayMake = originalMake || make.charAt(0).toUpperCase() + make.slice(1).replace(/-/g, ' ');
  const displayModel = originalModel || model.charAt(0).toUpperCase() + model.slice(1).replace(/-/g, ' ');
  return {
    title: `${displayMake} ${displayModel} DIY Repair Guides | SpotOnAuto`,
    description: `Open step-by-step DIY repair guides for the ${displayMake} ${displayModel}, including maintenance intervals, common fault diagnosis, parts planning, and exact year-by-year repair paths.`,
    alternates: {
      canonical: `https://spotonauto.com/guides/${canonicalMake}/${canonicalModel}`,
    },
    ...(NOINDEX_MAKES.has(make.toLowerCase()) || isNonUsModel(make.toLowerCase(), model.toLowerCase()) ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ModelGuidesPage({ params }: PageProps) {
  const { make, model } = await params;
  
  // Find matching make in our data
  const originalMake = Object.keys(VEHICLE_PRODUCTION_YEARS).find(
    m => slugifyPart(m) === make.toLowerCase()
  );

  if (!originalMake) notFound();

  // Find matching model
  const originalModel = Object.keys(VEHICLE_PRODUCTION_YEARS[originalMake]).find(
    m => slugifyPart(m) === model.toLowerCase()
  );

  if (!originalModel) notFound();

  const canonicalMake = slugifyPart(originalMake);
  const canonicalModel = slugifyPart(originalModel);
  if (make !== canonicalMake || model !== canonicalModel) {
    permanentRedirect(`/guides/${canonicalMake}/${canonicalModel}`);
  }

  const production = VEHICLE_PRODUCTION_YEARS[originalMake][originalModel];
  const toolPages = getToolPagesForVehicle(originalMake, originalModel);
  const featuredToolPages = toolPages.slice(0, 8);
  const familyOpportunities = getVehicleFamilyCommandCenterOpportunities(originalMake, originalModel, { limit: 4 });
  const familyQuerySignals = getVehicleFamilyQuerySignals(originalMake, originalModel, { limit: 6 });
  const targetYear = clampRepresentativeYear(
    familyOpportunities.length > 0 ? Number(familyOpportunities[0].year) : null,
    production.start,
    production.end,
  );
  const queryOnlySignals = familyQuerySignals
    .filter((entry) =>
      entry.year !== String(targetYear)
      && !familyOpportunities.some((opportunity) => opportunity.year === entry.year),
    )
    .slice(0, 4);

  const representativeVehicleGraph = await buildVehicleHubGraph({
    year: String(targetYear),
    make: canonicalMake,
    model: canonicalModel,
    displayMake: originalMake,
    displayModel: originalModel,
  });
  const representativeRepairNodes = (representativeVehicleGraph.groups.find((group) => group.kind === 'repair')?.nodes ?? []).slice(0, 12);
  const representativeWiringNodes = (representativeVehicleGraph.groups.find((group) => group.kind === 'wiring')?.nodes ?? []).slice(0, 6);
  const representativeCodeNodes = (representativeVehicleGraph.groups.find((group) => group.kind === 'dtc')?.nodes ?? []).slice(0, 6);
  const representativeManualNodes = (representativeVehicleGraph.groups.find((group) => group.kind === 'manual')?.nodes ?? []).slice(0, 2);
  const tier1ModelPages = getTier1RescuePagesForVehicle(originalMake, originalModel).slice(0, 6);

  const faqItems = [
    {
      question: `Can I do my own repairs on a ${originalMake} ${originalModel}?`,
      answer: `Yes, many ${originalMake} ${originalModel} repairs are DIY-friendly. Common jobs like oil changes, brake pads, air filters, and battery replacement can be done at home with basic hand tools. You can save $100–$400 per repair compared to a shop.`,
    },
    {
      question: `What are the most common repairs for a ${originalMake} ${originalModel}?`,
      answer: `The most common ${originalMake} ${originalModel} repairs include oil changes, brake pad and rotor replacement, spark plug replacement, battery replacement, and cabin/engine air filter changes. These are standard maintenance items for any vehicle.`,
    },
    {
      question: `How much can I save doing DIY repairs on my ${originalMake} ${originalModel}?`,
      answer: `DIY repairs on a ${originalMake} ${originalModel} typically save $80–$200 per job in labor costs alone. Over a year of routine maintenance, most owners save $300–$800 compared to dealership or independent shop pricing.`,
    },
    {
      question: `What tools do I need to work on a ${originalMake} ${originalModel}?`,
      answer: `A basic metric socket set, combination wrenches, jack and jack stands, a torque wrench, and common consumables like brake cleaner cover most ${originalMake} ${originalModel} DIY jobs. Specialty tools are rarely needed for routine maintenance.`,
    },
    {
      question: `Where can I find parts for my ${originalMake} ${originalModel}?`,
      answer: `You can find ${originalMake} ${originalModel} parts on Amazon with fast Prime shipping, at local auto parts stores like AutoZone or O'Reilly, or from online specialists. OEM part numbers help ensure correct fitment for your specific year and trim.`,
    },
  ];

  const faqSchemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchemaData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
            "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Guides", item: "https://spotonauto.com/guides" },
            { "@type": "ListItem", position: 2, name: originalMake, item: `https://spotonauto.com/guides/${canonicalMake}` },
            { "@type": "ListItem", position: 3, name: `${originalMake} ${originalModel}`, item: `https://spotonauto.com/guides/${canonicalMake}/${canonicalModel}` },
          ],
        }) }}
      />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <FadeInUp>
          <div className="flex items-center gap-4 mb-8">
            <Link href={`/guides/${canonicalMake}`} className="text-cyan-400 hover:underline">← Back to {originalMake}</Link>
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-4">
            <span className="text-cyan-400">{originalMake} {originalModel}</span> Guides
          </h1>
          <p className="text-gray-400 mb-12 max-w-2xl">
            Exact DIY maintenance and repair guides for the {originalMake} {originalModel} ({production.start} - {production.end}).
          </p>
        </FadeInUp>

        <section className="mb-12 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.05] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">Vehicle Repair Hub</h2>
              <p className="text-sm text-gray-300 mt-2">
                Jump to the {targetYear} {originalMake} {originalModel} repair hub for guides, wiring diagrams, codes, and exact manual sections.
              </p>
            </div>
            <Link
              href={`/repair/${targetYear}/${canonicalMake}/${canonicalModel}`}
              className="inline-flex items-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:border-cyan-400/40 hover:bg-cyan-500/20 transition-all"
            >
              Open {targetYear} vehicle hub
            </Link>
          </div>
        </section>

        <SearchLandingMonetizationRail
          surface="guides_model"
          intent="repair"
          contextLabel={`${originalMake} ${originalModel}`}
          className="mb-12 rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-6"
        />

        {(familyOpportunities.length > 0 || queryOnlySignals.length > 0) && (
          <section className="mb-12 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="max-w-3xl">
                <h2 className="text-xl font-bold text-white">Popular {originalMake} {originalModel} Years</h2>
                <p className="text-sm text-gray-300 mt-2">
                  The most popular model years for the {originalMake} {originalModel} — open each year for year-specific repair guides and resources.
                </p>
              </div>
              <Link
                href={`/repair/${targetYear}/${canonicalMake}/${canonicalModel}`}
                className="inline-flex items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 hover:border-emerald-400/40 hover:bg-emerald-500/20 transition-all"
              >
                Open top year
              </Link>
            </div>

            {familyOpportunities.length > 0 && (
              <div className="grid lg:grid-cols-3 gap-4">
                {familyOpportunities.map((entry) => (
                  <div
                    key={entry.hubPath}
                    className="rounded-xl border border-white/10 bg-black/20 p-4"
                  >
                    <Link href={entry.hubPath} className="block group">
                      <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/80 mb-2">Popular year</p>
                      <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        {entry.label}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-300 mt-2">{entry.note}</p>
                    {entry.topTasks.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {entry.topTasks.slice(0, 3).map((task) => (
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
            )}

            {queryOnlySignals.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white">Other exact years</h3>
                <div className="flex flex-wrap gap-2 mt-4">
                  {queryOnlySignals.map((entry) => (
                    <Link
                      key={entry.hubPath}
                      href={entry.hubPath}
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-gray-200 transition-colors hover:border-emerald-400/35 hover:text-emerald-200"
                    >
                      {entry.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {tier1ModelPages.length > 0 && (
          <section className="mb-12 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Popular {originalMake} {originalModel} Repair Guides</h2>
                <p className="text-sm text-gray-300 mt-2">
                  The most-visited repair guides for the {originalMake} {originalModel}.
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tier1ModelPages.map((entry) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="block rounded-xl border border-white/10 bg-black/20 p-4 hover:border-violet-400/35 hover:bg-black/30 transition-all"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-violet-300/80 mb-2">Popular guide</p>
                  <h3 className="text-base font-semibold text-white">{entry.year} {entry.make} {entry.model}</h3>
                  <p className="text-sm text-gray-300 mt-2 capitalize">{entry.task.replace(/-/g, ' ')}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {representativeRepairNodes.map((node) => (
            <StaggerItem key={node.nodeId || node.href}>
              <Link
                href={node.href}
                className="flex items-center gap-4 glass p-6 hover:border-cyan-400/50 transition-all group"
              >
                <div className="p-3 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                  <Wrench className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors capitalize">
                    {node.label.replace(`${targetYear} ${originalMake} ${originalModel} `, '')}
                  </h3>
                  <p className="text-sm text-gray-500">{node.description}</p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <section className="mt-16">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-white">
              Factory Service Manuals
            </h2>
            <Link href="/manual" className="text-sm text-cyan-400 hover:underline">
              Open all manuals →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href={representativeManualNodes[0]?.href || `/manual/${encodeURIComponent(originalMake)}`}
              className="block p-5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 transition group"
            >
              <p className="text-sm text-cyan-400 mb-1">Make-level manual</p>
              <h3 className="text-base font-semibold text-gray-200 group-hover:text-white transition">
                Open {originalMake} manual sections
              </h3>
              <p className="text-xs text-gray-500 mt-2">Open factory manual sections for all supported {originalMake} years.</p>
            </Link>
            <Link
              href={representativeManualNodes[1]?.href || `/manual/${encodeURIComponent(originalMake)}/${targetYear}`}
              className="block p-5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 transition group"
            >
              <p className="text-sm text-cyan-400 mb-1">Year index</p>
              <h3 className="text-base font-semibold text-gray-200 group-hover:text-white transition">
                Open the {targetYear} {originalMake} manual
              </h3>
              <p className="text-xs text-gray-500 mt-2">Open repair procedures from the {targetYear} {originalMake} factory manual.</p>
            </Link>
          </div>
        </section>

        {featuredToolPages.length > 0 && (
          <section className="mt-16">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-white">
                {originalMake} {originalModel} Specs & Fitment
              </h2>
              <Link href="/tools" className="text-sm text-cyan-400 hover:underline">
                Open all spec pages →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {featuredToolPages.map((page) => {
                const meta = TOOL_TYPE_META[page.toolType] || { label: 'Guide', icon: '🔧' };
                return (
                  <Link
                    key={page.slug}
                    href={`/tools/${page.slug}`}
                    className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 transition group"
                  >
                    <p className="text-sm text-cyan-400 mb-1">{meta.icon} {meta.label}</p>
                    <h3 className="text-sm font-semibold text-gray-200 group-hover:text-white transition">
                      {originalMake} {originalModel}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Spec page →</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {representativeWiringNodes.length > 0 && (
          <section className="mt-16">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-white">
                {targetYear} Wiring Diagrams
              </h2>
              <Link href="/wiring" className="text-sm text-cyan-400 hover:underline">
                Open all wiring pages →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {representativeWiringNodes.map((node) => (
                <Link
                  key={node.nodeId || node.href}
                  href={node.href}
                  className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/40 transition group"
                >
                  <p className="text-sm text-violet-300 mb-1">{node.badge}</p>
                  <h3 className="text-sm font-semibold text-gray-200 group-hover:text-white transition">
                    {node.label}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2">{node.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {representativeCodeNodes.length > 0 && (
          <section className="mt-16">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-white">
                Common Trouble Codes
              </h2>
              <Link href="/codes" className="text-sm text-cyan-400 hover:underline">
                Open all DTC codes →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {representativeCodeNodes.map((node) => (
                <Link
                  key={node.nodeId || node.href}
                  href={node.href}
                  className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/40 transition group"
                >
                  <p className="text-sm text-amber-300 mb-1">{node.badge}</p>
                  <h3 className="text-sm font-semibold text-gray-200 group-hover:text-white transition">
                    {node.label}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2">{node.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Cross-link to repair category hubs */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-white mb-4">Open by Repair Type</h2>
          <p className="text-gray-400 text-sm mb-4">
            See how {originalMake} {originalModel} compares to other vehicles for each repair:
          </p>
          <div className="flex flex-wrap gap-2">
            {VALID_TASKS.slice(0, 12).map((task) => (
              <Link
                key={task}
                href={`/repairs/${task}`}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all capitalize"
              >
                {task.replace(/-/g, ' ')}
              </Link>
            ))}
            <Link
              href="/repairs"
              className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400 hover:bg-cyan-500/20 transition-all"
            >
              All Repair Families
            </Link>
          </div>
        </section>

        {/* Frequently Asked Questions — GEO optimized for AI search citation */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          <dl className="space-y-4">
            {faqItems.map((faq, i) => (
              <div key={i} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <dt className="px-5 py-4 font-semibold text-white">
                  {faq.question}
                </dt>
                <dd className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
