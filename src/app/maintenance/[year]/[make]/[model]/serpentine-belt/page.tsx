import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getToolPagesForVehicle, findGenerationForYear, TOOL_TYPE_META } from "@/data/tools-pages";
import { getDisplayName, slugifyRoutePart, getClampedYear } from "@/data/vehicles";
import { buildAmazonSearchUrl } from "@/lib/amazonAffiliate";
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
  const page = toolPages.find((p) => p.toolType === 'serpentine-belt');
  const gen = page ? findGenerationForYear(parseInt(year, 10), page.generations) : null;
  const routing = gen?.specs['Routing'] || gen?.specs['Belt Routing'] || '';
  const partNum = gen?.specs['Part Number'] || gen?.specs['Belt PN'] || '';

  const title = `${year} ${displayMake} ${displayModel} Serpentine Belt${partNum ? ` — ${partNum}` : ''} | AllOEMManuals`;
  const description = `${year} ${displayMake} ${displayModel} serpentine belt routing diagram and replacement guide.${partNum ? ` OEM belt: ${partNum}.` : ''} Includes tensioner check, routing diagram, and squeal diagnosis from the factory manual.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://alloemmanuals.com/maintenance/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}/serpentine-belt`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://alloemmanuals.com/maintenance/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}/serpentine-belt`,
    },
  };
}

export default async function SerpentineBeltPage({ params }: PageProps) {
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
  const page = toolPages.find((p) => p.toolType === 'serpentine-belt');
  if (!page) {
    notFound();
  }

  const gen = findGenerationForYear(yearNum, page.generations);
  if (!gen) {
    notFound();
  }

  const routing = gen.specs['Routing'] || gen.specs['Belt Routing'] || gen.specs['Diagram'] || '';
  const partNum = gen.specs['Part Number'] || gen.specs['Belt PN'] || gen.specs['OEM Belt'] || '';
  const length = gen.specs['Length'] || gen.specs['Belt Length'] || '';
  const ribs = gen.specs['Ribs'] || gen.specs['Rib Count'] || '';
  const tensioner = gen.specs['Tensioner'] || gen.specs['Tensioner Type'] || '';

  const faqItems = [
    {
      question: `What size serpentine belt does a ${year} ${displayMake} ${displayModel} use?`,
      answer: partNum || length
        ? `The ${year} ${displayMake} ${displayModel} uses ${partNum ? `belt ${partNum}` : ''}${length ? `${partNum ? ' (' : ''}${length}${partNum ? ')' : ''}` : ''}.${ribs ? ` It has ${ribs} ribs.` : ''}`
        : `Refer to the factory service manual for the exact serpentine belt specification for your ${year} ${displayMake} ${displayModel}.`,
    },
    {
      question: `How do I know if my ${displayMake} ${displayModel} serpentine belt is bad?`,
      answer: `Common signs include squealing on startup (especially when cold), visible cracks or fraying on the ribbed side, power steering or A/C failure, and battery warning lights. The factory manual includes inspection criteria and replacement intervals.`,
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
      { "@type": "ListItem", position: 4, name: `${year} ${displayMake} ${displayModel} Serpentine Belt`, item: `https://alloemmanuals.com/maintenance/${year}/${canonicalMake}/${canonicalModel}/serpentine-belt` },
    ],
  };

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
            <li className="text-gray-400">{year} Serpentine Belt</li>
          </ol>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">
          {year} {displayMake} {displayModel} Serpentine Belt Diagram &amp; Size
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          OEM serpentine belt spec from the factory service manual for the {gen.name} ({gen.years}).
        </p>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/[0.08] p-6 mb-8" itemScope itemType="https://schema.org/Question">
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300/80 mb-4" itemProp="name">Quick Answer</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
            {partNum && (
              <div>
                <p className="text-sm text-gray-400 mb-1">OEM Part Number</p>
                <p className="text-xl font-display font-bold text-white" itemProp="text">{partNum}</p>
              </div>
            )}
            {length && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Belt Length</p>
                <p className="text-xl font-display font-bold text-white" itemProp="text">{length}</p>
              </div>
            )}
            {ribs && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Rib Count</p>
                <p className="text-xl font-display font-bold text-white" itemProp="text">{ribs}</p>
              </div>
            )}
            {tensioner && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Tensioner</p>
                <p className="text-xl font-display font-bold text-white" itemProp="text">{tensioner}</p>
              </div>
            )}
          </div>
          {routing && (
            <div className="mt-4 pt-4 border-t border-purple-500/20 text-sm text-gray-300 leading-relaxed">
              <strong className="text-purple-300">Routing:</strong> {routing}
            </div>
          )}
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
          <span className="text-purple-400 font-medium">Source:</span> Factory service manual — {year} {displayMake} {displayModel} {gen.name}.
        </div>

        {/* Maintenance specs nav */}
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="text-xs text-gray-500 uppercase tracking-wider py-2">Other specs:</span>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">All specs</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/oil-type`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Oil Type</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/coolant-type`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Coolant</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/tire-size`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Tire Size</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/battery-location`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Battery</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/spark-plug-type`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Spark Plugs</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/transmission-fluid-type`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Trans Fluid</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/headlight-bulb`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Headlights</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/brake-fluid-type`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Brake Fluid</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/fluid-capacity`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Capacities</Link>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">What You&apos;ll Need</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <a href={buildAmazonSearchUrl(`${displayMake} ${displayModel} serpentine belt ${partNum || ''} ${year}`, "automotive", `belt-${year}-${canonicalMake}-${canonicalModel}`)} target="_blank" rel="noopener noreferrer" className="block glass rounded-xl p-5 hover:border-purple-400/40 transition-all group">
              <p className="text-sm text-purple-400 mb-1">Serpentine Belt</p>
              <h3 className="text-base font-semibold text-white group-hover:text-purple-300 transition-colors">{displayMake} {displayModel} {partNum || 'Replacement Belt'}</h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
            <a href={buildAmazonSearchUrl("serpentine belt tool kit tensioner", "automotive", `tool-${year}-${canonicalMake}-${canonicalModel}`)} target="_blank" rel="noopener noreferrer" className="block glass rounded-xl p-5 hover:border-purple-400/40 transition-all group">
              <p className="text-sm text-purple-400 mb-1">Tool</p>
              <h3 className="text-base font-semibold text-white group-hover:text-purple-300 transition-colors">Belt Tensioner Tool</h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
            <a href={buildAmazonSearchUrl("idler pulley replacement", "automotive", `pulley-${year}-${canonicalMake}-${canonicalModel}`)} target="_blank" rel="noopener noreferrer" className="block glass rounded-xl p-5 hover:border-purple-400/40 transition-all group">
              <p className="text-sm text-purple-400 mb-1">Related Part</p>
              <h3 className="text-base font-semibold text-white group-hover:text-purple-300 transition-colors">Idler / Tensioner Pulley</h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
            <a href={buildAmazonSearchUrl("belt dressing squeal stop", "automotive", `dressing-${year}-${canonicalMake}-${canonicalModel}`)} target="_blank" rel="noopener noreferrer" className="block glass rounded-xl p-5 hover:border-purple-400/40 transition-all group">
              <p className="text-sm text-purple-400 mb-1">Supply</p>
              <h3 className="text-base font-semibold text-white group-hover:text-purple-300 transition-colors">Belt Dressing / Squeal Stop</h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
          </div>
        </div>

        <RelatedForVehicle year={year} make={displayMake} model={displayModel} excludeType="serpentine-belt" />

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
