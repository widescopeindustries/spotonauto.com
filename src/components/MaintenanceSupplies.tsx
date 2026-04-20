import React from 'react';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';
import AffiliateLink from '@/components/AffiliateLink';
import Image from 'next/image';

interface SupplyItem {
    name: string;
    description: string;
    icon: string;
    searchQuery: string;
    imageSrc: string;
    imageAlt: string;
}

const SUPPLIES_BY_TYPE: Record<string, SupplyItem[]> = {
    'oil-type': [
        { name: 'Premium Full Synthetic Oil', description: 'Match the viscosity (e.g. 0W-20) to your vehicle spec.', icon: '🛢️', searchQuery: 'full synthetic motor oil', imageSrc: '/images/maintenance/motor-oil.webp', imageAlt: 'Motor oil being poured through a funnel' },
        { name: 'Oil Filter', description: 'High-efficiency filter to match your specific engine model.', icon: '🔍', searchQuery: 'oil filter', imageSrc: '/images/maintenance/oil-filter.webp', imageAlt: 'Automotive oil filter' },
        { name: 'Oil Drain Pan', description: 'Low-profile pan for easy oil collection and disposal.', icon: '📥', searchQuery: 'oil drain pan', imageSrc: '/images/maintenance/oil-drain-pan.webp', imageAlt: 'Oil drain pan under a vehicle' },
        { name: 'Filter Wrench', description: 'Adjustable or size-specific wrench to remove stuck filters.', icon: '🔧', searchQuery: 'oil filter wrench', imageSrc: '/images/maintenance/filter-wrench.webp', imageAlt: 'Chain-style oil filter wrench' },
        { name: 'Funnel Set', description: 'Prevent spills when refilling your engine oil.', icon: '🌪️', searchQuery: 'automotive funnel', imageSrc: '/images/maintenance/funnel.webp', imageAlt: 'Plastic funnel used for fluid fills' },
    ],
    'spark-plug-type': [
        { name: 'Iridium Spark Plugs', description: 'Long-lasting performance plugs for modern engines.', icon: '⚡', searchQuery: 'iridium spark plugs', imageSrc: '/images/maintenance/spark-plug.webp', imageAlt: 'Set of spark plugs' },
        { name: 'Spark Plug Socket', description: 'Magnetic or rubber-insert socket to prevent damage.', icon: '🔌', searchQuery: 'spark plug socket set', imageSrc: '/images/maintenance/socket-set.webp', imageAlt: 'Socket tool set for spark plug service' },
        { name: 'Gap Gauge', description: 'Ensure your plugs are set to the exact factory spec.', icon: '📏', searchQuery: 'spark plug gap tool', imageSrc: '/images/maintenance/gap-gauge.webp', imageAlt: 'Feeler gauge for spark plug gap checks' },
        { name: 'Torque Wrench', description: 'Crucial for tightening plugs without stripping threads.', icon: '🔧', searchQuery: '3/8 inch torque wrench', imageSrc: '/images/maintenance/torque-wrench.webp', imageAlt: 'Torque wrench for precise tightening' },
        { name: 'Anti-Seize Lubricant', description: 'Prevents plugs from welding to the cylinder head.', icon: '🧴', searchQuery: 'anti-seize lubricant', imageSrc: '/images/maintenance/socket-set.webp', imageAlt: 'Mechanic tool set for plug service' },
    ],
    'battery-location': [
        { name: 'Replacement Battery', description: 'Match your Group Size (e.g. H6, 35) and CCA rating.', icon: '🔋', searchQuery: 'automotive battery', imageSrc: '/images/maintenance/battery.webp', imageAlt: 'Car battery replacement in progress' },
        { name: 'Terminal Cleaner', description: 'Removes corrosion for a reliable electrical connection.', icon: '🧹', searchQuery: 'battery terminal cleaner', imageSrc: '/images/maintenance/battery.webp', imageAlt: 'Vehicle battery and battery terminals' },
        { name: 'Memory Saver', description: 'Keeps your car settings while the battery is disconnected.', icon: '💾', searchQuery: 'obd2 memory saver', imageSrc: '/images/maintenance/obd-adapter.webp', imageAlt: 'OBD adapter used for vehicle memory and diagnostics' },
        { name: 'Battery Carrier', description: 'Makes lifting heavy batteries much safer and easier.', icon: '🏗️', searchQuery: 'battery carrier tool', imageSrc: '/images/maintenance/battery.webp', imageAlt: 'Automotive battery service area' },
    ],
    'serpentine-belt': [
        { name: 'Serpentine Belt', description: 'High-quality EPDM belt for quiet, reliable operation.', icon: '⚙️', searchQuery: 'serpentine belt', imageSrc: '/images/maintenance/serpentine-belt.webp', imageAlt: 'Engine front with serpentine belt routing' },
        { name: 'Belt Tensioner Tool', description: 'Slim-profile tool for tight engine bays.', icon: '🛠️', searchQuery: 'serpentine belt tool', imageSrc: '/images/maintenance/socket-set.webp', imageAlt: 'Tool set used for belt and tensioner service' },
        { name: 'Pulley Puller', description: 'Required if you need to replace idler or tensioner pulleys.', icon: '🔩', searchQuery: 'pulley puller set', imageSrc: '/images/maintenance/socket-set.webp', imageAlt: 'Mechanic tools for pulley service' },
    ],
    'coolant-type': [
        { name: 'Engine Coolant / Antifreeze', description: 'Match the color/spec (e.g. OAT, HOAT) to your car.', icon: '❄️', searchQuery: 'engine coolant', imageSrc: '/images/maintenance/coolant.webp', imageAlt: 'Engine coolant being poured into a radiator' },
        { name: 'Spill-Free Funnel', description: 'The best way to bleed air from the cooling system.', icon: '🪣', searchQuery: 'spill free coolant funnel', imageSrc: '/images/maintenance/funnel.webp', imageAlt: 'Funnel for coolant service' },
        { name: 'Coolant Tester', description: 'Check the freeze and boil protection level.', icon: '🌡️', searchQuery: 'coolant hydrometer', imageSrc: '/images/maintenance/coolant.webp', imageAlt: 'Coolant fluid service close-up' },
    ],
    'transmission-fluid-type': [
        { name: 'Transmission Fluid', description: 'Must match the specific ATF or CVT spec for your car.', icon: '⚙️', searchQuery: 'transmission fluid', imageSrc: '/images/maintenance/trans-fluid.webp', imageAlt: 'Automatic transmission fluid bottle' },
        { name: 'Fluid Transfer Pump', description: 'Crucial for filling "sealed" transmissions from below.', icon: '⚓', searchQuery: 'fluid transfer pump', imageSrc: '/images/maintenance/air-compressor.webp', imageAlt: 'Portable automotive pump for fluid-related service tasks' },
        { name: 'Transmission Filter', description: 'Recommended when performing a full pan service.', icon: '🕸️', searchQuery: 'transmission filter kit', imageSrc: '/images/maintenance/oil-filter.webp', imageAlt: 'Automotive filter element for fluid system service' },
    ],
    'headlight-bulb': [
        { name: 'LED Upgrade Bulbs', description: 'Brighter, whiter light for better nighttime visibility.', icon: '💡', searchQuery: 'led headlight bulbs', imageSrc: '/images/maintenance/headlight-bulb.webp', imageAlt: 'Vehicle headlight bulb replacement' },
        { name: 'Replacement Halogens', description: 'Standard OEM-spec bulbs for reliable replacement.', icon: '🔦', searchQuery: 'halogen headlight bulbs', imageSrc: '/images/maintenance/headlight-bulb.webp', imageAlt: 'Halogen headlight bulb in hand' },
        { name: 'Dielectric Grease', description: 'Protects electrical connectors from moisture.', icon: '🧴', searchQuery: 'dielectric grease', imageSrc: '/images/maintenance/headlight-bulb.webp', imageAlt: 'Headlight connector service context' },
    ],
    'wiper-blade-size': [
        { name: 'All-Season Wiper Blades', description: 'Beam-style blades for superior rain and snow clearing.', icon: '🌧️', searchQuery: 'windshield wiper blades', imageSrc: '/images/maintenance/wiper-blade.webp', imageAlt: 'Windshield wiper blade close-up' },
        { name: 'Glass Treatment', description: 'Water repellent to help rain bead off the windshield.', icon: '🚿', searchQuery: 'rain-x glass treatment', imageSrc: '/images/maintenance/wiper-blade.webp', imageAlt: 'Windshield and wiper area' },
        { name: 'Wiper Fluid Tablet', description: 'Concentrated cleaner to keep your view clear.', icon: '🧼', searchQuery: 'wiper fluid tablets', imageSrc: '/images/maintenance/coolant.webp', imageAlt: 'Fluid refill context under the hood' },
    ],
    'tire-size': [
        { name: 'Tire Pressure Gauge', description: 'Digital or analog gauge for precise pressure checks.', icon: '📏', searchQuery: 'tire pressure gauge', imageSrc: '/images/maintenance/tire-gauge.webp', imageAlt: 'Tire pressure gauge' },
        { name: 'Portable Air Compressor', description: 'Inflate your tires anywhere, anytime.', icon: '💨', searchQuery: 'portable tire inflator', imageSrc: '/images/maintenance/air-compressor.webp', imageAlt: 'Portable air compressor for tire inflation' },
        { name: 'Tire Tread Depth Tool', description: 'Check if your tires are safe and ready for the road.', icon: '📐', searchQuery: 'tire tread depth gauge', imageSrc: '/images/maintenance/tire-gauge.webp', imageAlt: 'Tire maintenance measuring tool' },
        { name: 'Valve Stem Caps', description: 'Keep dirt and moisture out of your tire valves.', icon: '🔩', searchQuery: 'valve stem caps', imageSrc: '/images/maintenance/tire-gauge.webp', imageAlt: 'Tire service tools and accessories' },
    ],
    'fluid-capacity': [
        { name: 'Fluid Extraction Pump', description: 'Cleanly remove old fluids from reservoirs.', icon: '💉', searchQuery: 'fluid extractor pump', imageSrc: '/images/maintenance/air-compressor.webp', imageAlt: 'Pump equipment used in fluid service' },
        { name: 'Clean Shop Rags', description: 'Lint-free rags for cleaning dipsticks and spills.', icon: '🧹', searchQuery: 'shop towels', imageSrc: '/images/maintenance/shop-towels.webp', imageAlt: 'Shop towels for cleanup' },
        { name: 'Multi-Purpose Funnel', description: 'Long-neck funnel for hard-to-reach fill points.', icon: '🌪️', searchQuery: 'long neck funnel', imageSrc: '/images/maintenance/funnel.webp', imageAlt: 'Fluid funnel for automotive service' },
    ],
};

interface Props {
    toolType: string;
    make: string;
    model: string;
}

const FALLBACK_SUPPLIES: SupplyItem[] = [
    { name: 'Mechanic Tool Set', description: 'A complete set of sockets and wrenches for any job.', icon: '🧰', searchQuery: 'mechanic tool set', imageSrc: '/images/maintenance/tool-set.webp', imageAlt: 'Mechanic socket and ratchet kit' },
    { name: 'Work Gloves', description: 'Protect your hands from heat, oil, and sharp edges.', icon: '🧤', searchQuery: 'mechanic work gloves', imageSrc: '/images/maintenance/work-gloves.webp', imageAlt: 'Mechanic wearing work gloves' },
    { name: 'LED Work Light', description: 'Bright, hands-free lighting for dark engine bays.', icon: '🔦', searchQuery: 'led work light', imageSrc: '/images/maintenance/headlight-bulb.webp', imageAlt: 'Auto lighting hardware' },
    { name: 'Shop Towels', description: 'Heavy-duty towels for cleaning up grease and spills.', icon: '🧻', searchQuery: 'blue shop towels', imageSrc: '/images/maintenance/shop-towels.webp', imageAlt: 'Shop towels for automotive cleanup' },
];

export default function MaintenanceSupplies({ toolType, make, model }: Props) {
    const supplies = SUPPLIES_BY_TYPE[toolType] || FALLBACK_SUPPLIES;

    const amazonSearch = (query: string) => buildAmazonSearchUrl(`${make} ${model} ${query}`, 'automotive', 'tool-supplies');

    return (
        <section className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Maintenance Kit</h2>
                    <p className="text-gray-400 text-sm mt-1">Recommended supplies and tools for this job.</p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {supplies.map((item, i) => (
                    <AffiliateLink
                        key={i}
                        href={amazonSearch(item.searchQuery)}
                        partName={item.name}
                        vehicle={`${make} ${model}`}
                        pageType="parts_page"
                        subtag="tool-supplies"
                        className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:border-amber-500/40 hover:bg-white/[0.05]"
                    >
                        <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10">
                            <Image
                                src={item.imageSrc}
                                alt={item.imageAlt}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                            <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/45 px-2 py-1 text-[10px] font-semibold tracking-[0.12em] text-white">
                                <span>{item.icon}</span>
                                <span>Part Photo</span>
                            </div>
                            <span className="absolute right-3 top-3 rounded-full bg-amber-500/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-black">Shop</span>
                        </div>
                        <div className="p-5">
                            <h3 className="mb-1 text-white font-bold transition-colors group-hover:text-amber-400">{item.name}</h3>
                            <p className="text-gray-400 text-xs leading-relaxed">{item.description}</p>
                        </div>
                    </AffiliateLink>
                ))}
                
                {/* Generic "Project Essentials" card if needed */}
                <AffiliateLink
                    href={amazonSearch('mechanic tool set')}
                    partName="Project Essentials Tool Set"
                    vehicle={`${make} ${model}`}
                    pageType="parts_page"
                    subtag="tool-supplies"
                    className="group overflow-hidden rounded-2xl border border-cyan-500/20 bg-cyan-500/5 transition-all duration-300 hover:border-cyan-500/40 hover:bg-cyan-500/10"
                >
                    <div className="relative aspect-[16/10] overflow-hidden border-b border-cyan-500/20">
                        <Image
                            src="/images/maintenance/tool-set.webp"
                            alt="Mechanic tool set"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        <div className="absolute left-3 top-3 rounded-full border border-cyan-300/35 bg-black/45 px-2 py-1 text-[10px] font-semibold tracking-[0.12em] text-cyan-100">
                            🧰 Essentials
                        </div>
                        <span className="absolute right-3 top-3 rounded-full bg-cyan-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-black">View All</span>
                    </div>
                    <div className="p-5">
                        <h3 className="mb-1 text-white font-bold">Project Essentials</h3>
                        <p className="text-gray-400 text-xs leading-relaxed">Basic tool sets, gloves, and cleaning supplies for your {make} {model}.</p>
                    </div>
                </AffiliateLink>
            </div>
        </section>
    );
}
