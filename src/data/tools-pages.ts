/**
 * Programmatic tool pages — data-driven SEO pages for high-volume
 * "[make] [model] [spec]" searches. Each entry generates a static page
 * at /tools/{slug} with structured data, FAQ, and affiliate links.
 */

export interface ToolGeneration {
    name: string;           // e.g. "XV70 (9th Gen)"
    years: string;          // e.g. "2018-2024"
    specs: Record<string, string>;  // flexible key-value specs
    notes?: string[];       // generation-specific tips
}

export interface ToolFAQ {
    q: string;
    a: string;
}

export interface ToolPage {
    slug: string;
    make: string;
    model: string;
    toolType: 'oil-type' | 'battery-location' | 'tire-size' | 'serpentine-belt' | 'headlight-bulb' | 'fluid-capacity' | 'spark-plug-type' | 'wiper-blade-size' | 'coolant-type' | 'transmission-fluid-type';
    title: string;
    description: string;
    keywords: string[];
    quickAnswer: string;       // one-line answer for featured snippet
    generations: ToolGeneration[];
    faq: ToolFAQ[];
}

// ─── Tool type display config ──────────────────────────────────────
export const TOOL_TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
    'oil-type': { label: 'Oil Type & Capacity', icon: '🛢️', color: 'amber' },
    'battery-location': { label: 'Battery Location', icon: '🔋', color: 'green' },
    'tire-size': { label: 'Tire Size', icon: '🔘', color: 'blue' },
    'serpentine-belt': { label: 'Serpentine Belt', icon: '⚙️', color: 'purple' },
    'headlight-bulb': { label: 'Headlight Bulb Size', icon: '💡', color: 'yellow' },
    'fluid-capacity': { label: 'Fluid Capacities', icon: '🧪', color: 'cyan' },
    'spark-plug-type': { label: 'Spark Plug Type', icon: '⚡', color: 'orange' },
    'wiper-blade-size': { label: 'Wiper Blade Size', icon: '🌧️', color: 'sky' },
    'coolant-type': { label: 'Coolant Type', icon: '❄️', color: 'teal' },
    'transmission-fluid-type': { label: 'Transmission Fluid', icon: '⚙️', color: 'rose' },
};

// ═══════════════════════════════════════════════════════════════════
//  OIL TYPE & CAPACITY PAGES
// ═══════════════════════════════════════════════════════════════════

const oilPages: ToolPage[] = [
    {
        slug: 'toyota-camry-oil-type',
        make: 'Toyota', model: 'Camry', toolType: 'oil-type',
        title: 'Toyota Camry Oil Type & Capacity | All Years Guide',
        description: 'Find the correct oil type, weight, and capacity for your Toyota Camry. Covers all years 1983-2024 with filter part numbers.',
        keywords: ['toyota camry oil type', 'camry oil capacity', 'toyota camry oil weight', 'camry oil filter'],
        quickAnswer: 'Most 2018-2024 Toyota Camrys use 0W-20 synthetic oil with a capacity of 4.8 quarts (4-cylinder) or 5.7 quarts (V6).',
        generations: [
            { name: 'XV70 (2018-2024)', years: '2018-2024', specs: { 'Oil Type (4-cyl)': '0W-20 Full Synthetic', 'Capacity (4-cyl)': '4.8 quarts with filter', 'Oil Type (V6)': '0W-20 Full Synthetic', 'Capacity (V6)': '5.7 quarts with filter', 'Filter': 'Toyota 04152-YZZA1' }, notes: ['Only use 0W-20 — thicker oils void warranty', 'V6 3.5L uses same oil type but more capacity'] },
            { name: 'XV50 (2012-2017)', years: '2012-2017', specs: { 'Oil Type (4-cyl)': '0W-20 Synthetic', 'Capacity (4-cyl)': '4.6 quarts with filter', 'Oil Type (V6)': '0W-20 Synthetic', 'Capacity (V6)': '6.4 quarts with filter', 'Filter': 'Toyota 04152-YZZA1' }, notes: ['2.5L engine introduced in this generation'] },
            { name: 'XV40 (2007-2011)', years: '2007-2011', specs: { 'Oil Type (4-cyl)': '5W-20 or 5W-30', 'Capacity (4-cyl)': '4.5 quarts with filter', 'Oil Type (V6)': '5W-30', 'Capacity (V6)': '6.4 quarts with filter', 'Filter': 'Toyota 90915-YZZD1' } },
            { name: 'XV30 (2002-2006)', years: '2002-2006', specs: { 'Oil Type (4-cyl)': '5W-30', 'Capacity (4-cyl)': '4.0 quarts with filter', 'Oil Type (V6)': '5W-30', 'Capacity (V6)': '5.0 quarts with filter', 'Filter': 'Toyota 90915-YZZD1' } },
        ],
        faq: [
            { q: 'Can I use 5W-30 in my 2020 Toyota Camry?', a: 'No. The 2018+ Camry requires 0W-20 full synthetic oil. Using 5W-30 can reduce fuel economy and may void your warranty. Stick with 0W-20.' },
            { q: 'How often should I change the oil in my Camry?', a: 'Toyota recommends every 10,000 miles or 12 months with synthetic oil. If you drive in severe conditions (frequent short trips, dusty roads, towing), change every 5,000 miles.' },
            { q: 'What brand of oil is best for a Toyota Camry?', a: 'Toyota Genuine Motor Oil, Mobil 1, Castrol Edge, and Pennzoil Platinum are all excellent choices. The key is using the correct weight (0W-20 for 2010+) and full synthetic.' },
        ],
    },
    {
        slug: 'honda-civic-oil-type',
        make: 'Honda', model: 'Civic', toolType: 'oil-type',
        title: 'Honda Civic Oil Type & Capacity | All Years Guide',
        description: 'Find the correct oil type, weight, and capacity for your Honda Civic. Covers all years 1973-2024 with filter part numbers.',
        keywords: ['honda civic oil type', 'civic oil capacity', 'honda civic oil weight', 'civic oil filter'],
        quickAnswer: 'Most 2016-2024 Honda Civics use 0W-20 full synthetic oil with a capacity of 3.7 quarts (1.5T) or 4.6 quarts (2.0L).',
        generations: [
            { name: '11th Gen (2022-2024)', years: '2022-2024', specs: { 'Oil Type': '0W-20 Full Synthetic', 'Capacity (1.5T)': '3.7 quarts with filter', 'Capacity (2.0L)': '4.6 quarts with filter', 'Filter': 'Honda 15400-PLM-A02' }, notes: ['1.5L turbo is the most common engine'] },
            { name: '10th Gen (2016-2021)', years: '2016-2021', specs: { 'Oil Type': '0W-20 Full Synthetic', 'Capacity (1.5T)': '3.7 quarts with filter', 'Capacity (2.0L)': '3.9 quarts with filter', 'Filter': 'Honda 15400-PLM-A02' }, notes: ['Turbo models may consume oil — check level regularly'] },
            { name: '9th Gen (2012-2015)', years: '2012-2015', specs: { 'Oil Type': '0W-20 Synthetic', 'Capacity': '3.9 quarts with filter', 'Filter': 'Honda 15400-PLM-A02' } },
            { name: '8th Gen (2006-2011)', years: '2006-2011', specs: { 'Oil Type': '5W-20', 'Capacity (1.8L)': '3.9 quarts with filter', 'Capacity (2.0L Si)': '4.4 quarts with filter', 'Filter': 'Honda 15400-PLM-A02' } },
        ],
        faq: [
            { q: 'Does the Honda Civic 1.5 turbo have oil dilution problems?', a: 'Some 2016-2020 1.5T Civics experienced fuel-oil dilution in cold climates. Honda issued a software update. Check your oil level regularly and change oil every 5,000-7,500 miles if you notice the level rising.' },
            { q: 'How often should I change oil in my Honda Civic?', a: 'Follow the Maintenance Minder system on your dashboard. Typically every 7,500-10,000 miles with synthetic oil. In severe conditions, every 5,000 miles.' },
        ],
    },
    {
        slug: 'toyota-corolla-oil-type',
        make: 'Toyota', model: 'Corolla', toolType: 'oil-type',
        title: 'Toyota Corolla Oil Type & Capacity | All Years Guide',
        description: 'Find the correct oil type and capacity for your Toyota Corolla. All years 1990-2024 covered with filter part numbers.',
        keywords: ['toyota corolla oil type', 'corolla oil capacity', 'toyota corolla oil weight'],
        quickAnswer: 'The 2020-2024 Toyota Corolla uses 0W-20 full synthetic oil with a capacity of 4.4 quarts (2.0L) or 3.9 quarts (1.8L hybrid).',
        generations: [
            { name: 'E210 (2020-2024)', years: '2020-2024', specs: { 'Oil Type': '0W-20 Full Synthetic', 'Capacity (2.0L)': '4.4 quarts with filter', 'Capacity (1.8L Hybrid)': '3.9 quarts with filter', 'Filter': 'Toyota 04152-YZZA1' } },
            { name: 'E170 (2014-2019)', years: '2014-2019', specs: { 'Oil Type': '0W-20 Synthetic', 'Capacity': '4.4 quarts with filter', 'Filter': 'Toyota 04152-YZZA1' } },
            { name: 'E140 (2009-2013)', years: '2009-2013', specs: { 'Oil Type': '0W-20 or 5W-20', 'Capacity': '4.4 quarts with filter', 'Filter': 'Toyota 90915-YZZD1' } },
            { name: 'E120 (2003-2008)', years: '2003-2008', specs: { 'Oil Type': '5W-30', 'Capacity': '3.9 quarts with filter', 'Filter': 'Toyota 90915-YZZD1' } },
        ],
        faq: [
            { q: 'Can I use conventional oil in my Toyota Corolla?', a: 'For 2010+ Corollas, Toyota specifies 0W-20 which is only available as synthetic. Older models can use conventional 5W-30 but synthetic provides better protection.' },
            { q: 'How many miles between oil changes for a Corolla?', a: 'With 0W-20 synthetic, Toyota recommends every 10,000 miles or 12 months. Check the maintenance indicator on your dashboard.' },
        ],
    },
    {
        slug: 'honda-accord-oil-type',
        make: 'Honda', model: 'Accord', toolType: 'oil-type',
        title: 'Honda Accord Oil Type & Capacity | All Years Guide',
        description: 'Find the correct oil type and capacity for your Honda Accord. All years covered with filter recommendations.',
        keywords: ['honda accord oil type', 'accord oil capacity', 'honda accord oil weight'],
        quickAnswer: 'The 2018-2024 Honda Accord uses 0W-20 full synthetic oil. The 1.5T holds 3.7 quarts and the 2.0T holds 4.0 quarts with filter.',
        generations: [
            { name: '10th Gen (2018-2024)', years: '2018-2024', specs: { 'Oil Type': '0W-20 Full Synthetic', 'Capacity (1.5T)': '3.7 quarts with filter', 'Capacity (2.0T)': '4.0 quarts with filter', 'Filter': 'Honda 15400-PLM-A02' } },
            { name: '9th Gen (2013-2017)', years: '2013-2017', specs: { 'Oil Type (4-cyl)': '0W-20 Synthetic', 'Capacity (4-cyl)': '4.4 quarts with filter', 'Oil Type (V6)': '0W-20 Synthetic', 'Capacity (V6)': '4.5 quarts with filter' } },
            { name: '8th Gen (2008-2012)', years: '2008-2012', specs: { 'Oil Type (4-cyl)': '5W-20', 'Capacity (4-cyl)': '4.4 quarts with filter', 'Oil Type (V6)': '5W-20', 'Capacity (V6)': '4.5 quarts with filter' } },
        ],
        faq: [
            { q: 'Does the 2020 Accord 1.5T have oil dilution issues?', a: 'Some early 1.5T engines had oil dilution in cold climates. Honda released a software update. Monitor your oil level between changes and change oil every 5,000-7,500 miles if you notice the level rising.' },
        ],
    },
    {
        slug: 'chevrolet-silverado-oil-type',
        make: 'Chevrolet', model: 'Silverado', toolType: 'oil-type',
        title: 'Chevrolet Silverado Oil Type & Capacity | All Years Guide',
        description: 'Find the correct oil type and capacity for your Chevy Silverado 1500. Covers 5.3L V8, 6.2L V8, 2.7T, and 3.0 Duramax.',
        keywords: ['chevy silverado oil type', 'silverado oil capacity', 'silverado 5.3 oil type', 'silverado oil change'],
        quickAnswer: 'The 2019-2024 Silverado 5.3L V8 uses 0W-20 full synthetic (8.0 quarts). The 6.2L V8 uses 0W-20 (8.0 quarts). The 3.0L Duramax diesel uses 0W-20 Dexos D (7.0 quarts).',
        generations: [
            { name: 'T1XX (2019-2024)', years: '2019-2024', specs: { 'Oil Type (2.7L Turbo)': '0W-20 Full Synthetic', 'Capacity (2.7L)': '6.0 quarts with filter', 'Oil Type (5.3L V8)': '0W-20 Dexos 1 Gen 3', 'Capacity (5.3L)': '8.0 quarts with filter', 'Oil Type (6.2L V8)': '0W-20 Dexos 1 Gen 3', 'Capacity (6.2L)': '8.0 quarts with filter', 'Oil Type (3.0L Diesel)': '0W-20 Dexos D', 'Capacity (3.0L Diesel)': '7.0 quarts with filter' }, notes: ['All engines now use 0W-20', 'Must use Dexos-approved oil'] },
            { name: 'K2XX (2014-2018)', years: '2014-2018', specs: { 'Oil Type (5.3L V8)': '5W-30 or 0W-20', 'Capacity (5.3L)': '8.0 quarts with filter', 'Oil Type (6.2L V8)': '5W-30', 'Capacity (6.2L)': '8.0 quarts with filter' }, notes: ['2015.5+ switched to 0W-20 for 5.3L'] },
        ],
        faq: [
            { q: 'Can I use 5W-30 in my 2020 Silverado 5.3?', a: 'GM switched to 0W-20 for the 5.3L starting in 2014-2015. Using 5W-30 won\'t cause immediate harm but may void your warranty and slightly reduce fuel economy. Stick with 0W-20 Dexos-approved oil.' },
            { q: 'Why does the Silverado use 8 quarts of oil?', a: 'GM\'s V8 engines have large oil capacities for thermal management and extended drain intervals. The AFM/DFM cylinder deactivation system also benefits from more oil volume.' },
        ],
    },
    {
        slug: 'toyota-rav4-oil-type',
        make: 'Toyota', model: 'RAV4', toolType: 'oil-type',
        title: 'Toyota RAV4 Oil Type & Capacity | All Years Guide',
        description: 'Find the correct oil type and capacity for your Toyota RAV4. Covers all years including RAV4 Hybrid and Prime.',
        keywords: ['toyota rav4 oil type', 'rav4 oil capacity', 'rav4 oil weight', 'rav4 hybrid oil type'],
        quickAnswer: 'The 2019-2024 Toyota RAV4 uses 0W-20 full synthetic oil with a capacity of 4.8 quarts (2.5L) or 4.8 quarts (Hybrid).',
        generations: [
            { name: 'XA50 (2019-2024)', years: '2019-2024', specs: { 'Oil Type': '0W-20 Full Synthetic', 'Capacity (2.5L)': '4.8 quarts with filter', 'Capacity (Hybrid)': '4.8 quarts with filter', 'Filter': 'Toyota 04152-YZZA1' } },
            { name: 'XA40 (2013-2018)', years: '2013-2018', specs: { 'Oil Type': '0W-20 Synthetic', 'Capacity': '4.6 quarts with filter', 'Filter': 'Toyota 04152-YZZA1' } },
            { name: 'XA30 (2006-2012)', years: '2006-2012', specs: { 'Oil Type (4-cyl)': '0W-20 or 5W-20', 'Capacity (4-cyl)': '4.5 quarts with filter', 'Oil Type (V6)': '5W-30', 'Capacity (V6)': '6.4 quarts with filter' } },
        ],
        faq: [
            { q: 'Does the RAV4 Hybrid use different oil?', a: 'Same type (0W-20 full synthetic) and same capacity — both the hybrid and non-hybrid hold 4.8 quarts with filter. They use the same A25A-FXS engine family. Same filter too.' },
        ],
    },
    {
        slug: 'nissan-altima-oil-type',
        make: 'Nissan', model: 'Altima', toolType: 'oil-type',
        title: 'Nissan Altima Oil Type & Capacity | All Years Guide',
        description: 'Find the correct oil type and capacity for your Nissan Altima. All years 1993-2024 with filter part numbers.',
        keywords: ['nissan altima oil type', 'altima oil capacity', 'nissan altima oil weight'],
        quickAnswer: 'The 2019-2024 Nissan Altima 2.5L uses 0W-20 full synthetic oil with a capacity of 5.4 quarts with filter.',
        generations: [
            { name: 'L34 (2019-2024)', years: '2019-2024', specs: { 'Oil Type (2.5L)': '0W-20 Full Synthetic', 'Capacity (2.5L)': '5.4 quarts with filter', 'Oil Type (2.0T VC)': '0W-20 Full Synthetic', 'Capacity (2.0T)': '5.0 quarts with filter', 'Filter': 'Nissan 15208-9HP0A' } },
            { name: 'L33 (2013-2018)', years: '2013-2018', specs: { 'Oil Type (2.5L)': '0W-20 Synthetic', 'Capacity (2.5L)': '4.9 quarts with filter', 'Oil Type (3.5L V6)': '5W-30', 'Capacity (3.5L)': '4.9 quarts with filter' } },
            { name: 'L32 (2007-2012)', years: '2007-2012', specs: { 'Oil Type (2.5L)': '5W-30', 'Capacity (2.5L)': '4.9 quarts with filter', 'Oil Type (3.5L V6)': '5W-30', 'Capacity (3.5L)': '4.9 quarts with filter' } },
        ],
        faq: [
            { q: 'What happens if I use 5W-30 instead of 0W-20 in my 2020 Altima?', a: 'Using 5W-30 in a newer Altima won\'t cause immediate damage but may reduce fuel economy and cold-start protection. The engine was designed for 0W-20 viscosity. Use the correct weight.' },
        ],
    },
    {
        slug: 'hyundai-elantra-oil-type',
        make: 'Hyundai', model: 'Elantra', toolType: 'oil-type',
        title: 'Hyundai Elantra Oil Type & Capacity | All Years Guide',
        description: 'Find the correct oil type and capacity for your Hyundai Elantra. All years with filter recommendations.',
        keywords: ['hyundai elantra oil type', 'elantra oil capacity', 'hyundai elantra oil weight'],
        quickAnswer: 'The 2021-2024 Hyundai Elantra uses 0W-20 full synthetic oil with a capacity of 4.2 quarts (2.0L) or 4.8 quarts (1.6T N Line).',
        generations: [
            { name: 'CN7 (2021-2024)', years: '2021-2024', specs: { 'Oil Type (2.0L)': '0W-20 Full Synthetic', 'Capacity (2.0L)': '4.2 quarts with filter', 'Oil Type (1.6T)': '0W-20 Full Synthetic', 'Capacity (1.6T)': '4.8 quarts with filter' } },
            { name: 'AD (2017-2020)', years: '2017-2020', specs: { 'Oil Type': '0W-20 Synthetic', 'Capacity (2.0L)': '4.2 quarts with filter', 'Filter': 'Hyundai 26300-35505' } },
            { name: 'MD/UD (2011-2016)', years: '2011-2016', specs: { 'Oil Type': '5W-20 or 5W-30', 'Capacity': '4.2 quarts with filter' } },
        ],
        faq: [
            { q: 'Is there an oil consumption recall on the Elantra?', a: 'Some 2011-2016 Elantras with the Nu 1.8L or 2.0L engine had oil consumption concerns. Hyundai issued technical service bulletins and extended warranties on affected engines. Check with your dealer using your VIN. The Smartstream engines (2021+) do not have this issue. Note: the Theta II recall applies to Sonata and Santa Fe, not the Elantra.' },
        ],
    },
    {
        slug: 'subaru-outback-oil-type',
        make: 'Subaru', model: 'Outback', toolType: 'oil-type',
        title: 'Subaru Outback Oil Type & Capacity | All Years Guide',
        description: 'Find the correct oil type and capacity for your Subaru Outback. All years including turbo and 6-cylinder models.',
        keywords: ['subaru outback oil type', 'outback oil capacity', 'subaru outback oil weight'],
        quickAnswer: 'The 2020-2024 Subaru Outback 2.5L uses 0W-20 full synthetic oil with a capacity of 5.1 quarts. The 2.4L turbo uses 0W-20 (5.0 quarts).',
        generations: [
            { name: '6th Gen (2020-2024)', years: '2020-2024', specs: { 'Oil Type (2.5L)': '0W-20 Full Synthetic', 'Capacity (2.5L)': '5.1 quarts with filter', 'Oil Type (2.4T)': '0W-20 Full Synthetic', 'Capacity (2.4T)': '5.0 quarts with filter' } },
            { name: '5th Gen (2015-2019)', years: '2015-2019', specs: { 'Oil Type (2.5L)': '0W-20 Synthetic', 'Capacity (2.5L)': '5.1 quarts with filter', 'Oil Type (3.6R)': '5W-30', 'Capacity (3.6R)': '6.9 quarts with filter' } },
            { name: '4th Gen (2010-2014)', years: '2010-2014', specs: { 'Oil Type (2.5L)': '0W-20 or 5W-30', 'Capacity (2.5L)': '5.1 quarts', 'Oil Type (3.6R)': '5W-30', 'Capacity (3.6R)': '6.9 quarts' } },
        ],
        faq: [
            { q: 'Do Subaru Outbacks burn oil?', a: 'Some 2011-2014 2.5L Subaru engines had oil consumption issues. Subaru extended warranties for affected vehicles. The 2015+ FB25 engine and 2020+ engines have largely resolved this.' },
        ],
    },
    {
        slug: 'jeep-grand-cherokee-oil-type',
        make: 'Jeep', model: 'Grand Cherokee', toolType: 'oil-type',
        title: 'Jeep Grand Cherokee Oil Type & Capacity | All Years Guide',
        description: 'Find the correct oil type and capacity for your Jeep Grand Cherokee. Covers 3.6L V6, 5.7L HEMI, 6.4L, and EcoDiesel.',
        keywords: ['jeep grand cherokee oil type', 'grand cherokee oil capacity', 'grand cherokee 3.6 oil type'],
        quickAnswer: 'The 2022-2024 Jeep Grand Cherokee 3.6L V6 uses 0W-20 full synthetic (5.9 quarts). The 5.7L HEMI uses 5W-20 (7.0 quarts).',
        generations: [
            { name: 'WL (2022-2024)', years: '2022-2024', specs: { 'Oil Type (3.6L V6)': '0W-20 Full Synthetic', 'Capacity (3.6L)': '5.9 quarts with filter', 'Oil Type (5.7L HEMI)': '5W-20 Full Synthetic', 'Capacity (5.7L)': '7.0 quarts with filter' } },
            { name: 'WK2 (2011-2021)', years: '2011-2021', specs: { 'Oil Type (3.6L V6)': '5W-20', 'Capacity (3.6L)': '5.9 quarts with filter', 'Oil Type (5.7L HEMI)': '5W-20', 'Capacity (5.7L)': '7.0 quarts with filter', 'Oil Type (3.0L Diesel)': '5W-40 Diesel-rated', 'Capacity (3.0L Diesel)': '10.5 quarts with filter' } },
        ],
        faq: [
            { q: 'Can I use 5W-30 in my Grand Cherokee 3.6?', a: 'The 3.6L Pentastar is specified for 5W-20 (2011-2021) or 0W-20 (2022+). Using 5W-30 increases viscosity beyond the design spec and may affect fuel economy and cold-start performance.' },
        ],
    },
    {
        slug: 'ford-escape-oil-type',
        make: 'Ford', model: 'Escape', toolType: 'oil-type',
        title: 'Ford Escape Oil Type & Capacity | All Years Guide',
        description: 'Find the correct oil type and capacity for your Ford Escape. All years including EcoBoost and Hybrid.',
        keywords: ['ford escape oil type', 'escape oil capacity', 'ford escape oil weight'],
        quickAnswer: 'The 2020-2024 Ford Escape 1.5L EcoBoost uses 5W-20 full synthetic (4.3 quarts). The 2.0L EcoBoost uses 5W-30 (5.7 quarts).',
        generations: [
            { name: '4th Gen (2020-2024)', years: '2020-2024', specs: { 'Oil Type (1.5L EB)': '5W-20 Full Synthetic', 'Capacity (1.5L)': '4.3 quarts with filter', 'Oil Type (2.0L EB)': '5W-30 Full Synthetic', 'Capacity (2.0L)': '5.7 quarts with filter', 'Oil Type (2.5L Hybrid)': '0W-20 Full Synthetic', 'Capacity (Hybrid)': '4.3 quarts with filter' } },
            { name: '3rd Gen (2013-2019)', years: '2013-2019', specs: { 'Oil Type (1.5L EB)': '5W-20', 'Capacity (1.5L)': '4.3 quarts', 'Oil Type (2.0L EB)': '5W-30', 'Capacity (2.0L)': '5.7 quarts' } },
        ],
        faq: [
            { q: 'Does the Ford Escape EcoBoost need synthetic oil?', a: 'Ford recommends full synthetic for all EcoBoost engines. The turbo generates high heat that benefits from synthetic oil\'s superior thermal stability.' },
        ],
    },
    {
        slug: 'nissan-rogue-oil-type',
        make: 'Nissan', model: 'Rogue', toolType: 'oil-type',
        title: 'Nissan Rogue Oil Type & Capacity | All Years Guide',
        description: 'Find the correct oil type and capacity for your Nissan Rogue. All years 2008-2024.',
        keywords: ['nissan rogue oil type', 'rogue oil capacity', 'nissan rogue oil weight'],
        quickAnswer: 'The 2021-2024 Nissan Rogue uses 0W-20 full synthetic oil with a capacity of 4.4 quarts with filter.',
        generations: [
            { name: 'T33 (2021-2024)', years: '2021-2024', specs: { 'Oil Type': '0W-20 Full Synthetic', 'Capacity': '4.4 quarts with filter', 'Filter': 'Nissan 15208-9HP0A' } },
            { name: 'T32 (2014-2020)', years: '2014-2020', specs: { 'Oil Type': '0W-20 Synthetic', 'Capacity': '5.1 quarts with filter' } },
            { name: 'S35 (2008-2013)', years: '2008-2013', specs: { 'Oil Type': '5W-30', 'Capacity': '4.9 quarts with filter' } },
        ],
        faq: [
            { q: 'How often does the Nissan Rogue need an oil change?', a: 'Nissan recommends every 5,000 miles or 6 months for the Rogue. Some models have a maintenance indicator light that calculates intervals based on driving conditions.' },
        ],
    },
    {
        slug: 'kia-sportage-oil-type',
        make: 'Kia', model: 'Sportage', toolType: 'oil-type',
        title: 'Kia Sportage Oil Type & Capacity | All Years Guide',
        description: 'Find the correct oil type and capacity for your Kia Sportage. All years covered.',
        keywords: ['kia sportage oil type', 'sportage oil capacity', 'kia sportage oil weight'],
        quickAnswer: 'The 2023-2024 Kia Sportage 2.5L uses 0W-20 full synthetic oil (5.1 quarts). The 1.6T uses 0W-20 (4.8 quarts).',
        generations: [
            { name: 'NQ5 (2023-2024)', years: '2023-2024', specs: { 'Oil Type (2.5L)': '0W-20 Full Synthetic', 'Capacity (2.5L)': '5.1 quarts with filter', 'Oil Type (1.6T)': '0W-20 Full Synthetic', 'Capacity (1.6T)': '4.8 quarts with filter' } },
            { name: 'QL (2017-2022)', years: '2017-2022', specs: { 'Oil Type (2.4L)': '0W-20 Synthetic', 'Capacity': '5.1 quarts with filter' } },
            { name: 'SL (2011-2016)', years: '2011-2016', specs: { 'Oil Type (2.4L)': '5W-20 or 5W-30', 'Capacity': '5.1 quarts with filter' } },
        ],
        faq: [
            { q: 'Is there a Kia engine recall for the Sportage?', a: 'Yes, certain 2011-2019 Kia engines with the Theta II 2.4L are covered by an extended warranty for engine seizure. Check with your dealer using your VIN.' },
        ],
    },
    {
        slug: 'ford-focus-oil-type',
        make: 'Ford', model: 'Focus', toolType: 'oil-type',
        title: 'Ford Focus Oil Type: 5W-20 Synthetic (2012-2024) | SpotOnAuto',
        description: 'Ford Focus recommended oil type chart by generation with capacity, interval, and OEM specification notes.',
        keywords: ['ford focus recommended oil type', 'ford focus oil type', 'focus oil capacity', 'ford focus oil chart'],
        quickAnswer: 'Most 2012-2018 Ford Focus trims use SAE 5W-20 synthetic blend or full synthetic. Capacity is typically 4.5 quarts with filter.',
        generations: [
            { name: '3rd Gen (2012-2018)', years: '2012-2018', specs: { 'Oil Type': 'SAE 5W-20 Synthetic (blend or full)', 'Capacity': '4.5 quarts with filter', 'Interval': '7,500 miles / 12 months', 'OEM Spec': 'Ford WSS-M2C945-A' } },
            { name: '4th Gen (2019-2024, global)', years: '2019-2024', specs: { 'Oil Type': 'SAE 0W-20 or 5W-20 (engine dependent)', 'Capacity': '4.2 to 5.4 quarts with filter', 'Interval': '7,500 miles / 12 months', 'OEM Spec': 'Ford WSS-M2C962-A1 / WSS-M2C945-B1' } },
        ],
        faq: [
            { q: 'Can I use 5W-30 in a Ford Focus?', a: 'Only if your exact engine manual allows it. Most U.S. Focus models in this range call for 5W-20, and using thicker oil can reduce fuel economy.' },
            { q: 'How much oil does a 2014 Ford Focus take?', a: 'Most 2.0L engines take about 4.5 quarts with filter. Always verify by dipstick after filling.' },
        ],
    },
    {
        slug: 'ford-edge-oil-type',
        make: 'Ford', model: 'Edge', toolType: 'oil-type',
        title: 'Ford Edge Oil Type Chart | 2011-2024 Specs | SpotOnAuto',
        description: 'Ford Edge oil type chart with engine-specific capacities, service intervals, and OEM oil specification notes.',
        keywords: ['ford edge oil type chart', 'ford edge oil type', 'ford edge oil capacity', 'ford edge 2.0 ecoboost oil'],
        quickAnswer: 'Most 2015-2024 Ford Edge trims use full synthetic SAE 5W-30 (2.0L EcoBoost) or SAE 5W-20 (3.5L V6). Capacity ranges from 5.4 to 6.0 quarts.',
        generations: [
            { name: '2nd Gen (2015-2024)', years: '2015-2024', specs: { '2.0L EcoBoost': '5W-30, 5.7 quarts', '2.7L EcoBoost': '5W-30, 6.0 quarts', '3.5L V6': '5W-20, 5.5 quarts', 'Interval': '7,500 miles / 12 months' } },
            { name: '1st Gen (2011-2014)', years: '2011-2014', specs: { '2.0L EcoBoost': '5W-30, 5.7 quarts', '3.5L V6': '5W-20, 5.5 quarts', '3.7L Sport': '5W-20, 5.5 quarts', 'Interval': '5,000 to 7,500 miles' } },
        ],
        faq: [
            { q: 'What oil does the Ford Edge 2.0 EcoBoost use?', a: 'The 2.0L EcoBoost commonly calls for full synthetic 5W-30. Confirm the oil cap and owner manual for your exact model year.' },
            { q: 'How often should I change oil in a Ford Edge?', a: 'Under normal driving, 7,500 miles is common. If you do short trips, towing, or heavy heat, a 5,000-mile interval is safer.' },
        ],
    },
];

// ═══════════════════════════════════════════════════════════════════
//  BATTERY LOCATION PAGES
// ═══════════════════════════════════════════════════════════════════

const batteryPages: ToolPage[] = [
    {
        slug: 'toyota-camry-battery-location',
        make: 'Toyota', model: 'Camry', toolType: 'battery-location',
        title: 'Toyota Camry Battery Location | Where Is It? All Years',
        description: 'Find exactly where the battery is in your Toyota Camry. Includes battery size, CCA rating, and replacement tips for all years.',
        keywords: ['toyota camry battery location', 'where is camry battery', 'camry battery size', 'camry battery replacement'],
        quickAnswer: 'The Toyota Camry battery is under the hood on the driver\'s side (left) for all years 1983-2024.',
        generations: [
            { name: 'XV70 (2018-2024)', years: '2018-2024', specs: { 'Location': 'Under hood, driver\'s side', 'Battery Size': 'Group 35 (24F compatible)', 'CCA': '500 CCA minimum', 'Type': 'Standard lead-acid or AGM', 'Difficulty': 'Easy — 15-20 min' }, notes: ['Hybrid models have a 12V auxiliary battery in the trunk'] },
            { name: 'XV50 (2012-2017)', years: '2012-2017', specs: { 'Location': 'Under hood, driver\'s side', 'Battery Size': 'Group 35', 'CCA': '500 CCA', 'Type': 'Standard lead-acid', 'Difficulty': 'Easy — 15 min' } },
            { name: 'XV40 (2007-2011)', years: '2007-2011', specs: { 'Location': 'Under hood, driver\'s side', 'Battery Size': 'Group 35', 'CCA': '500 CCA', 'Type': 'Standard lead-acid', 'Difficulty': 'Easy — 15 min' } },
        ],
        faq: [
            { q: 'Where is the battery in a Toyota Camry Hybrid?', a: 'The Camry Hybrid has TWO batteries: the high-voltage hybrid battery (under the rear seat) and a standard 12V battery. The 12V battery is in the trunk on the right side for 2018+ models, or under the hood for older models.' },
            { q: 'What size battery does a 2020 Toyota Camry take?', a: 'The 2020 Camry uses a Group 35 battery with at least 500 CCA. Popular options include the Interstate MT-35 and DieHard Gold 35.' },
        ],
    },
    {
        slug: 'honda-civic-battery-location',
        make: 'Honda', model: 'Civic', toolType: 'battery-location',
        title: 'Honda Civic Battery Location | Where Is It? All Years',
        description: 'Find exactly where the battery is in your Honda Civic. Includes size, CCA, and replacement guide for all years.',
        keywords: ['honda civic battery location', 'where is civic battery', 'civic battery size'],
        quickAnswer: 'The Honda Civic battery is under the hood on the passenger side (right) for most years. Some models have it on the driver\'s side.',
        generations: [
            { name: '11th Gen (2022-2024)', years: '2022-2024', specs: { 'Location': 'Under hood, passenger side', 'Battery Size': 'Group 51R', 'CCA': '410 CCA minimum', 'Type': 'Standard or AGM', 'Difficulty': 'Easy — 15 min' } },
            { name: '10th Gen (2016-2021)', years: '2016-2021', specs: { 'Location': 'Under hood, passenger side', 'Battery Size': 'Group 51R', 'CCA': '410 CCA', 'Type': 'Standard lead-acid', 'Difficulty': 'Easy — 15 min' } },
            { name: '9th Gen (2012-2015)', years: '2012-2015', specs: { 'Location': 'Under hood, passenger side', 'Battery Size': 'Group 51R', 'CCA': '410 CCA', 'Type': 'Standard lead-acid', 'Difficulty': 'Easy — 15 min' } },
            { name: '8th Gen (2006-2011)', years: '2006-2011', specs: { 'Location': 'Under hood, passenger side', 'Battery Size': 'Group 51R', 'CCA': '410 CCA', 'Difficulty': 'Easy — 15 min' }, notes: ['Battery has been on the passenger side since the 8th gen'] },
        ],
        faq: [
            { q: 'Why is the Civic battery so small?', a: 'Honda uses a Group 51R battery which is smaller than many competitors. This is fine for the Civic\'s electrical demands. If you want more starting power in cold climates, look for a 51R with higher CCA (500+).' },
        ],
    },
    {
        slug: 'toyota-corolla-battery-location',
        make: 'Toyota', model: 'Corolla', toolType: 'battery-location',
        title: 'Toyota Corolla Battery Location | Where Is It? All Years',
        description: 'Find exactly where the battery is in your Toyota Corolla. Includes battery size and replacement guide.',
        keywords: ['toyota corolla battery location', 'where is corolla battery', 'corolla battery size'],
        quickAnswer: 'The Toyota Corolla battery is under the hood on the driver\'s side (left) for all generations.',
        generations: [
            { name: 'E210 (2020-2024)', years: '2020-2024', specs: { 'Location': 'Under hood, driver\'s side', 'Battery Size': 'Group 35', 'CCA': '500 CCA', 'Type': 'Standard lead-acid', 'Difficulty': 'Easy — 15 min' }, notes: ['Corolla Hybrid has a 12V auxiliary battery under the rear seat'] },
            { name: 'E170 (2014-2019)', years: '2014-2019', specs: { 'Location': 'Under hood, driver\'s side', 'Battery Size': 'Group 35', 'CCA': '500 CCA', 'Difficulty': 'Easy — 15 min' } },
            { name: 'E140 (2009-2013)', years: '2009-2013', specs: { 'Location': 'Under hood, driver\'s side', 'Battery Size': 'Group 35', 'CCA': '500 CCA', 'Difficulty': 'Easy — 15 min' } },
        ],
        faq: [
            { q: 'What battery does a 2020 Corolla take?', a: 'A Group 35 battery with at least 500 CCA. Interstate MT-35 and Optima RedTop 35 are popular choices.' },
        ],
    },
    {
        slug: 'chevrolet-silverado-battery-location',
        make: 'Chevrolet', model: 'Silverado', toolType: 'battery-location',
        title: 'Chevy Silverado Battery Location | Where Is It? All Years',
        description: 'Find exactly where the battery is in your Chevy Silverado 1500. Includes dual battery info and replacement guide.',
        keywords: ['chevy silverado battery location', 'silverado battery size', 'silverado dual battery'],
        quickAnswer: 'The Chevy Silverado battery is under the hood on the passenger side. Diesel models and some heavy-duty packages have dual batteries.',
        generations: [
            { name: 'T1XX (2019-2024)', years: '2019-2024', specs: { 'Location': 'Under hood, passenger side', 'Battery Size': 'Group 48 (H6)', 'CCA': '730 CCA minimum', 'Type': 'AGM (stop-start equipped)', 'Difficulty': 'Easy — 20 min' }, notes: ['3.0L Duramax diesel has dual batteries'] },
            { name: 'K2XX (2014-2018)', years: '2014-2018', specs: { 'Location': 'Under hood, passenger side', 'Battery Size': 'Group 48 (H6)', 'CCA': '730 CCA', 'Type': 'Standard or AGM', 'Difficulty': 'Easy — 15 min' } },
        ],
        faq: [
            { q: 'Does the Silverado diesel have two batteries?', a: 'Yes, the 3.0L Duramax diesel Silverado has dual batteries. Both are located under the hood and both should be replaced at the same time for best performance.' },
        ],
    },
    {
        slug: 'nissan-altima-battery-location',
        make: 'Nissan', model: 'Altima', toolType: 'battery-location',
        title: 'Nissan Altima Battery Location | Where Is It? All Years',
        description: 'Find exactly where the battery is in your Nissan Altima. Includes size, CCA, and replacement guide.',
        keywords: ['nissan altima battery location', 'where is altima battery', 'altima battery size'],
        quickAnswer: 'The Nissan Altima battery is under the hood on the passenger side (right) for all recent generations.',
        generations: [
            { name: 'L34 (2019-2024)', years: '2019-2024', specs: { 'Location': 'Under hood, passenger side', 'Battery Size': 'Group 35', 'CCA': '500 CCA', 'Type': 'Standard lead-acid', 'Difficulty': 'Easy — 15 min' } },
            { name: 'L33 (2013-2018)', years: '2013-2018', specs: { 'Location': 'Under hood, passenger side', 'Battery Size': 'Group 35', 'CCA': '500 CCA', 'Difficulty': 'Easy — 15 min' } },
            { name: 'L32 (2007-2012)', years: '2007-2012', specs: { 'Location': 'Under hood, passenger side', 'Battery Size': 'Group 35', 'CCA': '500 CCA', 'Difficulty': 'Easy — 15 min' } },
        ],
        faq: [
            { q: 'What size battery does a 2020 Nissan Altima take?', a: 'The 2020 Altima uses a Group 35 battery. Interstate MT-35 and DieHard Gold 35 are solid choices with at least 500 CCA.' },
        ],
    },
    {
        slug: 'jeep-wrangler-battery-location',
        make: 'Jeep', model: 'Wrangler', toolType: 'battery-location',
        title: 'Jeep Wrangler Battery Location | Where Is It? All Years',
        description: 'Find exactly where the battery is in your Jeep Wrangler. Includes JK, JL, and older models.',
        keywords: ['jeep wrangler battery location', 'where is wrangler battery', 'wrangler battery size'],
        quickAnswer: 'The Jeep Wrangler JL (2018+) battery is under the passenger seat. The JK (2007-2017) battery is under the hood on the passenger side.',
        generations: [
            { name: 'JL (2018-2024)', years: '2018-2024', specs: { 'Location': 'Under passenger seat', 'Battery Size': 'Group 48 (H6)', 'CCA': '730 CCA', 'Type': 'AGM required', 'Difficulty': 'Moderate — 25 min' }, notes: ['Must remove passenger seat to access battery', 'Seat bolts are 18mm', 'AGM battery is mandatory'] },
            { name: 'JK (2007-2017)', years: '2007-2017', specs: { 'Location': 'Under hood, passenger side', 'Battery Size': 'Group 48 (H6)', 'CCA': '660 CCA', 'Type': 'Standard or AGM', 'Difficulty': 'Easy — 15 min' } },
            { name: 'TJ (1997-2006)', years: '1997-2006', specs: { 'Location': 'Under hood, passenger side', 'Battery Size': 'Group 65', 'CCA': '650 CCA', 'Difficulty': 'Easy — 15 min' } },
        ],
        faq: [
            { q: 'Why did Jeep put the battery under the seat?', a: 'Jeep moved the JL Wrangler battery under the passenger seat to improve the approach angle for off-roading and protect it from water during fording. It also frees up engine bay space.' },
        ],
    },
    {
        slug: 'honda-accord-battery-location',
        make: 'Honda', model: 'Accord', toolType: 'battery-location',
        title: 'Honda Accord Battery Location | Where Is It? All Years',
        description: 'Find exactly where the battery is in your Honda Accord. Includes size, type, and replacement guide.',
        keywords: ['honda accord battery location', 'where is accord battery', 'accord battery size'],
        quickAnswer: 'The Honda Accord battery is under the hood on the driver\'s side for most years. Some generations have it on the passenger side.',
        generations: [
            { name: '10th Gen (2018-2024)', years: '2018-2024', specs: { 'Location': 'Under hood, driver\'s side (front corner)', 'Battery Size': 'Group 51R', 'CCA': '410 CCA minimum', 'Difficulty': 'Easy — 15 min' } },
            { name: '9th Gen (2013-2017)', years: '2013-2017', specs: { 'Location': 'Under hood, front driver\'s side', 'Battery Size': 'Group 51R', 'CCA': '410 CCA', 'Difficulty': 'Easy — 15 min' } },
            { name: '8th Gen (2008-2012)', years: '2008-2012', specs: { 'Location': 'Under hood, driver\'s side', 'Battery Size': 'Group 24F', 'CCA': '550 CCA', 'Difficulty': 'Easy — 15 min' } },
        ],
        faq: [
            { q: 'Where is the Accord Hybrid 12V battery?', a: 'The Accord Hybrid has a 12V battery in the trunk on the right side. The high-voltage hybrid battery is under the rear seat. Always disconnect the 12V battery first for any electrical work.' },
        ],
    },
    {
        slug: 'volkswagen-jetta-battery-location',
        make: 'Volkswagen', model: 'Jetta', toolType: 'battery-location',
        title: 'VW Jetta Battery Location | Where Is It? All Years',
        description: 'Find exactly where the battery is in your Volkswagen Jetta. Includes all generations with size and replacement tips.',
        keywords: ['vw jetta battery location', 'where is jetta battery', 'volkswagen jetta battery size'],
        quickAnswer: 'The VW Jetta battery is under the hood on the driver\'s side for most years. Some European models have it in the trunk.',
        generations: [
            { name: 'Mk7/A7 (2019-2024)', years: '2019-2024', specs: { 'Location': 'Under hood, driver\'s side', 'Battery Size': 'Group H5 (DIN L2)', 'CCA': '590 CCA', 'Type': 'AGM if equipped with start-stop', 'Difficulty': 'Easy — 20 min' } },
            { name: 'Mk6/A6 (2011-2018)', years: '2011-2018', specs: { 'Location': 'Under hood, driver\'s side', 'Battery Size': 'Group H5', 'CCA': '590 CCA', 'Difficulty': 'Easy — 15 min' } },
            { name: 'Mk5/A5 (2006-2010)', years: '2006-2010', specs: { 'Location': 'Under hood, driver\'s side', 'Battery Size': 'Group H5', 'CCA': '590 CCA', 'Difficulty': 'Easy — 15 min' }, notes: ['Battery may be under a plastic cover — remove 2 clips to access'] },
        ],
        faq: [
            { q: 'Does the VW Jetta need the battery registered?', a: 'The 2019+ Jetta with start-stop may need battery registration (coding) after replacement so the charging system recognizes the new battery. This can be done with a VW-compatible scan tool like VCDS or OBDeleven.' },
        ],
    },
    {
        slug: 'toyota-rav4-battery-location',
        make: 'Toyota', model: 'RAV4', toolType: 'battery-location',
        title: 'Toyota RAV4 Battery Location | Where Is It? All Years',
        description: 'Find exactly where the battery is in your Toyota RAV4. Includes standard and Hybrid models.',
        keywords: ['toyota rav4 battery location', 'where is rav4 battery', 'rav4 battery size'],
        quickAnswer: 'The Toyota RAV4 battery is under the hood on the driver\'s side for all standard models. The RAV4 Hybrid 12V battery is also under the hood.',
        generations: [
            { name: 'XA50 (2019-2024)', years: '2019-2024', specs: { 'Location': 'Under hood, driver\'s side', 'Battery Size': 'Group 35', 'CCA': '500 CCA', 'Type': 'Standard lead-acid', 'Difficulty': 'Easy — 15 min' }, notes: ['RAV4 Hybrid/Prime 12V battery is also under the hood'] },
            { name: 'XA40 (2013-2018)', years: '2013-2018', specs: { 'Location': 'Under hood, driver\'s side', 'Battery Size': 'Group 35', 'CCA': '500 CCA', 'Difficulty': 'Easy — 15 min' } },
        ],
        faq: [
            { q: 'Where is the RAV4 Hybrid battery?', a: 'The RAV4 Hybrid has two batteries: a 12V starter battery under the hood (driver\'s side) and the high-voltage hybrid battery under the rear seat. For a dead car, jump the 12V battery under the hood.' },
        ],
    },
    {
        slug: 'ford-explorer-battery-location',
        make: 'Ford', model: 'Explorer', toolType: 'battery-location',
        title: 'Ford Explorer Battery Location | Where Is It? All Years',
        description: 'Find exactly where the battery is in your Ford Explorer. Includes 5th and 6th gen placement changes.',
        keywords: ['ford explorer battery location', 'where is explorer battery', 'explorer battery size'],
        quickAnswer: 'The 2020+ Ford Explorer battery is behind the passenger side of the dashboard (or in the cargo area). The 2011-2019 Explorer battery is under the hood.',
        generations: [
            { name: '6th Gen (2020-2024)', years: '2020-2024', specs: { 'Location': 'Behind passenger-side cowl panel or cargo area', 'Battery Size': 'Group H7 (94R)', 'CCA': '800 CCA', 'Type': 'AGM', 'Difficulty': 'Moderate — 30-45 min' }, notes: ['Difficult access — behind cowl panel near firewall', 'Some trims have battery in cargo area', 'AGM battery mandatory'] },
            { name: '5th Gen (2011-2019)', years: '2011-2019', specs: { 'Location': 'Under hood, passenger side', 'Battery Size': 'Group 65', 'CCA': '750 CCA', 'Difficulty': 'Easy — 15 min' } },
        ],
        faq: [
            { q: 'Why did Ford hide the Explorer battery?', a: 'Ford moved the 2020+ Explorer battery behind the cowl panel to save engine bay space for the new RWD platform. It\'s controversial among owners due to difficult access. Some models have it in the cargo area instead.' },
        ],
    },
    {
        slug: 'hyundai-sonata-battery-location',
        make: 'Hyundai', model: 'Sonata', toolType: 'battery-location',
        title: 'Hyundai Sonata Battery Location | Where Is It? All Years',
        description: 'Find exactly where the battery is in your Hyundai Sonata. All years including Hybrid.',
        keywords: ['hyundai sonata battery location', 'where is sonata battery', 'sonata battery size'],
        quickAnswer: 'The Hyundai Sonata battery is under the hood on the driver\'s side for all standard models.',
        generations: [
            { name: 'DN8 (2020-2024)', years: '2020-2024', specs: { 'Location': 'Under hood, driver\'s side', 'Battery Size': 'Group 47 (H5)', 'CCA': '590 CCA', 'Type': 'Standard lead-acid or AGM', 'Difficulty': 'Easy — 15 min' } },
            { name: 'LF (2015-2019)', years: '2015-2019', specs: { 'Location': 'Under hood, driver\'s side', 'Battery Size': 'Group 47 (H5)', 'CCA': '590 CCA', 'Difficulty': 'Easy — 15 min' } },
            { name: 'YF (2011-2014)', years: '2011-2014', specs: { 'Location': 'Under hood, driver\'s side', 'Battery Size': 'Group 124R', 'CCA': '600 CCA', 'Difficulty': 'Easy — 15 min' } },
        ],
        faq: [
            { q: 'Where is the Sonata Hybrid 12V battery?', a: 'The Sonata Hybrid 12V auxiliary battery is in the trunk, typically on the right side. The high-voltage battery is under the rear seat.' },
        ],
    },
    {
        slug: 'subaru-forester-battery-location',
        make: 'Subaru', model: 'Forester', toolType: 'battery-location',
        title: 'Subaru Forester Battery Location | Where Is It? All Years',
        description: 'Find exactly where the battery is in your Subaru Forester. Includes size and replacement guide.',
        keywords: ['subaru forester battery location', 'where is forester battery', 'forester battery size'],
        quickAnswer: 'The Subaru Forester battery is under the hood on the passenger side (right) for all years.',
        generations: [
            { name: 'SK (2019-2024)', years: '2019-2024', specs: { 'Location': 'Under hood, passenger side', 'Battery Size': 'Group 25', 'CCA': '550 CCA', 'Type': 'Standard lead-acid', 'Difficulty': 'Easy — 15 min' } },
            { name: 'SJ (2014-2018)', years: '2014-2018', specs: { 'Location': 'Under hood, passenger side', 'Battery Size': 'Group 25', 'CCA': '550 CCA', 'Difficulty': 'Easy — 15 min' } },
        ],
        faq: [
            { q: 'What size battery does a Subaru Forester take?', a: 'Most Foresters use a Group 25 battery. The Optima RedTop 25 and Interstate MT-25 are popular upgrades over OEM.' },
        ],
    },
];

// ═══════════════════════════════════════════════════════════════════
//  TIRE SIZE PAGES
// ═══════════════════════════════════════════════════════════════════

const tirePages: ToolPage[] = [
    {
        slug: 'toyota-camry-tire-size',
        make: 'Toyota', model: 'Camry', toolType: 'tire-size',
        title: 'Toyota Camry Tire Size | All Years & Trims Guide',
        description: 'Find the correct tire size for your Toyota Camry. Covers all years and trims with pressure specs and recommended tires.',
        keywords: ['toyota camry tire size', 'camry tire pressure', 'camry wheel size', 'what tires fit camry'],
        quickAnswer: 'The most common 2018-2024 Toyota Camry tire sizes are 215/55R17 (LE/SE) and 235/45R18 (XSE/TRD).',
        generations: [
            { name: 'XV70 (2018-2024)', years: '2018-2024', specs: { 'LE/SE': '215/55R17', 'XLE': '215/55R17 or 235/45R18', 'XSE': '235/45R18', 'TRD': '235/40R19', 'Tire Pressure': '35 PSI all around', 'Bolt Pattern': '5x114.3' } },
            { name: 'XV50 (2012-2017)', years: '2012-2017', specs: { 'L/LE': '205/65R16', 'SE/XSE': '215/55R17', 'XLE': '215/55R17', 'Tire Pressure': '35 PSI', 'Bolt Pattern': '5x114.3' } },
            { name: 'XV40 (2007-2011)', years: '2007-2011', specs: { 'Base/LE': '215/60R16', 'SE/XLE': '215/55R17', 'Tire Pressure': '32 PSI', 'Bolt Pattern': '5x114.3' } },
        ],
        faq: [
            { q: 'Can I put 18-inch wheels on a Camry LE?', a: 'Yes, you can upgrade from 17" to 18" wheels. Use 235/45R18 tires (same as the XSE trim). The bolt pattern is the same 5x114.3. Just make sure to recalibrate your TPMS sensors.' },
            { q: 'What tire pressure should a Camry have?', a: 'The recommended tire pressure for most 2018+ Camrys is 35 PSI for all four tires. Check the sticker on the driver\'s door jamb for your specific model.' },
        ],
    },
    {
        slug: 'honda-civic-tire-size',
        make: 'Honda', model: 'Civic', toolType: 'tire-size',
        title: 'Honda Civic Tire Size | All Years & Trims Guide',
        description: 'Find the correct tire size for your Honda Civic. All years and trims including Si and Type R.',
        keywords: ['honda civic tire size', 'civic tire pressure', 'civic wheel size'],
        quickAnswer: 'The most common 2022-2024 Honda Civic tire sizes are 215/55R16 (LX), 215/50R17 (Sport/EX), and 235/40R18 (Si). Type R uses 265/30R19.',
        generations: [
            { name: '11th Gen (2022-2024)', years: '2022-2024', specs: { 'LX': '215/55R16', 'Sport/EX': '215/50R17', 'Si': '235/40R18', 'Type R': '265/30R19', 'Tire Pressure': '33 PSI (36 PSI Si/Type R)', 'Bolt Pattern': '5x114.3' } },
            { name: '10th Gen (2016-2021)', years: '2016-2021', specs: { 'LX': '215/55R16', 'EX/Sport': '215/50R17', 'Si': '235/40R18', 'Type R': '245/30R20', 'Tire Pressure': '32-36 PSI' } },
            { name: '9th Gen (2012-2015)', years: '2012-2015', specs: { 'LX/EX': '205/55R16', 'Si': '215/45R17', 'Tire Pressure': '32 PSI' } },
        ],
        faq: [
            { q: 'Can I put Type R wheels on a regular Civic?', a: 'Yes, the bolt pattern (5x114.3) is the same. You\'ll need 265/30R19 tires. Be aware that the wider wheels may affect steering feel and fuel economy.' },
        ],
    },
    {
        slug: 'toyota-rav4-tire-size',
        make: 'Toyota', model: 'RAV4', toolType: 'tire-size',
        title: 'Toyota RAV4 Tire Size | All Years & Trims Guide',
        description: 'Find the correct tire size for your Toyota RAV4. Covers all years including TRD Off-Road.',
        keywords: ['toyota rav4 tire size', 'rav4 tire pressure', 'rav4 wheel size'],
        quickAnswer: 'The 2019-2024 Toyota RAV4 uses 225/65R17 (LE/XLE) or 225/60R18 (XSE/Adventure). The TRD Off-Road uses 225/60R18.',
        generations: [
            { name: 'XA50 (2019-2024)', years: '2019-2024', specs: { 'LE/XLE': '225/65R17', 'XSE/Adventure/TRD': '225/60R18', 'Tire Pressure': '35 PSI all around', 'Bolt Pattern': '5x114.3' } },
            { name: 'XA40 (2013-2018)', years: '2013-2018', specs: { 'LE': '225/65R17', 'XLE/Limited': '225/65R17', 'SE': '235/55R18', 'Tire Pressure': '35 PSI' } },
        ],
        faq: [
            { q: 'Can I put all-terrain tires on my RAV4?', a: 'Yes, the RAV4 Adventure and TRD Off-Road are popular candidates. In 225/65R17, the Falken Wildpeak AT3W and Toyo Open Country AT3 are popular choices that maintain ride comfort.' },
        ],
    },
    {
        slug: 'jeep-wrangler-tire-size',
        make: 'Jeep', model: 'Wrangler', toolType: 'tire-size',
        title: 'Jeep Wrangler Tire Size | All Years & Trims Guide',
        description: 'Find the correct tire size for your Jeep Wrangler. Includes JL, JK, and Rubicon with maximum tire sizes per trim.',
        keywords: ['jeep wrangler tire size', 'wrangler tire pressure', 'wrangler max tire size', 'rubicon tire size'],
        quickAnswer: 'The 2018-2024 Jeep Wrangler JL uses 245/75R17 (Sport), 255/70R18 (Sahara), or 285/70R17 (Rubicon 33"). The 392 uses 285/70R17 BFG KO2.',
        generations: [
            { name: 'JL (2018-2024)', years: '2018-2024', specs: { 'Sport': '245/75R17 (32")', 'Sahara': '255/70R18 (32")', 'Rubicon': '285/70R17 (33")', 'Rubicon 392': '285/70R17 BFG KO2', 'Xtreme Recon': '315/70R17 (35")', 'Tire Pressure': '36-38 PSI road / 15-20 PSI off-road', 'Bolt Pattern': '5x127 (5x5")' } },
            { name: 'JK (2007-2017)', years: '2007-2017', specs: { 'Sport': '225/75R16 or 255/70R18', 'Sahara': '255/70R18', 'Rubicon': '255/75R17 (32")', 'Bolt Pattern': '5x127 (5x5")' } },
        ],
        faq: [
            { q: 'What\'s the biggest tire I can fit on a stock Wrangler?', a: 'Sport: 33" max without rubbing. Sahara: 33" with minor trimming. Rubicon: 35" with the factory lift (Xtreme Recon package comes with 35" from factory). For 37" tires, you need a 2.5-3.5" lift and fender trimming.' },
        ],
    },
    {
        slug: 'chevrolet-silverado-tire-size',
        make: 'Chevrolet', model: 'Silverado', toolType: 'tire-size',
        title: 'Chevy Silverado Tire Size Guide & Chart by Year | SpotOnAuto',
        description: 'Chevrolet Silverado tire size chart by year and trim with OEM wheel size, pressure, and plus-size notes.',
        keywords: ['chevy silverado tire size guide', 'chevy silverado tire size chart', 'silverado tire size', 'silverado wheel size'],
        quickAnswer: 'Common Silverado 1500 sizes are 255/70R17, 265/65R18, and 275/60R20 depending on trim and package.',
        generations: [
            { name: 'T1XX (2019-2024)', years: '2019-2024', specs: { 'Work Truck / Custom': '255/70R17', 'LT / RST': '265/65R18', 'LTZ / High Country': '275/60R20', 'Trail Boss': '275/65R18 or 275/60R20', 'Pressure': '35 PSI (door sticker rules)' } },
            { name: 'K2XX (2014-2018)', years: '2014-2018', specs: { 'Base': '255/70R17', 'Mid trims': '265/65R18', 'Premium trims': '275/55R20', 'Pressure': '35 PSI' } },
            { name: 'GMT900 (2007-2013)', years: '2007-2013', specs: { 'Base': '245/70R17', 'Common upgrade': '265/65R18', '20-inch option': '275/55R20', 'Pressure': '32-35 PSI by trim' } },
        ],
        faq: [
            { q: 'Can I run 33-inch tires on a stock Silverado?', a: 'Many 4WD Silverado trims can fit 33-inch tires with correct wheel offset. Always check inner fender and liner clearance at full lock and compression.' },
            { q: 'Where do I verify exact factory tire size?', a: 'Use the driver door jamb placard first. That label is the authoritative factory tire size and pressure source for your truck.' },
        ],
    },
    {
        slug: 'toyota-sienna-tire-size',
        make: 'Toyota', model: 'Sienna', toolType: 'tire-size',
        title: 'Toyota Sienna Tire Size Chart by Year | SpotOnAuto',
        description: 'Toyota Sienna tire size guide by year and trim, including pressure targets and all-season replacement notes.',
        keywords: ['toyota sienna tire size', 'sienna tire size chart', 'toyota sienna wheel size', 'sienna tire pressure'],
        quickAnswer: 'Most 2021-2024 Toyota Sienna trims use 235/65R17 or 235/60R18, with 36 PSI recommended on most configurations.',
        generations: [
            { name: '4th Gen (2021-2024)', years: '2021-2024', specs: { 'LE / XLE': '235/65R17', 'XSE / Limited / Platinum': '235/60R18', 'Pressure': '36 PSI (verify door sticker)', 'Bolt Pattern': '5x120' } },
            { name: '3rd Gen (2011-2020)', years: '2011-2020', specs: { 'Base/LE': '235/60R17', 'SE/XLE/Limited': '235/55R18', 'Pressure': '35 PSI', 'Bolt Pattern': '5x114.3' } },
            { name: '2nd Gen (2004-2010)', years: '2004-2010', specs: { 'Base': '215/65R16', 'Higher trims': '225/60R17', 'Pressure': '35 PSI', 'Bolt Pattern': '5x114.3' } },
        ],
        faq: [
            { q: 'Can I switch from 17-inch to 18-inch wheels on a Sienna?', a: 'Yes, if you keep overall tire diameter close to stock and use the correct offset. A common move is from 235/65R17 to 235/60R18.' },
            { q: 'What tire pressure should a Toyota Sienna run?', a: 'Most late-model Siennas run around 35-36 PSI cold. Use your door-jamb placard as the final source.' },
        ],
    },
];

// ═══════════════════════════════════════════════════════════════════
//  HIGH-INTENT PAGES FROM LIVE GSC QUERY GAPS
// ═══════════════════════════════════════════════════════════════════

const highIntentPages: ToolPage[] = [
    {
        slug: 'jeep-compass-oil-capacity',
        make: 'Jeep',
        model: 'Compass',
        toolType: 'oil-type',
        title: 'Jeep Compass Oil Capacity & Type Chart | SpotOnAuto',
        description: 'Jeep Compass oil capacity and recommended oil type by year and engine, including interval and filter notes.',
        keywords: ['jeep compass oil capacity', 'jeep compass oil type', 'how much oil in jeep compass'],
        quickAnswer: 'Most 2017-2024 Jeep Compass 2.4L models take 5.5 quarts of 0W-20 full synthetic oil with filter.',
        generations: [
            { name: 'MP (2017-2024)', years: '2017-2024', specs: { 'Oil Type': '0W-20 Full Synthetic', 'Capacity': '5.5 quarts with filter', 'Interval': '6,000-7,500 miles', 'Filter': 'MO-349 / equivalent' } },
            { name: 'MK (2007-2016)', years: '2007-2016', specs: { '2.0L': '5W-20, 4.5 quarts', '2.4L': '5W-20, 4.5 quarts', 'Interval': '5,000-7,000 miles', 'Filter': 'MO-090 / equivalent' } },
        ],
        faq: [
            { q: 'How much oil goes in a Jeep Compass?', a: 'Most recent 2.4L Compass engines use about 5.5 quarts with filter, but always verify by dipstick after initial fill.' },
        ],
    },
    {
        slug: '2019-buick-encore-power-steering-fluid',
        make: 'Buick',
        model: 'Encore',
        toolType: 'fluid-capacity',
        title: '2019 Buick Encore Power Steering Fluid: What to Use | SpotOnAuto',
        description: '2019 Buick Encore steering fluid guidance, reservoir checks, and service notes for electric steering systems.',
        keywords: ['2019 buick encore power steering fluid', 'buick encore steering fluid', 'encore power steering'],
        quickAnswer: 'The 2019 Buick Encore uses electric power steering and has no traditional hydraulic power steering fluid reservoir to top off.',
        generations: [
            { name: 'Encore (2013-2022)', years: '2013-2022', specs: { 'Steering System': 'Electric Power Steering (EPS)', 'Hydraulic Fluid': 'Not used', 'Service Note': 'Diagnose EPS faults via scan data', 'If noise/stiffness': 'Check battery voltage and steering rack electronics' } },
        ],
        faq: [
            { q: 'Where is the power steering fluid reservoir on a 2019 Encore?', a: 'There is no conventional hydraulic reservoir on EPS-equipped Encore models.' },
        ],
    },
    {
        slug: 'subaru-crosstrek-oil-type-chart',
        make: 'Subaru',
        model: 'Crosstrek',
        toolType: 'oil-type',
        title: 'Subaru Crosstrek Oil Type Chart by Year | SpotOnAuto',
        description: 'Subaru Crosstrek oil type chart with capacity and interval details by generation and engine.',
        keywords: ['subaru crosstrek oil type chart', 'crosstrek oil type', 'subaru crosstrek oil capacity'],
        quickAnswer: 'Most 2018-2024 Subaru Crosstrek engines use 0W-20 full synthetic oil. Capacity is typically around 4.4 quarts with filter.',
        generations: [
            { name: '2nd Gen (2018-2024)', years: '2018-2024', specs: { '2.0L FB20': '0W-20, 4.4 quarts', '2.5L FB25': '0W-20, 4.4 quarts', 'Interval': '6,000 miles / 6 months', 'Filter': '15208AA12A / equivalent' } },
            { name: '1st Gen (2013-2017)', years: '2013-2017', specs: { '2.0L FB20': '0W-20, 5.1 quarts', 'Interval': '6,000 miles / 6 months', 'Filter': '15208AA160 / equivalent' } },
        ],
        faq: [
            { q: 'Can I use 5W-30 in a Subaru Crosstrek?', a: 'Subaru generally calls for 0W-20 for fuel economy and cold-start performance. Use other weights only if your manual explicitly permits it.' },
        ],
    },
    {
        slug: '2020-hyundai-venue-oil-capacity',
        make: 'Hyundai',
        model: 'Venue',
        toolType: 'oil-type',
        title: 'How Much Oil Goes Into a 2020 Hyundai Venue? | SpotOnAuto',
        description: 'Exact 2020 Hyundai Venue oil capacity, oil type, and service interval guidance.',
        keywords: ['how much oil goes into a 2020 hyundai venue', '2020 hyundai venue oil capacity', 'hyundai venue oil type'],
        quickAnswer: 'A 2020 Hyundai Venue 1.6L typically takes about 3.7 quarts of 5W-20 or 5W-30 (market dependent) with filter.',
        generations: [
            { name: 'QX (2020-2024)', years: '2020-2024', specs: { 'Engine': '1.6L Smartstream', 'Oil Capacity': '3.7 quarts with filter', 'Oil Type': '5W-20 or 5W-30 (region/spec dependent)', 'Interval': '5,000-7,500 miles' } },
        ],
        faq: [
            { q: 'What oil should I use in a 2020 Venue?', a: 'Use the viscosity listed in your owner manual and oil cap. Capacity is about 3.7 quarts with a filter change.' },
        ],
    },
    {
        slug: '2021-porsche-cayenne-battery-location',
        make: 'Porsche',
        model: 'Cayenne',
        toolType: 'battery-location',
        title: '2021 Porsche Cayenne Battery Location | SpotOnAuto',
        description: '2021 Porsche Cayenne battery location, battery type, and replacement registration notes.',
        keywords: ['2021 porsche cayenne battery location', 'porsche cayenne battery location', 'cayenne battery replacement'],
        quickAnswer: 'On most 2021 Porsche Cayenne models, the 12V battery is in the cargo area under the rear floor/trunk panel.',
        generations: [
            { name: '9Y0 (2019-2024)', years: '2019-2024', specs: { 'Location': 'Rear cargo floor compartment', 'Battery Type': 'AGM', 'Registration': 'Recommended after replacement', 'Access': 'Lift cargo floor and remove cover panel' } },
            { name: '92A (2011-2018)', years: '2011-2018', specs: { 'Location': 'Front seat/cabin floor area (trim dependent)', 'Battery Type': 'AGM', 'Registration': 'Recommended' } },
        ],
        faq: [
            { q: 'Does a Cayenne battery need coding?', a: 'Most late-model Cayenne vehicles benefit from battery registration/coding so the charging strategy matches the new battery.' },
        ],
    },
    {
        slug: 'range-rover-sport-battery-location',
        make: 'Land Rover',
        model: 'Range Rover Sport',
        toolType: 'battery-location',
        title: 'Range Rover Sport Battery Location by Year | SpotOnAuto',
        description: 'Range Rover Sport battery location, battery type, and replacement access notes by generation.',
        keywords: ['range rover sport battery location', 'where is battery in range rover sport', 'range rover sport battery'],
        quickAnswer: 'Most Range Rover Sport models place the 12V battery in the rear cargo/trunk area under the floor panel.',
        generations: [
            { name: 'L494 (2014-2024)', years: '2014-2024', specs: { 'Location': 'Rear cargo floor compartment', 'Battery Type': 'AGM', 'Registration': 'Recommended', 'Common Size': 'H8 / Group 49 class' } },
            { name: 'L320 (2005-2013)', years: '2005-2013', specs: { 'Location': 'Engine bay or rear compartment (trim dependent)', 'Battery Type': 'Standard/AGM', 'Common Size': 'H8 class' } },
        ],
        faq: [
            { q: 'Why is the Range Rover Sport battery hard to reach?', a: 'Packaging for weight distribution and cargo layout often places it under rear panels rather than open engine bay space.' },
        ],
    },
    {
        slug: '2024-land-rover-range-rover-battery-location',
        make: 'Land Rover',
        model: 'Range Rover',
        toolType: 'battery-location',
        title: '2024 Land Rover Range Rover Battery Location | SpotOnAuto',
        description: '2024 Range Rover battery location and replacement guidance including panel access and battery registration notes.',
        keywords: ['2024 land rover range rover battery location', '2024 range rover battery location', 'range rover battery'],
        quickAnswer: 'On most 2024 Range Rover trims, the 12V battery is in the rear cargo area beneath the floor panel and trim cover.',
        generations: [
            { name: 'L460 (2022-2024)', years: '2022-2024', specs: { 'Location': 'Rear cargo floor compartment', 'Battery Type': 'AGM', 'Registration': 'Required/recommended after replacement', 'Service Tip': 'Use memory saver for module retention' } },
            { name: 'L405 (2013-2021)', years: '2013-2021', specs: { 'Location': 'Rear cargo area', 'Battery Type': 'AGM', 'Registration': 'Recommended' } },
        ],
        faq: [
            { q: 'Can I replace a 2024 Range Rover battery myself?', a: 'Physical replacement is possible, but battery registration and system checks with a capable scan tool are strongly recommended.' },
        ],
    },
    {
        slug: 'vw-tiguan-coolant-type',
        make: 'Volkswagen',
        model: 'Tiguan',
        toolType: 'coolant-type',
        title: 'VW Tiguan Coolant Type & Mix Ratio | SpotOnAuto',
        description: 'Volkswagen Tiguan coolant type guidance by generation with G12/G13 compatibility and mix ratio notes.',
        keywords: ['vw tiguan coolant type', 'tiguan coolant', 'what coolant for volkswagen tiguan'],
        quickAnswer: 'Most VW Tiguan models require VW-approved pink/purple coolant (G12 evo / G13 spec) mixed 50/50 with distilled water unless pre-mixed.',
        generations: [
            { name: '2nd Gen (2018-2024)', years: '2018-2024', specs: { 'Coolant Spec': 'VW TL-774 L / G12 evo (region dependent)', 'Color': 'Pink/Purple', 'Mix Ratio': '50/50 distilled water', 'Do Not Mix': 'Universal green coolant' } },
            { name: '1st Gen (2008-2017)', years: '2008-2017', specs: { 'Coolant Spec': 'VW G12++ / G13', 'Color': 'Pink/Purple', 'Mix Ratio': '50/50 distilled water', 'Service Interval': 'Inspect annually' } },
        ],
        faq: [
            { q: 'Can I mix green coolant in a Tiguan?', a: 'No. Use VW-approved coolant only. Mixing incompatible chemistry can cause sludge, corrosion, and cooling system damage.' },
        ],
    },
    {
        slug: 'dodge-durango-coolant-type',
        make: 'Dodge',
        model: 'Durango',
        toolType: 'coolant-type',
        title: 'Dodge Durango Coolant Type Chart | SpotOnAuto',
        description: 'Dodge Durango coolant type and specification chart by year and engine family.',
        keywords: ['dodge durango coolant type', 'durango coolant', 'what coolant for dodge durango'],
        quickAnswer: 'Most modern Dodge Durango models use OAT coolant meeting Mopar MS.90032 (typically purple), pre-mixed 50/50.',
        generations: [
            { name: 'WD (2011-2024)', years: '2011-2024', specs: { 'Coolant Spec': 'Mopar OAT MS.90032', 'Color': 'Purple', 'Mix Ratio': '50/50 pre-mix preferred', 'Do Not Mix': 'HOAT (orange) unless system fully flushed' } },
            { name: 'HB (1998-2009)', years: '1998-2009', specs: { 'Coolant Spec': 'HOAT (MS-9769) on many trims', 'Color': 'Orange', 'Mix Ratio': '50/50', 'Service Tip': 'Verify by cap/manual because transitions occurred' } },
        ],
        faq: [
            { q: 'Is Durango coolant purple or orange?', a: 'Newer models are commonly purple OAT. Older generations may use orange HOAT. Always confirm exact spec for your model year.' },
        ],
    },
    {
        slug: 'bmw-x3-oil-type',
        make: 'BMW',
        model: 'X3',
        toolType: 'oil-type',
        title: 'BMW X3 Oil Type, Capacity & Filter | All Years',
        description: 'BMW X3 oil type and oil capacity by generation. Includes 20i/30i and xDrive models, filter guidance, and service interval notes.',
        keywords: [
            'bmw x3 oil type',
            'bmw x3 oil capacity',
            'bmw x3 oil change',
            'bmw x3 oil filter',
            'what oil does bmw x3 use',
        ],
        quickAnswer: 'Most modern BMW X3 models use full synthetic oil that meets BMW Longlife specs. Oil capacity is typically around 5 to 7 quarts depending on engine.',
        generations: [
            {
                name: 'G01 (2018-2024)',
                years: '2018-2024',
                specs: {
                    'Recommended Oil': '0W-20 or 0W-30 Full Synthetic (BMW LL spec)',
                    'Oil Capacity (with filter)': '~5.3 - 6.9 quarts (engine-dependent)',
                    'Filter Type': 'Cartridge filter element',
                    'Service Interval': 'Approx. 7,500 - 10,000 miles (or CBS monitor)',
                },
                notes: ['Use oil that explicitly meets BMW Longlife spec for your engine', 'Turbo engines benefit from shorter intervals under heavy city driving'],
            },
            {
                name: 'F25 (2011-2017)',
                years: '2011-2017',
                specs: {
                    'Recommended Oil': '5W-30 or 0W-30 Full Synthetic (BMW LL-01/LL-04)',
                    'Oil Capacity (with filter)': '~5.0 - 6.9 quarts',
                    'Filter Type': 'Cartridge filter element',
                    'Service Interval': 'Approx. 7,500 miles for best long-term reliability',
                },
            },
            {
                name: 'E83 (2004-2010)',
                years: '2004-2010',
                specs: {
                    'Recommended Oil': '5W-30 Full Synthetic (BMW-approved)',
                    'Oil Capacity (with filter)': '~6.5 - 7.0 quarts',
                    'Filter Type': 'Cartridge filter element',
                    'Service Interval': '5,000 - 7,500 miles (age and mileage dependent)',
                },
            },
        ],
        faq: [
            { q: 'What oil does a BMW X3 use?', a: 'Most BMW X3 engines use full synthetic oil meeting BMW Longlife specs. Viscosity is commonly 0W-20, 0W-30, or 5W-30 depending on year and engine.' },
            { q: 'How much oil does a BMW X3 take?', a: 'BMW X3 oil capacity usually lands in the 5 to 7 quart range with filter, depending on displacement and generation.' },
            { q: 'Can I run 5W-30 in my BMW X3?', a: 'Many X3 engines allow 5W-30 if it meets BMW spec, but newer models may call for 0W-20 or 0W-30. Always follow the oil cap and owner manual.' },
        ],
    },
    {
        slug: 'bmw-x3-battery-location',
        make: 'BMW',
        model: 'X3',
        toolType: 'battery-location',
        title: 'BMW X3 Battery Location, Size & Registration | Guide',
        description: 'BMW X3 battery location by generation, common AGM battery sizes, and battery registration steps after replacement.',
        keywords: [
            'bmw x3 battery location',
            'battery location bmw x3',
            'bmw x3 battery size',
            'bmw x3 battery registration',
            'bmw x3 battery replacement',
        ],
        quickAnswer: 'Most BMW X3 models place the 12V battery in the rear cargo area under the floor panel. AGM replacement and battery registration are usually required.',
        generations: [
            {
                name: 'G01 (2018-2024)',
                years: '2018-2024',
                specs: {
                    'Battery Location': 'Rear cargo compartment under floor panel',
                    'Battery Type': 'AGM',
                    'Common Size': 'H7/H8 class (varies by options)',
                    'Registration Required': 'Yes, recommended after replacement',
                },
                notes: ['Register the new battery with a BMW-capable scan tool', 'Incorrect battery coding can reduce battery life and charging performance'],
            },
            {
                name: 'F25 (2011-2017)',
                years: '2011-2017',
                specs: {
                    'Battery Location': 'Rear cargo compartment (right side/under panel)',
                    'Battery Type': 'AGM (most trims)',
                    'Common Size': 'H7/H8 class',
                    'Registration Required': 'Yes',
                },
            },
            {
                name: 'E83 (2004-2010)',
                years: '2004-2010',
                specs: {
                    'Battery Location': 'Rear cargo area under trim panel',
                    'Battery Type': 'Standard lead-acid or AGM (trim dependent)',
                    'Common Size': 'Group 49 / H8 class',
                    'Registration Required': 'Recommended on later models',
                },
            },
        ],
        faq: [
            { q: 'Where is the battery in a BMW X3?', a: 'On most BMW X3 generations, the main 12V battery sits in the rear cargo compartment beneath a trim or floor cover.' },
            { q: 'Does BMW X3 battery replacement need coding?', a: 'Yes. BMW X3 battery registration/coding is strongly recommended after replacement so the charging system adapts correctly.' },
            { q: 'What battery type should I use in a BMW X3?', a: 'Use the same chemistry as factory fitment, typically AGM, with matching capacity and CCA rating.' },
        ],
    },
    {
        slug: 'bmw-x3-serpentine-belt',
        make: 'BMW',
        model: 'X3',
        toolType: 'serpentine-belt',
        title: 'BMW X3 Serpentine Belt Diagram & Replacement | Guide',
        description: 'BMW X3 serpentine belt routing guidance, replacement intervals, and tensioner checks for common generations.',
        keywords: [
            'bmw x3 serpentine belt diagram',
            'bmw x3 belt routing',
            'bmw x3 serpentine belt replacement',
            'bmw x3 drive belt',
            'bmw x3 belt size',
        ],
        quickAnswer: 'BMW X3 belt routing varies by engine, but most models use one main serpentine belt for alternator and A/C accessories. Inspect tensioner and idler pulleys during replacement.',
        generations: [
            {
                name: 'G01 (2018-2024)',
                years: '2018-2024',
                specs: {
                    'Belt Type': 'Multi-rib serpentine belt',
                    'Routing': 'Crank pulley → alternator → A/C compressor → tensioner/idlers',
                    'Typical Interval': '60,000 - 90,000 miles',
                    'Tensioner': 'Automatic spring-loaded',
                },
                notes: ['Confirm under-hood routing diagram before belt removal', 'Inspect tensioner wobble and pulley bearing noise while belt is off'],
            },
            {
                name: 'F25 (2011-2017)',
                years: '2011-2017',
                specs: {
                    'Belt Type': 'Multi-rib serpentine belt',
                    'Routing': 'Engine-dependent; verify by VIN/engine code',
                    'Typical Interval': '60,000 - 100,000 miles',
                    'Tensioner': 'Automatic',
                },
            },
        ],
        faq: [
            { q: 'Is there a serpentine belt diagram for BMW X3?', a: 'Yes. BMW provides routing stickers on many models, and routing can also be confirmed in a service manual for your exact engine code.' },
            { q: 'When should I replace a BMW X3 serpentine belt?', a: 'A practical interval is 60,000 to 90,000 miles, or sooner if cracks, glazing, squeal, or fraying appear.' },
            { q: 'Should I replace the tensioner with the belt?', a: 'If the tensioner or idler pulley shows noise, wobble, or weak tension, replacing it with the belt is recommended.' },
        ],
    },
    {
        slug: 'nissan-pathfinder-serpentine-belt',
        make: 'Nissan',
        model: 'Pathfinder',
        toolType: 'serpentine-belt',
        title: 'Nissan Pathfinder Serpentine Belt Diagram & Routing',
        description: 'Nissan Pathfinder serpentine belt diagram guidance for 2005+ generations, with routing, interval, and tensioner checks.',
        keywords: [
            'nissan pathfinder serpentine belt diagram',
            '2007 nissan pathfinder serpentine belt diagram',
            '2006 nissan pathfinder belt diagram',
            'nissan pathfinder belt routing',
            'pathfinder serpentine belt replacement',
        ],
        quickAnswer: 'Most Nissan Pathfinder models use a single serpentine belt with an automatic tensioner. Confirm routing before removal and inspect the tensioner pulley while replacing the belt.',
        generations: [
            {
                name: 'R53 (2022-2024)',
                years: '2022-2024',
                specs: {
                    'Belt Type': 'Single serpentine drive belt',
                    'Routing': 'Crank → alternator → A/C → idlers/tensioner',
                    'Interval': 'Inspect at every major service, replace when worn',
                    'Tensioner': 'Automatic spring-loaded',
                },
            },
            {
                name: 'R52 (2013-2020)',
                years: '2013-2020',
                specs: {
                    'Belt Type': 'Single serpentine drive belt',
                    'Routing': 'Engine-specific routing; verify under-hood diagram',
                    'Interval': '60,000 - 90,000 miles typical',
                    'Tensioner': 'Automatic',
                },
            },
            {
                name: 'R51 (2005-2012)',
                years: '2005-2012',
                specs: {
                    'Belt Type': 'Single serpentine drive belt',
                    'Routing': 'Uses factory routing path per engine option',
                    'Interval': '60,000 - 90,000 miles',
                    'Tensioner': 'Automatic',
                },
            },
        ],
        faq: [
            { q: 'Where can I find the Pathfinder belt diagram?', a: 'Most Pathfinder models include the routing diagram on an under-hood sticker. If missing, use a service manual for your engine layout.' },
            { q: 'How long does a Pathfinder serpentine belt last?', a: 'Many belts last about 60,000 to 90,000 miles, but heat and contamination can shorten life.' },
            { q: 'Can a bad tensioner mimic belt noise?', a: 'Yes. A noisy or weak tensioner can cause chirping or squeal even with a new belt.' },
        ],
    },
    {
        slug: 'honda-fit-serpentine-belt',
        make: 'Honda',
        model: 'Fit',
        toolType: 'serpentine-belt',
        title: 'Honda Fit Serpentine Belt Diagram & Replacement',
        description: 'Honda Fit serpentine belt routing guidance by generation, with tensioner access tips and replacement intervals.',
        keywords: [
            '2007 honda fit serpentine belt diagram',
            'honda fit serpentine belt diagram',
            'honda fit belt routing',
            'honda fit serpentine belt replacement',
            'honda fit drive belt',
        ],
        quickAnswer: 'Honda Fit belt routing is compact and engine-bay access can be tight. Use the routing diagram before removal and verify rib alignment on every pulley during install.',
        generations: [
            {
                name: 'GK (2015-2020)',
                years: '2015-2020',
                specs: {
                    'Belt Type': 'Single serpentine/drive belt',
                    'Routing': 'Crank → alternator → A/C → tensioner',
                    'Interval': 'Inspect at service; replace if cracked/noisy',
                    'Access Notes': 'Tight packaging near passenger side',
                },
            },
            {
                name: 'GE (2009-2014)',
                years: '2009-2014',
                specs: {
                    'Belt Type': 'Single drive belt',
                    'Routing': 'Factory routing by accessory package',
                    'Interval': '60,000 - 90,000 miles typical',
                    'Access Notes': 'Often easier with wheel-well access',
                },
            },
            {
                name: 'GD (2007-2008)',
                years: '2007-2008',
                specs: {
                    'Belt Type': 'Single drive belt',
                    'Routing': 'Verify routing sticker/manual before removal',
                    'Interval': '60,000 miles inspection benchmark',
                    'Access Notes': 'Confirm tensioner travel before installation',
                },
            },
        ],
        faq: [
            { q: 'Is there a belt diagram for the Honda Fit?', a: 'Yes. Check the under-hood label first, then confirm with a service manual if the sticker is missing or unreadable.' },
            { q: 'How do I know the Honda Fit belt is worn?', a: 'Look for cracks, glazing, fraying, or chirping noises at startup and under load.' },
            { q: 'Should I replace the tensioner too?', a: 'If the tensioner bearing is noisy or spring tension is weak, replace it with the belt for longer service life.' },
        ],
    },
];

// ═══════════════════════════════════════════════════════════════════
//  THE MACHINE — merge hand-crafted (rich) + auto-generated (scale)
// ═══════════════════════════════════════════════════════════════════

import { generateAllToolPages } from './tool-machine.ts';
import { VALID_TASKS, VEHICLE_PRODUCTION_YEARS } from './vehicles.ts';

export type ToolType = ToolPage['toolType'];

export interface ToolRepairLink {
    task: string;
    label: string;
    href: string;
}

export interface RelatedToolLink {
    slug: string;
    href: string;
    toolType: ToolType;
    label: string;
}

const TOOL_TO_REPAIR_TASKS: Record<ToolType, string[]> = {
    'oil-type': ['oil-change', 'engine-air-filter-replacement', 'transmission-fluid-change'],
    'battery-location': ['battery-replacement', 'alternator-replacement', 'starter-replacement'],
    'tire-size': ['wheel-bearing-replacement', 'tie-rod-replacement', 'ball-joint-replacement'],
    'serpentine-belt': ['serpentine-belt-replacement', 'water-pump-replacement', 'alternator-replacement'],
    'headlight-bulb': ['headlight-bulb-replacement', 'tail-light-replacement', 'battery-replacement'],
    'fluid-capacity': ['coolant-flush', 'transmission-fluid-change', 'brake-fluid-flush'],
    'spark-plug-type': ['spark-plug-replacement', 'ignition-coil-replacement', 'oxygen-sensor-replacement'],
    'wiper-blade-size': ['windshield-wiper-replacement', 'headlight-bulb-replacement', 'battery-replacement'],
    'coolant-type': ['coolant-flush', 'thermostat-replacement', 'radiator-replacement'],
    'transmission-fluid-type': ['transmission-fluid-change', 'differential-fluid-change', 'clutch-replacement'],
};

const TASK_TO_TOOL_TYPES: Partial<Record<string, ToolType[]>> = {
    'oil-change': ['oil-type'],
    'battery-replacement': ['battery-location'],
    'serpentine-belt-replacement': ['serpentine-belt'],
    'headlight-bulb-replacement': ['headlight-bulb'],
    'spark-plug-replacement': ['spark-plug-type'],
    'radiator-replacement': ['coolant-type', 'fluid-capacity'],
    'thermostat-replacement': ['coolant-type', 'fluid-capacity'],
    'water-pump-replacement': ['coolant-type', 'fluid-capacity'],
    'transmission-fluid-change': ['transmission-fluid-type', 'fluid-capacity'],
    'coolant-flush': ['coolant-type', 'fluid-capacity'],
    'engine-air-filter-replacement': ['oil-type'],
    'windshield-wiper-replacement': ['wiper-blade-size'],
    'brake-fluid-flush': ['fluid-capacity'],
};

const UNIVERSAL_TOOL_TYPES: ToolType[] = ['oil-type', 'battery-location', 'tire-size'];

const PRIORITY_MAKES = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai',
    'Kia', 'Jeep', 'Subaru', 'BMW', 'Dodge', 'GMC', 'Mazda',
    'Volkswagen', 'Lexus', 'Mercedes',
];
const HIGH_DEMAND_MODELS = new Set([
    'Camry', 'Corolla', 'RAV4', 'Tacoma', 'F-150', 'Escape', 'Focus', 'Fusion',
    'Civic', 'Accord', 'CR-V', 'Odyssey', 'Pathfinder', 'Rogue', 'Altima', 'Sentra',
    'X3', 'X5', 'Grand Cherokee', 'Wrangler', 'Elantra', 'Sonata', 'Tucson',
    'Santa Fe', 'Soul', 'Sportage', 'Malibu', 'Silverado', 'Explorer', 'Pilot',
]);
const TOOL_TYPE_PRIORITY_SCORES: Record<ToolType, number> = {
    'serpentine-belt': 44,
    'battery-location': 38,
    'oil-type': 36,
    'headlight-bulb': 32,
    'spark-plug-type': 30,
    'coolant-type': 24,
    'transmission-fluid-type': 22,
    'fluid-capacity': 20,
    'tire-size': 18,
    'wiper-blade-size': 14,
};
const PRIORITY_MAKE_RANK = new Map(PRIORITY_MAKES.map((m, i) => [m, i]));
const VALID_TASK_SET = new Set(VALID_TASKS);

function slugVehiclePart(s: string): string {
    return s.toLowerCase().replace(/\s+/g, '-');
}

function normalizeVehicleToken(s: string): string {
    return s.toLowerCase().trim().replace(/[-_\s]+/g, ' ');
}

function vehicleKey(make: string, model: string): string {
    return `${normalizeVehicleToken(make)}::${normalizeVehicleToken(model)}`;
}

function makeRank(make: string): number {
    return PRIORITY_MAKE_RANK.get(make) ?? 999;
}

function toTaskLabel(task: string): string {
    return task.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function toToolLabel(toolType: ToolType): string {
    return TOOL_TYPE_META[toolType]?.label
        ?? toolType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getPrimaryRepairYear(make: string, model: string): string {
    const prod = VEHICLE_PRODUCTION_YEARS[make]?.[model];
    if (!prod) return '2013';
    return String(Math.min(2013, prod.end));
}

/** Hand-crafted pages with real researched specs — these always win */
const HAND_CRAFTED: ToolPage[] = [
    ...oilPages,
    ...batteryPages,
    ...tirePages,
    ...highIntentPages,
];

const handCraftedSlugs = new Set(HAND_CRAFTED.map(p => p.slug));

function getToolPriorityScore(page: ToolPage): number {
    const makeScore = Math.max(0, 55 - (makeRank(page.make) * 3));
    const toolTypeScore = TOOL_TYPE_PRIORITY_SCORES[page.toolType] ?? 0;
    const modelScore = HIGH_DEMAND_MODELS.has(page.model) ? 16 : 0;
    const handCraftedScore = handCraftedSlugs.has(page.slug) ? 1000 : 0;
    return handCraftedScore + makeScore + toolTypeScore + modelScore;
}

/** All pages: hand-crafted first, then machine-generated for everything else */
export const TOOL_PAGES: ToolPage[] = [
    ...HAND_CRAFTED,
    ...generateAllToolPages().filter(p => !handCraftedSlugs.has(p.slug)),
];

const TOOL_PAGES_BY_SLUG = new Map(TOOL_PAGES.map((p) => [p.slug, p]));

const TOOL_PAGES_BY_VEHICLE = new Map<string, ToolPage[]>();
const TOOL_PAGES_BY_TYPE = new Map<ToolType, ToolPage[]>();
for (const page of TOOL_PAGES) {
    const key = vehicleKey(page.make, page.model);
    if (!TOOL_PAGES_BY_VEHICLE.has(key)) TOOL_PAGES_BY_VEHICLE.set(key, []);
    TOOL_PAGES_BY_VEHICLE.get(key)!.push(page);

    if (!TOOL_PAGES_BY_TYPE.has(page.toolType)) TOOL_PAGES_BY_TYPE.set(page.toolType, []);
    TOOL_PAGES_BY_TYPE.get(page.toolType)!.push(page);
}

for (const pages of TOOL_PAGES_BY_VEHICLE.values()) {
    pages.sort((a, b) => a.title.localeCompare(b.title));
}
for (const pages of TOOL_PAGES_BY_TYPE.values()) {
    pages.sort((a, b) => {
        const byMake = makeRank(a.make) - makeRank(b.make);
        if (byMake !== 0) return byMake;
        const makeCmp = a.make.localeCompare(b.make);
        if (makeCmp !== 0) return makeCmp;
        return a.model.localeCompare(b.model);
    });
}

// Quick lookup by slug
export function getToolPage(slug: string): ToolPage | undefined {
    return TOOL_PAGES_BY_SLUG.get(slug);
}

export function getToolPagesForVehicle(make: string, model: string, excludeSlug?: string): ToolPage[] {
    const pages = TOOL_PAGES_BY_VEHICLE.get(vehicleKey(make, model)) ?? [];
    return excludeSlug ? pages.filter((p) => p.slug !== excludeSlug) : pages;
}

export function getToolPagesForType(toolType: ToolType, excludeSlug?: string): ToolPage[] {
    const pages = TOOL_PAGES_BY_TYPE.get(toolType) ?? [];
    return excludeSlug ? pages.filter((p) => p.slug !== excludeSlug) : pages;
}

export function getHighPriorityToolPages(limit = 320): ToolPage[] {
    const max = Math.max(1, limit);
    return [...TOOL_PAGES]
        .sort((a, b) => {
            const scoreDiff = getToolPriorityScore(b) - getToolPriorityScore(a);
            if (scoreDiff !== 0) return scoreDiff;
            const byMake = makeRank(a.make) - makeRank(b.make);
            if (byMake !== 0) return byMake;
            const byModel = a.model.localeCompare(b.model);
            if (byModel !== 0) return byModel;
            return a.toolType.localeCompare(b.toolType);
        })
        .slice(0, max);
}

export function getRelatedRepairLinks(page: ToolPage, limit = 3): ToolRepairLink[] {
    const makeSlug = slugVehiclePart(page.make);
    const modelSlug = slugVehiclePart(page.model);
    const year = getPrimaryRepairYear(page.make, page.model);
    const taskCandidates = TOOL_TO_REPAIR_TASKS[page.toolType] ?? ['oil-change', 'battery-replacement', 'spark-plug-replacement'];

    return taskCandidates
        .filter((task) => VALID_TASK_SET.has(task))
        .slice(0, Math.max(1, limit))
        .map((task) => ({
            task,
            label: toTaskLabel(task),
            href: `/repair/${year}/${makeSlug}/${modelSlug}/${task}`,
        }));
}

export function getRelatedToolLinksForRepair(make: string, model: string, task: string, limit = 4): RelatedToolLink[] {
    const max = Math.max(1, limit);
    const vehiclePages = getToolPagesForVehicle(make, model);
    if (vehiclePages.length === 0) return [];

    const links: RelatedToolLink[] = [];
    const seen = new Set<string>();
    const pageByType = new Map<ToolType, ToolPage>();
    for (const page of vehiclePages) {
        if (!pageByType.has(page.toolType)) pageByType.set(page.toolType, page);
    }

    const preferredTypes = [
        ...(TASK_TO_TOOL_TYPES[task] ?? []),
        ...UNIVERSAL_TOOL_TYPES,
    ];

    for (const toolType of preferredTypes) {
        const page = pageByType.get(toolType);
        if (!page || seen.has(page.slug)) continue;
        links.push({
            slug: page.slug,
            href: `/tools/${page.slug}`,
            toolType: page.toolType,
            label: toToolLabel(page.toolType),
        });
        seen.add(page.slug);
        if (links.length >= max) return links;
    }

    for (const page of vehiclePages) {
        if (seen.has(page.slug)) continue;
        links.push({
            slug: page.slug,
            href: `/tools/${page.slug}`,
            toolType: page.toolType,
            label: toToolLabel(page.toolType),
        });
        seen.add(page.slug);
        if (links.length >= max) break;
    }

    return links;
}
