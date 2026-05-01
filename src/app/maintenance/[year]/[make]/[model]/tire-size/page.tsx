import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchMaintenanceData } from "@/lib/maintenanceData";
import { buildAmazonSearchUrl } from "@/lib/amazonAffiliate";
import { getDisplayName, slugifyRoutePart, getClampedYear } from "@/data/vehicles";
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
  const title = `${year} ${displayMake} ${displayModel} Tire Size & Pressure | SpotOnAuto`;
  const description = `Exact OEM tire size, pressure, and load rating for the ${year} ${displayMake} ${displayModel}. Factory spec from the service manual.`;
  return {
    title,
    description,
    alternates: {
      canonical: `https://spotonauto.com/maintenance/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}/tire-size`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://spotonauto.com/maintenance/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}/tire-size`,
    },
  };
}

export default async function TireSizePage({ params }: PageProps) {
  const { year, make, model } = await params;
  const displayMake = getDisplayName(make, "make");
  const displayModel = getDisplayName(model, "model");
  const canonicalMake = slugifyRoutePart(displayMake);
  const canonicalModel = slugifyRoutePart(displayModel);

  const clamped = getClampedYear(year, displayMake, displayModel);
  if (clamped !== null) {
    notFound();
  }

  const data = await fetchMaintenanceData(year, displayMake, displayModel);
  if (!data || !data.tires) {
    notFound();
  }

  const { tires, variant } = data;

  const faqItems = [
    {
      question: `What size tires fit a ${year} ${displayMake} ${displayModel}?`,
      answer: `The ${year} ${displayMake} ${displayModel} uses ${tires.size} as the OEM tire size.`,
    },
    {
      question: `What tire pressure should a ${year} ${displayMake} ${displayModel} have?`,
      answer: `The recommended tire pressure for the ${year} ${displayMake} ${displayModel} is ${tires.pressureFront} PSI front and ${tires.pressureRear} PSI rear (cold).`,
    },
    {
      question: `Can I use a different tire size on my ${year} ${displayMake} ${displayModel}?`,
      answer: `It is recommended to use the OEM size ${tires.size}. Alternative sizes may affect speedometer accuracy, handling, and clearances.`,
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
      { "@type": "ListItem", position: 1, name: "Maintenance", item: "https://spotonauto.com/maintenance" },
      { "@type": "ListItem", position: 2, name: displayMake, item: `https://spotonauto.com/maintenance/${canonicalMake}` },
      { "@type": "ListItem", position: 3, name: `${displayMake} ${displayModel}`, item: `https://spotonauto.com/maintenance/${canonicalMake}/${canonicalModel}` },
      { "@type": "ListItem", position: 4, name: `${year} Tire Size`, item: `https://spotonauto.com/maintenance/${year}/${canonicalMake}/${canonicalModel}/tire-size` },
    ],
  };

  const tireSearchQuery = `${displayMake} ${displayModel} ${tires.size} tire ${year}`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <SafetyWarningBox className="mb-6" />

        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm font-body">
            <li><Link href="/maintenance" className="text-cyan-400 hover:text-cyan-300 transition-colors">Maintenance</Link></li>
            <span className="text-gray-600">/</span>
            <li><Link href={`/maintenance/${canonicalMake}`} className="text-cyan-400 hover:text-cyan-300 transition-colors">{displayMake}</Link></li>
            <span className="text-gray-600">/</span>
            <li><Link href={`/maintenance/${canonicalMake}/${canonicalModel}`} className="text-cyan-400 hover:text-cyan-300 transition-colors">{displayModel}</Link></li>
            <span className="text-gray-600">/</span>
            <li className="text-gray-400">{year} Tire Size</li>
          </ol>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">
          {year} {displayMake} {displayModel} Tire Size &amp; Pressure
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          OEM spec from the factory service manual for the {variant} variant.
        </p>

        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.08] p-6 mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80 mb-4">Quick Answer</p>
          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">OEM Tire Size</p>
              <p className="text-2xl font-display font-bold text-white">{tires.size}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Pressure (Front / Rear)</p>
              <p className="text-2xl font-display font-bold text-white">{tires.pressureFront} / {tires.pressureRear} PSI</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Load Index</p>
              <p className="text-2xl font-display font-bold text-white">{tires.loadIndex}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-8 text-sm text-gray-400">
          <span className="text-cyan-400 font-medium">Source:</span> Factory service manual — {year} {displayMake} {displayModel} {variant}.
          {" "}
          <Link
            href={`/manual/${encodeURIComponent(displayMake)}/${year}/${encodeURIComponent(variant)}/Repair%20and%20Diagnosis/Quick%20Lookups/Tire%20Fitment`}
            className="text-cyan-400 hover:text-cyan-300 underline"
          >
            View full manual section →
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Shop Tires</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <a
              href={buildAmazonSearchUrl(tireSearchQuery, "automotive", `tire-${year}-${canonicalMake}-${canonicalModel}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="block glass rounded-xl p-5 hover:border-cyan-400/40 transition-all group"
            >
              <p className="text-sm text-cyan-400 mb-1">Replacement Tires</p>
              <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                {tires.size} for {displayMake} {displayModel}
              </h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
            <a
              href={buildAmazonSearchUrl("tire pressure gauge digital", "automotive", `gauge-${year}-${canonicalMake}-${canonicalModel}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="block glass rounded-xl p-5 hover:border-cyan-400/40 transition-all group"
            >
              <p className="text-sm text-cyan-400 mb-1">Tool</p>
              <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                Digital Tire Pressure Gauge
              </h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
          </div>
        </div>

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
