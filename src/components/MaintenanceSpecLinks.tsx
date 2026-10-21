import Link from "next/link";
import { type ToolType } from "@/data/tools-pages";
import { slugifyRoutePart } from "@/data/vehicles";
import { getMaintenanceSpecLink } from "@/lib/maintenanceFallback";

const SPEC_LABELS: Array<[ToolType, string]> = [
  ["oil-type", "Oil Type"], ["coolant-type", "Coolant"], ["tire-size", "Tire Size"],
  ["battery-location", "Battery"], ["wiper-blade-size", "Wipers"],
  ["serpentine-belt", "Belt"], ["spark-plug-type", "Spark Plugs"],
  ["transmission-fluid-type", "Trans Fluid"], ["headlight-bulb", "Headlights"],
  ["brake-fluid-type", "Brake Fluid"], ["fluid-capacity", "Capacities"],
];
const linkClass = "px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition";

export default function MaintenanceSpecLinks({ year, make, model, excludeType }: {
  year: string | number; make: string; model: string; excludeType: ToolType;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <span className="text-xs text-gray-500 uppercase tracking-wider py-2">Other specs:</span>
      <Link href={`/maintenance/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}`} className={linkClass}>All specs</Link>
      {SPEC_LABELS.filter(([type]) => type !== excludeType).map(([type, label]) => {
        const href = getMaintenanceSpecLink(year, make, model, type);
        return href ? <Link key={type} href={href} className={linkClass}>{label}</Link> : null;
      })}
    </div>
  );
}
