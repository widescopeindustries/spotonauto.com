import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getToolPagesForVehicle, findGenerationForYear } from "@/data/tools-pages";
import { getDisplayName, slugifyRoutePart, getClampedYear } from "@/data/vehicles";
import { getNoindexRobots } from "@/lib/seo";
import { buildAmazonSearchUrl } from "@/lib/amazonAffiliate";
import RelatedForVehicle from "@/components/RelatedForVehicle";
import SafetyWarningBox from "@/components/SafetyWarningBox";
import StickyAffiliateBar from "@/components/StickyAffiliateBar";

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
  const page = toolPages.find((p) => p.toolType === 'spark-plug-type');
  const gen = page ? findGenerationForYear(parseInt(year, 10), page.generations) : null;
  const plug = gen?.specs['Plug'] || gen?.specs['Spark Plug'] || Object.entries(gen?.specs || {}).find(([k]) => k.toLowerCase().includes('plug'))?.[1] || '';

  const title = `${year} ${displayMake} ${displayModel} Spark Plug Type${plug ? ` — ${plug.split('(')[0].trim()}` : ''} | AllOEMManuals`;
  const description = `${year} ${displayMake} ${displayModel} spark plug type, gap, and torque from the factory service manual. Exact part numbers and replacement interval for the ${year} model year.`;

  return {
    title,
    description,
    robots: getNoindexRobots(displayMake, displayModel),
    alternates: {
      canonical: `https://alloemmanuals.com/maintenance/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}/spark-plug-type`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://alloemmanuals.com/maintenance/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}/spark-plug-type`,
    },
  };
}

export default async function SparkPlugTypePage({ params }: PageProps) {
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
  const page = toolPages.find((p) => p.toolType === 'spark-plug-type');
  if (!page) {
    notFound();
  }

  const gen = findGenerationForYear(yearNum, page.generations);
  if (!gen) {
    notFound();
  }

  // Extract spark plug specs — keys vary by make/model
  const plugEntries = Object.entries(gen.specs).filter(([k]) =>
    k.toLowerCase().includes('plug') || k.toLowerCase().includes('spark')
  );
  const gap = gen.specs['Gap'] || gen.specs['Spark Plug Gap'] || '';
  const torque = gen.specs['Torque'] || gen.specs['Plug Torque'] || '';
  const interval = gen.specs['Interval'] || gen.specs['Change Interval'] || '';
  const material = gen.specs['Material'] || '';

  const faqItems = [
    {
      question: `What spark plugs does a ${year} ${displayMake} ${displayModel} use?`,
      answer: plugEntries.length > 0
        ? `The ${year} ${displayMake} ${displayModel} uses ${plugEntries.map(([k, v]) => `${v}`).join(', ')}.`
        : `Refer to the factory service manual for the exact spark plug specification for your ${year} ${displayMake} ${displayModel}.`,
    },
    {
      question: `What is the spark plug gap for a ${year} ${displayMake} ${displayModel}?`,
      answer: gap
        ? `The spark plug gap for the ${year} ${displayMake} ${displayModel} is ${gap}.`
        : `Refer to the factory service manual for the exact spark plug gap specification.`,
    },
    {
      question: `How often should I replace spark plugs on a ${year} ${displayMake} ${displayModel}?`,
      answer: interval
        ? `The factory service manual recommends replacing spark plugs every ${interval}.`
        : `Most modern vehicles recommend spark plug replacement every 60,000–100,000 miles. Check your factory service manual for the exact interval.`,
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
      { "@type": "ListItem", position: 2, name: displayMake, item: `https://alloemmanuals.com/maintenance/${canonicalMake}` },
      { "@type": "ListItem", position: 3, name: `${displayMake} ${displayModel}`, item: `https://alloemmanuals.com/maintenance/${canonicalMake}/${canonicalModel}` },
      { "@type": "ListItem", position: 4, name: `${year} ${displayMake} ${displayModel} Spark Plugs`, item: `https://alloemmanuals.com/maintenance/${year}/${canonicalMake}/${canonicalModel}/spark-plug-type` },
    ],
  };

  const plugSearchQuery = `${displayMake} ${displayModel} spark plugs ${year}`;
  const gapToolQuery = `${displayMake} ${displayModel} spark plug gap tool`;
  const torqueWrenchQuery = `torque wrench inch pound`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <SafetyWarningBox className="mb-6" />

        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm font-body">
            <li>
              <Link href="/maintenance" className="text-cyan-400 hover:text-cyan-300 transition-colors">Maintenance</Link>
            </li>
            <span className="text-gray-600">/</span>
            <li>
              <Link href={`/maintenance/${canonicalMake}`} className="text-cyan-400 hover:text-cyan-300 transition-colors">{displayMake}</Link>
            </li>
            <span className="text-gray-600">/</span>
            <li>
              <Link href={`/maintenance/${canonicalMake}/${canonicalModel}`} className="text-cyan-400 hover:text-cyan-300 transition-colors">{displayModel}</Link>
            </li>
            <span className="text-gray-600">/</span>
            <li className="text-gray-400">{year} Spark Plugs</li>
          </ol>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">
          {year} {displayMake} {displayModel} Spark Plug Type &amp; Gap
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          OEM spark plug spec from the factory service manual for the {gen.name} ({gen.years}).
        </p>

        <div className="rounded-2xl border border-orange-500/30 bg-orange-500/[0.08] p-6 mb-8" itemScope itemType="https://schema.org/Question">
          <p className="text-xs uppercase tracking-[0.2em] text-orange-300/80 mb-4" itemProp="name">Quick Answer</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
            {plugEntries.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-400 mb-1">Spark Plug</p>
                <p className="text-xl font-display font-bold text-white" itemProp="text">
                  {plugEntries[0][1]}
                </p>
                {plugEntries.length > 1 && (
                  <p className="text-sm text-gray-500 mt-1">{plugEntries[1][1]}</p>
                )}
              </div>
            )}
            {gap && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Gap</p>
                <p className="text-2xl font-display font-bold text-white" itemProp="text">{gap}</p>
              </div>
            )}
            {torque && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Torque</p>
                <p className="text-2xl font-display font-bold text-white" itemProp="text">{torque}</p>
              </div>
            )}
            {interval && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Interval</p>
                <p className="text-xl font-display font-bold text-white" itemProp="text">{interval}</p>
              </div>
            )}
            {material && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Material</p>
                <p className="text-xl font-display font-bold text-white" itemProp="text">{material}</p>
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
          <span className="text-orange-400 font-medium">Source:</span> Factory service manual — {year} {displayMake} {displayModel} {gen.name}.
        </div>

        {/* Maintenance specs nav */}
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="text-xs text-gray-500 uppercase tracking-wider py-2">Other specs:</span>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">All specs</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/oil-type`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Oil Type</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/coolant-type`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Coolant</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/tire-size`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Tire Size</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/battery-location`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Battery</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/wiper-blade-size`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Wipers</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/serpentine-belt`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Belt</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/transmission-fluid-type`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Trans Fluid</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/headlight-bulb`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Headlights</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/brake-fluid-type`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Brake Fluid</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/fluid-capacity`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Capacities</Link>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">What You&apos;ll Need</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <a href={buildAmazonSearchUrl(plugSearchQuery, "automotive", `plugs-${year}-${canonicalMake}-${canonicalModel}`)} target="_blank" rel="nofollow sponsored noopener noreferrer" className="block glass rounded-xl p-5 hover:border-orange-400/40 transition-all group">
              <p className="text-sm text-orange-400 mb-1">Spark Plugs</p>
              <h3 className="text-base font-semibold text-white group-hover:text-orange-300 transition-colors">{displayMake} {displayModel} Spark Plugs</h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
            <a href={buildAmazonSearchUrl(gapToolQuery, "automotive", `gap-tool-${year}-${canonicalMake}-${canonicalModel}`)} target="_blank" rel="nofollow sponsored noopener noreferrer" className="block glass rounded-xl p-5 hover:border-orange-400/40 transition-all group">
              <p className="text-sm text-orange-400 mb-1">Tool</p>
              <h3 className="text-base font-semibold text-white group-hover:text-orange-300 transition-colors">Spark Plug Gap Tool / Feeler Gauge</h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
            <a href={buildAmazonSearchUrl(torqueWrenchQuery, "automotive", `torque-${year}-${canonicalMake}-${canonicalModel}`)} target="_blank" rel="nofollow sponsored noopener noreferrer" className="block glass rounded-xl p-5 hover:border-orange-400/40 transition-all group">
              <p className="text-sm text-orange-400 mb-1">Tool</p>
              <h3 className="text-base font-semibold text-white group-hover:text-orange-300 transition-colors">Inch-Pound Torque Wrench</h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
            <a href={buildAmazonSearchUrl("spark plug socket set magnetic", "automotive", `socket-${year}-${canonicalMake}-${canonicalModel}`)} target="_blank" rel="nofollow sponsored noopener noreferrer" className="block glass rounded-xl p-5 hover:border-orange-400/40 transition-all group">
              <p className="text-sm text-orange-400 mb-1">Tool</p>
              <h3 className="text-base font-semibold text-white group-hover:text-orange-300 transition-colors">Magnetic Spark Plug Socket</h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
          </div>
        </div>

        <RelatedForVehicle year={year} make={displayMake} model={displayModel} excludeType="spark-plug-type" />

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

        <StickyAffiliateBar
          vehicle={`${year} ${displayMake} ${displayModel}`}
          intent="Spark Plugs"
          query={`${year} ${displayMake} ${displayModel} iridium spark plugs`}
          subtag="maint-sparkplugtype"
          variant="mixed"
        />
      </div>
    </>
  );
}
