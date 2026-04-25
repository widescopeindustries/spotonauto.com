import React from 'react';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';
import AffiliateLink from '@/components/AffiliateLink';

interface SupplyItem {
    name: string;
    description: string;
    icon: string;
    searchQuery: string;
}

const SUPPLIES_BY_TYPE: Record<string, SupplyItem[]> = {
    'oil-type': [
        { name: 'Premium Full Synthetic Oil', description: 'Match the viscosity (e.g. 0W-20) to your vehicle spec.', icon: '🛢️', searchQuery: 'full synthetic motor oil' },
        { name: 'Oil Filter', description: 'High-efficiency filter to match your specific engine model.', icon: '🔍', searchQuery: 'oil filter' },
        { name: 'Oil Drain Pan', description: 'Low-profile pan for easy oil collection and disposal.', icon: '📥', searchQuery: 'oil drain pan' },
        { name: 'Filter Wrench', description: 'Adjustable or size-specific wrench to remove stuck filters.', icon: '🔧', searchQuery: 'oil filter wrench' },
        { name: 'Funnel Set', description: 'Prevent spills when refilling your engine oil.', icon: '🌪️', searchQuery: 'automotive funnel' },
        { name: 'Shop Towels', description: 'Lint-free towels for spills, dipsticks, and filter surfaces.', icon: '🧻', searchQuery: 'shop towels automotive' },
    ],
    'spark-plug-type': [
        { name: 'Iridium Spark Plugs', description: 'Long-lasting performance plugs for modern engines.', icon: '⚡', searchQuery: 'iridium spark plugs' },
        { name: 'Spark Plug Socket', description: 'Magnetic or rubber-insert socket to prevent damage.', icon: '🔌', searchQuery: 'spark plug socket set' },
        { name: 'Gap Gauge', description: 'Ensure your plugs are set to the exact factory spec.', icon: '📏', searchQuery: 'spark plug gap tool' },
        { name: 'Torque Wrench', description: 'Crucial for tightening plugs without stripping threads.', icon: '🔧', searchQuery: '3/8 inch torque wrench' },
        { name: 'Anti-Seize Lubricant', description: 'Prevents plugs from welding to the cylinder head.', icon: '🧴', searchQuery: 'anti-seize lubricant' },
        { name: 'Dielectric Grease', description: 'Protects ignition boots and connectors from moisture.', icon: '🧪', searchQuery: 'dielectric grease automotive' },
    ],
    'battery-location': [
        { name: 'Replacement Battery', description: 'Match your Group Size (e.g. H6, 35) and CCA rating.', icon: '🔋', searchQuery: 'automotive battery' },
        { name: 'Terminal Cleaner', description: 'Removes corrosion for a reliable electrical connection.', icon: '🧹', searchQuery: 'battery terminal cleaner' },
        { name: 'Memory Saver', description: 'Keeps your car settings while the battery is disconnected.', icon: '💾', searchQuery: 'obd2 memory saver' },
        { name: 'Battery Carrier', description: 'Makes lifting heavy batteries much safer and easier.', icon: '🏗️', searchQuery: 'battery carrier tool' },
        { name: 'Battery Charger', description: 'Helpful for revive-and-test jobs before you replace a weak battery.', icon: '⚡', searchQuery: 'automotive battery charger' },
        { name: 'Terminal Spray', description: 'Protects battery posts from future corrosion.', icon: '🧴', searchQuery: 'battery terminal spray' },
    ],
    'serpentine-belt': [
        { name: 'Exact Serpentine Belt', description: 'Match engine-specific length and rib count for the cleanest fit.', icon: '⚙️', searchQuery: 'serpentine belt' },
        { name: 'Belt Tensioner', description: 'Replace weak spring-loaded tensioners that cause squeal and slip.', icon: '🛠️', searchQuery: 'serpentine belt tensioner' },
        { name: 'Idler Pulley', description: 'Quiet bearing support when the belt is off anyway.', icon: '🔩', searchQuery: 'idler pulley automotive' },
        { name: 'Pulley Puller Set', description: 'Useful for stubborn idler and tensioner pulley swaps.', icon: '🧲', searchQuery: 'pulley puller set' },
        { name: 'Breaker Bar', description: 'Makes tensioner release easier in tight engine bays.', icon: '🧰', searchQuery: 'breaker bar automotive' },
        { name: 'Shop Towels', description: 'Keep the accessory drive and your hands clean during inspection.', icon: '🧻', searchQuery: 'shop towels automotive' },
    ],
    'coolant-type': [
        { name: 'Engine Coolant / Antifreeze', description: 'Match the color/spec (e.g. OAT, HOAT) to your car.', icon: '❄️', searchQuery: 'engine coolant' },
        { name: 'Spill-Free Funnel', description: 'The best way to bleed air from the cooling system.', icon: '🪣', searchQuery: 'spill free coolant funnel' },
        { name: 'Coolant Tester', description: 'Check the freeze and boil protection level.', icon: '🌡️', searchQuery: 'coolant hydrometer' },
        { name: 'Hose Clamp Pliers', description: 'Helps move spring clamps without mangling hoses.', icon: '🔧', searchQuery: 'hose clamp pliers automotive' },
        { name: 'Shop Towels', description: 'Cleanup gear for coolant drips and burps.', icon: '🧻', searchQuery: 'shop towels automotive' },
    ],
    'transmission-fluid-type': [
        { name: 'Transmission Fluid', description: 'Must match the specific ATF or CVT spec for your car.', icon: '⚙️', searchQuery: 'transmission fluid' },
        { name: 'Fluid Transfer Pump', description: 'Crucial for filling "sealed" transmissions from below.', icon: '⚓', searchQuery: 'fluid transfer pump' },
        { name: 'Transmission Filter', description: 'Recommended when performing a full pan service.', icon: '🕸️', searchQuery: 'transmission filter kit' },
        { name: 'Drain Plug Washer', description: 'Prevents seepage after a drain-and-fill service.', icon: '🪙', searchQuery: 'drain plug washer automotive' },
        { name: 'Shop Towels', description: 'Cleanup gear for ATF spills and pan work.', icon: '🧻', searchQuery: 'shop towels automotive' },
    ],
    'headlight-bulb': [
        { name: 'LED Upgrade Bulbs', description: 'Brighter, whiter light for better nighttime visibility.', icon: '💡', searchQuery: 'led headlight bulbs' },
        { name: 'Replacement Halogens', description: 'Standard OEM-spec bulbs for reliable replacement.', icon: '🔦', searchQuery: 'halogen headlight bulbs' },
        { name: 'Dielectric Grease', description: 'Protects electrical connectors from moisture.', icon: '🧴', searchQuery: 'dielectric grease' },
        { name: 'Latex-Free Gloves', description: 'Avoid fingerprints on the bulb and keep glass clean.', icon: '🧤', searchQuery: 'automotive gloves' },
    ],
    'wiper-blade-size': [
        { name: 'All-Season Wiper Blades', description: 'Beam-style blades for superior rain and snow clearing.', icon: '🌧️', searchQuery: 'windshield wiper blades' },
        { name: 'Glass Treatment', description: 'Water repellent to help rain bead off the windshield.', icon: '🚿', searchQuery: 'rain-x glass treatment' },
        { name: 'Wiper Fluid Tablet', description: 'Concentrated cleaner to keep your view clear.', icon: '🧼', searchQuery: 'wiper fluid tablets' },
        { name: 'Shop Towels', description: 'Handy for cleaning the glass and wiper arms.', icon: '🧻', searchQuery: 'shop towels automotive' },
    ],
    'tire-size': [
        { name: 'Tire Pressure Gauge', description: 'Digital or analog gauge for precise pressure checks.', icon: '📏', searchQuery: 'tire pressure gauge' },
        { name: 'Portable Air Compressor', description: 'Inflate your tires anywhere, anytime.', icon: '💨', searchQuery: 'portable tire inflator' },
        { name: 'Tire Tread Depth Tool', description: 'Check if your tires are safe and ready for the road.', icon: '📐', searchQuery: 'tire tread depth gauge' },
        { name: 'Valve Stem Caps', description: 'Keep dirt and moisture out of your tire valves.', icon: '🔩', searchQuery: 'valve stem caps' },
        { name: 'Tire Repair Kit', description: 'Useful emergency backup for puncture-prone drivers.', icon: '🧰', searchQuery: 'tire repair kit' },
    ],
    'fluid-capacity': [
        { name: 'Fluid Extraction Pump', description: 'Cleanly remove old fluids from reservoirs.', icon: '💉', searchQuery: 'fluid extractor pump' },
        { name: 'Clean Shop Rags', description: 'Lint-free rags for cleaning dipsticks and spills.', icon: '🧹', searchQuery: 'shop towels' },
        { name: 'Multi-Purpose Funnel', description: 'Long-neck funnel for hard-to-reach fill points.', icon: '🌪️', searchQuery: 'long neck funnel' },
        { name: 'Nitrile Gloves', description: 'Keep hands clean during multi-fluid maintenance.', icon: '🧤', searchQuery: 'nitrile gloves automotive' },
    ],
};

interface Props {
    toolType: string;
    make: string;
    model: string;
}

const FALLBACK_SUPPLIES: SupplyItem[] = [
    { name: 'Mechanic Tool Set', description: 'A complete set of sockets and wrenches for any job.', icon: '🧰', searchQuery: 'mechanic tool set' },
    { name: 'Work Gloves', description: 'Protect your hands from heat, oil, and sharp edges.', icon: '🧤', searchQuery: 'mechanic work gloves' },
    { name: 'LED Work Light', description: 'Bright, hands-free lighting for dark engine bays.', icon: '🔦', searchQuery: 'led work light' },
    { name: 'Shop Towels', description: 'Heavy-duty towels for cleaning up grease and spills.', icon: '🧻', searchQuery: 'blue shop towels' },
    { name: 'Breaker Bar', description: 'Extra leverage for stubborn fasteners.', icon: '🧰', searchQuery: 'breaker bar automotive' },
];

export default function MaintenanceSupplies({ toolType, make, model }: Props) {
    const supplies = SUPPLIES_BY_TYPE[toolType] || FALLBACK_SUPPLIES;

    const amazonSearch = (query: string) => buildAmazonSearchUrl(`${make} ${model} ${query}`, 'automotive', 'tool-supplies');

    return (
        <section className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">One-Trip Shopping List</h2>
                    <p className="text-gray-400 text-sm mt-1">Recommended supplies and tools for this job, grouped so you can buy everything before the repair starts.</p>
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
                        className="group flex flex-col p-5 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-amber-500/40 hover:bg-white/[0.05] transition-all duration-300"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <span className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-300">{item.icon}</span>
                            <span className="text-xs font-bold uppercase tracking-widest text-amber-500/60 group-hover:text-amber-500 transition-colors">Shop →</span>
                        </div>
                        <h3 className="text-white font-bold mb-1 group-hover:text-amber-400 transition-colors">{item.name}</h3>
                        <p className="text-gray-400 text-xs leading-relaxed">{item.description}</p>
                    </AffiliateLink>
                ))}
                
                {/* Generic "Project Essentials" card if needed */}
                <AffiliateLink
                    href={amazonSearch('mechanic tool set')}
                    partName="Project Essentials Tool Set"
                    vehicle={`${make} ${model}`}
                    pageType="parts_page"
                    subtag="tool-supplies"
                    className="group flex flex-col p-5 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all duration-300"
                >
                    <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl">🧰</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-cyan-500/60 group-hover:text-cyan-500 transition-colors">View All →</span>
                    </div>
                    <h3 className="text-white font-bold mb-1">Project Essentials</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">Basic tool sets, gloves, and cleaning supplies for your {make} {model} so the job is ready when the parts arrive.</p>
                </AffiliateLink>
            </div>
        </section>
    );
}
