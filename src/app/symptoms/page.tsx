import type { Metadata } from 'next';
import Link from 'next/link';
import { SYMPTOM_CLUSTERS, buildSymptomHref } from '@/data/symptomGraph';

export const metadata: Metadata = {
  title: 'Symptom Hubs | SpotOnAuto',
  description: 'Browse graph-driven symptom hubs that map plain-English car complaints into repair categories, code lookups, and exact vehicle repair paths.',
  alternates: {
    canonical: 'https://spotonauto.com/symptoms',
  },
};

export default function SymptomsIndexPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-300">Symptoms</span>
      </nav>

      <p className="text-amber-300 text-xs uppercase tracking-[0.2em] font-bold mb-3">Knowledge Graph Entry Points</p>
      <h1 className="text-4xl font-display font-bold text-white mb-4">
        SpotOnAuto <span className="text-amber-400">Symptom Hubs</span>
      </h1>
      <p className="text-gray-300 max-w-3xl mb-8">
        Start from the symptom the way drivers actually describe it. These hubs normalize plain-English complaints into repair categories,
        trouble codes, and exact vehicle repair pages so the graph can route you to the shortest valid fix path.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {SYMPTOM_CLUSTERS.map((cluster) => (
          <Link
            key={cluster.slug}
            href={buildSymptomHref(cluster.slug)}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-amber-400/35 hover:bg-white/[0.05] transition-all"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80 mb-2">Symptom</p>
            <h2 className="text-xl font-semibold text-white">{cluster.label}</h2>
            <p className="text-sm text-gray-300 mt-3">{cluster.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {cluster.systems.slice(0, 3).map((system) => (
                <span
                  key={system}
                  className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-amber-200"
                >
                  {system}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
