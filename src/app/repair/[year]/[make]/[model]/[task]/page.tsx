import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import DeferredGuideContent from './DeferredGuideContent';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';
import { ShoppingCartIcon, WrenchIcon, ClockIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';
import Link from 'next/link';
import AffiliateLink from '@/components/AffiliateLink';
import AdUnit from '@/components/AdUnit';
import KnowledgeGraphGroup from '@/components/KnowledgeGraphGroup';
import RepairSectionTracker from '@/components/RepairSectionTracker';
import RepairTrackedLink from '@/components/RepairTrackedLink';
import { PricingTrackedLink } from '@/components/PricingTracking';
import { getTier1RescueEntryByHref, getTier1RescuePagesForExactVehicle, getTier1RescuePagesForVehicle } from '@/data/rescuePriority';
import { buildSymptomHref, getSymptomClustersForRepairTask } from '@/data/symptomGraph';
import { isValidVehicleCombination, getClampedYear, getDisplayName, VALID_TASKS, NOINDEX_MAKES, isNonUsModel, VEHICLE_PRODUCTION_YEARS, slugifyRoutePart, CORPUS_YEAR_MAX, isCorpusBacked } from '@/data/vehicles';
import { getOEMExcerptsForRepair } from '@/lib/manualSectionLinks';
import CorpusBadge from '@/components/CorpusBadge';
import OEMExcerpt from '@/components/OEMExcerpt';
import TopdonProductSpotlight from '@/components/TopdonProductSpotlight';
import CoverageWaitlist from '@/components/CoverageWaitlist';
import { getVehicleRepairSpec, PartSpec } from '@/data/vehicle-repair-specs';
import { getRelatedToolLinksForRepair } from '@/data/tools-pages';
import { getPriorityCodePagesForTasks, getPrioritySymptomHubsForTasks, getSupportGapRepairsForTasks } from '@/lib/graphPriorityLinks';
import { buildRepairKnowledgeGraph } from '@/lib/repairKnowledgeGraph';
import { buildEdgeReference, buildRepairNodeId, buildSymptomNodeId } from '@/lib/knowledgeGraph';
import { buildKnowledgeGraphExport } from '@/lib/knowledgeGraphExport';
import { rankKnowledgeGraphBlocks } from '@/lib/knowledgeGraphRanking';
import { buildRepairUrl } from '@/lib/vehicleIdentity';
import { buildVehicleHubGraphViaGateway } from '@/lib/vehicleHubGateway';

// ISR: cache repair pages for 6 hours (matches wiring pages)
export const revalidate = 21600;

// Helper — title-case a hyphenated slug (fallback for unknown makes/models)
function toTitleCase(slug: string): string {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function buildRepairPath(year: string, make: string, model: string, task: string): string {
    return buildRepairUrl(year, make, model, task);
}

function buildManualBrowserPath(...segments: string[]): string {
    return `/manual/${segments.map((segment) => encodeURIComponent(segment)).join('/')}`;
}

function getRepairAnswerTarget(args: {
    href: string;
    year: string;
    make: string;
    model: string;
    task: string;
    vehicleHubHref: string;
    manualMakeHref: string;
    manualYearHref: string;
    fullGuideHref: string;
}): string {
    if (args.href === '#quick-answer') return 'jump_to_quick_answer';
    if (args.href === '#parts-needed') return 'parts_needed';
    if (args.href === args.fullGuideHref) return 'full_guide';
    if (args.href === args.vehicleHubHref) return 'vehicle_hub';
    if (args.href === args.manualYearHref) return 'manual_year';
    if (args.href === args.manualMakeHref) return 'manual_make';
    if (args.href.startsWith(`/repair/${args.year}/${args.make}/${args.model}/`) && !args.href.endsWith(`/${args.task}`)) {
        return 'related_repair';
    }

    return 'support_link';
}

function getSparkPlugIgnitionNote(
    year: string,
    make: string,
    model: string,
    task: string,
): { title: string; body: string; faqQuestion: string; faqAnswer: string } | null {
    if (task !== 'spark-plug-replacement') return null;

    if (year === '2008' && make === 'chevrolet' && model === 'impala') {
        return {
            title: '2008 Chevrolet Impala 3.5L Ignition Layout',
            body: 'For the common 3.5L V6 setup, the 2008 Chevrolet Impala uses coil-on-plug ignition rather than traditional spark plug wires. Each cylinder has its own ignition coil mounted over the spark plug, so you disconnect the coil connectors and remove the coils to reach the plugs. Verify your exact engine before ordering parts.',
            faqQuestion: 'Does a 2008 Chevrolet Impala 3.5L use coil-on-plug or spark plug wires?',
            faqAnswer: 'For the common 3.5L V6 configuration, the 2008 Chevrolet Impala uses coil-on-plug ignition instead of traditional spark plug wires. Each spark plug sits under its own ignition coil, so spark plug service starts by unplugging and removing the individual coils. Verify your exact engine before ordering ignition parts.',
        };
    }

    return null;
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
    },
    'tail-light-replacement': {
        difficulty: 'Easy',
        time: '15-30 minutes',
        tools: ['Trim tool', 'Screwdriver set', 'Gloves', 'Flashlight'],
        parts: ['Tail light bulb or lamp assembly', 'Socket seal or gasket (if required)'],
        warnings: ['Confirm driver or passenger side before ordering', 'Test brake, turn, and running lights before reassembly', 'Watch for broken clips around the lens'],
        steps: ['Open the rear access panel or trim cover', 'Disconnect the connector or bulb socket', 'Remove the lamp fasteners', 'Swap the bulb or assembly', 'Check the seal and reconnect', 'Test all rear lighting functions']
    },
    'transmission-fluid-change': {
        difficulty: 'Intermediate',
        time: '45-90 minutes',
        tools: ['Drain pan', 'Funnel', 'Socket set', 'Torque wrench', 'Jack stands'],
        parts: ['Correct transmission fluid', 'Drain plug washer or pan gasket', 'Transmission filter (if applicable)'],
        warnings: ['Use the exact fluid spec for your transmission', 'Check whether your vehicle is drain-and-fill or pan-drop service', 'Do not overfill after refilling'],
        steps: ['Verify the correct transmission fluid spec', 'Raise and secure the vehicle if needed', 'Drain or service the pan per your vehicle method', 'Replace washer, gasket, or filter if applicable', 'Refill with the specified fluid amount', 'Check level and inspect for leaks']
    },
    'coolant-flush': {
        difficulty: 'Easy to Intermediate',
        time: '1-2 hours',
        tools: ['Drain pan', 'Funnel', 'Pliers', 'Gloves', 'Distilled water if mixing'],
        parts: ['Correct coolant', 'Distilled water', 'Clamps or seals (if leaking)'],
        warnings: ['Work on a cold engine only', 'Do not mix incompatible coolant chemistries', 'Bleed air from the system after refill'],
        steps: ['Let the engine cool completely', 'Drain the old coolant', 'Flush or rinse the system if required', 'Refill with the correct coolant mix', 'Bleed air from the system', 'Check level and inspect for leaks']
    },
    'fuel-filter-replacement': {
        difficulty: 'Intermediate',
        time: '30-60 minutes',
        tools: ['Line wrench set', 'Catch pan', 'Safety glasses', 'Shop rags'],
        parts: ['Fuel filter', 'Seals or line clips if required'],
        warnings: ['Relieve fuel pressure before opening the system', 'Confirm flow direction before installation', 'Keep sparks and open flame away from the work area'],
        steps: ['Relieve fuel pressure', 'Locate the external filter or service access', 'Mark flow direction and disconnect lines', 'Replace the filter and seals', 'Reconnect the lines and secure clips', 'Prime and check for leaks']
    }
};

const RELATED_TASK_PRIORITIES: Record<string, string[]> = {
    'radiator-replacement': [
        'coolant-flush',
        'thermostat-replacement',
        'water-pump-replacement',
        'serpentine-belt-replacement',
        'drive-belt-replacement',
        'head-gasket-replacement',
    ],
    'oil-change': [
        'engine-air-filter-replacement',
        'cabin-air-filter-replacement',
        'spark-plug-replacement',
        'battery-replacement',
        'serpentine-belt-replacement',
        'coolant-flush',
    ],
    'serpentine-belt-replacement': [
        'alternator-replacement',
        'water-pump-replacement',
        'drive-belt-replacement',
        'battery-replacement',
        'coolant-flush',
    ],
    'battery-replacement': [
        'alternator-replacement',
        'starter-replacement',
        'spark-plug-replacement',
        'serpentine-belt-replacement',
    ],
    'tail-light-replacement': [
        'headlight-bulb-replacement',
        'battery-replacement',
        'engine-air-filter-replacement',
    ],
    'transmission-fluid-change': [
        'coolant-flush',
        'oil-change',
        'brake-fluid-flush',
    ],
    'coolant-flush': [
        'thermostat-replacement',
        'radiator-replacement',
        'water-pump-replacement',
    ],
    'fuel-filter-replacement': [
        'fuel-pump-replacement',
        'spark-plug-replacement',
        'engine-air-filter-replacement',
    ],
};

const DEFAULT_REPAIR = {
    difficulty: 'Varies',
    time: '1-3 hours',
    tools: ['Basic hand tools', 'Vehicle-specific tools may be required'],
    parts: ['See repair guide for specific parts'],
    warnings: ['Consult service manual for your specific vehicle', 'Disconnect battery if working near electrical components'],
    steps: ['Research procedure for your specific vehicle', 'Gather required tools and parts', 'Follow manufacturer service procedures', 'Test repair before returning vehicle to service']
};

// Task-specific title and description overrides — tuned for SERP click-through.
// Titles kept short (~30 chars) so full "<Year Make Model> <Title> | SpotOnAuto" fits in ~60 chars.
// Descriptions front-load the answer, include time/savings, end with differentiator.
const TASK_META: Record<string, { title: string; description: string; extraKeywords: string[] }> = {
    'serpentine-belt-replacement': {
        title: 'Serpentine Belt Diagram & Replacement',
        description: 'Get the exact serpentine belt routing diagram and step-by-step replacement guide for your {v}. Includes belt size, tensioner check, and squeal diagnosis. Save $100–$200 vs. the shop.',
        extraKeywords: ['serpentine belt diagram', 'belt routing diagram', 'belt replacement cost'],
    },
    'timing-belt-replacement': {
        title: 'Timing Belt Replacement Guide',
        description: 'Complete step-by-step timing belt replacement for your {v} featuring timing marks diagrams, torque specs, and water pump tips. Interference engine warning and DIY costs included.',
        extraKeywords: ['timing belt diagram', 'timing marks', 'timing belt cost'],
    },
    'battery-replacement': {
        title: 'Battery Replacement — Size & Cost',
        description: 'Find the exact battery group size, terminal location, and step-by-step replacement steps for your {v}. Simple 15-minute DIY job — save $50–$100 vs. the dealer. Free guide with OEM specs.',
        extraKeywords: ['battery location', 'battery group size', 'battery replacement cost'],
    },
    'oil-change': {
        title: 'Correct Oil Type & Capacity',
        description: 'Get the exact oil weight, capacity, and filter part number for your {v}. Includes drain plug torque, reset procedures, and change intervals. 30-min DIY — save up to $120 vs. the shop.',
        extraKeywords: ['oil type', 'oil capacity', 'oil weight', 'oil change cost'],
    },
    'spark-plug-replacement': {
        title: 'Spark Plug Replacement Guide',
        description: 'Exact spark plug part number, gap, and torque specs for your {v}. Includes coil-on-plug diagrams, change intervals, and anti-seize application tips. Comprehensive free step-by-step guide.',
        extraKeywords: ['coil on plug', 'spark plug wires diagram', 'ignition coil replacement', 'spark plug gap', 'spark plug torque'],
    },
    'headlight-bulb-replacement': {
        title: 'Headlight Bulb Size & Replacement',
        description: 'Find the correct headlight bulb size and step-by-step replacement steps for your {v}. Covers low beam, high beam, and DRL fitment. 10–30 min DIY guide — no special tools required.',
        extraKeywords: ['headlight bulb size', 'how to change headlight bulb', 'headlight removal', 'headlight replacement diagram'],
    },
    'tail-light-replacement': {
        title: 'Tail Light Replacement Guide',
        description: 'Step-by-step tail light and brake light replacement for your {v}. Includes bulb vs. full assembly checks, correct bulb numbers, and access instructions. Quick 10–20 min DIY repair.',
        extraKeywords: ['tail light replacement', 'tail light bulb replacement', 'tail light assembly', 'rear light replacement'],
    },
    'alternator-replacement': {
        title: 'Alternator Replacement — Cost & DIY',
        description: 'How to diagnose, test, and replace the alternator on your {v}. Includes voltage test steps, failure symptoms, and realistic cost ranges. Free guide — save $150–$300 vs. shop labor.',
        extraKeywords: ['alternator symptoms', 'bad alternator signs', 'alternator cost', 'alternator testing'],
    },
    'starter-replacement': {
        title: 'Starter Replacement — Cost & Steps',
        description: 'Car won\'t start? Click-no-crank? Diagnose and replace the starter on your {v} with this guide. Includes location, wiring checks, and removal. Free guide — save $150–$400 vs. shop.',
        extraKeywords: ['starter symptoms', 'car wont start clicking', 'starter location', 'starter replacement cost'],
    },
    'brake-pad-replacement': {
        title: 'Brake Pad Replacement — DIY Guide',
        description: 'Step-by-step brake pad replacement for your {v}. Includes correct pad sizes, caliper torque specs, and pad bed-in procedures. 1-hour DIY — save $100–$250 per axle vs. the shop.',
        extraKeywords: ['how to change brake pads', 'brake pad size', 'brake pad cost', 'brake pad replacement steps'],
    },
    'brake-rotor-replacement': {
        title: 'Brake Rotor Replacement Guide',
        description: 'Exact rotor size and minimum thickness specs for your {v}. Step-by-step replacement with hub cleaning tips and torque specs. Always replace rotors in pairs for safety and performance.',
        extraKeywords: ['brake rotor size', 'minimum rotor thickness', 'rotor replacement cost', 'how to replace rotors'],
    },
    'water-pump-replacement': {
        title: 'Water Pump Replacement Guide',
        description: 'Water pump failure signs, exact location, and step-by-step replacement for your {v}. Covers gasket vs. O-ring choice, coolant type, and belt-driven vs. chain-driven repair notes.',
        extraKeywords: ['water pump symptoms', 'water pump location', 'water pump cost', 'water pump replacement steps'],
    },
    'thermostat-replacement': {
        title: 'Thermostat Location & Replacement',
        description: 'Find the exact thermostat location and step-by-step replacement steps for your {v}. Includes overheating diagnosis, coolant specs, and bleed sequence. Typical DIY cost: $30–$80.',
        extraKeywords: ['thermostat location', 'thermostat symptoms', 'thermostat replacement cost', 'overheating fix'],
    },
    'radiator-replacement': {
        title: 'Radiator Replacement — DIY Guide',
        description: 'Step-by-step radiator replacement for your {v}. Includes coolant drain tips, hose clamp removal, and transmission cooler line notes. Save $200–$500 vs. shop labor with this free guide.',
        extraKeywords: ['radiator replacement cost', 'radiator leak fix', 'coolant flush', 'how to replace radiator'],
    },
    'cabin-air-filter-replacement': {
        title: 'Cabin Air Filter — Size & Location',
        description: 'Find the exact cabin air filter size and location for your {v}. 5-minute DIY job — no tools required for most models. Filter direction and change intervals included for fresh cabin air.',
        extraKeywords: ['cabin air filter size', 'cabin filter location', 'how to change cabin air filter', 'cabin filter replacement'],
    },
    'engine-air-filter-replacement': {
        title: 'Engine Air Filter Size & Replacement',
        description: 'Correct engine air filter part number and replacement steps for your {v}. 5-minute airbox service — no special tools needed. Includes change intervals and fitment check tips.',
        extraKeywords: ['engine air filter size', 'air filter part number', 'how to change air filter', 'air filter replacement'],
    },
    'ignition-coil-replacement': {
        title: 'Ignition Coil Replacement Guide',
        description: 'How to test and replace a bad ignition coil on your {v}. Includes misfire code diagnosis (P0300), coil-on-plug vs. distributor checks, and step-by-step replacement. Free DIY repair guide.',
        extraKeywords: ['ignition coil symptoms', 'coil on plug replacement', 'misfire fix', 'ignition coil location'],
    },
    'oxygen-sensor-replacement': {
        title: 'O2 Sensor Location & Replacement',
        description: 'Upstream and downstream O2 sensor locations for your {v}. Includes symptoms, thread sizes, and step-by-step replacement with anti-seize tips. Save $100–$200 vs. dealer service.',
        extraKeywords: ['o2 sensor symptoms', 'oxygen sensor location', 'upstream downstream sensor', 'o2 sensor replacement'],
    },
    'catalytic-converter-replacement': {
        title: 'Catalytic Converter — P0420 & Cost',
        description: 'Dealing with P0420? Catalytic converter diagnosis and replacement guide for your {v}. OEM vs. aftermarket comparison, upstream vs. downstream, and realistic repair cost ranges.',
        extraKeywords: ['catalytic converter symptoms', 'p0420 fix', 'catalytic converter cost', 'cat converter replacement'],
    },
    'transmission-fluid-change': {
        title: 'Transmission Fluid Type & Capacity',
        description: 'Find the correct transmission fluid type and capacity for your {v}. Step-by-step drain-and-fill with dipstick location and filter change tips. Comprehensive free DIY service guide.',
        extraKeywords: ['transmission-fluid-type', 'ATF type', 'transmission fluid capacity', 'how to change transmission fluid'],
    },
    'coolant-flush': {
        title: 'Coolant Type & Flush Procedure',
        description: 'Exact coolant type and system capacity for your {v}. Step-by-step flush guide with drain location, bleed sequence, and change intervals. Free DIY guide for cooling system health.',
        extraKeywords: ['coolant type', 'antifreeze type', 'coolant flush procedure', 'how to flush coolant'],
    },
    'cv-axle-replacement': {
        title: 'CV Axle — Clicking Fix & Replacement',
        description: 'Clicking when turning? CV axle diagnosis and step-by-step replacement guide for your {v}. Covers inner vs. outer joints, torque specs, and cost. Save $200–$400 vs. shop labor.',
        extraKeywords: ['cv axle symptoms', 'cv joint clicking when turning', 'cv axle replacement cost', 'how to replace cv axle'],
    },
    'shock-absorber-replacement': {
        title: 'Shock Replacement — Symptoms & DIY',
        description: 'Worn shocks? Diagnose bouncing, nose dive, and uneven tire wear on your {v}. Complete step-by-step shock replacement guide to restore ride quality. Save $150–$400 vs. the shop.',
        extraKeywords: ['shock absorber symptoms', 'shocks replacement cost', 'how to replace shocks', 'bad shocks signs'],
    },
    'strut-replacement': {
        title: 'Strut Replacement — DIY Guide & Cost',
        description: 'Front and rear strut replacement guide for your {v}. Covers failure symptoms, spring compressor safety, torque specs, and alignment notes. Save $200–$500 vs. shop labor costs.',
        extraKeywords: ['strut symptoms', 'strut replacement cost', 'how to replace struts', 'quick strut installation'],
    },
    'fuel-pump-replacement': {
        title: 'Fuel Pump — Symptoms & Replacement',
        description: 'Fuel pump failure signs and step-by-step replacement for your {v}. Covers in-tank vs. external types, pressure specs, and priming procedures. Free guide with professional OEM data.',
        extraKeywords: ['fuel pump symptoms', 'fuel pump location', 'fuel pump replacement cost', 'no fuel pressure fix'],
    },
    'fuel-filter-replacement': {
        title: 'Fuel Filter Location & Replacement',
        description: 'Exact fuel filter location and step-by-step replacement steps for your {v}. Includes flow direction, pressure-relief steps, and fitment checks before you buy the part. Free DIY guide.',
        extraKeywords: ['fuel filter location', 'fuel filter replacement cost', 'how to change fuel filter', 'fuel filter symptoms'],
    },
};

interface CommercialTaskConfig {
    primaryActionLabel: string;
    primaryActionHint: string;
    guideActionLabel: string;
    guideActionHint: string;
    partsTitle: string;
    partsIntro: string;
    spotlightTitle: string;
    spotlightIntro: string;
    bundleActionLabel: string;
    fitmentChecks: string[];
}

const DEFAULT_COMMERCIAL_TASK_CONFIG: CommercialTaskConfig = {
    primaryActionLabel: 'Check exact-fit parts',
    primaryActionHint: 'Open the highest-intent parts search first, then come back here for warnings, tools, and the short procedure.',
    guideActionLabel: 'Open full repair guide',
    guideActionHint: 'Load the interactive guide only when you want the expanded walkthrough, extra specs, and the vehicle health snapshot.',
    partsTitle: 'Exact-fit parts to confirm',
    partsIntro: 'These links are tuned for this repair. Confirm engine, trim, and production split before you place the order.',
    spotlightTitle: 'Fastest parts to verify before checkout',
    spotlightIntro: 'Use these quick searches when you want the main replacement item first and the support pieces second.',
    bundleActionLabel: 'Search full repair parts',
    fitmentChecks: [
        'Amazon results open in a new tab so you can keep this repair flow visible.',
        'Confirm engine, trim, and production split before checkout.',
        'Use the warnings and torque notes below as your final pre-order check.',
    ],
};

const COMMERCIAL_TASK_CONFIG: Partial<Record<string, CommercialTaskConfig>> = {
    'battery-replacement': {
        primaryActionLabel: 'Check battery fitment now',
        primaryActionHint: 'Start with group size, CCA, and terminal layout so you do not buy the wrong battery first.',
        guideActionLabel: 'Open battery guide with reset notes',
        guideActionHint: 'Use the full guide if you want the terminal order, hold-down access, and any registration or module reset notes.',
        partsTitle: 'Battery options and install supplies',
        partsIntro: 'Battery jobs fail fast when group size, terminal orientation, or hold-down shape is wrong. Check those before you order.',
        spotlightTitle: 'Most important battery searches first',
        spotlightIntro: 'Lead with the battery itself, then add terminal care items only if you still need them.',
        bundleActionLabel: 'Search battery replacement kit',
        fitmentChecks: [
            'Verify group size, CCA, and terminal orientation.',
            'Check whether your vehicle needs battery registration or a memory saver.',
            'Keep the install order handy: negative off first, positive back on first.',
        ],
    },
    'alternator-replacement': {
        primaryActionLabel: 'Compare exact alternator options',
        primaryActionHint: 'Alternator jobs are high-intent because amperage, pulley style, and connector shape all need to match before you wrench.',
        guideActionLabel: 'Open alternator guide with charge checks',
        guideActionHint: 'Use the full guide when you want charging-system context, routing notes, and post-install test reminders.',
        partsTitle: 'Alternator fitment and supporting parts',
        partsIntro: 'Confirm amperage, connector style, and pulley details before ordering. Belt condition matters on this job too.',
        spotlightTitle: 'Fitment-critical alternator searches',
        spotlightIntro: 'Start with the charging component that strands the car, then confirm the belt and supporting hardware.',
        bundleActionLabel: 'Search alternator repair parts',
        fitmentChecks: [
            'Match amperage output and electrical connector style.',
            'Confirm pulley or clutch style before checkout.',
            'Inspect the serpentine belt and routing before reinstalling.',
        ],
    },
    'starter-replacement': {
        primaryActionLabel: 'Check starter fitment now',
        primaryActionHint: 'Starter access is labor-heavy on many vehicles, so verifying engine and transmission fitment first saves the most wasted time.',
        guideActionLabel: 'Open starter guide with access notes',
        guideActionHint: 'Use the full guide when you want location details, wiring order, and removal sequence before going under the vehicle.',
        partsTitle: 'Starter fitment and hardware',
        partsIntro: 'Starter part numbers often split by engine, transmission, or drive layout. Double-check those before you order.',
        spotlightTitle: 'Highest-risk starter ordering checks',
        spotlightIntro: 'Match the starter first, then confirm bolts or electrical supplies if corrosion is likely.',
        bundleActionLabel: 'Search starter replacement parts',
        fitmentChecks: [
            'Match engine and transmission before checkout.',
            'Confirm mounting ear count and electrical terminal layout.',
            'Plan access first because this job often starts under the vehicle.',
        ],
    },
    'brake-pad-replacement': {
        primaryActionLabel: 'Compare brake pad sets',
        primaryActionHint: 'Brake jobs convert best when the buyer can verify front or rear location, pad shape, and any package code before ordering.',
        guideActionLabel: 'Open brake guide with bed-in steps',
        guideActionHint: 'Use the full guide for caliper access notes, piston direction reminders, and the short bed-in sequence after install.',
        partsTitle: 'Brake pads, hardware, and consumables',
        partsIntro: 'Pad fitment changes with axle position, package code, and rotor size. Confirm those before you commit.',
        spotlightTitle: 'Brake items to validate before disassembly',
        spotlightIntro: 'Lead with the pad set, then add hardware and grease so you do not stop mid-job.',
        bundleActionLabel: 'Search brake pad replacement parts',
        fitmentChecks: [
            'Confirm front vs rear before ordering.',
            'Check pad shape against rotor size or brake package code.',
            'Replace or inspect hardware so the new pads slide correctly.',
        ],
    },
    'serpentine-belt-replacement': {
        primaryActionLabel: 'Check belt fitment and length',
        primaryActionHint: 'The right belt depends on engine and accessory layout, so length and rib count should be your first filter.',
        guideActionLabel: 'Open belt guide with routing notes',
        guideActionHint: 'Use the full guide when you want routing context, tensioner notes, and the shortest install path.',
        partsTitle: 'Belt fitment and routing support',
        partsIntro: 'Serpentine belts vary by engine, A/C package, and accessory layout. Confirm rib count and overall length first.',
        spotlightTitle: 'Belt searches that prevent wrong-order delays',
        spotlightIntro: 'Start with the belt, then verify tensioner or idler parts if squeal or wobble was part of the original symptom.',
        bundleActionLabel: 'Search serpentine belt parts',
        fitmentChecks: [
            'Verify engine-specific belt length and rib count.',
            'Check whether the tensioner or idler should be replaced at the same time.',
            'Keep the routing notes below open while you compare listings.',
        ],
    },
    'thermostat-replacement': {
        primaryActionLabel: 'Compare thermostat kits',
        primaryActionHint: 'Thermostat jobs convert when the buyer can confirm housing style, gasket coverage, and coolant needs in one pass.',
        guideActionLabel: 'Open thermostat guide with bleed notes',
        guideActionHint: 'Use the full guide if you want the cooling-system sequence, bleed reminders, and access cautions before opening the housing.',
        partsTitle: 'Thermostat fitment, gasket, and coolant items',
        partsIntro: 'Thermostat jobs often need the thermostat, seal, and coolant together. Verify housing style and temperature rating before checkout.',
        spotlightTitle: 'Cooling-system items to lock in first',
        spotlightIntro: 'Start with the thermostat assembly, then add sealing and refill items so the car does not sit apart waiting on coolant.',
        bundleActionLabel: 'Search thermostat replacement parts',
        fitmentChecks: [
            'Confirm thermostat or housing style for your engine.',
            'Check whether the gasket or seal is included.',
            'Plan for the correct coolant and bleed procedure before opening the system.',
        ],
    },
    'tail-light-replacement': {
        primaryActionLabel: 'Check tail light fitment now',
        primaryActionHint: 'Tail light jobs convert best when the buyer can verify bulb-only vs. full assembly, plus left or right side, before ordering.',
        guideActionLabel: 'Open tail light guide with access notes',
        guideActionHint: 'Use the full guide when you want lens access, connector checks, and the quick bulb-or-assembly decision before teardown.',
        partsTitle: 'Tail light bulbs, assemblies, and seal checks',
        partsIntro: 'Tail light fitment changes with side, bulb style, and whether the car uses a complete lamp assembly. Verify those before checkout.',
        spotlightTitle: 'Lighting searches that prevent the wrong part',
        spotlightIntro: 'Start with the lamp or bulb, then confirm the correct side and socket style so the new light fits the first time.',
        bundleActionLabel: 'Search tail light replacement parts',
        fitmentChecks: [
            'Confirm driver or passenger side before ordering.',
            'Check whether you need a bulb, socket, or full lamp assembly.',
            'Inspect the seal or housing for moisture before reinstalling.',
        ],
    },
    'transmission-fluid-change': {
        primaryActionLabel: 'Check transmission fluid spec',
        primaryActionHint: 'Transmission fluid jobs fail when the ATF spec or service method is wrong, so confirm both before you buy anything.',
        guideActionLabel: 'Open transmission fluid guide with service notes',
        guideActionHint: 'Use the full guide when you want drain-and-fill guidance, pan-drop caution, and the exact refill path for your vehicle.',
        partsTitle: 'Transmission fluid, washer, and service items',
        partsIntro: 'Transmission jobs often need the exact ATF, a drain plug washer or pan gasket, and in some cases a filter. Match the service method first.',
        spotlightTitle: 'Transmission searches that matter first',
        spotlightIntro: 'Lead with the fluid spec, then add the service hardware only if your vehicle uses a pan drop or filter service.',
        bundleActionLabel: 'Search transmission fluid parts',
        fitmentChecks: [
            'Confirm the exact ATF spec before checkout.',
            'Check whether your vehicle is drain-and-fill, pan-drop, or dipstick service.',
            'Plan for a washer, gasket, or filter only if the service method requires it.',
        ],
    },
    'coolant-flush': {
        primaryActionLabel: 'Check coolant type now',
        primaryActionHint: 'Coolant jobs are mostly about chemistry and capacity, so match the coolant type before you start the flush.',
        guideActionLabel: 'Open coolant guide with bleed notes',
        guideActionHint: 'Use the full guide when you want the flush sequence, bleed reminders, and the exact refill mix for your vehicle.',
        partsTitle: 'Coolant, distilled water, and refill items',
        partsIntro: 'Cooling-system service often needs the correct coolant type, total capacity, and sometimes distilled water for the mix. Confirm the spec before checkout.',
        spotlightTitle: 'Cooling searches that keep the flush simple',
        spotlightIntro: 'Start with the coolant type, then verify the refill volume and any seals or clamps you may need while the system is open.',
        bundleActionLabel: 'Search coolant flush parts',
        fitmentChecks: [
            'Match coolant chemistry and color family before mixing anything.',
            'Confirm total refill capacity and whether distilled water is needed.',
            'Let the engine cool completely before opening the system.',
        ],
    },
    'fuel-filter-replacement': {
        primaryActionLabel: 'Check fuel filter fitment',
        primaryActionHint: 'Fuel filter jobs can be external or in-tank, so verify the design and line orientation before ordering the part.',
        guideActionLabel: 'Open fuel filter guide with pressure notes',
        guideActionHint: 'Use the full guide when you want pressure-relief reminders, line orientation, and the shortest access path for your vehicle.',
        partsTitle: 'Fuel filter, seals, and line hardware',
        partsIntro: 'Fuel filter service may need the filter itself, new seals, or line clips depending on how the vehicle is built. Confirm the layout first.',
        spotlightTitle: 'Fuel system searches to lock in first',
        spotlightIntro: 'Start with the filter design, then add seals or clips only if the service opens the fuel line or housing.',
        bundleActionLabel: 'Search fuel filter replacement parts',
        fitmentChecks: [
            'Confirm external filter vs. in-tank design before ordering.',
            'Check flow direction and line orientation if the filter is inline.',
            'Relieve fuel pressure and plan for any seals or clips the service requires.',
        ],
    },
};

interface TaskSupportNote {
    eyebrow: string;
    title: string;
    intro: string;
    bullets: string[];
    tone: 'cyan' | 'emerald' | 'amber' | 'violet';
}

interface ExactGuideProfile {
    titleSuffix?: string;
    descriptionSuffix?: string;
    extraKeywords?: string[];
    supportNote?: TaskSupportNote;
    faq?: { question: string; answer: string };
}

interface IntentQuickAnswerLink {
    href: string;
    label: string;
}

interface IntentQuickAnswerCard {
    eyebrow: string;
    title: string;
    summary: string;
    bullets: string[];
    links: IntentQuickAnswerLink[];
    tone: TaskSupportNote['tone'];
}

interface IntentQuickAnswerModule {
    eyebrow: string;
    title: string;
    intro: string;
    tone: TaskSupportNote['tone'];
    cards: IntentQuickAnswerCard[];
}

interface QuickAnswerContext {
    year: string;
    make: string;
    model: string;
    task: string;
    cleanTask: string;
    vehicleName: string;
    vehicleHubHref: string;
    manualMakeHref: string;
    manualYearHref: string;
    fullGuideHref: string;
    repairData: {
        difficulty: string;
        time: string;
        tools: string[];
        parts: string[];
        warnings: string[];
        steps: string[];
    };
    commercialConfig: CommercialTaskConfig;
    vehicleSignals?: {
        vehicleNotes?: string[];
        torqueSpecs?: string;
        beltRouting?: string;
    };
}

const TASK_SUPPORT_NOTES: Partial<Record<string, TaskSupportNote>> = {
    'tail-light-replacement': {
        eyebrow: 'Quick check',
        title: 'Tail light jobs split into a few common versions',
        intro: 'Before you buy, confirm whether you need a bulb, socket, seal, or the full lamp assembly.',
        bullets: [
            'Check the side first: driver or passenger.',
            'Verify bulb-only vs. full assembly before checkout.',
            'Look for moisture, cracked lenses, or brittle clips while the housing is open.',
        ],
        tone: 'amber',
    },
    'transmission-fluid-change': {
        eyebrow: 'Quick check',
        title: 'Transmission fluid work is about the exact spec',
        intro: 'The wrong ATF or the wrong service method creates the most wasted time on this job.',
        bullets: [
            'Match the exact ATF spec before ordering anything.',
            'Confirm whether your vehicle is drain-and-fill or pan-drop service.',
            'Plan for a washer, gasket, or filter only if your transmission uses them.',
        ],
        tone: 'violet',
    },
    'coolant-flush': {
        eyebrow: 'Quick check',
        title: 'Coolant flushes are mostly chemistry and bleed process',
        intro: 'Owners get into trouble when they mix the wrong coolant or rush the refill with air still trapped in the system.',
        bullets: [
            'Match the coolant chemistry and color family.',
            'Let the engine cool fully before opening the system.',
            'Bleed air and recheck level after the first heat cycle.',
        ],
        tone: 'emerald',
    },
    'fuel-filter-replacement': {
        eyebrow: 'Quick check',
        title: 'Fuel filter access depends on the vehicle layout',
        intro: 'Some vehicles use a simple inline filter. Others bury the filter in a module or service access point.',
        bullets: [
            'Confirm external filter vs. in-tank design before ordering.',
            'Check flow direction and line orientation if the filter is inline.',
            'Relieve fuel pressure and keep replacement clips or seals handy.',
        ],
        tone: 'cyan',
    },
};

function getExactGuideProfile(year: string, make: string, model: string, task: string): ExactGuideProfile | null {
    const yearNum = Number(year);
    const makeKey = slugifyRoutePart(make);
    const modelKey = slugifyRoutePart(model);
    const taskKey = slugifyRoutePart(task);

    if (taskKey === 'headlight-bulb-replacement' && makeKey === 'jeep' && modelKey === 'grand-cherokee' && [2017, 2018, 2019].includes(yearNum)) {
        return {
            titleSuffix: 'Headlight Replacement Quick Check',
            descriptionSuffix: 'If you are here for 2017-2019 Jeep Grand Cherokee headlight replacement, verify bulb-only vs. full assembly, side, and connector access before ordering.',
            extraKeywords: [
                `${year} Jeep Grand Cherokee headlight replacement`,
                'Jeep Grand Cherokee headlight bulb replacement',
                'Grand Cherokee low beam bulb',
            ],
            supportNote: {
                eyebrow: 'Exact-fit quick check',
                title: `${year} Jeep Grand Cherokee headlights split into a few common setups`,
                intro: 'Use the exact vehicle context before ordering so you do not buy the wrong side or the wrong assembly style.',
                bullets: [
                    'Confirm whether you need a bulb, socket, or full lamp assembly.',
                    'Check driver vs. passenger side before checkout.',
                    'Look for connector access notes if the housing is tight behind the bumper or fender liner.',
                ],
                tone: 'amber',
            },
            faq: {
                question: `What should I verify first for a ${year} Jeep Grand Cherokee headlight replacement?`,
                answer: 'Confirm whether the job is bulb-only or a full assembly, then check driver or passenger side before ordering. If access is tight, use the vehicle hub first so you can compare wiring, codes, and related lighting pages before you buy parts.',
            },
        };
    }

    if (taskKey === 'battery-replacement' && makeKey === 'honda' && modelKey === 'civic' && yearNum === 2008) {
        return {
            titleSuffix: 'Battery Location, Group Size & Fitment Check',
            descriptionSuffix: 'For 2008 Honda Civic battery replacement, verify group size, terminal layout, and hold-down style before you order the battery.',
            extraKeywords: [
                '2008 Honda Civic battery replacement',
                'Honda Civic battery group size',
                'Honda Civic battery location',
            ],
            supportNote: {
                eyebrow: 'Exact-fit quick check',
                title: '2008 Honda Civic battery jobs are won by fitment first',
                intro: 'This is the kind of repair where the part should match before the wrench turns. A quick fitment check saves the most time.',
                bullets: [
                    'Confirm the battery group size before checkout.',
                    'Check terminal orientation and hold-down shape.',
                    'Plan for a memory saver only if your setup calls for one.',
                ],
                tone: 'emerald',
            },
            faq: {
                question: 'What should I check before buying a 2008 Honda Civic battery?',
                answer: 'Verify the battery group size, terminal orientation, and hold-down shape before you buy. If the car has electronic memory concerns, keep a memory saver on hand so the install stays simple.',
            },
        };
    }

    if (taskKey === 'transmission-fluid-change' && makeKey === 'acura' && modelKey === 'tsx' && yearNum === 2004) {
        return {
            titleSuffix: 'ATF Type, Capacity & Fill Check',
            descriptionSuffix: 'For 2004 Acura TSX transmission fluid, confirm the exact ATF spec, service method, and refill amount before opening the transmission.',
            extraKeywords: [
                '2004 Acura TSX transmission fluid',
                'Acura TSX ATF type',
                'Acura TSX transmission fluid capacity',
            ],
            supportNote: {
                eyebrow: 'Exact-fit quick check',
                title: '2004 Acura TSX transmission fluid is spec-sensitive',
                intro: 'This job pays to verify the fluid spec and the service method first, because the wrong ATF creates more problems than it solves.',
                bullets: [
                    'Match the exact ATF spec before ordering.',
                    'Confirm whether your service is drain-and-fill or a pan-drop method.',
                    'Plan for a washer, gasket, or filter only if the transmission uses them.',
                ],
                tone: 'violet',
            },
            faq: {
                question: 'What should I confirm before changing transmission fluid on a 2004 Acura TSX?',
                answer: 'Confirm the exact ATF spec, whether the service is drain-and-fill or pan-drop, and the refill amount before you open anything. That keeps the job from turning into a troubleshooting exercise after the drain plug comes out.',
            },
        };
    }

    if (taskKey === 'headlight-bulb-replacement' && makeKey === 'kia' && modelKey === 'optima' && yearNum === 2019) {
        return {
            titleSuffix: 'Headlight Bulb Size & Assembly Check',
            descriptionSuffix: 'If you are here for 2019 Kia Optima headlight replacement, confirm bulb size, side, and whether the job is bulb-only or full assembly before ordering.',
            extraKeywords: [
                '2019 Kia Optima headlight replacement',
                '2019 Kia Optima headlight bulb replacement',
                'Kia Optima headlight bulb size',
            ],
            supportNote: {
                eyebrow: 'Exact-fit quick check',
                title: '2019 Kia Optima headlights are easiest when you verify the assembly first',
                intro: 'The fastest way to avoid a wrong-order delay is to confirm whether you are buying a bulb or a full lamp assembly.',
                bullets: [
                    'Check bulb-only vs. full assembly before checkout.',
                    'Confirm driver or passenger side if the job is one-sided.',
                    'Look for access notes if the housing sits behind a tight inner liner.',
                ],
                tone: 'amber',
            },
            faq: {
                question: 'What should I verify before buying a 2019 Kia Optima headlight part?',
                answer: 'Check whether you need a bulb or a full assembly, then confirm the side and connector style. If the car uses multiple trims or light packages, use the exact vehicle hub first so you stay on the right fitment path.',
            },
        };
    }

    if (makeKey === 'toyota' && modelKey === 'tacoma' && yearNum === 2020 && taskKey === 'cabin-air-filter-replacement') {
        return {
            titleSuffix: 'Cabin Filter Size, Location & Access Check',
            descriptionSuffix: 'For 2020 Toyota Tacoma cabin air filter replacement, confirm filter size, access point, and arrow direction before opening the glove box area.',
            extraKeywords: [
                '2020 Toyota Tacoma cabin air filter',
                'Toyota Tacoma cabin filter location',
                '2020 Tacoma cabin air filter replacement',
            ],
            supportNote: {
                eyebrow: 'Exact-fit quick check',
                title: '2020 Toyota Tacoma cabin air filter jobs are mostly about access',
                intro: 'Once you know the access path, this job is quick. The main risk is ordering the wrong size or installing the filter backward.',
                bullets: [
                    'Confirm the filter size before checkout.',
                    'Check the access panel or glove box release path first.',
                    'Watch the airflow arrow direction during install.',
                ],
                tone: 'cyan',
            },
            faq: {
                question: 'What should I check before replacing the cabin air filter on a 2020 Toyota Tacoma?',
                answer: 'Confirm the filter size, the access point, and the airflow arrow direction before you start. That keeps the job simple and prevents a second trip for the right filter.',
            },
        };
    }

    if (makeKey === 'toyota' && modelKey === 'tacoma' && yearNum === 2020 && taskKey === 'battery-replacement') {
        return {
            titleSuffix: 'Battery Size, Terminal Layout & Fitment Check',
            descriptionSuffix: 'For 2020 Toyota Tacoma battery replacement, verify group size, terminal orientation, and hold-down shape before you order the battery.',
            extraKeywords: [
                '2020 Toyota Tacoma battery replacement',
                'Toyota Tacoma battery group size',
                'Toyota Tacoma battery location',
            ],
            supportNote: {
                eyebrow: 'Exact-fit quick check',
                title: '2020 Toyota Tacoma battery replacement starts with the right fit',
                intro: 'The battery itself is the first thing to verify. After that, make sure the terminals and hold-down match the truck before ordering.',
                bullets: [
                    'Confirm group size and terminal orientation first.',
                    'Check the hold-down style before checkout.',
                    'Use a memory saver only if your trim or electronics call for it.',
                ],
                tone: 'emerald',
            },
            faq: {
                question: 'What should I verify before buying a 2020 Toyota Tacoma battery?',
                answer: 'Confirm the group size, terminal orientation, and hold-down style before you order. If the truck has memory-sensitive electronics, keep a memory saver handy so the swap stays quick.',
            },
        };
    }

    return null;
}

const TASK_SUPPORT_TONE_CLASSES: Record<TaskSupportNote['tone'], {
    shell: string;
    eyebrow: string;
    title: string;
    bullet: string;
}> = {
    cyan: {
        shell: 'border-cyan-500/20 bg-cyan-500/[0.06]',
        eyebrow: 'text-cyan-200/80',
        title: 'text-white',
        bullet: 'text-cyan-50/90',
    },
    emerald: {
        shell: 'border-emerald-500/20 bg-emerald-500/[0.06]',
        eyebrow: 'text-emerald-200/80',
        title: 'text-white',
        bullet: 'text-emerald-50/90',
    },
    amber: {
        shell: 'border-amber-500/20 bg-amber-500/[0.06]',
        eyebrow: 'text-amber-200/80',
        title: 'text-white',
        bullet: 'text-amber-50/90',
    },
    violet: {
        shell: 'border-violet-500/20 bg-violet-500/[0.06]',
        eyebrow: 'text-violet-200/80',
        title: 'text-white',
        bullet: 'text-violet-50/90',
    },
};

const HIGH_TICKET_PART_PATTERN = /alternator|starter|strut|shock|compressor|catalytic|manifold|radiator|transmission|turbo|differential|axle/i;

function getCommercialTaskConfig(task: string): CommercialTaskConfig {
    return COMMERCIAL_TASK_CONFIG[task] || DEFAULT_COMMERCIAL_TASK_CONFIG;
}

function getIntentQuickAnswerModule({
    year,
    make,
    model,
    task,
    cleanTask,
    vehicleName,
    vehicleHubHref,
    manualMakeHref,
    manualYearHref,
    fullGuideHref,
    repairData,
    commercialConfig,
    vehicleSignals,
}: QuickAnswerContext): IntentQuickAnswerModule {
    const primaryPart = repairData.parts[0] || cleanTask;
    const vehicleNote = vehicleSignals?.vehicleNotes?.[0];
    const torqueSpecs = vehicleSignals?.torqueSpecs;
    const beltRouting = vehicleSignals?.beltRouting;

    const taskLinks = (taskSlugs: string[]) => taskSlugs
        .filter((slug, index, array) => VALID_TASKS.includes(slug) && array.indexOf(slug) === index && slug !== task)
        .slice(0, 2)
        .map((slug) => ({
            href: buildRepairPath(year, make, model, slug),
            label: toTitleCase(slug),
        }));

    switch (task) {
        case 'battery-replacement':
            return {
                eyebrow: 'Quick answer',
                title: 'Battery fitment is the first thing to verify',
                intro: 'This page starts with the shortest path to the right battery, then points you to the full guide only if you need the longer procedure or reset notes.',
                tone: 'emerald',
                cards: [
                    {
                        eyebrow: 'Direct answer',
                        title: 'Confirm the battery before you order',
                        summary: `${vehicleName} battery jobs are won by fitment first, not by generic search results.`,
                        bullets: [
                            `Battery part: ${primaryPart}`,
                            'Confirm the CCA rating before checkout.',
                            'Verify group size, terminal orientation, and hold-down shape before checkout.',
                            'Use the negative-off / positive-on order when you install it.',
                            'Keep module reset or registration notes in view if your vehicle needs them.',
                        ],
                        links: [
                            { href: '#parts-needed', label: 'Review battery parts' },
                            { href: fullGuideHref, label: 'Open battery guide' },
                        ],
                    },
                    {
                        eyebrow: 'Before you order',
                        title: 'Match the fitment checks on this page',
                        summary: commercialConfig.primaryActionHint,
                        bullets: commercialConfig.fitmentChecks,
                        links: [
                            { href: manualYearHref, label: 'Browse year manual' },
                            { href: manualMakeHref, label: 'Browse make manual' },
                        ],
                    },
                    {
                        eyebrow: 'Next step',
                        title: 'If the symptom looks bigger than the battery',
                        summary: 'Charging and starter issues often show up next when a battery test is not the full story.',
                        bullets: [
                            'Use the vehicle hub to keep the exact year, make, and model context in view.',
                            'Compare the alternator and starter pages if the car still cranks slowly or not at all.',
                        ],
                        links: [
                            ...taskLinks(['alternator-replacement', 'starter-replacement']),
                            { href: vehicleHubHref, label: 'Vehicle hub' },
                        ],
                    },
                ].map((card) => ({ ...card, tone: 'cyan' as TaskSupportNote['tone'] })),
            };
        case 'headlight-bulb-replacement':
            return {
                eyebrow: 'Quick answer',
                title: 'Headlight bulb jobs hinge on fitment and access',
                intro: 'The page is organized around the exact bulb, the beam split, and the access path so you can buy once and install cleanly.',
                tone: 'amber',
                cards: [
                    {
                        eyebrow: 'Direct answer',
                        title: 'Confirm bulb size and beam position first',
                        summary: `${vehicleName} headlight jobs usually come down to the correct bulb and the correct side.`,
                        bullets: [
                            `Correct bulb: ${primaryPart}`,
                            'Confirm high-beam and low-beam fitment before checkout.',
                            'Keep the DRL notes on screen if your trim uses daytime running lights.',
                            'Access may be from the engine bay or wheel well, and some vehicles need bumper removal.',
                            'Do not touch the bulb glass with bare hands, and test the lights before reassembly.',
                        ],
                        links: [
                            { href: '#parts-needed', label: 'Review bulb parts' },
                            { href: fullGuideHref, label: 'Open headlight guide' },
                        ],
                    },
                    {
                        eyebrow: 'Before you order',
                        title: 'Use the exact vehicle path to avoid the wrong lamp',
                        summary: 'Headlight fitment changes with trim, connector access, and whether the job is bulb-only or assembly-level.',
                        bullets: [
                            'Check whether you need a bulb, socket, or full lamp assembly.',
                            'Confirm driver or passenger side before checkout if the repair is one-sided.',
                            'Use the vehicle-specific manual path when the housing is tight behind the bumper or liner.',
                        ],
                        links: [
                            { href: manualYearHref, label: 'Browse year manual' },
                            { href: vehicleHubHref, label: 'Vehicle hub' },
                        ],
                    },
                    {
                        eyebrow: 'Next step',
                        title: 'Use the related lighting path if the job is bigger',
                        summary: 'If the lamp assembly is damaged, the tail-light and manual links keep the rest of the lighting cluster nearby.',
                        bullets: [
                            'Check the related lighting page if the assembly is cracked or moisture is present.',
                            'Keep the exact vehicle hub open so the rest of the lighting system stays in context.',
                        ],
                        links: [
                            ...taskLinks(['tail-light-replacement']),
                            { href: manualMakeHref, label: 'Browse make manual' },
                        ],
                    },
                ].map((card) => ({ ...card, tone: 'cyan' as TaskSupportNote['tone'] })),
            };
        case 'brake-pad-replacement':
        case 'brake-rotor-replacement':
            return {
                eyebrow: 'Quick answer',
                title: 'Brake jobs start with the exact axle-side fitment',
                intro: 'This page keeps the pad or rotor decision, the torque checks, and the bed-in sequence together so the job stays straightforward.',
                tone: 'amber',
                cards: [
                    {
                        eyebrow: 'Direct answer',
                        title: task === 'brake-pad-replacement' ? 'Confirm pad shape and piston direction' : 'Confirm rotor size and minimum thickness',
                        summary: `${vehicleName} brake jobs convert best when the right axle and the right part are matched before teardown.`,
                        bullets: task === 'brake-pad-replacement'
                            ? [
                                `Brake part: ${primaryPart}`,
                                'Confirm front versus rear before ordering.',
                                'Compress the caliper piston in the right direction and bed the pads in after install.',
                                torqueSpecs ? `Use the vehicle torque notes already shown on this page: ${torqueSpecs}` : 'Use the torque notes already shown on this page before you close the job.',
                            ]
                            : [
                                `Brake part: ${primaryPart}`,
                                'Confirm rotor diameter and minimum thickness before ordering.',
                                'Replace rotors in pairs and clean the hub surface before install.',
                                torqueSpecs ? `Use the vehicle torque notes already shown on this page: ${torqueSpecs}` : 'Use the torque notes already shown on this page before you close the job.',
                            ],
                        links: [
                            { href: '#parts-needed', label: 'Review brake parts' },
                            { href: fullGuideHref, label: 'Open brake guide' },
                        ],
                    },
                    {
                        eyebrow: 'Before you order',
                        title: 'Validate the exact brake fitment path',
                        summary: commercialConfig.primaryActionHint,
                        bullets: commercialConfig.fitmentChecks,
                        links: [
                            { href: manualYearHref, label: 'Browse year manual' },
                            { href: manualMakeHref, label: 'Browse make manual' },
                        ],
                    },
                    {
                        eyebrow: 'Next step',
                        title: 'Keep the paired brake page one click away',
                        summary: task === 'brake-pad-replacement'
                            ? 'Pad jobs often go faster when the rotor page is nearby for wear, thickness, and replacement checks.'
                            : 'Rotor jobs are easier when the pad page stays nearby for hardware and bed-in context.',
                        bullets: task === 'brake-pad-replacement'
                            ? [
                                'Open the rotor page if the disc surface is scored or below thickness.',
                                'Keep the vehicle hub open so the rest of the braking cluster stays visible.',
                            ]
                            : [
                                'Open the pad page if the wear pattern suggests the full brake stack needs attention.',
                                'Keep the vehicle hub open so the rest of the braking cluster stays visible.',
                            ],
                        links: [
                            ...taskLinks([task === 'brake-pad-replacement' ? 'brake-rotor-replacement' : 'brake-pad-replacement']),
                            { href: vehicleHubHref, label: 'Vehicle hub' },
                        ],
                    },
                ].map((card) => ({ ...card, tone: 'cyan' as TaskSupportNote['tone'] })),
            };
        case 'oil-change':
            return {
                eyebrow: 'Quick answer',
                title: 'Oil service is about the exact spec, not the generic label',
                intro: 'This page keeps the viscosity, capacity, filter, and drain-plug checks together so owners can order confidently and move quickly.',
                tone: 'violet',
                cards: [
                    {
                        eyebrow: 'Direct answer',
                        title: 'Confirm the exact oil spec before checkout',
                        summary: `${vehicleName} oil service is only simple when the oil type, capacity, and filter match the vehicle data.`,
                        bullets: [
                            'Use the exact oil viscosity and capacity shown on the page before you order.',
                            `Oil/filter kit starts with: ${primaryPart}`,
                            'Keep the drain plug torque and change-interval notes in view while you work.',
                            'Approved brands and filter part details belong in the final fitment check, not the guesswork stage.',
                        ],
                        links: [
                            { href: '#parts-needed', label: 'Review oil parts' },
                            { href: fullGuideHref, label: 'Open oil guide' },
                        ],
                    },
                    {
                        eyebrow: 'Before you order',
                        title: 'Make the service method match the car',
                        summary: 'Oil jobs fail when the buyer grabs the wrong drain hardware or ignores the service method the car actually uses.',
                        bullets: [
                            'Confirm the filter and drain hardware listed on the page before checkout.',
                            'Use the service notes for your exact vehicle rather than a generic oil recommendation.',
                            'Keep the change interval and approved-brand notes on screen while you compare listings.',
                        ],
                        links: [
                            { href: manualYearHref, label: 'Browse year manual' },
                            { href: vehicleHubHref, label: 'Vehicle hub' },
                        ],
                    },
                    {
                        eyebrow: 'Next step',
                        title: 'Oil service pairs well with the other maintenance lanes',
                        summary: 'When owners are already under the hood, air filters and spark plugs are often the next useful checks.',
                        bullets: [
                            'Use the vehicle hub to keep the broader maintenance cluster visible.',
                            'Check the related filter and ignition pages if you are batching maintenance.',
                        ],
                        links: [
                            ...taskLinks(['engine-air-filter-replacement', 'cabin-air-filter-replacement', 'spark-plug-replacement']),
                            { href: manualMakeHref, label: 'Browse make manual' },
                        ],
                    },
                ].map((card) => ({ ...card, tone: 'cyan' as TaskSupportNote['tone'] })),
            };
        case 'cabin-air-filter-replacement':
        case 'engine-air-filter-replacement':
            return {
                eyebrow: 'Quick answer',
                title: 'Filter jobs are won by size, access, and airflow direction',
                intro: 'This page keeps the exact filter fitment, access path, and install direction close to the top so the job stays quick.',
                tone: 'cyan',
                cards: [
                    {
                        eyebrow: 'Direct answer',
                        title: task === 'cabin-air-filter-replacement' ? 'Confirm cabin filter size and airflow arrow' : 'Confirm engine filter size and seal',
                        summary: `${vehicleName} filter service is straightforward once you know the exact filter path and access point.`,
                        bullets: task === 'cabin-air-filter-replacement'
                            ? [
                                `Filter part: ${primaryPart}`,
                                'Confirm the filter size before checkout.',
                                'Check the access panel or glove box path first.',
                                'Install with the airflow arrow pointing the right way.',
                            ]
                            : [
                                `Filter part: ${primaryPart}`,
                                'Confirm the filter size and airbox fitment before checkout.',
                                'Open the housing carefully so the seal closes properly on reinstall.',
                                'Use the performance-filter notes on the page if you are comparing reusable or higher-flow options.',
                            ],
                        links: [
                            { href: '#parts-needed', label: 'Review filter parts' },
                            { href: fullGuideHref, label: 'Open filter guide' },
                        ],
                    },
                    {
                        eyebrow: 'Before you order',
                        title: 'Use the exact vehicle path and replacement interval',
                        summary: vehicleNote || 'The fitment and access notes already on this page are the ones to trust before you buy.',
                        bullets: [
                            'Keep the replacement interval and access notes visible while you compare listings.',
                            'Use the vehicle-specific manual path when the housing or glove-box access is tight.',
                            task === 'engine-air-filter-replacement'
                                ? 'Check the housing seals and do not over-oil a reusable filter.'
                                : 'Clear out dust or debris in the housing before installing the new cabin filter.',
                        ],
                        links: [
                            { href: manualYearHref, label: 'Browse year manual' },
                            { href: manualMakeHref, label: 'Browse make manual' },
                        ],
                    },
                    {
                        eyebrow: 'Next step',
                        title: 'Pair the filter page with the rest of the maintenance cluster',
                        summary: 'Filter pages work best when they stay linked to the rest of the maintenance stack owners often batch together.',
                        bullets: [
                            'Keep the vehicle hub open so the matching maintenance paths stay visible.',
                            'Open the oil page if you are batching a service reset or a wider maintenance visit.',
                        ],
                        links: [
                            ...taskLinks(['oil-change', task === 'cabin-air-filter-replacement' ? 'engine-air-filter-replacement' : 'cabin-air-filter-replacement']),
                            { href: vehicleHubHref, label: 'Vehicle hub' },
                        ],
                    },
                ].map((card) => ({ ...card, tone: 'cyan' as TaskSupportNote['tone'] })),
            };
        case 'alternator-replacement':
            return {
                eyebrow: 'Quick answer',
                title: 'Charging-system jobs start with the alternator and belt path',
                intro: 'This page is organized around the checks owners actually need first: charging output, belt condition, connector fit, and battery follow-up.',
                tone: 'emerald',
                cards: [
                    {
                        eyebrow: 'Direct answer',
                        title: 'Confirm charging output and belt condition first',
                        summary: `${vehicleName} alternator jobs only make sense when the charging symptom points to the alternator, not just the battery.`,
                        bullets: [
                            `Alternator part: ${primaryPart}`,
                            'Check charging voltage before ordering.',
                            'Inspect the serpentine belt, pulley style, and electrical connector layout.',
                            'Disconnect the battery before removal and test the new alternator output before closing up.',
                        ],
                        links: [
                            { href: '#parts-needed', label: 'Review alternator parts' },
                            { href: fullGuideHref, label: 'Open alternator guide' },
                        ],
                    },
                    {
                        eyebrow: 'Before you order',
                        title: 'Match the exact charging-system fitment',
                        summary: commercialConfig.primaryActionHint,
                        bullets: commercialConfig.fitmentChecks,
                        links: [
                            { href: manualYearHref, label: 'Browse year manual' },
                            { href: manualMakeHref, label: 'Browse make manual' },
                        ],
                    },
                    {
                        eyebrow: 'Next step',
                        title: 'Keep the battery and starter pages nearby',
                        summary: 'Charging complaints often overlap with battery or starter symptoms, so those pages should stay one click away.',
                        bullets: [
                            'Use the battery page if the car also needs a fresh battery or memory-safe swap.',
                            'Use the starter page if the symptom is no-crank or click/no-crank rather than charging loss.',
                        ],
                        links: [
                            ...taskLinks(['battery-replacement', 'starter-replacement', 'serpentine-belt-replacement']),
                            { href: vehicleHubHref, label: 'Vehicle hub' },
                        ],
                    },
                ].map((card) => ({ ...card, tone: 'cyan' as TaskSupportNote['tone'] })),
            };
        case 'starter-replacement':
            return {
                eyebrow: 'Quick answer',
                title: 'Starter jobs start with the no-crank diagnosis',
                intro: 'This page keeps the click/no-crank symptom, battery follow-up, and access steps near the top so owners can decide quickly if the starter is the real problem.',
                tone: 'emerald',
                cards: [
                    {
                        eyebrow: 'Direct answer',
                        title: 'Confirm the starter before you order',
                        summary: `${vehicleName} starter jobs are usually decided by symptom pattern, battery health, and access path.`,
                        bullets: [
                            `Starter part: ${primaryPart}`,
                            'Use the click/no-crank symptom before replacing the starter.',
                            'Check battery condition, wiring connections, and the mounting area first.',
                            'Plan for under-vehicle access on many layouts and clean the mounting surface for a strong ground.',
                        ],
                        links: [
                            { href: '#parts-needed', label: 'Review starter parts' },
                            { href: fullGuideHref, label: 'Open starter guide' },
                        ],
                    },
                    {
                        eyebrow: 'Before you order',
                        title: 'Match the starter fitment and access path',
                        summary: commercialConfig.primaryActionHint,
                        bullets: commercialConfig.fitmentChecks,
                        links: [
                            { href: manualYearHref, label: 'Browse year manual' },
                            { href: manualMakeHref, label: 'Browse make manual' },
                        ],
                    },
                    {
                        eyebrow: 'Next step',
                        title: 'Keep the battery and charging pages nearby',
                        summary: 'A weak battery or charging system can mimic a starter problem, so the follow-up pages matter here.',
                        bullets: [
                            'Use the battery page if the symptom started after low voltage or a dead battery.',
                            'Use the alternator page if the charging light or battery warning is part of the story.',
                        ],
                        links: [
                            ...taskLinks(['battery-replacement', 'alternator-replacement']),
                            { href: vehicleHubHref, label: 'Vehicle hub' },
                        ],
                    },
                ].map((card) => ({ ...card, tone: 'cyan' as TaskSupportNote['tone'] })),
            };
        case 'serpentine-belt-replacement':
            return {
                eyebrow: 'Quick answer',
                title: 'Belt jobs are about routing, tension, and accessory fitment',
                intro: 'This page keeps the belt length, routing path, and tensioner checks near the top so the install can go once without guesswork.',
                tone: 'cyan',
                cards: [
                    {
                        eyebrow: 'Direct answer',
                        title: 'Confirm belt routing and accessory alignment first',
                        summary: `${vehicleName} belt jobs only stay easy when the routing path and accessory layout match the vehicle data.`,
                        bullets: [
                            `Belt part: ${primaryPart}`,
                            'Note the routing diagram before removal.',
                            'Inspect the tensioner and pulleys for wear while the belt is off.',
                            'Verify alignment before releasing tension.',
                        ],
                        links: [
                            { href: '#parts-needed', label: 'Review belt parts' },
                            { href: fullGuideHref, label: 'Open belt guide' },
                        ],
                    },
                    {
                        eyebrow: 'Before you order',
                        title: 'Use the engine-specific length and rib count',
                        summary: commercialConfig.primaryActionHint,
                        bullets: commercialConfig.fitmentChecks,
                        links: [
                            { href: manualYearHref, label: 'Browse year manual' },
                            { href: manualMakeHref, label: 'Browse make manual' },
                        ],
                    },
                    {
                        eyebrow: 'Next step',
                        title: 'Keep the charging and cooling pages nearby',
                        summary: 'The belt often feeds the alternator and water pump, so the adjacent pages stay relevant while the belt is off.',
                        bullets: [
                            'Open the alternator page if charging output was part of the symptom.',
                            'Open the coolant or water-pump path if belt wear came with overheating or coolant loss.',
                        ],
                        links: [
                            ...taskLinks(['alternator-replacement', 'water-pump-replacement', 'battery-replacement']),
                            { href: vehicleHubHref, label: 'Vehicle hub' },
                        ],
                    },
                ].map((card) => ({ ...card, tone: 'cyan' as TaskSupportNote['tone'] })),
            };
        case 'transmission-fluid-change':
            return {
                eyebrow: 'Quick answer',
                title: 'Transmission fluid service is spec-sensitive',
                intro: 'This page keeps the exact ATF, the service method, and the refill path at the top so the job does not stall after the drain plug comes out.',
                tone: 'violet',
                cards: [
                    {
                        eyebrow: 'Direct answer',
                        title: 'Confirm the exact ATF spec before opening the transmission',
                        summary: `${vehicleName} transmission service is only straightforward when the fluid spec and service method are both correct.`,
                        bullets: [
                            `Fluid part: ${primaryPart}`,
                            'Match the exact ATF spec before ordering.',
                            'Confirm whether the vehicle uses drain-and-fill or pan-drop service.',
                            'Plan for a washer, gasket, or filter only if the transmission uses them.',
                        ],
                        links: [
                            { href: '#parts-needed', label: 'Review fluid parts' },
                            { href: fullGuideHref, label: 'Open transmission guide' },
                        ],
                    },
                    {
                        eyebrow: 'Before you order',
                        title: 'Use the service method shown for this exact vehicle',
                        summary: commercialConfig.primaryActionHint,
                        bullets: commercialConfig.fitmentChecks,
                        links: [
                            { href: manualYearHref, label: 'Browse year manual' },
                            { href: manualMakeHref, label: 'Browse make manual' },
                        ],
                    },
                    {
                        eyebrow: 'Next step',
                        title: 'Keep the fluid maintenance stack nearby',
                        summary: 'Transmission service often lives next to coolant and oil maintenance, so those links stay relevant while the vehicle is open.',
                        bullets: [
                            'Use the coolant page if you are already planning a cooling-system refresh.',
                            'Use the oil page if you are batching routine maintenance on the same visit.',
                        ],
                        links: [
                            ...taskLinks(['coolant-flush', 'oil-change']),
                            { href: vehicleHubHref, label: 'Vehicle hub' },
                        ],
                    },
                ].map((card) => ({ ...card, tone: 'cyan' as TaskSupportNote['tone'] })),
            };
        case 'coolant-flush':
            return {
                eyebrow: 'Quick answer',
                title: 'Coolant service is about chemistry and the bleed sequence',
                intro: 'This page keeps coolant type, refill method, and air-bleed reminders near the top so the cooling system ends up full and stable.',
                tone: 'emerald',
                cards: [
                    {
                        eyebrow: 'Direct answer',
                        title: 'Confirm coolant chemistry before you start',
                        summary: `${vehicleName} coolant jobs go best when the coolant type and refill sequence are already decided.`,
                        bullets: [
                            `Coolant part: ${primaryPart}`,
                            'Match the coolant chemistry and color family before mixing anything.',
                            'Let the engine cool completely before opening the system.',
                            'Bleed air and recheck the level after the first heat cycle.',
                        ],
                        links: [
                            { href: '#parts-needed', label: 'Review coolant parts' },
                            { href: fullGuideHref, label: 'Open coolant guide' },
                        ],
                    },
                    {
                        eyebrow: 'Before you order',
                        title: 'Use the refill path shown for this vehicle',
                        summary: commercialConfig.primaryActionHint,
                        bullets: commercialConfig.fitmentChecks,
                        links: [
                            { href: manualYearHref, label: 'Browse year manual' },
                            { href: manualMakeHref, label: 'Browse make manual' },
                        ],
                    },
                    {
                        eyebrow: 'Next step',
                        title: 'Keep the thermostat and radiator pages nearby',
                        summary: 'Cooling-system problems usually overlap, so the adjacent pages help if the flush reveals a bigger issue.',
                        bullets: [
                            'Open the thermostat page if overheating was part of the original complaint.',
                            'Open the radiator page if you found leaks, crust, or damage while inspecting the system.',
                        ],
                        links: [
                            ...taskLinks(['thermostat-replacement', 'radiator-replacement', 'water-pump-replacement']),
                            { href: vehicleHubHref, label: 'Vehicle hub' },
                        ],
                    },
                ].map((card) => ({ ...card, tone: 'cyan' as TaskSupportNote['tone'] })),
            };
        case 'fuel-filter-replacement':
            return {
                eyebrow: 'Quick answer',
                title: 'Fuel filter jobs depend on layout and flow direction',
                intro: 'This page keeps the filter location, line orientation, and pressure-relief steps near the top so the replacement stays clean and safe.',
                tone: 'cyan',
                cards: [
                    {
                        eyebrow: 'Direct answer',
                        title: 'Confirm the filter design before ordering',
                        summary: `${vehicleName} fuel filter service can be simple or buried, depending on the layout.`,
                        bullets: [
                            `Fuel part: ${primaryPart}`,
                            'Confirm external filter versus in-tank design before ordering.',
                            'Check flow direction and line orientation if the filter is inline.',
                            'Relieve fuel pressure and keep the service area spark-free.',
                        ],
                        links: [
                            { href: '#parts-needed', label: 'Review fuel parts' },
                            { href: fullGuideHref, label: 'Open fuel filter guide' },
                        ],
                    },
                    {
                        eyebrow: 'Before you order',
                        title: 'Use the layout notes shown on the page',
                        summary: commercialConfig.primaryActionHint,
                        bullets: commercialConfig.fitmentChecks,
                        links: [
                            { href: manualYearHref, label: 'Browse year manual' },
                            { href: manualMakeHref, label: 'Browse make manual' },
                        ],
                    },
                    {
                        eyebrow: 'Next step',
                        title: 'Keep the fuel and intake pages nearby',
                        summary: 'Fuel-filter work often pairs with fuel-pump or air-filter checks when the car is already in service mode.',
                        bullets: [
                            'Open the fuel-pump page if the symptom is broader than filter restriction.',
                            'Open the engine-air-filter page if you are already batching intake maintenance.',
                        ],
                        links: [
                            ...taskLinks(['fuel-pump-replacement', 'engine-air-filter-replacement']),
                            { href: vehicleHubHref, label: 'Vehicle hub' },
                        ],
                    },
                ].map((card) => ({ ...card, tone: 'cyan' as TaskSupportNote['tone'] })),
            };
        default:
            return {
                eyebrow: 'Quick answer',
                title: 'Start with the exact fitment check',
                intro: `This page keeps the ${cleanTask} fitment, timing, and procedure notes close to the top so the vehicle stays in view while you work.`,
                tone: 'cyan',
                cards: [
                    {
                        eyebrow: 'Direct answer',
                        title: 'Confirm the repair data before ordering',
                        summary: `${vehicleName} is already validated for this task, so the safest next step is the exact part and service check on the page.`,
                        bullets: [
                            `Difficulty: ${repairData.difficulty}`,
                            `Time: ${repairData.time}`,
                            `Primary part: ${primaryPart}`,
                            repairData.warnings[0] || 'Use the warning section before you start.',
                        ],
                        links: [
                            { href: '#parts-needed', label: 'Review parts' },
                            { href: fullGuideHref, label: 'Open full guide' },
                        ],
                    },
                    {
                        eyebrow: 'Before you order',
                        title: 'Use the fitment checks already on this page',
                        summary: commercialConfig.primaryActionHint,
                        bullets: commercialConfig.fitmentChecks,
                        links: [
                            { href: manualYearHref, label: 'Browse year manual' },
                            { href: manualMakeHref, label: 'Browse make manual' },
                        ],
                    },
                    {
                        eyebrow: 'Next step',
                        title: 'Keep the exact vehicle hub open',
                        summary: 'The hub keeps repair, wiring, codes, and manual paths in the same context while you compare the next move.',
                        bullets: [
                            vehicleNote || 'Use the vehicle notes above for any exact-fit caveat before teardown.',
                            torqueSpecs ? `Torque notes: ${torqueSpecs}` : 'Use the service notes on this page for torque and order of operations.',
                            beltRouting ? `Belt routing: ${beltRouting}` : 'Use the linked manual if you need a factory reference for access or routing.',
                        ],
                        links: [{ href: vehicleHubHref, label: 'Vehicle hub' }],
                    },
                ].map((card) => ({ ...card, tone: 'cyan' as TaskSupportNote['tone'] })),
            };
    }
}

function getPartActionLabel(task: string, partName: string): string {
    const lower = partName.toLowerCase();

    if (/(grease|spray|cleaner|coolant|gasket|protector|washer|anti-seize)/.test(lower)) {
        return 'See supporting supplies';
    }

    switch (task) {
        case 'battery-replacement':
            return /battery/.test(lower) ? 'Check battery fitment' : 'See battery supplies';
        case 'alternator-replacement':
            return /alternator/.test(lower) ? 'Check alternator fitment' : 'See belt and support parts';
        case 'starter-replacement':
            return /starter/.test(lower) ? 'Check starter fitment' : 'See starter hardware';
        case 'brake-pad-replacement':
            return /pad/.test(lower) ? 'Compare pad sets' : 'See brake hardware';
        case 'serpentine-belt-replacement':
            return /belt/.test(lower) ? 'Check belt fitment' : 'See tensioner options';
        case 'thermostat-replacement':
            return /thermostat/.test(lower) ? 'Compare thermostat kits' : 'See cooling supplies';
        case 'tail-light-replacement':
            return /tail|lamp|assembly|bulb|socket/.test(lower) ? 'Check tail light fitment' : 'See lighting supplies';
        case 'transmission-fluid-change':
            return /fluid|atf|transmission/.test(lower) ? 'Check fluid spec' : 'See transmission supplies';
        case 'coolant-flush':
            return /coolant|antifreeze|water/.test(lower) ? 'Check coolant type' : 'See cooling supplies';
        case 'fuel-filter-replacement':
            return /fuel|filter|line/.test(lower) ? 'Check fuel filter fitment' : 'See fuel system parts';
        default:
            return /battery|alternator|starter|belt|thermostat|filter|rotor|pad|pump|sensor|bulb/.test(lower)
                ? 'Check fitment on Amazon'
                : 'See options on Amazon';
    }
}

function getSpotlightActionLabel(task: string, partName: string): string {
    switch (task) {
        case 'battery-replacement':
            return /battery/.test(partName.toLowerCase()) ? 'Open battery fitment' : 'Open supply search';
        case 'alternator-replacement':
            return /alternator/.test(partName.toLowerCase()) ? 'Open alternator fitment' : 'Open supporting search';
        case 'starter-replacement':
            return /starter/.test(partName.toLowerCase()) ? 'Open starter fitment' : 'Open hardware search';
        case 'brake-pad-replacement':
            return /pad/.test(partName.toLowerCase()) ? 'Open pad comparison' : 'Open brake supplies';
        case 'serpentine-belt-replacement':
            return /belt/.test(partName.toLowerCase()) ? 'Open belt fitment' : 'Open tensioner search';
        case 'thermostat-replacement':
            return /thermostat/.test(partName.toLowerCase()) ? 'Open thermostat fitment' : 'Open coolant search';
        case 'tail-light-replacement':
            return /tail|lamp|assembly|bulb|socket/.test(partName.toLowerCase()) ? 'Open tail light fitment' : 'Open lighting search';
        case 'transmission-fluid-change':
            return /fluid|atf|transmission/.test(partName.toLowerCase()) ? 'Open fluid spec' : 'Open service search';
        case 'coolant-flush':
            return /coolant|antifreeze|water/.test(partName.toLowerCase()) ? 'Open coolant type' : 'Open cooling search';
        case 'fuel-filter-replacement':
            return /fuel|filter|line/.test(partName.toLowerCase()) ? 'Open filter fitment' : 'Open fuel system search';
        default:
            return 'Open fitment search';
    }
}

const PRIORITY_REPAIR_COMMERCE_TASKS = new Set([
    'serpentine-belt-replacement',
    'battery-replacement',
    'alternator-replacement',
    'starter-replacement',
    'brake-pad-replacement',
    'brake-rotor-replacement',
    'oil-change',
    'spark-plug-replacement',
    'transmission-fluid-change',
    'coolant-flush',
    'tail-light-replacement',
    'headlight-bulb-replacement',
]);

function normalizeCommercePartName(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function buildSupplementalRepairCommerceParts(task: string, vehicleName: string): PartSpec[] {
    const partsByTask: Record<string, PartSpec[]> = {
        'serpentine-belt-replacement': [
            { name: 'Serpentine Belt', aftermarket: `${vehicleName} serpentine belt` },
            { name: 'Belt Tensioner', aftermarket: `${vehicleName} belt tensioner` },
            { name: 'Idler Pulley', aftermarket: `${vehicleName} idler pulley` },
            { name: 'Pulley Puller Set', aftermarket: 'pulley puller set automotive' },
            { name: 'Tensioner Tool', aftermarket: 'serpentine belt tensioner tool' },
            { name: 'Breaker Bar', aftermarket: '1/2 inch breaker bar automotive' },
            { name: 'Shop Towels', aftermarket: 'blue shop towels automotive' },
        ],
        'battery-replacement': [
            { name: 'Battery', aftermarket: `${vehicleName} battery` },
            { name: 'Battery Terminal Cleaner', aftermarket: `${vehicleName} battery terminal cleaner` },
            { name: 'Battery Post Brush', aftermarket: 'battery post brush automotive' },
            { name: 'Memory Saver', aftermarket: 'OBD2 memory saver' },
            { name: 'Battery Charger', aftermarket: 'automotive battery charger' },
            { name: 'Battery Hold-Down Kit', aftermarket: `${vehicleName} battery hold down` },
            { name: 'Terminal Protector Spray', aftermarket: 'battery terminal protector spray' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'alternator-replacement': [
            { name: 'Alternator', aftermarket: `${vehicleName} alternator` },
            { name: 'Serpentine Belt', aftermarket: `${vehicleName} serpentine belt` },
            { name: 'Belt Tensioner', aftermarket: `${vehicleName} belt tensioner` },
            { name: 'Idler Pulley', aftermarket: `${vehicleName} idler pulley` },
            { name: 'Battery Tester', aftermarket: 'automotive battery tester' },
            { name: 'Breaker Bar', aftermarket: '1/2 inch breaker bar automotive' },
            { name: 'Battery Charger', aftermarket: 'automotive battery charger' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'starter-replacement': [
            { name: 'Starter', aftermarket: `${vehicleName} starter` },
            { name: 'Starter Relay', aftermarket: `${vehicleName} starter relay` },
            { name: 'Starter Bolts', aftermarket: `${vehicleName} starter bolts` },
            { name: 'Socket and Extension Set', aftermarket: 'deep socket extension set automotive' },
            { name: 'Battery Charger', aftermarket: 'automotive battery charger' },
            { name: 'Jumper Cables', aftermarket: 'jumper cables automotive' },
            { name: 'Wire Brush', aftermarket: 'wire brush automotive' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'brake-pad-replacement': [
            { name: 'Brake Pads', aftermarket: `${vehicleName} brake pads` },
            { name: 'Brake Hardware Kit', aftermarket: `${vehicleName} brake hardware kit` },
            { name: 'Brake Cleaner', aftermarket: 'brake cleaner spray automotive' },
            { name: 'Caliper Grease', aftermarket: 'silicone brake grease' },
            { name: 'Brake Fluid', aftermarket: `${vehicleName} brake fluid` },
            { name: 'Brake Bleeder Bottle', aftermarket: 'brake bleeder bottle automotive' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'brake-rotor-replacement': [
            { name: 'Brake Rotors', aftermarket: `${vehicleName} brake rotors` },
            { name: 'Brake Pads', aftermarket: `${vehicleName} brake pads` },
            { name: 'Brake Hardware Kit', aftermarket: `${vehicleName} brake hardware kit` },
            { name: 'Brake Cleaner', aftermarket: 'brake cleaner spray automotive' },
            { name: 'Caliper Grease', aftermarket: 'silicone brake grease' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'wheel-bearing-replacement': [
            { name: 'Wheel Bearing Kit', aftermarket: `${vehicleName} wheel bearing kit` },
            { name: 'Hub Assembly', aftermarket: `${vehicleName} hub assembly` },
            { name: 'Axle Nut Socket', aftermarket: 'axle nut socket automotive' },
            { name: 'Torque Wrench', aftermarket: '3/8 inch torque wrench automotive' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'tie-rod-replacement': [
            { name: 'Inner Tie Rod', aftermarket: `${vehicleName} inner tie rod` },
            { name: 'Outer Tie Rod', aftermarket: `${vehicleName} outer tie rod` },
            { name: 'Alignment Tools', aftermarket: 'alignment tool automotive' },
            { name: 'Penetrating Oil', aftermarket: 'penetrating oil automotive' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'ball-joint-replacement': [
            { name: 'Ball Joint Kit', aftermarket: `${vehicleName} ball joint kit` },
            { name: 'Grease Gun', aftermarket: 'automotive grease gun' },
            { name: 'Ball Joint Press', aftermarket: 'ball joint press kit' },
            { name: 'Torque Wrench', aftermarket: '3/8 inch torque wrench automotive' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'shock-absorber-replacement': [
            { name: 'Shock Absorbers', aftermarket: `${vehicleName} shock absorbers` },
            { name: 'Strut Mount Kit', aftermarket: `${vehicleName} strut mount kit` },
            { name: 'Spring Compressor', aftermarket: 'strut spring compressor automotive' },
            { name: 'Torque Wrench', aftermarket: '3/8 inch torque wrench automotive' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'strut-replacement': [
            { name: 'Struts', aftermarket: `${vehicleName} struts` },
            { name: 'Strut Mount Kit', aftermarket: `${vehicleName} strut mount kit` },
            { name: 'Spring Compressor', aftermarket: 'strut spring compressor automotive' },
            { name: 'Alignment Mark Paint', aftermarket: 'alignment mark paint automotive' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'oil-change': [
            { name: 'Engine Oil', aftermarket: `${vehicleName} engine oil` },
            { name: 'Oil Filter', aftermarket: `${vehicleName} oil filter` },
            { name: 'Drain Pan', aftermarket: 'oil drain pan' },
            { name: 'Oil Filter Wrench', aftermarket: 'oil filter wrench' },
            { name: 'Funnel Set', aftermarket: 'automotive funnel' },
            { name: 'Drain Plug Washer', aftermarket: 'oil drain plug washer automotive' },
            { name: 'Shop Towels', aftermarket: 'blue shop towels automotive' },
        ],
        'spark-plug-replacement': [
            { name: 'Spark Plugs', aftermarket: `${vehicleName} spark plugs` },
            { name: 'Spark Plug Socket', aftermarket: 'spark plug socket set' },
            { name: 'Gap Gauge', aftermarket: 'spark plug gap gauge' },
            { name: 'Torque Wrench', aftermarket: '3/8 inch torque wrench automotive' },
            { name: 'Dielectric Grease', aftermarket: 'dielectric grease automotive' },
            { name: 'Coil Boot Puller', aftermarket: 'ignition coil boot puller' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'ignition-coil-replacement': [
            { name: 'Ignition Coils', aftermarket: `${vehicleName} ignition coils` },
            { name: 'Spark Plugs', aftermarket: `${vehicleName} spark plugs` },
            { name: 'Dielectric Grease', aftermarket: 'dielectric grease automotive' },
            { name: 'Coil Boot Puller', aftermarket: 'ignition coil boot puller' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'oxygen-sensor-replacement': [
            { name: 'Oxygen Sensor', aftermarket: `${vehicleName} oxygen sensor` },
            { name: 'O2 Sensor Socket', aftermarket: 'oxygen sensor socket automotive' },
            { name: 'Anti-Seize', aftermarket: 'anti-seize compound automotive' },
            { name: 'Penetrating Oil', aftermarket: 'penetrating oil automotive' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'mass-air-flow-sensor-replacement': [
            { name: 'MAF Sensor', aftermarket: `${vehicleName} mass air flow sensor` },
            { name: 'MAF Cleaner', aftermarket: 'mass air flow sensor cleaner' },
            { name: 'Torx Bit Set', aftermarket: 'torx bit set automotive' },
            { name: 'Electrical Contact Cleaner', aftermarket: 'electrical contact cleaner automotive' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'fuel-pump-replacement': [
            { name: 'Fuel Pump', aftermarket: `${vehicleName} fuel pump` },
            { name: 'Fuel Filter', aftermarket: `${vehicleName} fuel filter` },
            { name: 'Fuel Line Disconnect Tool', aftermarket: 'fuel line disconnect tool automotive' },
            { name: 'Fuel Line Clips', aftermarket: 'fuel line clips automotive' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'crankshaft-sensor-replacement': [
            { name: 'Crankshaft Position Sensor', aftermarket: `${vehicleName} crankshaft position sensor` },
            { name: 'Sensor Socket Set', aftermarket: 'sensor socket set automotive' },
            { name: 'Electrical Contact Cleaner', aftermarket: 'electrical contact cleaner automotive' },
            { name: 'Wire Brush', aftermarket: 'wire brush automotive' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'camshaft-sensor-replacement': [
            { name: 'Camshaft Position Sensor', aftermarket: `${vehicleName} camshaft position sensor` },
            { name: 'Sensor Socket Set', aftermarket: 'sensor socket set automotive' },
            { name: 'Electrical Contact Cleaner', aftermarket: 'electrical contact cleaner automotive' },
            { name: 'Wire Brush', aftermarket: 'wire brush automotive' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'catalytic-converter-replacement': [
            { name: 'Catalytic Converter', aftermarket: `${vehicleName} catalytic converter` },
            { name: 'Oxygen Sensor', aftermarket: `${vehicleName} oxygen sensor` },
            { name: 'Exhaust Gasket Kit', aftermarket: 'exhaust gasket kit automotive' },
            { name: 'Exhaust Clamp Kit', aftermarket: 'exhaust clamp kit automotive' },
            { name: 'Penetrating Oil', aftermarket: 'penetrating oil automotive' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'egr-valve-replacement': [
            { name: 'EGR Valve', aftermarket: `${vehicleName} egr valve` },
            { name: 'EGR Gasket Kit', aftermarket: 'egr gasket kit automotive' },
            { name: 'Carb Cleaner', aftermarket: 'carburetor cleaner automotive' },
            { name: 'Vacuum Hose Kit', aftermarket: 'vacuum hose kit automotive' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'transmission-fluid-change': [
            { name: 'Transmission Fluid', aftermarket: `${vehicleName} transmission fluid` },
            { name: 'Transmission Fluid Pump', aftermarket: 'fluid transfer pump automotive' },
            { name: 'Transmission Filter Kit', aftermarket: `${vehicleName} transmission filter kit` },
            { name: 'Drain Plug Washer', aftermarket: 'drain plug washer automotive' },
            { name: 'Funnel Set', aftermarket: 'long neck funnel automotive' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'coolant-flush': [
            { name: 'Coolant', aftermarket: `${vehicleName} coolant` },
            { name: 'Spill-Free Funnel', aftermarket: 'spill free coolant funnel' },
            { name: 'Coolant Tester', aftermarket: 'coolant tester automotive' },
            { name: 'Hose Clamp Pliers', aftermarket: 'hose clamp pliers automotive' },
            { name: 'Distilled Water', aftermarket: 'distilled water automotive coolant' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'tail-light-replacement': [
            { name: 'Tail Light Bulb', aftermarket: `${vehicleName} tail light bulb` },
            { name: 'Lamp Assembly', aftermarket: `${vehicleName} tail light assembly` },
            { name: 'Dielectric Grease', aftermarket: 'dielectric grease automotive' },
            { name: 'Trim Tool Set', aftermarket: 'trim removal tool set automotive' },
            { name: 'Replacement Clips', aftermarket: 'automotive trim clips assortment' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'headlight-bulb-replacement': [
            { name: 'Headlight Bulb Set', aftermarket: `${vehicleName} headlight bulbs` },
            { name: 'Dielectric Grease', aftermarket: 'dielectric grease automotive' },
            { name: 'Trim Tool Set', aftermarket: 'trim removal tool set automotive' },
            { name: 'Work Gloves', aftermarket: 'mechanic work gloves' },
            { name: 'Headlight Restoration Kit', aftermarket: 'headlight restoration kit automotive' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'water-pump-replacement': [
            { name: 'Water Pump', aftermarket: `${vehicleName} water pump` },
            { name: 'Water Pump Gasket', aftermarket: `${vehicleName} water pump gasket` },
            { name: 'Coolant', aftermarket: `${vehicleName} coolant` },
            { name: 'Serpentine Belt', aftermarket: `${vehicleName} serpentine belt` },
            { name: 'Spill-Free Funnel', aftermarket: 'spill free coolant funnel' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'radiator-replacement': [
            { name: 'Radiator', aftermarket: `${vehicleName} radiator` },
            { name: 'Coolant', aftermarket: `${vehicleName} coolant` },
            { name: 'Radiator Cap', aftermarket: `${vehicleName} radiator cap` },
            { name: 'Coolant Hose Clamp Pliers', aftermarket: 'hose clamp pliers automotive' },
            { name: 'Spill-Free Funnel', aftermarket: 'spill free coolant funnel' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
        'fuel-filter-replacement': [
            { name: 'Fuel Filter', aftermarket: `${vehicleName} fuel filter` },
            { name: 'Fuel Line Clips', aftermarket: 'fuel line clips automotive' },
            { name: 'Seal Kit', aftermarket: 'fuel filter seal kit automotive' },
            { name: 'Line Wrench Set', aftermarket: 'fuel line wrench set automotive' },
            { name: 'Shop Towels', aftermarket: 'shop towels automotive' },
        ],
    };

    return partsByTask[task] ?? [];
}

function dedupeCommerceParts(parts: PartSpec[]): PartSpec[] {
    const out: PartSpec[] = [];
    const seen = new Set<string>();

    for (const part of parts) {
        const key = normalizeCommercePartName(part.name);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(part);
    }

    return out;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { year, make, model, task } = await params;
    const canonicalMake = slugifyRoutePart(make);
    const canonicalModel = slugifyRoutePart(model);
    const canonicalTask = slugifyRoutePart(task);
    const canonicalYear = String(getClampedYear(year, canonicalMake, canonicalModel) ?? year);

    // Return generic metadata for invalid combos — page will 404/redirect anyway
    if (!isValidVehicleCombination(canonicalYear, canonicalMake, canonicalModel, canonicalTask)) {
        return { title: 'Page Not Found | SpotOnAuto' };
    }

    const cleanTask = canonicalTask.replace(/-/g, ' ');
    const displayMake = getDisplayName(canonicalMake, 'make') || toTitleCase(canonicalMake);
    const displayModel = getDisplayName(canonicalModel, 'model') || toTitleCase(canonicalModel);
    const vehicleName = `${canonicalYear} ${displayMake} ${displayModel}`;
    const exactGuideProfile = getExactGuideProfile(canonicalYear, canonicalMake, canonicalModel, canonicalTask);

    const taskMeta = TASK_META[canonicalTask];
    const title = taskMeta
        ? `${vehicleName} ${taskMeta.title}${exactGuideProfile?.titleSuffix ? ` | ${exactGuideProfile.titleSuffix}` : ''} | SpotOnAuto`
        : `${vehicleName} ${cleanTask.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Guide | SpotOnAuto`;
    const description = taskMeta
        ? `${taskMeta.description.replace('{v}', vehicleName)}${exactGuideProfile?.descriptionSuffix ? ` ${exactGuideProfile.descriptionSuffix}` : ''}`
        : `DIY ${cleanTask} for your ${vehicleName}. Step-by-step guide with tools, parts list, and safety tips. Save $100–$400 vs. the shop.`;

    const baseKeywords = [
        `${canonicalYear} ${displayMake} ${displayModel} ${cleanTask}`,
        `${displayMake} ${displayModel} ${cleanTask}`,
        `how to ${cleanTask} ${displayMake} ${displayModel}`,
        `${cleanTask} ${displayMake} ${displayModel} DIY`,
        `${canonicalYear} ${displayMake} ${cleanTask}`,
    ];
    const keywords = taskMeta
        ? [...baseKeywords, ...taskMeta.extraKeywords, ...(exactGuideProfile?.extraKeywords || [])]
        : [...baseKeywords, ...(exactGuideProfile?.extraKeywords || [])];

    return {
        title,
        description,
        keywords,
        ...(NOINDEX_MAKES.has(canonicalMake) || isNonUsModel(canonicalMake, canonicalModel) ? { robots: { index: false, follow: true } } : {}),
        openGraph: {
            title,
            description,
            type: 'article',
            url: `https://spotonauto.com${buildRepairPath(canonicalYear, canonicalMake, canonicalModel, canonicalTask)}`,
        },
        twitter: {
            card: 'summary',
            title,
            description,
        },
        alternates: {
            canonical: `https://spotonauto.com${buildRepairPath(canonicalYear, canonicalMake, canonicalModel, canonicalTask)}`,
        },
    };
}

export default async function Page({ params }: PageProps) {
    const resolvedParams = await params;
    const { year, make, model, task } = resolvedParams;
    const canonicalMake = slugifyRoutePart(make);
    const canonicalModel = slugifyRoutePart(model);
    const canonicalTask = slugifyRoutePart(task);

    // For known vehicles outside their production range, redirect to nearest valid year
    // so users land on useful content and Google updates its index via 301.
    const clampedYear = getClampedYear(year, canonicalMake, canonicalModel);
    const resolvedYear = String(clampedYear ?? year);
    const canonicalPath = buildRepairPath(resolvedYear, canonicalMake, canonicalModel, canonicalTask);
    if (clampedYear !== null || make !== canonicalMake || model !== canonicalModel || task !== canonicalTask) {
        permanentRedirect(canonicalPath);
    }

    // For truly unknown make/model/task combos, return 404
    if (!isValidVehicleCombination(resolvedYear, canonicalMake, canonicalModel, canonicalTask)) {
        notFound();
    }

    const cleanTask = canonicalTask.replace(/-/g, ' ');
    // Use display names for proper capitalization
    const displayMake = getDisplayName(canonicalMake, 'make') || toTitleCase(canonicalMake);
    const displayModel = getDisplayName(canonicalModel, 'model') || toTitleCase(canonicalModel);

    const vehicleName = `${resolvedYear} ${displayMake} ${displayModel}`;
    const vehicleHubHref = `/repair/${resolvedYear}/${canonicalMake}/${canonicalModel}`;
    const tier1RescueEntry = getTier1RescueEntryByHref(canonicalPath);
    const sameTaskSupportGapPages = getSupportGapRepairsForTasks([canonicalTask], 6)
        .filter((entry) => entry.href !== canonicalPath)
        .slice(0, 3);
    const exactVehicleTier1Pages = getTier1RescuePagesForExactVehicle(resolvedYear, displayMake, displayModel)
        .filter((entry) => entry.href !== canonicalPath)
        .slice(0, 2);
    const modelTier1Pages = getTier1RescuePagesForVehicle(displayMake, displayModel)
        .filter((entry) => entry.href !== canonicalPath)
        .slice(0, 4);

    const vehicleSpec = getVehicleRepairSpec(resolvedYear, canonicalMake, canonicalModel, canonicalTask);
    const genericData = REPAIR_DATA[canonicalTask] || DEFAULT_REPAIR;

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
    const knowledgeGraph = await buildRepairKnowledgeGraph({
        year: resolvedYear,
        make: canonicalMake,
        displayMake,
        model: canonicalModel,
        displayModel,
        task: canonicalTask,
        repairTools: repairData.tools,
        vehicleSpec: vehicleSpec ?? undefined,
    });
    const oemExcerpts = isCorpusBacked(Number(resolvedYear))
        ? await getOEMExcerptsForRepair({
            make: canonicalMake,
            year: Number(resolvedYear),
            model: canonicalModel,
            task: canonicalTask,
            displayMake,
            displayModel,
            limit: 3,
          })
        : [];
    const symptomClusters = getSymptomClustersForRepairTask(canonicalTask, [
        cleanTask,
        TASK_META[canonicalTask]?.title || '',
        TASK_META[canonicalTask]?.description || '',
        ...(TASK_META[canonicalTask]?.extraKeywords || []),
        ...repairData.warnings,
    ], 4);
    const prioritySymptomHubs = getPrioritySymptomHubsForTasks([canonicalTask], 4);
    const symptomNodes = symptomClusters.map((cluster, index) => ({
        ...buildEdgeReference({
            sourceNodeId: buildRepairNodeId(resolvedYear, displayMake, displayModel, canonicalTask),
            targetNodeId: buildSymptomNodeId(cluster.slug),
            relation: 'has-symptom',
            year: resolvedYear,
            make: displayMake,
            model: displayModel,
            task: canonicalTask,
        }),
        kind: 'symptom' as const,
        href: buildSymptomHref(cluster.slug),
        label: cluster.label,
        description: cluster.summary,
        badge: index === 0 ? 'Primary Symptom' : 'Symptom Hub',
    }));
    const repairGraphGroups = [
        ...(symptomNodes.length > 0 ? [{
            kind: 'symptom' as const,
            title: 'Related Symptoms',
            browseHref: '/symptoms',
            theme: 'amber' as const,
            nodes: symptomNodes,
        }] : []),
        ...knowledgeGraph.groups,
    ];
    const rankedKnowledgeGroups = rankKnowledgeGraphBlocks('repair', repairGraphGroups, {
        task: canonicalTask,
        vehicle: vehicleName,
        query: `${vehicleName} ${cleanTask} ${repairData.parts.slice(0, 2).join(' ')}`.trim(),
    });
    const knowledgeGraphExport = buildKnowledgeGraphExport({
        surface: 'repair',
        rootNodeId: buildRepairNodeId(resolvedYear, displayMake, displayModel, canonicalTask),
        rootKind: 'repair',
        rootLabel: `${vehicleName} ${cleanTask}`,
        blocks: rankedKnowledgeGroups.map((group) => ({
            kind: group.kind,
            title: group.title,
            browseHref: group.browseHref,
            nodes: group.nodes.map((node) => ({
                nodeId: node.nodeId,
                edgeId: node.edgeId,
                sourceNodeId: node.sourceNodeId,
                targetNodeId: node.targetNodeId,
                vehicleNodeId: node.vehicleNodeId,
                taskNodeId: node.taskNodeId,
                systemNodeId: node.systemNodeId,
                codeNodeId: node.codeNodeId,
        confidence: 'confidence' in node ? node.confidence : undefined,
        evidence: 'evidence' in node ? node.evidence : undefined,
                href: node.href,
                label: node.label,
                description: node.description,
                badge: node.badge,
                targetKind: node.kind,
            })),
        })),
    });
    const vehicleHubGraph = await buildVehicleHubGraphViaGateway({
        year: resolvedYear,
        make: canonicalMake,
        model: canonicalModel,
        displayMake,
        displayModel,
    });
    const vehicleRepairGroup = vehicleHubGraph.groups.find((group) => group.kind === 'repair');
    const vehicleWiringGroup = vehicleHubGraph.groups.find((group) => group.kind === 'wiring');
    const vehicleCodeGroup = vehicleHubGraph.groups.find((group) => group.kind === 'dtc');
    const relatedVehicleRepairNodes = (vehicleRepairGroup?.nodes ?? [])
        .filter((node) => node.taskNodeId !== `task:${canonicalTask}`)
        .slice(0, 9);
    const relatedVehicleWiringNodes = (vehicleWiringGroup?.nodes ?? []).slice(0, 6);
    const relatedVehicleCodeNodes = (vehicleCodeGroup?.nodes ?? []).slice(0, 6);
    const priorityCodePages = getPriorityCodePagesForTasks([canonicalTask], 4)
        .filter((entry) => !relatedVehicleCodeNodes.some((node) => node.href === entry.href));
    const toolResourceLinks = getRelatedToolLinksForRepair(displayMake, displayModel, canonicalTask, 4);
    const manualMakeHref = buildManualBrowserPath(displayMake);
    const manualYearHref = buildManualBrowserPath(displayMake, resolvedYear);
    const sparkPlugIgnitionNote = getSparkPlugIgnitionNote(resolvedYear, canonicalMake, canonicalModel, canonicalTask);
    const affiliateSourceParts = dedupeCommerceParts([
        ...(vehicleSpec?.parts ?? repairData.parts.map((partName) => ({ name: partName }))),
        ...buildSupplementalRepairCommerceParts(canonicalTask, vehicleName),
    ]);
    const affiliateSpotlightParts = affiliateSourceParts
        .slice(0, PRIORITY_REPAIR_COMMERCE_TASKS.has(canonicalTask) ? 5 : 3)
        .map((part) => ({
            name: part.name,
            detail: part.spec || part.aftermarket || part.oem || `Amazon results for ${vehicleName} ${part.name}`,
            query: [vehicleName, part.aftermarket || part.oem || part.name].filter(Boolean).join(' '),
        }));
    const commercialConfig = getCommercialTaskConfig(canonicalTask);
    const taskSupportNote = TASK_SUPPORT_NOTES[canonicalTask];
    const exactGuideProfile = getExactGuideProfile(resolvedYear, canonicalMake, canonicalModel, canonicalTask);
    const fullGuideHref = '?fullGuide=1#full-ai-guide';
    const quickAnswerModule = getIntentQuickAnswerModule({
        year: resolvedYear,
        make: canonicalMake,
        model: canonicalModel,
        task: canonicalTask,
        cleanTask,
        vehicleName,
        vehicleHubHref,
        manualMakeHref,
        manualYearHref,
        fullGuideHref,
        repairData,
        commercialConfig,
        vehicleSignals: vehicleSpec ? {
            vehicleNotes: vehicleSpec.vehicleNotes,
            torqueSpecs: vehicleSpec.torqueSpecs,
            beltRouting: vehicleSpec.beltRouting,
        } : undefined,
    });
    const primaryAffiliatePart = affiliateSpotlightParts[0];
    const primaryAffiliateQuery = primaryAffiliatePart?.query || `${vehicleName} ${cleanTask}`;
    const primaryAffiliateName = primaryAffiliatePart?.name || `${cleanTask} parts`;
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
        'tail-light-replacement': '20-150',
        'transmission-fluid-change': '40-220',
        'coolant-flush': '20-120',
        'fuel-filter-replacement': '15-80',
    };

    // ── FAQ data for GEO (Generative Engine Optimization) ────────────────
    const costRange = COST_MAP[canonicalTask] || '50-300';
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
        'tail-light-replacement': `A broken or dim tail light on your ${vehicleName} makes the car harder to see and can trigger a traffic stop or inspection failure. Moisture in the housing can also spread damage to the socket or connector if ignored.`,
        'transmission-fluid-change': `Old or wrong transmission fluid in your ${vehicleName} can cause harsh shifting, slipping, shuddering, and long-term transmission wear. Neglect can turn a fluid service into a costly rebuild.`,
        'coolant-flush': `Old or contaminated coolant in your ${vehicleName} can corrode the cooling system, clog passages, and let overheating damage the head gasket or engine. Air left in the system can also create false overheating symptoms.`,
        'fuel-filter-replacement': `A clogged fuel filter on your ${vehicleName} can cause lean running, hesitation, hard starts, and fuel pump strain. Ignoring it can make the pump work harder and fail sooner.`,
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
            answer: delayConsequences[canonicalTask] || `Delaying ${cleanTask} on your ${vehicleName} can lead to more expensive repairs down the road, reduced vehicle reliability, and potential safety issues. It's best to address it within the manufacturer's recommended service interval.`,
        },
        ...(sparkPlugIgnitionNote ? [{
            question: sparkPlugIgnitionNote.faqQuestion,
            answer: sparkPlugIgnitionNote.faqAnswer,
        }] : []),
        ...(exactGuideProfile?.faq ? [exactGuideProfile.faq] : []),
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
        "author": {
            "@type": "Organization",
            "name": "SpotOnAuto"
        },
        "publisher": {
            "@type": "Organization",
            "name": "SpotOnAuto",
            "url": "https://spotonauto.com"
        },
        "inLanguage": "en",
        "totalTime": toIso8601Duration(repairData.time),
        "estimatedCost": {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": COST_MAP[canonicalTask] || "50-300"
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
            "url": `https://spotonauto.com${canonicalPath}#step-${i + 1}`
        }))
    };

    const sectionShell = 'mb-8 rounded-2xl border border-white/10 bg-white/[0.035] p-6 md:p-7';
    const sectionTitleClass = 'text-xl font-semibold text-white mb-4 tracking-tight';
    const statCardClass = 'rounded-xl border border-white/10 bg-black/20 p-4';
    const resourceCardClass = 'rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-cyan-500/30 hover:bg-white/[0.05] transition-all group';

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
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        { "@type": "ListItem", position: 1, name: "Repair Hub", item: "https://spotonauto.com/repair" },
                        { "@type": "ListItem", position: 2, name: cleanTask.charAt(0).toUpperCase() + cleanTask.slice(1), item: "https://spotonauto.com/repair" },
                        { "@type": "ListItem", position: 3, name: `${displayMake} ${displayModel}`, item: `https://spotonauto.com${vehicleHubHref}` },
                        { "@type": "ListItem", position: 4, name: `${resolvedYear}`, item: `https://spotonauto.com${canonicalPath}` },
                    ],
                }) }}
            />
            <script
                id="knowledge-graph-export"
                type="application/json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(knowledgeGraphExport) }}
            />

            {/* Visible breadcrumb navigation */}
            <nav className="max-w-6xl mx-auto px-4 pt-6 text-sm text-gray-500">
                <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
                <span className="mx-2">/</span>
                <Link href="/repair" className="hover:text-cyan-400 transition-colors">Repair Hub</Link>
                <span className="mx-2">/</span>
                <Link href="/repair" className="hover:text-cyan-400 transition-colors capitalize">{cleanTask}</Link>
                <span className="mx-2">/</span>
                <Link href={vehicleHubHref} className="hover:text-cyan-400 transition-colors">{displayMake}</Link>
                <span className="mx-2">/</span>
                <Link href={vehicleHubHref} className="hover:text-cyan-400 transition-colors">{displayModel}</Link>
                <span className="mx-2">/</span>
                <span className="text-gray-300">{resolvedYear}</span>
            </nav>

            {/* SEO Content - Renders server-side for Google */}
            <article className="max-w-5xl mx-auto px-4 py-8 md:py-10">
                {/* Hero */}
                <header className="mb-8 md:mb-10">
                    <RepairSectionTracker
                        vehicle={vehicleName}
                        task={canonicalTask}
                        section="hero"
                        label={`${vehicleName} ${cleanTask} hero`}
                        itemCount={2}
                    />
                    <p className="text-sm font-medium tracking-wide text-cyan-300/80 mb-3">
                        DIY repair guide for {vehicleName}
                    </p>
                    <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white mb-4">
                        {cleanTask.charAt(0).toUpperCase() + cleanTask.slice(1)} Guide {'\u2014'} {vehicleName}
                    </h1>
                    <p className="text-base md:text-lg leading-7 text-gray-300 max-w-3xl">
                        Start with the exact-fit quick answer below, then open the full guide when you want the longer procedure, parts, and factory references.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <RepairTrackedLink
                            href="#quick-answer"
                            vehicle={vehicleName}
                            task={canonicalTask}
                            section="hero"
                            target="jump_to_quick_answer"
                            label="Jump to quick answer"
                            className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:border-cyan-400/40 hover:bg-cyan-500/15 transition-all"
                        >
                            Jump to quick answer
                        </RepairTrackedLink>
                        <RepairTrackedLink
                            href={vehicleHubHref}
                            vehicle={vehicleName}
                            task={canonicalTask}
                            section="hero"
                            target="vehicle_hub"
                            label={`Browse the full ${vehicleName} vehicle hub`}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-gray-200 hover:border-cyan-400/30 hover:bg-white/[0.06] transition-all"
                        >
                            Browse the full {vehicleName} vehicle hub
                        </RepairTrackedLink>
                        <PricingTrackedLink
                            href="/second-opinion"
                            target="starter_free"
                            label={`repair_${canonicalTask}_quote_check`}
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 hover:border-emerald-400/45 hover:bg-emerald-500/15 transition-all"
                        >
                            Free quote check
                        </PricingTrackedLink>
                        <PricingTrackedLink
                            href="/pricing"
                            target="pro_waitlist"
                            label={`repair_${canonicalTask}_quote_pro`}
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/25 bg-white/[0.03] px-4 py-2 text-sm font-medium text-emerald-100 hover:border-emerald-200/45 hover:bg-white/[0.06] transition-all"
                        >
                            Quote Shield Pro
                        </PricingTrackedLink>
                    </div>
                </header>

                <CorpusBadge year={Number(resolvedYear)} vehicleName={vehicleName} />

                <OEMExcerpt excerpts={oemExcerpts} vehicleName={vehicleName} task={canonicalTask} />

                <section
                    id="quick-answer"
                    className={`mb-8 rounded-2xl border p-6 md:p-7 ${TASK_SUPPORT_TONE_CLASSES[quickAnswerModule.tone].shell}`}
                >
                    <RepairSectionTracker
                        vehicle={vehicleName}
                        task={canonicalTask}
                        section="quick_answer"
                        label={quickAnswerModule.title}
                        itemCount={quickAnswerModule.cards.length}
                    />
                    <div className="max-w-3xl">
                        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${TASK_SUPPORT_TONE_CLASSES[quickAnswerModule.tone].eyebrow}`}>
                            {quickAnswerModule.eyebrow}
                        </p>
                        <h2 className={`mt-3 text-2xl md:text-3xl font-semibold tracking-tight ${TASK_SUPPORT_TONE_CLASSES[quickAnswerModule.tone].title}`}>
                            {quickAnswerModule.title}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-gray-200/90">
                            {quickAnswerModule.intro}
                        </p>
                    </div>
                    <div className="mt-6 grid gap-4 lg:grid-cols-3">
                        {quickAnswerModule.cards.map((card) => {
                            const toneClasses = TASK_SUPPORT_TONE_CLASSES[card.tone === 'cyan' ? quickAnswerModule.tone : card.tone];

                            return (
                                <div key={`${card.eyebrow}-${card.title}`} className="rounded-xl border border-white/10 bg-black/20 p-4">
                                    <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${toneClasses.eyebrow}`}>
                                        {card.eyebrow}
                                    </p>
                                    <h3 className={`mt-3 text-lg font-semibold tracking-tight ${toneClasses.title}`}>
                                        {card.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-gray-200/90">
                                        {card.summary}
                                    </p>
                                    <ul className="mt-4 space-y-2">
                                        {card.bullets.map((bullet) => (
                                            <li key={bullet} className={`text-sm leading-6 ${toneClasses.bullet}`}>
                                                • {bullet}
                                            </li>
                                        ))}
                                    </ul>
                                    {card.links.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {card.links.map((link) => (
                                                <RepairTrackedLink
                                                    key={`${card.title}-${link.href}`}
                                                    href={link.href}
                                                    vehicle={vehicleName}
                                                    task={canonicalTask}
                                                    section="quick_answer"
                                                    target={getRepairAnswerTarget({
                                                        href: link.href,
                                                        year: resolvedYear,
                                                        make: canonicalMake,
                                                        model: canonicalModel,
                                                        task: canonicalTask,
                                                        vehicleHubHref,
                                                        manualMakeHref,
                                                        manualYearHref,
                                                        fullGuideHref,
                                                    })}
                                                    label={`${card.title}: ${link.label}`}
                                                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-gray-100 transition-colors hover:border-white/20 hover:bg-white/[0.08]"
                                                >
                                                    {link.label}
                                                </RepairTrackedLink>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {taskSupportNote && (
                    <section className={`mb-8 rounded-2xl border p-6 md:p-7 ${TASK_SUPPORT_TONE_CLASSES[taskSupportNote.tone].shell}`}>
                        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${TASK_SUPPORT_TONE_CLASSES[taskSupportNote.tone].eyebrow}`}>
                            {taskSupportNote.eyebrow}
                        </p>
                        <h2 className={`mt-3 text-2xl font-semibold tracking-tight ${TASK_SUPPORT_TONE_CLASSES[taskSupportNote.tone].title}`}>
                            {taskSupportNote.title}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-gray-200/90">
                            {taskSupportNote.intro}
                        </p>
                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                            {taskSupportNote.bullets.map((bullet) => (
                                <div key={bullet} className="rounded-xl border border-white/10 bg-black/20 p-4">
                                    <p className={`text-sm leading-6 ${TASK_SUPPORT_TONE_CLASSES[taskSupportNote.tone].bullet}`}>
                                        {bullet}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {exactGuideProfile?.supportNote && (() => {
                    const supportNote = exactGuideProfile.supportNote;
                    const toneClasses = TASK_SUPPORT_TONE_CLASSES[supportNote.tone];

                    return (
                    <section className={`mb-8 rounded-2xl border p-6 md:p-7 ${toneClasses.shell}`}>
                        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${toneClasses.eyebrow}`}>
                            {supportNote.eyebrow}
                        </p>
                        <h2 className={`mt-3 text-2xl font-semibold tracking-tight ${toneClasses.title}`}>
                            {supportNote.title}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-gray-200/90">
                            {supportNote.intro}
                        </p>
                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                            {supportNote.bullets.map((bullet) => (
                                <div key={bullet} className="rounded-xl border border-white/10 bg-black/20 p-4">
                                    <p className={`text-sm leading-6 ${toneClasses.bullet}`}>
                                        {bullet}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                    );
                })()}

                <section className="mb-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6 md:p-7">
                    <h2 className="text-xl font-semibold text-white tracking-tight">How this page is grounded</h2>
                    <p className="mt-2 text-sm leading-7 text-emerald-50/90">
                        The answer starts from a structured repair template, then narrows to the exact vehicle, task, fitment notes, and linked manual paths already available for this page.
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200/80">Exact vehicle context</p>
                            <p className="mt-2 text-sm leading-6 text-gray-200">This page only renders after the year, make, model, and task are validated into a real repair path.</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200/80">Structured repair data</p>
                            <p className="mt-2 text-sm leading-6 text-gray-200">The page pulls from repair timing, tools, parts, warnings, and step data before it renders the guide body.</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200/80">Manual and spec cross-checks</p>
                            <p className="mt-2 text-sm leading-6 text-gray-200">Use the linked manual and spec paths to verify fitment, torque, and service order before teardown.</p>
                        </div>
                    </div>
                </section>

                {(tier1RescueEntry || sameTaskSupportGapPages.length > 0 || modelTier1Pages.length > 0 || exactVehicleTier1Pages.length > 0) && (
                    <section className="mb-8 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-6 md:p-7">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-3xl">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200/80">
                                    Related Pages
                                </p>
                                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                                    More resources for this repair
                                </h2>
                                <p className="mt-3 text-sm leading-7 text-violet-50/85">
                                    Browse related vehicle pages, model guides, and other {cleanTask} resources.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                            <Link
                                href={vehicleHubHref}
                                className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-violet-400/35 hover:bg-black/30 transition-all"
                            >
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200/80 mb-2">Vehicle hub</p>
                                <h3 className="text-base font-semibold text-white">{vehicleName} Repair Hub</h3>
                                <p className="mt-2 text-sm leading-6 text-gray-300">See all repairs, wiring diagrams, and codes for your {vehicleName}.</p>
                            </Link>
                            <Link
                                href={vehicleHubHref}
                                className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-violet-400/35 hover:bg-black/30 transition-all"
                            >
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200/80 mb-2">Model cluster</p>
                                <h3 className="text-base font-semibold text-white">{displayMake} {displayModel} Guides</h3>
                                <p className="mt-2 text-sm leading-6 text-gray-300">Browse all repair guides for the {displayMake} {displayModel}.</p>
                            </Link>
                            <Link
                                href="/repair"
                                className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-violet-400/35 hover:bg-black/30 transition-all"
                            >
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200/80 mb-2">Repair family</p>
                                <h3 className="text-base font-semibold text-white">All {cleanTask} guides</h3>
                                <p className="mt-2 text-sm leading-6 text-gray-300">See {cleanTask} guides for every vehicle we cover.</p>
                            </Link>
                        </div>

                        {sameTaskSupportGapPages.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold text-white mb-3">More {cleanTask} guides</h3>
                                <div className="grid gap-3 md:grid-cols-3">
                                    {sameTaskSupportGapPages.map((entry) => (
                                        <Link
                                            key={entry.href}
                                            href={entry.href}
                                            className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-violet-400/35 hover:bg-black/30 transition-all"
                                        >
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200/80 mb-2">Repair guide</p>
                                            <h3 className="text-base font-semibold text-white">{entry.label}</h3>
                                            <p className="mt-2 text-xs leading-6 text-gray-400">{entry.action || 'Related repair'}</p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(exactVehicleTier1Pages.length > 0 || modelTier1Pages.length > 0) && (
                            <div className="mt-6 grid gap-6 xl:grid-cols-2">
                                {exactVehicleTier1Pages.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-3">Other {vehicleName} guides</h3>
                                        <div className="space-y-3">
                                            {exactVehicleTier1Pages.map((entry) => (
                                                <Link
                                                    key={entry.href}
                                                    href={entry.href}
                                                    className="block rounded-xl border border-white/10 bg-black/20 p-4 hover:border-violet-400/35 hover:bg-black/30 transition-all"
                                                >
                                                    <p className="text-base font-semibold text-white">{entry.year} {entry.make} {entry.model}</p>
                                                    <p className="mt-1 text-sm capitalize text-gray-300">{entry.task.replace(/-/g, ' ')}</p>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {modelTier1Pages.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-3">More {displayMake} {displayModel} guides</h3>
                                        <div className="space-y-3">
                                            {modelTier1Pages.map((entry) => (
                                                <Link
                                                    key={entry.href}
                                                    href={entry.href}
                                                    className="block rounded-xl border border-white/10 bg-black/20 p-4 hover:border-violet-400/35 hover:bg-black/30 transition-all"
                                                >
                                                    <p className="text-base font-semibold text-white">{entry.year} {entry.make} {entry.model}</p>
                                                    <p className="mt-1 text-sm capitalize text-gray-300">{entry.task.replace(/-/g, ' ')}</p>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {prioritySymptomHubs.length > 0 && (
                    <section className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-6 md:p-7">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-3xl">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">
                                    Symptom routing
                                </p>
                                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                                    Priority symptom hubs that lead to this repair
                                </h2>
                                <p className="mt-3 text-sm leading-7 text-amber-50/85">
                                    These report-backed symptom hubs are the strongest plain-English entry points into this repair path, related codes, and exact vehicle troubleshooting.
                                </p>
                            </div>
                            <Link
                                href={`/diagnose?year=${resolvedYear}&make=${canonicalMake}&model=${canonicalModel}&task=${encodeURIComponent(prioritySymptomHubs[0].label)}`}
                                className="inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-amber-400"
                            >
                                Diagnose from symptom
                            </Link>
                        </div>
                        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {prioritySymptomHubs.map((cluster) => (
                                <Link
                                    key={cluster.href}
                                    href={cluster.href}
                                    className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-amber-400/35 hover:bg-black/30 transition-all"
                                >
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80 mb-2">Symptom Hub</p>
                                    <h3 className="text-base font-semibold text-white">{cluster.label}</h3>
                                    <p className="mt-2 text-sm leading-6 text-gray-300">{cluster.summary}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {priorityCodePages.length > 0 && (
                    <section className="mb-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6 md:p-7">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-3xl">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                                    Code reinforcement
                                </p>
                                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                                    Related Trouble Codes
                                </h2>
                                <p className="mt-3 text-sm leading-7 text-emerald-50/85">
                                    These check engine light codes are often connected to this repair.
                                </p>
                            </div>
                            <Link
                                href="/codes"
                                className="inline-flex items-center justify-center rounded-full border border-emerald-300/30 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200/50 hover:bg-white/[0.04]"
                            >
                                Browse all codes
                            </Link>
                        </div>
                        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {priorityCodePages.map((entry) => (
                                <Link
                                    key={entry.href}
                                    href={entry.href}
                                    className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-emerald-400/40 hover:bg-black/30 transition-all"
                                >
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/80 mb-2">{entry.affectedSystem} Code</p>
                                    <h3 className="text-base font-semibold text-white">{entry.label}</h3>
                                    <p className="mt-2 text-xs leading-6 text-gray-400">{entry.action}</p>
                                    <p className="mt-1 text-xs leading-6 text-gray-500">{entry.action || 'Related repair'}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                <section className="mb-8 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
                    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-6 md:p-7">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">
                            Best first step for this repair
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                            {commercialConfig.primaryActionLabel}
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-amber-50/85">
                            {commercialConfig.primaryActionHint}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <AffiliateLink
                                href={buildAmazonSearchUrl(primaryAffiliateQuery, 'automotive', `${resolvedYear}-${canonicalMake}-${canonicalModel}-${canonicalTask}`)}
                                partName={primaryAffiliateName}
                                vehicle={vehicleName}
                                isHighTicket={HIGH_TICKET_PART_PATTERN.test(primaryAffiliateName)}
                                pageType="repair_guide"
                                className="inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-amber-400"
                            >
                                {commercialConfig.primaryActionLabel}
                            </AffiliateLink>
                            <Link
                                href="#parts-needed"
                                className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-medium text-white transition hover:border-amber-300/40 hover:bg-white/[0.04]"
                            >
                                Review parts list first
                            </Link>
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            {commercialConfig.fitmentChecks.map((item) => (
                                <div key={item} className="rounded-xl border border-white/10 bg-black/20 p-3">
                                    <p className="text-sm leading-6 text-gray-200">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06] p-6 md:p-7">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
                            Need the walkthrough?
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                            {commercialConfig.guideActionLabel}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-gray-300">
                            {commercialConfig.guideActionHint}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <Link
                                href={fullGuideHref}
                                className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-400"
                            >
                                Open full guide
                            </Link>
                            <Link
                                href="#tools-required"
                                className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-medium text-white transition hover:border-cyan-300/40 hover:bg-white/[0.04]"
                            >
                                Check tools required
                            </Link>
                        </div>
                        <div className="mt-5 space-y-2 text-sm leading-6 text-cyan-50/80">
                            <p>No signup required. Loads only when requested for a faster first page view.</p>
                            <p>{vehicleSpec ? 'Vehicle-specific notes and part numbers are already on this page.' : 'Start here with the short guide, then open the full version if you need more detail.'}</p>
                        </div>
                    </div>
                </section>

                <section className={`${sectionShell} border-cyan-500/20 bg-cyan-500/[0.06]`}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-5">
                        <div>
                            <h2 className="text-xl font-semibold text-white tracking-tight">At a glance</h2>
                            <p className="mt-1 text-sm leading-6 text-gray-300">
                                The core information most people want before deciding whether to do this repair themselves.
                            </p>
                        </div>
                        <p className="text-sm text-cyan-100/80">
                            DIY parts cost: <span className="font-semibold text-white">${costRange}</span>
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className={statCardClass}>
                            <WrenchIcon className="w-5 h-5 text-brand-cyan mb-3" />
                            <p className="text-[11px] font-medium tracking-wide text-gray-500">Difficulty</p>
                            <p className="mt-1 text-white font-semibold">{repairData.difficulty}</p>
                        </div>
                        <div className={statCardClass}>
                            <ClockIcon className="w-5 h-5 text-brand-cyan mb-3" />
                            <p className="text-[11px] font-medium tracking-wide text-gray-500">Time</p>
                            <p className="mt-1 text-white font-semibold">{repairData.time}</p>
                        </div>
                        <div className={statCardClass}>
                            <ShoppingCartIcon className="w-5 h-5 text-amber-400 mb-3" />
                            <p className="text-[11px] font-medium tracking-wide text-gray-500">Parts</p>
                            <p className="mt-1 text-white font-semibold">{repairData.parts.length} items</p>
                        </div>
                        <div className={statCardClass}>
                            <CheckCircleIcon className="w-5 h-5 text-green-400 mb-3" />
                            <p className="text-[11px] font-medium tracking-wide text-gray-500">DIY savings</p>
                            <p className="mt-1 text-white font-semibold">$100-400+</p>
                        </div>
                    </div>
                </section>

                {/* Vehicle-Specific Notes — only renders when we have real data */}
                {vehicleSpec && (
                    <section id="vehicle-specific-data" className={`${sectionShell} border-cyan-500/20 bg-cyan-950/25`}>
                        <h2 className="text-xl font-semibold text-cyan-300 mb-4 tracking-tight">
                            {vehicleName} — What You Need to Know
                        </h2>
                        <ul className="space-y-3">
                            {vehicleSpec.vehicleNotes.map((note, i) => (
                                <li key={i} className="flex items-start gap-3 text-cyan-50/95 leading-7">
                                    <span className="text-cyan-400 mt-1.5">•</span>
                                    {note}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                        {vehicleSpec.torqueSpecs && (
                            <div className="rounded-xl border border-cyan-500/20 bg-black/20 p-4">
                                <span className="text-xs font-medium tracking-wide text-cyan-300/80">Torque specs</span>
                                <p className="text-white mt-2">{vehicleSpec.torqueSpecs}</p>
                            </div>
                        )}
                        {vehicleSpec.beltRouting && (
                            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                                <span className="text-xs font-medium tracking-wide text-cyan-300/80">Belt routing</span>
                                <p className="text-gray-300 mt-2 leading-6">{vehicleSpec.beltRouting}</p>
                            </div>
                        )}
                        </div>
                    </section>
                )}

                {/* Safety Warnings */}
                <section id="safety-warnings" className={`${sectionShell} border-red-500/25 bg-red-950/25`}>
                    <h2 className="text-xl font-semibold text-red-300 mb-4 flex items-center gap-2 tracking-tight">
                        <AlertTriangleIcon className="w-5 h-5" />
                        Safety Warnings
                    </h2>
                    <ul className="space-y-3">
                        {repairData.warnings.map((warning, i) => (
                            <li key={i} className="flex items-start gap-3 text-red-100/95 leading-7">
                                <span className="text-red-400 mt-1.5">•</span>
                                {warning}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Ad: After Safety Warnings */}
                <AdUnit slot="repair-after-safety" format="horizontal" />

                {/* Tools Required */}
                <section id="tools-required" className={sectionShell}>
                    <h2 className={sectionTitleClass}>Tools required</h2>
                    <p className="text-sm leading-6 text-gray-400 mb-4">
                        Gather these before you start so the job flows cleanly once the vehicle is apart.
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                        {repairData.tools.map((tool, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3.5">
                                <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">{tool}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Parts List */}
                <section id="parts-needed" className={sectionShell}>
                    <h2 className={sectionTitleClass}>{commercialConfig.partsTitle}</h2>
                    <p className="text-sm leading-6 text-gray-400 mb-4">
                        {commercialConfig.partsIntro}
                    </p>
                    <p className="text-sm leading-6 text-gray-500 mb-4">
                        We surface the most relevant part number, OEM reference, or spec we have for this job so you can compare listings with higher confidence.
                    </p>
                    <div className="space-y-3">
                        {vehicleSpec ? (
                            vehicleSpec.parts.map((part: PartSpec, i: number) => {
                                const searchTerm = part.aftermarket || part.oem || `${vehicleName} ${part.name}`;
                                return (
                                    <div key={i} className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between">
                                        <div className="flex-1 min-w-0">
                                            <span className="text-white font-medium">{part.name}</span>
                                            {part.spec && (
                                                <span className="block text-sm text-gray-400 mt-1 leading-6">{part.spec}</span>
                                            )}
                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                {part.oem && (
                                                    <span className="inline-block rounded-full bg-blue-500/20 px-2.5 py-1 text-xs text-blue-200">
                                                        OEM {part.oem}
                                                    </span>
                                                )}
                                                {part.aftermarket && (
                                                    <span className="inline-block rounded-full bg-green-500/20 px-2.5 py-1 text-xs text-green-200">
                                                        {part.aftermarket}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <AffiliateLink
                                            href={buildAmazonSearchUrl(searchTerm, 'automotive', `${resolvedYear}-${canonicalMake}-${canonicalModel}-${canonicalTask}`)}
                                            partName={part.name}
                                            vehicle={vehicleName}
                                            isHighTicket={HIGH_TICKET_PART_PATTERN.test(part.name)}
                                            pageType="repair_guide"
                                            className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition"
                                        >
                                            {getPartActionLabel(canonicalTask, part.name)}
                                        </AffiliateLink>
                                    </div>
                                );
                            })
                        ) : (
                            repairData.parts.map((part, i) => (
                                <div key={i} className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between">
                                    <span className="text-white font-medium">{part}</span>
                                    <AffiliateLink
                                        href={buildAmazonSearchUrl(`${vehicleName} ${part}`, 'automotive', `${resolvedYear}-${canonicalMake}-${canonicalModel}-${canonicalTask}`)}
                                        partName={part}
                                        vehicle={vehicleName}
                                        isHighTicket={HIGH_TICKET_PART_PATTERN.test(part)}
                                        pageType="repair_guide"
                                        className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition"
                                    >
                                        {getPartActionLabel(canonicalTask, part)}
                                    </AffiliateLink>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {affiliateSpotlightParts.length > 0 && (
                    <section className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 md:p-7">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                            <div>
                                <h2 className="text-xl font-semibold text-white tracking-tight">{commercialConfig.spotlightTitle}</h2>
                                <p className="text-sm leading-6 text-amber-100/80 mt-1">
                                    {commercialConfig.spotlightIntro}
                                </p>
                            </div>
                            <AffiliateLink
                                href={buildAmazonSearchUrl(`${vehicleName} ${cleanTask}`, 'automotive', `${resolvedYear}-${canonicalMake}-${canonicalModel}-${canonicalTask}`)}
                                partName={`${cleanTask} parts`}
                                vehicle={vehicleName}
                                isHighTicket={canonicalTask === 'radiator-replacement'}
                                pageType="repair_guide"
                                className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition"
                            >
                                {commercialConfig.bundleActionLabel}
                            </AffiliateLink>
                        </div>
                        <div className="grid md:grid-cols-3 gap-3">
                            {affiliateSpotlightParts.map((part) => (
                                <div key={part.name} className="rounded-xl border border-white/10 bg-black/20 p-4">
                                    <p className="text-base font-medium text-white">{part.name}</p>
                                    <p className="mt-2 text-sm leading-6 text-gray-400">{part.detail}</p>
                                    <AffiliateLink
                                        href={buildAmazonSearchUrl(part.query, 'automotive', `${resolvedYear}-${canonicalMake}-${canonicalModel}-${canonicalTask}`)}
                                        partName={part.name}
                                        vehicle={vehicleName}
                                        isHighTicket={HIGH_TICKET_PART_PATTERN.test(part.name)}
                                        pageType="repair_guide"
                                        className="mt-4 inline-flex items-center text-sm font-bold text-amber-300 hover:text-amber-200 transition"
                                    >
                                        {getSpotlightActionLabel(canonicalTask, part.name)} →
                                    </AffiliateLink>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Ad: After Parts List */}
                <AdUnit slot="repair-after-parts" format="rectangle" />

                {/* Basic Steps */}
                <section className={sectionShell}>
                    <h2 className={sectionTitleClass}>Basic procedure overview</h2>
                    <p className="text-sm leading-6 text-gray-400 mb-4">
                        This is the short version of the job flow. The AI guide below fills in torque specs, access details, and vehicle-specific cautions.
                    </p>
                    <ol className="space-y-3">
                        {repairData.steps.map((step, i) => (
                            <li key={i} className="flex gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
                                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-cyan/90 text-sm font-semibold text-black">
                                    {i + 1}
                                </span>
                                <span className="pt-1 leading-7 text-gray-300">{step}</span>
                            </li>
                        ))}
                    </ol>
                </section>

                {sparkPlugIgnitionNote && (
                    <section className={`${sectionShell} border-indigo-500/20 bg-indigo-950/20`}>
                        <h2 className="text-xl font-semibold text-indigo-200 mb-3 tracking-tight">{sparkPlugIgnitionNote.title}</h2>
                        <p className="text-indigo-100/90 leading-relaxed">{sparkPlugIgnitionNote.body}</p>
                    </section>
                )}

                {/* Frequently Asked Questions — GEO optimized for AI search citation */}
                <section className={sectionShell}>
                    <h2 className={sectionTitleClass}>Frequently asked questions</h2>
                    <dl className="space-y-4">
                        {faqItems.map((faq, i) => (
                            <div key={i} className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
                                <dt className="px-5 py-4 font-medium text-white leading-7">
                                    {faq.question}
                                </dt>
                                <dd className="px-5 pb-5 text-sm leading-7 text-gray-400">
                                    {faq.answer}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>

                {/* Ad: After FAQ */}
                <AdUnit slot="repair-after-faq" format="horizontal" />

                {/* CTA to AI Guide */}
                <div className="mb-8 rounded-2xl border border-brand-cyan/20 bg-gradient-to-r from-brand-cyan/10 to-purple-500/10 p-8 text-center">
                    <div className="inline-block rounded-full bg-brand-cyan/20 px-3 py-1 text-xs font-medium tracking-wide text-brand-cyan mb-4">
                        100% Free
                    </div>
                    <h2 className="text-2xl font-semibold text-white tracking-tight mb-3">
                        Get the Full AI-Powered Repair Guide
                    </h2>
                    <p className="text-gray-300 leading-7 mb-2 max-w-xl mx-auto">
                        Exact torque specs, part numbers, and step-by-step instructions tailored to your <strong className="text-white">{vehicleName}</strong>.
                    </p>
                    <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                        Unlimited AI repair guides for every vehicle. No signup required. Veteran-owned.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href={fullGuideHref}
                            className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-400"
                        >
                            Open full guide
                        </Link>
                        <Link
                            href="#parts-needed"
                            className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-medium text-white transition hover:border-cyan-300/40 hover:bg-white/[0.04]"
                        >
                            Review exact-fit parts
                        </Link>
                    </div>
                </div>
            </article>

            {/* Client-side AI Guide */}
            <DeferredGuideContent params={resolvedParams} />

            {/* More SEO Content */}
            <section className="max-w-6xl mx-auto px-4 py-8 border-t border-white/10">
                <h2 className="text-xl font-bold text-white mb-4">
                    About {cleanTask.charAt(0).toUpperCase() + cleanTask.slice(1)} on {displayMake} {displayModel}
                </h2>
                <p className="text-gray-400 leading-7 mb-4">
                    Performing a {cleanTask} on your {vehicleName} is a common maintenance task that
                    most DIY mechanics can handle with basic tools. By doing this repair yourself,
                    you can save $100-400 compared to dealership or shop prices.
                </p>
                <p className="text-gray-400 leading-7 mb-4">
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

            <section className="max-w-6xl mx-auto px-4 py-8 border-t border-white/10">
                <div className="max-w-3xl mb-6">
                    <h2 className="text-xl font-bold text-white">Vehicle Resources</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Follow the strongest internal paths from this repair into manuals, year indexes, and related spec pages.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <Link
                        href={manualMakeHref}
                        className={resourceCardClass}
                    >
                        <p className="text-xs font-medium tracking-wide text-cyan-300/80 mb-2">Factory manual</p>
                        <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                            Browse {displayMake} manual sections
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-gray-400">Move from make-level manual navigation into service sections and procedures.</p>
                    </Link>
                    <Link
                        href={manualYearHref}
                        className={resourceCardClass}
                    >
                        <p className="text-xs font-medium tracking-wide text-cyan-300/80 mb-2">Year index</p>
                        <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                            Open the {resolvedYear} {displayMake} manual
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-gray-400">Jump directly into the OEM year tree for this vehicle before drilling into sections.</p>
                    </Link>
                    {toolResourceLinks.map((toolLink) => (
                        <Link
                            key={toolLink.href}
                            href={toolLink.href}
                            className={resourceCardClass}
                        >
                            <p className="text-xs font-medium tracking-wide text-cyan-300/80 mb-2">Spec page</p>
                            <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                                {displayMake} {displayModel} {toolLink.label}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-gray-400">Reference fitment and service specs without leaving the vehicle cluster.</p>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ── Knowledge Graph ─────────────────────────────────────────── */}
            {rankedKnowledgeGroups.length > 0 && (
                <section className="max-w-6xl mx-auto px-4 py-8 border-t border-white/10">
                    <div className="max-w-3xl mb-6">
                        <h2 className="text-lg font-bold text-white">Related Resources</h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Symptom guides, factory manuals, specs, wiring diagrams, and trouble codes related to this repair.
                        </p>
                    </div>
                    <div className="grid xl:grid-cols-2 gap-6">
                        {rankedKnowledgeGroups.map((group) => (
                            <KnowledgeGraphGroup
                                key={group.kind}
                                surface="repair"
                                groupKind={group.kind === 'manual' ? 'manual' : group.kind}
                                title={group.title}
                                browseHref={group.browseHref}
                                theme={group.theme}
                                nodes={group.nodes.map((node) => ({
                                    nodeId: node.nodeId,
                                    edgeId: node.edgeId,
                                    sourceNodeId: node.sourceNodeId,
                                    targetNodeId: node.targetNodeId,
                                    vehicleNodeId: node.vehicleNodeId,
                                    taskNodeId: node.taskNodeId,
                                    systemNodeId: node.systemNodeId,
                                    codeNodeId: node.codeNodeId,
        confidence: 'confidence' in node ? node.confidence : undefined,
        evidence: 'evidence' in node ? node.evidence : undefined,
                                    href: node.href,
                                    label: node.label,
                                    description: node.description,
                                    badge: node.badge,
                                    targetKind: node.kind === 'manual' ? 'manual' : node.kind,
                                }))}
                                context={{
                                    vehicle: vehicleName,
                                    task: canonicalTask,
                                }}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Exact Vehicle Graph Continuation ───────────────────────── */}
            <section className="max-w-6xl mx-auto px-4 py-10 border-t border-white/10">
                {relatedVehicleRepairNodes.length > 0 && (
                    <>
                        <h2 className="text-xl font-semibold text-white tracking-tight mb-6">More exact repair paths for your {displayMake} {displayModel}</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {relatedVehicleRepairNodes.map((node) => (
                                <Link
                                    key={node.nodeId || node.href}
                                    href={node.href}
                                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-cyan-500/30 hover:bg-white/[0.05] transition-all group"
                                >
                                    <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
                                    <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                                        {node.label}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </>
                )}

                {relatedVehicleWiringNodes.length > 0 && (
                    <>
                        <h2 className="text-xl font-semibold text-white tracking-tight mt-10 mb-6">Exact wiring pages for this vehicle</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {relatedVehicleWiringNodes.map((node) => (
                                <Link
                                    key={node.nodeId || node.href}
                                    href={node.href}
                                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-violet-500/30 hover:bg-white/[0.05] transition-all group"
                                >
                                    <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                                    <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                                        {node.label}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </>
                )}

                {relatedVehicleCodeNodes.length > 0 && (
                    <>
                        <h2 className="text-xl font-semibold text-white tracking-tight mt-10 mb-6">Likely code clusters for this vehicle</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {relatedVehicleCodeNodes.map((node) => (
                                <Link
                                    key={node.nodeId || node.href}
                                    href={node.href}
                                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-amber-500/30 hover:bg-white/[0.05] transition-all group"
                                >
                                    <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                                    <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                                        {node.label}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </>
                )}

                <h2 className="text-xl font-semibold text-white tracking-tight mt-10 mb-6">
                    {cleanTask.charAt(0).toUpperCase() + cleanTask.slice(1)} Guides for Other Vehicles
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(() => {
                        // Build dynamic cross-vehicle links based on the current vehicle
                        const currentMakeLower = canonicalMake;
                        const currentModelLower = canonicalModel;
                        const crossVehicles: { y: string; mk: string; mo: string; display: string }[] = [];

                        // Deterministic shuffle based on task+make so each page gets different vehicles
                        const seed = (canonicalTask + canonicalMake).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                        const makes = Object.entries(VEHICLE_PRODUCTION_YEARS)
                            .filter(([m]) => !NOINDEX_MAKES.has(slugifyRoutePart(m)));

                        // Collect candidates: 1 from same make (different model), rest from other makes
                        for (const [m, models] of makes) {
                            const mSlug = slugifyRoutePart(m);
                            for (const [mo, years] of Object.entries(models)) {
                                const moSlug = slugifyRoutePart(mo);
                                if (mSlug === currentMakeLower && moSlug === currentModelLower) continue;
                                if (isNonUsModel(mSlug, moSlug)) continue;
                                const targetYear = years.end >= 2025 && years.start <= 2025 ? 2025 : years.end;
                                crossVehicles.push({ y: String(targetYear), mk: mSlug, mo: moSlug, display: `${targetYear} ${m} ${mo}` });
                            }
                        }

                        // Deterministic pick: sort then offset by seed
                        crossVehicles.sort((a, b) => a.display.localeCompare(b.display));
                        const offset = seed % Math.max(crossVehicles.length - 9, 1);
                        const picked = crossVehicles.slice(offset, offset + 9);

                        return picked.map(v => (
                            <Link
                                key={`${v.mk}-${v.mo}`}
                                href={buildRepairPath(v.y, v.mk, v.mo, canonicalTask)}
                                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-cyan-500/30 hover:bg-white/[0.05] transition-all group"
                            >
                                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                                <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                                    {v.display} {toTitleCase(canonicalTask)}
                                </span>
                            </Link>
                        ));
                    })()}
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                    <Link
                        href="/repair"
                        className="inline-flex items-center gap-2 text-cyan-500 hover:text-cyan-400 text-sm font-medium transition-colors"
                    >
                        View All {cleanTask.charAt(0).toUpperCase() + cleanTask.slice(1)} Guides →
                    </Link>
                    <Link
                        href={vehicleHubHref}
                        className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 text-sm font-medium transition-colors"
                    >
                        All {displayMake} {displayModel} Guides →
                    </Link>
                    <Link
                        href="/repair"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-400 text-sm font-medium transition-colors"
                    >
                        Browse All Repair Categories →
                    </Link>
                </div>
            </section>

            <CoverageWaitlist vehicleName={vehicleName} year={Number(resolvedYear)} />
        </>
    );
}
