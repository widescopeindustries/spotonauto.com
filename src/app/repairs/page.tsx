import type { Metadata } from 'next';
import Link from 'next/link';
import { VALID_TASKS } from '@/data/vehicles';
import { getHomepageMomentumData } from '@/lib/commandCenterOpportunities';
import { getTier1RepairSupportGaps, getTopUnderlinkedRepairPages } from '@/lib/graphPriorityLinks';
import { Wrench } from 'lucide-react';

function toTitleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export const metadata: Metadata = {
  title: 'DIY Auto Repair Guides by Category | SpotOnAuto',
  description:
    'Browse DIY car repair guides by category and vehicle. Start with brakes, batteries, lighting, filters, fluids, and exact step-by-step repair walkthroughs.',
  alternates: {
    canonical: 'https://spotonauto.com/repairs',
  },
};

export default function RepairsIndexPage() {
  const homepageMomentum = getHomepageMomentumData();
  const supportGapRepairs = getTier1RepairSupportGaps(6);
  const underlinkedRepairs = getTopUnderlinkedRepairPages(6);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-300">Repairs</span>
      </nav>

      <h1 className="text-4xl font-display font-bold text-white mb-4">
        DIY Repair Guides by <span className="text-cyan-400">Category</span>
      </h1>
      <p className="text-gray-400 mb-12 max-w-3xl">
        Start with a common repair category, then open the exact guide that matches your vehicle. This page is meant to move you from a broad job like brakes,
        batteries, filters, fluids, or lighting into the right year-make-model walkthrough without extra searching.
      </p>

      <section className="mb-12 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06] p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80 mb-2">Popular DIY repairs</p>
            <h2 className="text-xl font-bold text-white">Start with the categories drivers use most</h2>
            <p className="text-sm text-gray-300 mt-1 max-w-3xl">
              These common jobs are the fastest path into the right repair guide, parts list, and vehicle-specific steps.
            </p>
          </div>
          <Link
            href="/repair"
            className="text-sm text-cyan-300 hover:text-cyan-200 transition-colors"
          >
            Open repair hub →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-5">
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

      <section className="mb-12 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80 mb-2">Popular exact guides</p>
            <h2 className="text-xl font-bold text-white">Open a vehicle-specific repair guide right away</h2>
            <p className="text-sm text-gray-300 mt-1 max-w-3xl">
              These links jump straight into exact year-make-model repair pages when you already know the vehicle and job.
            </p>
          </div>
          <Link href="/repair" className="text-sm text-emerald-300 hover:text-emerald-200 transition-colors">
            Browse more exact repair guides →
          </Link>
        </div>
        <div className="flex flex-wrap gap-3">
          {homepageMomentum.popularRepairLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-gray-200 transition-all hover:border-emerald-400/35 hover:bg-black/30 hover:text-emerald-100"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-12 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-6">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80 mb-2">Popular vehicle hubs</p>
          <h2 className="text-xl font-bold text-white">Start from the vehicle when the category is still too broad</h2>
          <p className="text-sm text-gray-300 mt-1 max-w-3xl">
            These exact vehicle hubs help you move from one car into the right repair guide, wiring page, symptom path, or code page without backing up.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {homepageMomentum.commandCenters.map((vehicle) => (
            <Link
              key={vehicle.href}
              href={vehicle.href}
              className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-amber-400/35 hover:bg-black/30 transition-all"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80 mb-2">Exact vehicle hub</p>
              <h3 className="text-base font-semibold text-white">{vehicle.label}</h3>
              <p className="text-sm text-gray-300 mt-2">{vehicle.note}</p>
              <p className="text-sm text-amber-200 mt-4">Open vehicle hub →</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white">All repair categories</h2>
          <p className="text-sm text-gray-400 mt-1 max-w-3xl">
            Browse every repair category when you know the kind of job you want, but still need to choose the guide that matches your exact vehicle.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VALID_TASKS.map((task) => (
            <Link
              key={task}
              href={`/repairs/${task}`}
              className="flex items-center gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.06] transition-all group"
            >
              <div className="p-2.5 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                <Wrench className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors capitalize">
                  {toTitleCase(task)}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Browse by make, model, and year</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {supportGapRepairs.length > 0 && (
        <section className="mb-12 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">More exact repair walkthroughs</h2>
            <p className="text-sm text-gray-300 mt-1 max-w-3xl">
              These vehicle-specific guides are good next stops when you want a full walkthrough for one exact repair instead of a broad category page.
            </p>
          </div>
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

      {underlinkedRepairs.length > 0 && (
        <section className="mb-12 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-6">
          <h2 className="text-xl font-bold text-white">More vehicle-specific repair guides</h2>
          <p className="text-sm text-gray-300 mt-2 mb-5 max-w-3xl">
            Keep going with exact repair guides when you already know the vehicle and want a narrower page than a general repair category.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {underlinkedRepairs.map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-amber-400/40 hover:bg-black/30 transition-all"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80 mb-2">Exact Repair Guide</p>
                <h3 className="text-base font-semibold text-white">{entry.label}</h3>
                <p className="text-sm text-gray-300 mt-2">Open the full walkthrough for this exact repair page.</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
