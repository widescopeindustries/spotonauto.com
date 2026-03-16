import type { Metadata } from 'next';
import Link from 'next/link';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';

// Hand-crafted page targeting high-volume BMW X3 oil queries
// GSC: "bmw x3 oil change" = 56 impressions/week at position 72 (machine page too generic)
export const metadata: Metadata = {
    title: 'BMW X3 Oil Type & Capacity — All Engines & Years',
    description: 'Exact oil type, capacity, and filter for every BMW X3 engine. E83 (2004-2010), F25 (2011-2017), G01 (2018-2024). BMW LL-01/LL-04 spec explained. DIY steps included.',
    keywords: [
        'bmw x3 oil type',
        'bmw x3 oil capacity',
        'oil change bmw x3',
        'bmw x3 oil change',
        'changing oil bmw x3',
        'bmw x3 oil specification',
        'bmw x3 motor oil',
        'bmw x3 oil filter',
        'bmw ll-01 oil',
        'bmw ll-04 oil',
        '2014 bmw x3 oil type',
        '2018 bmw x3 oil type',
        '2021 bmw x3 oil type',
    ],
    openGraph: {
        title: 'BMW X3 Oil Type & Capacity — All Engines',
        description: 'Find the exact oil type, capacity, and filter for your BMW X3. Covers E83, F25, and G01 generations with all engine variants.',
        type: 'article',
    },
    alternates: {
        canonical: 'https://spotonauto.com/tools/bmw-x3-oil-type',
    },
};

const X3_OIL_DATA = [
    {
        gen: 'G01 (3rd Gen)',
        years: '2018-2024',
        engines: [
            {
                engine: 'xDrive30i / sDrive30i (B48)',
                displacement: '2.0L 4-cyl Turbo',
                oilType: '0W-20 Full Synthetic',
                spec: 'BMW LL-17 FE+',
                capacity: '5.1 qt (with filter)',
                filterPart: 'BMW #11428583898',
                interval: '10,000 miles / 1 year',
                drainPlug: '27 ft-lbs',
            },
            {
                engine: 'M40i (B58)',
                displacement: '3.0L 6-cyl Turbo',
                oilType: '0W-30 Full Synthetic',
                spec: 'BMW LL-01',
                capacity: '6.9 qt (with filter)',
                filterPart: 'BMW #11428576016',
                interval: '10,000 miles / 1 year',
                drainPlug: '19 ft-lbs',
            },
        ],
        notes: [
            'The B48 engine requires BMW LL-17 FE+ spec — standard LL-01 oils are NOT compatible',
            'Oil level indicator on dash is your guide — do not rely only on mileage',
            'BMW Condition Based Service (CBS) resets automatically after oil change on most models',
        ],
    },
    {
        gen: 'F25 (2nd Gen)',
        years: '2011-2017',
        engines: [
            {
                engine: 'xDrive28i (N20)',
                displacement: '2.0L 4-cyl Turbo',
                oilType: '5W-30 Full Synthetic',
                spec: 'BMW LL-01',
                capacity: '4.75 qt (with filter)',
                filterPart: 'BMW #11428507683',
                interval: '10,000 miles / 1 year',
                drainPlug: '18 ft-lbs',
            },
            {
                engine: 'xDrive35i (N55)',
                displacement: '3.0L 6-cyl Turbo',
                oilType: '0W-40 Full Synthetic',
                spec: 'BMW LL-01',
                capacity: '6.9 qt (with filter)',
                filterPart: 'BMW #11428576016',
                interval: '10,000 miles / 1 year',
                drainPlug: '19 ft-lbs',
            },
            {
                engine: 'xDrive28d (N47)',
                displacement: '2.0L 4-cyl Diesel',
                oilType: '5W-30 Full Synthetic',
                spec: 'BMW LL-04',
                capacity: '5.8 qt (with filter)',
                filterPart: 'BMW #11428507683',
                interval: '12,500 miles / 1 year',
                drainPlug: '18 ft-lbs',
            },
        ],
        notes: [
            'N20 and N55 engines use BMW LL-01 spec — Castrol Edge, Motul 8100, or Liqui-Moly Synthoil recommended',
            'Diesel N47 requires LL-04 spec (low SAPS) — do NOT use LL-01 in a diesel',
            'Oil filter is a spin-off canister style — replace it every oil change',
        ],
    },
    {
        gen: 'E83 (1st Gen)',
        years: '2004-2010',
        engines: [
            {
                engine: '2.5si / 3.0si (N52)',
                displacement: '2.5L / 3.0L 6-cyl',
                oilType: '5W-30 Full Synthetic',
                spec: 'BMW LL-01',
                capacity: '6.9 qt (with filter)',
                filterPart: 'BMW #11427512300',
                interval: '10,000 miles / 1 year',
                drainPlug: '25 ft-lbs',
            },
            {
                engine: '3.0d / 3.0sd (M57)',
                displacement: '3.0L 6-cyl Diesel',
                oilType: '5W-30 Full Synthetic',
                spec: 'BMW LL-04',
                capacity: '7.4 qt (with filter)',
                filterPart: 'BMW #11427788460',
                interval: '12,500 miles / 1 year',
                drainPlug: '25 ft-lbs',
            },
        ],
        notes: [
            'The N52 is a naturally-aspirated 6-cyl — very reliable if maintained with correct LL-01 spec oil',
            'E83 uses traditional spin-on oil filter cartridge in the engine',
            'Valvoline, Pennzoil Platinum, and Castrol are all acceptable LL-01 brands',
        ],
    },
];

const SPEC_EXPLANATION = [
    {
        spec: 'BMW LL-01',
        description: 'Long Life 01 — BMW\'s standard spec for most gasoline engines. Requires full synthetic. Common brands: Castrol Edge 0W-30, Liqui-Moly 0W-40, Motul 8100.',
        color: 'blue',
    },
    {
        spec: 'BMW LL-04',
        description: 'Long Life 04 — Low SAPS (low sulfated ash, phosphorus, sulfur) for diesel engines with DPF filters. Do NOT use in gasoline engines.',
        color: 'amber',
    },
    {
        spec: 'BMW LL-17 FE+',
        description: 'Long Life 17 — Fuel Economy spec for newer B-series engines (2018+). Thinner 0W-20 viscosity. LL-01 oil is NOT a valid substitute in these engines.',
        color: 'cyan',
    },
];

const FAQS = [
    {
        q: 'What oil does a BMW X3 take?',
        a: 'BMW X3 oil type depends on the engine: 2018+ xDrive30i (B48) uses 0W-20 LL-17 FE+ spec. 2011-2017 xDrive28i (N20) and xDrive35i (N55) use 5W-30 or 0W-40 LL-01 spec. 2004-2010 E83 models use 5W-30 LL-01. Diesel variants require LL-04 spec oil.',
    },
    {
        q: 'Can I use 5W-30 instead of 0W-20 in my BMW X3?',
        a: 'For 2018+ B48 engines, no — they require BMW LL-17 FE+ spec (0W-20). Using 5W-30 LL-01 in a B48 can void your warranty and affect fuel economy. For F25 N20 engines, 5W-30 LL-01 is the correct spec.',
    },
    {
        q: 'How many quarts of oil does a BMW X3 take?',
        a: 'Oil capacity depends on the engine. The B48 2.0L (2018+) holds 5.1 quarts. The N55 3.0L holds 6.9 quarts. The N20 2.0L (F25) holds 4.75 quarts. The E83 N52 6-cyl holds 6.9 quarts. Always verify by checking the dipstick after filling.',
    },
    {
        q: 'How often should I change oil on a BMW X3?',
        a: 'BMW recommends 10,000-mile or annual oil changes for gasoline engines (whichever comes first), and up to 12,500 miles for diesel models. However, many BMW mechanics recommend 7,500-mile intervals for vehicles in stop-and-go traffic or extreme conditions.',
    },
    {
        q: 'What oil filter does a BMW X3 use?',
        a: 'Filter part numbers vary by generation: G01 B48 uses BMW #11428583898, F25 N20/N55 use BMW #11428507683, and E83 N52 uses BMW #11427512300. Third-party brands like Mann or Mahle are OEM suppliers and acceptable alternatives.',
    },
];

export default function BMWX3OilTypePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <section className="py-16 px-4 max-w-6xl mx-auto">

                {/* Hero */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-medium mb-4">
                        🛢️ Oil Specs Tool
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        BMW X3 Oil Type <span className="text-amber-400">&amp; Capacity</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Exact oil spec, capacity, and filter for every BMW X3 engine —
                        E83, F25, and G01 generations. BMW approvals explained.
                    </p>
                </div>

                {/* Quick Answer Box */}
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl p-8 border border-amber-500/30 mb-12">
                    <h2 className="text-2xl font-bold text-amber-400 mb-4 text-center">
                        ⚡ Quick Answer: What Oil Does a BMW X3 Take?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-black/30 rounded-xl p-5">
                            <p className="text-gray-400 text-sm">2018-2024 (G01) xDrive30i</p>
                            <p className="text-xl font-bold text-white mt-1">0W-20 Synthetic</p>
                            <p className="text-amber-400 text-sm">BMW LL-17 FE+ | 5.1 qt</p>
                        </div>
                        <div className="bg-black/30 rounded-xl p-5">
                            <p className="text-gray-400 text-sm">2011-2017 (F25) xDrive28i</p>
                            <p className="text-xl font-bold text-white mt-1">5W-30 Synthetic</p>
                            <p className="text-amber-400 text-sm">BMW LL-01 | 4.75 qt</p>
                        </div>
                        <div className="bg-black/30 rounded-xl p-5">
                            <p className="text-gray-400 text-sm">2004-2010 (E83) 2.5si/3.0si</p>
                            <p className="text-xl font-bold text-white mt-1">5W-30 Synthetic</p>
                            <p className="text-amber-400 text-sm">BMW LL-01 | 6.9 qt</p>
                        </div>
                    </div>
                </div>

                {/* BMW Spec Explanation */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">📋 BMW Oil Approval Specs Explained</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {SPEC_EXPLANATION.map((s, i) => (
                            <div key={i} className={`rounded-xl p-5 border ${
                                s.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30' :
                                s.color === 'amber' ? 'bg-amber-500/10 border-amber-500/30' :
                                'bg-cyan-500/10 border-cyan-500/30'
                            }`}>
                                <p className={`font-bold text-lg mb-2 ${
                                    s.color === 'blue' ? 'text-blue-400' :
                                    s.color === 'amber' ? 'text-amber-400' :
                                    'text-cyan-400'
                                }`}>{s.spec}</p>
                                <p className="text-gray-300 text-sm">{s.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Full Data Table by Generation */}
                {X3_OIL_DATA.map((gen, i) => (
                    <div key={i} className="mb-12">
                        <h2 className="text-2xl font-bold text-cyan-400 mb-2">
                            BMW X3 {gen.gen} — {gen.years}
                        </h2>
                        <div className="overflow-x-auto rounded-xl border border-white/10 mb-4">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/20">
                                        <th className="py-3 px-4">Engine</th>
                                        <th className="py-3 px-4">Oil Type</th>
                                        <th className="py-3 px-4">BMW Spec</th>
                                        <th className="py-3 px-4">Capacity</th>
                                        <th className="py-3 px-4">Drain Plug</th>
                                        <th className="py-3 px-4">Interval</th>
                                        <th className="py-3 px-4">Shop</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gen.engines.map((e, j) => (
                                        <tr key={j} className="border-b border-white/10 hover:bg-white/5">
                                            <td className="py-4 px-4">
                                                <p className="font-semibold">{e.engine}</p>
                                                <p className="text-gray-500 text-xs">{e.displacement}</p>
                                            </td>
                                            <td className="py-4 px-4 font-semibold text-amber-400">{e.oilType}</td>
                                            <td className="py-4 px-4">
                                                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-mono">
                                                    {e.spec}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-cyan-400">{e.capacity}</td>
                                            <td className="py-4 px-4 text-gray-300">{e.drainPlug}</td>
                                            <td className="py-4 px-4 text-gray-300 text-xs">{e.interval}</td>
                                            <td className="py-4 px-4">
                                                <a
                                                    href={buildAmazonSearchUrl(`BMW ${e.spec} ${e.oilType} oil`)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-2 bg-amber-500 text-black text-xs font-bold rounded hover:bg-amber-400 transition inline-block whitespace-nowrap"
                                                >
                                                    Find Oil
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Tips */}
                        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                            <h3 className="font-semibold text-gray-300 mb-3">💡 Tips for {gen.gen}:</h3>
                            <ul className="space-y-2">
                                {gen.notes.map((note, k) => (
                                    <li key={k} className="flex gap-2 text-gray-400 text-sm">
                                        <span className="text-amber-400 flex-shrink-0">•</span>
                                        {note}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}

                {/* Recommended Oils */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-12">
                    <h2 className="text-xl font-bold mb-5">⭐ Recommended Oils for BMW X3</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <a
                            href={buildAmazonSearchUrl('Castrol Edge 0W-30 BMW LL01')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:border-amber-400 transition"
                        >
                            <h3 className="font-bold">Castrol Edge 0W-30</h3>
                            <p className="text-xs text-amber-400 mt-1">BMW LL-01 Approved</p>
                            <p className="text-sm text-gray-400 mt-2">OEM fill for many BMW engines. Excellent shear stability.</p>
                            <p className="text-amber-400 text-sm mt-3">Shop on Amazon →</p>
                        </a>
                        <a
                            href={buildAmazonSearchUrl('Liqui Moly Synthoil 0W-40 BMW')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:border-amber-400 transition"
                        >
                            <h3 className="font-bold">Liqui-Moly Synthoil 0W-40</h3>
                            <p className="text-xs text-amber-400 mt-1">BMW LL-01 Approved</p>
                            <p className="text-sm text-gray-400 mt-2">German brand, top rated by BMW enthusiasts globally.</p>
                            <p className="text-amber-400 text-sm mt-3">Shop on Amazon →</p>
                        </a>
                        <a
                            href={buildAmazonSearchUrl('Motul 8100 X-clean 5W-30 BMW LL04')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:border-amber-400 transition"
                        >
                            <h3 className="font-bold">Motul 8100 X-clean 5W-30</h3>
                            <p className="text-xs text-amber-400 mt-1">BMW LL-04 Approved (Diesel)</p>
                            <p className="text-sm text-gray-400 mt-2">For X3 diesel models (xDrive28d/30d). Low SAPS formula.</p>
                            <p className="text-amber-400 text-sm mt-3">Shop on Amazon →</p>
                        </a>
                    </div>
                </div>

                {/* FAQ */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">❓ BMW X3 Oil Change FAQs</h2>
                    <div className="space-y-4">
                        {FAQS.map((faq, i) => (
                            <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <h3 className="font-bold text-lg text-white mb-3">{faq.q}</h3>
                                <p className="text-gray-400">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl p-10 border border-amber-500/30">
                    <h2 className="text-2xl font-bold mb-3">Need a Full BMW X3 Oil Change Guide?</h2>
                    <p className="text-gray-400 mb-6">Get step-by-step instructions with drain plug location, filter removal, and reset procedure for your exact year and engine.</p>
                    <Link
                        href="/"
                        className="inline-block px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-lg hover:from-amber-400 hover:to-orange-400 transition"
                    >
                        Generate Free Repair Guide →
                    </Link>
                </div>

            </section>

            {/* Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": FAQS.map(faq => ({
                            "@type": "Question",
                            "name": faq.q,
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": faq.a,
                            },
                        })),
                    }),
                }}
            />
        </div>
    );
}
