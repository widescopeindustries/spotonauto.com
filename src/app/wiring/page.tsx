import Link from 'next/link';
import WiringDiagramLibrary from './WiringDiagramLibrary';
import {
  buildWiringSeoHref,
  WIRING_SEO_SYSTEMS,
  WIRING_SEO_VEHICLES,
  type WiringSystemSlug,
} from '@/data/wiring-seo-cluster';

export default function WiringPage() {
  const systems = Object.keys(WIRING_SEO_SYSTEMS) as WiringSystemSlug[];

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 pt-24 pb-8">
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <p className="text-cyan-400 text-xs font-bold tracking-[0.2em] uppercase mb-2">Wiring SEO Cluster</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Featured OEM Wiring Diagram Pages
          </h2>
          <p className="text-gray-300 mb-5">
            Prebuilt system pages for high-intent diagnosis workflows. Pick a vehicle and jump directly to starter, alternator, or fuel-pump diagram paths.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {WIRING_SEO_VEHICLES.map(vehicle => (
              <div key={`${vehicle.year}-${vehicle.make}-${vehicle.model}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-white font-semibold mb-3">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                <div className="flex flex-wrap gap-2">
                  {systems.map(system => (
                    <Link
                      key={system}
                      href={buildWiringSeoHref(vehicle, system)}
                      className="px-3 py-1.5 rounded-lg border border-white/15 text-sm text-gray-200 hover:text-white hover:border-cyan-400/50 transition"
                    >
                      {WIRING_SEO_SYSTEMS[system].shortLabel}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WiringDiagramLibrary />
    </>
  );
}
