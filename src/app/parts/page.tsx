import { Metadata } from 'next';
import Link from 'next/link';
import { ShoppingCartIcon, WrenchIcon, TruckIcon, MapPinIcon, TagIcon, StarIcon, CheckCircleIcon } from '@/components/Icons';

export const metadata: Metadata = {
    title: 'Auto Parts | Shop Amazon & More | SpotOn Auto',
    description: 'Find the best prices on auto parts. Shop Amazon for OEM and aftermarket parts for all makes and models. Fast shipping available.',
    keywords: [
        'auto parts',
        'car parts',
        'OEM parts',
        'aftermarket parts',
        'brake pads',
        'oil filter',
        'alternator',
        'spark plugs',
        'amazon auto parts'
    ],
    openGraph: {
        title: 'Auto Parts - Shop Online | SpotOn Auto',
        description: 'Find auto parts prices from Amazon. Find the best deals on OEM and aftermarket parts.',
        type: 'website',
        url: 'https://spotonauto.com/parts',
    },
    alternates: {
        canonical: 'https://spotonauto.com/parts'
    }
};

const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'aiautorepair-20';

// Popular parts categories with search queries
const PARTS_CATEGORIES = [
    {
        name: 'Brakes',
        icon: '🛑',
        parts: ['Brake Pads', 'Brake Rotors', 'Brake Calipers', 'Brake Lines', 'Brake Fluid'],
        color: 'from-red-500 to-orange-500'
    },
    {
        name: 'Engine',
        icon: '⚙️',
        parts: ['Oil Filter', 'Air Filter', 'Spark Plugs', 'Timing Belt', 'Alternator'],
        color: 'from-blue-500 to-cyan-500'
    },
    {
        name: 'Suspension',
        icon: '🔧',
        parts: ['Struts', 'Shocks', 'Control Arms', 'Ball Joints', 'Tie Rods'],
        color: 'from-purple-500 to-pink-500'
    },
    {
        name: 'Electrical',
        icon: '⚡',
        parts: ['Battery', 'Starter', 'Alternator', 'Ignition Coil', 'Sensors'],
        color: 'from-yellow-500 to-amber-500'
    },
    {
        name: 'Cooling',
        icon: '❄️',
        parts: ['Radiator', 'Water Pump', 'Thermostat', 'Coolant', 'Radiator Hose'],
        color: 'from-cyan-500 to-blue-500'
    },
    {
        name: 'Fluids & Filters',
        icon: '🛢️',
        parts: ['Motor Oil', 'Transmission Fluid', 'Oil Filter', 'Air Filter', 'Cabin Filter'],
        color: 'from-green-500 to-emerald-500'
    }
];

// Retailer info
const RETAILERS = [
    {
        name: 'Amazon',
        logo: '📦',
        tagline: 'Fast Prime shipping',
        benefit: '2-day delivery on most parts',
        color: 'bg-amber-500',
        url: `https://www.amazon.com/s?k=auto+parts&i=automotive&tag=${AMAZON_TAG}`
    }
];

export default function PartsPage() {
    return (
        <div className="min-h-screen bg-deep-space">
            {/* Hero */}
            <section className="relative py-20 overflow-hidden">
                <div className="absolute inset-0 bg-cyber-grid bg-grid-sm opacity-10"></div>
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-brand-cyan/20 to-transparent blur-3xl rounded-full opacity-30"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight mb-6">
                            <span className="text-brand-cyan">Shop</span> Auto Parts
                        </h1>
                        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                            Find the best deals on OEM and aftermarket parts for your vehicle on Amazon.
                        </p>

                        {/* Quick search CTA */}
                        <Link
                            href="/"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-brand-cyan to-blue-500 text-black font-black text-lg rounded-xl hover:scale-105 transition-transform shadow-glow-cyan"
                        >
                            <WrenchIcon className="w-6 h-6" />
                            Get Parts List for Your Repair
                        </Link>
                        <p className="text-sm text-gray-500 mt-4">
                            Enter your vehicle + repair task to see exact parts needed
                        </p>
                    </div>
                </div>
            </section>

            {/* Retailer Cards */}
            <section className="py-16 bg-black/30">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold text-white text-center mb-10 uppercase tracking-widest">
                        Shop from Trusted Retailers
                    </h2>

                    <div className="flex justify-center">
                        {RETAILERS.map((retailer) => (
                            <a
                                key={retailer.name}
                                href={retailer.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group bg-white/[0.02] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] hover:border-white/20 transition-all hover:scale-105 max-w-md w-full"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="text-4xl">{retailer.logo}</span>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{retailer.name}</h3>
                                        <p className="text-sm text-gray-400">{retailer.tagline}</p>
                                    </div>
                                </div>
                                <p className="text-gray-300 mb-4">{retailer.benefit}</p>
                                <div className={`inline-flex items-center gap-2 px-4 py-2 ${retailer.color} text-white font-bold rounded-lg`}>
                                    <ShoppingCartIcon className="w-4 h-4" />
                                    Shop {retailer.name}
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Parts Categories */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold text-white text-center mb-4 uppercase tracking-widest">
                        Browse by Category
                    </h2>
                    <p className="text-center text-gray-400 mb-10 max-w-2xl mx-auto">
                        Click any part to shop on Amazon
                    </p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {PARTS_CATEGORIES.map((category) => (
                            <div
                                key={category.name}
                                className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.04] transition-all"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-3xl">{category.icon}</span>
                                    <h3 className="text-xl font-bold text-white">{category.name}</h3>
                                </div>
                                <ul className="space-y-2">
                                    {category.parts.map((part) => (
                                        <li key={part}>
                                            <a
                                                href={`https://www.amazon.com/s?k=${encodeURIComponent(part)}&i=automotive&tag=${AMAZON_TAG}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group"
                                            >
                                                <span className="text-gray-300 group-hover:text-white transition-colors">{part}</span>
                                                <ShoppingCartIcon className="w-4 h-4 text-gray-600 group-hover:text-brand-cyan transition-colors" />
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Compare Prices */}
            <section className="py-16 bg-black/30">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-2xl font-bold text-white mb-10 uppercase tracking-widest">
                            Why Shop with Us?
                        </h2>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                                    <TagIcon className="w-8 h-8 text-amber-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Great Prices</h3>
                                <p className="text-gray-400 text-sm">
                                    Find competitive prices on millions of auto parts and accessories.
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <StarIcon className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Huge Selection</h3>
                                <p className="text-gray-400 text-sm">
                                    Access a vast inventory of OEM and aftermarket parts for any vehicle.
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <TruckIcon className="w-8 h-8 text-purple-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Fast Shipping</h3>
                                <p className="text-gray-400 text-sm">
                                    Get your parts quickly with Amazon Prime shipping options.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-brand-cyan/10 to-neon-purple/10 rounded-3xl p-10 border border-white/10">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Not Sure What Parts You Need?
                        </h2>
                        <p className="text-gray-300 mb-8">
                            Our AI diagnoses your car problem and generates the exact parts list.
                            Then compare prices across all retailers with one click.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-brand-cyan to-blue-500 text-black font-black text-lg rounded-xl hover:scale-105 transition-transform"
                        >
                            <WrenchIcon className="w-6 h-6" />
                            Start AI Diagnosis
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
