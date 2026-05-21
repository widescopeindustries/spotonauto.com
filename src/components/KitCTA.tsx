import Link from 'next/link';
import { findKitForVehicle } from '@/data/kits';
import { Package, Gift, ArrowRight } from 'lucide-react';

interface Props {
  make: string;
  model: string;
}

export default function KitCTA({ make, model }: Props) {
  const kit = findKitForVehicle(make, model);
  if (!kit) return null;

  return (
    <div className="mb-8 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.03] p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
              Manual&apos;s Curated Kit
            </span>
          </div>
          <h3 className="text-lg font-bold text-white">
            Skip the parts hunt. Get the kit.
          </h3>
          <p className="mt-1 text-sm text-gray-300">
            Everything in one box: {kit.oilSpec.viscosity} oil, filter, drain plug washer, shop rags, and tools.
            OEM Exact (${kit.pricing.oemExact}) or Smart Budget (${kit.pricing.smartBudget}).
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Link
            href={`/kits/oil-change/${kit.slug}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-amber-400 transition-colors"
          >
            <Package size={14} />
            Get the Kit
            <ArrowRight size={14} />
          </Link>
          <Link
            href={`/kits/oil-change/${kit.slug}#waitlist`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 px-5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/10 transition-colors"
          >
            <Gift size={12} />
            Gift Subscription
          </Link>
        </div>
      </div>
    </div>
  );
}
