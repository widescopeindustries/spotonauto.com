import type { Metadata } from 'next';
import Link from 'next/link';

// High-value SEO page for Hyundai Sonata belt diagram (6 impressions)
export const metadata: Metadata = {
    title: 'Hyundai Sonata Serpentine Belt Diagram | All Years 2006-2024',
    description: 'Find your Hyundai Sonata serpentine belt routing diagram. Covers all generations with belt sizes, tensioner locations, and replacement tips. Save on labor costs.',
    keywords: [
        'hyundai sonata belt diagram',
        'hyundai sonata serpentine belt diagram',
        '2007 hyundai sonata belt diagram',
        'hyundai sonata belt routing',
        'hyundai sonata drive belt diagram',
        'sonata serpentine belt replacement',
    ],
    openGraph: {
        title: 'Hyundai Sonata Serpentine Belt Diagram | All Years',
        description: 'Find belt routing diagrams for any Hyundai Sonata. Free instant lookup.',
        type: 'article',
    },
    alternates: {
        canonical: 'https://spotonauto.com/tools/hyundai-sonata-belt-diagram',
    },
};

const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'antigravity-20';

// Sonata belt data by generation
const SONATA_BELT_DATA = [
    {
        gen: 'NF (5th Gen)',
        years: '2006-2010',
        engines: ['2.4L 4-cyl (Theta II)', '3.3L V6 (Lambda)'],
        beltPart: '4PK890 / 6PK2135',
        tensioner: 'Automatic spring tensioner',
        routing: 'Crankshaft → A/C → Idler → Alternator → Water Pump → Power Steering (if equipped)',
        difficulty: 'Easy',
        time: '30-45 min',
        tips: 'Use a 14mm wrench on tensioner. Rotate clockwise to release tension.',
    },
    {
        gen: 'YF (6th Gen)',
        years: '2011-2014',
        engines: ['2.0L Turbo (Theta II)', '2.4L 4-cyl (Theta II)'],
        beltPart: '6PK2050-2135',
        tensioner: 'Automatic tensioner with wear indicator',
        routing: 'Crankshaft → Tensioner → A/C → Alternator → Water Pump',
        difficulty: 'Easy',
        time: '20-30 min',
        tips: 'Check tensioner wear indicator - if past the marks, replace tensioner too.',
    },
    {
        gen: 'LF (7th Gen)',
        years: '2015-2019',
        engines: ['2.0L Turbo', '2.4L 4-cyl', '1.6L Turbo'],
        beltPart: '6PK1873-2050',
        tensioner: 'Automatic tensioner',
        routing: 'Similar to YF - Crankshaft → Tensioner → A/C → Alternator',
        difficulty: 'Easy-Moderate',
        time: '30-45 min',
        tips: 'May need to remove engine cover for access. 14mm on tensioner.',
    },
    {
        gen: 'DN8 (8th Gen)',
        years: '2020-2024',
        engines: ['2.5L 4-cyl (Smartstream)', '1.6L Turbo', '2.5L Turbo'],
        beltPart: '6PK1850-2050',
        tensioner: 'Automatic tensioner',
        routing: 'Crankshaft → Tensioner → A/C → Alternator → Idler',
        difficulty: 'Moderate',
        time: '45-60 min',
        tips: 'Tight engine bay. Consider using a serpentine belt tool.',
    },
];

export default function HyundaiSonataBeltDiagramPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <section className="py-16 px-4 max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Hyundai Sonata <span className="text-cyan-400">Belt Diagram</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Serpentine belt routing diagrams for all Hyundai Sonata generations.
                        Find your belt size and replacement tips.
                    </p>
                </div>

                {/* Quick Diagram Finder */}
                <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10 mb-12">
                    <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">
                        🔧 Belt Diagram Finder
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/20">
                                    <th className="py-3 px-4">Generation</th>
                                    <th className="py-3 px-4">Years</th>
                                    <th className="py-3 px-4">Engines</th>
                                    <th className="py-3 px-4">Belt Part #</th>
                                    <th className="py-3 px-4">Shop</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SONATA_BELT_DATA.map((gen, i) => (
                                    <tr key={i} className="border-b border-white/10 hover:bg-white/5">
                                        <td className="py-4 px-4 font-semibold">{gen.gen}</td>
                                        <td className="py-4 px-4 text-gray-300">{gen.years}</td>
                                        <td className="py-4 px-4 text-gray-400 text-xs">{gen.engines.join(', ')}</td>
                                        <td className="py-4 px-4 text-cyan-400">{gen.beltPart}</td>
                                        <td className="py-4 px-4">
                                            <a
                                                href={`https://www.amazon.com/s?k=Hyundai+Sonata+${gen.years.split('-')[0]}+serpentine+belt&tag=${AMAZON_TAG}`}
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

                {/* Belt Routing Diagrams */}
                <h2 className="text-2xl font-bold mb-6">📐 Belt Routing By Generation</h2>
                <div className="space-y-6 mb-12">
                    {SONATA_BELT_DATA.map((gen, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-xl text-cyan-400">{gen.gen}</h3>
                                    <p className="text-gray-400">{gen.years}</p>
                                </div>
                                <div className="mt-2 md:mt-0 flex gap-4">
                                    <span className="px-3 py-1 bg-white/10 rounded-full text-sm">⏱️ {gen.time}</span>
                                    <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Difficulty: {gen.difficulty}</span>
                                </div>
                            </div>

                            <div className="bg-black/30 rounded-lg p-4 mb-4">
                                <p className="text-gray-400 text-sm mb-2">Belt Routing:</p>
                                <p className="text-lg font-mono">{gen.routing}</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-400">Tensioner Type:</p>
                                    <p>{gen.tensioner}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Belt Part Number:</p>
                                    <p className="text-cyan-400">{gen.beltPart}</p>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <p className="text-amber-300 text-sm">💡 Pro Tip: {gen.tips}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* General Instructions */}
                <div className="bg-white/5 rounded-xl p-8 border border-white/10 mb-12">
                    <h2 className="text-2xl font-bold mb-6">📋 How to Replace Serpentine Belt</h2>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">1</div>
                            <p><strong>Take a photo</strong> of the current belt routing before removing</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">2</div>
                            <p><strong>Release tension</strong> using a 14mm wrench on the tensioner (rotate clockwise)</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">3</div>
                            <p><strong>Slip the belt off</strong> the tensioner pulley while holding tension released</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">4</div>
                            <p><strong>Route new belt</strong> following the diagram, leaving tensioner for last</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">5</div>
                            <p><strong>Release tensioner</strong> and verify belt is properly seated on all pulleys</p>
                        </div>
                    </div>
                </div>

                {/* Recommended Parts */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-12">
                    <h2 className="text-xl font-bold mb-4">⭐ Recommended Belts</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <a href={`https://www.amazon.com/s?k=Gates+serpentine+belt+Hyundai+Sonata&tag=${AMAZON_TAG}`} target="_blank" rel="noopener noreferrer" className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:border-cyan-400 transition">
                            <h3 className="font-bold">Gates K-Series</h3>
                            <p className="text-sm text-gray-400">OEM quality, EPDM rubber</p>
                            <p className="text-amber-400 text-sm mt-2">Shop on Amazon →</p>
                        </a>
                        <a href={`https://www.amazon.com/s?k=Continental+serpentine+belt+Hyundai&tag=${AMAZON_TAG}`} target="_blank" rel="noopener noreferrer" className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:border-cyan-400 transition">
                            <h3 className="font-bold">Continental Elite</h3>
                            <p className="text-sm text-gray-400">Premium aftermarket</p>
                            <p className="text-amber-400 text-sm mt-2">Shop on Amazon →</p>
                        </a>
                        <a href={`https://www.amazon.com/s?k=Hyundai+Sonata+belt+tensioner+kit&tag=${AMAZON_TAG}`} target="_blank" rel="noopener noreferrer" className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:border-cyan-400 transition">
                            <h3 className="font-bold">Belt + Tensioner Kit</h3>
                            <p className="text-sm text-gray-400">Replace both for reliability</p>
                            <p className="text-amber-400 text-sm mt-2">Shop on Amazon →</p>
                        </a>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Need Step-by-Step Instructions?</h2>
                    <p className="text-gray-400 mb-6">Get a complete AI-generated guide for your specific Sonata year.</p>
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
                    "name": "How to Replace Hyundai Sonata Serpentine Belt",
                    "description": "Step-by-step serpentine belt replacement guide for Hyundai Sonata",
                    "totalTime": "PT45M",
                    "step": [
                        { "@type": "HowToStep", "name": "Photo routing", "text": "Take a photo of belt routing before removal" },
                        { "@type": "HowToStep", "name": "Release tension", "text": "Use 14mm wrench on tensioner, rotate clockwise" },
                        { "@type": "HowToStep", "name": "Remove belt", "text": "Slip belt off tensioner pulley" },
                        { "@type": "HowToStep", "name": "Route new belt", "text": "Follow diagram, leave tensioner for last" },
                        { "@type": "HowToStep", "name": "Verify", "text": "Release tensioner and check belt seating" },
                    ]
                })
            }} />
        </div>
    );
}
