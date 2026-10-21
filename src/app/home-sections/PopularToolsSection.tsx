import Link from "next/link";
import {
  Droplets,
  Battery,
  CircleDot,
  Cog,
  Thermometer,
  Zap,
  ArrowRight,
  Sliders,
  Wrench,
} from "lucide-react";

interface ToolCard {
  slug: string;
  label: string;
  vehicle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOP_TOOLS: ToolCard[] = [
  {
    slug: "/tools/toyota-camry-oil-type",
    label: "Engine Oil Spec",
    vehicle: "Toyota Camry",
    icon: Droplets,
  },
  {
    slug: "/tools/honda-civic-oil-type",
    label: "Engine Oil Spec",
    vehicle: "Honda Civic",
    icon: Droplets,
  },
  {
    slug: "/tools/bmw-x3-battery-location",
    label: "Battery Group & Location",
    vehicle: "BMW X3",
    icon: Battery,
  },
  {
    slug: "/tools/toyota-camry-tire-size",
    label: "OEM Tire & Wheel Fitment",
    vehicle: "Toyota Camry",
    icon: CircleDot,
  },
  {
    slug: "/tools/nissan-pathfinder-serpentine-belt",
    label: "Drive Belt Routing & Spec",
    vehicle: "Nissan Pathfinder",
    icon: Cog,
  },
  {
    slug: "/tools/chevrolet-silverado-coolant-type",
    label: "Cooling System Capacity",
    vehicle: "Chevrolet Silverado",
    icon: Thermometer,
  },
  {
    slug: "/tools/honda-civic-spark-plug-type",
    label: "Spark Plug Gap & Torque",
    vehicle: "Honda Civic",
    icon: Zap,
  },
  {
    slug: "/tools/audi-q5-transmission-fluid-type",
    label: "Transmission Fluid Spec",
    vehicle: "Audi Q5",
    icon: Droplets,
  },
];

export default function PopularToolsSection() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 border-t border-slate-800/60 bg-[#0C101A]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Sliders className="h-4 w-4 text-sky-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-sky-400">
              Quick Reference Database
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl tracking-tight">
            Factory Service Specifications
          </h2>
          <p className="mx-auto mt-2.5 max-w-xl text-slate-400 text-sm sm:text-base">
            OEM fluid capacities, battery group sizes, torque tolerances, and fitment charts
            indexed by exact vehicle year and trim.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TOP_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.slug}
                href={tool.slug}
                className="group flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-all duration-200 hover:border-sky-500/40 hover:bg-slate-800/50 shadow-xs"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-mono font-medium text-slate-400">
                    {tool.label}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-200 group-hover:text-white transition-colors">
                  {tool.vehicle}
                </h3>

                <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-mono font-semibold text-sky-400 group-hover:text-sky-300 transition-colors">
                  <span>View OEM Specs</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-5 py-2.5 text-xs font-mono font-semibold text-slate-200 transition-colors hover:bg-slate-700 hover:border-slate-600"
          >
            <Wrench className="h-3.5 w-3.5 text-sky-400" />
            <span>Browse Complete Specification Database &rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
