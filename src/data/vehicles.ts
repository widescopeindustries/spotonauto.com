// Vehicle production years - shared between sitemap and page validation
export const VEHICLE_PRODUCTION_YEARS: Record<string, Record<string, { start: number; end: number }>> = {
    Toyota: {
        Camry: { start: 1983, end: 2024 },
        Corolla: { start: 1966, end: 2024 },
        RAV4: { start: 1996, end: 2024 },
        Highlander: { start: 2001, end: 2024 },
        Tacoma: { start: 1995, end: 2024 },
        Tundra: { start: 2000, end: 2024 },
        Prius: { start: 2001, end: 2024 },
        Sienna: { start: 1998, end: 2024 },
    },
    Honda: {
        Civic: { start: 1973, end: 2024 },
        Accord: { start: 1976, end: 2024 },
        'CR-V': { start: 1997, end: 2024 },
        Pilot: { start: 2003, end: 2024 },
        Odyssey: { start: 1995, end: 2024 },
        Fit: { start: 2007, end: 2020 },
    },
    Ford: {
        'F-150': { start: 1975, end: 2024 },
        Escape: { start: 2001, end: 2024 },
        Explorer: { start: 1991, end: 2024 },
        Focus: { start: 2000, end: 2018 },
        Fusion: { start: 2006, end: 2020 },
        Mustang: { start: 1965, end: 2024 },
        Edge: { start: 2007, end: 2024 },
    },
    Chevrolet: {
        Silverado: { start: 1999, end: 2024 },
        Equinox: { start: 2005, end: 2024 },
        Malibu: { start: 1964, end: 2024 },
        Tahoe: { start: 1995, end: 2024 },
        Suburban: { start: 1935, end: 2024 },
        Impala: { start: 1958, end: 2020 },
    },
    Nissan: {
        Altima: { start: 1993, end: 2024 },
        Rogue: { start: 2008, end: 2024 },
        Sentra: { start: 1982, end: 2024 },
        Versa: { start: 2007, end: 2024 },
        Pathfinder: { start: 1986, end: 2024 },
    },
    Hyundai: {
        Elantra: { start: 1991, end: 2024 },
        Sonata: { start: 1989, end: 2024 },
        Tucson: { start: 2005, end: 2024 },
        'Santa Fe': { start: 2001, end: 2024 },
    },
    Kia: {
        Optima: { start: 2001, end: 2020 },
        Sorento: { start: 2003, end: 2024 },
        Soul: { start: 2010, end: 2024 },
        Sportage: { start: 1995, end: 2024 },
    },
    BMW: {
        '3 Series': { start: 1975, end: 2024 },
        '5 Series': { start: 1972, end: 2024 },
        X3: { start: 2004, end: 2024 },
        X5: { start: 2000, end: 2024 },
    },
    Mercedes: {
        'C-Class': { start: 1994, end: 2024 },
        'E-Class': { start: 1986, end: 2024 },
        GLC: { start: 2016, end: 2024 },
        GLE: { start: 2016, end: 2024 },
    },
    Jeep: {
        'Grand Cherokee': { start: 1993, end: 2024 },
        Wrangler: { start: 1987, end: 2024 },
        Cherokee: { start: 1984, end: 2024 },
    },
    Subaru: {
        Outback: { start: 1995, end: 2024 },
        Forester: { start: 1998, end: 2024 },
        Crosstrek: { start: 2013, end: 2024 },
    },
};

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
    'cabin-air-filter-replacement',
    'engine-air-filter-replacement',
    'headlight-bulb-replacement',
];

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
        ([m]) => m.toLowerCase() === make.trim().toLowerCase()
    );

    if (makeEntry) {
        const [, models] = makeEntry;
        const modelEntry = Object.entries(models).find(([m]) => {
            const normalizedDbModel = m.toLowerCase().replace(/\s+/g, '-');
            const normalizedInputModel = model.trim().toLowerCase().replace(/\s+/g, '-');
            return normalizedDbModel === normalizedInputModel;
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

    // Unknown makes/models pass through - NHTSA has thousands we don't track
    return true;
}

/**
 * Get display name from slug
 * Fallback: Capitalize words if not found in lookup table
 */
export function getDisplayName(slug: string, type: 'make' | 'model'): string {
    // Try to find in hardcoded list first
    if (type === 'make') {
        const found = Object.keys(VEHICLE_PRODUCTION_YEARS).find(
            m => m.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
        );
        if (found) return found;
    } else {
        for (const [, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
            const found = Object.keys(models).find(
                m => m.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
            );
            if (found) return found;
        }
    }

    // Fallback: decode URI and Title Case
    return decodeURIComponent(slug)
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}
