import { Metadata } from 'next';
import Link from 'next/link';
import { getAllKits } from '@/data/kits';

export const metadata: Metadata = {
  title: "Manual's Oil Change Kits | Curated for Your Exact Vehicle",
  description: 'Pre-assembled oil change kits with the exact oil, filter, drain plug washer, and tools for your car. OEM Exact and Smart Budget tiers. Subscribe and never go to the shop again.',
};

export default function KitsPage() {
  const kits = getAllKits();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Hero */}
      <section className="py-20 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm font-semibold uppercase tracking-wider mb-6">
          🎁 Perfect Gift for Car People
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Manual's Oil Change Kits
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-4">
          The exact oil, filter, drain plug washer, and tools for your car —
          curated from the factory service manual. No more guessing. No more extra trips.
        </p>
        <p className="text-lg text-amber-400 max-w-xl mx-auto">
          Give the gift of never going to the shop again.
        </p>
      </section>

      {/* How it works */}
      <section className="py-12 px-4 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="text-3xl mb-3">📋</div>
            <h3 className="font-bold text-white mb-2">Pick Your Car</h3>
            <p className="text-sm text-gray-400">We match the exact spec from the factory manual.</p>
          </div>
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="text-3xl mb-3">📦</div>
            <h3 className="font-bold text-white mb-2">Get the Kit</h3>
            <p className="text-sm text-gray-400">Everything in one box. OEM Exact or Smart Budget.</p>
          </div>
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="text-3xl mb-3">🔧</div>
            <h3 className="font-bold text-white mb-2">Change It Yourself</h3>
            <p className="text-sm text-gray-400">Or hand it to your mechanic and save on parts markup.</p>
          </div>
        </div>
      </section>

      {/* Subscription pitch */}
      <section className="py-12 px-4 max-w-3xl mx-auto text-center">
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-8">
          <h2 className="text-2xl font-bold text-white mb-3">
            Year-Long Subscription
          </h2>
          <p className="text-gray-300 mb-6">
            4 kits delivered throughout the year — once per quarter, right when you need it.
            Wives: this is the Christmas gift that keeps his hands clean and his wallet full.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="px-5 py-3 rounded-lg border border-white/10 bg-white/[0.04]">
              <div className="text-xs uppercase tracking-wider text-gray-500">OEM Exact</div>
              <div className="text-2xl font-bold text-white">$299<span className="text-sm font-normal text-gray-500">/year</span></div>
            </div>
            <div className="px-5 py-3 rounded-lg border border-white/10 bg-white/[0.04]">
              <div className="text-xs uppercase tracking-wider text-gray-500">Smart Budget</div>
              <div className="text-2xl font-bold text-white">$199<span className="text-sm font-normal text-gray-500">/year</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Available kits */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Available Kits</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kits.map((kit) => (
            <Link
              key={kit.slug}
              href={`/kits/oil-change/${kit.slug}`}
              className="group p-6 rounded-xl border border-white/10 bg-white/[0.03] hover:border-amber-500/30 hover:bg-white/[0.05] transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500/60 group-hover:text-amber-500 transition-colors">
                  Oil Change Kit
                </span>
                <span className="text-xs text-gray-500">{kit.yearRange}</span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                {kit.make} {kit.model}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {kit.oilSpec.viscosity} · {kit.oilSpec.capacity} · {kit.engineOptions.join(', ')}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">From ${kit.pricing.smartBudget}</span>
                <span className="text-sm font-semibold text-cyan-400 group-hover:text-cyan-300 transition-colors">
                  View Kit →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust / FAQ */}
      <section className="py-12 px-4 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-6">Common Questions</h2>
        <dl className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <dt className="font-semibold text-white">How do you know the exact spec?</dt>
            <dd className="mt-2 text-sm text-gray-400">Every kit is built from the factory service manual for that exact year, make, model, and engine. Not guesswork.</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <dt className="font-semibold text-white">What if I have the wrong engine?</dt>
            <dd className="mt-2 text-sm text-gray-400">Each kit page shows which engines it covers. If your engine is not listed, the spec may differ — check your manual or contact us.</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <dt className="font-semibold text-white">Can I send this as a gift?</dt>
            <dd className="mt-2 text-sm text-gray-400">Absolutely. The year subscription is designed to be gifted. We will include a gift note and ship each kit to their door.</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <dt className="font-semibold text-white">What is the difference between OEM Exact and Smart Budget?</dt>
            <dd className="mt-2 text-sm text-gray-400">OEM Exact uses the manufacturer-recommended oil and filter brand. Smart Budget uses a quality aftermarket equivalent that meets the same spec — same protection, lower price.</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
