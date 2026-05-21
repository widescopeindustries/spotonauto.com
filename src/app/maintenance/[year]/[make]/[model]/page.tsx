import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchMaintenanceData } from "@/lib/maintenanceData";
import { getToolPagesForVehicle } from "@/data/tools-pages";
import { getDisplayName, slugifyRoutePart, getClampedYear } from "@/data/vehicles";
import KitCTA from '@/components/KitCTA';

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
  const description = `Factory maintenance specifications for the ${year} ${displayMake} ${displayModel}: oil type, capacity, tire size, pressure, coolant, spark plugs, transmission fluid, and more from the OEM service manual.`;
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

  let data: Awaited<ReturnType<typeof fetchMaintenanceData>> = null;
  try {
    data = await fetchMaintenanceData(year, displayMake, displayModel);
  } catch {
    // allow fallback to tool-page-only specs
  }

  const toolPages = getToolPagesForVehicle(displayMake, displayModel);
  const hasToolPage = (type: string) => toolPages.some((p) => p.toolType === type);

  const basePath = `/maintenance/${year}/${canonicalMake}/${canonicalModel}`;

  const specs = [
    {
      id: "oil-type",
      label: "Oil Type & Capacity",
      icon: "🛢️",
      available: !!data?.oil,
      summary: data?.oil
        ? `${data.oil.oilType} · ${data.oil.capacityQt}`
        : "Not available for this variant",
      href: `${basePath}/oil-type`,
      tone: "cyan",
    },
    {
      id: "tire-size",
      label: "Tire Size & Pressure",
      icon: "🛞",
      available: !!data?.tires,
      summary: data?.tires
        ? `${data.tires.size} · ${data.tires.pressureFront} front / ${data.tires.pressureRear} rear`
        : "Not available for this variant",
      href: `${basePath}/tire-size`,
      tone: "violet",
    },
    {
      id: "coolant-type",
      label: "Coolant Type & Capacity",
      icon: "❄️",
      available: !!data?.coolant,
      summary: data?.coolant
        ? `${data.coolant.coolantType || "OEM spec"} · ${data.coolant.capacityQt}`
        : "Not available for this variant",
      href: `${basePath}/coolant-type`,
      tone: "emerald",
    },
    {
      id: "battery-location",
      label: "Battery Location & Size",
      icon: "🔋",
      available: hasToolPage('battery-location'),
      summary: "OEM battery spec",
      href: `${basePath}/battery-location`,
      tone: "green",
    },
    {
      id: "wiper-blade-size",
      label: "Wiper Blade Size",
      icon: "🌧️",
      available: hasToolPage('wiper-blade-size'),
      summary: "OEM wiper blade sizes",
      href: `${basePath}/wiper-blade-size`,
      tone: "sky",
    },
    {
      id: "serpentine-belt",
      label: "Serpentine Belt",
      icon: "⚙️",
      available: hasToolPage('serpentine-belt'),
      summary: "OEM belt routing & part number",
      href: `${basePath}/serpentine-belt`,
      tone: "purple",
    },
    {
      id: "spark-plug-type",
      label: "Spark Plug Type & Gap",
      icon: "⚡",
      available: hasToolPage('spark-plug-type'),
      summary: "OEM plug, gap & torque",
      href: `${basePath}/spark-plug-type`,
      tone: "orange",
    },
    {
      id: "transmission-fluid-type",
      label: "Transmission Fluid",
      icon: "⚙️",
      available: hasToolPage('transmission-fluid-type'),
      summary: "OEM ATF/MTF spec & capacity",
      href: `${basePath}/transmission-fluid-type`,
      tone: "rose",
    },
    {
      id: "headlight-bulb",
      label: "Headlight Bulb Size",
      icon: "💡",
      available: hasToolPage('headlight-bulb'),
      summary: "OEM low/high beam & fog light",
      href: `${basePath}/headlight-bulb`,
      tone: "yellow",
    },
    {
      id: "brake-fluid-type",
      label: "Brake Fluid",
      icon: "🚨",
      available: hasToolPage('brake-fluid-type'),
      summary: "OEM DOT spec & capacity",
      href: `${basePath}/brake-fluid-type`,
      tone: "red",
    },
    {
      id: "fluid-capacity",
      label: "Fluid Capacities",
      icon: "🧪",
      available: hasToolPage('fluid-capacity'),
      summary: "Oil, coolant, trans & more",
      href: `${basePath}/fluid-capacity`,
      tone: "cyan",
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
    green: "border-green-500/20 hover:border-green-500/40",
    sky: "border-sky-500/20 hover:border-sky-500/40",
    purple: "border-purple-500/20 hover:border-purple-500/40",
    orange: "border-orange-500/20 hover:border-orange-500/40",
    rose: "border-rose-500/20 hover:border-rose-500/40",
    yellow: "border-yellow-500/20 hover:border-yellow-500/40",
    red: "border-red-500/20 hover:border-red-500/40",
  };

  const toneBg: Record<string, string> = {
    cyan: "bg-cyan-500/[0.04]",
    violet: "bg-violet-500/[0.04]",
    emerald: "bg-emerald-500/[0.04]",
    green: "bg-green-500/[0.04]",
    sky: "bg-sky-500/[0.04]",
    purple: "bg-purple-500/[0.04]",
    orange: "bg-orange-500/[0.04]",
    rose: "bg-rose-500/[0.04]",
    yellow: "bg-yellow-500/[0.04]",
    red: "bg-red-500/[0.04]",
  };

  const toneText: Record<string, string> = {
    cyan: "text-cyan-300",
    violet: "text-violet-300",
    emerald: "text-emerald-300",
    green: "text-green-300",
    sky: "text-sky-300",
    purple: "text-purple-300",
    orange: "text-orange-300",
    rose: "text-rose-300",
    yellow: "text-yellow-300",
    red: "text-red-300",
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
          Factory service manual data for the {data?.variant || displayModel} variant.
        </p>
        <p className="text-gray-500 text-xs mb-8">
          {availableCount} of {specs.length} specs available
        </p>

        <KitCTA make={displayMake} model={displayModel} />

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

        {/* Maintenance Intervals Hub */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-2">
            Typical Service Intervals
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            These are the standard maintenance intervals for most vehicles under normal driving conditions. Always verify with your owner&apos;s manual for severe service schedules.
          </p>
          <div className="space-y-4">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-6">
              <h3 className="text-lg font-bold text-cyan-300 mb-3 flex items-center gap-2">
                <span className="bg-cyan-500/20 px-2 py-1 rounded text-cyan-400 text-sm">Every 30,000 Miles</span>
              </h3>
              <ul className="grid sm:grid-cols-2 gap-3 text-sm text-gray-300">
                <li>• <Link href={`/repair/${year}/${canonicalMake}/${canonicalModel}/brake-pad-replacement`} className="hover:text-cyan-400 hover:underline transition">Inspect brake pads & rotors</Link></li>
                <li>• <Link href={`/repair/${year}/${canonicalMake}/${canonicalModel}/engine-air-filter-replacement`} className="hover:text-cyan-400 hover:underline transition">Replace engine air filter</Link></li>
                <li>• <Link href={`/repair/${year}/${canonicalMake}/${canonicalModel}/cabin-air-filter-replacement`} className="hover:text-cyan-400 hover:underline transition">Replace cabin air filter</Link></li>
                <li>• <Link href={`/repair/${year}/${canonicalMake}/${canonicalModel}/serpentine-belt-replacement`} className="hover:text-cyan-400 hover:underline transition">Inspect drive belts & hoses</Link></li>
              </ul>
            </div>
            
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6">
              <h3 className="text-lg font-bold text-violet-300 mb-3 flex items-center gap-2">
                <span className="bg-violet-500/20 px-2 py-1 rounded text-violet-400 text-sm">Every 60,000 Miles</span>
              </h3>
              <ul className="grid sm:grid-cols-2 gap-3 text-sm text-gray-300">
                <li>• <Link href={`/repair/${year}/${canonicalMake}/${canonicalModel}/spark-plug-replacement`} className="hover:text-violet-400 hover:underline transition">Replace spark plugs (standard)</Link></li>
                <li>• <Link href={`/repair/${year}/${canonicalMake}/${canonicalModel}/battery-replacement`} className="hover:text-violet-400 hover:underline transition">Replace battery</Link> (typical 3-5 years)</li>
                <li>• <Link href={`/repair/${year}/${canonicalMake}/${canonicalModel}/transmission-fluid-change`} className="hover:text-violet-400 hover:underline transition">Change automatic transmission fluid</Link></li>
                <li>• <Link href={`/repair/${year}/${canonicalMake}/${canonicalModel}/brake-fluid-flush`} className="hover:text-violet-400 hover:underline transition">Flush brake fluid system</Link></li>
              </ul>
            </div>

            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6">
              <h3 className="text-lg font-bold text-rose-300 mb-3 flex items-center gap-2">
                <span className="bg-rose-500/20 px-2 py-1 rounded text-rose-400 text-sm">Every 90,000+ Miles</span>
              </h3>
              <ul className="grid sm:grid-cols-2 gap-3 text-sm text-gray-300">
                <li>• <Link href={`/repair/${year}/${canonicalMake}/${canonicalModel}/spark-plug-replacement`} className="hover:text-rose-400 hover:underline transition">Replace spark plugs (iridium)</Link></li>
                <li>• <Link href={`/repair/${year}/${canonicalMake}/${canonicalModel}/timing-belt-replacement`} className="hover:text-rose-400 hover:underline transition">Replace timing belt & water pump</Link></li>
                <li>• <Link href={`/repair/${year}/${canonicalMake}/${canonicalModel}/coolant-flush`} className="hover:text-rose-400 hover:underline transition">Change engine coolant/antifreeze</Link></li>
                <li>• <Link href={`/repair/${year}/${canonicalMake}/${canonicalModel}/oxygen-sensor-replacement`} className="hover:text-rose-400 hover:underline transition">Replace oxygen sensors (O2)</Link></li>
              </ul>
            </div>
          </div>
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
