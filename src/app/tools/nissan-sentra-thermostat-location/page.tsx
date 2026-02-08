import type { Metadata } from 'next';
import Link from 'next/link';

// High-value SEO page for Nissan Sentra thermostat location (5 impressions)
export const metadata: Metadata = {
    title: 'Nissan Sentra Thermostat Location | All Years Guide + Replacement',
    description: 'Find where the thermostat is located on your Nissan Sentra. Includes location diagrams, replacement tips, and common symptoms. All years 2000-2024.',
    keywords: [
        'nissan sentra thermostat location',
        '2012 nissan sentra thermostat location',
        'nissan sentra thermostat replacement',
        'where is thermostat nissan sentra',
        'sentra coolant thermostat',
        'nissan sentra overheating',
    ],
    openGraph: {
        title: 'Nissan Sentra Thermostat Location | All Years',
        description: 'Find your Nissan Sentra thermostat location instantly. Includes replacement guide.',
        type: 'article',
    },
    alternates: {
        canonical: 'https://spotonauto.com/tools/nissan-sentra-thermostat-location',
    },
};

const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'antigravity-20';

const SENTRA_THERMOSTAT_DATA = [
    {
        gen: 'B15 (5th Gen)',
        years: '2000-2006',
        engines: ['1.8L QG18DE', '2.5L QR25DE (SE-R)'],
        location: 'Lower radiator hose, front of engine',
        access: 'From above, follow lower radiator hose to engine',
        thermostatTemp: '180°F (82°C)',
        difficulty: 'Easy',
        time: '45-60 min',
        tips: 'Drain coolant first. Located in thermostat housing at end of lower hose.',
    },
    {
        gen: 'B16 (6th Gen)',
        years: '2007-2012',
        engines: ['2.0L MR20DE', '2.5L QR25DE (SE-R)'],
        location: 'Under intake manifold, driver side of engine',
        access: 'Follow upper radiator hose to engine block',
        thermostatTemp: '180°F (82°C)',
        difficulty: 'Moderate',
        time: '1-2 hours',
        tips: 'May need to remove air intake for better access. Drain coolant before starting.',
    },
    {
        gen: 'B17 (7th Gen)',
        years: '2013-2019',
        engines: ['1.8L MRA8DE', '1.6L Turbo (NISMO)'],
        location: 'Integrated in water outlet housing, front of engine',
        access: 'Follow upper radiator hose to thermostat housing',
        thermostatTemp: '180°F (82°C)',
        difficulty: 'Easy-Moderate',
        time: '45-90 min',
        tips: 'Some models have thermostat integrated with housing - may need to replace entire unit.',
    },
    {
        gen: 'B18 (8th Gen)',
        years: '2020-2024',
        engines: ['2.0L MR20DD'],
        location: 'Water outlet housing, front right of engine',
        access: 'Visible from top, follow upper hose',
        thermostatTemp: '181°F (83°C)',
        difficulty: 'Moderate',
        time: '1-1.5 hours',
        tips: 'Tight space in modern engine bay. Consider a mirror or inspection camera.',
    },
];

const SYMPTOMS = [
    { symptom: 'Engine overheating', description: 'Thermostat stuck closed, coolant can\'t flow' },
    { symptom: 'Heater blows cold', description: 'Thermostat stuck open, engine never reaches temp' },
    { symptom: 'Temp gauge fluctuates', description: 'Thermostat opening/closing erratically' },
    { symptom: 'Poor fuel economy', description: 'Engine running too cold (stuck open)' },
    { symptom: 'Check engine light (P0128)', description: 'Coolant temp below thermostat regulating temperature' },
];

export default function NissanSentraThermostatPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <section className="py-16 px-4 max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Nissan Sentra <span className="text-cyan-400">Thermostat Location</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Find exactly where the thermostat is located on your Sentra.
                        Includes replacement tips and common symptoms.
                    </p>
                </div>

                {/* Quick Answer */}
                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl p-8 border border-cyan-500/30 mb-12">
                    <h2 className="text-2xl font-bold text-cyan-400 mb-4 text-center">
                        ⚡ Quick Answer: Where Is The Thermostat?
                    </h2>
                    <div className="text-center">
                        <p className="text-xl mb-4">
                            In most Nissan Sentras, the thermostat is located where the
                            <strong className="text-white"> radiator hose connects to the engine</strong>.
                        </p>
                        <p className="text-gray-400">
                            Follow the upper or lower radiator hose to the engine - the thermostat is inside the housing at that connection point.
                        </p>
                    </div>
                </div>

                {/* Location Finder */}
                <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10 mb-12">
                    <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">
                        🔧 Thermostat Location by Generation
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/20">
                                    <th className="py-3 px-4">Years</th>
                                    <th className="py-3 px-4">Location</th>
                                    <th className="py-3 px-4">Difficulty</th>
                                    <th className="py-3 px-4">Time</th>
                                    <th className="py-3 px-4">Shop</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SENTRA_THERMOSTAT_DATA.map((gen, i) => (
                                    <tr key={i} className="border-b border-white/10 hover:bg-white/5">
                                        <td className="py-4 px-4 font-semibold">{gen.years}</td>
                                        <td className="py-4 px-4 text-cyan-400">{gen.location}</td>
                                        <td className="py-4 px-4 text-gray-300">{gen.difficulty}</td>
                                        <td className="py-4 px-4 text-gray-400">{gen.time}</td>
                                        <td className="py-4 px-4">
                                            <a
                                                href={`https://www.amazon.com/s?k=Nissan+Sentra+${gen.years.split('-')[0]}+thermostat&tag=${AMAZON_TAG}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-amber-500 text-black text-sm font-bold rounded hover:bg-amber-400 transition inline-block whitespace-nowrap"
                                            >
                                                Find Part
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Symptoms */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-12">
                    <h2 className="text-xl font-bold text-red-400 mb-4">🚨 Bad Thermostat Symptoms</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {SYMPTOMS.map((item, i) => (
                            <div key={i} className="bg-black/30 rounded-lg p-4">
                                <h3 className="font-bold text-white">{item.symptom}</h3>
                                <p className="text-gray-400 text-sm">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detailed by Generation */}
                <h2 className="text-2xl font-bold mb-6">📍 Detailed Location By Year</h2>
                <div className="space-y-6 mb-12">
                    {SENTRA_THERMOSTAT_DATA.map((gen, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-xl text-cyan-400">{gen.gen}</h3>
                                    <p className="text-gray-400">{gen.years} • {gen.engines.join(', ')}</p>
                                </div>
                                <div className="mt-2 md:mt-0 flex gap-4">
                                    <span className="px-3 py-1 bg-white/10 rounded-full text-sm">⏱️ {gen.time}</span>
                                    <span className="px-3 py-1 bg-white/10 rounded-full text-sm">{gen.difficulty}</span>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                                <div>
                                    <p className="text-gray-400">Thermostat Location:</p>
                                    <p className="text-lg">{gen.location}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">How to Access:</p>
                                    <p>{gen.access}</p>
                                </div>
                            </div>

                            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <p className="text-amber-300 text-sm">💡 {gen.tips}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Replacement Steps */}
                <div className="bg-white/5 rounded-xl p-8 border border-white/10 mb-12">
                    <h2 className="text-2xl font-bold mb-6">📋 Replacement Steps Overview</h2>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">1</div>
                            <p><strong>Let engine cool</strong> - Never open cooling system when hot!</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">2</div>
                            <p><strong>Drain coolant</strong> - Open drain valve or disconnect lower hose</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">3</div>
                            <p><strong>Remove thermostat housing</strong> - Usually 2-3 bolts (10mm or 12mm)</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">4</div>
                            <p><strong>Replace thermostat + gasket</strong> - Note orientation (spring goes toward engine)</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">5</div>
                            <p><strong>Refill & bleed coolant</strong> - Run engine with heater on, watch for bubbles</p>
                        </div>
                    </div>
                </div>

                {/* Recommended Parts */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-12">
                    <h2 className="text-xl font-bold mb-4">⭐ Recommended Thermostats</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <a href={`https://www.amazon.com/s?k=Stant+thermostat+Nissan+Sentra&tag=${AMAZON_TAG}`} target="_blank" rel="noopener noreferrer" className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:border-cyan-400 transition">
                            <h3 className="font-bold">Stant SuperStat</h3>
                            <p className="text-sm text-gray-400">OEM equivalent, reliable</p>
                            <p className="text-amber-400 text-sm mt-2">Shop on Amazon →</p>
                        </a>
                        <a href={`https://www.amazon.com/s?k=Motorad+thermostat+Nissan&tag=${AMAZON_TAG}`} target="_blank" rel="noopener noreferrer" className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:border-cyan-400 transition">
                            <h3 className="font-bold">Motorad</h3>
                            <p className="text-sm text-gray-400">Fail-safe design</p>
                            <p className="text-amber-400 text-sm mt-2">Shop on Amazon →</p>
                        </a>
                        <a href={`https://www.amazon.com/s?k=Nissan+Sentra+thermostat+housing+gasket+kit&tag=${AMAZON_TAG}`} target="_blank" rel="noopener noreferrer" className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:border-cyan-400 transition">
                            <h3 className="font-bold">Housing + Gasket Kit</h3>
                            <p className="text-sm text-gray-400">Complete replacement</p>
                            <p className="text-amber-400 text-sm mt-2">Shop on Amazon →</p>
                        </a>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Need Complete Replacement Instructions?</h2>
                    <p className="text-gray-400 mb-6">Get a detailed AI-generated guide for your specific Sentra year.</p>
                    <Link href="/" className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-blue-400 transition">
                        Generate Free Repair Guide →
                    </Link>
                </div>
            </section>

            {/* FAQ Schema */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": [
                        {
                            "@type": "Question",
                            "name": "Where is the thermostat located on a Nissan Sentra?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "On most Nissan Sentras, the thermostat is located where the radiator hose connects to the engine. On 2000-2006 models, it's at the lower radiator hose. On 2007+ models, it's typically at the upper hose connection under the intake manifold."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "What are symptoms of a bad thermostat in Nissan Sentra?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "Common symptoms include engine overheating, heater blowing cold air, fluctuating temperature gauge, poor fuel economy, and check engine light with code P0128."
                            }
                        }
                    ]
                })
            }} />
        </div>
    );
}
