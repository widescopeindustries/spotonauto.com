import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GuideContent from './GuideContent';
import { ShoppingCartIcon, WrenchIcon, ClockIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';
import Link from 'next/link';
import AffiliateLink from '@/components/AffiliateLink';
import { isValidVehicleCombination, getDisplayName, VALID_TASKS } from '@/data/vehicles';

interface PageProps {
    params: Promise<{
        year: string;
        make: string;
        model: string;
        task: string;
    }>;
}

// Common repair data for SEO content
const REPAIR_DATA: Record<string, {
    difficulty: string;
    time: string;
    tools: string[];
    parts: string[];
    warnings: string[];
    steps: string[];
}> = {
    'oil-change': {
        difficulty: 'Easy',
        time: '30-45 minutes',
        tools: ['Socket wrench set', 'Oil filter wrench', 'Drain pan', 'Funnel', 'Jack and jack stands'],
        parts: ['Engine oil (check owner\'s manual for type/quantity)', 'Oil filter', 'Drain plug washer'],
        warnings: ['Allow engine to cool before starting', 'Properly dispose of used oil at recycling center', 'Do not overtighten drain plug'],
        steps: ['Lift vehicle and secure on jack stands', 'Locate and remove drain plug', 'Drain old oil completely', 'Replace oil filter', 'Reinstall drain plug with new washer', 'Add new oil to specified level']
    },
    'brake-pad-replacement': {
        difficulty: 'Intermediate',
        time: '1-2 hours',
        tools: ['Socket wrench set', 'C-clamp or brake piston tool', 'Wire brush', 'Brake cleaner', 'Torque wrench'],
        parts: ['Brake pads (front or rear)', 'Brake hardware kit', 'Brake grease'],
        warnings: ['Never compress brake pedal with caliper removed', 'Check brake fluid level after compressing piston', 'Bed in new pads properly'],
        steps: ['Remove wheel', 'Remove caliper bolts and suspend caliper', 'Remove old pads', 'Compress caliper piston', 'Install new pads with hardware', 'Reinstall caliper and torque to spec']
    },
    'brake-rotor-replacement': {
        difficulty: 'Intermediate',
        time: '1.5-2.5 hours',
        tools: ['Socket wrench set', 'Torque wrench', 'Brake cleaner', 'Wire brush', 'Hammer'],
        parts: ['Brake rotors', 'Brake pads', 'Brake hardware kit'],
        warnings: ['Always replace rotors in pairs', 'Clean new rotors before installation', 'Check for warping with dial indicator'],
        steps: ['Remove wheel and caliper', 'Remove caliper bracket', 'Remove old rotor', 'Clean hub surface', 'Install new rotor', 'Reinstall bracket, caliper, and wheel']
    },
    'alternator-replacement': {
        difficulty: 'Intermediate',
        time: '1-2 hours',
        tools: ['Socket wrench set', 'Serpentine belt tool', 'Multimeter', 'Memory saver'],
        parts: ['Alternator', 'Serpentine belt (inspect/replace if worn)'],
        warnings: ['Disconnect battery before starting', 'Note belt routing before removal', 'Test new alternator output before closing up'],
        steps: ['Disconnect battery negative terminal', 'Remove serpentine belt', 'Disconnect electrical connectors', 'Remove mounting bolts', 'Install new alternator', 'Reinstall belt and connectors']
    },
    'starter-replacement': {
        difficulty: 'Intermediate',
        time: '1-2 hours',
        tools: ['Socket wrench set', 'Extensions', 'Floor jack', 'Wire brush'],
        parts: ['Starter motor', 'Starter bolts (if corroded)'],
        warnings: ['Disconnect battery first', 'Starter may be heavy - support before removing bolts', 'Clean mounting surface for good ground'],
        steps: ['Disconnect battery', 'Locate starter (usually near transmission)', 'Remove electrical connections', 'Remove mounting bolts', 'Install new starter', 'Reconnect wiring and battery']
    },
    'battery-replacement': {
        difficulty: 'Easy',
        time: '15-30 minutes',
        tools: ['Wrench set', 'Wire brush', 'Battery terminal cleaner', 'Memory saver'],
        parts: ['Battery (correct group size)', 'Terminal protector spray'],
        warnings: ['Remove negative terminal first', 'Install positive terminal first', 'Properly dispose of old battery'],
        steps: ['Turn off all electronics', 'Remove negative then positive terminals', 'Remove battery hold-down', 'Remove old battery', 'Clean terminals', 'Install new battery in reverse order']
    },
    'spark-plug-replacement': {
        difficulty: 'Easy to Intermediate',
        time: '30 minutes - 2 hours',
        tools: ['Spark plug socket', 'Torque wrench', 'Gap gauge', 'Dielectric grease'],
        parts: ['Spark plugs (vehicle specific)', 'Anti-seize compound'],
        warnings: ['Work on cool engine only', 'Do not overtighten plugs', 'Check and set gap if required'],
        steps: ['Remove engine cover if equipped', 'Disconnect ignition coil', 'Remove old spark plug', 'Check gap on new plug', 'Install new plug to torque spec', 'Reinstall coil']
    },
    'radiator-replacement': {
        difficulty: 'Intermediate',
        time: '2-3 hours',
        tools: ['Drain pan', 'Pliers', 'Socket set', 'Funnel'],
        parts: ['Radiator', 'Coolant', 'Radiator hoses (inspect)', 'Thermostat (recommended)'],
        warnings: ['Never open hot cooling system', 'Coolant is toxic to pets', 'Bleed air from system after refill'],
        steps: ['Drain coolant into pan', 'Disconnect hoses and transmission cooler lines', 'Remove mounting hardware', 'Remove old radiator', 'Install new radiator', 'Reconnect hoses and refill system']
    },
    'thermostat-replacement': {
        difficulty: 'Easy to Intermediate',
        time: '1-2 hours',
        tools: ['Drain pan', 'Socket set', 'Scraper', 'Torque wrench'],
        parts: ['Thermostat', 'Thermostat gasket', 'Coolant'],
        warnings: ['Work on cool engine', 'Note thermostat orientation', 'Bleed cooling system after'],
        steps: ['Drain some coolant', 'Locate thermostat housing', 'Remove housing bolts', 'Remove old thermostat and gasket', 'Clean mating surfaces', 'Install new thermostat and refill']
    },
    'water-pump-replacement': {
        difficulty: 'Intermediate to Advanced',
        time: '2-4 hours',
        tools: ['Drain pan', 'Socket set', 'Pulley puller', 'Torque wrench', 'RTV sealant'],
        parts: ['Water pump', 'Water pump gasket', 'Coolant', 'Serpentine belt'],
        warnings: ['Drain system completely', 'Check for bearing play before removing', 'Use proper sealant'],
        steps: ['Drain cooling system', 'Remove serpentine belt', 'Remove pump pulley', 'Remove pump bolts', 'Clean mounting surface', 'Install new pump with gasket']
    },
    'serpentine-belt-replacement': {
        difficulty: 'Easy',
        time: '15-30 minutes',
        tools: ['Serpentine belt tool or breaker bar', 'Flashlight'],
        parts: ['Serpentine belt'],
        warnings: ['Note routing before removal', 'Check tensioner for wear', 'Inspect all pulleys'],
        steps: ['Locate belt routing diagram', 'Release tensioner', 'Remove old belt', 'Route new belt correctly', 'Release tensioner and verify alignment']
    },
    'cabin-air-filter-replacement': {
        difficulty: 'Easy',
        time: '10-20 minutes',
        tools: ['Screwdriver (possibly)', 'Flashlight'],
        parts: ['Cabin air filter'],
        warnings: ['Note filter direction arrow', 'Clean housing before installing new filter'],
        steps: ['Locate cabin filter (usually behind glove box)', 'Remove access panel', 'Slide out old filter', 'Install new filter with arrow pointing correct direction', 'Reinstall panel']
    },
    'engine-air-filter-replacement': {
        difficulty: 'Easy',
        time: '5-10 minutes',
        tools: ['Screwdriver (possibly)'],
        parts: ['Engine air filter'],
        warnings: ['Do not over-oil if using reusable filter', 'Ensure housing seals properly'],
        steps: ['Locate air filter box', 'Release clips or screws', 'Remove old filter', 'Clean housing if dirty', 'Install new filter', 'Secure housing']
    },
    'headlight-bulb-replacement': {
        difficulty: 'Easy',
        time: '10-30 minutes',
        tools: ['Gloves', 'Screwdriver (possibly)'],
        parts: ['Headlight bulb (correct fitment)'],
        warnings: ['Do not touch bulb glass with bare hands', 'Test before reassembly', 'Some vehicles require bumper removal'],
        steps: ['Access bulb from engine bay or wheel well', 'Disconnect electrical connector', 'Remove retaining clip or ring', 'Remove old bulb', 'Install new bulb without touching glass', 'Reconnect and test']
    }
};

const DEFAULT_REPAIR = {
    difficulty: 'Varies',
    time: '1-3 hours',
    tools: ['Basic hand tools', 'Vehicle-specific tools may be required'],
    parts: ['See repair guide for specific parts'],
    warnings: ['Consult service manual for your specific vehicle', 'Disconnect battery if working near electrical components'],
    steps: ['Research procedure for your specific vehicle', 'Gather required tools and parts', 'Follow manufacturer service procedures', 'Test repair before returning vehicle to service']
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { year, make, model, task } = await params;
    const cleanTask = task.replace(/-/g, ' ');
    const displayMake = decodeURIComponent(make);
    const displayModel = decodeURIComponent(model);
    const vehicleName = `${year} ${displayMake} ${displayModel}`;

    // Capitalize each word for title
    const titleTask = cleanTask.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // SEO-optimized title: Action + Vehicle
    const title = `${titleTask} Guide — ${vehicleName}`;

    // Description with savings hook and clear value prop
    const description = `DIY ${cleanTask} guide for ${vehicleName}. Step-by-step instructions, tools, and parts to save you hundreds on repairs.`;

    return {
        title,
        description,
        keywords: [
            `${year} ${displayMake} ${displayModel} ${cleanTask}`,
            `${displayMake} ${displayModel} ${cleanTask}`,
            `how to ${cleanTask} ${displayMake} ${displayModel}`,
            `${cleanTask} ${displayMake}`,
            `${cleanTask} DIY`,
            `${cleanTask} instructions`,
            `${cleanTask} steps`,
            `${year} ${displayMake} ${cleanTask}`,
        ],
        openGraph: {
            title: `${titleTask} Guide — ${vehicleName}`,
            description: `DIY ${cleanTask} for ${vehicleName}. Save money with our step-by-step repair guide.`,
            type: 'article',
            url: `https://spotonauto.com/repair/${year}/${make}/${model}/${task}`,
        },
        twitter: {
            card: 'summary',
            title: `${titleTask} — ${vehicleName}`,
            description: `Complete DIY ${cleanTask} guide. Save $100-400.`,
        },
        alternates: {
            canonical: `https://spotonauto.com/repair/${year}/${make.toLowerCase()}/${model.toLowerCase()}/${task.toLowerCase()}`,
        },
    };
}

export default async function Page({ params }: PageProps) {
    const resolvedParams = await params;
    const { year, make, model, task } = resolvedParams;

    // Validate vehicle/year combination - return 404 for invalid combinations
    if (!isValidVehicleCombination(year, make, model, task)) {
        notFound();
    }

    const cleanTask = task.replace(/-/g, ' ');
    // Use display names for proper capitalization
    const displayMake = getDisplayName(make, 'make') || decodeURIComponent(make);
    const displayModel = getDisplayName(model, 'model') || decodeURIComponent(model);

    const vehicleName = `${year} ${displayMake} ${displayModel}`;

    const repairData = REPAIR_DATA[task] || DEFAULT_REPAIR;

    // Schema.org structured data
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": `How to perform ${cleanTask} on a ${vehicleName}`,
        "description": `Step-by-step guide for ${cleanTask} on ${vehicleName}`,
        "totalTime": `PT${repairData.time.split('-')[1]?.trim() || '2H'}`,
        "estimatedCost": {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": "50-300"
        },
        "supply": repairData.parts.map(part => ({
            "@type": "HowToSupply",
            "name": part
        })),
        "tool": repairData.tools.map(tool => ({
            "@type": "HowToTool",
            "name": tool
        })),
        "step": repairData.steps.map((step, i) => ({
            "@type": "HowToStep",
            "position": i + 1,
            "text": step
        }))
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
            />

            {/* SEO Content - Renders server-side for Google */}
            <article className="max-w-6xl mx-auto px-4 py-8">
                {/* Hero */}
                <header className="mb-8 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        {cleanTask.charAt(0).toUpperCase() + cleanTask.slice(1)} Guide
                        <span className="block text-xl md:text-2xl text-brand-cyan mt-2">{vehicleName}</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Complete DIY repair guide with step-by-step instructions. Find exact parts on Amazon for your vehicle.
                    </p>
                </header>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                        <WrenchIcon className="w-6 h-6 text-brand-cyan mx-auto mb-2" />
                        <p className="text-xs text-gray-500 uppercase">Difficulty</p>
                        <p className="text-white font-bold">{repairData.difficulty}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                        <ClockIcon className="w-6 h-6 text-brand-cyan mx-auto mb-2" />
                        <p className="text-xs text-gray-500 uppercase">Time</p>
                        <p className="text-white font-bold">{repairData.time}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                        <ShoppingCartIcon className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 uppercase">Parts Needed</p>
                        <p className="text-white font-bold">{repairData.parts.length} items</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                        <CheckCircleIcon className="w-6 h-6 text-green-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 uppercase">DIY Savings</p>
                        <p className="text-white font-bold">$100-400+</p>
                    </div>
                </div>

                {/* Safety Warnings */}
                <section className="mb-8 bg-red-950/30 border border-red-500/30 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                        <AlertTriangleIcon className="w-5 h-5" />
                        Safety Warnings
                    </h2>
                    <ul className="space-y-2">
                        {repairData.warnings.map((warning, i) => (
                            <li key={i} className="flex items-start gap-2 text-red-200">
                                <span className="text-red-500 mt-1">•</span>
                                {warning}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Tools Required */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">Tools Required</h2>
                    <div className="grid md:grid-cols-2 gap-2">
                        {repairData.tools.map((tool, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg p-3 border border-white/10">
                                <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">{tool}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Parts List */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">Parts Needed</h2>
                    <div className="space-y-3">
                        {repairData.parts.map((part, i) => (
                            <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-4 border border-white/10">
                                <span className="text-gray-300">{part}</span>
                                <AffiliateLink
                                    href={`https://www.amazon.com/s?k=${encodeURIComponent(vehicleName + ' ' + part)}&i=automotive&tag=${process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'antigravity-20'}`}
                                    partName={part}
                                    vehicle={vehicleName}
                                    isHighTicket={/alternator|starter|strut|shock|compressor|catalytic|manifold|radiator|transmission|turbo|differential|axle/i.test(part)}
                                    pageType="repair_guide"
                                    className="px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded hover:bg-amber-400 transition"
                                >
                                    Shop on Amazon
                                </AffiliateLink>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Basic Steps */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">Basic Procedure Overview</h2>
                    <ol className="space-y-3">
                        {repairData.steps.map((step, i) => (
                            <li key={i} className="flex gap-4 bg-white/5 rounded-lg p-4 border border-white/10">
                                <span className="flex-shrink-0 w-8 h-8 bg-brand-cyan text-black font-bold rounded-full flex items-center justify-center">
                                    {i + 1}
                                </span>
                                <span className="text-gray-300 pt-1">{step}</span>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* CTA to AI Guide */}
                <div className="bg-gradient-to-r from-brand-cyan/10 to-purple-500/10 rounded-2xl p-8 text-center border border-brand-cyan/30 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        Get Your Personalized AI Repair Guide
                    </h2>
                    <p className="text-gray-400 mb-6 max-w-xl mx-auto">
                        Our AI generates a detailed, vehicle-specific guide with exact part numbers,
                        torque specs, and step-by-step instructions for your {vehicleName}.
                    </p>
                    <p className="text-sm text-brand-cyan mb-4">Loading your custom guide below...</p>
                </div>
            </article>

            {/* Client-side AI Guide */}
            <GuideContent params={resolvedParams} />

            {/* More SEO Content */}
            <section className="max-w-6xl mx-auto px-4 py-8 border-t border-white/10">
                <h2 className="text-xl font-bold text-white mb-4">
                    About {cleanTask.charAt(0).toUpperCase() + cleanTask.slice(1)} on {make} {model}
                </h2>
                <p className="text-gray-400 mb-4">
                    Performing a {cleanTask} on your {vehicleName} is a common maintenance task that
                    most DIY mechanics can handle with basic tools. By doing this repair yourself,
                    you can save $100-400 compared to dealership or shop prices.
                </p>
                <p className="text-gray-400 mb-4">
                    The {make} {model} has been in production for many years, and {cleanTask} procedures
                    are well-documented. Always refer to your owner&apos;s manual for vehicle-specific
                    information and torque specifications.
                </p>

                <h3 className="text-lg font-bold text-white mt-6 mb-3">Where to Buy Parts</h3>
                <p className="text-gray-400">
                    We recommend purchasing parts through <strong>Amazon</strong> for fast Prime shipping,
                    competitive prices, and easy returns. All part links include your vehicle fitment
                    information for accurate results.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                    <Link href="/parts" className="text-brand-cyan hover:underline">
                        Browse All Parts →
                    </Link>
                    <Link href="/" className="text-brand-cyan hover:underline">
                        Start New Diagnosis →
                    </Link>
                </div>
            </section>
        </>
    );
}
