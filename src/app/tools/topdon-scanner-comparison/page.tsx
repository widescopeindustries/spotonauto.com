import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import TopdonProductCard from '@/components/TopdonProductCard';
import AdUnit from '@/components/AdUnit';
import {
  TOPDON_PRODUCTS,
  TOPDON_SCANNERS,
  TOPDON_LOGO,
  buildTopdonProductUrl,
  buildTopdonStoreUrl,
} from '@/lib/topdonAffiliate';

export const metadata: Metadata = {
  title: 'TOPDON Scanner Comparison: Every Model Side by Side (2026) | SpotOnAuto',
  description:
    'Compare every TOPDON OBD2 scanner side-by-side. Full feature comparison chart — ArtiLink300 vs TopScan vs ArtiDiag500 vs ArtiDiag900 Lite vs ArtiDiag Pro and more.',
  keywords: [
    'topdon scanner comparison',
    'topdon scanner',
    'topdon artilink vs artidiag',
    'topdon topscan vs artilink',
    'topdon artidiag500 vs 600s',
    'topdon artidiag 900 lite vs pro',
    'topdon obd2 scanner comparison',
    'best topdon scanner',
  ],
  openGraph: {
    title: 'TOPDON Scanner Comparison: Every Model Side by Side',
    description:
      'Full feature comparison chart for every TOPDON OBD2 scanner. Find the right one for your car.',
    type: 'article',
    url: 'https://spotonauto.com/tools/topdon-scanner-comparison',
  },
  alternates: {
    canonical: 'https://spotonauto.com/tools/topdon-scanner-comparison',
  },
};

type FeatureRow = {
  feature: string;
  values: Record<string, string | boolean>;
};

const SCANNER_KEYS = [
  'artilink300',
  'topscan',
  'artilink500b',
  'artilink600',
  'artidiag500',
  'artidiag600s',
  'artidiag900lite',
  'artidiag800bt',
  'artidiagpro',
  'ultradiag',
] as const;

const SCANNERS = SCANNER_KEYS.map(
  (k) => TOPDON_PRODUCTS[k],
);

const FEATURES: FeatureRow[] = [
  {
    feature: 'Price',
    values: Object.fromEntries(SCANNER_KEYS.map((k) => [k, `$${TOPDON_PRODUCTS[k].price}`])),
  },
  {
    feature: 'Connection',
    values: {
      artilink300: 'Wired', topscan: 'Bluetooth', artilink500b: 'Wired', artilink600: 'Wired',
      artidiag500: 'Wired', artidiag600s: 'Wired', artidiag900lite: 'Wired', artidiag800bt: 'Bluetooth',
      artidiagpro: 'Wired', ultradiag: 'Wired',
    },
  },
  {
    feature: 'Read / Clear Codes',
    values: Object.fromEntries(SCANNER_KEYS.map((k) => [k, true])),
  },
  {
    feature: 'Live Data',
    values: {
      artilink300: false, topscan: true, artilink500b: true, artilink600: true,
      artidiag500: true, artidiag600s: true, artidiag900lite: true, artidiag800bt: true,
      artidiagpro: true, ultradiag: true,
    },
  },
  {
    feature: 'ABS / SRS',
    values: {
      artilink300: false, topscan: false, artilink500b: false, artilink600: true,
      artidiag500: true, artidiag600s: true, artidiag900lite: true, artidiag800bt: true,
      artidiagpro: true, ultradiag: true,
    },
  },
  {
    feature: 'Transmission',
    values: {
      artilink300: false, topscan: false, artilink500b: false, artilink600: false,
      artidiag500: true, artidiag600s: true, artidiag900lite: true, artidiag800bt: true,
      artidiagpro: true, ultradiag: true,
    },
  },
  {
    feature: 'All Systems',
    values: {
      artilink300: false, topscan: false, artilink500b: false, artilink600: false,
      artidiag500: false, artidiag600s: false, artidiag900lite: true, artidiag800bt: true,
      artidiagpro: true, ultradiag: true,
    },
  },
  {
    feature: 'Bi-Directional',
    values: {
      artilink300: false, topscan: true, artilink500b: false, artilink600: false,
      artidiag500: false, artidiag600s: false, artidiag900lite: true, artidiag800bt: true,
      artidiagpro: true, ultradiag: true,
    },
  },
  {
    feature: 'Battery Test',
    values: {
      artilink300: false, topscan: false, artilink500b: true, artilink600: false,
      artidiag500: false, artidiag600s: false, artidiag900lite: false, artidiag800bt: false,
      artidiagpro: false, ultradiag: false,
    },
  },
  {
    feature: 'CAN-FD Support',
    values: {
      artilink300: false, topscan: false, artilink500b: false, artilink600: false,
      artidiag500: false, artidiag600s: true, artidiag900lite: false, artidiag800bt: true,
      artidiagpro: false, ultradiag: false,
    },
  },
  {
    feature: 'Key Programming',
    values: {
      artilink300: false, topscan: false, artilink500b: false, artilink600: false,
      artidiag500: false, artidiag600s: false, artidiag900lite: false, artidiag800bt: false,
      artidiagpro: false, ultradiag: true,
    },
  },
  {
    feature: 'Touchscreen',
    values: {
      artilink300: false, topscan: 'Phone app', artilink500b: false, artilink600: false,
      artidiag500: '5"', artidiag600s: '5"', artidiag900lite: '5"', artidiag800bt: '5"',
      artidiagpro: '5"', ultradiag: '8"',
    },
  },
  {
    feature: 'Free Updates',
    values: {
      artilink300: 'Lifetime', topscan: 'Lifetime', artilink500b: 'Lifetime', artilink600: 'Lifetime',
      artidiag500: 'Lifetime', artidiag600s: 'Lifetime', artidiag900lite: '1 Year', artidiag800bt: '2 Years',
      artidiagpro: '1 Year', ultradiag: '1 Year',
    },
  },
];

const FAQ = [
  {
    q: 'What is the difference between ArtiLink and ArtiDiag scanners?',
    a: 'ArtiLink models are basic handheld code readers — they plug in and give you codes on a small screen. ArtiDiag models are tablet-style scanners with touchscreens, deeper system access, and more advanced features like resets, coding, and bi-directional controls.',
  },
  {
    q: 'Do I need CAN-FD support?',
    a: 'CAN-FD is a newer vehicle communication protocol found in many 2020+ vehicles, particularly Ford, GM, and some European brands. If you work on newer cars, the ArtiDiag600S or ArtiDiag800BT with CAN-FD support is a good investment. Older vehicles don\'t use CAN-FD.',
  },
  {
    q: 'Is the TOPDON TopScan better than the ArtiLink300?',
    a: 'They serve different needs. The ArtiLink300 ($34) is a dedicated handheld unit — no phone needed, just plug in and read codes. The TopScan ($51) connects to your phone via Bluetooth, offering a better display and bi-directional controls but requires the phone app. If you want simplicity, go ArtiLink300. If you want features, go TopScan.',
  },
  {
    q: 'ArtiDiag900 Lite vs ArtiDiag Pro — which should I get?',
    a: 'The ArtiDiag900 Lite ($299) and ArtiDiag Pro ($400) both offer full-system diagnostics. The Pro adds more service functions and broader vehicle coverage. For most home mechanics working on 1-3 vehicles, the 900 Lite is plenty. If you work on many different makes or do side work, the Pro is worth the extra $100.',
  },
];

function CellValue({ val }: { val: string | boolean }) {
  if (val === true)
    return <span className="text-green-400 font-bold">&#10003;</span>;
  if (val === false)
    return <span className="text-gray-600">—</span>;
  return <span className="text-white text-xs">{val}</span>;
}

export default function TopdonScannerComparisonPage() {
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

      <section className="py-16 px-4 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-8">
          <Link href="/tools" className="hover:text-cyan-400 transition">Tools</Link>
          <span className="mx-2">/</span>
          <Link href="/tools/best-topdon-scanner" className="hover:text-cyan-400 transition">Best TOPDON Scanner</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">Comparison</span>
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
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            TOPDON Scanner <span className="text-orange-400">Comparison</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Every current TOPDON OBD2 scanner compared feature-by-feature.
            Find exactly what you need.
          </p>
        </div>

        {/* Main Comparison Table */}
        <div className="mb-16 overflow-x-auto -mx-4 px-4">
          <div className="min-w-[900px]">
            <table className="w-full text-sm border-collapse">
              {/* Header: Product images + names */}
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-3 py-4 text-gray-400 font-semibold w-36 sticky left-0 bg-gray-900 z-10">
                    Feature
                  </th>
                  {SCANNERS.map((p) => (
                    <th key={p.slug} className="px-2 py-4 text-center min-w-[100px]">
                      <a
                        href={buildTopdonProductUrl(p.slug)}
                        target="_blank"
                        rel="sponsored noopener"
                        className="group"
                      >
                        <Image
                          src={p.image}
                          alt={p.name}
                          width={64}
                          height={64}
                          className="object-contain mx-auto h-16 mb-2 group-hover:scale-110 transition-transform"
                        />
                        <span className="text-white text-xs font-bold group-hover:text-orange-400 transition-colors block leading-tight">
                          {p.shortName}
                        </span>
                      </a>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                  >
                    <td className="px-3 py-3 text-gray-300 font-semibold text-xs sticky left-0 bg-gray-900 z-10">
                      {row.feature}
                    </td>
                    {SCANNER_KEYS.map((k) => (
                      <td key={k} className="px-2 py-3 text-center">
                        <CellValue val={row.values[k]} />
                      </td>
                    ))}
                  </tr>
                ))}
                {/* CTA row */}
                <tr>
                  <td className="px-3 py-4 sticky left-0 bg-gray-900 z-10" />
                  {SCANNERS.map((p) => (
                    <td key={p.slug} className="px-2 py-4 text-center">
                      <a
                        href={buildTopdonProductUrl(p.slug)}
                        target="_blank"
                        rel="sponsored noopener"
                        className="inline-block px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        ${p.price}
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <AdUnit slot="topdon-comparison-mid" format="horizontal" />

        {/* Category Picks */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Our Picks by Category</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-bold text-green-400 mb-4">Best Budget Scanner</h3>
              <TopdonProductCard
                product={TOPDON_PRODUCTS.artilink300}
                badge="Best Budget"
                surface="topdon-comparison"
                compact
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-400 mb-4">Best All-Around Value</h3>
              <TopdonProductCard
                product={TOPDON_PRODUCTS.artilink600}
                badge="Best Value"
                surface="topdon-comparison"
                compact
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-purple-400 mb-4">Best Pro Scanner</h3>
              <TopdonProductCard
                product={TOPDON_PRODUCTS.artidiag900lite}
                badge="Our Pick"
                surface="topdon-comparison"
                compact
              />
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

        <AdUnit slot="topdon-comparison-after-faq" format="horizontal" />

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
              href="/tools/topdon-battery-tester"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-orange-500/40 transition group"
            >
              <span className="text-orange-400">→</span>
              <span className="text-gray-300 text-sm group-hover:text-white transition">
                TOPDON Battery Tester Comparison
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
          <p className="text-gray-400 mb-2">Not sure which to pick?</p>
          <Link
            href="/tools/best-topdon-scanner"
            className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition text-lg"
          >
            Take the Scanner Quiz →
          </Link>
          <p className="text-gray-600 text-sm mt-3">2 questions, personalized recommendation</p>
        </div>
      </section>
    </div>
  );
}
