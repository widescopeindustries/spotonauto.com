import AffiliateLink from '@/components/AffiliateLink';
import { PricingTrackedLink } from '@/components/PricingTracking';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';

type MonetizationIntent = 'diagnostic' | 'repair' | 'manual' | 'maintenance';

type MonetizationSurface =
  | 'home_index'
  | 'codes_index'
  | 'diagnose_page'
  | 'manual_navigator'
  | 'symptoms_index'
  | 'symptom_hub'
  | 'manual_index'
  | 'manual_page'
  | 'tools_index'
  | 'repair_hub'
  | 'wiring_page'
  | 'guides_index'
  | 'guides_make'
  | 'guides_model';

interface SearchLandingMonetizationRailProps {
  surface: MonetizationSurface;
  intent: MonetizationIntent;
  contextLabel?: string;
  className?: string;
}

type SupportingOffer = {
  title: string;
  description: string;
  reason: string;
  query: string;
};

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

function buildSupportingOffers(intent: MonetizationIntent, contextLabel?: string): SupportingOffer[] {
  const context = contextLabel?.trim() || 'SpotOnAuto';

  switch (intent) {
    case 'diagnostic':
      return [
        {
          title: 'OBD2 scanner',
          description: 'Read codes and freeze-frame data before you guess at the fault.',
          reason: 'Most diagnostic jobs start with a scan tool and a verified code path.',
          query: `${context} OBD2 scanner`,
        },
        {
          title: 'Battery tester',
          description: 'Check cranking and charging health before replacing expensive parts.',
          reason: 'A weak battery can mimic alternator or starter problems.',
          query: `${context} battery tester`,
        },
        {
          title: 'Multimeter kit',
          description: 'Confirm voltage, continuity, and sensor power with one simple kit.',
          reason: 'A meter is the cheapest way to rule out a bad circuit fast.',
          query: `${context} multimeter automotive`,
        },
      ];
    case 'manual':
      return [
        {
          title: 'Torque wrench',
          description: 'Use the factory procedure with the right tightening tool.',
          reason: 'Manual-based work becomes much easier when you can torque correctly.',
          query: `${context} torque wrench automotive`,
        },
        {
          title: 'Trim tool set',
          description: 'Useful for clips, covers, and trim pieces called out by the manual.',
          reason: 'Most manual procedures assume you have a good trim removal kit.',
          query: `${context} trim tool set`,
        },
        {
          title: 'Multimeter kit',
          description: 'Great for electrical troubleshooting and manual-tested circuits.',
          reason: 'Electrical work in manuals often needs a meter more than another wrench.',
          query: `${context} multimeter automotive`,
        },
      ];
    case 'maintenance':
      return [
        {
          title: 'Drain pan and funnel',
          description: 'Keep oil and fluid services clean from the first drain to the refill.',
          reason: 'These are the most-used consumable tools on maintenance pages.',
          query: `${context} drain pan funnel`,
        },
        {
          title: 'Oil filter wrench',
          description: 'Match the wrench to the job before the filter gets stuck.',
          reason: 'A better filter wrench prevents frustration and stripped housings.',
          query: `${context} oil filter wrench`,
        },
        {
          title: 'Shop towels',
          description: 'Cleanup gear for spills, dipsticks, and filter surfaces.',
          reason: 'Small maintenance jobs go smoother with the right cleanup supplies.',
          query: `${context} shop towels automotive`,
        },
      ];
    case 'repair':
    default:
      return [
        {
          title: 'Breaker bar',
          description: 'Extra leverage for tight bolts and stubborn fasteners.',
          reason: 'Repair pages turn into purchases when the right leverage tool is obvious.',
          query: `${context} breaker bar automotive`,
        },
        {
          title: 'Shop towels',
          description: 'Keep hands, pulleys, and work areas clean during teardown.',
          reason: 'Small cleanup items are easy add-ons and often bought with the repair part.',
          query: `${context} shop towels automotive`,
        },
        {
          title: 'Nitrile gloves',
          description: 'Protect your hands while handling fluids and greasy hardware.',
          reason: 'Consumable protection gear is a low-friction cart addition.',
          query: `${context} nitrile gloves automotive`,
        },
      ];
  }
}

export default function SearchLandingMonetizationRail({
  surface,
  intent,
  contextLabel,
  className,
}: SearchLandingMonetizationRailProps) {
  const copy = INTENT_COPY[intent];
  const query = buildOfferQuery(intent, contextLabel);
  const supportingOffers = buildSupportingOffers(intent, contextLabel);
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

      <div className="mt-6">
        <p className="text-xs uppercase tracking-[0.16em] text-emerald-100/80">
          More supporting gear
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {supportingOffers.map((offer) => (
            <AffiliateLink
              key={offer.title}
              href={buildAmazonSearchUrl(offer.query, 'automotive', `${subtag}-support`)}
              partName={offer.title}
              vehicle={vehicleName}
              pageType="parts_page"
              subtag={`${subtag}-support`}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-emerald-400/35 hover:bg-white/[0.07]"
            >
              <div className="flex h-full flex-col">
                <h3 className="text-sm font-semibold text-white">{offer.title}</h3>
                <p className="mt-2 text-xs leading-5 text-gray-300">{offer.description}</p>
                <p className="mt-3 text-xs leading-5 text-emerald-100/80">{offer.reason}</p>
                <span className="mt-4 inline-flex text-xs font-semibold text-amber-300">
                  Shop on Amazon →
                </span>
              </div>
            </AffiliateLink>
          ))}
        </div>
      </div>
    </section>
  );
}
