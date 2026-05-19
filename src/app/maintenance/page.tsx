import type { Metadata } from "next";
import Link from "next/link";
import { VEHICLE_PRODUCTION_YEARS } from "@/data/vehicles";

export const metadata: Metadata = {
  title: "Maintenance Specs by Vehicle | AllOEMManuals",
  description: "Factory maintenance specifications for every vehicle: oil type, capacity, tire size, coolant, spark plugs, transmission fluid, battery, wiper blades, and more. OEM service manual data.",
  alternates: {
    canonical: "https://alloemmanuals.com/maintenance",
  },
};

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-");
}

export default function MaintenanceLandingPage() {
  const allMakes = Object.keys(VEHICLE_PRODUCTION_YEARS).slice(0, 30);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
        Vehicle Maintenance Specs
      </h1>
      <p className="text-gray-400 text-sm mb-10 max-w-2xl">
        Factory service manual maintenance data for every year, make, and model.
        Find exact oil type, capacity, tire size, pressure, coolant spec, spark plug type,
        transmission fluid, battery size, wiper blade size, and serpentine belt routing.
      </p>

      <div className="space-y-8">
        {allMakes.map((make) => {
          const models = Object.keys(VEHICLE_PRODUCTION_YEARS[make] || {}).slice(0, 12);
          return (
            <section key={make} className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">{make}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {models.map((model) => {
                  const range = VEHICLE_PRODUCTION_YEARS[make][model];
                  const midYear = Math.floor((range.start + range.end) / 2);
                  return (
                    <Link
                      key={model}
                      href={`/maintenance/${midYear}/${slugify(make)}/${slugify(model)}`}
                      className="block p-4 rounded-lg bg-white/[0.04] border border-white/10 hover:border-cyan-500/40 transition group"
                    >
                      <h3 className="text-sm font-semibold text-gray-200 group-hover:text-white transition">
                        {make} {model}
                      </h3>
                      <p className="text-xs text-cyan-400 mt-1">Maintenance specs →</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
