import type { Metadata } from 'next';
import Link from 'next/link';

// High-value SEO page for BMW X3 battery location queries (10 impressions)
export const metadata: Metadata = {
    title: 'BMW X3 Battery Location | Where Is It? All Years Guide',
    description: 'Find exactly where the battery is located in your BMW X3. Includes jump start points, replacement tips, and what size battery you need. All years 2004-2024.',
    keywords: [
        'bmw x3 battery location',
        'where is bmw x3 battery',
        'bmw x3 battery replacement',
        'battery location bmw x3',
        'bmw x3 jump start points',
        '2014 bmw x3 battery location',
        'bmw x3 battery size',
    ],
    openGraph: {
        title: 'BMW X3 Battery Location Guide | All Years',
        description: 'Find your BMW X3 battery location instantly. Includes jump points and replacement guide.',
        type: 'article',
    },
    alternates: {
        canonical: 'https://spotonauto.com/tools/bmw-x3-battery-location',
    },
};

const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'antigravity-20';

// BMW X3 battery data by generation
const X3_BATTERY_DATA = [
    {
        gen: 'E83 (1st Gen)',
        years: '2004-2010',
        location: 'Under the hood, right side',
        access: 'Direct access from engine bay',
        batterySize: 'Group 94R (H7)',
        coldCrankAmps: '800 CCA minimum',
        agm: 'No (standard lead-acid OK)',
        difficulty: 'Easy',
        time: '20-30 min',
        specialNotes: 'Standard battery location. May need 10mm socket to remove hold-down.',
    },
    {
        gen: 'F25 (2nd Gen)',
        years: '2011-2017',
        location: 'Trunk, right side under floor',
        access: 'Remove trunk floor panel and side cover',
        batterySize: 'Group 94R (H7) - AGM',
        coldCrankAmps: '800-900 CCA',
        agm: 'Yes - AGM required',
        difficulty: 'Moderate',
        time: '30-45 min',
        specialNotes: 'Battery is in trunk! Jump points are under the hood. Must use AGM battery.',
    },
    {
        gen: 'G01 (3rd Gen)',
        years: '2018-2024',
        location: 'Trunk, right side under floor',
        access: 'Remove trunk floor panel',
        batterySize: 'Group 94R (H7) - AGM',
        coldCrankAmps: '900+ CCA recommended',
        agm: 'Yes - AGM required',
        difficulty: 'Moderate',
        time: '30-45 min',
        specialNotes: 'Battery in trunk. Requires battery registration with dealer or coding tool after replacement.',
    },
];

export default function BMWX3BatteryLocationPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            {/* Hero */}
            <section className="py-16 px-4 max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        BMW X3 Battery <span className="text-cyan-400">Location Guide</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Find exactly where your BMW X3 battery is located.
                        Quick answer: <strong className="text-white">It depends on your year!</strong>
                    </p>
                </div>

                {/* Quick Answer Box */}
                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl p-8 border border-cyan-500/30 mb-12">
                    <h2 className="text-2xl font-bold text-cyan-400 mb-4 text-center">
                        ⚡ Quick Answer: Where Is The Battery?
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-black/30 rounded-xl p-6">
                            <h3 className="font-bold text-lg text-amber-400 mb-2">2004-2010 (E83)</h3>
                            <p className="text-2xl font-bold">🔋 Under the hood</p>
                            <p className="text-gray-400 text-sm mt-2">Right side of engine bay, easy access</p>
                        </div>
                        <div className="bg-black/30 rounded-xl p-6">
                            <h3 className="font-bold text-lg text-amber-400 mb-2">2011-2024 (F25/G01)</h3>
                            <p className="text-2xl font-bold">🔋 In the trunk</p>
                            <p className="text-gray-400 text-sm mt-2">Right side, under the floor panel</p>
                        </div>
                    </div>
                </div>

                {/* Detailed Battery Finder Tool */}
                <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10 mb-12">
                    <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">
                        🔧 Battery Finder Tool: Find Your Exact Specs
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/20">
                                    <th className="py-3 px-4">Generation</th>
                                    <th className="py-3 px-4">Years</th>
                                    <th className="py-3 px-4">Location</th>
                                    <th className="py-3 px-4">Battery Size</th>
                                    <th className="py-3 px-4">AGM?</th>
                                    <th className="py-3 px-4">Shop</th>
                                </tr>
                            </thead>
                            <tbody>
                                {X3_BATTERY_DATA.map((gen, i) => (
                                    <tr key={i} className="border-b border-white/10 hover:bg-white/5">
                                        <td className="py-4 px-4 font-semibold">{gen.gen}</td>
                                        <td className="py-4 px-4 text-gray-300">{gen.years}</td>
                                        <td className="py-4 px-4 text-cyan-400">{gen.location}</td>
                                        <td className="py-4 px-4">{gen.batterySize}</td>
                                        <td className="py-4 px-4">
                                            {gen.agm.includes('Yes') ?
                                                <span className="text-amber-400">✓ Required</span> :
                                                <span className="text-gray-400">Optional</span>
                                            }
                                        </td>
                                        <td className="py-4 px-4">
                                            <a
                                                href={`https://www.amazon.com/s?k=BMW+X3+battery+${gen.agm.includes('Yes') ? 'AGM+' : ''}H7+94R&tag=${AMAZON_TAG}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-amber-500 text-black text-sm font-bold rounded hover:bg-amber-400 transition inline-block whitespace-nowrap"
                                            >
                                                Find Battery
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Jump Start Points */}
                <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl p-6 border border-red-500/30 mb-12">
                    <h2 className="text-xl font-bold text-red-400 mb-4">⚠️ Need to Jump Start? (2011+ Models)</h2>
                    <p className="text-gray-300 mb-4">
                        On 2011+ BMW X3 models, the battery is in the trunk but <strong>jump start points are under the hood!</strong>
                    </p>
                    <div className="bg-black/30 rounded-lg p-4">
                        <h3 className="font-bold mb-2">Jump Start Points (F25/G01):</h3>
                        <ul className="text-gray-300 space-y-1">
                            <li>• <strong className="text-red-400">Positive (+):</strong> Red cap near the engine bay (says "+" on cover)</li>
                            <li>• <strong className="text-gray-400">Negative (-):</strong> Any exposed metal bolt on the engine or chassis</li>
                        </ul>
                    </div>
                </div>

                {/* Generation Details */}
                <h2 className="text-2xl font-bold mb-6">📍 Detailed Location By Generation</h2>
                <div className="grid md:grid-cols-1 gap-6 mb-12">
                    {X3_BATTERY_DATA.map((gen, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-xl text-cyan-400">{gen.gen}</h3>
                                    <p className="text-gray-400">{gen.years}</p>
                                </div>
                                <div className="mt-2 md:mt-0 flex gap-4">
                                    <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                                        ⏱️ {gen.time}
                                    </span>
                                    <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                                        Difficulty: {gen.difficulty}
                                    </span>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-400">Location:</p>
                                    <p className="font-semibold text-lg">{gen.location}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Access:</p>
                                    <p>{gen.access}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Battery Size:</p>
                                    <p className="text-cyan-400">{gen.batterySize}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">CCA Required:</p>
                                    <p>{gen.coldCrankAmps}</p>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <p className="text-amber-300 text-sm">💡 {gen.specialNotes}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recommended Batteries */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-12">
                    <h2 className="text-xl font-bold mb-4">⭐ Recommended Batteries for BMW X3</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <a
                            href={`https://www.amazon.com/s?k=ACDelco+94R+AGM+battery&tag=${AMAZON_TAG}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:border-cyan-400 transition"
                        >
                            <h3 className="font-bold">ACDelco 94R AGM</h3>
                            <p className="text-sm text-gray-400">Professional grade, 850 CCA</p>
                            <p className="text-amber-400 text-sm mt-2">Shop on Amazon →</p>
                        </a>
                        <a
                            href={`https://www.amazon.com/s?k=Optima+RedTop+H7+battery&tag=${AMAZON_TAG}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:border-cyan-400 transition"
                        >
                            <h3 className="font-bold">Optima RedTop</h3>
                            <p className="text-sm text-gray-400">Premium AGM, max cranking power</p>
                            <p className="text-amber-400 text-sm mt-2">Shop on Amazon →</p>
                        </a>
                        <a
                            href={`https://www.amazon.com/s?k=Bosch+S6+AGM+battery+H7&tag=${AMAZON_TAG}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:border-cyan-400 transition"
                        >
                            <h3 className="font-bold">Bosch S6 AGM</h3>
                            <p className="text-sm text-gray-400">OEM equivalent, reliable</p>
                            <p className="text-amber-400 text-sm mt-2">Shop on Amazon →</p>
                        </a>
                    </div>
                </div>

                {/* Important Notes */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-12">
                    <h2 className="text-xl font-bold text-red-400 mb-4">⚠️ Important: Battery Registration (2011+ Models)</h2>
                    <p className="text-gray-300 mb-4">
                        On F25 and G01 BMW X3 models (2011+), the car's computer needs to "register" the new battery.
                        This tells the car that you installed a fresh battery so it can properly charge it.
                    </p>
                    <ul className="text-gray-400 space-y-2 text-sm">
                        <li>• Without registration, the car may overcharge the battery, reducing its lifespan</li>
                        <li>• You can register at a BMW dealer (~$100-150)</li>
                        <li>• Or use a coding tool like <strong>ISTA</strong>, <strong>Carly</strong>, or <strong>BimmerCode</strong></li>
                    </ul>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Need a Full Battery Replacement Guide?</h2>
                    <p className="text-gray-400 mb-6">Get a complete step-by-step guide for your specific BMW X3 year.</p>
                    <Link
                        href="/"
                        className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-blue-400 transition"
                    >
                        Generate Free Repair Guide →
                    </Link>
                </div>
            </section>

            {/* FAQ Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": [
                            {
                                "@type": "Question",
                                "name": "Where is the battery located on a BMW X3?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "On 2004-2010 BMW X3 (E83), the battery is under the hood on the right side. On 2011-2024 models (F25/G01), the battery is located in the trunk on the right side under the floor panel."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "What size battery does a BMW X3 need?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "BMW X3 uses a Group 94R (H7) battery. 2011 and newer models require an AGM (Absorbent Glass Mat) battery with 800-900 CCA."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "Do I need to register the battery after replacing it on BMW X3?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "Yes, on 2011 and newer BMW X3 models (F25 and G01), you need to register the new battery with a dealer or coding tool like Carly or BimmerCode. This prevents overcharging."
                                }
                            }
                        ]
                    })
                }}
            />
        </div>
    );
}
