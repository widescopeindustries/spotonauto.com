import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import DeferredGuideContent from './DeferredGuideContent';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';
import { ShoppingCartIcon, WrenchIcon, ClockIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';
import Link from 'next/link';
import AffiliateLink from '@/components/AffiliateLink';
import AdUnit from '@/components/AdUnit';
import KnowledgeGraphGroup from '@/components/KnowledgeGraphGroup';
import { getTier1RescueEntryByHref, getTier1RescuePagesForExactVehicle, getTier1RescuePagesForVehicle } from '@/data/rescuePriority';
import { buildSymptomHref, getSymptomClustersForRepairTask } from '@/data/symptomGraph';
import { isValidVehicleCombination, getClampedYear, getDisplayName, VALID_TASKS, NOINDEX_MAKES, VEHICLE_PRODUCTION_YEARS, slugifyRoutePart } from '@/data/vehicles';
import { getVehicleRepairSpec, PartSpec } from '@/data/vehicle-repair-specs';
import { getRelatedToolLinksForRepair } from '@/data/tools-pages';
import { getPriorityCodePagesForTasks, getPrioritySymptomHubsForTasks, getSupportGapRepairsForTasks } from '@/lib/graphPriorityLinks';
import { buildRepairKnowledgeGraph } from '@/lib/repairKnowledgeGraph';
import { buildEdgeReference, buildRepairNodeId, buildSymptomNodeId } from '@/lib/knowledgeGraph';
import { buildKnowledgeGraphExport } from '@/lib/knowledgeGraphExport';
import { rankKnowledgeGraphBlocks } from '@/lib/knowledgeGraphRanking';
import { buildRepairUrl } from '@/lib/vehicleIdentity';
import { buildVehicleHubGraph } from '@/lib/vehicleHubGraph';

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
};

const DEFAULT_REPAIR = {
    difficulty: 'Varies',
    time: '1-3 hours',
    tools: ['Basic hand tools', 'Vehicle-specific tools may be required'],
    parts: ['See repair guide for specific parts'],
    warnings: ['Consult service manual for your specific vehicle', 'Disconnect battery if working near electrical components'],
    steps: ['Research procedure for your specific vehicle', 'Gather required tools and parts', 'Follow manufacturer service procedures', 'Test repair before returning vehicle to service']
};

// Task-specific title and description overrides — tuned for SERP click intent.
// Titles target ~50 chars to avoid truncation; descriptions target searcher intent.
const TASK_META: Record<string, { title: string; description: string; extraKeywords: string[] }> = {
    'serpentine-belt-replacement': {
        title: 'Serpentine Belt Diagram, Length, Cost & Replacement',
        description: 'Serpentine belt routing diagram, rib/length fitment, and replacement steps for your {v}. Includes tensioner checks and common squeal diagnosis before ordering.',
        extraKeywords: ['serpentine belt diagram', 'belt routing diagram', 'belt replacement cost'],
    },
    'timing-belt-replacement': {
        title: 'Timing Belt Diagram & Replacement',
        description: 'Timing belt replacement guide for your {v} with timing marks diagram, water pump tips, and torque specs. Interference engine warning included.',
        extraKeywords: ['timing belt diagram', 'timing marks', 'timing belt cost'],
    },
    'battery-replacement': {
        title: 'Battery Location, Group Size, Cost & Replacement',
        description: 'Battery location, group size, CCA range, and replacement cost for your {v}. Includes terminal order, hold-down checks, and module reset notes. 15–30 min DIY job.',
        extraKeywords: ['battery location', 'battery group size', 'battery replacement cost'],
    },
    'oil-change': {
        title: 'Oil Type, Capacity & Filter Guide',
        description: 'Correct oil viscosity, capacity, and filter part number for your {v}. Drain plug torque, change interval, and approved brands. Save $50–$120 vs. shop.',
        extraKeywords: ['oil type', 'oil capacity', 'oil weight', 'oil change cost'],
    },
    'spark-plug-replacement': {
        title: 'Spark Plug, Coil-on-Plug & Wiring Guide',
        description: 'Spark plug part number, gap, torque, and coil-on-plug (COP) wiring diagram for your {v}. Ignition coil type, change interval, anti-seize tip, and cost.',
        extraKeywords: ['coil on plug', 'spark plug wires diagram', 'ignition coil replacement', 'spark plug gap', 'spark plug torque'],
    },
    'headlight-bulb-replacement': {
        title: 'How to Replace Headlight Bulb — Size & Diagram',
        description: 'Step-by-step headlight bulb replacement for your {v}. Correct bulb size, high beam and low beam fitment, removal tips, and DRL guide. 10–30 min job.',
        extraKeywords: ['headlight bulb size', 'how to change headlight bulb', 'headlight removal', 'headlight replacement diagram'],
    },
    'alternator-replacement': {
        title: 'Alternator Symptoms, Voltage Test, Cost & Replacement',
        description: 'Diagnose and replace the alternator on your {v}. Covers charging voltage checks, failure symptoms, belt inspection, and realistic replacement cost ranges.',
        extraKeywords: ['alternator symptoms', 'bad alternator signs', 'alternator cost', 'alternator testing'],
    },
    'starter-replacement': {
        title: 'Starter Symptoms, No-Start Diagnosis, Cost & Replacement',
        description: 'Starter failure and no-start diagnosis for your {v}, with location notes, wiring checks, and replacement steps. Includes common click/no-crank troubleshooting.',
        extraKeywords: ['starter symptoms', 'car wont start clicking', 'starter location', 'starter replacement cost'],
    },
    'brake-pad-replacement': {
        title: 'Brake Pad Size, Cost, Torque Specs & Replacement',
        description: 'Replace brake pads on your {v} with pad size checks, torque specs, piston direction, and bed-in steps. Includes fitment notes to avoid wrong-part orders.',
        extraKeywords: ['how to change brake pads', 'brake pad size', 'brake pad cost', 'brake pad replacement steps'],
    },
    'brake-rotor-replacement': {
        title: 'Brake Rotor Size, Minimum Thickness & Replacement',
        description: 'Correct rotor diameter, minimum thickness spec, and step-by-step replacement for your {v}. Hub cleaning tips, torque specs. Always replace in pairs.',
        extraKeywords: ['brake rotor size', 'minimum rotor thickness', 'rotor replacement cost', 'how to replace rotors'],
    },
    'water-pump-replacement': {
        title: 'Water Pump Symptoms, Location & Replacement',
        description: 'Water pump failure signs, location, and step-by-step replacement for your {v}. Gasket vs. O-ring, coolant type, belt-driven vs. chain-driven tips.',
        extraKeywords: ['water pump symptoms', 'water pump location', 'water pump cost', 'water pump replacement steps'],
    },
    'thermostat-replacement': {
        title: 'Thermostat Location, Overheating Symptoms, Cost & Replacement',
        description: 'Thermostat replacement for your {v} with location, overheating diagnosis, coolant specs, and bleed sequence. Covers housing/seal checks and realistic DIY cost.',
        extraKeywords: ['thermostat location', 'thermostat symptoms', 'thermostat replacement cost', 'overheating fix'],
    },
    'radiator-replacement': {
        title: 'Radiator Replacement Cost, Symptoms & DIY Guide',
        description: 'Step-by-step radiator replacement for your {v}. Coolant drain, hose clamp tips, transmission cooler line info, and coolant flush guide.',
        extraKeywords: ['radiator replacement cost', 'radiator leak fix', 'coolant flush', 'how to replace radiator'],
    },
    'cabin-air-filter-replacement': {
        title: 'Cabin Air Filter Size, Location & How to Replace',
        description: 'Correct cabin air filter size and step-by-step replacement for your {v}. Behind glove box or dash location, filter direction, and change interval. 5 min job.',
        extraKeywords: ['cabin air filter size', 'cabin filter location', 'how to change cabin air filter', 'cabin filter replacement'],
    },
    'engine-air-filter-replacement': {
        title: 'Engine Air Filter Size, Location & Replacement',
        description: 'Correct engine air filter part number and step-by-step replacement for your {v}. Airbox location, clamp removal, change interval, and performance filter tips.',
        extraKeywords: ['engine air filter size', 'air filter part number', 'how to change air filter', 'air filter replacement'],
    },
    'ignition-coil-replacement': {
        title: 'Ignition Coil Symptoms, Testing & Replacement',
        description: 'How to diagnose and replace a bad ignition coil on your {v}. Misfire codes, coil-on-plug vs. distributor, ohm testing, and step-by-step replacement.',
        extraKeywords: ['ignition coil symptoms', 'coil on plug replacement', 'misfire fix', 'ignition coil location'],
    },
    'oxygen-sensor-replacement': {
        title: 'O2 Sensor Location, Symptoms & Replacement',
        description: 'Upstream vs. downstream oxygen sensor location, symptoms, and step-by-step replacement for your {v}. Thread size, anti-seize tips, and reset procedure.',
        extraKeywords: ['o2 sensor symptoms', 'oxygen sensor location', 'upstream downstream sensor', 'o2 sensor replacement'],
    },
    'catalytic-converter-replacement': {
        title: 'Catalytic Converter Symptoms, P0420 & Replacement Cost',
        description: 'Catalytic converter failure symptoms and replacement cost for your {v}. P0420 code diagnosis, upstream vs. downstream, and OEM vs. aftermarket guide.',
        extraKeywords: ['catalytic converter symptoms', 'p0420 fix', 'catalytic converter cost', 'cat converter replacement'],
    },
    'transmission-fluid-change': {
        title: 'Transmission Fluid Type, Capacity & Change Guide',
        description: 'Correct transmission fluid type, capacity, and step-by-step drain-and-fill procedure for your {v}. Dipstick location, pan drop, and filter change tips.',
        extraKeywords: ['transmission fluid type', 'ATF type', 'transmission fluid capacity', 'how to change transmission fluid'],
    },
    'coolant-flush': {
        title: 'Coolant Type, Capacity & Flush Procedure',
        description: 'Correct coolant type and step-by-step flush procedure for your {v}. Drain location, distilled water ratio, bleed procedure, and change interval.',
        extraKeywords: ['coolant type', 'antifreeze type', 'coolant flush procedure', 'how to flush coolant'],
    },
    'cv-axle-replacement': {
        title: 'CV Axle Symptoms, Clicking Noise & Replacement',
        description: 'CV axle clicking noise diagnosis and step-by-step replacement for your {v}. Inner vs. outer CV joint, boot damage signs, torque specs, and grease type.',
        extraKeywords: ['cv axle symptoms', 'cv joint clicking when turning', 'cv axle replacement cost', 'how to replace cv axle'],
    },
    'shock-absorber-replacement': {
        title: 'Shock Absorber Symptoms & Replacement Guide',
        description: 'Bad shock absorber symptoms and step-by-step replacement for your {v}. Bouncing, nose dive, and uneven tire wear diagnosis. Save $150-$400 vs. shop.',
        extraKeywords: ['shock absorber symptoms', 'shocks replacement cost', 'how to replace shocks', 'bad shocks signs'],
    },
    'strut-replacement': {
        title: 'Strut Symptoms, Cost & DIY Replacement Guide',
        description: 'Front and rear strut failure symptoms and step-by-step replacement for your {v}. Spring compressor safety, alignment note, and torque specs.',
        extraKeywords: ['strut symptoms', 'strut replacement cost', 'how to replace struts', 'quick strut installation'],
    },
    'fuel-pump-replacement': {
        title: 'Fuel Pump Symptoms, Location & Replacement',
        description: 'Fuel pump failure symptoms and step-by-step replacement for your {v}. In-tank vs. external, pressure specs, strainer, and priming procedure.',
        extraKeywords: ['fuel pump symptoms', 'fuel pump location', 'fuel pump replacement cost', 'no fuel pressure fix'],
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
};

const HIGH_TICKET_PART_PATTERN = /alternator|starter|strut|shock|compressor|catalytic|manifold|radiator|transmission|turbo|differential|axle/i;

function getCommercialTaskConfig(task: string): CommercialTaskConfig {
    return COMMERCIAL_TASK_CONFIG[task] || DEFAULT_COMMERCIAL_TASK_CONFIG;
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
        default:
            return 'Open fitment search';
    }
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

    const taskMeta = TASK_META[canonicalTask];
    const title = taskMeta
        ? `${vehicleName} ${taskMeta.title} | SpotOnAuto`
        : `${vehicleName} ${cleanTask.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Guide | SpotOnAuto`;
    const description = taskMeta
        ? taskMeta.description.replace('{v}', vehicleName)
        : `DIY ${cleanTask} for your ${vehicleName}. Step-by-step guide with tools, parts list, and safety tips. Save $100–$400 vs. the shop.`;

    const baseKeywords = [
        `${canonicalYear} ${displayMake} ${displayModel} ${cleanTask}`,
        `${displayMake} ${displayModel} ${cleanTask}`,
        `how to ${cleanTask} ${displayMake} ${displayModel}`,
        `${cleanTask} ${displayMake} ${displayModel} DIY`,
        `${canonicalYear} ${displayMake} ${cleanTask}`,
    ];
    const keywords = taskMeta ? [...baseKeywords, ...taskMeta.extraKeywords] : baseKeywords;

    return {
        title,
        description,
        keywords,
        ...(NOINDEX_MAKES.has(canonicalMake) ? { robots: { index: false, follow: true } } : {}),
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
            title: 'Canonical Symptom Hubs',
            browseHref: '/symptoms',
            theme: 'amber' as const,
            nodes: symptomNodes,
        }] : []),
        ...knowledgeGraph.groups,
    ];
    const rankedKnowledgeGroups = rankKnowledgeGraphBlocks('repair', repairGraphGroups);
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
                href: node.href,
                label: node.label,
                description: node.description,
                badge: node.badge,
                targetKind: node.kind,
            })),
        })),
    });
    const vehicleHubGraph = await buildVehicleHubGraph({
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
    const affiliateSourceParts: Array<PartSpec> = vehicleSpec?.parts ?? repairData.parts.map((partName) => ({ name: partName }));
    const affiliateSpotlightParts = affiliateSourceParts
        .slice(0, 3)
        .map((part) => ({
            name: part.name,
            detail: part.spec || part.aftermarket || part.oem || `Amazon results for ${vehicleName} ${part.name}`,
            query: [vehicleName, part.aftermarket || part.oem || part.name].filter(Boolean).join(' '),
        }));
    const commercialConfig = getCommercialTaskConfig(canonicalTask);
    const primaryAffiliatePart = affiliateSpotlightParts[0];
    const primaryAffiliateQuery = primaryAffiliatePart?.query || `${vehicleName} ${cleanTask}`;
    const primaryAffiliateName = primaryAffiliatePart?.name || `${cleanTask} parts`;
    const fullGuideHref = '?fullGuide=1#full-ai-guide';
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
                        { "@type": "ListItem", position: 1, name: "Repairs", item: "https://spotonauto.com/repairs" },
                        { "@type": "ListItem", position: 2, name: cleanTask.charAt(0).toUpperCase() + cleanTask.slice(1), item: `https://spotonauto.com/repairs/${canonicalTask}` },
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
                <Link href="/repairs" className="hover:text-cyan-400 transition-colors">Repairs</Link>
                <span className="mx-2">/</span>
                <Link href={`/repairs/${canonicalTask}`} className="hover:text-cyan-400 transition-colors capitalize">{cleanTask}</Link>
                <span className="mx-2">/</span>
                <Link href={`/guides/${canonicalMake}`} className="hover:text-cyan-400 transition-colors">{displayMake}</Link>
                <span className="mx-2">/</span>
                <Link href={vehicleHubHref} className="hover:text-cyan-400 transition-colors">{displayModel}</Link>
                <span className="mx-2">/</span>
                <span className="text-gray-300">{resolvedYear}</span>
            </nav>

            {/* SEO Content - Renders server-side for Google */}
            <article className="max-w-5xl mx-auto px-4 py-8 md:py-10">
                {/* Hero */}
                <header className="mb-8 md:mb-10">
                    <p className="text-sm font-medium tracking-wide text-cyan-300/80 mb-3">
                        DIY repair guide for {vehicleName}
                    </p>
                    <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white mb-4">
                        {cleanTask.charAt(0).toUpperCase() + cleanTask.slice(1)} Guide {'\u2014'} {vehicleName}
                    </h1>
                    <p className="text-base md:text-lg leading-7 text-gray-300 max-w-3xl">
                        Complete DIY repair guide with step-by-step instructions. Find exact parts on Amazon for your vehicle.
                    </p>
                    <div className="mt-5">
                        <Link
                            href={vehicleHubHref}
                            className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:border-cyan-400/40 hover:bg-cyan-500/15 transition-all"
                        >
                            Browse the full {vehicleName} vehicle hub
                        </Link>
                    </div>
                </header>

                <section className="mb-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6 md:p-7">
                    <h2 className="text-xl font-semibold text-white tracking-tight">Why this guide is trustworthy</h2>
                    <p className="mt-2 text-sm leading-7 text-emerald-50/90">
                        This page is generated from a structured repair template, then constrained with vehicle-specific validation so impossible year/make/model combinations are rejected before content is produced.
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200/80">Vehicle validation</p>
                            <p className="mt-2 text-sm leading-6 text-gray-200">Invalid vehicle combinations are blocked, then redirected or 404’d instead of being hallucinated.</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200/80">Structured data</p>
                            <p className="mt-2 text-sm leading-6 text-gray-200">HowTo, FAQ, and breadcrumb schema are embedded to keep guidance machine-readable and consistent.</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200/80">Factory references</p>
                            <p className="mt-2 text-sm leading-6 text-gray-200">Use the linked manual and spec pages below to verify torque specs, fitment, and service steps before teardown.</p>
                        </div>
                    </div>
                </section>

                {(tier1RescueEntry || sameTaskSupportGapPages.length > 0 || modelTier1Pages.length > 0 || exactVehicleTier1Pages.length > 0) && (
                    <section className="mb-8 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-6 md:p-7">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-3xl">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200/80">
                                    Tier-1 recovery lane
                                </p>
                                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                                    Push more authority into the strongest exact repair pages
                                </h2>
                                <p className="mt-3 text-sm leading-7 text-violet-50/85">
                                    {tier1RescueEntry
                                        ? 'This exact repair page is part of the winner set. Keep it tightly connected to vehicle, model, symptom, and code surfaces so Google sees it as a primary destination.'
                                        : 'This repair family is part of the current recovery lane. The links below reinforce exact repair pages the graph says deserve more internal authority.'}
                                </p>
                            </div>
                            <Link
                                href="/repair/winners/sitemap.xml"
                                className="inline-flex items-center justify-center rounded-full bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
                            >
                                Open winner sitemap
                            </Link>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                            <Link
                                href={vehicleHubHref}
                                className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-violet-400/35 hover:bg-black/30 transition-all"
                            >
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200/80 mb-2">Vehicle hub</p>
                                <h3 className="text-base font-semibold text-white">Support the exact {vehicleName} cluster</h3>
                                <p className="mt-2 text-sm leading-6 text-gray-300">Keep repair, wiring, manual, and code links flowing through the exact vehicle hub.</p>
                            </Link>
                            <Link
                                href={`/guides/${canonicalMake}/${canonicalModel}`}
                                className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-violet-400/35 hover:bg-black/30 transition-all"
                            >
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200/80 mb-2">Model cluster</p>
                                <h3 className="text-base font-semibold text-white">{displayMake} {displayModel} guide cluster</h3>
                                <p className="mt-2 text-sm leading-6 text-gray-300">Route broader make/model traffic into the exact repair pages that already have recovery potential.</p>
                            </Link>
                            <Link
                                href={`/repairs/${canonicalTask}`}
                                className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-violet-400/35 hover:bg-black/30 transition-all"
                            >
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200/80 mb-2">Repair family</p>
                                <h3 className="text-base font-semibold text-white">Reinforce the {cleanTask} category hub</h3>
                                <p className="mt-2 text-sm leading-6 text-gray-300">Use the category hub to keep task-level crawl flow pointed into the exact pages that matter most.</p>
                            </Link>
                        </div>

                        {sameTaskSupportGapPages.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold text-white mb-3">High-opportunity exact pages in this repair family</h3>
                                <div className="grid gap-3 md:grid-cols-3">
                                    {sameTaskSupportGapPages.map((entry) => (
                                        <Link
                                            key={entry.href}
                                            href={entry.href}
                                            className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-violet-400/35 hover:bg-black/30 transition-all"
                                        >
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200/80 mb-2">Support Gap</p>
                                            <h3 className="text-base font-semibold text-white">{entry.label}</h3>
                                            <p className="mt-2 text-xs leading-6 text-gray-400">Opportunity score {entry.opportunityScore}</p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(exactVehicleTier1Pages.length > 0 || modelTier1Pages.length > 0) && (
                            <div className="mt-6 grid gap-6 xl:grid-cols-2">
                                {exactVehicleTier1Pages.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-3">Other winner pages for this exact vehicle</h3>
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
                                        <h3 className="text-lg font-semibold text-white mb-3">Winner pages for this model line</h3>
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
                                    <p className="mt-2 text-xs leading-6 text-gray-500">Opportunity score {cluster.opportunityScore}</p>
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
                                    Priority code pages this repair should support
                                </h2>
                                <p className="mt-3 text-sm leading-7 text-emerald-50/85">
                                    These code pages are still light on inbound support. Promoting them from repair surfaces helps strengthen code-to-repair discovery and keeps the graph tighter.
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
                                    <p className="mt-1 text-xs leading-6 text-gray-500">Opportunity score {entry.opportunityScore}</p>
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
                                href={buildAmazonSearchUrl(primaryAffiliateQuery)}
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
                                            href={buildAmazonSearchUrl(searchTerm)}
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
                                        href={buildAmazonSearchUrl(`${vehicleName} ${part}`)}
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
                                href={buildAmazonSearchUrl(`${vehicleName} ${cleanTask}`)}
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
                                        href={buildAmazonSearchUrl(part.query)}
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
                        <h2 className="text-lg font-bold text-white">Knowledge Paths for This Repair</h2>
                        <p className="text-sm text-gray-400 mt-1">
                            This graph connects the current repair to the strongest next surfaces: symptom hubs, factory manuals, specs, tool pages, wiring, and likely trouble codes.
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
                                const targetYear = years.end >= 2013 && years.start <= 2013 ? 2013 : years.end;
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
                        href={`/repairs/${canonicalTask}`}
                        className="inline-flex items-center gap-2 text-cyan-500 hover:text-cyan-400 text-sm font-medium transition-colors"
                    >
                        View All {cleanTask.charAt(0).toUpperCase() + cleanTask.slice(1)} Guides →
                    </Link>
                    <Link
                        href={`/guides/${canonicalMake}/${canonicalModel}`}
                        className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 text-sm font-medium transition-colors"
                    >
                        All {displayMake} {displayModel} Guides →
                    </Link>
                    <Link
                        href="/repairs"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-400 text-sm font-medium transition-colors"
                    >
                        Browse All Repair Categories →
                    </Link>
                </div>
            </section>
        </>
    );
}
