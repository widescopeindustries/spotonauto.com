import type { Metadata } from 'next';
import Link from 'next/link';
import { TIER_1_RESCUE_PAGES } from '@/data/rescuePriority';
import { getHomepageMomentumData } from '@/lib/commandCenterOpportunities';
import { getHighValueSymptomHubs, getTier1RepairSupportGaps } from '@/lib/graphPriorityLinks';

export const metadata: Metadata = {
  title: 'Repair Hub | SpotOnAuto',
  description:
    'Start here to find trusted DIY repair guides by vehicle, symptom, and category. Explore brakes, batteries, lighting, filters, fluids, and exact repair walkthroughs.',
  alternates: {
    canonical: 'https://spotonauto.com/repair',
  },
};

function formatTaskLabel(task: string): string {
  return task
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

export default function RepairHubPage() {
  const prioritySymptomHubs = getHighValueSymptomHubs(6);
  const supportGapRepairs = getTier1RepairSupportGaps(6);
  const homepageMomentum = getHomepageMomentumData();

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
        Start with the kind of help you need: an exact vehicle hub, a common DIY job, a symptom page, or a vehicle-specific
        repair guide. This page is built to get you to the right instructions without extra category hopping.
      </p>

      <section className="mb-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/diagnose"
          className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-5 hover:border-cyan-400/50 hover:bg-cyan-500/15 transition-all"
        >
          <h2 className="text-lg font-bold text-white">Diagnose by symptom</h2>
          <p className="text-sm text-gray-300 mt-2">Start here when the car is acting up but you do not know which repair comes next.</p>
        </Link>
        <Link
          href="/symptoms"
          className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 hover:border-amber-400/45 hover:bg-amber-500/15 transition-all"
        >
          <h2 className="text-lg font-bold text-white">Browse symptom hubs</h2>
          <p className="text-sm text-gray-300 mt-2">Use plain-English complaint pages to narrow the problem before you pick parts or a repair.</p>
        </Link>
        <Link
          href="/repair"
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-cyan-500/40 hover:bg-white/[0.06] transition-all"
        >
          <h2 className="text-lg font-bold text-white">Browse repair categories</h2>
          <p className="text-sm text-gray-300 mt-2">Jump into batteries, brakes, filters, fluids, lighting, and other common repair categories.</p>
        </Link>
        <Link
          href="/parts"
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-cyan-500/40 hover:bg-white/[0.06] transition-all"
        >
          <h2 className="text-lg font-bold text-white">Compare parts</h2>
          <p className="text-sm text-gray-300 mt-2">Check fitment and price context before you order parts or start tearing down the vehicle.</p>
        </Link>
      </section>

      <section className="mb-10 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06] p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80 mb-2">Popular exact repair guides</p>
            <h2 className="text-xl font-bold text-white">Open a vehicle-specific guide right away</h2>
            <p className="text-sm text-gray-300 mt-1 max-w-3xl">
              These are quick starts into exact repair walkthroughs for real vehicles, with the parts, specs, and steps already narrowed down.
            </p>
          </div>
          <Link href="/repair" className="text-sm text-cyan-300 hover:text-cyan-200 transition-colors">
            Browse all repair categories →
          </Link>
        </div>
        <div className="flex flex-wrap gap-3">
          {homepageMomentum.popularRepairLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-gray-200 transition-all hover:border-cyan-400/35 hover:bg-black/30 hover:text-cyan-100"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-10 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06] p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80 mb-2">Popular DIY repairs</p>
            <h2 className="text-xl font-bold text-white">Start with the repairs drivers handle most often</h2>
            <p className="text-sm text-gray-300 mt-1 max-w-3xl">
              These common jobs are good entry points when you want a faster path into the right guide, vehicle, and parts list.
            </p>
          </div>
          <Link href="/repair" className="text-sm text-cyan-300 hover:text-cyan-200 transition-colors">
            Browse all repair categories →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5 lg:grid-cols-2">
          {homepageMomentum.clusters.map((cluster) => (
            <div
              key={cluster.cluster}
              className="rounded-xl border border-white/10 bg-black/20 p-4"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80 mb-2">{cluster.eyebrow}</p>
              <h3 className="text-base font-semibold text-white">{cluster.title}</h3>
              <p className="text-sm text-gray-300 mt-2">{cluster.description}</p>
              {cluster.links.length > 0 && (
                <div className="mt-4 space-y-2">
                  {cluster.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block rounded-lg border border-white/10 bg-slate-900/45 px-3 py-2 text-sm text-gray-200 transition-all hover:border-cyan-400/35 hover:bg-slate-900/70 hover:text-cyan-100"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Link href={cluster.href} className="text-sm font-medium text-cyan-200 hover:text-cyan-100 transition-colors">
                  {cluster.cta} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80 mb-2">Popular vehicle hubs</p>
            <h2 className="text-xl font-bold text-white">Start from an exact vehicle hub when you already know the car</h2>
            <p className="text-sm text-gray-300 mt-1 max-w-3xl">
              These hubs make it easier to move from one exact vehicle into the right repair guide, wiring page, symptom path, or code page without starting over.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3 md:grid-cols-2">
          {homepageMomentum.commandCenters.map((vehicle) => (
            <Link
              key={vehicle.href}
              href={vehicle.href}
              className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-emerald-400/35 hover:bg-black/30 transition-all"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80 mb-2">Exact vehicle hub</p>
              <h3 className="text-base font-semibold text-white">{vehicle.label}</h3>
              <p className="text-sm text-gray-300 mt-2">{vehicle.note}</p>
              <p className="text-sm text-emerald-200 mt-4">Open vehicle hub →</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-10 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">Diagnose from the symptom first</h2>
            <p className="text-sm text-gray-300 mt-1">
              When you know what the car is doing but not which part failed, these pages narrow the problem into the most likely repairs, code checks, and next steps.
            </p>
          </div>
          <Link href="/symptoms" className="text-sm text-amber-300 hover:text-amber-200 transition-colors">
            Browse all symptom hubs →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {prioritySymptomHubs.map((cluster) => (
            <Link
              key={cluster.href}
              href={cluster.href}
              className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-amber-400/35 hover:bg-black/30 transition-all"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80 mb-2">Symptom Cluster</p>
              <h3 className="text-base font-semibold text-white">{cluster.label}</h3>
              <p className="text-sm text-gray-300 mt-2">
                Open this page to connect a plain-English complaint to likely repairs, vehicle-specific guides, and follow-up checks.
              </p>
            </Link>
          ))}
        </div>
      </section>

      {supportGapRepairs.length > 0 && (
        <section className="mb-10 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-6">
          <h2 className="text-xl font-bold text-white mb-2">More exact repair walkthroughs</h2>
          <p className="text-sm text-gray-300 mb-5">
            These vehicle-specific repair guides are good next stops when you want a walkthrough for one car and one job instead of a broad category page.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {supportGapRepairs.map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-violet-400/40 hover:bg-black/30 transition-all"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80 mb-2">Exact Repair Guide</p>
                <h3 className="text-base font-semibold text-white">{entry.label}</h3>
                <p className="text-sm text-gray-300 mt-2">Open the full vehicle-specific walkthrough for this repair.</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6">
        <h2 className="text-xl font-bold text-white mb-2">More vehicle-specific repair guides</h2>
        <p className="text-sm text-gray-300 mb-5">
          Keep going with exact repair pages when you already know the vehicle and the job you want to tackle.
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
              <p className="text-xs text-gray-400 mt-1">{formatTaskLabel(entry.task)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
