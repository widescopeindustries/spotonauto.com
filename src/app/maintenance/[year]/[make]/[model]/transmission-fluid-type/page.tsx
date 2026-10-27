import { getMaintenanceFallbackUrl } from "@/lib/maintenanceFallback";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getToolPagesForVehicle, findGenerationForYear } from "@/data/tools-pages";
import { getDisplayName, slugifyRoutePart, getClampedYear } from "@/data/vehicles";
import { getNoindexRobots } from "@/lib/seo";
import { seoTitle } from "@/lib/seoTitle";
import { buildAmazonSearchUrl } from "@/lib/amazonAffiliate";
import MaintenanceSpecLinks from "@/components/MaintenanceSpecLinks";
import RelatedForVehicle from "@/components/RelatedForVehicle";
import SafetyWarningBox from "@/components/SafetyWarningBox";

export const revalidate = 86400;

interface PageProps {
  params: Promise<{
    year: string;
    make: string;
    model: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year, make, model } = await params;
  const displayMake = getDisplayName(make, "make");
  const displayModel = getDisplayName(model, "model");
  const toolPages = getToolPagesForVehicle(displayMake, displayModel);
  const page = toolPages.find((p) => p.toolType === 'transmission-fluid-type');
  const gen = page ? findGenerationForYear(parseInt(year, 10), page.generations) : null;
  const fluid = gen?.specs['Fluid'] || gen?.specs['Transmission Fluid'] || Object.entries(gen?.specs || {}).find(([k]) => k.toLowerCase().includes('fluid'))?.[1] || '';

  const fluidShort = fluid.split('(')[0].trim();
  const fluidIsQuantity = /\b(qt|qts|quart|quarts|liter|liters|litre|litres)\b/i.test(fluidShort);
  const readableFluid = fluidShort
    .replace(/\bQTS\.?\b/gi, 'quarts')
    .replace(/\bQT\.?\b/gi, 'quarts');
  const baseTitle = fluidIsQuantity
    ? `${year} ${displayMake} ${displayModel} Transmission Fluid Capacity`
    : `${year} ${displayMake} ${displayModel} Transmission Fluid Type`;
  const title = seoTitle(`${baseTitle}${readableFluid ? ` — ${readableFluid}` : ''}`, baseTitle);
  const description = `${year} ${displayMake} ${displayModel} transmission fluid type and capacity from the factory service manual. Exact ATF or MTF spec, drain-and-fill vs dry-fill capacity, and change interval.`;

  return {
    title,
    description,
    robots: getNoindexRobots(displayMake, displayModel),
    alternates: {
      canonical: `https://alloemmanuals.com/maintenance/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}/transmission-fluid-type`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://alloemmanuals.com/maintenance/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}/transmission-fluid-type`,
    },
  };
}

export default async function TransmissionFluidTypePage({ params }: PageProps) {
  const { year, make, model } = await params;
  const displayMake = getDisplayName(make, "make");
  const displayModel = getDisplayName(model, "model");
  const canonicalMake = slugifyRoutePart(displayMake);
  const canonicalModel = slugifyRoutePart(displayModel);
  const yearNum = parseInt(year, 10);

  const clamped = getClampedYear(year, displayMake, displayModel);
  if (clamped !== null) {
    notFound();
  }

  const toolPages = getToolPagesForVehicle(displayMake, displayModel);
  const page = toolPages.find((p) => p.toolType === 'transmission-fluid-type');
  if (!page) {
    notFound();
  }

  const gen = findGenerationForYear(yearNum, page.generations);
  if (!gen) {
    const fallback = getMaintenanceFallbackUrl(displayMake, displayModel, 'transmission-fluid-type');
    if (fallback) permanentRedirect(fallback);
    notFound();
  }

  // Extract transmission fluid specs
  const fluidEntries = Object.entries(gen.specs).filter(([k]) =>
    k.toLowerCase().includes('fluid') || k.toLowerCase().includes('trans')
  );
  const capacityDry = gen.specs['Capacity (dry)'] || gen.specs['Dry Fill'] || gen.specs['Total Capacity'] || '';
  const capacityDrain = gen.specs['Capacity (drain/fill)'] || gen.specs['Drain Fill'] || gen.specs['Service Fill'] || '';
  const interval = gen.specs['Change Interval'] || gen.specs['Interval'] || '';

  const faqItems = [
    {
      question: `What transmission fluid does a ${year} ${displayMake} ${displayModel} use?`,
      answer: fluidEntries.length > 0
        ? `The ${year} ${displayMake} ${displayModel} uses ${fluidEntries.map(([k, v]) => `${v}`).join(', ')}.`
        : `Refer to the factory service manual for the exact transmission fluid specification for your ${year} ${displayMake} ${displayModel}.`,
    },
    {
      question: `How much transmission fluid does a ${year} ${displayMake} ${displayModel} take?`,
      answer: capacityDry || capacityDrain
        ? `The ${year} ${displayMake} ${displayModel} takes ${capacityDry ? `${capacityDry} for a dry fill` : ''}${capacityDry && capacityDrain ? ' and ' : ''}${capacityDrain ? `${capacityDrain} for a drain-and-fill service` : ''}.`
        : `Refer to the factory service manual for the exact transmission fluid capacity.`,
    },
    {
      question: `When should I change the transmission fluid in my ${year} ${displayMake} ${displayModel}?`,
      answer: interval
        ? `The factory service manual recommends changing transmission fluid every ${interval}.`
        : `Most manufacturers recommend transmission fluid changes every 30,000–60,000 miles for automatics. Check your factory service manual for the exact interval.`,
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Maintenance", item: "https://alloemmanuals.com/maintenance" },
      { "@type": "ListItem", position: 2, name: `${year} ${displayMake} ${displayModel} Transmission Fluid`, item: `https://alloemmanuals.com/maintenance/${year}/${canonicalMake}/${canonicalModel}/transmission-fluid-type` },
    ],
  };

  const fluidSearchQuery = `${displayMake} ${displayModel} transmission fluid ${year}`;
  const funnelQuery = `transmission fluid funnel long neck`;
  const drainPanQuery = `drain pan large capacity`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="mv-content max-w-5xl mx-auto px-4 py-12">
        <SafetyWarningBox className="mb-6" />

        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm font-body">
            <li>
              <Link href="/maintenance" className="text-cyan-400 hover:text-cyan-300 transition-colors">Maintenance</Link>
            </li>
            <span className="text-gray-600">/</span>
            <li>
              <span className="text-cyan-400 hover:text-cyan-300 transition-colors">{displayMake}</span>
            </li>
            <span className="text-gray-600">/</span>
            <li>
              <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}`} className="text-cyan-400 hover:text-cyan-300 transition-colors">{displayModel}</Link>
            </li>
            <span className="text-gray-600">/</span>
            <li className="text-gray-400">{year} Trans Fluid</li>
          </ol>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">
          {year} {displayMake} {displayModel} Transmission Fluid Type &amp; Capacity
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          OEM transmission fluid spec from the factory service manual for the {gen.name} ({gen.years}).
        </p>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.08] p-6 mb-8" itemScope itemType="https://schema.org/Question">
          <p className="text-xs uppercase tracking-[0.2em] text-rose-300/80 mb-4" itemProp="name">Quick Answer</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
            {fluidEntries.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-400 mb-1">Transmission Fluid</p>
                <p className="text-xl font-display font-bold text-white" itemProp="text">
                  {fluidEntries[0][1]}
                </p>
                {fluidEntries.length > 1 && (
                  <p className="text-sm text-gray-500 mt-1">{fluidEntries[1][1]}</p>
                )}
              </div>
            )}
            {capacityDry && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Dry Fill</p>
                <p className="text-2xl font-display font-bold text-white" itemProp="text">{capacityDry}</p>
              </div>
            )}
            {capacityDrain && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Drain &amp; Fill</p>
                <p className="text-2xl font-display font-bold text-white" itemProp="text">{capacityDrain}</p>
              </div>
            )}
            {interval && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Interval</p>
                <p className="text-xl font-display font-bold text-white" itemProp="text">{interval}</p>
              </div>
            )}
          </div>
        </div>

        {gen.notes && gen.notes.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-8">
            <p className="text-xs uppercase tracking-wider text-amber-400 font-bold mb-2">Notes</p>
            <ul className="space-y-1">
              {gen.notes.map((note, i) => (
                <li key={i} className="text-amber-200/80 text-sm flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">→</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-8 text-sm text-gray-400">
          <span className="text-rose-400 font-medium">Source:</span> Factory service manual — {year} {displayMake} {displayModel} {gen.name}.
        </div>

        {/* Maintenance specs nav */}
        <MaintenanceSpecLinks year={year} make={displayMake} model={displayModel} excludeType="transmission-fluid-type" />

        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">What You&apos;ll Need</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <a href={buildAmazonSearchUrl(fluidSearchQuery, "automotive", `trans-fluid-${year}-${canonicalMake}-${canonicalModel}`)} target="_blank" rel="nofollow sponsored noopener noreferrer" className="block glass rounded-xl p-5 hover:border-rose-400/40 transition-all group">
              <p className="text-sm text-rose-400 mb-1">Transmission Fluid</p>
              <h3 className="text-base font-semibold text-white group-hover:text-rose-300 transition-colors">{displayMake} {displayModel} ATF / MTF</h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
            <a href={buildAmazonSearchUrl(funnelQuery, "automotive", `funnel-${year}-${canonicalMake}-${canonicalModel}`)} target="_blank" rel="nofollow sponsored noopener noreferrer" className="block glass rounded-xl p-5 hover:border-rose-400/40 transition-all group">
              <p className="text-sm text-rose-400 mb-1">Tool</p>
              <h3 className="text-base font-semibold text-white group-hover:text-rose-300 transition-colors">Long-Neck Transmission Funnel</h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
            <a href={buildAmazonSearchUrl(drainPanQuery, "automotive", `pan-${year}-${canonicalMake}-${canonicalModel}`)} target="_blank" rel="nofollow sponsored noopener noreferrer" className="block glass rounded-xl p-5 hover:border-rose-400/40 transition-all group">
              <p className="text-sm text-rose-400 mb-1">Drain Pan</p>
              <h3 className="text-base font-semibold text-white group-hover:text-rose-300 transition-colors">Large Capacity Drain Pan</h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
            <a href={buildAmazonSearchUrl("torque wrench ft lb", "automotive", `wrench-${year}-${canonicalMake}-${canonicalModel}`)} target="_blank" rel="nofollow sponsored noopener noreferrer" className="block glass rounded-xl p-5 hover:border-rose-400/40 transition-all group">
              <p className="text-sm text-rose-400 mb-1">Tool</p>
              <h3 className="text-base font-semibold text-white group-hover:text-rose-300 transition-colors">Torque Wrench (ft-lb)</h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
          </div>
        </div>

        <RelatedForVehicle year={year} make={displayMake} model={displayModel} excludeType="transmission-fluid-type" />

        <section className="mt-12">
          <h2 className="text-xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          <dl className="space-y-3">
            {faqItems.map((faq, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <dt className="px-5 py-4 font-semibold text-white text-sm">{faq.question}</dt>
                <dd className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

      </div>
    </>
  );
}
