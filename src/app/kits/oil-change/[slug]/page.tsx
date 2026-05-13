import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getKit, getAllKits } from '@/data/kits';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';
import { Check, Gift, Truck, Wrench, Package, ArrowRight, DollarSign } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllKits().map((k) => ({ slug: k.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const kit = getKit(slug);
  if (!kit) return { title: 'Kit Not Found' };
  return {
    title: `${kit.make} ${kit.model} Oil Change Kit | Manual's Curated Kits`,
    description: `Pre-assembled oil change kit for the ${kit.make} ${kit.model} (${kit.yearRange}). ${kit.oilSpec.viscosity}, ${kit.oilSpec.capacity}, filter, drain plug washer, and tools. OEM Exact and Smart Budget tiers.`,
  };
}

export default async function KitPage({ params }: PageProps) {
  const { slug } = await params;
  const kit = getKit(slug);
  if (!kit) notFound();

  const shopCost = Math.round(kit.pricing.oemExact * 3.5);
  const savingsBudget = shopCost - kit.pricing.smartBudget;
  const savingsOem = shopCost - kit.pricing.oemExact;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <section className="py-16 px-4 max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6">
          <a href="/kits" className="hover:text-cyan-400 transition-colors">Kits</a>
          <span className="mx-2">→</span>
          <span className="text-gray-400">Oil Change</span>
          <span className="mx-2">→</span>
          <span className="text-white">{kit.make} {kit.model}</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Package size={12} />
            Manual&apos;s Curated Kit
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3">
            {kit.make} {kit.model} Oil Change Kit
          </h1>
          <p className="text-lg text-gray-400">
            {kit.yearRange} · {kit.engineOptions.join(' · ')} · {kit.oilSpec.viscosity} · {kit.oilSpec.capacity}
          </p>
        </div>

        {/* Savings banner */}
        <div className="mb-10 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
            <DollarSign size={22} className="text-emerald-400" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-white font-semibold">
              Dealer charges ${shopCost}–${shopCost + 40} for this oil change.
            </p>
            <p className="text-sm text-gray-400">
              This kit has everything you need to do it yourself for{' '}
              <span className="text-emerald-400 font-bold">${kit.pricing.smartBudget}</span>.
              Save <span className="text-emerald-400 font-bold">${savingsBudget}+</span> every time.
            </p>
          </div>
        </div>

        {/* What's in the box */}
        <div className="mb-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Wrench size={20} className="text-cyan-400" />
            What Is in the Box
          </h2>
          <ul className="space-y-0 divide-y divide-white/5">
            {kit.items.map((item, i) => {
              const oemQuery = `${kit.make} ${kit.model} ${item.oemBrand}`;
              const budgetQuery = `${kit.make} ${kit.model} ${item.budgetBrand}`;
              const oemUrl = buildAmazonSearchUrl(oemQuery, 'automotive', `kit-${slug}-oem-${i}`);
              const budgetUrl = buildAmazonSearchUrl(budgetQuery, 'automotive', `kit-${slug}-budget-${i}`);

              return (
                <li key={i} className="flex items-start gap-4 py-4">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-xs font-bold text-gray-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="font-semibold text-white">{item.name}</span>
                      <span className="text-xs text-gray-500">{item.description}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <a
                        href={oemUrl}
                        target="_blank"
                        rel="sponsored noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        OEM: {item.oemBrand} →
                      </a>
                      <a
                        href={budgetUrl}
                        target="_blank"
                        rel="sponsored noopener noreferrer"
                        className="text-gray-500 hover:text-gray-400 transition-colors"
                      >
                        Budget: {item.budgetBrand} →
                      </a>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Pricing Tiers */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {/* Smart Budget */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Smart Budget</div>
            <div className="text-4xl font-bold text-white mb-1">${kit.pricing.smartBudget}</div>
            <div className="text-sm text-emerald-400 mb-4">Save ${savingsBudget} vs the dealer</div>
            <div className="text-sm text-gray-400 mb-4">Everything you need, quality aftermarket brands. Same protection, lower price.</div>
            <ul className="space-y-2 mb-6">
              {kit.items.slice(0, 4).map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  {item.name}
                </li>
              ))}
            </ul>
            <a
              href="#waitlist"
              className="block w-full text-center rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/20 transition-colors"
            >
              Join Waitlist — Smart Budget
            </a>
          </div>

          {/* OEM Exact */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-6 relative">
            <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-amber-500 text-black text-xs font-bold uppercase tracking-wider">
              Most Popular
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">OEM Exact</div>
            <div className="text-4xl font-bold text-white mb-1">${kit.pricing.oemExact}</div>
            <div className="text-sm text-amber-400 mb-4">Save ${savingsOem} vs the dealer</div>
            <div className="text-sm text-gray-400 mb-4">Manufacturer-recommended oil and filter. The exact same parts the dealer uses.</div>
            <ul className="space-y-2 mb-6">
              {kit.items.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <Check size={14} className="text-amber-400 shrink-0" />
                  {item.name} <span className="text-xs text-gray-500">({item.oemBrand})</span>
                </li>
              ))}
            </ul>
            <a
              href="#waitlist"
              className="block w-full text-center rounded-lg bg-amber-500 px-4 py-3 text-sm font-bold text-black hover:bg-amber-400 transition-colors"
            >
              Join Waitlist — OEM Exact
            </a>
          </div>
        </div>

        {/* Subscription */}
        <div id="waitlist" className="mb-12 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
              <Gift size={20} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">Year-Long Subscription — 4 Kits</h2>
              <p className="text-gray-300 text-sm mb-4">
                One kit every quarter, delivered to your door. Never run out, never forget, never go to the shop.
                The perfect gift for anyone who changes their own oil.
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="px-4 py-3 rounded-lg border border-white/10 bg-white/[0.04]">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">OEM Exact</div>
                  <div className="text-2xl font-bold text-white">${kit.pricing.subscriptionYearOem}<span className="text-sm font-normal text-gray-500">/year</span></div>
                  <div className="text-xs text-emerald-400 mt-1">Save ${(kit.pricing.oemExact * 4) - kit.pricing.subscriptionYearOem}</div>
                </div>
                <div className="px-4 py-3 rounded-lg border border-white/10 bg-white/[0.04]">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Smart Budget</div>
                  <div className="text-2xl font-bold text-white">${kit.pricing.subscriptionYearBudget}<span className="text-sm font-normal text-gray-500">/year</span></div>
                  <div className="text-xs text-emerald-400 mt-1">Save ${(kit.pricing.smartBudget * 4) - kit.pricing.subscriptionYearBudget}</div>
                </div>
              </div>

              {/* Waitlist form */}
              <form
                action="/api/waitlist"
                method="POST"
                className="flex flex-col sm:flex-row gap-3"
                data-track-submit={`{"event_name":"kit_waitlist_submit","event_category":"email_capture","kit_slug":"${slug}","vehicle":"${kit.make} ${kit.model}"}`}
              >
                <input type="hidden" name="kitSlug" value={kit.slug} />
                <input type="hidden" name="vehicle" value={`${kit.make} ${kit.model}`} />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Enter your email for early access"
                  className="flex-1 rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-500 px-6 py-3 text-sm font-bold text-black hover:bg-cyan-400 transition-colors"
                >
                  Get Early Access
                </button>
              </form>
              <p className="mt-3 text-xs text-gray-500">
                <Truck size={12} className="inline mr-1" />
                We are launching soon. Join the waitlist and be first in line. No spam, ever.
              </p>
            </div>
          </div>
        </div>

        {/* Spec verification */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Factory Spec Verification</h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Oil Viscosity</span>
              <div className="text-white font-mono">{kit.oilSpec.viscosity}</div>
            </div>
            <div>
              <span className="text-gray-500">Capacity</span>
              <div className="text-white font-mono">{kit.oilSpec.capacity}</div>
            </div>
            <div>
              <span className="text-gray-500">Type</span>
              <div className="text-white font-mono">{kit.oilSpec.type}</div>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Specs extracted directly from the factory service manual. Always verify against your owner manual if your vehicle has multiple engine options.
          </p>
        </div>
      </section>
    </div>
  );
}
