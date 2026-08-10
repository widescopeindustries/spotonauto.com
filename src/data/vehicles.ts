// Vehicle production years - shared between sitemap and page validation
// Loaded from validated-vehicles.json so the registry can be scaled independently.
import validatedVehicles from './validated-vehicles.json' with { type: 'json' };

export const VEHICLE_PRODUCTION_YEARS: Record<string, Record<string, { start: number; end: number }>> = validatedVehicles as Record<
    string,
    Record<string, { start: number; end: number }>
>;

// Kept for reference: previously hardcoded list is now maintained in validated-vehicles.json
// via scripts/build-vehicle-db.mjs. Edit that file and rebuild to change coverage.

export const VALID_TASKS = [
    'oil-change',
    'brake-pad-replacement',
    'brake-rotor-replacement',
    'alternator-replacement',
    'starter-replacement',
    'battery-replacement',
    'spark-plug-replacement',
    'radiator-replacement',
    'thermostat-replacement',
    'water-pump-replacement',
    'serpentine-belt-replacement',
    'timing-belt-replacement',
    'timing-chain-replacement',
    'cabin-air-filter-replacement',
    'engine-air-filter-replacement',
    'headlight-bulb-replacement',
    'tail-light-replacement',
    'fuel-filter-replacement',
    'fuel-injector-replacement',
    'fuel-pump-replacement',
    'clutch-replacement',
    'transmission-fluid-change',
    'coolant-flush',
    'power-steering-fluid-change',
    'wheel-bearing-replacement',
    'tie-rod-replacement',
    'ball-joint-replacement',
    'shock-absorber-replacement',
    'strut-replacement',
    'cv-axle-replacement',
    'oxygen-sensor-replacement',
    'mass-air-flow-sensor-replacement',
    'ignition-coil-replacement',
    'egr-valve-replacement',
    'catalytic-converter-replacement',
    'muffler-replacement',
    'windshield-wiper-replacement',
    'brake-fluid-flush',
    'differential-fluid-change',
    'turbo-replacement',
    'glow-plug-replacement',
    'drive-belt-replacement',
    'valve-cover-gasket-replacement',
    'head-gasket-replacement',
    'crankshaft-sensor-replacement',
    'camshaft-sensor-replacement',
];

/** CHARM corpus coverage boundaries — OEM factory manual data */
export const CORPUS_YEAR_MIN = 1982;
export const CORPUS_YEAR_MAX = 2026;

export function isCorpusBacked(year: number): boolean {
    return year >= CORPUS_YEAR_MIN && year <= CORPUS_YEAR_MAX;
}

/** Brands with minimal search volume — noindex to save crawl budget */
export const NOINDEX_MAKES = new Set([
    'isuzu',  // Commercial trucks only — Renault/Fiat/Smart removed to enable international coverage
]);

/**
 * Models that were never sold in the US market (or only briefly under a different name).
 * These generate false content for a US-focused site. Format: 'make:model' (lowercase, hyphenated).
 * Pages for these models get noindex + excluded from sitemaps.
 */
export const NON_US_MODELS = new Set([
    // Nissan
    'nissan:qashqai',
    'nissan:micra',
    'nissan:note',
    'nissan:juke',  // US ended 2017, listed to 2024
    // Hyundai
    'hyundai:i10',
    'hyundai:i20',
    'hyundai:i30',
    // Kia
    'kia:ceed',
    'kia:picanto',
    // Volkswagen
    'volkswagen:polo',
    'volkswagen:t-roc',
    'volkswagen:caddy',
    'volkswagen:transporter',
    'volkswagen:up',
    // Audi
    'audi:a1',
    'audi:q2',
    // Mitsubishi
    'mitsubishi:pajero',
    'mitsubishi:l200',
    'mitsubishi:asx',
    // Suzuki (all cars after 2013 are non-US, but Suzuki is not in NOINDEX_MAKES)
    'suzuki:jimny',
    'suzuki:ignis',
    'suzuki:swift',  // US ended ~2001
    'suzuki:vitara', // US ended ~2004
    'suzuki:sx4',    // US ended ~2013
    'suzuki:baleno',
    'suzuki:celerio',
    'suzuki:s-cross',
    // Ford
    'ford:mondeo',  // EU only, US = Fusion
    // Acura
    'acura:cdx',    // China only
    // Volvo
    'volvo:v40',    // US ended 2004, 2nd gen EU only
]);

export function isNonUsModel(make: string, model: string): boolean {
    const normalizedMake = make.toLowerCase().replace(/-datsun$/, '');
    const key = `${normalizedMake}:${model.toLowerCase().replace(/\s+/g, '-')}`;
    return NON_US_MODELS.has(key);
}

/**
 * International model name aliases — maps non-US names to their US corpus equivalent.
 * Same vehicle, same platform, same wiring — just different name by market.
 * Format: 'make:international-model' → { usMake: string, usModel: string }
 */
export const INTERNATIONAL_ALIASES: Record<string, { usMake: string; usModel: string }> = {
    // Nissan
    'nissan:qashqai': { usMake: 'Nissan', usModel: 'Rogue Sport' },
    'nissan:micra': { usMake: 'Nissan', usModel: 'Versa' },
    'nissan:note': { usMake: 'Nissan', usModel: 'Versa Note' },
    'nissan:x-trail': { usMake: 'Nissan', usModel: 'Rogue' },
    'nissan:navara': { usMake: 'Nissan', usModel: 'Frontier' },
    'nissan:patrol': { usMake: 'Nissan', usModel: 'Armada' },
    'nissan:pulsar': { usMake: 'Nissan', usModel: 'Sentra' },
    // Mitsubishi
    'mitsubishi:pajero': { usMake: 'Mitsubishi', usModel: 'Montero' },
    'mitsubishi:asx': { usMake: 'Mitsubishi', usModel: 'Outlander Sport' },
    'mitsubishi:l200': { usMake: 'Mitsubishi', usModel: 'Mighty Max' },
    'mitsubishi:triton': { usMake: 'Mitsubishi', usModel: 'Mighty Max' },
    'mitsubishi:colt': { usMake: 'Mitsubishi', usModel: 'Mirage' },
    // Hyundai
    'hyundai:i30': { usMake: 'Hyundai', usModel: 'Elantra GT' },
    'hyundai:i20': { usMake: 'Hyundai', usModel: 'Accent' },
    'hyundai:i10': { usMake: 'Hyundai', usModel: 'Accent' },
    'hyundai:ix35': { usMake: 'Hyundai', usModel: 'Tucson' },
    'hyundai:ix55': { usMake: 'Hyundai', usModel: 'Veracruz' },
    // Kia
    'kia:ceed': { usMake: 'Kia', usModel: 'Forte' },
    'kia:picanto': { usMake: 'Kia', usModel: 'Rio' },
    'kia:stonic': { usMake: 'Kia', usModel: 'Soul' },
    // Volkswagen
    'volkswagen:polo': { usMake: 'Volkswagen', usModel: 'Golf' },
    'volkswagen:transporter': { usMake: 'Volkswagen', usModel: 'Eurovan' },
    'volkswagen:caddy': { usMake: 'Volkswagen', usModel: 'Rabbit Pickup' },
    'volkswagen:touran': { usMake: 'Volkswagen', usModel: 'Golf' },
    // Audi
    'audi:a1': { usMake: 'Audi', usModel: 'A3' },
    // Ford
    'ford:mondeo': { usMake: 'Ford', usModel: 'Fusion' },
    'ford:galaxy': { usMake: 'Ford', usModel: 'Freestyle' },
    'ford:fiesta': { usMake: 'Ford', usModel: 'Fiesta' },
    'ford:ka': { usMake: 'Ford', usModel: 'Fiesta' },
    // Toyota
    'toyota:hilux': { usMake: 'Toyota', usModel: 'Tacoma' },
    'toyota:fortuner': { usMake: 'Toyota', usModel: '4Runner' },
    'toyota:land-cruiser-prado': { usMake: 'Toyota', usModel: '4Runner' },
    'toyota:yaris': { usMake: 'Toyota', usModel: 'Echo' },
    'toyota:auris': { usMake: 'Toyota', usModel: 'Corolla' },
    'toyota:avensis': { usMake: 'Toyota', usModel: 'Camry' },
    // Honda
    'honda:jazz': { usMake: 'Honda', usModel: 'Fit' },
    'honda:city': { usMake: 'Honda', usModel: 'Fit' },
    // Suzuki
    'suzuki:jimny': { usMake: 'Suzuki', usModel: 'Samurai' },
    'suzuki:swift': { usMake: 'Suzuki', usModel: 'Swift' },
    'suzuki:vitara': { usMake: 'Suzuki', usModel: 'Grand Vitara' },
    'suzuki:sx4': { usMake: 'Suzuki', usModel: 'SX4' },
    'suzuki:ignis': { usMake: 'Suzuki', usModel: 'Swift' },
    // Volvo
    'volvo:v40': { usMake: 'Volvo', usModel: 'S40' },
    // Acura / Honda
    'acura:cdx': { usMake: 'Acura', usModel: 'RDX' },
    // Land Rover
    'land-rover:freelander': { usMake: 'Land Rover', usModel: 'LR2' },
};

export function getUsEquivalent(make: string, model: string): { usMake: string; usModel: string } | null {
    const key = `${make.toLowerCase()}:${model.toLowerCase().replace(/\s+/g, '-')}`;
    return INTERNATIONAL_ALIASES[key] || null;
}

/** Pure electric vehicles — no combustion engine, no oil, no spark plugs, no belts */
export const EV_MODELS = new Set([
    'toyota:bz4x',
    'honda:prologue',
    'ford:mustang-mach-e',
    'chevrolet:bolt-ev',
    'chevrolet:bolt-euv',
    'chevrolet:bolt-incomplete',
    'chevrolet:equinox-ev',
    'chevrolet:blazer-ev',
    'nissan:leaf',
    'nissan:ariya',
    'hyundai:ioniq-5',
    'hyundai:ioniq-6',
    'kia:ev6',
    'kia:ev9',
    'bmw:i3',
    'bmw:i4',
    'bmw:i7',
    'bmw:ix',
    'mercedes-benz:eqs-class-sedan',
    'mercedes-benz:eqe-class-sedan',
    'mercedes-benz:eqb-class',
    'mercedes-benz:eqs-class-suv',
    'mercedes-benz:eqe-class-suv',
    'mercedes-benz:esprinter',
    'volkswagen:id.4',
    'volkswagen:id4',
    'audi:e-tron',
    'audi:e-tron-sportback',
    'audi:rs-e-tron-gt',
    'audi:e-tron-gt',
    'audi:q4-(e-tron)',
    'audi:q4-e-tron',
    'audi:q8-e-tron',
    'subaru:solterra',
    'mazda:mx-30',
    'mitsubishi:i-miev',
    'gmc:hummer-ev-pickup',
    'gmc:hummer-ev-suv',
    'gmc:cruise-origin-av',
    'cadillac:lyriq',
    'porsche:taycan',
    'fiat:500e',
    'mini:cooper-se',
    'volvo:ex30',
    'volvo:ex90',
    'volvo:xc40-recharge',
    'genesis:gv60',
    'genesis:electrified-gv70',
    'rivian:r1t',
    'rivian:r1s',
    'lucid:air',
    'polestar:2',
    'tesla:model-3',
    'tesla:model-y',
    'tesla:model-s',
    'tesla:model-x',
    'tesla:cybertruck',
]);

/** Repair tasks that only apply to internal combustion engines */
export const ICE_ONLY_TASKS = new Set([
    'oil-change',
    'spark-plug-replacement',
    'serpentine-belt-replacement',
    'timing-belt-replacement',
    'alternator-replacement',
    'starter-replacement',
    'oxygen-sensor-replacement',
    'ignition-coil-replacement',
    'catalytic-converter-replacement',
    'engine-air-filter-replacement',
    'fuel-filter-replacement',
    'fuel-pump-replacement',
    'valve-cover-gasket-replacement',
]);

export function isEvModel(make: string, model: string): boolean {
    const key = `${make.toLowerCase()}:${model.toLowerCase().replace(/\s+/g, '-')}`;
    return EV_MODELS.has(key);
}

/** Tasks that only apply to diesel engines — block for all gas/EV vehicles */
const DIESEL_ONLY_TASKS = new Set(['glow-plug-replacement']);

export function isTaskValidForVehicle(make: string, model: string, task: string): boolean {
    // EVs have ZERO corpus data — block ALL tasks, not just ICE tasks
    if (isEvModel(make, model)) return false;
    // Glow plugs are diesel-only — block unless model name indicates diesel
    if (DIESEL_ONLY_TASKS.has(task)) {
        const m = model.toLowerCase();
        const isDiesel = /diesel|tdi|cdi|duramax|powerstroke|power\s*stroke|cummins|bluetec|d4d|hdi|dci|jtd|cdti/.test(m);
        if (!isDiesel) return false;
    }
    return true;
}

export function slugifyRoutePart(value: string): string {
    return decodeURIComponent(value)
        .trim()
        .toLowerCase()
        .replace(/,/g, '')
        // Canonicalize common model variant punctuation.
        .replace(/\bcr-v\b/g, 'crv')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Validates if a vehicle/year combination is valid.
 * Permissive: rejects only known-impossible combos (e.g. year outside production range).
 * Unknown makes/models are allowed through since NHTSA API provides thousands of models.
 */
export function isValidVehicleCombination(
    year: string | number,
    make: string,
    model: string,
    task: string
): boolean {
    const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;

    if (isNaN(yearNum)) return false;

    // Basic year sanity check (1900 to next year)
    const currentYear = new Date().getFullYear();
    if (yearNum < 1900 || yearNum > currentYear + 1) return false;

    // Ensure make and model are present
    if (!make || make.trim().length === 0) return false;
    if (!model || model.trim().length === 0) return false;

    // If we have production year data for this vehicle, validate the year range
    const makeEntry = Object.entries(VEHICLE_PRODUCTION_YEARS).find(
        ([m]) => slugifyRoutePart(m) === slugifyRoutePart(make)
    );

    if (makeEntry) {
        const [, models] = makeEntry;
        const modelEntry = Object.entries(models).find(([m]) => {
            return slugifyRoutePart(m) === slugifyRoutePart(model);
        });

        if (modelEntry) {
            const [, productionYears] = modelEntry;
            if (yearNum < productionYears.start || yearNum > productionYears.end) {
                console.warn(
                    `[VALIDATION] Rejected ${yearNum} ${make} ${model}: ` +
                    `valid range is ${productionYears.start}-${productionYears.end}`
                );
                return false;
            }
        }
    }

    // Block ICE-only tasks for electric vehicles
    if (isEvModel(make, model) && ICE_ONLY_TASKS.has(task)) return false;

    // Unknown makes/models pass through - NHTSA has thousands we don't track
    return true;
}

/**
 * For a known make/model that is out of production range, returns the nearest
 * valid year (start if too early, end if too late). Returns null if the year
 * is already valid OR if the make/model is not in our database.
 */
export function getClampedYear(
    year: string | number,
    make: string,
    model: string
): number | null {
    const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;
    if (isNaN(yearNum)) return null;

    const makeEntry = Object.entries(VEHICLE_PRODUCTION_YEARS).find(
        ([m]) => slugifyRoutePart(m) === slugifyRoutePart(make)
    );
    if (!makeEntry) return null;

    const [, models] = makeEntry;
    const modelEntry = Object.entries(models).find(([m]) => {
        return slugifyRoutePart(m) === slugifyRoutePart(model);
    });
    if (!modelEntry) return null;

    const [, { start, end }] = modelEntry;
    if (yearNum < start) return start;
    if (yearNum > end) return end;
    return null; // year is already valid
}

/**
 * Get display name from slug
 * Fallback: Capitalize words if not found in lookup table
 */
export function getDisplayName(slug: string, type: 'make' | 'model'): string {
    // Try to find in hardcoded list first
    if (type === 'make') {
        const found = Object.keys(VEHICLE_PRODUCTION_YEARS).find(
            m => slugifyRoutePart(m) === slugifyRoutePart(slug)
        );
        if (found) return found;
    } else {
        for (const [, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
            const found = Object.keys(models).find(
                m => slugifyRoutePart(m) === slugifyRoutePart(slug)
            );
            if (found) return found;
        }
    }

    // Fallback: decode URI and Title Case
    return decodeURIComponent(slug)
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}
