import type { Metadata } from 'next';
import Link from 'next/link';

// High-value SEO page for Honda Odyssey serpentine belt (5 impressions)
export const metadata: Metadata = {
    title: 'Honda Odyssey Serpentine Belt Diagram | All Years 1999-2024',
    description: 'Find your Honda Odyssey serpentine belt routing diagram and size. Covers all generations with tensioner info and DIY replacement tips. Save $100+ on labor.',
    keywords: [
        'honda odyssey serpentine belt diagram',
        'honda odyssey belt routing',
        'odyssey drive belt replacement',
        'honda odyssey belt size',
        'odyssey serpentine belt tensioner',
        '2013 honda odyssey serpentine belt',
    ],
    openGraph: {
        title: 'Honda Odyssey Serpentine Belt Diagram | All Years',
        description: 'Find belt routing diagrams for any Honda Odyssey. Free instant lookup with part numbers.',
        type: 'article',
    },
    alternates: {
        canonical: 'https://spotonauto.com/tools/honda-odyssey-serpentine-belt',
    },
};

const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'antigravity-20';

const ODYSSEY_BELT_DATA = [
    {
        gen: 'RL1 (1st Gen)',
        years: '1999-2004',
        engine: '3.5L J35A V6',
        beltPart: '6PK1880 / Bando 6PK1880',
        tensioner: 'Automatic tensioner (19mm socket)',
        routing: 'Crankshaft → Power Steering → A/C → Tensioner → Alternator → Water Pump → Idler',
        difficulty: 'Easy',
        time: '30-45 min',
        tips: 'Use 19mm on tensioner, rotate counterclockwise. Good access from top.',
    },
    {
        gen: 'RL3/RL4 (2nd Gen)',
        years: '2005-2010',
        engine: '3.5L J35A V6',
        beltPart: '6PK1880 (A/C) + 4PK890 (P/S)',
        tensioner: 'Automatic tensioner (19mm socket)',
        routing: 'Main belt: Crankshaft → A/C → Tensioner → Alternator → Idler. Separate P/S belt on some.',
        difficulty: 'Easy-Moderate',
        time: '30-45 min',
        tips: 'Some models have 2 belts - one for A/C/Alt, one for Power Steering.',
    },
    {
        gen: 'RL5 (3rd Gen)',
        years: '2011-2017',
        engine: '3.5L J35Z V6 (VCM)',
        beltPart: '6PK1870',
        tensioner: 'Automatic tensioner (19mm wrench)',
        routing: 'Crankshaft → A/C → Idler → Power Steering → Tensioner → Alternator → Water Pump',
        difficulty: 'Moderate',
        time: '45-60 min',
        tips: 'Tight engine bay. May be easier to access from below on lift.',
    },
    {
        gen: 'RL6 (4th Gen)',
        years: '2018-2024',
        engine: '3.5L J35Y V6',
        beltPart: '6PK1855',
        tensioner: 'Automatic tensioner with wear indicator',
        routing: 'Crankshaft → A/C → Idler → Alternator → Water Pump → Tensioner',
        difficulty: 'Moderate',
        time: '45-60 min',
        tips: 'Check tensioner wear indicator. Replace tensioner if past service marks.',
    },
];

export default function HondaOdysseyBeltPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <section className="py-16 px-4 max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Honda Odyssey <span className="text-cyan-400">Serpentine Belt Diagram</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Belt routing diagrams for all Honda Odyssey generations.
                        Find your belt size and replacement instructions.
                    </p>
                </div>

                {/* Belt Finder Tool */}
                <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10 mb-12">
                    <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">
                        🔧 Belt Finder: Select Your Year
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/20">
                                    <th className="py-3 px-4">Generation</th>
                                    <th className="py-3 px-4">Years</th>
                                    <th className="py-3 px-4">Engine</th>
                                    <th className="py-3 px-4">Belt Part #</th>
                                    <th className="py-3 px-4">Shop</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ODYSSEY_BELT_DATA.map((gen, i) => (
                                    <tr key={i} className="border-b border-white/10 hover:bg-white/5">
                                        <td className="py-4 px-4 font-semibold">{gen.gen}</td>
                                        <td className="py-4 px-4 text-gray-300">{gen.years}</td>
                                        <td className="py-4 px-4 text-gray-400">{gen.engine}</td>
                                        <td className="py-4 px-4 text-cyan-400">{gen.beltPart}</td>
                                        <td className="py-4 px-4">
                                            <a
                                                href={`https://www.amazon.com/s?k=Honda+Odyssey+${gen.years.split('-')[0]}+serpentine+belt&tag=${AMAZON_TAG}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-amber-500 text-black text-sm font-bold rounded hover:bg-amber-400 transition inline-block whitespace-nowrap"
                                            >
                                                Find Belt
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Important Note for 2005-2010 */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-12">
                    <h2 className="text-xl font-bold text-amber-400 mb-3">⚠️ Note for 2005-2010 Odyssey Owners</h2>
                    <p className="text-gray-300">
                        Some 2005-2010 Odyssey models have <strong>two separate belts</strong> - one for the A/C and alternator,
                        and a smaller belt for power steering. Check your engine bay before ordering parts.
                    </p>
                </div>

                {/* Belt Routing Details */}
                <h2 className="text-2xl font-bold mb-6">📐 Belt Routing By Generation</h2>
                <div className="space-y-6 mb-12">
                    {ODYSSEY_BELT_DATA.map((gen, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-xl text-cyan-400">{gen.gen}</h3>
                                    <p className="text-gray-400">{gen.years} • {gen.engine}</p>
                                </div>
                                <div className="mt-2 md:mt-0 flex gap-4">
                                    <span className="px-3 py-1 bg-white/10 rounded-full text-sm">⏱️ {gen.time}</span>
                                    <span className="px-3 py-1 bg-white/10 rounded-full text-sm">{gen.difficulty}</span>
                                </div>
                            </div>

                            <div className="bg-black/30 rounded-lg p-4 mb-4">
                                <p className="text-gray-400 text-sm mb-2">Belt Routing Path:</p>
                                <p className="text-lg font-mono text-sm">{gen.routing}</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-400">Tensioner:</p>
                                    <p>{gen.tensioner}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Belt Part Number:</p>
                                    <p className="text-cyan-400">{gen.beltPart}</p>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                                <p className="text-cyan-300 text-sm">💡 Pro Tip: {gen.tips}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Replacement Steps */}
                <div className="bg-white/5 rounded-xl p-8 border border-white/10 mb-12">
                    <h2 className="text-2xl font-bold mb-6">📋 How to Replace Odyssey Serpentine Belt</h2>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">1</div>
                            <div>
                                <p className="font-bold">Take a photo of the belt routing</p>
                                <p className="text-gray-400 text-sm">The routing diagram is often on a sticker under the hood</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">2</div>
                            <div>
                                <p className="font-bold">Place a 19mm socket on the tensioner</p>
                                <p className="text-gray-400 text-sm">Some need a breaker bar for leverage</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">3</div>
                            <div>
                                <p className="font-bold">Rotate counterclockwise to release tension</p>
                                <p className="text-gray-400 text-sm">Hold tensioner while sliding belt off a pulley</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">4</div>
                            <div>
                                <p className="font-bold">Route new belt per diagram</p>
                                <p className="text-gray-400 text-sm">Leave tensioner for last - it holds the belt tight</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">5</div>
                            <div>
                                <p className="font-bold">Verify belt is seated in all grooves</p>
                                <p className="text-gray-400 text-sm">Start engine briefly and check alignment</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signs of Wear */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-12">
                    <h2 className="text-xl font-bold text-red-400 mb-4">🚨 Signs Your Belt Needs Replacement</h2>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="flex gap-3">
                            <span>•</span>
                            <p><strong>Squealing noise</strong> - especially at startup or when turning</p>
                        </div>
                        <div className="flex gap-3">
                            <span>•</span>
                            <p><strong>Visible cracks</strong> - check the ribbed side of belt</p>
                        </div>
                        <div className="flex gap-3">
                            <span>•</span>
                            <p><strong>Glazed/shiny appearance</strong> - belt is slipping</p>
                        </div>
                        <div className="flex gap-3">
                            <span>•</span>
                            <p><strong>AC or power steering issues</strong> - belt not gripping</p>
                        </div>
                    </div>
                </div>

                {/* Recommended Parts */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-12">
                    <h2 className="text-xl font-bold mb-4">⭐ Recommended Belts for Odyssey</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <a href={`https://www.amazon.com/s?k=Bando+serpentine+belt+Honda+Odyssey&tag=${AMAZON_TAG}`} target="_blank" rel="noopener noreferrer" className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:border-cyan-400 transition">
                            <h3 className="font-bold">Bando (OEM Supplier)</h3>
                            <p className="text-sm text-gray-400">Honda OEM quality, exact fit</p>
                            <p className="text-amber-400 text-sm mt-2">Shop on Amazon →</p>
                        </a>
                        <a href={`https://www.amazon.com/s?k=Gates+serpentine+belt+Honda+Odyssey&tag=${AMAZON_TAG}`} target="_blank" rel="noopener noreferrer" className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:border-cyan-400 transition">
                            <h3 className="font-bold">Gates K-Series</h3>
                            <p className="text-sm text-gray-400">Premium aftermarket, quiet</p>
                            <p className="text-amber-400 text-sm mt-2">Shop on Amazon →</p>
                        </a>
                        <a href={`https://www.amazon.com/s?k=Honda+Odyssey+belt+tensioner&tag=${AMAZON_TAG}`} target="_blank" rel="noopener noreferrer" className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:border-cyan-400 transition">
                            <h3 className="font-bold">Tensioner Assembly</h3>
                            <p className="text-sm text-gray-400">Replace with belt if old</p>
                            <p className="text-amber-400 text-sm mt-2">Shop on Amazon →</p>
                        </a>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Need Complete Step-by-Step Instructions?</h2>
                    <p className="text-gray-400 mb-6">Get a detailed AI-generated guide for your specific Odyssey year.</p>
                    <Link href="/" className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-blue-400 transition">
                        Generate Free Repair Guide →
                    </Link>
                </div>
            </section>

            {/* Schema */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "HowTo",
                    "name": "How to Replace Honda Odyssey Serpentine Belt",
                    "description": "Replace the serpentine belt on Honda Odyssey minivan",
                    "totalTime": "PT45M",
                    "step": [
                        { "@type": "HowToStep", "name": "Photo routing", "text": "Take a photo of belt routing" },
                        { "@type": "HowToStep", "name": "Position socket", "text": "Place 19mm socket on tensioner" },
                        { "@type": "HowToStep", "name": "Release tension", "text": "Rotate counterclockwise to release" },
                        { "@type": "HowToStep", "name": "Route belt", "text": "Route new belt per diagram" },
                        { "@type": "HowToStep", "name": "Verify", "text": "Check belt is seated in all grooves" },
                    ]
                })
            }} />
        </div>
    );
}
