import type { Metadata } from 'next';
import Link from 'next/link';
import { getToolPagesForType, TOOL_TYPE_META, type ToolType } from '@/data/tools-pages';

export const metadata: Metadata = {
    title: 'Free Auto Repair Tools | SpotOnAuto',
    description: 'Free DIY auto repair tools: oil type lookup, spark plug gap finder, serpentine belt diagrams, battery location guides, and more. No signup required, instant results.',
    keywords: [
        'free auto repair tools',
        'car repair calculator',
        'vin decoder',
        'torque specs lookup',
        'maintenance schedule',
        'repair cost estimator',
    ],
    openGraph: {
        title: 'Free Auto Repair Tools | SpotOnAuto',
        description: 'Save money with our free DIY auto repair tools. No signup required.',
        type: 'website',
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'SpotOnAuto - Free DIY Auto Repair Guides' }],
    },
    alternates: {
        canonical: 'https://spotonauto.com/tools',
    },
};

const TOOLS = [
    {
        category: 'Repair Guides',
        icon: '📖',
        tools: [
            {
                name: 'AI Repair Guide Generator',
                description: 'Get step-by-step repair instructions for any vehicle and any repair',
                href: '/',
                badge: 'Most Popular',
                badgeColor: 'bg-amber-500',
            },
            {
                name: 'BMW X3 Headlight Bulb Guide',
                description: 'Complete headlight bulb sizes and replacement guide for all X3 years',
                href: '/tools/bmw-x3-headlight-bulb',
            },
            {
                name: 'Hyundai Sonata Belt Diagram',
                description: 'Serpentine belt routing diagrams and sizes for all Sonata years',
                href: '/tools/hyundai-sonata-belt-diagram',
            },
            {
                name: 'Nissan Sentra Thermostat Location',
                description: 'Find where the thermostat is located on any Sentra year',
                href: '/tools/nissan-sentra-thermostat-location',
            },
            {
                name: 'Honda Odyssey Serpentine Belt',
                description: 'Belt routing diagrams and part numbers for Odyssey minivans',
                href: '/tools/honda-odyssey-serpentine-belt',
            },
            {
                name: 'BMW X3 Battery Location',
                description: 'Find your X3 battery location, jump points, and replacement specs',
                href: '/tools/bmw-x3-battery-location',
            },
        ],
    },
    {
        category: 'Diagnostic Tools',
        icon: '🔍',
        tools: [
            {
                name: 'DTC Code Lookup',
                description: 'Decode any check engine light code (P0xxx, B0xxx, C0xxx, U0xxx)',
                href: '/codes',
                badge: 'AI Powered',
                badgeColor: 'bg-purple-500',
            },
            {
                name: 'AI Diagnostic Chat',
                description: 'Describe your car problem and get AI-powered diagnosis',
                href: '/diagnose',
            },
            {
                name: 'Best TOPDON Scanner Guide',
                description: 'Find the right OBD2 scanner for your car — interactive quiz + full comparison',
                href: '/tools/best-topdon-scanner',
                badge: 'New',
                badgeColor: 'bg-orange-500',
            },
            {
                name: 'TOPDON Scanner Comparison',
                description: 'Every TOPDON scanner compared side-by-side — features, prices, and our picks',
                href: '/tools/topdon-scanner-comparison',
            },
            {
                name: 'TOPDON Battery Tester Guide',
                description: 'BT50 vs BT100 vs BT200 vs BT600 — which battery tester do you need?',
                href: '/tools/topdon-battery-tester',
            },
        ],
    },
    {
        category: 'Vehicle Specs',
        icon: '📊',
        tools: [
            {
                name: 'Serpentine Belt Diagrams',
                description: 'Find belt routing diagrams for any vehicle',
                href: '/tools/type/serpentine-belt',
                badge: 'Live',
                badgeColor: 'bg-emerald-600',
            },
            {
                name: 'Fluid Capacity Lookup',
                description: 'Oil capacity, coolant, transmission fluid specs',
                href: '/tools/type/fluid-capacity',
                badge: 'Live',
                badgeColor: 'bg-emerald-600',
            },
            {
                name: 'Torque Specs Database',
                description: 'Find torque specifications for any bolt',
                href: '/repair',
                badge: 'In Guides',
                badgeColor: 'bg-cyan-700',
            },
        ],
    },
];

const POPULAR_SEARCHES = [
    { query: 'toyota camry oil type', href: '/tools/toyota-camry-oil-type' },
    { query: 'honda civic battery location', href: '/tools/honda-civic-battery-location' },
    { query: 'ford f150 tire size', href: '/tools/ford-f-150-tire-size' },
    { query: 'bmw x3 battery location', href: '/tools/bmw-x3-battery-location' },
    { query: 'jeep wrangler tire size', href: '/tools/jeep-wrangler-tire-size' },
    { query: 'toyota rav4 oil type', href: '/tools/toyota-rav4-oil-type' },
    { query: 'honda crv oil type', href: '/tools/honda-cr-v-oil-type' },
    { query: 'check engine light p0300', href: '/diagnose' },
];

export default function ToolsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            {/* Hero */}
            <section className="py-16 px-4 max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Free Auto Repair <span className="text-cyan-400">Tools</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Solve your car problems instantly. No signup required.
                        <span className="text-white font-semibold"> Save $100-500</span> on every repair.
                    </p>
                </div>

                {/* Main Tool CTA */}
                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl p-8 border border-cyan-500/30 mb-12 text-center">
                    <h2 className="text-3xl font-bold mb-4">🔧 AI Repair Guide Generator</h2>
                    <p className="text-gray-300 mb-6 max-w-lg mx-auto">
                        Enter your vehicle and repair, get instant step-by-step instructions,
                        parts lists, and tool requirements.
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg rounded-lg hover:from-cyan-400 hover:to-blue-400 transition shadow-lg shadow-cyan-500/25"
                    >
                        Generate Free Guide →
                    </Link>
                </div>

                {/* Tools Grid */}
                {TOOLS.map((category, i) => (
                    <div key={i} className="mb-12">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <span>{category.icon}</span>
                            {category.category}
                        </h2>
                        <div className="grid md:grid-cols-3 gap-4">
                            {category.tools.map((tool, j) => (
                                <Link
                                    key={j}
                                    href={tool.href}
                                    className="block bg-white/5 rounded-xl p-6 border border-white/10 hover:border-cyan-400 hover:bg-white/10 transition group"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-lg group-hover:text-cyan-400 transition">
                                            {tool.name}
                                        </h3>
                                        {tool.badge && (
                                            <span className={`px-2 py-1 ${tool.badgeColor} text-white text-xs font-bold rounded`}>
                                                {tool.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-400 text-sm">{tool.description}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Vehicle Spec Guides — programmatic pages */}
                {Object.entries(TOOL_TYPE_META).map(([type, meta]) => {
                    const typedToolType = type as ToolType;
                    const pages = getToolPagesForType(typedToolType);
                    if (pages.length === 0) return null;
                    const featuredPages = pages.slice(0, 36);
                    return (
                        <div key={type} className="mb-12">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <span>{meta.icon}</span>
                                {meta.label} Guides
                                <Link
                                    href={`/tools/type/${type}`}
                                    className="ml-auto text-sm text-cyan-400 hover:underline font-normal"
                                >
                                    View all {pages.length} →
                                </Link>
                            </h2>
                            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {featuredPages.map(tp => (
                                    <Link
                                        key={tp.slug}
                                        href={`/tools/${tp.slug}`}
                                        className="block bg-white/5 rounded-xl p-4 border border-white/10 hover:border-cyan-400 hover:bg-white/10 transition group"
                                    >
                                        <h3 className="font-semibold text-sm group-hover:text-cyan-400 transition">
                                            {tp.make} {tp.model}
                                        </h3>
                                        <p className="text-gray-500 text-xs mt-1">{meta.label}</p>
                                    </Link>
                                ))}
                                {pages.length > featuredPages.length && (
                                    <Link
                                        href={`/tools/type/${type}`}
                                        className="block bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/30 hover:bg-cyan-500/20 transition group"
                                    >
                                        <h3 className="font-semibold text-sm text-cyan-300 group-hover:text-cyan-200 transition">
                                            Browse all {meta.label} pages
                                        </h3>
                                        <p className="text-cyan-500 text-xs mt-1">{pages.length} total pages →</p>
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Popular Searches */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-12">
                    <h2 className="text-xl font-bold mb-4">🔥 Popular Searches</h2>
                    <div className="flex flex-wrap gap-3">
                        {POPULAR_SEARCHES.map((search, i) => (
                            <Link
                                key={i}
                                href={search.href}
                                className="px-4 py-2 bg-white/10 rounded-full text-sm hover:bg-cyan-500/20 hover:text-cyan-400 transition"
                            >
                                {search.query}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Value Proposition */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                        <div className="text-4xl mb-3">💰</div>
                        <h3 className="font-bold text-lg mb-2">Save Money</h3>
                        <p className="text-gray-400 text-sm">
                            Average savings of $200-500 per repair vs shop prices
                        </p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                        <div className="text-4xl mb-3">⚡</div>
                        <h3 className="font-bold text-lg mb-2">Instant Results</h3>
                        <p className="text-gray-400 text-sm">
                            AI-powered guides generated in seconds, not hours of research
                        </p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                        <div className="text-4xl mb-3">🔧</div>
                        <h3 className="font-bold text-lg mb-2">Any Vehicle</h3>
                        <p className="text-gray-400 text-sm">
                            Works for any make, model, and year. Any repair task.
                        </p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-8">How It Works</h2>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold mb-3">1</div>
                            <p className="font-semibold">Enter your vehicle</p>
                            <p className="text-gray-400 text-sm">Year, make, model</p>
                        </div>
                        <div className="hidden md:block text-4xl text-gray-600">→</div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold mb-3">2</div>
                            <p className="font-semibold">Describe the repair</p>
                            <p className="text-gray-400 text-sm">Or enter a DTC code</p>
                        </div>
                        <div className="hidden md:block text-4xl text-gray-600">→</div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold mb-3">3</div>
                            <p className="font-semibold">Get your guide</p>
                            <p className="text-gray-400 text-sm">+ parts links</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
