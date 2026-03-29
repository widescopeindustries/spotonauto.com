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
        Supra: { start: 2020, end: 2024 },
        'Land Cruiser': { start: 1958, end: 2024 },
        // ADDED
        Sequoia: { start: 2001, end: 2024 },
        Pickup: { start: 1978, end: 1995 },
        Celica: { start: 1971, end: 2005 },
        MR2: { start: 1985, end: 2005 },
        Matrix: { start: 2003, end: 2013 },
        Echo: { start: 2000, end: 2005 },
        Tercel: { start: 1982, end: 1999 },
        Venza: { start: 2009, end: 2021 },
        Solara: { start: 1999, end: 2008 },
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
        // ADDED
        Prelude: { start: 1982, end: 2001 },
        S2000: { start: 2000, end: 2009 },
        Passport: { start: 1994, end: 2002 },
        Crosstour: { start: 2010, end: 2015 },
        Insight: { start: 2000, end: 2014 },
        'Del Sol': { start: 1993, end: 1997 },
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
        Bronco: { start: 2021, end: 2024 },
        Expedition: { start: 1997, end: 2024 },
        Taurus: { start: 1986, end: 2019 },
        'F-250': { start: 1999, end: 2024 },
        Transit: { start: 2010, end: 2024 },          // FIXED: was 2015
        Fiesta: { start: 1978, end: 2019 },
        Mondeo: { start: 1993, end: 2022 },
        // ADDED
        Contour: { start: 1995, end: 2000 },
        Thunderbird: { start: 1955, end: 2005 },
        Escort: { start: 1982, end: 2002 },
        Bronco2: { start: 1984, end: 1990 },
        Tempo: { start: 1984, end: 1994 },
        Excursion: { start: 2000, end: 2005 },
        Flex: { start: 2009, end: 2019 },
        Probe: { start: 1989, end: 1997 },
        'Crown Victoria': { start: 1992, end: 2012 },
        Windstar: { start: 1995, end: 2003 },
        Freestyle: { start: 2005, end: 2007 },
        'Five Hundred': { start: 2005, end: 2007 },
    },
    Chevrolet: {
        Silverado: { start: 1999, end: 2024 },
        Equinox: { start: 2005, end: 2024 },
        Malibu: { start: 1997, end: 2024 },
        Tahoe: { start: 1995, end: 2024 },
        Suburban: { start: 1935, end: 2024 },
        Impala: { start: 1958, end: 2020 },
        Traverse: { start: 2009, end: 2024 },
        Colorado: { start: 2004, end: 2024 },
        Trax: { start: 2013, end: 2024 },              // FIXED: was 2015
        Blazer: { start: 2019, end: 2024 },
        Camaro: { start: 2010, end: 2024 },
        Corvette: { start: 1953, end: 2024 },
        // ADDED
        Cavalier: { start: 1982, end: 2005 },
        Cobalt: { start: 2005, end: 2010 },
        Cruze: { start: 2011, end: 2019 },
        Aveo: { start: 2004, end: 2011 },
        Sonic: { start: 2012, end: 2020 },
        Spark: { start: 2013, end: 2022 },
        Volt: { start: 2011, end: 2019 },
        'Monte Carlo': { start: 1970, end: 2007 },
        Lumina: { start: 1990, end: 2001 },
        Caprice: { start: 1965, end: 1996 },
        Astro: { start: 1985, end: 2005 },
        'HHR': { start: 2006, end: 2011 },
        TrailBlazer: { start: 2002, end: 2009 },
        Avalanche: { start: 2002, end: 2013 },
        Express: { start: 1996, end: 2024 },
        Beretta: { start: 1987, end: 1996 },
        Corsica: { start: 1987, end: 1996 },
        Celebrity: { start: 1982, end: 1990 },
        Prizm: { start: 1998, end: 2002 },
        Tracker: { start: 1999, end: 2004 },
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
        Juke: { start: 2011, end: 2017 },
        Micra: { start: 1982, end: 2024 },
        Note: { start: 2004, end: 2024 },
        // ADDED
        '240SX': { start: 1989, end: 1998 },
        '300ZX': { start: 1984, end: 1996 },
        '350Z': { start: 2003, end: 2009 },
        '370Z': { start: 2009, end: 2020 },
        Xterra: { start: 2000, end: 2015 },
        Quest: { start: 1993, end: 2017 },
        Cube: { start: 2009, end: 2014 },
        Leaf: { start: 2011, end: 2024 },
        Armada: { start: 2004, end: 2024 },
        NV200: { start: 2013, end: 2021 },
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
        // ADDED
        Accent: { start: 1995, end: 2022 },
        Tiburon: { start: 1997, end: 2008 },
        Azera: { start: 2006, end: 2017 },
        Genesis: { start: 2009, end: 2016 },
        Veloster: { start: 2012, end: 2022 },
        Ioniq: { start: 2017, end: 2024 },
        Equus: { start: 2011, end: 2016 },
        Entourage: { start: 2007, end: 2009 },
        Veracruz: { start: 2007, end: 2012 },
        'Santa Cruz': { start: 2022, end: 2024 },
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
        // ADDED
        Sephia: { start: 1993, end: 2001 },
        Spectra: { start: 2000, end: 2009 },
        Sedona: { start: 2002, end: 2021 },
        Rondo: { start: 2007, end: 2012 },
        Amanti: { start: 2004, end: 2009 },
        Stinger: { start: 2018, end: 2024 },
        Carnival: { start: 2022, end: 2024 },
    },
    Mazda: {
        '3': { start: 2004, end: 2024 },
        '6': { start: 2003, end: 2021 },
        'CX-5': { start: 2013, end: 2024 },
        'CX-9': { start: 2007, end: 2024 },
        'CX-30': { start: 2020, end: 2024 },
        'MX-5': { start: 1990, end: 2024 },
        '2': { start: 2008, end: 2024 },
        // ADDED
        Protege: { start: 1990, end: 2003 },
        'MX-6': { start: 1988, end: 1997 },
        'RX-7': { start: 1979, end: 1995 },
        'RX-8': { start: 2003, end: 2012 },
        Tribute: { start: 2001, end: 2011 },
        'CX-7': { start: 2007, end: 2012 },
        Millenia: { start: 1995, end: 2002 },
        '5': { start: 2006, end: 2015 },
        'B-Series': { start: 1982, end: 2010 },
        'CX-3': { start: 2016, end: 2023 },
        'MX-30': { start: 2022, end: 2024 },
    },
    Mitsubishi: {
        Outlander: { start: 2003, end: 2024 },
        Eclipse: { start: 1990, end: 2012 },
        'Eclipse Cross': { start: 2018, end: 2024 },
        Lancer: { start: 1973, end: 2017 },
        Pajero: { start: 1982, end: 2021 },
        'L200': { start: 1978, end: 2024 },
        ASX: { start: 2010, end: 2024 },
        // ADDED
        Galant: { start: 1985, end: 2012 },
        Mirage: { start: 1985, end: 2024 },
        Montero: { start: 1983, end: 2006 },
        '3000GT': { start: 1991, end: 1999 },
        Endeavor: { start: 2004, end: 2011 },
        Diamante: { start: 1992, end: 2004 },
        Sigma: { start: 1989, end: 1990 },
        Starion: { start: 1983, end: 1989 },
        'Outlander Sport': { start: 2011, end: 2024 },
        'i-MiEV': { start: 2012, end: 2017 },
    },
    Suzuki: {
        Swift: { start: 1984, end: 2024 },
        Vitara: { start: 1988, end: 2024 },
        Jimny: { start: 1970, end: 2024 },
        'SX4': { start: 2006, end: 2024 },
        Ignis: { start: 2000, end: 2024 },
        // ADDED
        'Grand Vitara': { start: 1999, end: 2013 },
        Sidekick: { start: 1989, end: 1998 },
        Samurai: { start: 1985, end: 1995 },
        Forenza: { start: 2004, end: 2008 },
        Verona: { start: 2004, end: 2006 },
        'XL-7': { start: 2001, end: 2009 },
        Kizashi: { start: 2010, end: 2013 },
        Equator: { start: 2009, end: 2012 },
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
        // ADDED
        M3: { start: 1988, end: 2024 },
        M5: { start: 1985, end: 2024 },
        Z3: { start: 1996, end: 2002 },
        Z4: { start: 2003, end: 2024 },
        '6 Series': { start: 2004, end: 2018 },
        '8 Series': { start: 1991, end: 1999 },
        i3: { start: 2014, end: 2021 },
        i8: { start: 2014, end: 2020 },
        X2: { start: 2018, end: 2024 },
        X4: { start: 2014, end: 2024 },
        X7: { start: 2019, end: 2024 },
        M2: { start: 2016, end: 2024 },
        M4: { start: 2014, end: 2024 },
        M6: { start: 1987, end: 2018 },
        M8: { start: 2020, end: 2024 },
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
        // ADDED
        SL: { start: 1990, end: 2024 },
        SLK: { start: 1997, end: 2016 },
        SLC: { start: 2016, end: 2020 },
        CLS: { start: 2006, end: 2023 },
        'ML-Class': { start: 1998, end: 2015 },
        'GL-Class': { start: 2007, end: 2016 },
        GLK: { start: 2010, end: 2015 },
        CLA: { start: 2014, end: 2024 },
        'B-Class': { start: 2014, end: 2019 },
        'AMG GT': { start: 2016, end: 2024 },
        'G-Class': { start: 1979, end: 2024 },
        GLS: { start: 2017, end: 2024 },
        Metris: { start: 2016, end: 2024 },
    },
    Volkswagen: {
        Golf: { start: 1985, end: 2021 },
        Jetta: { start: 1980, end: 2024 },
        Passat: { start: 1990, end: 2022 },
        Tiguan: { start: 2008, end: 2024 },
        Polo: { start: 1975, end: 2024 },
        'T-Roc': { start: 2018, end: 2024 },
        Touareg: { start: 2004, end: 2017 },
        Beetle: { start: 1938, end: 2019 },
        Atlas: { start: 2018, end: 2024 },
        Arteon: { start: 2017, end: 2024 },
        Caddy: { start: 1980, end: 2024 },
        Transporter: { start: 1950, end: 2024 },
        Up: { start: 2012, end: 2024 },
        // ADDED
        GTI: { start: 1983, end: 2024 },
        'New Beetle': { start: 1998, end: 2011 },
        Eurovan: { start: 1992, end: 2003 },
        CC: { start: 2009, end: 2017 },
        Eos: { start: 2007, end: 2016 },
        Routan: { start: 2009, end: 2013 },
        Phaeton: { start: 2004, end: 2006 },
        Rabbit: { start: 1975, end: 1984 },
        Scirocco: { start: 1975, end: 1989 },
        Corrado: { start: 1990, end: 1994 },
        ID4: { start: 2021, end: 2024 },
        Taos: { start: 2022, end: 2024 },
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
        // ADDED
        A5: { start: 2008, end: 2024 },
        A7: { start: 2012, end: 2024 },
        A8: { start: 1997, end: 2024 },
        S4: { start: 1992, end: 2024 },
        S5: { start: 2008, end: 2024 },
        S6: { start: 1995, end: 2024 },
        S8: { start: 1997, end: 2024 },
        R8: { start: 2008, end: 2023 },
        RS4: { start: 2007, end: 2023 },
        RS5: { start: 2010, end: 2023 },
        RS6: { start: 2003, end: 2004 },
        Allroad: { start: 2001, end: 2005 },
        Q8: { start: 2019, end: 2024 },
        Q4: { start: 2022, end: 2024 },
        e_tron: { start: 2019, end: 2024 },
    },
    Renault: {
        // OEM corpus models (1982-1987) — serves international audience
        'Alliance-Encore': { start: 1983, end: 1987 },
        Fuego: { start: 1982, end: 1986 },
        '18i-Sportwagon': { start: 1982, end: 1986 },
        'R5-LeCar': { start: 1982, end: 1983 },
        GTA: { start: 1987, end: 1987 },
    },
    Peugeot: {
        // OEM corpus models (1982-1991) — serves Africa, Middle East, Europe
        '504': { start: 1982, end: 1983 },
        '505': { start: 1982, end: 1991 },
        '604': { start: 1982, end: 1984 },
        '405': { start: 1989, end: 1991 },
    },
    Fiat: {
        // OEM corpus models (1982-1983, 2012-2013) — serves Europe, Latin America
        '124-Spider': { start: 1982, end: 1983 },
        'X1-9': { start: 1982, end: 1983 },
        '500': { start: 2012, end: 2024 },
        '500c': { start: 2012, end: 2024 },
        '500-Abarth': { start: 2012, end: 2024 },
        '500X': { start: 2015, end: 2024 },
        '500L': { start: 2013, end: 2020 },
    },
    Porsche: {
        '911': { start: 1964, end: 2024 },
        Cayenne: { start: 2003, end: 2024 },
        Macan: { start: 2014, end: 2024 },
        Panamera: { start: 2010, end: 2024 },
        Boxster: { start: 1997, end: 2024 },
        Cayman: { start: 2006, end: 2024 },
        Taycan: { start: 2020, end: 2024 },
        // ADDED
        '944': { start: 1982, end: 1991 },
        '928': { start: 1978, end: 1995 },
        '968': { start: 1992, end: 1995 },
        '924': { start: 1977, end: 1988 },
        'Cayenne Coupe': { start: 2020, end: 2024 },
    },
    Volvo: {
        XC60: { start: 2009, end: 2024 },
        XC90: { start: 2003, end: 2024 },
        XC40: { start: 2018, end: 2024 },
        S60: { start: 2001, end: 2024 },
        V60: { start: 2011, end: 2024 },
        S90: { start: 2017, end: 2024 },
        V40: { start: 2000, end: 2019 },               // FIXED: was 2013
        V70: { start: 1997, end: 2016 },
        // ADDED
        '240': { start: 1982, end: 1993 },
        '740': { start: 1985, end: 1992 },
        '760': { start: 1983, end: 1990 },
        '850': { start: 1993, end: 1997 },
        '940': { start: 1991, end: 1995 },
        S40: { start: 1997, end: 2012 },
        S70: { start: 1998, end: 2000 },
        S80: { start: 1999, end: 2016 },
        C70: { start: 1998, end: 2013 },
        V50: { start: 2005, end: 2012 },
        C30: { start: 2007, end: 2013 },
        XC70: { start: 2003, end: 2016 },
    },
    Jaguar: {
        'F-Pace': { start: 2017, end: 2024 },
        'E-Pace': { start: 2018, end: 2024 },
        XE: { start: 2015, end: 2024 },
        XF: { start: 2008, end: 2024 },
        'F-Type': { start: 2014, end: 2024 },
        'X-Type': { start: 2001, end: 2009 },
        'S-Type': { start: 1999, end: 2008 },
        // ADDED
        'XJ': { start: 1982, end: 2019 },
        'XK': { start: 1997, end: 2014 },
        'I-Pace': { start: 2019, end: 2024 },
    },
    'Land Rover': {
        'Range Rover': { start: 1970, end: 2024 },
        'Range Rover Sport': { start: 2005, end: 2024 },
        'Range Rover Evoque': { start: 2012, end: 2024 },
        Discovery: { start: 1989, end: 2024 },
        'Discovery Sport': { start: 2015, end: 2024 },
        Defender: { start: 1983, end: 2024 },
        Freelander: { start: 1997, end: 2014 },
        // ADDED
        LR2: { start: 2008, end: 2015 },
        LR3: { start: 2005, end: 2009 },
        LR4: { start: 2010, end: 2016 },
        'Range Rover Velar': { start: 2018, end: 2024 },
    },
    Mini: {
        Cooper: { start: 2002, end: 2024 },
        Countryman: { start: 2011, end: 2024 },
        Clubman: { start: 2008, end: 2024 },
        // ADDED
        Paceman: { start: 2013, end: 2016 },
        Coupe: { start: 2012, end: 2015 },
        Roadster: { start: 2012, end: 2015 },
        Convertible: { start: 2005, end: 2024 },
    },
    Smart: {
        // OEM corpus models (2008-2013) — serves Europe
        ForTwo: { start: 2008, end: 2013 },
    },
    Saab: {
        // OEM corpus models — serves Scandinavia, Europe. Defunct 2012 but huge international following.
        '900': { start: 1982, end: 1998 },
        '9000': { start: 1986, end: 1998 },
        '9-3': { start: 1999, end: 2011 },
        '9-5': { start: 1999, end: 2011 },
        '9-2X': { start: 2005, end: 2006 },
        '9-7X': { start: 2005, end: 2009 },
    },
    // ── US LEGACY / OTHER ──────────────────────────────────────────────
    Jeep: {
        'Grand Cherokee': { start: 1993, end: 2024 },
        Wrangler: { start: 1986, end: 2024 },          // FIXED: was 1987
        Cherokee: { start: 1982, end: 2024 },           // FIXED: was 1984
        Compass: { start: 2007, end: 2024 },
        Renegade: { start: 2015, end: 2024 },
        Gladiator: { start: 2020, end: 2024 },
        // ADDED
        Liberty: { start: 2002, end: 2012 },
        Patriot: { start: 2007, end: 2017 },
        Commander: { start: 2006, end: 2010 },
        'Grand Wagoneer': { start: 1984, end: 1991 },
        Wagoneer: { start: 1963, end: 1991 },
        'Grand Wagoneer (new)': { start: 2022, end: 2024 },
        'Wagoneer (new)': { start: 2022, end: 2024 },
    },
    Dodge: {
        Ram: { start: 1981, end: 2010 },
        Charger: { start: 2006, end: 2024 },
        Challenger: { start: 2008, end: 2024 },
        Durango: { start: 1998, end: 2024 },
        Caravan: { start: 1984, end: 2020 },
        // ADDED
        Neon: { start: 1995, end: 2005 },
        Stratus: { start: 1995, end: 2006 },
        Viper: { start: 1992, end: 2017 },
        Avenger: { start: 2008, end: 2014 },
        Journey: { start: 2009, end: 2020 },
        Caliber: { start: 2007, end: 2012 },
        Dakota: { start: 1987, end: 2011 },
        Magnum: { start: 2005, end: 2008 },
        Nitro: { start: 2007, end: 2012 },
        Dart: { start: 2013, end: 2016 },
        'Grand Caravan': { start: 1984, end: 2020 },
    },
    Chrysler: {
        '300': { start: 1999, end: 2024 },              // FIXED: was 2005
        Pacifica: { start: 2004, end: 2024 },            // FIXED: was 2017
        'Town and Country': { start: 1990, end: 2016 },
        Voyager: { start: 2020, end: 2024 },
        // ADDED
        'PT Cruiser': { start: 2001, end: 2010 },
        Sebring: { start: 1995, end: 2010 },
        Concorde: { start: 1993, end: 2004 },
        LHS: { start: 1994, end: 2001 },
        Cirrus: { start: 1995, end: 2000 },
        Aspen: { start: 2007, end: 2009 },
        '200': { start: 2011, end: 2017 },
        Crossfire: { start: 2004, end: 2008 },
        'New Yorker': { start: 1982, end: 1996 },
    },
    GMC: {
        Sierra: { start: 1999, end: 2024 },
        Terrain: { start: 2010, end: 2024 },
        Acadia: { start: 2007, end: 2024 },
        Yukon: { start: 1992, end: 2024 },
        Canyon: { start: 2004, end: 2024 },
        // ADDED
        Safari: { start: 1985, end: 2005 },
        Jimmy: { start: 1970, end: 2005 },
        Envoy: { start: 1998, end: 2009 },
        Sonoma: { start: 1994, end: 2004 },
        Typhoon: { start: 1992, end: 1993 },
        Syclone: { start: 1991, end: 1992 },
        Savana: { start: 1996, end: 2024 },
        'Yukon XL': { start: 2000, end: 2024 },
        Hummer: { start: 2022, end: 2024 },
    },
    Buick: {
        Encore: { start: 2013, end: 2024 },
        Enclave: { start: 2008, end: 2024 },
        Envision: { start: 2016, end: 2024 },
        Regal: { start: 1973, end: 2020 },
        LaCrosse: { start: 2005, end: 2019 },
        // ADDED
        LeSabre: { start: 1977, end: 2005 },
        Century: { start: 1981, end: 2005 },
        Riviera: { start: 1963, end: 1999 },
        Skylark: { start: 1961, end: 1998 },
        'Park Avenue': { start: 1991, end: 2005 },
        Rendezvous: { start: 2002, end: 2007 },
        Rainier: { start: 2004, end: 2007 },
        Verano: { start: 2012, end: 2017 },
        Lucerne: { start: 2006, end: 2011 },
        Allure: { start: 2005, end: 2010 },
        Electra: { start: 1954, end: 1990 },
        Roadmaster: { start: 1991, end: 1996 },
    },
    Cadillac: {
        Escalade: { start: 1999, end: 2024 },
        XT5: { start: 2017, end: 2024 },
        CT5: { start: 2020, end: 2024 },
        XT4: { start: 2019, end: 2024 },
        CTS: { start: 2003, end: 2019 },
        SRX: { start: 2004, end: 2016 },
        // ADDED
        DeVille: { start: 1960, end: 2005 },
        Seville: { start: 1976, end: 2004 },
        Eldorado: { start: 1953, end: 2002 },
        Fleetwood: { start: 1976, end: 1996 },
        DTS: { start: 2006, end: 2011 },
        ATS: { start: 2013, end: 2019 },
        XTS: { start: 2013, end: 2019 },
        STS: { start: 2005, end: 2011 },
        'Escalade ESV': { start: 2004, end: 2024 },
        CT4: { start: 2020, end: 2024 },
        CT6: { start: 2016, end: 2020 },
        XT6: { start: 2020, end: 2024 },
        Catera: { start: 1997, end: 2001 },
        Allante: { start: 1987, end: 1993 },
    },
    Lincoln: {
        Navigator: { start: 1998, end: 2024 },
        Aviator: { start: 2020, end: 2024 },
        Corsair: { start: 2020, end: 2024 },
        MKZ: { start: 2007, end: 2020 },
        // ADDED
        'Town Car': { start: 1981, end: 2011 },
        Continental: { start: 1982, end: 2002 },
        'Mark VII': { start: 1984, end: 1992 },
        'Mark VIII': { start: 1993, end: 1998 },
        MKX: { start: 2007, end: 2018 },
        Nautilus: { start: 2019, end: 2024 },
        MKS: { start: 2009, end: 2016 },
        MKT: { start: 2010, end: 2019 },
        MKC: { start: 2015, end: 2019 },
        Zephyr: { start: 2006, end: 2006 },
        Blackwood: { start: 2002, end: 2002 },
        'Mark LT': { start: 2006, end: 2008 },
    },
    Acura: {
        MDX: { start: 2001, end: 2024 },
        RDX: { start: 2007, end: 2024 },
        TLX: { start: 2015, end: 2024 },
        Integra: { start: 1986, end: 2024 },
        TSX: { start: 2004, end: 2014 },
        // ADDED
        TL: { start: 1996, end: 2014 },
        RL: { start: 1996, end: 2012 },
        RLX: { start: 2014, end: 2020 },
        Legend: { start: 1986, end: 1995 },
        CL: { start: 1997, end: 2003 },
        RSX: { start: 2002, end: 2006 },
        ZDX: { start: 2010, end: 2013 },
        ILX: { start: 2013, end: 2022 },
        CDX: { start: 2017, end: 2021 },
        NSX: { start: 1991, end: 2022 },
        SLX: { start: 1996, end: 1999 },
        Vigor: { start: 1992, end: 1994 },
    },
    Infiniti: {
        Q50: { start: 2014, end: 2024 },
        QX60: { start: 2014, end: 2024 },
        QX80: { start: 2014, end: 2024 },
        G35: { start: 2003, end: 2008 },
        G37: { start: 2008, end: 2013 },
        // ADDED
        Q45: { start: 1990, end: 2006 },
        I30: { start: 1996, end: 2001 },
        I35: { start: 2002, end: 2004 },
        FX35: { start: 2003, end: 2013 },
        FX45: { start: 2003, end: 2008 },
        FX50: { start: 2009, end: 2013 },
        M35: { start: 2006, end: 2013 },
        M37: { start: 2011, end: 2013 },
        M45: { start: 2003, end: 2013 },
        M56: { start: 2011, end: 2013 },
        EX35: { start: 2008, end: 2012 },
        EX37: { start: 2013, end: 2013 },
        JX35: { start: 2013, end: 2013 },
        QX4: { start: 1997, end: 2003 },
        QX56: { start: 2004, end: 2013 },
        G25: { start: 2011, end: 2012 },
        Q60: { start: 2017, end: 2024 },
        Q70: { start: 2014, end: 2019 },
        QX30: { start: 2017, end: 2019 },
        QX50: { start: 2014, end: 2024 },
        QX55: { start: 2022, end: 2024 },
        QX70: { start: 2014, end: 2017 },
    },
    Lexus: {
        RX: { start: 1999, end: 2024 },
        ES: { start: 1990, end: 2024 },
        NX: { start: 2015, end: 2024 },
        IS: { start: 1999, end: 2024 },
        GX: { start: 2003, end: 2024 },
        UX: { start: 2019, end: 2024 },
        // ADDED
        LS: { start: 1990, end: 2024 },
        GS: { start: 1993, end: 2020 },
        SC: { start: 1992, end: 2010 },
        LX: { start: 1998, end: 2024 },
        CT: { start: 2011, end: 2021 },
        HS: { start: 2010, end: 2012 },
        RC: { start: 2015, end: 2024 },
        LC: { start: 2018, end: 2024 },
        RZ: { start: 2023, end: 2024 },
    },
    Subaru: {
        Outback: { start: 1995, end: 2024 },
        Forester: { start: 1998, end: 2024 },
        Crosstrek: { start: 2013, end: 2024 },
        Impreza: { start: 1993, end: 2024 },
        WRX: { start: 2002, end: 2024 },
        Legacy: { start: 1990, end: 2024 },
        Ascent: { start: 2019, end: 2024 },
        // ADDED
        BRZ: { start: 2013, end: 2024 },
        Tribeca: { start: 2006, end: 2014 },
        Baja: { start: 2003, end: 2006 },
        SVX: { start: 1992, end: 1997 },
        Justy: { start: 1987, end: 1994 },
        Loyale: { start: 1988, end: 1994 },
        Solterra: { start: 2023, end: 2024 },
    },
    Isuzu: {
        'D-Max': { start: 2002, end: 2024 },
        'MU-X': { start: 2013, end: 2024 },
        Rodeo: { start: 1989, end: 2004 },
        Trooper: { start: 1981, end: 2002 },
        // ADDED
        Pickup: { start: 1982, end: 1996 },
        Amigo: { start: 1989, end: 2001 },
        Ascender: { start: 2003, end: 2008 },
        'i-Series': { start: 2006, end: 2008 },
        VehiCROSS: { start: 1999, end: 2001 },
        Oasis: { start: 1996, end: 1999 },
        Axiom: { start: 2002, end: 2004 },
        'I-Mark': { start: 1982, end: 1989 },
        Impulse: { start: 1983, end: 1993 },
    },
    Daihatsu: {
        // OEM corpus models — serves Japan, SE Asia, Australia
        Charade: { start: 1988, end: 1992 },
        Rocky: { start: 1990, end: 1992 },
    },
    // ── DEFUNCT / CLASSIC ──────────────────────────────────────────────
    Pontiac: {
        'Grand Am': { start: 1973, end: 2005 },
        'Grand Prix': { start: 1962, end: 2008 },
        Firebird: { start: 1967, end: 2002 },
        G6: { start: 2005, end: 2010 },
        Vibe: { start: 2003, end: 2010 },
        // ADDED
        Bonneville: { start: 1982, end: 2005 },
        Sunfire: { start: 1995, end: 2005 },
        'Trans Am': { start: 1969, end: 2002 },
        Aztek: { start: 2001, end: 2005 },
        Torrent: { start: 2006, end: 2009 },
        G5: { start: 2007, end: 2010 },
        G8: { start: 2008, end: 2009 },
        Montana: { start: 1999, end: 2009 },
        Solstice: { start: 2006, end: 2009 },
        'Trans Sport': { start: 1990, end: 1999 },
        Lemans: { start: 1988, end: 1993 },
        Fiero: { start: 1984, end: 1988 },
        '6000': { start: 1982, end: 1991 },
        Sunbird: { start: 1976, end: 1994 },
    },
    Saturn: {
        Vue: { start: 2002, end: 2010 },
        Ion: { start: 2003, end: 2007 },
        Aura: { start: 2007, end: 2009 },
        Outlook: { start: 2007, end: 2010 },
        // ADDED
        SC: { start: 1991, end: 2002 },
        SL: { start: 1991, end: 2002 },
        SW: { start: 1993, end: 2001 },
        'L-Series': { start: 2000, end: 2005 },
        Sky: { start: 2007, end: 2009 },
        Relay: { start: 2005, end: 2007 },
        Astra: { start: 2008, end: 2009 },
    },
    Oldsmobile: {
        Alero: { start: 1999, end: 2004 },
        Intrigue: { start: 1998, end: 2002 },
        Silhouette: { start: 1990, end: 2004 },
        Bravada: { start: 1991, end: 2004 },
        // ADDED
        '88': { start: 1982, end: 1999 },
        Cutlass: { start: 1982, end: 1999 },
        'Cutlass Ciera': { start: 1982, end: 1996 },
        'Cutlass Supreme': { start: 1982, end: 1997 },
        Aurora: { start: 1995, end: 2003 },
        'Ninety-Eight': { start: 1982, end: 1996 },
        Toronado: { start: 1982, end: 1992 },
        Achieva: { start: 1992, end: 1998 },
        Calais: { start: 1985, end: 1991 },
        'Custom Cruiser': { start: 1985, end: 1992 },
        'Cutlass Calais': { start: 1985, end: 1991 },
        Firenza: { start: 1982, end: 1988 },
        Omega: { start: 1982, end: 1984 },
        LSS: { start: 1996, end: 1999 },
        Regency: { start: 1982, end: 1998 },
    },
    Mercury: {
        Mountaineer: { start: 1997, end: 2010 },
        Mariner: { start: 2005, end: 2011 },
        Sable: { start: 1986, end: 2009 },
        'Grand Marquis': { start: 1982, end: 2011 },   // FIXED: was 1983
        // ADDED
        Tracer: { start: 1988, end: 1999 },
        Mystique: { start: 1995, end: 2000 },
        Cougar: { start: 1999, end: 2002 },
        Villager: { start: 1993, end: 2002 },
        Topaz: { start: 1984, end: 1994 },
        Lynx: { start: 1981, end: 1987 },
        Milan: { start: 2006, end: 2011 },
        Monterey: { start: 2004, end: 2007 },
        Montego: { start: 2005, end: 2007 },
        Marauder: { start: 2003, end: 2004 },
        'Colony Park': { start: 1982, end: 1991 },
        Capri: { start: 1979, end: 1986 },
        Merkur: { start: 1985, end: 1989 },
    },
    Plymouth: {
        Voyager: { start: 1974, end: 2000 },
        Neon: { start: 1995, end: 2001 },
        Breeze: { start: 1996, end: 2000 },
        // ADDED
        Colt: { start: 1971, end: 1994 },
        Acclaim: { start: 1989, end: 1995 },
        Sundance: { start: 1987, end: 1994 },
        Reliant: { start: 1981, end: 1989 },
        Horizon: { start: 1978, end: 1990 },
        Laser: { start: 1990, end: 1994 },
        'Grand Voyager': { start: 1988, end: 2000 },
        Barracuda: { start: 1964, end: 1974 },
        Duster: { start: 1970, end: 1976 },
        Fury: { start: 1956, end: 1989 },
        'Colt Vista': { start: 1984, end: 1994 },
        Turismo: { start: 1982, end: 1987 },
        Conquest: { start: 1984, end: 1989 },
        Caravelle: { start: 1985, end: 1988 },
        Prowler: { start: 1997, end: 2002 },
    },
    Geo: {
        Metro: { start: 1989, end: 1997 },
        Tracker: { start: 1989, end: 1997 },
        Prizm: { start: 1989, end: 1997 },
        // ADDED
        Storm: { start: 1990, end: 1993 },
        Spectrum: { start: 1985, end: 1989 },
    },
    Eagle: {
        Talon: { start: 1990, end: 1998 },
        Vision: { start: 1993, end: 1997 },
        // ADDED
        Summit: { start: 1989, end: 1996 },
        Premier: { start: 1988, end: 1992 },
        Medallion: { start: 1988, end: 1989 },
    },
    Scion: {
        tC: { start: 2005, end: 2016 },
        xB: { start: 2004, end: 2015 },
        'FR-S': { start: 2013, end: 2016 },
        // ADDED
        xA: { start: 2004, end: 2006 },
        xD: { start: 2008, end: 2014 },
        iQ: { start: 2012, end: 2015 },
        iM: { start: 2016, end: 2016 },
        iA: { start: 2016, end: 2016 },
    },
    Hummer: {
        H2: { start: 2003, end: 2009 },
        H3: { start: 2006, end: 2010 },
        // ADDED
        H1: { start: 1992, end: 2006 },
    },
    Daewoo: {
        // OEM corpus models — serves Korea, Eastern Europe, Latin America
        Lanos: { start: 1999, end: 2002 },
        Nubira: { start: 1999, end: 2002 },
        Leganza: { start: 1999, end: 2002 },
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
    const key = `${make.toLowerCase()}:${model.toLowerCase().replace(/\s+/g, '-')}`;
    return NON_US_MODELS.has(key);
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

export function isTaskValidForVehicle(make: string, model: string, task: string): boolean {
    if (isEvModel(make, model) && ICE_ONLY_TASKS.has(task)) return false;
    return true;
}

export function slugifyRoutePart(value: string): string {
    return decodeURIComponent(value)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
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
