import type { Metadata } from 'next';
import Link from 'next/link';
import { VALID_TASKS } from '@/data/vehicles';
import { TIER_1_RESCUE_PAGES } from '@/data/rescuePriority';
import { Wrench } from 'lucide-react';

function toTitleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const COMMERCIAL_TASK_HUBS = [
  'battery-replacement',
  'alternator-replacement',
  'starter-replacement',
  'brake-pad-replacement',
  'serpentine-belt-replacement',
  'thermostat-replacement',
] as const;

export const metadata: Metadata = {
  title: 'DIY Auto Repair Guides by Category | SpotOnAuto',
  description: 'Browse all DIY car repair guides by repair type. Oil changes, brake pads, alternators, spark plugs, and 40+ more — step-by-step instructions for every vehicle.',
  alternates: {
    canonical: 'https://spotonauto.com/repairs',
  },
};

export default function RepairsIndexPage() {
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
      <p className="text-gray-400 mb-12 max-w-2xl">
        Choose a repair type below to find step-by-step instructions for your specific vehicle. Each guide includes tools needed, parts lists, safety warnings, and real factory service manual data.
      </p>

      <section className="mb-12">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Priority Repair Guides</h2>
            <p className="text-sm text-gray-400 mt-1">
              Exact repair pages that were already winning and now have the strongest vehicle-specific depth.
            </p>
          </div>
          <Link
            href="/repair/winners/sitemap.xml"
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Winner sitemap →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {TIER_1_RESCUE_PAGES.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 hover:border-cyan-400/50 hover:bg-cyan-500/10 transition-all group"
            >
              <p className="text-xs font-mono uppercase tracking-widest text-cyan-400/80 mb-2">
                Priority guide
              </p>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                {entry.year} {entry.make} {entry.model}
              </h3>
              <p className="text-sm text-gray-400 mt-1 capitalize">
                {toTitleCase(entry.task)}
              </p>
            </Link>
          ))}
        </div>
      </section>

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
              <h2 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors capitalize">
                {toTitleCase(task)}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">All makes & models</p>
            </div>
          </Link>
        ))}
      </div>

      <section className="mt-12 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6">
        <h2 className="text-xl font-bold text-white">High-intent repair category hubs</h2>
        <p className="text-sm text-gray-300 mt-2 mb-5 max-w-3xl">
          These category pages carry the strongest commercial intent and should receive the most internal links from homepage clusters,
          model pages, and related guides.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {COMMERCIAL_TASK_HUBS.map((task) => (
            <Link
              key={task}
              href={`/repairs/${task}`}
              className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-emerald-400/40 hover:bg-black/30 transition-all"
            >
              <h3 className="text-sm font-semibold text-white capitalize">{toTitleCase(task)} guides</h3>
              <p className="text-xs text-gray-400 mt-1">Browse battery, alternator, starter, brake, belt, and thermostat pages by vehicle.</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
