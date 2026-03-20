import type { Metadata } from 'next';
import Link from 'next/link';
import { TIER_1_RESCUE_PAGES } from '@/data/rescuePriority';
import { SYMPTOM_CLUSTERS, buildSymptomHref } from '@/data/symptomGraph';

export const metadata: Metadata = {
  title: 'Repair Hub | SpotOnAuto',
  description:
    'Start here to find trusted DIY repair guides by symptom, category, and vehicle. Access battery, alternator, starter, brake, belt, and thermostat repair flows.',
  alternates: {
    canonical: 'https://spotonauto.com/repair',
  },
};

export default function RepairHubPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-300">Repair</span>
      </nav>

      <h1 className="text-4xl font-display font-bold text-white mb-4">
        SpotOnAuto <span className="text-cyan-400">Repair Hub</span>
      </h1>
      <p className="text-gray-400 mb-8 max-w-3xl">
        Use this hub to move from symptom to exact repair page quickly. Start with diagnosis if you are unsure,
        then jump to high-intent repair categories and vehicle-specific guides.
      </p>

      <section className="mb-10 grid gap-4 md:grid-cols-3">
        <Link
          href="/diagnose"
          className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-5 hover:border-cyan-400/50 hover:bg-cyan-500/15 transition-all"
        >
          <h2 className="text-lg font-bold text-white">Diagnose by symptom</h2>
          <p className="text-sm text-gray-300 mt-2">Best first step when you know the symptom but not the exact repair yet.</p>
        </Link>
        <Link
          href="/symptoms"
          className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 hover:border-amber-400/45 hover:bg-amber-500/15 transition-all"
        >
          <h2 className="text-lg font-bold text-white">Browse symptom hubs</h2>
          <p className="text-sm text-gray-300 mt-2">Open canonical symptom clusters that map complaints into repair categories, codes, and exact vehicle pages.</p>
        </Link>
        <Link
          href="/repairs"
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-cyan-500/40 hover:bg-white/[0.06] transition-all"
        >
          <h2 className="text-lg font-bold text-white">Browse repair categories</h2>
          <p className="text-sm text-gray-300 mt-2">Open category hubs for battery, alternator, starter, brake, belt, and thermostat pages.</p>
        </Link>
        <Link
          href="/parts"
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-cyan-500/40 hover:bg-white/[0.06] transition-all"
        >
          <h2 className="text-lg font-bold text-white">Compare parts</h2>
          <p className="text-sm text-gray-300 mt-2">Check fitment and pricing context before tearing down the vehicle.</p>
        </Link>
      </section>

      <section className="mb-10 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">Symptom hubs</h2>
            <p className="text-sm text-gray-300 mt-1">
              These graph-driven symptom pages bridge plain-English complaints into repair categories, code lookups, and exact vehicle workflows.
            </p>
          </div>
          <Link href="/symptoms" className="text-sm text-amber-300 hover:text-amber-200 transition-colors">
            Browse all symptom hubs →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {SYMPTOM_CLUSTERS.slice(0, 6).map((cluster) => (
            <Link
              key={cluster.slug}
              href={buildSymptomHref(cluster.slug)}
              className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-amber-400/35 hover:bg-black/30 transition-all"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80 mb-2">Symptom Cluster</p>
              <h3 className="text-base font-semibold text-white">{cluster.label}</h3>
              <p className="text-sm text-gray-300 mt-2">{cluster.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6">
        <h2 className="text-xl font-bold text-white mb-2">Priority repair pages</h2>
        <p className="text-sm text-gray-300 mb-5">
          These pages are high-priority recovery targets and should stay heavily linked from hub surfaces.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {TIER_1_RESCUE_PAGES.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-emerald-400/40 hover:bg-black/30 transition-all"
            >
              <h3 className="text-base font-semibold text-white">
                {entry.year} {entry.make} {entry.model}
              </h3>
              <p className="text-xs text-gray-400 mt-1 capitalize">{entry.task.replace(/-/g, ' ')}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
