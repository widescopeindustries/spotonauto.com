import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import TopdonProductCard from '@/components/TopdonProductCard';
import AdUnit from '@/components/AdUnit';
import {
  TOPDON_PRODUCTS,
  TOPDON_BATTERY_TESTERS,
  TOPDON_LOGO,
  buildTopdonProductUrl,
} from '@/lib/topdonAffiliate';

export const metadata: Metadata = {
  title: 'TOPDON Battery Tester Guide: BT50 vs BT100 vs BT200 vs BT600 (2026) | SpotOnAuto',
  description:
    'Compare every TOPDON battery tester side-by-side. BT50 vs BT100 vs BT200 vs BT600 — find the right battery and charging system tester for your needs. From $33 to $145.',
  keywords: [
    'topdon battery tester',
    'topdon bt50',
    'topdon bt100',
    'topdon bt200',
    'topdon bt600',
    'bt50 vs bt200',
    'best topdon battery tester',
    'car battery tester',
    'topdon battery tester comparison',
  ],
  openGraph: {
    title: 'TOPDON Battery Tester Guide: BT50 vs BT100 vs BT200 vs BT600',
    description:
      'Which TOPDON battery tester do you need? Full comparison with prices, features, and recommendations.',
    type: 'article',
    url: 'https://spotonauto.com/tools/topdon-battery-tester',
  },
  alternates: {
    canonical: 'https://spotonauto.com/tools/topdon-battery-tester',
  },
};

const FAQ = [
  {
    q: 'Which TOPDON battery tester is best for home use?',
    a: 'The TOPDON BT50 ($33) is perfect for home use. It tests battery health, cranking, and charging systems — everything you need to diagnose a dead or weak battery. The BT100 ($47) adds a better display if you want easier readability.',
  },
  {
    q: 'Do I need a 24V battery tester?',
    a: 'Only if you work on diesel trucks, commercial vehicles, RVs, or heavy equipment. Most passenger cars and light trucks use 12V systems. The BT200 ($70) and BT600 ($145) support both 12V and 24V.',
  },
  {
    q: 'Can a battery tester check my alternator?',
    a: 'Yes — all TOPDON battery testers include a charging system test that checks your alternator output. The BT200 adds an alternator ripple test for more detailed diagnosis. Run the charging test with the engine running to get alternator readings.',
  },
  {
    q: 'TOPDON BT50 vs BT200 — which should I get?',
    a: 'The BT50 ($33) handles most home DIY needs — battery health, cranking, and basic charging test. The BT200 ($70) adds 24V support, alternator ripple testing, 99.5% accuracy, and works on heavy-duty vehicles. Get the BT50 for your daily driver; get the BT200 if you have trucks, diesels, or want professional-grade accuracy.',
  },
  {
    q: 'Why would I need the BT600 with a printer?',
    a: 'The BT600 ($145) includes a built-in thermal printer for generating test reports on the spot. This is essential for mobile mechanics, shops, and anyone doing battery testing as a service — customers want a printed report showing their battery health. For home use, you don\'t need it.',
  },
  {
    q: 'How accurate are TOPDON battery testers?',
    a: 'TOPDON claims 99.5% accuracy on the BT200 and BT600 models. All models test CCA (Cold Cranking Amps), battery voltage, internal resistance, and state of health. They support all common lead-acid types: flooded, AGM, GEL, and EFB batteries.',
  },
];

const TESTER_KEYS = ['bt50', 'bt100', 'bt200', 'bt600'] as const;
const TESTERS = TESTER_KEYS.map((k) => TOPDON_PRODUCTS[k]);

export default function TopdonBatteryTesterPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="py-16 px-4 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-8">
          <Link href="/tools" className="hover:text-cyan-400 transition">Tools</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">TOPDON Battery Tester Guide</span>
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
              Battery Tester Guide
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            TOPDON Battery Tester{' '}
            <span className="text-orange-400">Comparison</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            BT50 vs BT100 vs BT200 vs BT600 — from $33 quick checks to $145
            shop-grade testing with printed reports.
          </p>
        </div>

        {/* Quick Answer Box */}
        <div className="mb-12 bg-orange-950/30 border border-orange-500/30 rounded-xl p-6 max-w-3xl mx-auto">
          <h2 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-2">
            Quick Answer
          </h2>
          <p className="text-white text-lg leading-relaxed">
            For most car owners, the <strong>TOPDON BT50 ($33)</strong> is all
            you need — it tests battery health, cranking power, and your charging
            system in under a minute. If you work on trucks or diesel vehicles,
            step up to the <strong>BT200 ($70)</strong> for 24V support and
            alternator ripple testing.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="mb-12 overflow-x-auto">
          <h2 className="text-2xl font-bold mb-6">Side-by-Side Comparison</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-4 text-gray-400 font-semibold">Feature</th>
                {TESTERS.map((p) => (
                  <th key={p.slug} className="px-4 py-4 text-center">
                    <a
                      href={buildTopdonProductUrl(p.slug)}
                      target="_blank"
                      rel="sponsored noopener"
                      className="group"
                    >
                      <Image
                        src={p.image}
                        alt={p.name}
                        width={80}
                        height={80}
                        className="object-contain mx-auto h-20 mb-2 group-hover:scale-110 transition-transform"
                      />
                      <span className="text-white font-bold group-hover:text-orange-400 transition-colors block">
                        {p.shortName}
                      </span>
                    </a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {[
                { label: 'Price', values: TESTERS.map((p) => `$${p.price}`) },
                { label: '12V Support', values: ['Yes', 'Yes', 'Yes', 'Yes'] },
                { label: '24V Support', values: ['No', 'No', 'Yes', 'Yes'] },
                { label: 'Battery Health Test', values: ['Yes', 'Yes', 'Yes', 'Yes'] },
                { label: 'Cranking Test', values: ['Yes', 'Yes', 'Yes', 'Yes'] },
                { label: 'Charging System Test', values: ['Yes', 'Yes', 'Yes', 'Yes'] },
                { label: 'Alternator Ripple Test', values: ['No', 'No', 'Yes', 'Yes'] },
                { label: 'CCA Range', values: ['100-2000', '100-2000', '100-2000', '100-2000'] },
                { label: 'Display', values: ['LED', '2" LCD', '2.4" Color', '3.5" Color'] },
                { label: 'Built-in Printer', values: ['No', 'No', 'No', 'Yes'] },
                { label: 'Battery Types', values: ['All lead-acid', 'All lead-acid', 'All lead-acid', 'All lead-acid'] },
                { label: 'Best For', values: ['Home DIY', 'Home DIY+', 'Trucks & diesel', 'Shops & mobile'] },
              ].map((row, i) => (
                <tr
                  key={row.label}
                  className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                >
                  <td className="px-4 py-3 text-gray-300 font-semibold text-sm">{row.label}</td>
                  {row.values.map((val, j) => (
                    <td key={j} className="px-4 py-3 text-center">
                      {val === 'Yes' ? (
                        <span className="text-green-400 font-bold">&#10003;</span>
                      ) : val === 'No' ? (
                        <span className="text-gray-600">—</span>
                      ) : (
                        <span className={row.label === 'Price' ? 'text-orange-400 font-bold' : ''}>
                          {val}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {/* CTA row */}
              <tr>
                <td className="px-4 py-4" />
                {TESTERS.map((p) => (
                  <td key={p.slug} className="px-4 py-4 text-center">
                    <a
                      href={buildTopdonProductUrl(p.slug)}
                      target="_blank"
                      rel="sponsored noopener"
                      className="inline-block px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      View ${p.price} →
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <AdUnit slot="topdon-battery-mid" format="horizontal" />

        {/* Which One Do You Need? */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Which Battery Tester Do You Need?</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/[0.03] rounded-xl border border-green-500/20 p-6">
              <h3 className="text-green-400 font-bold text-lg mb-3">Get the BT50 if...</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">&#10003;</span>
                  You just want to know if your battery is good or bad
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">&#10003;</span>
                  You drive a regular car, SUV, or light truck (12V)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">&#10003;</span>
                  You want a quick test before winter or a road trip
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">&#10003;</span>
                  Budget is a priority — you want the cheapest option that works
                </li>
              </ul>
              <div className="mt-4">
                <TopdonProductCard
                  product={TOPDON_PRODUCTS.bt50}
                  badge="Best Budget"
                  surface="battery-tester-guide"
                  compact
                />
              </div>
            </div>

            <div className="bg-white/[0.03] rounded-xl border border-blue-500/20 p-6">
              <h3 className="text-blue-400 font-bold text-lg mb-3">Get the BT200 if...</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">&#10003;</span>
                  You own a diesel truck or heavy-duty vehicle (24V)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">&#10003;</span>
                  You want to test the alternator in detail (ripple test)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">&#10003;</span>
                  You want 99.5% accuracy for confident diagnosis
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">&#10003;</span>
                  You work on multiple vehicles and want a reliable tool
                </li>
              </ul>
              <div className="mt-4">
                <TopdonProductCard
                  product={TOPDON_PRODUCTS.bt200}
                  badge="Best Value"
                  surface="battery-tester-guide"
                  compact
                />
              </div>
            </div>

            <div className="bg-white/[0.03] rounded-xl border border-yellow-500/20 p-6">
              <h3 className="text-yellow-400 font-bold text-lg mb-3">Get the BT100 if...</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5">&#10003;</span>
                  You want the BT50 features with a better LCD display
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5">&#10003;</span>
                  You do 12V testing only (no 24V needed)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5">&#10003;</span>
                  The $14 upgrade from BT50 is worth the readability
                </li>
              </ul>
              <div className="mt-4">
                <TopdonProductCard
                  product={TOPDON_PRODUCTS.bt100}
                  surface="battery-tester-guide"
                  compact
                />
              </div>
            </div>

            <div className="bg-white/[0.03] rounded-xl border border-purple-500/20 p-6">
              <h3 className="text-purple-400 font-bold text-lg mb-3">Get the BT600 if...</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">&#10003;</span>
                  You&apos;re a mobile mechanic or run a shop
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">&#10003;</span>
                  Customers need printed test reports
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">&#10003;</span>
                  You test batteries professionally (service centers, dealers)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">&#10003;</span>
                  You want the best display and most detailed results
                </li>
              </ul>
              <div className="mt-4">
                <TopdonProductCard
                  product={TOPDON_PRODUCTS.bt600}
                  badge="Pro Choice"
                  surface="battery-tester-guide"
                  compact
                />
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mb-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <dl className="space-y-4">
            {FAQ.map((f, i) => (
              <div key={i} className="bg-white/[0.03] rounded-xl border border-white/10 overflow-hidden">
                <dt className="px-5 py-4 font-semibold text-white">{f.q}</dt>
                <dd className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <AdUnit slot="topdon-battery-after-faq" format="horizontal" />

        {/* Cross-links */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">Related Guides</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link
              href="/tools/best-topdon-scanner"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-orange-500/40 transition group"
            >
              <span className="text-orange-400">→</span>
              <span className="text-gray-300 text-sm group-hover:text-white transition">
                Best TOPDON Scanner Guide + Quiz
              </span>
            </Link>
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
              href="/diagnose"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 transition group"
            >
              <span className="text-cyan-400">→</span>
              <span className="text-gray-300 text-sm group-hover:text-white transition">
                Free AI Diagnosis Tool
              </span>
            </Link>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="text-center py-8 border-t border-white/10">
          <p className="text-gray-400 mb-4">
            Battery testing is just the start — diagnose any car problem for free.
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
