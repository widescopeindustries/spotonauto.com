import { Metadata } from 'next';
import Link from 'next/link';
import { ShoppingCartIcon, WrenchIcon, TruckIcon, TagIcon, StarIcon } from '@/components/Icons';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';
import PartsVehiclePicker from './PartsVehiclePicker';

export const metadata: Metadata = {
    title: 'Auto Parts | Shop Amazon & More | SpotOn Auto',
    description: 'Compare prices on OEM and aftermarket auto parts from Amazon. Find the right fit for your exact year, make, and model with fast shipping and verified compatibility.',
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
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'SpotOnAuto - Free DIY Auto Repair Guides' }],
    },
    alternates: {
        canonical: 'https://spotonauto.com/parts'
    }
};

// Detailed parts categories with search queries
const PARTS_CATEGORIES = [
    {
        name: 'Brakes',
        parts: ['Brake Pads', 'Brake Rotors', 'Brake Calipers', 'Brake Lines', 'Brake Fluid'],
    },
    {
        name: 'Engine',
        parts: ['Oil Filter', 'Air Filter', 'Spark Plugs', 'Timing Belt', 'Alternator'],
    },
    {
        name: 'Suspension',
        parts: ['Struts', 'Shocks', 'Control Arms', 'Ball Joints', 'Tie Rods'],
    },
    {
        name: 'Electrical',
        parts: ['Battery', 'Starter', 'Alternator', 'Ignition Coil', 'Sensors'],
    },
    {
        name: 'Cooling',
        parts: ['Radiator', 'Water Pump', 'Thermostat', 'Coolant', 'Radiator Hose'],
    },
    {
        name: 'Fluids & Filters',
        parts: ['Motor Oil', 'Transmission Fluid', 'Oil Filter', 'Air Filter', 'Cabin Filter'],
    }
];

export default function PartsPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            {/* Hero */}
            <section className="text-center mb-12 pt-12">
                <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
                    <span className="text-cyan-400">Shop</span> Auto Parts
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Find parts for your vehicle. We search Amazon for the best prices on OEM and aftermarket parts.
                </p>
            </section>

            {/* Vehicle Picker + Common Parts Grid (client component) */}
            <section className="mb-16 max-w-4xl mx-auto">
                <PartsVehiclePicker />
            </section>

            {/* Detailed Parts Categories */}
            <section className="mb-16">
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
                            <h3 className="text-xl font-bold text-white mb-4">{category.name}</h3>
                            <ul className="space-y-2">
                                {category.parts.map((part) => (
                                    <li key={part}>
                                        <a
                                            href={buildAmazonSearchUrl(part)}
                                            target="_blank"
                                            rel="noopener noreferrer sponsored"
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group"
                                        >
                                            <span className="text-gray-300 group-hover:text-white transition-colors">{part}</span>
                                            <ShoppingCartIcon className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* Why Shop */}
            <section className="mb-16">
                <div className="max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <TagIcon className="w-8 h-8 text-amber-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Great Prices</h3>
                            <p className="text-gray-400 text-sm">
                                Competitive prices on millions of auto parts and accessories.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <StarIcon className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Huge Selection</h3>
                            <p className="text-gray-400 text-sm">
                                OEM and aftermarket parts for any vehicle.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <TruckIcon className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Fast Shipping</h3>
                            <p className="text-gray-400 text-sm">
                                Amazon Prime shipping on most parts.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="glass rounded-2xl p-8 text-center mb-12">
                <h2 className="text-xl font-display font-bold text-white mb-3">
                    Not Sure What Parts You Need?
                </h2>
                <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                    Our AI diagnoses your car problem and generates the exact parts list for your vehicle.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-display font-bold tracking-wider hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                >
                    <WrenchIcon className="w-5 h-5" />
                    Start AI Diagnosis
                </Link>
            </section>

            {/* Subtle affiliate disclosure */}
            <p className="text-xs text-gray-600 text-center">
                As an Amazon Associate, SpotOnAuto earns from qualifying purchases at no additional cost to you.
            </p>
        </div>
    );
}
