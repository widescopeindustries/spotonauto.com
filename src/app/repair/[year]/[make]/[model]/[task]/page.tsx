import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GuideContent from './GuideContent';
import { ShoppingCartIcon, WrenchIcon, ClockIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';
import Link from 'next/link';
import AffiliateLink from '@/components/AffiliateLink';
import { isValidVehicleCombination, getDisplayName, VALID_TASKS } from '@/data/vehicles';
import { getVehicleRepairSpec, PartSpec } from '@/data/vehicle-repair-specs';

// Helper — title-case a hyphenated slug (fallback for unknown makes/models)
function toTitleCase(slug: string): string {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

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

    const displayMake = getDisplayName(make, 'make') || toTitleCase(make);
    const displayModel = getDisplayName(model, 'model') || toTitleCase(model);
    const vehicleName = `${year} ${displayMake} ${displayModel}`;

    // Title-case the task (e.g. "oil change" → "Oil Change")
    const titleTask = cleanTask.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // Keyword-first title, hard cap ~55 chars for no truncation in SERPs
    // Pattern: "[Year] [Make] [Model] [Task] Guide | SpotOnAuto"
    const title = `${vehicleName} ${titleTask} Guide | SpotOnAuto`;

    // Under 160 chars, action-oriented
    const description = `DIY ${cleanTask} for your ${vehicleName}. Step-by-step guide with tools, parts list, and safety tips. Save $100–$400 vs. the shop.`;

    return {
        title,
        description,
        keywords: [
            `${year} ${displayMake} ${displayModel} ${cleanTask}`,
            `${displayMake} ${displayModel} ${cleanTask}`,
            `how to ${cleanTask} ${displayMake} ${displayModel}`,
            `${cleanTask} ${displayMake} ${displayModel} DIY`,
            `${year} ${displayMake} ${cleanTask}`,
        ],
        openGraph: {
            title: `${vehicleName} ${titleTask} Guide`,
            description: `Step-by-step ${cleanTask} guide for the ${vehicleName}. Tools, parts & safety tips included.`,
            type: 'article',
            url: `https://spotonauto.com/repair/${year}/${make}/${model}/${task}`,
        },
        twitter: {
            card: 'summary',
            title: `${vehicleName} ${titleTask} Guide`,
            description: `DIY guide — save $100–$400 vs. the shop. Tools, parts & steps.`,
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
    const displayMake = getDisplayName(make, 'make') || toTitleCase(make);
    const displayModel = getDisplayName(model, 'model') || toTitleCase(model);

    const vehicleName = `${year} ${displayMake} ${displayModel}`;

    const vehicleSpec = getVehicleRepairSpec(year, make, model, task);
    const genericData = REPAIR_DATA[task] || DEFAULT_REPAIR;

    // Merge: vehicle-specific data overrides generic, but generic fills gaps
    const repairData = {
        difficulty: vehicleSpec?.difficulty || genericData.difficulty,
        time: vehicleSpec?.time || genericData.time,
        tools: vehicleSpec?.tools || genericData.tools,
        parts: vehicleSpec
            ? vehicleSpec.parts.map(p => p.name + (p.spec ? ` (${p.spec})` : ''))
            : genericData.parts,
        warnings: vehicleSpec?.warnings || genericData.warnings,
        steps: vehicleSpec?.steps || genericData.steps,
    };

    // Convert "30-45 minutes" / "1-2 hours" to ISO 8601 duration (upper bound)
    function toIso8601Duration(timeStr: string): string {
        const lower = timeStr.toLowerCase();
        // Extract the upper bound number from ranges like "30-45 minutes" or "1-2 hours"
        const rangeMatch = lower.match(/[\d.]+\s*[-–]\s*([\d.]+)\s*(hour|hr|minute|min)/);
        const singleMatch = lower.match(/([\d.]+)\s*(hour|hr|minute|min)/);
        const match = rangeMatch || singleMatch;
        if (!match) return 'PT2H';
        const value = parseFloat(rangeMatch ? rangeMatch[1] : singleMatch![1]);
        const unit = match[rangeMatch ? 2 : 2];
        if (unit.startsWith('hour') || unit.startsWith('hr')) {
            const hours = Math.floor(value);
            const mins = Math.round((value - hours) * 60);
            return mins > 0 ? `PT${hours}H${mins}M` : `PT${hours}H`;
        }
        return `PT${Math.round(value)}M`;
    }

    // Task-specific cost ranges (parts only, DIY labour = $0)
    const COST_MAP: Record<string, string> = {
        'oil-change': '25-80',
        'battery-replacement': '80-200',
        'brake-pad-replacement': '40-120',
        'brake-rotor-replacement': '60-180',
        'serpentine-belt-replacement': '25-80',
        'cabin-air-filter-replacement': '15-40',
        'engine-air-filter-replacement': '15-40',
        'spark-plug-replacement': '30-120',
        'alternator-replacement': '120-350',
        'starter-replacement': '100-300',
        'radiator-replacement': '150-400',
        'thermostat-replacement': '20-80',
        'water-pump-replacement': '80-250',
        'headlight-bulb-replacement': '15-80',
    };

    // ── FAQ data for GEO (Generative Engine Optimization) ────────────────
    const costRange = COST_MAP[task] || '50-300';
    const difficultyAnswer = repairData.difficulty === 'Easy'
        ? `Yes, a ${cleanTask} on a ${vehicleName} is rated Easy and is a great beginner DIY project. You'll need basic hand tools and about ${repairData.time}.`
        : repairData.difficulty === 'Intermediate'
            ? `A ${cleanTask} on a ${vehicleName} is rated Intermediate. If you have some DIY experience and the right tools, you can do it yourself in about ${repairData.time}. First-timers should budget extra time and watch a tutorial first.`
            : repairData.difficulty === 'Intermediate to Advanced'
                ? `A ${cleanTask} on a ${vehicleName} is rated Intermediate to Advanced. It's doable for experienced DIYers with a good tool set, but beginners may want professional help. Expect it to take ${repairData.time}.`
                : `Difficulty varies depending on your ${vehicleName}'s specific configuration. With the right tools and a service manual, most handy owners can complete this in ${repairData.time}.`;

    const delayConsequences: Record<string, string> = {
        'oil-change': `Delaying an oil change on your ${vehicleName} causes accelerated engine wear, sludge buildup, and reduced fuel economy. Extended neglect can lead to engine seizure and repairs costing $3,000–$7,000+.`,
        'brake-pad-replacement': `Worn brake pads on your ${vehicleName} will grind into the rotors, turning a $40–$120 pad job into a $200–$400+ rotor-and-pad replacement. Braking distance increases significantly, creating a serious safety hazard.`,
        'brake-rotor-replacement': `Driving with warped or worn rotors on your ${vehicleName} causes brake pulsation, uneven pad wear, and longer stopping distances. Ignoring it risks caliper damage and potential brake failure.`,
        'battery-replacement': `A failing battery in your ${vehicleName} will leave you stranded and can damage the alternator by forcing it to overwork. Repeated deep discharges also shorten the life of electronic modules.`,
        'spark-plug-replacement': `Old spark plugs in your ${vehicleName} cause misfires, rough idle, poor fuel economy, and can damage the catalytic converter—a $500–$1,500 repair. Plugs seized from over-waiting may snap during removal.`,
        'alternator-replacement': `A failing alternator will drain your ${vehicleName}'s battery and can leave you stranded. Driving with a bad alternator risks damaging sensitive electronics and the battery itself.`,
        'starter-replacement': `A failing starter means your ${vehicleName} won't start reliably. Continued attempts to start with a bad starter can drain the battery and damage the flywheel ring gear—an expensive transmission-area repair.`,
        'serpentine-belt-replacement': `A cracked or worn serpentine belt on your ${vehicleName} can snap without warning, instantly killing power steering, the alternator, water pump, and A/C. An overheated engine from a lost water pump can cause head gasket failure.`,
        'radiator-replacement': `A leaking radiator will cause your ${vehicleName} to overheat, risking head gasket failure ($1,000–$2,500+) or a warped cylinder head. Coolant loss can happen quickly and leave you stranded.`,
        'thermostat-replacement': `A stuck thermostat causes your ${vehicleName} to overheat (stuck closed) or run too cold (stuck open). Overheating risks serious engine damage; running cold increases fuel consumption and wear.`,
        'water-pump-replacement': `A failing water pump will cause your ${vehicleName} to overheat. Continued driving with a bad water pump can warp the cylinder head or blow the head gasket—repairs that cost $1,500–$3,000+.`,
        'cabin-air-filter-replacement': `A clogged cabin air filter in your ${vehicleName} reduces HVAC airflow, causes musty odors, and can fog up windows. It also makes the blower motor work harder, shortening its life.`,
        'engine-air-filter-replacement': `A dirty engine air filter in your ${vehicleName} restricts airflow to the engine, reducing power by up to 10% and hurting fuel economy. Over time it can allow debris into the engine.`,
        'headlight-bulb-replacement': `Driving your ${vehicleName} with a burned-out headlight is a safety hazard and a ticketable offense in most states. Reduced visibility increases accident risk, especially at night and in bad weather.`,
    };

    const faqItems = [
        {
            question: `How much does ${cleanTask} cost for a ${vehicleName}?`,
            answer: `DIY ${cleanTask} on a ${vehicleName} costs approximately $${costRange} in parts. A professional shop typically charges $${(() => { const [lo, hi] = costRange.split('-').map(Number); return `${lo + 80}-${hi + 200}`; })()} including labor. By doing it yourself, you save $80–$200+ in labor costs.`,
        },
        {
            question: `How long does ${cleanTask} take on a ${vehicleName}?`,
            answer: `A ${cleanTask} on a ${vehicleName} typically takes ${repairData.time} for a DIY mechanic. Professional shops may be faster due to lifts and pneumatic tools. First-timers should add 30–60 minutes for setup and learning.`,
        },
        {
            question: `Can I do ${cleanTask} myself on a ${vehicleName}?`,
            answer: difficultyAnswer,
        },
        {
            question: `What tools do I need for ${cleanTask} on a ${vehicleName}?`,
            answer: `For ${cleanTask} on a ${vehicleName} you'll need: ${repairData.tools.join(', ')}. You'll also need the correct replacement parts: ${repairData.parts.slice(0, 3).join(', ')}${repairData.parts.length > 3 ? `, and ${repairData.parts.length - 3} more item${repairData.parts.length - 3 > 1 ? 's' : ''}` : ''}.`,
        },
        {
            question: `What happens if I delay ${cleanTask} on my ${vehicleName}?`,
            answer: delayConsequences[task] || `Delaying ${cleanTask} on your ${vehicleName} can lead to more expensive repairs down the road, reduced vehicle reliability, and potential safety issues. It's best to address it within the manufacturer's recommended service interval.`,
        },
    ];

    const faqSchemaData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer,
            },
        })),
    };

    // Schema.org HowTo structured data — drives rich results (step count, time, cost badges in SERPs)
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": `How to Do a ${repairData.difficulty} ${cleanTask.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} on a ${vehicleName}`,
        "description": `DIY ${cleanTask} for the ${vehicleName}. Takes ${repairData.time}. Difficulty: ${repairData.difficulty}. Save $100–$400 vs. a shop with this step-by-step guide.`,
        "totalTime": toIso8601Duration(repairData.time),
        "estimatedCost": {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": COST_MAP[task] || "50-300"
        },
        "supply": vehicleSpec
            ? vehicleSpec.parts.map(part => ({
                "@type": "HowToSupply",
                "name": [part.name, part.aftermarket, part.oem].filter(Boolean).join(' / ')
            }))
            : repairData.parts.map(part => ({
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
            "name": `Step ${i + 1}`,
            "text": step,
            "url": `https://spotonauto.com/repair/${year}/${make}/${model}/${task}#step-${i + 1}`
        }))
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchemaData) }}
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

                {/* Vehicle-Specific Notes — only renders when we have real data */}
                {vehicleSpec && (
                    <section className="mb-8 bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-cyan-400 mb-4">
                            {vehicleName} — What You Need to Know
                        </h2>
                        <ul className="space-y-2">
                            {vehicleSpec.vehicleNotes.map((note, i) => (
                                <li key={i} className="flex items-start gap-2 text-cyan-100">
                                    <span className="text-cyan-400 mt-1">→</span>
                                    {note}
                                </li>
                            ))}
                        </ul>
                        {vehicleSpec.torqueSpecs && (
                            <div className="mt-4 p-4 bg-cyan-900/30 rounded-lg">
                                <span className="text-xs uppercase tracking-wider text-cyan-500 font-bold">Torque Specs</span>
                                <p className="text-white font-mono mt-1">{vehicleSpec.torqueSpecs}</p>
                            </div>
                        )}
                        {vehicleSpec.beltRouting && (
                            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                                <span className="text-xs uppercase tracking-wider text-cyan-500 font-bold">Belt Routing</span>
                                <p className="text-gray-300 mt-1">{vehicleSpec.beltRouting}</p>
                            </div>
                        )}
                    </section>
                )}

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
                        {vehicleSpec ? (
                            vehicleSpec.parts.map((part: PartSpec, i: number) => {
                                const searchTerm = part.aftermarket || part.oem || `${vehicleName} ${part.name}`;
                                return (
                                    <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-4 border border-white/10">
                                        <div className="flex-1 min-w-0">
                                            <span className="text-gray-300">{part.name}</span>
                                            {part.spec && (
                                                <span className="block text-xs text-gray-500 mt-0.5">{part.spec}</span>
                                            )}
                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                {part.oem && (
                                                    <span className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded font-mono">
                                                        OEM {part.oem}
                                                    </span>
                                                )}
                                                {part.aftermarket && (
                                                    <span className="inline-block px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded font-mono">
                                                        {part.aftermarket}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <AffiliateLink
                                            href={`https://www.amazon.com/s?k=${encodeURIComponent(searchTerm)}&i=automotive&tag=${process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'antigravity-20'}`}
                                            partName={part.name}
                                            vehicle={vehicleName}
                                            isHighTicket={/alternator|starter|strut|shock|compressor|catalytic|manifold|radiator|transmission|turbo|differential|axle/i.test(part.name)}
                                            pageType="repair_guide"
                                            className="flex-shrink-0 ml-4 px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded hover:bg-amber-400 transition"
                                        >
                                            Shop on Amazon
                                        </AffiliateLink>
                                    </div>
                                );
                            })
                        ) : (
                            repairData.parts.map((part, i) => (
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
                            ))
                        )}
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

                {/* Frequently Asked Questions — GEO optimized for AI search citation */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">Frequently Asked Questions</h2>
                    <dl className="space-y-4">
                        {faqItems.map((faq, i) => (
                            <div key={i} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                                <dt className="px-5 py-4 font-semibold text-white">
                                    {faq.question}
                                </dt>
                                <dd className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">
                                    {faq.answer}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>

                {/* CTA to AI Guide */}
                <div className="bg-gradient-to-r from-brand-cyan/10 to-purple-500/10 rounded-2xl p-8 text-center border border-brand-cyan/30 mb-8">
                    <div className="inline-block bg-brand-cyan/20 text-brand-cyan text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                        Pro Feature
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">
                        Get the Full AI-Powered Repair Guide
                    </h2>
                    <p className="text-gray-400 mb-2 max-w-xl mx-auto">
                        Exact torque specs, part numbers, wiring diagrams, and step-by-step instructions tailored to your <strong className="text-white">{vehicleName}</strong>.
                    </p>
                    <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                        Pro members get unlimited AI guides for every vehicle in their garage — plus OBD-II scanner integration and PDF downloads.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a
                            href="https://buy.stripe.com/cNi14na6t8iycykeo718c08"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-4 bg-brand-cyan text-black font-bold rounded-xl hover:bg-cyan-400 transition-colors text-lg"
                        >
                            Upgrade to Pro — $9.99/mo
                        </a>
                        <Link
                            href="/auth"
                            className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
                        >
                            Try Free (3 guides/month)
                        </Link>
                    </div>
                    <p className="text-xs text-gray-600 mt-4">Cancel anytime · 14-day money-back guarantee</p>
                </div>
            </article>

            {/* Client-side AI Guide */}
            <GuideContent params={resolvedParams} />

            {/* More SEO Content */}
            <section className="max-w-6xl mx-auto px-4 py-8 border-t border-white/10">
                <h2 className="text-xl font-bold text-white mb-4">
                    About {cleanTask.charAt(0).toUpperCase() + cleanTask.slice(1)} on {displayMake} {displayModel}
                </h2>
                <p className="text-gray-400 mb-4">
                    Performing a {cleanTask} on your {vehicleName} is a common maintenance task that
                    most DIY mechanics can handle with basic tools. By doing this repair yourself,
                    you can save $100-400 compared to dealership or shop prices.
                </p>
                <p className="text-gray-400 mb-4">
                    The {displayMake} {displayModel} has been in production for many years, and {cleanTask} procedures
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

            {/* ── Related Repairs ─────────────────────────────────────────── */}
            {/* This section provides internal links so Google can crawl between */}
            {/* repair pages, solving the orphan-page problem. */}
            <section className="max-w-6xl mx-auto px-4 py-10 border-t border-white/10">
                <h2 className="text-xl font-bold text-white mb-6">Related Repairs for Your {displayMake} {displayModel}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {VALID_TASKS
                        .filter(t => t !== task)
                        .map(relTask => (
                            <Link
                                key={relTask}
                                href={`/repair/${year}/${make}/${model}/${relTask}`}
                                className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.06] transition-all group"
                            >
                                <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
                                <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                                    {year} {displayMake} {displayModel} {toTitleCase(relTask)}
                                </span>
                            </Link>
                        ))
                    }
                </div>

                <h2 className="text-xl font-bold text-white mt-10 mb-6">
                    {cleanTask.charAt(0).toUpperCase() + cleanTask.slice(1)} Guides for Other Vehicles
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { y: '2013', mk: 'bmw', mo: 'x3' },
                        { y: '2009', mk: 'bmw', mo: 'x5' },
                        { y: '2013', mk: 'toyota', mo: 'corolla' },
                        { y: '2013', mk: 'honda', mo: 'odyssey' },
                        { y: '2013', mk: 'nissan', mo: 'rogue' },
                        { y: '2012', mk: 'nissan', mo: 'sentra' },
                        { y: '2012', mk: 'chevrolet', mo: 'malibu' },
                        { y: '2012', mk: 'kia', mo: 'soul' },
                        { y: '2011', mk: 'subaru', mo: 'forester' },
                    ]
                        .filter(v => !(v.y === year && v.mk === make.toLowerCase() && v.mo === model.toLowerCase()))
                        .slice(0, 6)
                        .map(v => {
                            const relMake = getDisplayName(v.mk, 'make') || toTitleCase(v.mk);
                            const relModel = getDisplayName(v.mo, 'model') || toTitleCase(v.mo);
                            return (
                                <Link
                                    key={`${v.y}-${v.mk}-${v.mo}`}
                                    href={`/repair/${v.y}/${v.mk}/${v.mo}/${task}`}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.06] transition-all group"
                                >
                                    <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                                    <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                                        {v.y} {relMake} {relModel} {toTitleCase(task)}
                                    </span>
                                </Link>
                            );
                        })
                    }
                </div>

                <div className="mt-8">
                    <Link
                        href="/#popular-guides"
                        className="inline-flex items-center gap-2 text-cyan-500 hover:text-cyan-400 text-sm font-medium transition-colors"
                    >
                        ← View All Popular Repair Guides
                    </Link>
                </div>
            </section>
        </>
    );
}
