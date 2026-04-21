import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | SpotOnAuto',
  description:
    'SpotOnAuto pricing for Quote Shield Pro and guided repair support. Start free, then unlock unlimited quote checks and premium workflows.',
  alternates: {
    canonical: 'https://spotonauto.com/pricing',
  },
};

export default function PricingPage() {
  const checkoutUrl = process.env.NEXT_PUBLIC_SECOND_OPINION_CHECKOUT_URL || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black text-white">
      <section className="mx-auto max-w-5xl px-4 pb-20 pt-24">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Pricing</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Pick the plan that saves you the most money
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-gray-300">
            Start free, then upgrade when you want unlimited quote checks and pro-level decision support.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">Starter</p>
            <h2 className="mt-2 text-2xl font-bold">Free</h2>
            <p className="mt-2 text-sm text-gray-300">Best for occasional checks before a major repair.</p>
            <ul className="mt-5 space-y-2 text-sm text-gray-300">
              <li>1 quote check per day</li>
              <li>Vehicle-specific verdict and price range</li>
              <li>Common misdiagnosis warnings</li>
            </ul>
            <Link
              href="/second-opinion"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold hover:border-cyan-400/40 hover:text-cyan-200"
            >
              Start Free
            </Link>
          </article>

          <article className="rounded-2xl border border-cyan-400/40 bg-cyan-500/[0.08] p-6 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Quote Shield Pro</p>
            <h2 className="mt-2 text-2xl font-bold">$9/month</h2>
            <p className="mt-2 text-sm text-cyan-100/85">Built for high-ticket repairs where one bad quote costs hundreds.</p>
            <ul className="mt-5 space-y-2 text-sm text-cyan-50">
              <li>Unlimited quote checks</li>
              <li>Priority analysis for complex repairs</li>
              <li>Printable share-ready reports</li>
            </ul>
            <Link
              href={checkoutUrl || '/second-opinion'}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-black hover:bg-cyan-300"
            >
              {checkoutUrl ? 'Upgrade to Pro' : 'Join Pro Waitlist'}
            </Link>
          </article>
        </div>
      </section>
    </div>
  );
}
