import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchCharmPage } from '@/lib/charmParser';
import SearchLandingMonetizationRail from '@/components/SearchLandingMonetizationRail';

// The CHARM index is fetched from the live manual backend and can time out during
// static prerender on Vercel. Keep the route dynamic so production builds do not
// block on the upstream manual index.
export const dynamic = 'force-dynamic';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Factory Service Manuals | 82 Makes, 1982-2025 | SpotOnAuto',
  description:
    'Browse free factory service manuals for 82 makes of cars and trucks (1982-2025). Repair procedures, torque specs, wiring diagrams, and TSBs.',
  alternates: {
    canonical: 'https://spotonauto.com/manual',
  },
  openGraph: {
    title: 'Free Factory Service Manuals | SpotOnAuto',
    description:
      'Browse OEM repair manuals for 82 makes of vehicles. Torque specs, wiring diagrams, step-by-step procedures, and more.',
    type: 'website',
    url: 'https://spotonauto.com/manual',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'SpotOnAuto - Free DIY Auto Repair Guides' }],
  },
};

export default async function ManualLandingPage() {
  const page = await fetchCharmPage([]);

  if (page.status !== 200 || !page.isNavigation) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-display font-bold text-white mb-4">Service Manuals</h1>
        <p className="text-gray-400 text-lg">
          Unable to load the service manual database right now. Please try again in a few minutes.
        </p>
      </div>
    );
  }

  // Separate into cars and trucks for a nicer layout
  const cars = page.links.filter(l => !l.label.toLowerCase().includes('truck') && !l.label.toLowerCase().includes('fuso'));
  const trucks = page.links.filter(l => l.label.toLowerCase().includes('truck') || l.label.toLowerCase().includes('fuso'));

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero */}
      <section className="text-center mb-12 pt-12">
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
          Factory Service <span className="text-cyan-400">Manuals</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-2">
          Browse the complete factory service manual database covering <strong className="text-white">82 makes</strong> of
          cars and trucks from <strong className="text-white">1982 to 2025</strong>.
        </p>
        <p className="text-gray-500 text-sm max-w-xl mx-auto">
          Repair procedures, torque specs, wiring diagrams, TSBs, parts information, and labor times — all from OEM sources.
        </p>
      </section>

      <SearchLandingMonetizationRail
        surface="manual_index"
        intent="manual"
        contextLabel="factory service manual"
      />

      {/* Cars section */}
      {cars.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            Cars <span className="text-gray-500 text-base font-body font-normal">({cars.length} makes)</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {cars.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block glass rounded-xl p-4 text-center hover:border-cyan-400/50 transition-all group"
              >
                <span className="text-sm sm:text-base font-display font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trucks section */}
      {trucks.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            Trucks &amp; SUVs <span className="text-gray-500 text-base font-body font-normal">({trucks.length} makes)</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {trucks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block glass rounded-xl p-4 text-center hover:border-cyan-400/50 transition-all group"
              >
                <span className="text-sm sm:text-base font-display font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Info / cross-sell section */}
      <section className="glass rounded-2xl p-8 text-center">
        <h2 className="text-xl font-display font-bold text-white mb-3">
          Need a guided way in?
        </h2>
        <p className="text-gray-400 mb-6 max-w-lg mx-auto">
          Open the Manual Navigator to start from verified archive coverage, or jump straight
          to AI repair guides grounded in factory manual material.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/manual-navigator"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-display font-bold tracking-wider hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            Open Manual Navigator
          </Link>
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 bg-white/5 text-white font-display font-bold tracking-wider hover:border-cyan-500/30 hover:text-cyan-100 transition-all"
          >
            Browse AI Repair Guides
          </Link>
        </div>
      </section>

      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Factory Service Manuals',
            description:
              'Browse free factory service manuals for 82 makes of cars and trucks (1982-2025).',
            url: 'https://spotonauto.com/manual',
            publisher: { '@id': 'https://spotonauto.com/#organization' },
            isPartOf: { '@id': 'https://spotonauto.com/#website' },
          }),
        }}
      />
    </div>
  );
}
