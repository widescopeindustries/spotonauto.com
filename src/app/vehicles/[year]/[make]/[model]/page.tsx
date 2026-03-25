import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildVehicleLaneData } from '@/lib/vehicleLane';
import { slugifyRoutePart } from '@/data/vehicles';

interface PageProps {
  params: Promise<{ year: string; make: string; model: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year, make, model } = await params;
  const title = `${year} ${decodeURIComponent(make)} ${decodeURIComponent(model)} — Factory Service Manual Data | SpotOn Auto`;
  const description = `Complete OEM diagnostic data for the ${year} ${decodeURIComponent(make)} ${decodeURIComponent(model)}: trouble codes, diagnostic flowcharts, wiring diagrams, and repair procedures from the factory service manual.`;
  const pageUrl = `https://spotonauto.com/vehicles/${year}/${make}/${model}`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'article', url: pageUrl },
    alternates: { canonical: pageUrl },
  };
}

export default async function VehicleLanePage({ params }: PageProps) {
  const { year, make, model } = await params;
  const yearNum = parseInt(year, 10);
  if (isNaN(yearNum) || yearNum < 1982 || yearNum > 2013) notFound();

  const data = await buildVehicleLaneData(make, yearNum, model);
  if (!data) notFound();

  const v = data.vehicle;
  const displayName = `${v.year} ${v.make} ${v.model}`;
  const basePath = `/vehicles/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <section className="py-12 px-4 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-cyan-400 transition">Home</Link>
          <span>/</span>
          <Link href="/vehicles" className="hover:text-cyan-400 transition">Vehicles</Link>
          <span>/</span>
          <span className="text-white">{displayName}</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{displayName}</h1>
          <p className="text-gray-400">{v.variant}</p>
          <div className="flex gap-4 mt-4 text-sm">
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
              {data.totalSystems} systems
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              {data.totalContent.toLocaleString()} manual pages
            </span>
            {data.totalDtcCodes > 0 && (
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                {data.totalDtcCodes} diagnostic codes
              </span>
            )}
          </div>
        </div>

        {/* DTC Codes — the main attraction */}
        {data.dtcCodes.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-2">Diagnostic Trouble Codes</h2>
            <p className="text-gray-400 text-sm mb-6">
              Factory diagnostic flowcharts from the OEM service manual for your {displayName}.
              Each code links to the actual step-by-step procedure.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.dtcCodes.map((dtc) => (
                <Link
                  key={dtc.code}
                  href={`${basePath}/codes/${dtc.code.toLowerCase()}`}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-amber-500/40 hover:bg-white/[0.06] transition-all group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono font-bold text-amber-400 group-hover:text-amber-300">
                      {dtc.code}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-600">
                      {dtc.system.length > 25 ? dtc.system.substring(0, 22) + '...' : dtc.system}
                    </span>
                  </div>
                  {dtc.title && dtc.title !== dtc.code && (
                    <p className="text-xs text-gray-400 leading-relaxed">{dtc.title}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Systems overview */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-2">Vehicle Systems</h2>
          <p className="text-gray-400 text-sm mb-6">
            Factory service manual content organized by system.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {data.systems.map((sys) => (
              <div
                key={sys.slug}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
              >
                <h3 className="font-semibold text-white mb-2">{sys.name}</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  {sys.procedureCount > 0 && (
                    <span className="text-cyan-400">{sys.procedureCount} procedures</span>
                  )}
                  {sys.diagramCount > 0 && (
                    <span className="text-violet-400">{sys.diagramCount} diagrams</span>
                  )}
                  {sys.dtcCount > 0 && (
                    <span className="text-amber-400">{sys.dtcCount} DTC entries</span>
                  )}
                  <span className="text-gray-500">{sys.totalCount} total</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cross-links to existing pages */}
        <section className="mb-12 border-t border-white/10 pt-8">
          <h2 className="text-lg font-bold text-white mb-4">More for your {displayName}</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/repair/${year}/${slugifyRoutePart(v.make)}/${slugifyRoutePart(v.model)}`}
              className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm hover:bg-cyan-500/20 transition"
            >
              DIY Repair Guides
            </Link>
            <Link
              href={`/manual/${encodeURIComponent(v.make)}/${year}`}
              className="px-4 py-2 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-300 text-sm hover:bg-slate-500/20 transition"
            >
              Browse Full Factory Manual
            </Link>
          </div>
        </section>
      </section>
    </div>
  );
}
