import HomeVehiclePicker from "../HomeVehiclePicker";

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative flex min-h-[100vh] items-center overflow-hidden"
    >
      {/* Base background */}
      <div className="absolute inset-0 bg-[#0a0a0c]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c] via-[#0d0d12] to-[#0a0a0c]" />

      {/* Animated grid lines — subtle parallax layer */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Radial glow — top center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-cyan-500/[0.04] blur-[150px] rounded-full pointer-events-none" />

      {/* Orange accent glow — bottom right */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[#FF6B00]/[0.03] blur-[120px] rounded-full pointer-events-none" />

      {/* Giant layered background text — "OEM" sits BEHIND content like "Japan" behind mountains */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] pointer-events-none select-none z-0">
        <span
          className="block text-[22vw] font-black tracking-tighter text-white/[0.025] whitespace-nowrap font-display leading-none"
          style={{
            WebkitTextStroke: "1px rgba(0, 212, 255, 0.04)",
          }}
        >
          OEM
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Perspective container for 3D text reveal */}
          <div className="perspective-1000">
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-7xl font-display preserve-3d">
              <span className="word inline-block">Silence</span>{" "}
              <span className="word inline-block">The</span>
              <br className="hidden sm:block" />
              <span className="word inline-block text-cyan-400 glow-text">
                Check
              </span>{" "}
              <span className="word inline-block text-cyan-400 glow-text">
                Engine
              </span>{" "}
              <span className="word inline-block text-cyan-400 glow-text">
                Light
              </span>
            </h1>
          </div>

          <p className="mx-auto mt-6 max-w-xl text-base text-gray-400 sm:text-lg leading-relaxed">
            Factory repair data for your exact year, make, and model — DTC
            codes, wiring diagrams, torque specs, and step-by-step procedures.
            The same manuals the pros use, organized so you can fix it yourself.
          </p>
        </div>

        {/* Glass morphism vehicle picker — frosted over the grid */}
        <div className="mx-auto mt-10 max-w-3xl">
          <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl p-6 sm:p-8 shadow-[0_0_80px_-20px_rgba(0,212,255,0.12)] overflow-hidden">
            {/* Inner gradient border shimmer */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
              background: "linear-gradient(135deg, rgba(0,212,255,0.08) 0%, transparent 50%, rgba(255,107,0,0.05) 100%)",
            }} />
            <div className="relative">
              <div className="mb-4 text-center">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-400/70">
                  What are you working on?
                </span>
              </div>
              <HomeVehiclePicker />
            </div>
          </div>
        </div>

        {/* Glass morphism stat pills */}
        <div className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-3 text-sm">
          {[
            { label: "1.4M+ OEM Procedures", color: "bg-cyan-400", glow: "shadow-[0_0_8px_rgba(0,212,255,0.4)]" },
            { label: "8,881 DTC Codes", color: "bg-cyan-400", glow: "shadow-[0_0_8px_rgba(0,212,255,0.4)]" },
            { label: "304K Vehicle Variants", color: "bg-cyan-400", glow: "shadow-[0_0_8px_rgba(0,212,255,0.4)]" },
            { label: "100% Free — No Login", color: "bg-green-400", glow: "shadow-[0_0_8px_rgba(74,222,128,0.4)]" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-md px-5 py-2.5 text-gray-400 transition-all hover:border-white/[0.15] hover:bg-white/[0.07]"
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${stat.color} ${stat.glow}`}
              />
              {stat.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
