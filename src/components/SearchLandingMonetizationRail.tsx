import AffiliateLink from '@/components/AffiliateLink';
import { PricingTrackedLink } from '@/components/PricingTracking';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';

type MonetizationIntent = 'diagnostic' | 'repair' | 'manual' | 'maintenance';

type MonetizationSurface =
  | 'codes_index'
  | 'symptoms_index'
  | 'symptom_hub'
  | 'manual_index'
  | 'manual_page'
  | 'repair_hub'
  | 'guides_index'
  | 'guides_make'
  | 'guides_model';

interface SearchLandingMonetizationRailProps {
  surface: MonetizationSurface;
  intent: MonetizationIntent;
  contextLabel?: string;
  className?: string;
}

const INTENT_COPY: Record<MonetizationIntent, { title: string; description: string; affiliateCta: string }> = {
  diagnostic: {
    title: 'Turn This Into a Confident Next Step',
    description: 'Verify the likely fault first, then compare a quote before you approve expensive work.',
    affiliateCta: 'Shop Diagnostic Tools',
  },
  repair: {
    title: 'Get the Right Tools Before You Start',
    description: 'Avoid mid-job delays by checking fitment and tool compatibility before teardown.',
    affiliateCta: 'Shop Repair Essentials',
  },
  manual: {
    title: 'Use the Manual With the Right Hardware',
    description: 'Pair factory procedures with proven DIY tools so the instructions are easier to execute.',
    affiliateCta: 'Shop Manual-Ready Tools',
  },
  maintenance: {
    title: 'Plan the Job and Parts in One Place',
    description: 'Bundle common maintenance tools and quote-check support so you can decide faster.',
    affiliateCta: 'Shop Maintenance Tools',
  },
};

function buildOfferQuery(intent: MonetizationIntent, contextLabel?: string): string {
  const context = contextLabel?.trim();
  if (intent === 'diagnostic') return context ? `${context} OBD2 scanner` : 'best OBD2 scanner automotive';
  if (intent === 'manual') return context ? `${context} multimeter torque wrench` : 'automotive multimeter torque wrench kit';
  if (intent === 'maintenance') return context ? `${context} oil filter wrench socket set` : 'oil filter wrench socket set automotive';
  return context ? `${context} repair tools` : 'automotive repair tool kit';
}

export default function SearchLandingMonetizationRail({
  surface,
  intent,
  contextLabel,
  className,
}: SearchLandingMonetizationRailProps) {
  const copy = INTENT_COPY[intent];
  const query = buildOfferQuery(intent, contextLabel);
  const subtag = `landing-${surface}-${intent}`;
  const vehicleName = contextLabel || 'SpotOnAuto';
  const wrapperClassName =
    className || 'my-10 rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-6 md:p-8';

  return (
    <section className={wrapperClassName}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
          Revenue Rail
        </span>
        <span className="text-xs uppercase tracking-[0.16em] text-gray-400">
          Intent: {intent}
        </span>
      </div>

      <h2 className="mt-4 text-2xl font-bold text-white">{copy.title}</h2>
      <p className="mt-3 text-sm leading-6 text-gray-300">{copy.description}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-emerald-100/80">
        Affiliate disclosure: We may earn a commission at no extra cost to you.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <AffiliateLink
          href={buildAmazonSearchUrl(query, 'automotive', subtag)}
          partName={`${intent}-tooling`}
          vehicle={vehicleName}
          pageType="parts_page"
          subtag={subtag}
          className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-400"
        >
          {copy.affiliateCta}
        </AffiliateLink>
        <PricingTrackedLink
          href="/second-opinion"
          target="starter_free"
          label={`${surface}_${intent}_free_quote`}
          className="inline-flex items-center justify-center rounded-lg bg-cyan-300 px-4 py-2 text-sm font-bold text-black transition hover:bg-cyan-200"
        >
          Free Quote Check
        </PricingTrackedLink>
        <PricingTrackedLink
          href="/pricing"
          target="pro_waitlist"
          label={`${surface}_${intent}_pro_offer`}
          className="inline-flex items-center justify-center rounded-lg border border-cyan-200/40 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-100 hover:text-white"
        >
          Quote Shield Pro
        </PricingTrackedLink>
      </div>
    </section>
  );
}
