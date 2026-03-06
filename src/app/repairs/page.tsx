import type { Metadata } from 'next';
import Link from 'next/link';
import { VALID_TASKS } from '@/data/vehicles';
import { Wrench } from 'lucide-react';

function toTitleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

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
    </div>
  );
}
