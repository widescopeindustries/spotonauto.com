import Link from "next/link";
import { getToolPagesForVehicle, TOOL_TYPE_META } from "@/data/tools-pages";
import { getProfilesForVehicle } from "@/lib/vehicleRepairProfiles";
import { slugifyRoutePart } from "@/data/vehicles";

interface RelatedForVehicleProps {
  year: string | number;
  make: string;
  model: string;
  excludeType?: string; // e.g. 'oil-type' — don't show link to current page
}

const MAINTENANCE_TOOL_TYPES = new Set([
  "oil-type",
  "coolant-type",
  "tire-size",
  "battery-location",
  "wiper-blade-size",
  "serpentine-belt",
  "spark-plug-type",
  "transmission-fluid-type",
  "headlight-bulb",
  "brake-fluid-type",
  "fluid-capacity",
]);

const TYPE_ORDER = [
  "oil-type",
  "coolant-type",
  "tire-size",
  "battery-location",
  "spark-plug-type",
  "transmission-fluid-type",
  "wiper-blade-size",
  "serpentine-belt",
  "headlight-bulb",
  "brake-fluid-type",
  "fluid-capacity",
];

export default async function RelatedForVehicle({ year, make, model, excludeType }: RelatedForVehicleProps) {
  const yearNum = typeof year === "string" ? parseInt(year, 10) : year;
  const canonicalMake = slugifyRoutePart(make);
  const canonicalModel = slugifyRoutePart(model);
  const basePath = `/maintenance/${yearNum}/${canonicalMake}/${canonicalModel}`;
  const vehicleHubPath = `/vehicles/${yearNum}/${canonicalMake}/${canonicalModel}`;
  const repairPath = `/repair/${yearNum}/${canonicalMake}/${canonicalModel}`;

  // Find available maintenance specs for this vehicle
  const toolPages = getToolPagesForVehicle(make, model);
  const maintenanceLinks = TYPE_ORDER
    .map((type) => {
      if (excludeType && type === excludeType) return null;
      const tp = toolPages.find((p) => p.toolType === type);
      if (!tp) return null;
      const meta = TOOL_TYPE_META[type];
      if (!meta) return null;
      return {
        type,
        label: meta.label,
        icon: meta.icon,
        href: `${basePath}/${type}`,
      };
    })
    .filter(Boolean) as Array<{ type: string; label: string; icon: string; href: string }>;

  // Find repair profiles for this vehicle
  const repairProfiles = (await getProfilesForVehicle(yearNum, make, model)).slice(0, 4);

  return (
    <section className="mt-12 pt-10 border-t border-white/10">
      <h2 className="text-lg font-bold text-white mb-5">
        Related for Your {yearNum} {make} {model}
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Maintenance specs column */}
        {maintenanceLinks.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">
              Maintenance Specs
            </h3>
            <div className="flex flex-wrap gap-2">
              {maintenanceLinks.map((link) => (
                <Link
                  key={link.type}
                  href={link.href}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white hover:border-cyan-500/30 transition"
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Repairs column */}
        {repairProfiles.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">
              Popular Repairs
            </h3>
            <div className="flex flex-wrap gap-2">
              {repairProfiles.map((r) => (
                <Link
                  key={r.task}
                  href={`${repairPath}/${r.task}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white hover:border-cyan-500/30 transition"
                >
                  <span>🔧</span>
                  <span>{r.profile.supportNote?.title || r.task.replace(/-/g, " ")}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions column */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 md:col-span-2">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href={vehicleHubPath}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-sm text-cyan-300 hover:bg-cyan-500/20 transition"
            >
              <span>🏠</span>
              <span>{yearNum} {make} {model} Hub</span>
            </Link>
            <Link
              href={repairPath}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              <span>🛠️</span>
              <span>All Repair Guides</span>
            </Link>
            <Link
              href={`/diagnose?year=${yearNum}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300 hover:bg-amber-500/20 transition"
            >
              <span>🤖</span>
              <span>AI Diagnosis</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
