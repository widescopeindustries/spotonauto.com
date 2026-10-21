import Link from "next/link";
import { Package, ArrowRight, Wrench, Check } from "lucide-react";
import { getAllKits } from "@/data/kits";

export default function KitsSection() {
  const kits = getAllKits();

  return (
    <section className="relative overflow-hidden py-16 md:py-24 border-t border-slate-800/60 bg-[#0B0F17]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Package className="h-4 w-4 text-sky-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-sky-400">
              OEM Hardware &amp; Service Packages
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl tracking-tight">
            Factory-Specified Service Kits
          </h2>
          <p className="mx-auto mt-2.5 max-w-xl text-slate-400 text-sm sm:text-base">
            Exact-match OEM fluids, factory filtration, and drain plug crush washers pulled directly from the factory service manuals.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {kits.map((kit) => (
            <Link
              key={kit.slug}
              href={`/kits/oil-change/${kit.slug}`}
              className="group flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-6 transition-all duration-200 hover:border-sky-500/40 hover:bg-slate-800/50 shadow-xs"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-200 group-hover:text-white transition-colors">
                    {kit.make} {kit.model}
                  </h3>
                  <p className="text-xs font-mono text-slate-400">{kit.yearRange}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <Package className="h-4 w-4" />
                </div>
              </div>

              <div className="mb-5 space-y-2 font-mono text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span>{kit.oilSpec.viscosity} {kit.oilSpec.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span>OEM-spec spin-on/cartridge filter</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span>Drain plug washer + service specs</span>
                </div>
              </div>

              <div className="mt-auto border-t border-slate-800 pt-4">
                <div className="flex items-end justify-between font-mono">
                  <div>
                    <p className="text-[11px] text-slate-500 uppercase">Standard Spec</p>
                    <p className="text-lg font-bold text-slate-200">
                      ${kit.pricing.smartBudget}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-sky-400 uppercase">Factory OEM</p>
                    <p className="text-lg font-bold text-sky-400">
                      ${kit.pricing.oemExact}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-mono font-semibold text-sky-400 group-hover:text-sky-300 transition-colors">
                  <span>View Package Components</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}

          {/* Catalog Index card */}
          <Link
            href="/kits"
            className="group flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-6 text-center transition-colors hover:border-sky-500/50 hover:bg-slate-900/60"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-sky-400">
              <Wrench className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-200">
              Complete Maintenance Index
            </h3>
            <p className="mt-1.5 text-xs text-slate-400 max-w-xs leading-relaxed">
              Explore scheduled interval packages and factory service kits for all supported makes and models.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-mono font-semibold text-sky-400 group-hover:text-sky-300 transition-colors">
              <span>View All Service Kits</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
