import type { Metadata } from "next";
import Link from "next/link";
import { VEHICLE_PRODUCTION_YEARS } from "@/data/vehicles";
import { buildAmazonSearchUrl } from "@/lib/amazonAffiliate";
import { ShoppingCartIcon } from "@/components/Icons";
import AffiliateLink from "@/components/AffiliateLink";
import StickyAffiliateBar from "@/components/StickyAffiliateBar";

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

      {/* High-intent maintenance parts categories */}
      <section className="mb-12 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] to-transparent p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <ShoppingCartIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Shop Maintenance Essentials</h2>
            <p className="text-sm text-gray-400">Common consumables and tools for routine service.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { query: 'motor oil 5w-30 synthetic', label: 'Engine Oil', subtag: 'maint-oil' },
            { query: 'oil filter', label: 'Oil Filters', subtag: 'maint-filter' },
            { query: 'cabin air filter', label: 'Cabin Filters', subtag: 'maint-cabin' },
            { query: 'spark plugs iridium', label: 'Spark Plugs', subtag: 'maint-spark' },
            { query: 'brake pads front', label: 'Brake Pads', subtag: 'maint-brake' },
            { query: 'wiper blades 26 inch', label: 'Wiper Blades', subtag: 'maint-wiper' },
            { query: 'battery tester automotive', label: 'Battery Testers', subtag: 'maint-battery-tool' },
            { query: 'torque wrench 3/8 inch', label: 'Torque Wrenches', subtag: 'maint-torque' },
          ].map((item) => (
            <AffiliateLink
              key={item.subtag}
              href={buildAmazonSearchUrl(item.query, 'automotive', `maint-landing-${item.subtag}`)}
              partName={item.label}
              vehicle="maintenance landing"
              pageType="parts_page"
              subtag={`maint-landing-${item.subtag}`}
              className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:border-amber-400/40 hover:bg-white/[0.06] transition-all"
            >
              <span className="text-sm text-gray-200 group-hover:text-white transition-colors">{item.label}</span>
              <ShoppingCartIcon className="w-4 h-4 text-gray-500 group-hover:text-amber-400 transition-colors" />
            </AffiliateLink>
          ))}
        </div>
      </section>

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

      <StickyAffiliateBar
        vehicle="your vehicle"
        intent="maintenance parts"
        query="automotive maintenance parts oil filter brake pads"
        subtag="maint-landing"
        variant="parts"
      />
    </div>
  );
}
