import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import TopdonProductCard from '@/components/TopdonProductCard';
import TopdonScannerQuiz from '@/components/TopdonScannerQuiz';
import AdUnit from '@/components/AdUnit';
import {
  TOPDON_PRODUCTS,
  TOPDON_SCANNERS,
  TOPDON_LOGO,
  buildTopdonProductUrl,
  buildTopdonStoreUrl,
} from '@/lib/topdonAffiliate';

export const metadata: Metadata = {
  title: 'Best TOPDON Scanner for Your Car (2026 Guide) | SpotOnAuto',
  description:
    'Find the best TOPDON OBD2 scanner for your needs. Side-by-side comparison of every model from $34 to $699 — ArtiLink, ArtiDiag, TopScan & more. Interactive quiz included.',
  keywords: [
    'best topdon scanner',
    'topdon scanner',
    'topdon scan tool',
    'topdon obd2 scanner',
    'topdon artidiag',
    'topdon topscan',
    'topdon artilink',
    'which topdon scanner',
    'topdon scanner comparison',
  ],
  openGraph: {
    title: 'Best TOPDON Scanner for Your Car (2026 Guide)',
    description:
      'Interactive guide to find the right TOPDON scanner. Compare every model side-by-side with real prices and features.',
    type: 'article',
    url: 'https://spotonauto.com/tools/best-topdon-scanner',
  },
  alternates: {
    canonical: 'https://spotonauto.com/tools/best-topdon-scanner',
  },
};

const FAQ = [
  {
    q: 'Which TOPDON scanner is best for beginners?',
    a: 'The TOPDON ArtiLink300 ($34) is the best starter scanner — it reads and clears check engine codes, shows freeze frame data, and runs I/M readiness checks. If you want Bluetooth phone connectivity, the TopScan ($51) is a great step up.',
  },
  {
    q: 'Do TOPDON scanners work on all cars?',
    a: 'All TOPDON OBD2 scanners work on any 1996+ vehicle sold in the US (OBD2 is federally mandated). The higher-tier models like ArtiDiag500 and above support 80-100+ global vehicle brands with deeper system access.',
  },
  {
    q: 'Are TOPDON scanner updates free?',
    a: 'Entry-level models (ArtiLink300, TopScan, ArtiLink600) include lifetime free updates. Mid and pro-level models typically include 1-2 years of free updates, with optional paid renewals after that.',
  },
  {
    q: 'TOPDON vs Autel vs BlueDriver — which is better?',
    a: 'TOPDON offers the best value at the entry and mid-range tiers. The ArtiLink300 at $34 undercuts most competitors, and the ArtiDiag lineup offers full-system diagnostics at lower prices than comparable Autel or Launch models. BlueDriver only offers Bluetooth; TOPDON has both handheld and Bluetooth options.',
  },
  {
    q: 'Can a TOPDON scanner turn off my check engine light?',
    a: 'Yes — every TOPDON scanner can clear diagnostic trouble codes (DTCs), which turns off the check engine light. However, if the underlying problem isn\'t fixed, the light will come back on after a few drive cycles.',
  },
  {
    q: 'Which TOPDON scanner can do ABS and airbag diagnostics?',
    a: 'The ArtiLink600 ($99) is the most affordable TOPDON scanner with ABS and SRS (airbag) diagnostics. For full system access including transmission, go with the ArtiDiag500 ($150) or higher.',
  },
];

export default function BestTopdonScannerPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Best TOPDON Scanners 2026',
    itemListElement: TOPDON_SCANNERS.slice(0, 6).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.name,
      url: buildTopdonProductUrl(p.slug),
    })),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <section className="py-16 px-4 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-8">
          <Link href="/tools" className="hover:text-cyan-400 transition">
            Tools
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">Best TOPDON Scanner</span>
        </nav>

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <Image
              src={TOPDON_LOGO}
              alt="TOPDON"
              width={120}
              height={36}
              className="invert brightness-200"
            />
            <span className="text-gray-500">|</span>
            <span className="text-sm text-gray-400 font-semibold uppercase tracking-wider">
              Buyer&apos;s Guide 2026
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Best TOPDON Scanner{' '}
            <span className="text-orange-400">for Your Car</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            From $34 code readers to $699 pro tablets — find the right TOPDON
            scanner for your skill level, vehicle, and budget.
          </p>
        </div>

        {/* Quick Answer Box — featured snippet target */}
        <div className="mb-12 bg-orange-950/30 border border-orange-500/30 rounded-xl p-6 max-w-3xl mx-auto">
          <h2 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-2">
            Quick Answer
          </h2>
          <p className="text-white text-lg leading-relaxed">
            The <strong>best TOPDON scanner for most DIYers</strong> is the{' '}
            <strong>TopScan ($51)</strong> — it connects to your phone via Bluetooth, covers
            120+ vehicle makes, and offers bi-directional controls at a price that&apos;s hard to
            beat. If you need ABS/airbag access, step up to the{' '}
            <strong>ArtiLink600 ($99)</strong>. For full-system diagnostics, the{' '}
            <strong>ArtiDiag900 Lite ($299)</strong> is the sweet spot.
          </p>
        </div>

        {/* Interactive Quiz */}
        <div className="mb-16">
          <TopdonScannerQuiz />
        </div>

        <AdUnit slot="topdon-after-quiz" />

        {/* Tier Breakdown */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-2 text-center">Every TOPDON Scanner, Ranked by Tier</h2>
          <p className="text-gray-400 text-center mb-10 max-w-xl mx-auto">
            We grouped every current TOPDON scanner by price tier so you can
            compare apples-to-apples.
          </p>

          {/* Entry Tier */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-bold rounded-full border border-green-500/30">
                Entry Level
              </span>
              <span className="text-gray-400 text-sm">Under $55 — Read & clear codes</span>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <TopdonProductCard
                product={TOPDON_PRODUCTS.artilink300}
                badge="Best Budget"
                surface="best-topdon-scanner"
              />
              <TopdonProductCard
                product={TOPDON_PRODUCTS.topscan}
                badge="Most Popular"
                surface="best-topdon-scanner"
              />
            </div>
          </div>

          {/* Mid Tier */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-bold rounded-full border border-blue-500/30">
                Mid Range
              </span>
              <span className="text-gray-400 text-sm">$76-$230 — Multi-system diagnostics</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <TopdonProductCard
                product={TOPDON_PRODUCTS.artilink500b}
                surface="best-topdon-scanner"
                compact
              />
              <TopdonProductCard
                product={TOPDON_PRODUCTS.artilink600}
                badge="Best Value"
                surface="best-topdon-scanner"
                compact
              />
              <TopdonProductCard
                product={TOPDON_PRODUCTS.artidiag500}
                surface="best-topdon-scanner"
                compact
              />
              <TopdonProductCard
                product={TOPDON_PRODUCTS.artidiag600s}
                surface="best-topdon-scanner"
                compact
              />
            </div>
          </div>

          {/* Pro Tier */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-sm font-bold rounded-full border border-purple-500/30">
                Pro Level
              </span>
              <span className="text-gray-400 text-sm">$299-$699 — Full-system, all makes</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <TopdonProductCard
                product={TOPDON_PRODUCTS.artidiag900lite}
                badge="Our Pick"
                surface="best-topdon-scanner"
                compact
              />
              <TopdonProductCard
                product={TOPDON_PRODUCTS.artidiag800bt}
                surface="best-topdon-scanner"
                compact
              />
              <TopdonProductCard
                product={TOPDON_PRODUCTS.artidiagpro}
                surface="best-topdon-scanner"
                compact
              />
              <TopdonProductCard
                product={TOPDON_PRODUCTS.ultradiag}
                surface="best-topdon-scanner"
                compact
              />
            </div>
          </div>
        </div>

        <AdUnit slot="topdon-after-tiers" format="horizontal" />

        {/* Quick Comparison Table */}
        <div className="mb-16 overflow-x-auto">
          <h2 className="text-2xl font-bold mb-6">At a Glance</h2>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/10 text-gray-400">
                <th className="px-4 py-3 font-semibold">Scanner</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Best For</th>
                <th className="px-4 py-3 font-semibold">Systems</th>
                <th className="px-4 py-3 font-semibold">Connection</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {[
                { p: TOPDON_PRODUCTS.artilink300, systems: 'Engine (OBD2)', conn: 'Wired' },
                { p: TOPDON_PRODUCTS.topscan, systems: 'Engine (OBD2)', conn: 'Bluetooth' },
                { p: TOPDON_PRODUCTS.artilink500b, systems: 'Engine + Battery', conn: 'Wired' },
                { p: TOPDON_PRODUCTS.artilink600, systems: 'Engine, ABS, SRS', conn: 'Wired' },
                { p: TOPDON_PRODUCTS.artidiag500, systems: '4 Systems', conn: 'Wired' },
                { p: TOPDON_PRODUCTS.artidiag600s, systems: '4 Systems (CAN-FD)', conn: 'Wired' },
                { p: TOPDON_PRODUCTS.artidiag900lite, systems: 'All Systems', conn: 'Wired' },
                { p: TOPDON_PRODUCTS.artidiag800bt, systems: 'All Systems (CAN-FD)', conn: 'Bluetooth' },
                { p: TOPDON_PRODUCTS.artidiagpro, systems: 'All Systems', conn: 'Wired' },
                { p: TOPDON_PRODUCTS.ultradiag, systems: 'All + Key Prog', conn: 'Wired' },
              ].map(({ p, systems, conn }) => (
                <tr key={p.slug} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-semibold text-white">{p.shortName}</td>
                  <td className="px-4 py-3 text-orange-400 font-bold">${p.price}</td>
                  <td className="px-4 py-3">{p.bestFor}</td>
                  <td className="px-4 py-3">{systems}</td>
                  <td className="px-4 py-3">{conn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ Section */}
        <section className="mb-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">
            Frequently Asked Questions
          </h2>
          <dl className="space-y-4">
            {FAQ.map((f, i) => (
              <div
                key={i}
                className="bg-white/[0.03] rounded-xl border border-white/10 overflow-hidden"
              >
                <dt className="px-5 py-4 font-semibold text-white">{f.q}</dt>
                <dd className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <AdUnit slot="topdon-after-faq" format="horizontal" />

        {/* Internal links */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">Related Guides</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/tools/topdon-scanner-comparison"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-orange-500/40 transition group"
            >
              <span className="text-orange-400">→</span>
              <span className="text-gray-300 text-sm group-hover:text-white transition">
                TOPDON Scanner Comparison Chart
              </span>
            </Link>
            <Link
              href="/tools/topdon-battery-tester"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-orange-500/40 transition group"
            >
              <span className="text-orange-400">→</span>
              <span className="text-gray-300 text-sm group-hover:text-white transition">
                TOPDON Battery Tester Guide
              </span>
            </Link>
            <Link
              href="/diagnose"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 transition group"
            >
              <span className="text-cyan-400">→</span>
              <span className="text-gray-300 text-sm group-hover:text-white transition">
                Free AI Diagnosis Tool
              </span>
            </Link>
            <Link
              href="/codes"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 transition group"
            >
              <span className="text-cyan-400">→</span>
              <span className="text-gray-300 text-sm group-hover:text-white transition">
                DTC Code Lookup
              </span>
            </Link>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="text-center py-8 border-t border-white/10">
          <p className="text-gray-400 mb-4">
            Already have a scanner? Use it with our free diagnostic tools.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition text-lg"
          >
            Start Free AI Diagnosis →
          </Link>
          <p className="text-gray-600 text-sm mt-3">100% Free — No signup required</p>
        </div>
      </section>
    </div>
  );
}
