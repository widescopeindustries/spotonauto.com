import Link from "next/link";
import HomeVehiclePicker from "../HomeVehiclePicker";

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative overflow-hidden pt-28 pb-14 sm:pt-32"
    >
      {/* Base background */}
      <div className="absolute inset-0 bg-[#0B0F17]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F17] via-[#0E1422] to-[#0B0F17]" />

      {/* Blueprint grid lines — subtle technical blueprint pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(56, 189, 248, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 189, 248, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Subtle institutional ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-sky-500/[0.03] blur-[140px] rounded-full pointer-events-none" />

      {/* Giant layered background text — subtle OEM watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] pointer-events-none select-none z-0">
        <span
          className="block text-[20vw] font-black tracking-tighter text-white/[0.015] whitespace-nowrap font-mono leading-none"
        >
          OEM
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/20 bg-sky-500/10 text-xs font-mono text-sky-400 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            FACTORY SERVICE SPECIFICATIONS &bull; 1960&ndash;2025
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.12]">
            AllOEMManuals
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-400 sm:text-lg leading-relaxed">
            Wiring diagrams, factory specs, and the repair for your exact year, make, and model.
          </p>
        </div>

        {/* Precision vehicle picker container */}
        <div className="mx-auto mt-10 max-w-3xl">
          <div className="relative rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-6 sm:p-8 shadow-xl">
            <div className="relative">
              <div className="mb-4 text-center">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                  Select Vehicle to Open Service Manual
                </span>
              </div>
              <HomeVehiclePicker />
            </div>
          </div>
          <nav className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3" aria-label="What people open first">
            <Link href="/wiring" className="rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3 text-center font-semibold text-sky-300 hover:border-sky-500/40">
              Wiring diagrams
            </Link>
            <Link href="/tools" className="rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3 text-center font-semibold text-sky-300 hover:border-sky-500/40">
              Fluid, belt, and battery specs
            </Link>
            <Link href="/repair" className="rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3 text-center font-semibold text-sky-300 hover:border-sky-500/40">
              Repair procedures
            </Link>
          </nav>
        </div>

        {/* Technical stat chips */}
        <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-2.5 text-xs font-mono">
          {[
            { label: "1.4M+ Factory Procedures", accent: "bg-sky-400" },
            { label: "8,881 DTC Diagnostic Trees", accent: "bg-sky-400" },
            { label: "304,000+ Vehicle Variants", accent: "bg-sky-400" },
            { label: "Complete OEM Fastener Torques", accent: "bg-emerald-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/60 px-3.5 py-1.5 text-slate-300"
            >
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${stat.accent}`} />
              {stat.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
