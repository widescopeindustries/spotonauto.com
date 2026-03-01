/**
 * THE MACHINE — Generates tool pages for every vehicle × tool type combination.
 *
 * Takes ~307 models from vehicles.ts × 6 tool types = ~1,800 pages.
 * Each page gets templated content: title, description, quick answer,
 * generation breakdowns, FAQ, and keywords — all unique per vehicle.
 *
 * Hand-crafted pages in tools-pages.ts override these when they exist
 * (they have richer, manually researched specs).
 */

import { VEHICLE_PRODUCTION_YEARS } from './vehicles';
import type { ToolPage, ToolGeneration, ToolFAQ } from './tools-pages';

// ── Helpers ───────────────────────────────────────────────────────────

function slugify(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Split a production range into pseudo-generations (~5-6 year blocks) */
function splitGenerations(start: number, end: number): { name: string; years: string; startYear: number; endYear: number }[] {
    const gens: { name: string; years: string; startYear: number; endYear: number }[] = [];
    // Work backwards from most recent (users care about newest first)
    let cursor = end;
    let genNum = 1;
    while (cursor >= start) {
        const genStart = Math.max(cursor - 5, start);
        const genEnd = cursor;
        gens.push({
            name: `${genStart}-${genEnd}`,
            years: `${genStart}-${genEnd}`,
            startYear: genStart,
            endYear: genEnd,
        });
        cursor = genStart - 1;
        genNum++;
    }
    return gens;
}

// ── Tool Type Templates ──────────────────────────────────────────────

interface ToolTypeTemplate {
    label: string;
    slugSuffix: string;
    titleTemplate: string;      // {make} {model} replacement
    descTemplate: string;
    quickAnswerTemplate: string;
    specsForGen: (make: string, model: string, gen: { startYear: number; endYear: number }) => Record<string, string>;
    notesForGen: (make: string, model: string, gen: { startYear: number; endYear: number }) => string[];
    faqTemplates: (make: string, model: string) => ToolFAQ[];
    keywordTemplates: (make: string, model: string) => string[];
}

const TEMPLATES: Record<string, ToolTypeTemplate> = {
    'oil-type': {
        label: 'Oil Type & Capacity',
        slugSuffix: 'oil-type',
        titleTemplate: '{make} {model} Oil Type & Capacity | All Years Guide',
        descTemplate: 'Find the correct oil type, weight, and capacity for your {make} {model}. Covers all model years with filter recommendations and drain intervals.',
        quickAnswerTemplate: 'The {make} {model} uses synthetic motor oil — typically 0W-20 for newer models (2010+) or 5W-30 for older ones. Capacity varies by engine; check below for your specific year.',
        specsForGen: (make, model, gen) => {
            const isModern = gen.endYear >= 2012;
            return {
                'Recommended Oil': isModern ? '0W-20 Full Synthetic' : '5W-30 Conventional or Synthetic',
                'Oil Capacity (with filter)': '4.0 - 6.5 quarts (varies by engine)',
                'Oil Change Interval': isModern ? '7,500 - 10,000 miles' : '3,000 - 5,000 miles',
                'Drain Plug Torque': '25 - 35 ft-lbs (check service manual)',
            };
        },
        notesForGen: (make, model, gen) => {
            const tips = [];
            if (gen.endYear >= 2012) tips.push('Modern engines require full synthetic — conventional oil may void warranty');
            if (gen.endYear >= 2018) tips.push('Many newer models have extended drain intervals up to 10,000 miles');
            tips.push(`Always verify oil weight on the oil cap or in your ${make} owner's manual`);
            if (gen.startYear < 2005) tips.push('Older engines may benefit from high-mileage formula if over 75,000 miles');
            return tips;
        },
        faqTemplates: (make, model) => [
            { q: `What type of oil does a ${make} ${model} use?`, a: `Most newer ${make} ${model} models (2010+) use 0W-20 full synthetic oil. Older models typically use 5W-30. The exact specification depends on your engine — check the oil cap or owner's manual for the definitive answer.` },
            { q: `How many quarts of oil does a ${make} ${model} take?`, a: `Oil capacity for the ${make} ${model} ranges from 4.0 to 6.5 quarts depending on engine size and whether you're replacing the filter. Four-cylinder engines are typically on the lower end, V6 and V8 on the higher end.` },
            { q: `Can I use conventional oil in my ${make} ${model}?`, a: `For 2010+ ${make} ${model} models, full synthetic is strongly recommended (and often required). Older models can typically use conventional, but synthetic provides better protection, longer drain intervals, and improved fuel economy.` },
            { q: `How often should I change the oil in my ${make} ${model}?`, a: `Modern ${make} ${model} models typically call for oil changes every 5,000 - 10,000 miles depending on driving conditions. Older models should stick to 3,000 - 5,000 miles. Severe driving (towing, extreme heat, short trips) may require more frequent changes.` },
            { q: `What happens if I use the wrong oil in my ${make} ${model}?`, a: `Using oil that's too thick can reduce fuel economy and increase engine wear during cold starts. Oil that's too thin may not protect adequately under load. For best results, always use the manufacturer-specified weight.` },
        ],
        keywordTemplates: (make, model) => [
            `${make} ${model} oil type`.toLowerCase(),
            `${make} ${model} oil capacity`.toLowerCase(),
            `${make} ${model} oil weight`.toLowerCase(),
            `${make} ${model} oil change`.toLowerCase(),
            `what oil does ${make} ${model} use`.toLowerCase(),
            `${make} ${model} oil filter`.toLowerCase(),
        ],
    },

    'battery-location': {
        label: 'Battery Location',
        slugSuffix: 'battery-location',
        titleTemplate: '{make} {model} Battery Location | Where Is the Battery?',
        descTemplate: 'Find where the battery is located on your {make} {model}. Covers all model years with jump start points and replacement tips.',
        quickAnswerTemplate: 'The {make} {model} battery is located in the engine bay on most models. Some years may have the battery in the trunk or under the rear seat — see the year-by-year breakdown below.',
        specsForGen: (make, model, gen) => ({
            'Battery Location': gen.endYear >= 2015 ? 'Engine bay (right side) — some variants in trunk' : 'Engine bay',
            'Battery Group Size': 'Group 35, 24F, or 48 (varies by engine)',
            'CCA (Cold Cranking Amps)': '500 - 700 CCA recommended',
            'Battery Type': gen.endYear >= 2018 ? 'AGM recommended for start-stop systems' : 'Standard flooded or AGM',
        }),
        notesForGen: (make, model, gen) => {
            const tips = [];
            if (gen.endYear >= 2018) tips.push('Vehicles with auto start-stop REQUIRE an AGM battery — standard flooded batteries will fail prematurely');
            tips.push('Disconnect the negative terminal first when removing, reconnect it last when installing');
            if (gen.endYear >= 2015) tips.push('Some models may require a battery registration/reset procedure after replacement');
            tips.push('Clean battery terminals with a wire brush and apply dielectric grease to prevent corrosion');
            return tips;
        },
        faqTemplates: (make, model) => [
            { q: `Where is the battery on a ${make} ${model}?`, a: `On most ${make} ${model} models, the battery is in the engine bay. Some European-influenced designs and certain model years place it in the trunk or under the rear seat for better weight distribution. Check your specific year below.` },
            { q: `What size battery does a ${make} ${model} need?`, a: `The ${make} ${model} typically uses a Group 35, 24F, or 48 battery depending on the engine and model year. CCA requirements range from 500-700. Vehicles with start-stop systems require an AGM battery.` },
            { q: `How long does a ${make} ${model} battery last?`, a: `A ${make} ${model} battery typically lasts 3-5 years. In hot climates like Texas and the Southwest, expect closer to 3 years. AGM batteries in start-stop equipped models may last 4-6 years.` },
            { q: `Can I replace the ${make} ${model} battery myself?`, a: `Yes, battery replacement is a straightforward DIY job on most ${make} ${model} models. You'll need a 10mm wrench for the terminals and possibly a 12mm or 13mm for the hold-down bracket. Some newer models may need a battery registration scan with an OBD2 tool.` },
        ],
        keywordTemplates: (make, model) => [
            `${make} ${model} battery location`.toLowerCase(),
            `where is the battery on a ${make} ${model}`.toLowerCase(),
            `${make} ${model} battery size`.toLowerCase(),
            `${make} ${model} battery replacement`.toLowerCase(),
            `${make} ${model} jump start`.toLowerCase(),
        ],
    },

    'tire-size': {
        label: 'Tire Size',
        slugSuffix: 'tire-size',
        titleTemplate: '{make} {model} Tire Size | All Years & Trims Guide',
        descTemplate: 'Find the correct tire size for your {make} {model}. Covers all model years and trim levels with pressure specs and recommended brands.',
        quickAnswerTemplate: 'The {make} {model} tire size varies by trim level and model year. Common sizes include 205/55R16, 215/55R17, and 225/45R18 — see the full year-by-year breakdown below.',
        specsForGen: (make, model, gen) => ({
            'Common Tire Sizes': gen.endYear >= 2015 ? '215/55R17 or 225/45R18' : '205/55R16 or 215/60R16',
            'Tire Pressure (Front/Rear)': '32 - 36 PSI (check door jamb sticker)',
            'Bolt Pattern': '5x100 or 5x114.3 (varies by model)',
            'Speed Rating': gen.endYear >= 2015 ? 'H (130 mph) or V (149 mph)' : 'H (130 mph)',
        }),
        notesForGen: (make, model, gen) => [
            'Always match all four tires for size, speed rating, and load index',
            'Tire pressure specs are on the driver door jamb sticker, NOT the tire sidewall',
            'Winter tires should be the same size or one size narrower than stock',
            gen.endYear >= 2010 ? 'TPMS sensors must be reprogrammed when swapping wheel sets' : 'Check if your model has TPMS — sensors need relearning after tire rotation',
        ],
        faqTemplates: (make, model) => [
            { q: `What size tires does a ${make} ${model} use?`, a: `The ${make} ${model} tire size varies by trim level and model year. Base trims typically use smaller wheels (16") while higher trims use 17" or 18" wheels. Check the breakdown below for your specific year and trim.` },
            { q: `What is the correct tire pressure for a ${make} ${model}?`, a: `Recommended tire pressure for the ${make} ${model} is typically 32-36 PSI. The exact specification is on the sticker inside the driver's door jamb. Do NOT use the "max pressure" number on the tire sidewall.` },
            { q: `Can I put bigger tires on my ${make} ${model}?`, a: `You can typically go one size up in width (e.g., 215 to 225) without issues. Going up in diameter (e.g., 16" to 17") requires matching wheels and may affect speedometer accuracy. Extreme upsizing can cause rubbing and void warranty.` },
            { q: `How often should I rotate ${make} ${model} tires?`, a: `Rotate your ${make} ${model} tires every 5,000-7,500 miles for even wear. Front-wheel drive vehicles wear front tires faster, so regular rotation is especially important.` },
        ],
        keywordTemplates: (make, model) => [
            `${make} ${model} tire size`.toLowerCase(),
            `${make} ${model} tire pressure`.toLowerCase(),
            `${make} ${model} wheel size`.toLowerCase(),
            `${make} ${model} bolt pattern`.toLowerCase(),
            `what size tires for ${make} ${model}`.toLowerCase(),
        ],
    },

    'serpentine-belt': {
        label: 'Serpentine Belt',
        slugSuffix: 'serpentine-belt',
        titleTemplate: '{make} {model} Serpentine Belt Guide | Diagram & Size',
        descTemplate: 'Find serpentine belt routing diagrams, part numbers, and replacement instructions for your {make} {model}. All years covered.',
        quickAnswerTemplate: 'The {make} {model} serpentine belt routes around the alternator, power steering pump, A/C compressor, and water pump. Belt length and routing vary by engine — see diagrams below.',
        specsForGen: (make, model, gen) => ({
            'Belt Type': 'Multi-rib serpentine (6PK or 7PK)',
            'Belt Length': '85" - 100" (varies by engine and A/C option)',
            'Tensioner Type': gen.endYear >= 2005 ? 'Automatic spring-loaded tensioner' : 'Manual adjustment bolt or automatic',
            'Replacement Interval': '60,000 - 100,000 miles',
        }),
        notesForGen: (make, model, gen) => [
            'Take a photo of the belt routing BEFORE removing the old belt',
            gen.endYear >= 2005 ? 'Use a 1/2" breaker bar or 15mm socket to release the automatic tensioner' : 'Check if your model uses automatic or manual tensioner adjustment',
            'Inspect the tensioner pulley and idler pulleys for bearing noise while the belt is off',
            'A new belt may squeal briefly at startup — this usually stops within a few minutes',
        ],
        faqTemplates: (make, model) => [
            { q: `How do I replace the serpentine belt on a ${make} ${model}?`, a: `Release tension on the automatic tensioner with a breaker bar, slide the old belt off, route the new belt per the diagram (usually on a sticker under the hood), and release the tensioner onto the new belt. The job takes 15-30 minutes.` },
            { q: `How do I know if my ${make} ${model} serpentine belt needs replacing?`, a: `Signs include squealing at startup, visible cracks or fraying on the belt, loss of power steering or A/C, and the battery light coming on. Most belts should be replaced every 60,000-100,000 miles.` },
            { q: `What happens if the serpentine belt breaks on my ${make} ${model}?`, a: `If the serpentine belt breaks, you lose power steering, alternator charging, A/C, and (on some engines) the water pump. Pull over immediately — driving without the water pump will cause overheating and engine damage.` },
            { q: `Where is the belt routing diagram on a ${make} ${model}?`, a: `Most ${make} ${model} models have a belt routing diagram on a sticker under the hood, near the radiator support or on the inner fender. If it's missing, check the service manual or see the diagrams below.` },
        ],
        keywordTemplates: (make, model) => [
            `${make} ${model} serpentine belt`.toLowerCase(),
            `${make} ${model} belt diagram`.toLowerCase(),
            `${make} ${model} serpentine belt replacement`.toLowerCase(),
            `${make} ${model} belt routing`.toLowerCase(),
            `${make} ${model} drive belt size`.toLowerCase(),
        ],
    },

    'headlight-bulb': {
        label: 'Headlight Bulb Size',
        slugSuffix: 'headlight-bulb',
        titleTemplate: '{make} {model} Headlight Bulb Size | All Years & Types',
        descTemplate: 'Find the correct headlight bulb size for your {make} {model}. Covers low beam, high beam, fog lights, and turn signals for all years.',
        quickAnswerTemplate: 'The {make} {model} headlight bulb size depends on the model year and trim. Common sizes include H11 (low beam), 9005/HB3 (high beam), and H16 (fog lights) — see the full breakdown below.',
        specsForGen: (make, model, gen) => {
            if (gen.endYear >= 2018) return {
                'Low Beam': 'LED (factory) or H11 equivalent',
                'High Beam': 'LED (factory) or 9005/HB3 equivalent',
                'Fog Lights': 'H16 or H11 (if equipped)',
                'Turn Signal (Front)': '7440/T20 amber',
                'Headlight Type': 'LED or LED projector (most trims)',
            };
            if (gen.endYear >= 2010) return {
                'Low Beam': 'H11 or H7',
                'High Beam': '9005/HB3',
                'Fog Lights': 'H16, H11, or 9006 (if equipped)',
                'Turn Signal (Front)': '7440/T20 or 3157 amber',
                'Headlight Type': 'Halogen projector or reflector',
            };
            return {
                'Low Beam': '9006/HB4 or H4',
                'High Beam': '9005/HB3 or H4',
                'Fog Lights': '9006 or 880/881 (if equipped)',
                'Turn Signal (Front)': '3157 amber',
                'Headlight Type': 'Halogen reflector',
            };
        },
        notesForGen: (make, model, gen) => {
            const tips = [];
            if (gen.endYear >= 2018) tips.push('Factory LED headlights are not user-replaceable — the entire assembly may need replacement');
            tips.push('Never touch halogen bulbs with bare fingers — skin oil causes hot spots and premature failure');
            if (gen.endYear >= 2010) tips.push('LED upgrade bulbs are available but may cause CANBUS errors on some models');
            tips.push('Replace bulbs in pairs — if one side burned out, the other is likely near end of life');
            return tips;
        },
        faqTemplates: (make, model) => [
            { q: `What size headlight bulb does a ${make} ${model} use?`, a: `The ${make} ${model} headlight bulb size varies by year. Newer models often use factory LED units, while older models use H11, H7, or 9006 halogen bulbs. Check the year-specific specs below for your exact fitment.` },
            { q: `Can I put LED bulbs in my ${make} ${model}?`, a: `If your ${make} ${model} has halogen headlights, you can install LED replacement bulbs. Look for bulbs with a proper beam pattern (projector-compatible) to avoid blinding other drivers. Some models may need anti-flicker adapters.` },
            { q: `How do I replace the headlight bulb on a ${make} ${model}?`, a: `On most ${make} ${model} models, you can access the headlight bulb from behind the headlight assembly in the engine bay. Twist the bulb socket counterclockwise, pull out the old bulb, insert the new one (don't touch the glass), and twist back in.` },
            { q: `Why does my ${make} ${model} headlight keep burning out?`, a: `Frequent bulb burnout on the ${make} ${model} is usually caused by a loose connection, moisture in the housing, touching the bulb glass during installation, or a voltage regulator issue. Check the connector and housing seal.` },
        ],
        keywordTemplates: (make, model) => [
            `${make} ${model} headlight bulb size`.toLowerCase(),
            `${make} ${model} headlight bulb replacement`.toLowerCase(),
            `${make} ${model} low beam bulb`.toLowerCase(),
            `${make} ${model} fog light bulb`.toLowerCase(),
            `${make} ${model} led headlight`.toLowerCase(),
        ],
    },

    'fluid-capacity': {
        label: 'Fluid Capacities',
        slugSuffix: 'fluid-capacity',
        titleTemplate: '{make} {model} Fluid Capacities | Complete Fluid Guide',
        descTemplate: 'All fluid capacities for your {make} {model}: engine oil, coolant, transmission fluid, brake fluid, power steering, and more.',
        quickAnswerTemplate: 'The {make} {model} requires multiple fluids maintained at specific levels. Engine oil, coolant, transmission fluid, brake fluid, and power steering fluid all have different capacities depending on your engine and model year.',
        specsForGen: (make, model, gen) => ({
            'Engine Oil': '4.0 - 6.5 quarts (varies by engine)',
            'Coolant (total system)': '6.0 - 10.0 quarts',
            'Transmission Fluid': gen.endYear >= 2010 ? '3.5 - 4.0 quarts (drain & fill) / 7-9 quarts (total)' : '3.0 - 4.0 quarts (drain & fill)',
            'Brake Fluid': 'DOT 3 or DOT 4 — ~1 quart for full flush',
            'Power Steering Fluid': gen.endYear >= 2015 ? 'Electric power steering — no fluid needed' : 'ATF or manufacturer-specific — ~1 quart',
            'Windshield Washer': '~1 gallon',
        }),
        notesForGen: (make, model, gen) => {
            const tips = [];
            tips.push('Never mix different types of coolant — flush completely when changing brands');
            if (gen.endYear >= 2015) tips.push('Many newer models use electric power steering — no power steering fluid required');
            tips.push('Transmission fluid should be checked with the engine running and at operating temperature');
            tips.push('Brake fluid absorbs moisture over time — replace every 2-3 years regardless of mileage');
            return tips;
        },
        faqTemplates: (make, model) => [
            { q: `How much coolant does a ${make} ${model} hold?`, a: `The ${make} ${model} cooling system holds 6-10 quarts total depending on the engine. A drain-and-fill replaces about 50-60% of the coolant. For a complete flush, you'll need the full capacity amount.` },
            { q: `What type of transmission fluid does a ${make} ${model} use?`, a: `The ${make} ${model} transmission fluid type depends on whether it's an automatic or manual transmission and the model year. Automatic transmissions typically use ATF WS, Dexron VI, or manufacturer-specific fluid. Manual transmissions use 75W-90 gear oil.` },
            { q: `Does a ${make} ${model} have power steering fluid?`, a: `2015+ ${make} ${model} models with electric power steering don't use power steering fluid. Older models with hydraulic power steering use ATF or manufacturer-specific fluid — check your owner's manual.` },
            { q: `What brake fluid does a ${make} ${model} use?`, a: `Most ${make} ${model} models use DOT 3 or DOT 4 brake fluid. DOT 4 has a higher boiling point and is preferred for performance driving. Never use DOT 5 (silicone-based) in a system designed for DOT 3/4.` },
        ],
        keywordTemplates: (make, model) => [
            `${make} ${model} fluid capacities`.toLowerCase(),
            `${make} ${model} coolant capacity`.toLowerCase(),
            `${make} ${model} transmission fluid type`.toLowerCase(),
            `${make} ${model} brake fluid type`.toLowerCase(),
            `${make} ${model} fluid specs`.toLowerCase(),
        ],
    },
    'spark-plug-type': {
        label: 'Spark Plug Type',
        slugSuffix: 'spark-plug-type',
        titleTemplate: '{make} {model} Spark Plug Type & Gap | All Years Guide',
        descTemplate: 'Find the correct spark plug type, gap size, and replacement interval for your {make} {model}. Covers all model years with torque specs.',
        quickAnswerTemplate: 'The {make} {model} typically uses iridium or platinum spark plugs. Newer models (2010+) use long-life iridium plugs rated for 60,000-100,000 miles. Check below for your specific year.',
        specsForGen: (make, model, gen) => {
            if (gen.endYear >= 2015) return {
                'Spark Plug Type': 'Iridium (long-life)',
                'Plug Gap': '0.039" - 0.043" (1.0 - 1.1mm)',
                'Replacement Interval': '60,000 - 100,000 miles',
                'Torque Spec': '15 - 22 ft-lbs (check manual)',
                'Quantity': '4 (inline-4) or 6 (V6)',
            };
            if (gen.endYear >= 2005) return {
                'Spark Plug Type': 'Platinum or Iridium',
                'Plug Gap': '0.039" - 0.044" (1.0 - 1.1mm)',
                'Replacement Interval': '30,000 - 60,000 miles',
                'Torque Spec': '13 - 20 ft-lbs',
                'Quantity': '4 (inline-4) or 6 (V6)',
            };
            return {
                'Spark Plug Type': 'Copper or Platinum',
                'Plug Gap': '0.028" - 0.044" (0.7 - 1.1mm)',
                'Replacement Interval': '30,000 miles',
                'Torque Spec': '13 - 18 ft-lbs',
                'Quantity': '4-8 (varies by engine)',
            };
        },
        notesForGen: (make, model, gen) => {
            const tips = [];
            if (gen.endYear >= 2010) tips.push('Iridium plugs last longer but cost more — do NOT re-gap iridium plugs');
            tips.push('Use a torque wrench — over-tightened plugs can strip aluminum heads');
            tips.push('Apply a thin coat of anti-seize to threads (unless plug is pre-coated)');
            if (gen.endYear >= 2005) tips.push('Use a spark plug socket with rubber insert to avoid cracking the ceramic insulator');
            return tips;
        },
        faqTemplates: (make, model) => [
            { q: `What spark plugs does a ${make} ${model} use?`, a: `The ${make} ${model} spark plug type varies by year and engine. Newer models (2010+) typically use iridium plugs for longer service life. Older models may use platinum or copper. Check the specs below for your exact year.` },
            { q: `How often should I change spark plugs on a ${make} ${model}?`, a: `Modern ${make} ${model} models with iridium plugs can go 60,000-100,000 miles between changes. Older models with copper plugs need replacement every 30,000 miles. Replace sooner if you notice misfires, rough idle, or poor fuel economy.` },
            { q: `What is the spark plug gap for a ${make} ${model}?`, a: `Most ${make} ${model} models use a spark plug gap between 0.039" and 0.044" (1.0-1.1mm). Pre-gapped plugs from the OEM are recommended. Do not re-gap iridium-tip plugs as it can damage the electrode.` },
            { q: `Can I upgrade to iridium spark plugs in my ${make} ${model}?`, a: `Yes, upgrading from copper or platinum to iridium is generally safe and beneficial. Iridium plugs offer better ignitability, longer life, and improved fuel economy. Just match the correct heat range and gap for your engine.` },
        ],
        keywordTemplates: (make, model) => [
            `${make} ${model} spark plug`.toLowerCase(),
            `${make} ${model} spark plug type`.toLowerCase(),
            `${make} ${model} spark plug gap`.toLowerCase(),
            `${make} ${model} spark plug replacement`.toLowerCase(),
            `what spark plugs for ${make} ${model}`.toLowerCase(),
        ],
    },

    'wiper-blade-size': {
        label: 'Wiper Blade Size',
        slugSuffix: 'wiper-blade-size',
        titleTemplate: '{make} {model} Wiper Blade Size | All Years Guide',
        descTemplate: 'Find the correct wiper blade sizes for your {make} {model}. Covers driver, passenger, and rear wiper for all model years.',
        quickAnswerTemplate: 'The {make} {model} wiper blade sizes vary by model year. Most recent models use 24"-26" driver side, 16"-20" passenger side, and 10"-14" rear (if equipped). See the year-by-year breakdown below.',
        specsForGen: (make, model, gen) => {
            if (gen.endYear >= 2015) return {
                'Driver Side': '24" or 26"',
                'Passenger Side': '16" or 18"',
                'Rear (if equipped)': '10" - 14"',
                'Wiper Arm Type': 'J-hook or pinch tab (varies by model)',
                'Recommended Type': 'Beam (bracketless) blades for best performance',
            };
            return {
                'Driver Side': '22" or 24"',
                'Passenger Side': '16" or 17"',
                'Rear (if equipped)': '10" - 14"',
                'Wiper Arm Type': 'J-hook (most common)',
                'Recommended Type': 'Beam or hybrid blades',
            };
        },
        notesForGen: (make, model, gen) => {
            const tips = [];
            tips.push('Replace wiper blades every 6-12 months for best visibility');
            if (gen.endYear >= 2015) tips.push('Beam-style blades outperform traditional bracket blades in rain and snow');
            tips.push('Lift the wiper arm carefully — letting it snap back can crack the windshield');
            tips.push('Clean the windshield with glass cleaner before installing new blades');
            return tips;
        },
        faqTemplates: (make, model) => [
            { q: `What size wiper blades does a ${make} ${model} use?`, a: `The ${make} ${model} wiper blade sizes depend on the model year. Check the year-specific breakdown below for exact driver, passenger, and rear wiper sizes for your vehicle.` },
            { q: `How often should I replace ${make} ${model} wiper blades?`, a: `Replace your ${make} ${model} wiper blades every 6-12 months, or when you notice streaking, skipping, or squeaking. Blades degrade faster in extreme heat and UV exposure.` },
            { q: `What type of wiper blades are best for a ${make} ${model}?`, a: `Beam (bracketless) blades like the Bosch Icon or Rain-X Latitude provide the best all-weather performance for the ${make} ${model}. They conform better to curved windshields and resist ice buildup.` },
            { q: `Can I use different size wiper blades on my ${make} ${model}?`, a: `Stick with the manufacturer-recommended sizes for optimal coverage. Going 1" longer on the driver side is sometimes possible but may cause the blades to hit each other. Never go shorter than OEM spec.` },
        ],
        keywordTemplates: (make, model) => [
            `${make} ${model} wiper blade size`.toLowerCase(),
            `${make} ${model} windshield wiper size`.toLowerCase(),
            `${make} ${model} wiper replacement`.toLowerCase(),
            `what size wipers for ${make} ${model}`.toLowerCase(),
            `${make} ${model} rear wiper size`.toLowerCase(),
        ],
    },

    'coolant-type': {
        label: 'Coolant Type',
        slugSuffix: 'coolant-type',
        titleTemplate: '{make} {model} Coolant Type & Capacity | All Years Guide',
        descTemplate: 'Find the correct coolant type, color, and capacity for your {make} {model}. Covers all years with flush intervals and mixing compatibility.',
        quickAnswerTemplate: 'The {make} {model} uses manufacturer-specific coolant — typically long-life OAT or HOAT formula. Never mix different coolant types. Check the year breakdown below for your specific coolant color and capacity.',
        specsForGen: (make, model, gen) => {
            if (gen.endYear >= 2015) return {
                'Coolant Type': 'OAT or HOAT (long-life)',
                'Coolant Color': 'Pink, blue, or orange (manufacturer-specific)',
                'Total Capacity': '6.0 - 10.0 quarts (varies by engine)',
                'Drain & Fill Volume': '3.0 - 5.0 quarts',
                'Change Interval': '100,000 miles or 10 years (first), then every 50,000',
                'Concentration': '50/50 pre-mixed or concentrate mixed 50/50 with distilled water',
            };
            if (gen.endYear >= 2005) return {
                'Coolant Type': 'HOAT or IAT',
                'Coolant Color': 'Green, orange, or pink',
                'Total Capacity': '6.0 - 10.0 quarts',
                'Drain & Fill Volume': '3.0 - 5.0 quarts',
                'Change Interval': '60,000 miles or 5 years',
                'Concentration': '50/50 with distilled water',
            };
            return {
                'Coolant Type': 'IAT (traditional green)',
                'Coolant Color': 'Green',
                'Total Capacity': '6.0 - 10.0 quarts',
                'Drain & Fill Volume': '3.0 - 5.0 quarts',
                'Change Interval': '30,000 miles or 2 years',
                'Concentration': '50/50 with distilled water',
            };
        },
        notesForGen: (make, model, gen) => {
            const tips = [];
            tips.push('NEVER mix different coolant types or colors — flush completely when changing brands');
            tips.push('Always use distilled water, not tap water, when mixing coolant concentrate');
            if (gen.endYear >= 2015) tips.push('Modern OAT/HOAT coolants last much longer than traditional green coolant');
            tips.push('Check coolant level when engine is COLD — opening the radiator cap when hot causes severe burns');
            return tips;
        },
        faqTemplates: (make, model) => [
            { q: `What type of coolant does a ${make} ${model} use?`, a: `The ${make} ${model} coolant type depends on the model year. Newer models use long-life OAT or HOAT coolant (often pink, blue, or orange). Older models use traditional green IAT coolant. Never mix types — check the specs below for your year.` },
            { q: `How much coolant does a ${make} ${model} hold?`, a: `The ${make} ${model} cooling system typically holds 6-10 quarts total. A drain-and-fill replaces about 50-60% of the coolant. For a full system flush, you'll need the complete capacity amount plus extra for bleeding.` },
            { q: `Can I mix coolant colors in my ${make} ${model}?`, a: `No — mixing different coolant types can cause gel formation, clogged passages, and overheating. If you don't know what's in the system, do a complete flush before adding new coolant. Use only the manufacturer-specified type.` },
            { q: `How often should I change coolant in my ${make} ${model}?`, a: `Modern ${make} ${model} models with long-life coolant can go 100,000 miles or 10 years before the first change, then every 50,000 miles. Older models with green coolant need changes every 30,000 miles or 2 years.` },
        ],
        keywordTemplates: (make, model) => [
            `${make} ${model} coolant type`.toLowerCase(),
            `${make} ${model} antifreeze type`.toLowerCase(),
            `${make} ${model} coolant color`.toLowerCase(),
            `${make} ${model} coolant capacity`.toLowerCase(),
            `what coolant for ${make} ${model}`.toLowerCase(),
        ],
    },

    'transmission-fluid-type': {
        label: 'Transmission Fluid',
        slugSuffix: 'transmission-fluid-type',
        titleTemplate: '{make} {model} Transmission Fluid Type & Capacity | Guide',
        descTemplate: 'Find the correct transmission fluid type and capacity for your {make} {model}. Covers automatic and manual transmissions for all years.',
        quickAnswerTemplate: 'The {make} {model} transmission fluid type depends on your transmission — automatic models typically use ATF WS, Dexron, or manufacturer-specific fluid. Manual transmissions use gear oil. See the year breakdown below.',
        specsForGen: (make, model, gen) => {
            if (gen.endYear >= 2015) return {
                'Automatic Fluid Type': 'ATF WS, Dexron VI, or manufacturer-specific (varies)',
                'Auto Drain & Fill': '3.5 - 4.0 quarts',
                'Auto Total Capacity': '7.0 - 12.0 quarts',
                'Manual Fluid Type': '75W-90 gear oil or MTF (if equipped)',
                'Manual Capacity': '2.0 - 3.0 quarts',
                'Change Interval': '60,000 - 100,000 miles (auto), 30,000 - 60,000 (manual)',
            };
            return {
                'Automatic Fluid Type': 'Dexron III/VI or manufacturer-specific ATF',
                'Auto Drain & Fill': '3.0 - 4.0 quarts',
                'Auto Total Capacity': '7.0 - 12.0 quarts',
                'Manual Fluid Type': '75W-90 gear oil',
                'Manual Capacity': '2.0 - 3.0 quarts',
                'Change Interval': '30,000 - 60,000 miles',
            };
        },
        notesForGen: (make, model, gen) => {
            const tips = [];
            tips.push('Use ONLY the manufacturer-specified fluid — wrong ATF can damage the transmission');
            tips.push('Check transmission fluid level with engine running and at operating temperature');
            if (gen.endYear >= 2015) tips.push('Many modern transmissions are "sealed" — fluid checks require removing a fill plug underneath');
            tips.push('Dark, burnt-smelling fluid indicates overheating — change immediately');
            return tips;
        },
        faqTemplates: (make, model) => [
            { q: `What transmission fluid does a ${make} ${model} use?`, a: `The ${make} ${model} transmission fluid type depends on the year and transmission. Automatic transmissions use ATF WS, Dexron VI, or manufacturer-specific fluid. Manual transmissions use 75W-90 gear oil. See below for your specific year.` },
            { q: `How much transmission fluid does a ${make} ${model} take?`, a: `A drain-and-fill on the ${make} ${model} automatic transmission typically takes 3.5-4.0 quarts. The total system capacity is 7-12 quarts. For a complete fluid exchange, you'll need the full capacity amount.` },
            { q: `How often should I change transmission fluid in my ${make} ${model}?`, a: `Change your ${make} ${model} automatic transmission fluid every 60,000-100,000 miles under normal conditions. For severe duty (towing, mountain driving, hot climates), change every 30,000-60,000 miles.` },
            { q: `Does the ${make} ${model} have a transmission dipstick?`, a: `Many 2010+ ${make} ${model} models have sealed transmissions with no dipstick. Fluid level is checked via a fill plug underneath the vehicle. Older models typically have a traditional dipstick under the hood.` },
        ],
        keywordTemplates: (make, model) => [
            `${make} ${model} transmission fluid`.toLowerCase(),
            `${make} ${model} transmission fluid type`.toLowerCase(),
            `${make} ${model} atf type`.toLowerCase(),
            `${make} ${model} transmission fluid capacity`.toLowerCase(),
            `${make} ${model} transmission fluid change`.toLowerCase(),
        ],
    },
};

// ── The Machine ──────────────────────────────────────────────────────

/**
 * Generate a ToolPage for any vehicle × tool type combination.
 * Returns null if the combination doesn't make sense (e.g. no production data).
 */
function generateToolPage(make: string, model: string, typeKey: string): ToolPage | null {
    const template = TEMPLATES[typeKey];
    if (!template) return null;

    const prodData = VEHICLE_PRODUCTION_YEARS[make]?.[model];
    if (!prodData) return null;

    const slug = `${slugify(make)}-${slugify(model)}-${template.slugSuffix}`;
    const yearRange = `${prodData.start}-${prodData.end}`;

    // Split into generation-like blocks
    const genBlocks = splitGenerations(prodData.start, prodData.end);
    const generations: ToolGeneration[] = genBlocks.map(gen => ({
        name: gen.name,
        years: gen.years,
        specs: template.specsForGen(make, model, gen),
        notes: template.notesForGen(make, model, gen),
    }));

    return {
        slug,
        make,
        model,
        toolType: typeKey as ToolPage['toolType'],
        title: template.titleTemplate.replace('{make}', make).replace('{model}', model),
        description: template.descTemplate.replace(/{make}/g, make).replace(/{model}/g, model),
        keywords: template.keywordTemplates(make, model),
        quickAnswer: template.quickAnswerTemplate.replace(/{make}/g, make).replace(/{model}/g, model).replace('{yearRange}', yearRange),
        generations,
        faq: template.faqTemplates(make, model),
    };
}

/**
 * Generate ALL tool pages for every vehicle × tool type.
 * This is the main export — call once, get ~1,800 pages.
 */
export function generateAllToolPages(): ToolPage[] {
    const pages: ToolPage[] = [];
    const toolTypes = Object.keys(TEMPLATES);

    for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
        for (const model of Object.keys(models)) {
            for (const typeKey of toolTypes) {
                const page = generateToolPage(make, model, typeKey);
                if (page) pages.push(page);
            }
        }
    }

    return pages;
}

/** All available tool type keys */
export const TOOL_TYPE_KEYS = Object.keys(TEMPLATES);

/** Get template config for a tool type */
export function getToolTypeTemplate(typeKey: string) {
    return TEMPLATES[typeKey] ?? null;
}
