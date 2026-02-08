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
 * Task validation is NOT performed - any task input (including DTC codes like P0301,
 * symptoms, or custom repair tasks) is passed to the AI for processing via charm.li.
 */
export function isValidVehicleCombination(
    year: string | number,
    make: string,
    model: string,
    task: string // task is accepted but not validated - AI handles all inputs
): boolean {
    const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;

    if (isNaN(yearNum)) return false;

    // Ensure task is not empty
    if (!task || task.trim().length === 0) return false;

    // Normalize make (convert slug back to proper name)
    const normalizedMake = Object.keys(VEHICLE_PRODUCTION_YEARS).find(
        m => m.toLowerCase().replace(/\s+/g, '-') === make.toLowerCase()
    );

    if (!normalizedMake) return false;

    const makeData = VEHICLE_PRODUCTION_YEARS[normalizedMake];

    // Normalize model (convert slug back to proper name)
    const normalizedModel = Object.keys(makeData).find(
        m => m.toLowerCase().replace(/\s+/g, '-') === model.toLowerCase()
    );

    if (!normalizedModel) return false;

    const modelData = makeData[normalizedModel];

    // Check if year is within production range
    return yearNum >= modelData.start && yearNum <= modelData.end;
}

/**
 * Get display name from slug
 */
export function getDisplayName(slug: string, type: 'make' | 'model'): string | null {
    if (type === 'make') {
        return Object.keys(VEHICLE_PRODUCTION_YEARS).find(
            m => m.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
        ) || null;
    }

    // For model, we need to search all makes
    for (const [, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
        const model = Object.keys(models).find(
            m => m.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
        );
        if (model) return model;
    }

    return null;
}
