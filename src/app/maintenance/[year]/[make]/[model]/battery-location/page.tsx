import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getToolPagesForVehicle, findGenerationForYear, TOOL_TYPE_META } from "@/data/tools-pages";
import { getDisplayName, slugifyRoutePart, getClampedYear } from "@/data/vehicles";
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
  const page = toolPages.find((p) => p.toolType === 'battery-location');
  const gen = page ? findGenerationForYear(parseInt(year, 10), page.generations) : null;
  const location = gen?.specs['Location'] || gen?.specs['Battery Location'] || page?.quickAnswer || '';
  const size = gen?.specs['Battery Size'] || gen?.specs['Group'] || '';

  const title = `${year} ${displayMake} ${displayModel} Battery Location${size ? ` — ${size}` : ''} | AllOEMManuals`;
  const description = `${year} ${displayMake} ${displayModel} battery location: ${location || 'under the hood'}. ${size ? `Size: ${size}. ` : ''}Step-by-step replacement guide with group size, CCA, and terminal orientation from the factory manual.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://alloemmanuals.com/maintenance/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}/battery-location`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://alloemmanuals.com/maintenance/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}/battery-location`,
    },
  };
}

export default async function BatteryLocationPage({ params }: PageProps) {
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
  const page = toolPages.find((p) => p.toolType === 'battery-location');
  if (!page) {
    notFound();
  }

  const gen = findGenerationForYear(yearNum, page.generations);
  if (!gen) {
    notFound();
  }

  const location = gen.specs['Location'] || gen.specs['Battery Location'] || page.quickAnswer || 'Under hood';
  const size = gen.specs['Battery Size'] || gen.specs['Group'] || '';
  const cca = gen.specs['CCA'] || gen.specs['Cold Cranking Amps'] || '';
  const type = gen.specs['Type'] || gen.specs['Battery Type'] || '';
  const difficulty = gen.specs['Difficulty'] || '';

  const faqItems = [
    {
      question: `Where is the battery in a ${year} ${displayMake} ${displayModel}?`,
      answer: `The ${year} ${displayMake} ${displayModel} battery is located ${location.toLowerCase()}.`,
    },
    {
      question: `What size battery does a ${year} ${displayMake} ${displayModel} take?`,
      answer: size
        ? `The ${year} ${displayMake} ${displayModel} uses a ${size} battery${cca ? ` with at least ${cca}` : ''}.`
        : `Refer to the factory service manual for the exact battery group size and CCA rating for your ${year} ${displayMake} ${displayModel}.`,
    },
    {
      question: `How hard is it to replace the battery on a ${year} ${displayMake} ${displayModel}?`,
      answer: difficulty
        ? `Battery replacement is rated as ${difficulty.toLowerCase()}.`
        : `Battery replacement on the ${year} ${displayMake} ${displayModel} is typically a straightforward DIY job taking 15–30 minutes.`,
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
      { "@type": "ListItem", position: 4, name: `${year} ${displayMake} ${displayModel} Battery`, item: `https://alloemmanuals.com/maintenance/${year}/${canonicalMake}/${canonicalModel}/battery-location` },
    ],
  };

  const meta = TOOL_TYPE_META['battery-location'];

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
            <li className="text-gray-400">{year} Battery</li>
          </ol>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">
          {year} {displayMake} {displayModel} Battery Location &amp; Size
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          OEM battery spec from the factory service manual for the {gen.name} ({gen.years}).
        </p>

        <div className="rounded-2xl border border-green-500/30 bg-green-500/[0.08] p-6 mb-8" itemScope itemType="https://schema.org/Question">
          <p className="text-xs uppercase tracking-[0.2em] text-green-300/80 mb-4" itemProp="name">Quick Answer</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
            <div>
              <p className="text-sm text-gray-400 mb-1">Location</p>
              <p className="text-xl font-display font-bold text-white" itemProp="text">{location}</p>
            </div>
            {size && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Battery Size</p>
                <p className="text-xl font-display font-bold text-white" itemProp="text">{size}</p>
              </div>
            )}
            {cca && (
              <div>
                <p className="text-sm text-gray-400 mb-1">CCA Rating</p>
                <p className="text-xl font-display font-bold text-white" itemProp="text">{cca}</p>
              </div>
            )}
            {type && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Type</p>
                <p className="text-xl font-display font-bold text-white" itemProp="text">{type}</p>
              </div>
            )}
          </div>
          {difficulty && (
            <div className="mt-4 pt-4 border-t border-green-500/20 text-sm text-gray-300 leading-relaxed">
              <strong className="text-green-300">Difficulty:</strong> {difficulty}
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
          <span className="text-green-400 font-medium">Source:</span> Factory service manual — {year} {displayMake} {displayModel} {gen.name}.
        </div>

        {/* Maintenance specs nav */}
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="text-xs text-gray-500 uppercase tracking-wider py-2">Other specs:</span>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">All specs</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/oil-type`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Oil Type</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/coolant-type`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Coolant</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/tire-size`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Tire Size</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/spark-plug-type`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Spark Plugs</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/transmission-fluid-type`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Trans Fluid</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/headlight-bulb`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Headlights</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/brake-fluid-type`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Brake Fluid</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/fluid-capacity`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Capacities</Link>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">What You&apos;ll Need</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <a href={buildAmazonSearchUrl(`${displayMake} ${displayModel} battery ${size || ''} ${year}`, "automotive", `battery-${year}-${canonicalMake}-${canonicalModel}`)} target="_blank" rel="nofollow sponsored noopener noreferrer" className="block glass rounded-xl p-5 hover:border-green-400/40 transition-all group">
              <p className="text-sm text-green-400 mb-1">Battery</p>
              <h3 className="text-base font-semibold text-white group-hover:text-green-300 transition-colors">{displayMake} {displayModel} {size || 'Replacement Battery'}</h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
            <a href={buildAmazonSearchUrl("battery terminal cleaner brush", "automotive", `cleaner-${year}-${canonicalMake}-${canonicalModel}`)} target="_blank" rel="nofollow sponsored noopener noreferrer" className="block glass rounded-xl p-5 hover:border-green-400/40 transition-all group">
              <p className="text-sm text-green-400 mb-1">Tool</p>
              <h3 className="text-base font-semibold text-white group-hover:text-green-300 transition-colors">Battery Terminal Cleaner</h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
            <a href={buildAmazonSearchUrl("battery tender maintainer", "automotive", `tender-${year}-${canonicalMake}-${canonicalModel}`)} target="_blank" rel="nofollow sponsored noopener noreferrer" className="block glass rounded-xl p-5 hover:border-green-400/40 transition-all group">
              <p className="text-sm text-green-400 mb-1">Accessory</p>
              <h3 className="text-base font-semibold text-white group-hover:text-green-300 transition-colors">Battery Tender / Maintainer</h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
            <a href={buildAmazonSearchUrl("dielectric grease battery terminals", "automotive", `grease-${year}-${canonicalMake}-${canonicalModel}`)} target="_blank" rel="nofollow sponsored noopener noreferrer" className="block glass rounded-xl p-5 hover:border-green-400/40 transition-all group">
              <p className="text-sm text-green-400 mb-1">Supply</p>
              <h3 className="text-base font-semibold text-white group-hover:text-green-300 transition-colors">Dielectric Grease</h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
          </div>
        </div>

        <RelatedForVehicle year={year} make={displayMake} model={displayModel} excludeType="battery-location" />

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
          intent="Battery Replacement"
          query={`${year} ${displayMake} ${displayModel} automotive battery`}
          subtag="maint-batterylocation"
          variant="mixed"
        />
      </div>
    </>
  );
}
