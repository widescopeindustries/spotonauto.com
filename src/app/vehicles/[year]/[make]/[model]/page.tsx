import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildVehicleLaneData } from '@/lib/vehicleLane';
import { slugifyRoutePart } from '@/data/vehicles';
import VehicleLaneClient from './VehicleLaneClient';

interface PageProps {
  params: Promise<{ year: string; make: string; model: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year, make, model } = await params;
  const dm = decodeURIComponent(make);
  const dmo = decodeURIComponent(model);
  const title = `${year} ${dm} ${dmo} — Factory Diagnostics & Service Data | SpotOn Auto`;
  const description = `OEM diagnostic flowcharts, trouble codes, wiring diagrams, and repair procedures for the ${year} ${dm} ${dmo} — straight from the factory service manual.`;
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
          <span className="text-white">{displayName}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-1">{displayName}</h1>
          <p className="text-gray-500 text-sm">{v.variant}</p>
        </div>

        {/* Two-path entry + code browser + systems — all client-side interactive */}
        <VehicleLaneClient
          displayName={displayName}
          basePath={basePath}
          diagnosePath={`/diagnose?year=${year}&make=${encodeURIComponent(v.make)}&model=${encodeURIComponent(v.model)}`}
          dtcCodes={data.dtcCodes.map((d) => ({
            code: d.code,
            title: d.title,
            system: d.system,
          }))}
          systems={data.systems.map((s) => ({
            name: s.name,
            slug: s.slug,
            dtcCount: s.dtcCount,
            procedureCount: s.procedureCount,
            diagramCount: s.diagramCount,
            totalCount: s.totalCount,
          }))}
        />

        {/* Cross-links */}
        <div className="flex flex-wrap gap-3 border-t border-white/10 pt-8">
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
    </div>
  );
}
