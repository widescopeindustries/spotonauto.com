// Vehicle production years - shared between sitemap and page validation
// Covers all charm.li manufacturers + major global models
export const VEHICLE_PRODUCTION_YEARS: Record<string, Record<string, { start: number; end: number }>> = {
    // ── US / JAPAN / KOREA (original) ──────────────────────────────────
    Toyota: {
        Camry: { start: 1983, end: 2024 },
        Corolla: { start: 1966, end: 2024 },
        RAV4: { start: 1996, end: 2024 },
        Highlander: { start: 2001, end: 2024 },
        Tacoma: { start: 1995, end: 2024 },
        Tundra: { start: 2000, end: 2024 },
        Prius: { start: 2001, end: 2024 },
        Sienna: { start: 1998, end: 2024 },
        Yaris: { start: 1999, end: 2020 },
        '4Runner': { start: 1984, end: 2024 },
        Avalon: { start: 1995, end: 2022 },
        Supra: { start: 1978, end: 2024 },
        'Land Cruiser': { start: 1958, end: 2024 },
    },
    Honda: {
        Civic: { start: 1973, end: 2024 },
        Accord: { start: 1976, end: 2024 },
        'CR-V': { start: 1997, end: 2024 },
        Pilot: { start: 2003, end: 2024 },
        Odyssey: { start: 1995, end: 2024 },
        Fit: { start: 2007, end: 2020 },
        'HR-V': { start: 2016, end: 2024 },
        Ridgeline: { start: 2006, end: 2024 },
        Element: { start: 2003, end: 2011 },
    },
    Ford: {
        'F-150': { start: 1975, end: 2024 },
        Escape: { start: 2001, end: 2024 },
        Explorer: { start: 1991, end: 2024 },
        Focus: { start: 2000, end: 2018 },
        Fusion: { start: 2006, end: 2020 },
        Mustang: { start: 1965, end: 2024 },
        Edge: { start: 2007, end: 2024 },
        Ranger: { start: 1983, end: 2024 },
        Bronco: { start: 1966, end: 2024 },
        Expedition: { start: 1997, end: 2024 },
        Taurus: { start: 1986, end: 2019 },
        'F-250': { start: 1999, end: 2024 },
        Transit: { start: 2015, end: 2024 },
        Fiesta: { start: 1978, end: 2019 },
        Mondeo: { start: 1993, end: 2022 },
    },
    Chevrolet: {
        Silverado: { start: 1999, end: 2024 },
        Equinox: { start: 2005, end: 2024 },
        Malibu: { start: 1964, end: 2024 },
        Tahoe: { start: 1995, end: 2024 },
        Suburban: { start: 1935, end: 2024 },
        Impala: { start: 1958, end: 2020 },
        Traverse: { start: 2009, end: 2024 },
        Colorado: { start: 2004, end: 2024 },
        Trax: { start: 2015, end: 2024 },
        Blazer: { start: 1969, end: 2024 },
        Camaro: { start: 1967, end: 2024 },
        Corvette: { start: 1953, end: 2024 },
    },
    Nissan: {
        Altima: { start: 1993, end: 2024 },
        Rogue: { start: 2008, end: 2024 },
        Sentra: { start: 1982, end: 2024 },
        Versa: { start: 2007, end: 2024 },
        Pathfinder: { start: 1986, end: 2024 },
        Murano: { start: 2003, end: 2024 },
        Frontier: { start: 1998, end: 2024 },
        Maxima: { start: 1981, end: 2023 },
        Titan: { start: 2004, end: 2024 },
        Kicks: { start: 2018, end: 2024 },
        Qashqai: { start: 2007, end: 2024 },
        Juke: { start: 2011, end: 2024 },
        Micra: { start: 1982, end: 2024 },
        Note: { start: 2004, end: 2024 },
    },
    Hyundai: {
        Elantra: { start: 1991, end: 2024 },
        Sonata: { start: 1989, end: 2024 },
        Tucson: { start: 2005, end: 2024 },
        'Santa Fe': { start: 2001, end: 2024 },
        Kona: { start: 2018, end: 2024 },
        Palisade: { start: 2020, end: 2024 },
        Venue: { start: 2020, end: 2024 },
        i10: { start: 2008, end: 2024 },
        i20: { start: 2009, end: 2024 },
        i30: { start: 2007, end: 2024 },
    },
    Kia: {
        Optima: { start: 2001, end: 2020 },
        K5: { start: 2021, end: 2024 },
        Sorento: { start: 2003, end: 2024 },
        Soul: { start: 2010, end: 2024 },
        Sportage: { start: 1995, end: 2024 },
        Telluride: { start: 2020, end: 2024 },
        Forte: { start: 2010, end: 2024 },
        Seltos: { start: 2020, end: 2024 },
        Ceed: { start: 2007, end: 2024 },
        Picanto: { start: 2004, end: 2024 },
        Rio: { start: 2001, end: 2024 },
    },
    Mazda: {
        '3': { start: 2004, end: 2024 },
        '6': { start: 2003, end: 2021 },
        'CX-5': { start: 2013, end: 2024 },
        'CX-9': { start: 2007, end: 2024 },
        'CX-30': { start: 2020, end: 2024 },
        'MX-5': { start: 1990, end: 2024 },
        '2': { start: 2008, end: 2024 },
    },
    Mitsubishi: {
        Outlander: { start: 2003, end: 2024 },
        Eclipse: { start: 1990, end: 2012 },
        'Eclipse Cross': { start: 2018, end: 2024 },
        Lancer: { start: 1973, end: 2017 },
        Pajero: { start: 1982, end: 2021 },
        'L200': { start: 1978, end: 2024 },
        ASX: { start: 2010, end: 2024 },
    },
    Suzuki: {
        Swift: { start: 1984, end: 2024 },
        Vitara: { start: 1988, end: 2024 },
        Jimny: { start: 1970, end: 2024 },
        'SX4': { start: 2006, end: 2024 },
        Ignis: { start: 2000, end: 2024 },
    },
    // ── EUROPEAN ───────────────────────────────────────────────────────
    BMW: {
        '1 Series': { start: 2004, end: 2024 },
        '2 Series': { start: 2014, end: 2024 },
        '3 Series': { start: 1975, end: 2024 },
        '4 Series': { start: 2014, end: 2024 },
        '5 Series': { start: 1972, end: 2024 },
        '7 Series': { start: 1977, end: 2024 },
        X1: { start: 2010, end: 2024 },
        X3: { start: 2004, end: 2024 },
        X5: { start: 2000, end: 2024 },
        X6: { start: 2008, end: 2024 },
    },
    Mercedes: {
        'A-Class': { start: 1997, end: 2024 },
        'C-Class': { start: 1994, end: 2024 },
        'E-Class': { start: 1986, end: 2024 },
        'S-Class': { start: 1972, end: 2024 },
        GLA: { start: 2014, end: 2024 },
        GLB: { start: 2020, end: 2024 },
        GLC: { start: 2016, end: 2024 },
        GLE: { start: 2016, end: 2024 },
        Sprinter: { start: 1995, end: 2024 },
    },
    Volkswagen: {
        Golf: { start: 1974, end: 2024 },
        Jetta: { start: 1980, end: 2024 },
        Passat: { start: 1973, end: 2024 },
        Tiguan: { start: 2008, end: 2024 },
        Polo: { start: 1975, end: 2024 },
        'T-Roc': { start: 2018, end: 2024 },
        Touareg: { start: 2003, end: 2024 },
        Beetle: { start: 1938, end: 2019 },
        Atlas: { start: 2018, end: 2024 },
        Arteon: { start: 2017, end: 2024 },
        Caddy: { start: 1980, end: 2024 },
        Transporter: { start: 1950, end: 2024 },
        Up: { start: 2012, end: 2024 },
    },
    Audi: {
        A3: { start: 1996, end: 2024 },
        A4: { start: 1995, end: 2024 },
        A6: { start: 1994, end: 2024 },
        Q3: { start: 2012, end: 2024 },
        Q5: { start: 2009, end: 2024 },
        Q7: { start: 2006, end: 2024 },
        TT: { start: 1998, end: 2024 },
        A1: { start: 2010, end: 2024 },
        Q2: { start: 2017, end: 2024 },
    },
    Renault: {
        Clio: { start: 1990, end: 2024 },
        Megane: { start: 1996, end: 2024 },
        Captur: { start: 2013, end: 2024 },
        Kadjar: { start: 2015, end: 2022 },
        Scenic: { start: 1997, end: 2024 },
        Twingo: { start: 1993, end: 2024 },
        Kangoo: { start: 1998, end: 2024 },
        Laguna: { start: 1994, end: 2015 },
        Zoe: { start: 2013, end: 2024 },
        Arkana: { start: 2021, end: 2024 },
        Duster: { start: 2010, end: 2024 },
    },
    Peugeot: {
        '108': { start: 2014, end: 2024 },
        '208': { start: 2012, end: 2024 },
        '308': { start: 2008, end: 2024 },
        '508': { start: 2011, end: 2024 },
        '2008': { start: 2013, end: 2024 },
        '3008': { start: 2009, end: 2024 },
        '5008': { start: 2009, end: 2024 },
        Partner: { start: 1996, end: 2024 },
        '206': { start: 1998, end: 2012 },
        '207': { start: 2006, end: 2014 },
        '307': { start: 2001, end: 2008 },
        '407': { start: 2004, end: 2011 },
    },
    Fiat: {
        '500': { start: 2007, end: 2024 },
        Panda: { start: 1980, end: 2024 },
        Punto: { start: 1993, end: 2018 },
        Tipo: { start: 2016, end: 2024 },
        Ducato: { start: 1981, end: 2024 },
        Doblo: { start: 2001, end: 2024 },
        '500X': { start: 2015, end: 2024 },
        '500L': { start: 2013, end: 2024 },
    },
    Porsche: {
        '911': { start: 1964, end: 2024 },
        Cayenne: { start: 2003, end: 2024 },
        Macan: { start: 2014, end: 2024 },
        Panamera: { start: 2010, end: 2024 },
        Boxster: { start: 1997, end: 2024 },
        Cayman: { start: 2006, end: 2024 },
        Taycan: { start: 2020, end: 2024 },
    },
    Volvo: {
        XC60: { start: 2009, end: 2024 },
        XC90: { start: 2003, end: 2024 },
        XC40: { start: 2018, end: 2024 },
        S60: { start: 2001, end: 2024 },
        V60: { start: 2011, end: 2024 },
        S90: { start: 2017, end: 2024 },
        V40: { start: 2013, end: 2019 },
        V70: { start: 1997, end: 2016 },
    },
    Jaguar: {
        'F-Pace': { start: 2017, end: 2024 },
        'E-Pace': { start: 2018, end: 2024 },
        XE: { start: 2015, end: 2024 },
        XF: { start: 2008, end: 2024 },
        'F-Type': { start: 2014, end: 2024 },
        'X-Type': { start: 2001, end: 2009 },
        'S-Type': { start: 1999, end: 2008 },
    },
    'Land Rover': {
        'Range Rover': { start: 1970, end: 2024 },
        'Range Rover Sport': { start: 2005, end: 2024 },
        'Range Rover Evoque': { start: 2012, end: 2024 },
        Discovery: { start: 1989, end: 2024 },
        'Discovery Sport': { start: 2015, end: 2024 },
        Defender: { start: 1983, end: 2024 },
        Freelander: { start: 1997, end: 2014 },
    },
    Mini: {
        Cooper: { start: 2002, end: 2024 },
        Countryman: { start: 2011, end: 2024 },
        Clubman: { start: 2008, end: 2024 },
    },
    Smart: {
        ForTwo: { start: 1998, end: 2024 },
        ForFour: { start: 2004, end: 2024 },
    },
    Saab: {
        '9-3': { start: 1998, end: 2012 },
        '9-5': { start: 1997, end: 2012 },
    },
    // ── US LEGACY / OTHER ──────────────────────────────────────────────
    Jeep: {
        'Grand Cherokee': { start: 1993, end: 2024 },
        Wrangler: { start: 1987, end: 2024 },
        Cherokee: { start: 1984, end: 2024 },
        Compass: { start: 2007, end: 2024 },
        Renegade: { start: 2015, end: 2024 },
        Gladiator: { start: 2020, end: 2024 },
    },
    Dodge: {
        Ram: { start: 1981, end: 2024 },
        Charger: { start: 1966, end: 2024 },
        Challenger: { start: 1970, end: 2024 },
        Durango: { start: 1998, end: 2024 },
        Caravan: { start: 1984, end: 2020 },
    },
    Chrysler: {
        '300': { start: 2005, end: 2024 },
        Pacifica: { start: 2017, end: 2024 },
        'Town and Country': { start: 1990, end: 2016 },
        Voyager: { start: 2020, end: 2024 },
    },
    GMC: {
        Sierra: { start: 1999, end: 2024 },
        Terrain: { start: 2010, end: 2024 },
        Acadia: { start: 2007, end: 2024 },
        Yukon: { start: 1992, end: 2024 },
        Canyon: { start: 2004, end: 2024 },
    },
    Buick: {
        Encore: { start: 2013, end: 2024 },
        Enclave: { start: 2008, end: 2024 },
        Envision: { start: 2016, end: 2024 },
        Regal: { start: 1973, end: 2020 },
        LaCrosse: { start: 2005, end: 2019 },
    },
    Cadillac: {
        Escalade: { start: 1999, end: 2024 },
        XT5: { start: 2017, end: 2024 },
        CT5: { start: 2020, end: 2024 },
        XT4: { start: 2019, end: 2024 },
        CTS: { start: 2003, end: 2019 },
        SRX: { start: 2004, end: 2016 },
    },
    Lincoln: {
        Navigator: { start: 1998, end: 2024 },
        Aviator: { start: 2003, end: 2024 },
        Corsair: { start: 2020, end: 2024 },
        'MKZ': { start: 2007, end: 2020 },
    },
    Acura: {
        MDX: { start: 2001, end: 2024 },
        RDX: { start: 2007, end: 2024 },
        TLX: { start: 2015, end: 2024 },
        Integra: { start: 1986, end: 2024 },
        TSX: { start: 2004, end: 2014 },
    },
    Infiniti: {
        Q50: { start: 2014, end: 2024 },
        QX60: { start: 2014, end: 2024 },
        QX80: { start: 2014, end: 2024 },
        G35: { start: 2003, end: 2008 },
        G37: { start: 2008, end: 2013 },
    },
    Lexus: {
        RX: { start: 1999, end: 2024 },
        ES: { start: 1990, end: 2024 },
        NX: { start: 2015, end: 2024 },
        IS: { start: 1999, end: 2024 },
        GX: { start: 2003, end: 2024 },
        UX: { start: 2019, end: 2024 },
    },
    Subaru: {
        Outback: { start: 1995, end: 2024 },
        Forester: { start: 1998, end: 2024 },
        Crosstrek: { start: 2013, end: 2024 },
        Impreza: { start: 1993, end: 2024 },
        WRX: { start: 2002, end: 2024 },
        Legacy: { start: 1990, end: 2024 },
        Ascent: { start: 2019, end: 2024 },
    },
    Isuzu: {
        'D-Max': { start: 2002, end: 2024 },
        'MU-X': { start: 2013, end: 2024 },
        Rodeo: { start: 1989, end: 2004 },
        Trooper: { start: 1981, end: 2002 },
    },
    Daihatsu: {
        Terios: { start: 1997, end: 2024 },
        Sirion: { start: 1998, end: 2024 },
        Rocky: { start: 2019, end: 2024 },
    },
    // ── DEFUNCT / CLASSIC ──────────────────────────────────────────────
    Pontiac: {
        'Grand Am': { start: 1973, end: 2005 },
        'Grand Prix': { start: 1962, end: 2008 },
        Firebird: { start: 1967, end: 2002 },
        G6: { start: 2005, end: 2010 },
        Vibe: { start: 2003, end: 2010 },
    },
    Saturn: {
        Vue: { start: 2002, end: 2010 },
        Ion: { start: 2003, end: 2007 },
        Aura: { start: 2007, end: 2009 },
        Outlook: { start: 2007, end: 2010 },
    },
    Oldsmobile: {
        Alero: { start: 1999, end: 2004 },
        Intrigue: { start: 1998, end: 2002 },
        Silhouette: { start: 1990, end: 2004 },
        Bravada: { start: 1991, end: 2004 },
    },
    Mercury: {
        Mountaineer: { start: 1997, end: 2010 },
        Mariner: { start: 2005, end: 2011 },
        Sable: { start: 1986, end: 2009 },
        'Grand Marquis': { start: 1983, end: 2011 },
    },
    Plymouth: {
        Voyager: { start: 1974, end: 2000 },
        Neon: { start: 1995, end: 2001 },
        Breeze: { start: 1996, end: 2000 },
    },
    Geo: {
        Metro: { start: 1989, end: 1997 },
        Tracker: { start: 1989, end: 1997 },
        Prizm: { start: 1989, end: 1997 },
    },
    Eagle: {
        Talon: { start: 1990, end: 1998 },
        Vision: { start: 1993, end: 1997 },
    },
    Scion: {
        tC: { start: 2005, end: 2016 },
        xB: { start: 2004, end: 2015 },
        'FR-S': { start: 2013, end: 2016 },
    },
    Hummer: {
        H2: { start: 2003, end: 2009 },
        H3: { start: 2006, end: 2010 },
    },
    Daewoo: {
        Lanos: { start: 1997, end: 2002 },
        Nubira: { start: 1998, end: 2002 },
        Leganza: { start: 1997, end: 2002 },
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
    'timing-belt-replacement',
    'timing-chain-replacement',
    'cabin-air-filter-replacement',
    'engine-air-filter-replacement',
    'headlight-bulb-replacement',
    'tail-light-replacement',
    'fuel-filter-replacement',
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
