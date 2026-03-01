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
            { name: 'XV40 (2007-2011)', years: '2007-2011', specs: { 'Oil Type (4-cyl)': '0W-20 or 5W-20', 'Capacity (4-cyl)': '4.5 quarts with filter', 'Oil Type (V6)': '5W-30', 'Capacity (V6)': '6.4 quarts with filter', 'Filter': 'Toyota 90915-YZZD1' } },
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
        quickAnswer: 'The 2020-2024 Toyota Corolla uses 0W-20 full synthetic oil with a capacity of 4.4 quarts (2.0L) or 4.8 quarts (1.8L hybrid).',
        generations: [
            { name: 'E210 (2020-2024)', years: '2020-2024', specs: { 'Oil Type': '0W-20 Full Synthetic', 'Capacity (2.0L)': '4.4 quarts with filter', 'Capacity (1.8L Hybrid)': '4.8 quarts with filter', 'Filter': 'Toyota 04152-YZZA1' } },
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
        quickAnswer: 'The 2018-2024 Honda Accord uses 0W-20 full synthetic oil. The 1.5T holds 3.7 quarts and the 2.0T holds 4.6 quarts with filter.',
        generations: [
            { name: '10th Gen (2018-2024)', years: '2018-2024', specs: { 'Oil Type': '0W-20 Full Synthetic', 'Capacity (1.5T)': '3.7 quarts with filter', 'Capacity (2.0T)': '4.6 quarts with filter', 'Filter': 'Honda 15400-PLM-A02' } },
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
        quickAnswer: 'The 2019-2024 Silverado 5.3L V8 uses 0W-20 full synthetic (8.0 quarts). The 6.2L V8 uses 0W-20 (8.0 quarts). The 3.0L Duramax diesel uses 0W-20 Dexos D (8.0 quarts).',
        generations: [
            { name: 'T1XX (2019-2024)', years: '2019-2024', specs: { 'Oil Type (2.7L Turbo)': '0W-20 Full Synthetic', 'Capacity (2.7L)': '7.0 quarts with filter', 'Oil Type (5.3L V8)': '0W-20 Dexos 1 Gen 3', 'Capacity (5.3L)': '8.0 quarts with filter', 'Oil Type (6.2L V8)': '0W-20 Dexos 1 Gen 3', 'Capacity (6.2L)': '8.0 quarts with filter', 'Oil Type (3.0L Diesel)': '0W-20 Dexos D', 'Capacity (3.0L Diesel)': '8.0 quarts with filter' }, notes: ['All engines now use 0W-20', 'Must use Dexos-approved oil'] },
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
        quickAnswer: 'The 2019-2024 Toyota RAV4 uses 0W-20 full synthetic oil with a capacity of 4.8 quarts (2.5L) or 4.4 quarts (Hybrid).',
        generations: [
            { name: 'XA50 (2019-2024)', years: '2019-2024', specs: { 'Oil Type': '0W-20 Full Synthetic', 'Capacity (2.5L)': '4.8 quarts with filter', 'Capacity (Hybrid)': '4.4 quarts with filter', 'Filter': 'Toyota 04152-YZZA1' } },
            { name: 'XA40 (2013-2018)', years: '2013-2018', specs: { 'Oil Type': '0W-20 Synthetic', 'Capacity': '4.6 quarts with filter', 'Filter': 'Toyota 04152-YZZA1' } },
            { name: 'XA30 (2006-2012)', years: '2006-2012', specs: { 'Oil Type (4-cyl)': '0W-20 or 5W-20', 'Capacity (4-cyl)': '4.5 quarts with filter', 'Oil Type (V6)': '5W-30', 'Capacity (V6)': '6.4 quarts with filter' } },
        ],
        faq: [
            { q: 'Does the RAV4 Hybrid use different oil?', a: 'Same type (0W-20 full synthetic) but slightly different capacity. The hybrid holds about 4.4 quarts vs 4.8 for the non-hybrid. Same filter.' },
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
        quickAnswer: 'The 2021-2024 Hyundai Elantra uses 0W-20 full synthetic oil with a capacity of 4.2 quarts (2.0L) or 4.0 quarts (1.6T N Line).',
        generations: [
            { name: 'CN7 (2021-2024)', years: '2021-2024', specs: { 'Oil Type (2.0L)': '0W-20 Full Synthetic', 'Capacity (2.0L)': '4.2 quarts with filter', 'Oil Type (1.6T)': '0W-20 Full Synthetic', 'Capacity (1.6T)': '4.0 quarts with filter' } },
            { name: 'AD (2017-2020)', years: '2017-2020', specs: { 'Oil Type': '0W-20 Synthetic', 'Capacity (2.0L)': '4.2 quarts with filter', 'Filter': 'Hyundai 26300-35505' } },
            { name: 'MD/UD (2011-2016)', years: '2011-2016', specs: { 'Oil Type': '5W-20 or 5W-30', 'Capacity': '4.2 quarts with filter' } },
        ],
        faq: [
            { q: 'Is there an oil consumption recall on the Elantra?', a: 'Hyundai extended warranties on certain 2011-2019 Theta II engines due to excessive oil consumption. Check with your dealer for your specific VIN. The Smartstream engines (2021+) do not have this issue.' },
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
        quickAnswer: 'The 2021-2024 Nissan Rogue uses 0W-20 full synthetic oil with a capacity of 5.0 quarts with filter.',
        generations: [
            { name: 'T33 (2021-2024)', years: '2021-2024', specs: { 'Oil Type': '0W-20 Full Synthetic', 'Capacity': '5.0 quarts with filter', 'Filter': 'Nissan 15208-9HP0A' } },
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
            { name: '8th Gen (2006-2011)', years: '2006-2011', specs: { 'Location': 'Under hood, driver\'s side', 'Battery Size': 'Group 51R', 'CCA': '410 CCA', 'Difficulty': 'Easy — 15 min' }, notes: ['Moved from driver side to passenger side in 10th gen'] },
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
];

// ═══════════════════════════════════════════════════════════════════
//  THE MACHINE — merge hand-crafted (rich) + auto-generated (scale)
// ═══════════════════════════════════════════════════════════════════

import { generateAllToolPages } from './tool-machine';

/** Hand-crafted pages with real researched specs — these always win */
const HAND_CRAFTED: ToolPage[] = [
    ...oilPages,
    ...batteryPages,
    ...tirePages,
];

const handCraftedSlugs = new Set(HAND_CRAFTED.map(p => p.slug));

/** All pages: hand-crafted first, then machine-generated for everything else */
export const TOOL_PAGES: ToolPage[] = [
    ...HAND_CRAFTED,
    ...generateAllToolPages().filter(p => !handCraftedSlugs.has(p.slug)),
];

// Quick lookup by slug
export function getToolPage(slug: string): ToolPage | undefined {
    return TOOL_PAGES.find(tp => tp.slug === slug);
}
