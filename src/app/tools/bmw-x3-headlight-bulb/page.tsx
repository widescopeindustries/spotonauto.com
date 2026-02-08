import type { Metadata } from 'next';
import Link from 'next/link';

// High-value SEO page for BMW X3 headlight queries (14 impressions in Search Console)
export const metadata: Metadata = {
    title: 'BMW X3 Headlight Bulb Replacement Guide | All Years 2004-2024',
    description: 'Complete guide to replacing headlight bulbs on any BMW X3. Step-by-step instructions, bulb sizes, and tools needed. Save $150+ vs dealer prices.',
    keywords: [
        'bmw x3 headlight bulb replacement',
        'bmw x3 change headlight bulb',
        'bmw x3 headlight bulb size',
        'how to replace bmw x3 headlight',
        'bmw x3 low beam bulb',
        'bmw x3 high beam replacement',
    ],
    openGraph: {
        title: 'BMW X3 Headlight Bulb Replacement | Complete DIY Guide',
        description: 'Replace your BMW X3 headlight bulbs yourself and save $150+. Works for all X3 years.',
        type: 'article',
    },
    alternates: {
        canonical: 'https://spotonauto.com/tools/bmw-x3-headlight-bulb',
    },
};

// BMW X3 bulb data by generation
const X3_GENERATIONS = [
    {
        gen: 'E83 (1st Gen)',
        years: '2004-2010',
        lowBeam: 'H7',
        highBeam: 'H7',
        fogLight: 'H11',
        difficulty: 'Moderate',
        time: '30-45 min',
        notes: 'Access through wheel well or engine bay. Remove splash guard for easier access.',
    },
    {
        gen: 'F25 (2nd Gen)',
        years: '2011-2017',
        lowBeam: 'H7 (or LED on later models)',
        highBeam: 'H7',
        fogLight: 'H8',
        difficulty: 'Moderate-Hard',
        time: '45-60 min',
        notes: 'Tight engine bay. May need to remove air intake for driver side. Consider LED upgrade.',
    },
    {
        gen: 'G01 (3rd Gen)',
        years: '2018-2024',
        lowBeam: 'LED (not replaceable)',
        highBeam: 'LED (not replaceable)',
        fogLight: 'LED or H8/H11',
        difficulty: 'Easy (fog) / Dealer (LED)',
        time: 'Varies',
        notes: 'LED headlights are sealed units - require dealer or full assembly replacement.',
    },
];

const TOOLS_NEEDED = [
    'T25 Torx screwdriver',
    'Flathead screwdriver',
    'Nitrile gloves (don\'t touch bulb glass)',
    'Flashlight',
    'Trim removal tool (optional)',
];

const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'antigravity-20';

export default function BMWX3HeadlightPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            {/* Hero */}
            <section className="py-16 px-4 max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        BMW X3 Headlight Bulb <span className="text-cyan-400">Replacement Guide</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Complete DIY guide for all BMW X3 generations (2004-2024).
                        Save $150-300 vs dealer prices.
                    </p>
                </div>

                {/* Quick Tool: Find Your Bulb */}
                <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10 mb-12">
                    <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">
                        🔧 Quick Tool: Find Your X3 Bulb Size
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/20">
                                    <th className="py-3 px-4">Generation</th>
                                    <th className="py-3 px-4">Years</th>
                                    <th className="py-3 px-4">Low Beam</th>
                                    <th className="py-3 px-4">High Beam</th>
                                    <th className="py-3 px-4">Fog Light</th>
                                    <th className="py-3 px-4">Shop</th>
                                </tr>
                            </thead>
                            <tbody>
                                {X3_GENERATIONS.map((gen, i) => (
                                    <tr key={i} className="border-b border-white/10 hover:bg-white/5">
                                        <td className="py-4 px-4 font-semibold">{gen.gen}</td>
                                        <td className="py-4 px-4 text-gray-300">{gen.years}</td>
                                        <td className="py-4 px-4 text-cyan-400">{gen.lowBeam}</td>
                                        <td className="py-4 px-4 text-cyan-400">{gen.highBeam}</td>
                                        <td className="py-4 px-4 text-gray-300">{gen.fogLight}</td>
                                        <td className="py-4 px-4">
                                            <a
                                                href={`https://www.amazon.com/s?k=BMW+X3+${gen.years.split('-')[0]}+headlight+bulb&tag=${AMAZON_TAG}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-amber-500 text-black text-sm font-bold rounded hover:bg-amber-400 transition inline-block"
                                            >
                                                Find Bulbs
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Difficulty & Time */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {X3_GENERATIONS.map((gen, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <h3 className="font-bold text-lg mb-2">{gen.gen}</h3>
                            <p className="text-gray-400 text-sm mb-4">{gen.years}</p>
                            <div className="space-y-2 text-sm">
                                <p><span className="text-gray-400">Difficulty:</span> <span className="text-cyan-400">{gen.difficulty}</span></p>
                                <p><span className="text-gray-400">Time:</span> <span className="text-white">{gen.time}</span></p>
                                <p className="text-gray-500 text-xs mt-3">{gen.notes}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tools Needed */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-12">
                    <h2 className="text-xl font-bold mb-4">🛠️ Tools Needed</h2>
                    <div className="flex flex-wrap gap-3">
                        {TOOLS_NEEDED.map((tool, i) => (
                            <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-sm">
                                {tool}
                            </span>
                        ))}
                    </div>
                    <a
                        href={`https://www.amazon.com/s?k=BMW+headlight+replacement+tool+kit&tag=${AMAZON_TAG}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-4 text-cyan-400 hover:underline text-sm"
                    >
                        Shop complete tool kits →
                    </a>
                </div>

                {/* Step by Step Instructions */}
                <div className="bg-white/5 rounded-xl p-8 border border-white/10 mb-12">
                    <h2 className="text-2xl font-bold mb-6">📋 Step-by-Step Instructions</h2>

                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                            <div>
                                <h3 className="font-bold text-lg">Open the Hood & Locate Housing</h3>
                                <p className="text-gray-400">Open your hood and locate the headlight housing behind the headlight assembly. On E83 models, you may need to access through the wheel well.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                            <div>
                                <h3 className="font-bold text-lg">Remove the Dust Cover</h3>
                                <p className="text-gray-400">Twist the rubber dust cover counterclockwise to remove it. Set aside in a clean location.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                            <div>
                                <h3 className="font-bold text-lg">Disconnect the Electrical Connector</h3>
                                <p className="text-gray-400">Press the release tab and gently pull the connector off the bulb. Don't force it.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0">4</div>
                            <div>
                                <h3 className="font-bold text-lg">Remove the Old Bulb</h3>
                                <p className="text-gray-400">Release the metal clip (if present) by pressing down and swinging aside. Pull the old bulb straight out.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0">5</div>
                            <div>
                                <h3 className="font-bold text-lg">Install New Bulb</h3>
                                <p className="text-gray-400"><strong>⚠️ Don't touch the glass!</strong> Use gloves. Insert the new bulb, ensuring tabs align. Secure the clip.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center font-bold shrink-0">6</div>
                            <div>
                                <h3 className="font-bold text-lg">Reconnect & Test</h3>
                                <p className="text-gray-400">Reconnect the electrical connector, replace the dust cover, and test your lights before closing the hood.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pro Tips */}
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-6 border border-amber-500/30 mb-12">
                    <h2 className="text-xl font-bold text-amber-400 mb-4">💡 Pro Tips</h2>
                    <ul className="space-y-2 text-gray-300">
                        <li>• Replace both bulbs at the same time - if one failed, the other is likely close behind</li>
                        <li>• Consider upgrading to LED for brighter, longer-lasting light (check local laws)</li>
                        <li>• Take a photo before disconnecting anything so you remember the orientation</li>
                        <li>• If you have adaptive headlights, bulb replacement may require coding</li>
                    </ul>
                </div>

                {/* Recommended Bulbs */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-12">
                    <h2 className="text-xl font-bold mb-4">⭐ Recommended Bulbs</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <a
                            href={`https://www.amazon.com/s?k=Philips+H7+headlight+bulb&tag=${AMAZON_TAG}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:border-cyan-400 transition"
                        >
                            <h3 className="font-bold">Philips X-tremeVision</h3>
                            <p className="text-sm text-gray-400">OEM quality, 130% brighter</p>
                            <p className="text-amber-400 text-sm mt-2">Shop on Amazon →</p>
                        </a>
                        <a
                            href={`https://www.amazon.com/s?k=Sylvania+Silverstar+H7&tag=${AMAZON_TAG}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:border-cyan-400 transition"
                        >
                            <h3 className="font-bold">Sylvania SilverStar</h3>
                            <p className="text-sm text-gray-400">Whiter light, great visibility</p>
                            <p className="text-amber-400 text-sm mt-2">Shop on Amazon →</p>
                        </a>
                        <a
                            href={`https://www.amazon.com/s?k=BMW+X3+LED+headlight+bulb+H7&tag=${AMAZON_TAG}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:border-cyan-400 transition"
                        >
                            <h3 className="font-bold">LED Upgrade Kit</h3>
                            <p className="text-sm text-gray-400">Brightest option, long lasting</p>
                            <p className="text-amber-400 text-sm mt-2">Shop on Amazon →</p>
                        </a>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Need a Guide for Your Specific Year?</h2>
                    <p className="text-gray-400 mb-6">Get a personalized AI-generated repair guide for your exact BMW X3.</p>
                    <Link
                        href="/"
                        className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-blue-400 transition"
                    >
                        Generate Free Repair Guide →
                    </Link>
                </div>
            </section>

            {/* Schema Markup */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "HowTo",
                        "name": "How to Replace BMW X3 Headlight Bulbs",
                        "description": "Step-by-step guide to replacing headlight bulbs on BMW X3 (2004-2024)",
                        "totalTime": "PT45M",
                        "supply": TOOLS_NEEDED.map(tool => ({ "@type": "HowToSupply", "name": tool })),
                        "step": [
                            { "@type": "HowToStep", "name": "Open hood and locate housing", "text": "Open your hood and locate the headlight housing." },
                            { "@type": "HowToStep", "name": "Remove dust cover", "text": "Twist the rubber dust cover counterclockwise to remove." },
                            { "@type": "HowToStep", "name": "Disconnect connector", "text": "Press release tab and pull connector off bulb." },
                            { "@type": "HowToStep", "name": "Remove old bulb", "text": "Release metal clip and pull old bulb out." },
                            { "@type": "HowToStep", "name": "Install new bulb", "text": "Insert new bulb with gloves, don't touch glass." },
                            { "@type": "HowToStep", "name": "Test lights", "text": "Reconnect and test before closing hood." },
                        ]
                    })
                }}
            />
        </div>
    );
}
