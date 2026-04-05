import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getVehicleDtcFlow } from '@/lib/vehicleLane';
import { fetchContentByHash } from '@/lib/charmContent';
import { slugifyRoutePart } from '@/data/vehicles';

export const revalidate = 21600; // 6 hour ISR

interface PageProps {
  params: Promise<{ year: string; make: string; model: string; code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year, make, model, code } = await params;
  const upperCode = code.toUpperCase();
  const displayMake = decodeURIComponent(make);
  const displayModel = decodeURIComponent(model);
  const title = `${upperCode} on ${year} ${displayMake} ${displayModel} — OEM Diagnostic Flow | SpotOn Auto`;
  const description = `Factory diagnostic procedure for code ${upperCode} on the ${year} ${displayMake} ${displayModel}. Step-by-step flowchart from the OEM service manual with diagrams and test procedures.`;
  const pageUrl = `https://spotonauto.com/vehicles/${year}/${make}/${model}/codes/${code}`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'article', url: pageUrl },
    alternates: { canonical: pageUrl },
  };
}

export default async function VehicleDtcFlowPage({ params }: PageProps) {
  const { year, make, model, code } = await params;
  const yearNum = parseInt(year, 10);
  if (isNaN(yearNum)) notFound();

  const flow = await getVehicleDtcFlow(make, yearNum, model, code);
  if (!flow) notFound();

  const v = flow.vehicle;
  const displayName = `${v.year} ${v.make} ${v.model}`;
  const vehiclePath = `/vehicles/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}`;

  // Fetch the primary diagnostic flow content
  const flowPages = await Promise.all(
    flow.flowHashes.slice(0, 3).map((hash) => fetchContentByHash(hash)),
  );
  const availablePages = flowPages.filter((p) => p.status === 200 && p.html);

  // Categorize related content for contextual graph links
  const diagrams = flow.relatedByType.diagram?.slice(0, 12) ?? [];
  const procedures = flow.relatedByType.procedure?.slice(0, 8) ?? [];
  const locations = flow.relatedByType.location?.slice(0, 8) ?? [];
  const fuseRelays = flow.relatedByType['fuse-relay']?.slice(0, 6) ?? [];
  const specs = flow.relatedByType.specification?.slice(0, 6) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <section className="py-12 px-4 max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap">
          <Link href="/" className="hover:text-cyan-400 transition">Home</Link>
          <span>/</span>
          <Link href={vehiclePath} className="hover:text-cyan-400 transition">{displayName}</Link>
          <span>/</span>
          <Link href={`${vehiclePath}#codes`} className="hover:text-cyan-400 transition">Codes</Link>
          <span>/</span>
          <span className="text-amber-400 font-mono">{flow.code}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold">
              <span className="text-amber-400 font-mono">{flow.code}</span>
            </h1>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
              OEM Diagnostic Flow
            </span>
          </div>
          <p className="text-gray-400">
            Factory service manual diagnostic procedure for <strong className="text-white">{displayName}</strong>
          </p>
        </div>

        {/* OEM Diagnostic Flow Content */}
        {availablePages.length > 0 ? (
          <div className="mb-10 space-y-6">
            {availablePages.map((page, i) => (
              <article
                key={i}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8 overflow-x-auto"
              >
                {page.title && (
                  <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-3">
                    {page.title}
                  </h2>
                )}
                <div
                  className="prose prose-invert prose-sm max-w-none
                    [&_img]:rounded-lg [&_img]:border [&_img]:border-white/10
                    [&_table]:text-xs [&_table]:border-collapse
                    [&_td]:border [&_td]:border-white/10 [&_td]:px-2 [&_td]:py-1
                    [&_th]:border [&_th]:border-white/10 [&_th]:px-2 [&_th]:py-1 [&_th]:bg-white/5
                    [&_a]:text-cyan-400 [&_a]:no-underline hover:[&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: page.html }}
                />
              </article>
            ))}
          </div>
        ) : (
          <div className="mb-10 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
            <p className="text-amber-200 mb-3">
              The diagnostic flow content for {flow.code} on this vehicle is being processed.
            </p>
            <Link
              href={`/manual/${encodeURIComponent(v.make)}/${v.year}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-black text-sm font-bold rounded-lg hover:bg-amber-400 transition"
            >
              Browse Factory Manual for {displayName} →
            </Link>
          </div>
        )}

        {/* Supporting Material — contextual graph links */}
        {(diagrams.length > 0 || locations.length > 0 || fuseRelays.length > 0) && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-white mb-4">Supporting Diagrams & Locations</h2>
            <p className="text-gray-400 text-sm mb-4">
              Reference material from the factory manual for this diagnostic procedure.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              {diagrams.slice(0, 6).map((d) => (
                <div
                  key={d.hash}
                  className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-violet-400 font-bold">Diagram</span>
                  </div>
                  <p className="text-sm text-gray-300">{d.title || 'Wiring/System Diagram'}</p>
                </div>
              ))}
              {locations.slice(0, 4).map((l) => (
                <div
                  key={l.hash}
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Location</span>
                  </div>
                  <p className="text-sm text-gray-300">{l.title || 'Component Location'}</p>
                </div>
              ))}
              {fuseRelays.slice(0, 4).map((f) => (
                <div
                  key={f.hash}
                  className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Fuse/Relay</span>
                  </div>
                  <p className="text-sm text-gray-300">{f.title || 'Fuse & Relay Info'}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related procedures */}
        {procedures.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-white mb-4">Related Procedures</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {procedures.slice(0, 6).map((p) => (
                <div
                  key={p.hash}
                  className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">Procedure</span>
                  </div>
                  <p className="text-sm text-gray-300">{p.title || 'Service Procedure'}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Navigation */}
        <div className="flex flex-wrap gap-3 border-t border-white/10 pt-8">
          <Link
            href={vehiclePath}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 transition"
          >
            ← Back to {displayName}
          </Link>
          <Link
            href={`/codes/${flow.code.toLowerCase()}`}
            className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm hover:bg-amber-500/20 transition"
          >
            General {flow.code} Info
          </Link>
          <Link
            href={`/repair/${year}/${slugifyRoutePart(v.make)}/${slugifyRoutePart(v.model)}`}
            className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm hover:bg-cyan-500/20 transition"
          >
            DIY Repair Guides
          </Link>
        </div>
      </section>
    </div>
  );
}
