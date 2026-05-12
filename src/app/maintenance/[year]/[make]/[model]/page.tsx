import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchMaintenanceData } from "@/lib/maintenanceData";
import { getDisplayName, slugifyRoutePart, getClampedYear } from "@/data/vehicles";

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
  const title = `${year} ${displayMake} ${displayModel} Maintenance Specs | AllOEMManuals`;
  const description = `Factory maintenance specifications for the ${year} ${displayMake} ${displayModel}: oil type, capacity, tire size, pressure, and coolant specs from the OEM service manual.`;
  return {
    title,
    description,
    alternates: {
      canonical: `https://alloemmanuals.com/maintenance/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://alloemmanuals.com/maintenance/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}`,
    },
  };
}

export default async function MaintenanceHubPage({ params }: PageProps) {
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
  if (!data) {
    notFound();
  }

  const { oil, coolant, tires, variant } = data;
  const basePath = `/maintenance/${year}/${canonicalMake}/${canonicalModel}`;

  const specs = [
    {
      id: "oil-type",
      label: "Oil Type & Capacity",
      icon: "🛢️",
      available: !!oil,
      summary: oil
        ? `${oil.oilType} · ${oil.capacityQt}`
        : "Not available for this variant",
      href: `${basePath}/oil-type`,
      tone: "cyan",
    },
    {
      id: "tire-size",
      label: "Tire Size & Pressure",
      icon: "🛞",
      available: !!tires,
      summary: tires
        ? `${tires.size} · ${tires.pressureFront} front / ${tires.pressureRear} rear`
        : "Not available for this variant",
      href: `${basePath}/tire-size`,
      tone: "violet",
    },
    {
      id: "coolant-type",
      label: "Coolant Type & Capacity",
      icon: "❄️",
      available: !!coolant,
      summary: coolant
        ? `${coolant.coolantType || "OEM spec"} · ${coolant.capacityQt}`
        : "Not available for this variant",
      href: `${basePath}/coolant-type`,
      tone: "emerald",
    },
  ];

  const availableCount = specs.filter((s) => s.available).length;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Maintenance", item: "https://alloemmanuals.com/maintenance" },
      { "@type": "ListItem", position: 2, name: displayMake, item: `https://alloemmanuals.com/maintenance/${canonicalMake}` },
      { "@type": "ListItem", position: 3, name: `${displayMake} ${displayModel}`, item: `https://alloemmanuals.com/maintenance/${canonicalMake}/${canonicalModel}` },
      { "@type": "ListItem", position: 4, name: `${year} ${displayMake} ${displayModel} Maintenance`, item: `https://alloemmanuals.com/maintenance/${year}/${canonicalMake}/${canonicalModel}` },
    ],
  };

  const toneBorder: Record<string, string> = {
    cyan: "border-cyan-500/20 hover:border-cyan-500/40",
    violet: "border-violet-500/20 hover:border-violet-500/40",
    emerald: "border-emerald-500/20 hover:border-emerald-500/40",
  };

  const toneBg: Record<string, string> = {
    cyan: "bg-cyan-500/[0.04]",
    violet: "bg-violet-500/[0.04]",
    emerald: "bg-emerald-500/[0.04]",
  };

  const toneText: Record<string, string> = {
    cyan: "text-cyan-300",
    violet: "text-violet-300",
    emerald: "text-emerald-300",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="max-w-5xl mx-auto px-4 py-12">
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
            <li className="text-gray-400">{displayModel}</li>
          </ol>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">
          {year} {displayMake} {displayModel} Maintenance Specs
        </h1>
        <p className="text-gray-400 text-sm mb-2">
          Factory service manual data for the {variant} variant.
        </p>
        <p className="text-gray-500 text-xs mb-8">
          {availableCount} of {specs.length} specs available
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {specs.map((spec) => (
            <div
              key={spec.id}
              className={`rounded-2xl border ${toneBorder[spec.tone]} ${toneBg[spec.tone]} p-5 transition-all ${
                spec.available ? "" : "opacity-50"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{spec.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{spec.label}</p>
                  {spec.available ? (
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400">Available</span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">Coming soon</span>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-300 mb-4 min-h-[2.5rem]">{spec.summary}</p>

              {spec.available ? (
                <Link
                  href={spec.href}
                  className={`inline-flex items-center gap-1 text-sm font-medium ${toneText[spec.tone]} hover:underline`}
                >
                  View spec →
                </Link>
              ) : (
                <span className="text-sm text-gray-600">Data not in manual</span>
              )}
            </div>
          ))}
        </div>

        {/* Cross-links */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-bold text-white mb-3">Related</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/vehicles/${year}/${canonicalMake}/${canonicalModel}`}
              className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm hover:bg-cyan-500/20 transition"
            >
              Factory Manual Hub
            </Link>
            <Link
              href={`/repair/${year}/${canonicalMake}/${canonicalModel}`}
              className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm hover:bg-emerald-500/20 transition"
            >
              Repair Guides
            </Link>
            <Link
              href={`/diagnose?year=${year}&make=${encodeURIComponent(displayMake)}&model=${encodeURIComponent(displayModel)}`}
              className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm hover:bg-amber-500/20 transition"
            >
              AI Diagnosis
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
