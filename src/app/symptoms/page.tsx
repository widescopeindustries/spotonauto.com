import type { Metadata } from 'next';
import Link from 'next/link';
import { SYMPTOM_CLUSTERS, buildSymptomHref } from '@/data/symptomGraph';
import { getHighValueSymptomHubs, getTier1RepairSupportGaps, getTopOrphanSymptoms } from '@/lib/graphPriorityLinks';

export const metadata: Metadata = {
  title: 'Symptom Hubs | SpotOnAuto',
  description: 'Browse graph-driven symptom hubs that map plain-English car complaints into repair categories, code lookups, and exact vehicle repair paths.',
  alternates: {
    canonical: 'https://spotonauto.com/symptoms',
  },
};

export default function SymptomsIndexPage() {
  const prioritySymptomHubs = getHighValueSymptomHubs(6);
  const orphanSymptoms = getTopOrphanSymptoms(4);
  const supportGapRepairs = getTier1RepairSupportGaps(6);

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
        Describe what your car is doing — we'll help you figure out what's wrong and which repair you need.
      </p>

      {prioritySymptomHubs.length > 0 && (
        <section className="mb-10 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-6">
          <h2 className="text-xl font-bold text-white mb-2">Common Symptoms</h2>
          <p className="text-sm text-gray-300 mb-5">
            The most common car problems drivers search for right now.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {prioritySymptomHubs.map((cluster) => (
              <Link
                key={cluster.href}
                href={cluster.href}
                className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-amber-400/35 hover:bg-black/30 transition-all"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80 mb-2">Common symptom</p>
                <h3 className="text-base font-semibold text-white">{cluster.label}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {supportGapRepairs.length > 0 && (
        <section className="mb-10 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-6">
          <h2 className="text-xl font-bold text-white mb-2">Related Repair Guides</h2>
          <p className="text-sm text-gray-300 mb-5">
            Vehicle-specific repair guides connected to these symptoms.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {supportGapRepairs.map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-violet-400/40 hover:bg-black/30 transition-all"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80 mb-2">Repair guide</p>
                <h3 className="text-base font-semibold text-white">{entry.label}</h3>
                <p className="text-xs text-gray-400 mt-2">{entry.action}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

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

      {orphanSymptoms.length > 0 && (
        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold text-white mb-2">More Symptoms</h2>
          <p className="text-sm text-gray-300 mb-5">
            Additional symptom pages you might find helpful.
          </p>
          <div className="flex flex-wrap gap-3">
            {orphanSymptoms.map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-gray-200 hover:border-amber-400/35 hover:text-white transition-all"
              >
                {entry.label}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
