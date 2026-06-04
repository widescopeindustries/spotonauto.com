import type { Metadata } from "next";
import Link from "next/link";
import { logWarn } from '@/lib/logger';
import { notFound, redirect } from "next/navigation";
import { fetchMaintenanceData } from "@/lib/maintenanceData";
import { buildAmazonSearchUrl } from "@/lib/amazonAffiliate";
import { getDisplayName, slugifyRoutePart, getClampedYear } from "@/data/vehicles";
import { getMaintenanceFallbackUrl } from "@/lib/maintenanceFallback";
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
  const title = `${year} ${displayMake} ${displayModel} Coolant Type & Capacity | AllOEMManuals`;
  const description = `Exact engine coolant type, capacity, and OEM spec for the ${year} ${displayMake} ${displayModel}. Factory service manual data with flush interval and recommended products.`;
  return {
    title,
    description,
    alternates: {
      canonical: `https://alloemmanuals.com/maintenance/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}/coolant-type`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://alloemmanuals.com/maintenance/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}/coolant-type`,
    },
  };
}

export default async function CoolantTypePage({ params }: PageProps) {
  const { year, make, model } = await params;
  const displayMake = getDisplayName(make, "make");
  const displayModel = getDisplayName(model, "model");
  const canonicalMake = slugifyRoutePart(displayMake);
  const canonicalModel = slugifyRoutePart(displayModel);

  const clamped = getClampedYear(year, displayMake, displayModel);
  if (clamped !== null) {
    notFound();
  }

  let data: Awaited<ReturnType<typeof fetchMaintenanceData>> = null;
  try {
    data = await fetchMaintenanceData(year, displayMake, displayModel);
  } catch (err) {
    logWarn(`[Maintenance] fetch failed for ${year} ${displayMake} ${displayModel}`, err);
  }
  if (!data || !data.coolant) {
    const fallback = getMaintenanceFallbackUrl(displayMake, displayModel, 'coolant-type');
    if (fallback) {
      redirect(fallback);
    }
    notFound();
  }

  const { coolant, variant } = data;

  const faqItems = [
    {
      question: `What type of coolant does a ${year} ${displayMake} ${displayModel} take?`,
      answer: coolant.coolantType
        ? `The ${year} ${displayMake} ${displayModel} requires ${coolant.coolantType}. The exact spec may vary slightly by engine variant — this page shows the OEM recommendation for the ${variant} configuration.`
        : `The ${year} ${displayMake} ${displayModel} uses an OEM-specified coolant. Refer to the factory service manual for the exact type, as it varies by engine variant.`,
    },
    {
      question: `How much coolant does a ${year} ${displayMake} ${displayModel} hold?`,
      answer: `The ${year} ${displayMake} ${displayModel} cooling system capacity is ${coolant.capacityQt} (${coolant.capacityL}).`,
    },
    {
      question: `Can I use universal coolant in my ${year} ${displayMake} ${displayModel}?`,
      answer: coolant.coolantType
        ? `It is strongly recommended to use coolant that meets the ${coolant.coolantType} specification. Universal coolants may not provide the correct corrosion protection for your engine's materials.`
        : `Always use coolant that meets the OEM specification for your engine. Universal coolants may not provide adequate corrosion protection.`,
    },
    {
      question: `What happens if I use the wrong coolant in my ${year} ${displayMake} ${displayModel}?`,
      answer: `Using coolant that does not meet the OEM specification can cause corrosion, gasket damage, and overheating. Always verify the correct coolant type before topping off or flushing the system.`,
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
      { "@type": "ListItem", position: 4, name: `${year} ${displayMake} ${displayModel} Coolant Type`, item: `https://alloemmanuals.com/maintenance/${year}/${canonicalMake}/${canonicalModel}/coolant-type` },
    ],
  };

  const coolantSearchQuery = `${displayMake} ${displayModel} coolant ${year}`;

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
            <li className="text-gray-400">{year} Coolant Type</li>
          </ol>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">
          {year} {displayMake} {displayModel} Coolant Type &amp; Capacity
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          OEM spec from the factory service manual for the {variant} variant.
        </p>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] p-6 mb-8" itemScope itemType="https://schema.org/Question">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80 mb-4" itemProp="name">Quick Answer</p>
          <div className="grid sm:grid-cols-3 gap-6" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
            <div>
              <p className="text-sm text-gray-400 mb-1">Coolant Type</p>
              <p className="text-2xl font-display font-bold text-white" itemProp="text">
                {coolant.coolantType || "See manual"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Capacity</p>
              <p className="text-2xl font-display font-bold text-white" itemProp="text">{coolant.capacityQt}</p>
              <p className="text-sm text-gray-500">{coolant.capacityL}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Variant</p>
              <p className="text-lg font-display font-bold text-white">{variant}</p>
            </div>
          </div>
          {coolant.note && (
            <div className="mt-4 pt-4 border-t border-emerald-500/20 text-sm text-gray-300 leading-relaxed">
              <strong className="text-emerald-300">Note:</strong> {coolant.note}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-8 text-sm text-gray-400">
          <span className="text-emerald-400 font-medium">Source:</span> Factory service manual — {year} {displayMake} {displayModel} {variant}.
          {" "}
          <Link
            href={`/manual/${encodeURIComponent(displayMake)}/${year}/${encodeURIComponent(variant)}/Repair%20and%20Diagnosis/Quick%20Lookups/Fluids`}
            className="text-emerald-400 hover:text-emerald-300 underline"
          >
            View full manual section →
          </Link>
        </div>

        {/* Maintenance specs nav */}
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="text-xs text-gray-500 uppercase tracking-wider py-2">Other specs:</span>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">All specs</Link>
          <Link href={`/maintenance/${year}/${canonicalMake}/${canonicalModel}/oil-type`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">Oil Type</Link>
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
            <a
              href={buildAmazonSearchUrl(coolantSearchQuery, "automotive", `coolant-${year}-${canonicalMake}-${canonicalModel}`)}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className="block glass rounded-xl p-5 hover:border-emerald-400/40 transition-all group"
            >
              <p className="text-sm text-emerald-400 mb-1">Engine Coolant / Antifreeze</p>
              <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
                {coolant.coolantType || "OEM-spec coolant"} for {displayMake} {displayModel}
              </h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
            <a
              href={buildAmazonSearchUrl("coolant funnel spill free", "automotive", `funnel-${year}-${canonicalMake}-${canonicalModel}`)}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className="block glass rounded-xl p-5 hover:border-emerald-400/40 transition-all group"
            >
              <p className="text-sm text-emerald-400 mb-1">Tool</p>
              <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
                Spill-Free Coolant Funnel
              </h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
            <a
              href={buildAmazonSearchUrl("coolant tester hydrometer", "automotive", `tester-${year}-${canonicalMake}-${canonicalModel}`)}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className="block glass rounded-xl p-5 hover:border-emerald-400/40 transition-all group"
            >
              <p className="text-sm text-emerald-400 mb-1">Tester</p>
              <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
                Coolant Tester / Hydrometer
              </h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
            <a
              href={buildAmazonSearchUrl("drain pan coolant catch", "automotive", `pan-${year}-${canonicalMake}-${canonicalModel}`)}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className="block glass rounded-xl p-5 hover:border-emerald-400/40 transition-all group"
            >
              <p className="text-sm text-emerald-400 mb-1">Drain Pan</p>
              <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
                Coolant Drain Pan
              </h3>
              <p className="text-xs text-gray-500 mt-2">Search Amazon →</p>
            </a>
          </div>
        </div>

        <RelatedForVehicle year={year} make={displayMake} model={displayModel} excludeType="coolant-type" />

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
