import AffiliateLink from '@/components/AffiliateLink';
import { PricingTrackedLink } from '@/components/PricingTracking';
import type { ToolPage } from '@/data/tools-pages';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';
import { buildToolIntentOffers, getToolSpecHighlights } from '@/lib/toolIntentOffers';

interface ToolIntentCommerceProps {
  page: ToolPage;
}

export default function ToolIntentCommerce({ page }: ToolIntentCommerceProps) {
  const offers = buildToolIntentOffers(page);
  if (offers.length === 0) return null;

  const vehicleName = `${page.make} ${page.model}`;
  const highlights = getToolSpecHighlights(page, 3);
  const subtag = `tool-intent-${page.toolType}`;

  return (
    <section className="mb-12 rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
          Ready to Buy
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
          Fitment-first picks for {vehicleName}
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="text-2xl font-bold text-white">Buy Parts and Tools for This Job</h2>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            These links are built from the same specs shown on this page so users can move from lookup to purchase faster.
            Confirm exact engine and trim if your vehicle has multiple variants.
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-emerald-200/80">
            Affiliate disclosure: We may earn a commission at no extra cost to you.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">Spec Snapshot</h3>
          <dl className="mt-3 space-y-2">
            {highlights.map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                <dt className="text-xs uppercase tracking-[0.14em] text-gray-400">{item.label}</dt>
                <dd className="mt-1 text-sm text-white">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {offers.map((offer) => {
          const href = buildAmazonSearchUrl(offer.query, 'automotive', subtag);
          return (
            <article key={offer.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <h3 className="text-base font-semibold text-white">{offer.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-300">{offer.description}</p>
              <p className="mt-3 text-xs leading-5 text-emerald-100/80">{offer.reason}</p>
              <AffiliateLink
                href={href}
                partName={offer.title}
                vehicle={vehicleName}
                pageType="parts_page"
                subtag={subtag}
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-400"
              >
                Check Price and Fitment
              </AffiliateLink>
            </article>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-cyan-400/25 bg-cyan-500/[0.08] p-4">
        <h3 className="text-base font-semibold text-cyan-100">Before you buy, sanity-check the repair quote</h3>
        <p className="mt-2 text-sm text-cyan-50/85">
          If your shop quote looks high, run it through Quote Shield to catch overpricing before checkout.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <PricingTrackedLink
            href="/second-opinion"
            target="starter_free"
            label={`tools_${page.toolType}_quote_check`}
            className="inline-flex items-center justify-center rounded-lg bg-cyan-300 px-4 py-2 text-sm font-bold text-black transition hover:bg-cyan-200"
          >
            Free Quote Check
          </PricingTrackedLink>
          <PricingTrackedLink
            href="/pricing"
            target="pro_waitlist"
            label={`tools_${page.toolType}_quote_pro`}
            className="inline-flex items-center justify-center rounded-lg border border-cyan-200/40 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-100 hover:text-white"
          >
            Quote Shield Pro
          </PricingTrackedLink>
        </div>
      </div>
    </section>
  );
}
