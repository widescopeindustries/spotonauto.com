# Vehicle Data Gap Analysis
**Date:** 2026-03-24  
**Source:** Compared `VEHICLE_PRODUCTION_YEARS` in `src/data/vehicles.ts` against `vehicle-index.json` (24,935 entries, 12 makes KG-only)

---

## Summary

| Category | Count |
|---|---|
| Makes in vehicles.ts missing from knowledge graph | Several (defunct/non-US) |
| Makes in knowledge graph NOT in vehicles.ts | 12 |
| Missing models (in existing makes) | 3,888 |
| **High-value consumer models missing** | **~144** |
| Year range mismatches | 45 |

---

## 1. Missing Makes (in KG but not vehicles.ts)

These are in the knowledge graph but absent from `VEHICLE_PRODUCTION_YEARS`:

| Make | Notes |
|---|---|
| **Dodge** | Entire Dodge lineup missing — Neon, Stratus, Viper, Avenger, Journey, Caliber, Dakota |
| **Mercedes Benz** | KG uses "Mercedes Benz" (with space), vehicles.ts uses "Mercedes" — may be a name mismatch |
| **Nissan-Datsun** | Old Datsun naming — may be covered by "Nissan" |
| **Saab** | Was deliberately removed ("defunct 2012, 0 GSC impressions") |
| **Daewoo** | Was deliberately removed |
| **Daihatsu** | 2 models only |
| **Freightliner** | Commercial trucks |
| **Peugeot** | Was deliberately removed |
| **SRT** | 1 model — SRT brand |
| **UD** | Commercial trucks |
| **Workhorse** | Commercial |
| **Yugo** | 5 models, defunct |

**Action required:** Dodge is a major gap. Mercedes Benz naming likely needs reconciliation.

---

## 2. Critical Missing Models (High Traffic)

### Acura
| Model | KG Range | Action |
|---|---|---|
| **TL** | 1996–2014 | ⚠️ MAJOR — was Acura's best-seller for years |
| **RL** | 1996–2012 | Add flagship sedan |
| **Legend** | 1986–1995 | Add classic |
| **CL** | 1997–2003 | Add coupe |
| **RSX** | 2002–2006 | Add sporty coupe |
| **ZDX** | 2010–2013 | Add crossover |
| **ILX** | 2013–2022 | Add compact luxury |

### Honda
| Model | KG Range | Action |
|---|---|---|
| **Prelude** | 1982–2001 | 24 KG entries — major miss |
| **S2000** | 2000–2009 | Popular sports car |
| **Passport** | 1994–2002 | Popular SUV |
| **Crosstour** | 2010–2015 | Add crossover |
| **Insight** | 2000–2014 | Add hybrid |
| **Del Sol** | 1993–1997 | Add coupe |

### Toyota
| Model | KG Range | Action |
|---|---|---|
| **Sequoia** | 2001–2024 | ⚠️ MAJOR — full-size SUV entirely missing |
| **Pickup** | 1978–1995 | 16 KG entries — pre-Tacoma pickup |
| **Celica** | 1971–2005 | Iconic sports car |
| **MR2** | 1985–2005 | Popular sports car |
| **Matrix** | 2003–2013 | Popular hatchback |
| **Echo** | 2000–2005 | Add subcompact |
| **Tercel** | 1982–1999 | Classic compact |
| **Venza** | 2009–2021 | Add crossover |
| **Solara** | 1999–2008 | Add coupe/convertible |

### Lexus
| Model | KG Range | Action |
|---|---|---|
| **LS** | 1990–2024 | ⚠️ MAJOR — flagship luxury sedan |
| **GS** | 1993–2020 | Popular luxury sedan |
| **SC** | 1992–2010 | Luxury coupe |
| **LX** | 1998–2024 | Flagship luxury SUV |
| **GS 350/460** | 2007–2013 | (part of GS) |
| **CT** | 2011–2021 | Hybrid hatchback |

### Infiniti
| Model | KG Range | Action |
|---|---|---|
| **Q45** | 1990–2006 | 12 KG entries — flagship sedan |
| **I30/I35** | 1996–2004 | Popular luxury sedan |
| **FX35/FX45** | 2003–2013 | Popular luxury SUV |
| **M35/M37** | 2006–2013 | Popular luxury sedan |
| **EX35** | 2008–2012 | Popular crossover |
| **QX56** | 2004–2013 | Full-size luxury SUV |

### Mitsubishi
| Model | KG Range | Action |
|---|---|---|
| **Galant** | 1985–2012 | 16 KG entries — popular sedan |
| **Mirage** | 1985–2016 | 24 KG entries — popular subcompact |
| **Montero** | 1983–2006 | 12+ KG entries — popular SUV |
| **3000GT** | 1991–1999 | Popular sports car |
| **Endeavor** | 2004–2011 | Popular crossover |
| **Diamante** | 1992–2004 | Luxury sedan |

### Chrysler
| Model | KG Range | Action |
|---|---|---|
| **PT Cruiser** | 2001–2010 | ⚠️ Very popular — major miss |
| **Sebring** | 1995–2010 | Popular sedan/convertible |
| **Concorde** | 1993–2004 | Popular large sedan |
| **LHS** | 1994–2001 | Luxury sedan |

### Dodge (entire make missing)
| Model | Range | Action |
|---|---|---|
| **Neon** | 1995–2005 | Very popular compact |
| **Stratus** | 1995–2006 | Popular mid-size |
| **Viper** | 1992–2017 | Iconic sports car |
| **Avenger** | 2008–2014 | Popular sedan |
| **Journey** | 2009–2020 | Popular crossover |
| **Caliber** | 2007–2012 | Popular hatchback |
| **Dakota** | 1987–2011 | Popular mid-size truck |
| **Magnum** | 2005–2008 | Popular wagon |
| **Nitro** | 2007–2012 | Popular SUV |

### BMW
| Model | KG Range | Action |
|---|---|---|
| **M3** | 1988–2024 | ⚠️ Iconic — major miss |
| **M5** | 1985–2024 | Iconic performance sedan |
| **Z3** | 1996–2002 | Popular roadster |
| **Z4** | 2003–2024 | Popular roadster |
| **6 Series** | 2004–2018 | Missing grand tourer |
| **8 Series** | 1991–1999 | Classic grand tourer |
| **i3** | 2014–2021 | Popular EV |

### Mercedes (name mismatch issue)
The KG uses "Mercedes Benz" but vehicles.ts uses "Mercedes". Models that need adding:
| Model | Notes |
|---|---|
| **SL** | Flagship roadster |
| **SLK/SLC** | Popular roadster |
| **CLS** | Popular 4-door coupe |
| **ML/GLE** (old) | M-Class was hugely popular 1998–2015 |
| **GL/GLS** (old) | Large SUV |
| **GLK/GLC** (old) | Compact SUV predecessor |
| **CLA** | Very popular entry luxury |
| **B-Class** | European compact |
| **AMG GT** | Performance flagship |

### Volvo
| Model | KG Range | Action |
|---|---|---|
| **240** | 1982–1993 | 19 KG entries — classic |
| **740** | 1985–1992 | 12 KG entries — classic |
| **760** | 1983–1990 | 20 KG entries — classic |
| **850** | 1993–1997 | Popular 90s sedan |
| **940** | 1991–1995 | 12 KG entries — classic |
| **S40** | 1997–2012 | Popular compact sedan |
| **S70** | 1998–2000 | Popular sedan |
| **S80** | 1999–2016 | Flagship sedan |
| **C70** | 1998–2013 | Coupe/convertible |
| **V50** | 2005–2012 | Popular wagon |

### Audi
| Model | KG Range | Action |
|---|---|---|
| **A5** | 2008–2024 | Very popular coupe/convertible |
| **A7** | 2012–2024 | Popular hatchback |
| **A8** | 1997–2024 | Flagship sedan |
| **S4** | 1992–2024 | Performance sedan |
| **S5** | 2008–2024 | Performance coupe |
| **S6** | 1995–2024 | Performance sedan |
| **R8** | 2008–2023 | Supercar |
| **RS4** | 2007–2023 | Performance sedan |
| **Q8** | 2019–2024 | Flagship SUV |
| **Allroad** | 2001–2005 | Popular all-road wagon |

### Buick
| Model | KG Range | Action |
|---|---|---|
| **LeSabre** | 1977–2005 | Major classic full-size |
| **Century** | 1981–2005 | Popular mid-size |
| **Riviera** | 1963–1999 | Classic luxury coupe |
| **Skylark** | 1961–1998 | Classic compact |
| **Park Avenue** | 1991–2005 | Luxury sedan |
| **Rendezvous** | 2002–2007 | Popular crossover |
| **Rainier** | 2004–2007 | SUV |

### Cadillac
| Model | KG Range | Action |
|---|---|---|
| **DeVille** | 1960–2005 | Major classic luxury |
| **Seville** | 1976–2004 | Luxury sedan |
| **Eldorado** | 1953–2002 | Classic coupe |
| **Fleetwood** | 1976–1996 | Classic |
| **DTS** | 2006–2011 | Full-size luxury |
| **ATS** | 2013–2019 | Compact luxury |
| **XTS** | 2013–2019 | Full-size luxury |
| **STS** | 2005–2011 | Luxury sedan |

### Mazda
| Model | KG Range | Action |
|---|---|---|
| **Protege** | 1990–2003 | 12 KG entries — popular compact |
| **MX-6** | 1988–1997 | 18 KG entries — popular coupe |
| **RX-7** | 1979–1995 | Iconic sports car |
| **Tribute** | 2001–2011 | Popular SUV (Ford Escape twin) |
| **CX-7** | 2007–2012 | Popular crossover |
| **Millenia** | 1995–2002 | Luxury sedan |

### Volkswagen
| Model | KG Range | Action |
|---|---|---|
| **GTI** | 1983–2024 | ⚠️ Very popular — missing |
| **New Beetle** | 1998–2011 | Popular retro car |
| **Eurovan** | 1992–2003 | 14 KG entries |
| **CC** | 2009–2017 | Popular luxury coupe |
| **Eos** | 2007–2016 | Convertible |
| **Routan** | 2009–2013 | Minivan |

### Lincoln
| Model | KG Range | Action |
|---|---|---|
| **Town Car** | 1981–2011 | Major classic luxury |
| **Continental** | 1982–2002 | Classic |
| **MKX/Nautilus** | 2007–2024 | Popular luxury SUV |
| **MKS** | 2009–2016 | Luxury sedan |
| **MKT** | 2010–2019 | Luxury wagon |

### Pontiac
| Model | KG Range | Action |
|---|---|---|
| **Bonneville** | 1982–2005 | Major classic full-size |
| **Sunfire** | 1995–2005 | Popular compact |
| **Aztek** | 2001–2005 | SUV (cult classic now) |
| **Torrent** | 2006–2009 | Crossover |
| **G5** | 2007–2010 | Compact |
| **G8** | 2008–2009 | Sport sedan |

---

## 3. Year Range Mismatches

These models exist in vehicles.ts but the year range is wrong vs. the knowledge graph:

| Make | Model | Current TS Range | KG Min | Fix |
|---|---|---|---|---|
| Acura | TLX | 2015–2024 | 1995 | TLX appears as "TL" in older KG entries; KG also has separate TLX |
| Chevrolet | Trax | 2015–2024 | 2013 | Change start to 2013 |
| Chrysler | 300 | 2005–2024 | 1999 | Change start to 1999 (LH-body 300M era) |
| Chrysler | Voyager | 2020–2024 | 2000 | Change start to 2000 (also extends to 2003 in KG) |
| Chrysler | Pacifica | 2017–2024 | 2004 | Change start to 2004 (original Pacifica crossover) |
| Ford | Transit | 2015–2024 | 2010 | Change start to 2010 (full-size Transit Connect era) |
| Jeep | Cherokee | 1984–2024 | 1982 | Change start to 1982 |
| Jeep | Wrangler | 1987–2024 | 1986 | Change start to 1986 (YJ era) |
| Mercury | Grand Marquis | 1983–2011 | 1982 | Change start to 1982 |
| Volvo | S90 | 2017–2024 | 1998 | Add legacy S90 range 1998–1998 OR start at 1998 |
| Volvo | V40 | 2013–2019 | 2000 | Change start to 2000 (first gen V40 in US) |
| Mazda | 3 | 2004–2024 | 1982 (Mazda 323) | Issue: KG has old "3" = Mazda 323/GLC; fine to keep at 2004 for current model |
| Mazda | 6 | 2003–2021 | 1982 | Issue: KG has old Mazda 6 = 626/Capella; fine to keep at 2003 |

---

## 4. Updated VEHICLE_PRODUCTION_YEARS TypeScript

Ready to paste — paste this entire block to replace the current `VEHICLE_PRODUCTION_YEARS` object in `src/data/vehicles.ts`:

```typescript
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
        // ADDED
        Sequoia: { start: 2001, end: 2024 },
        Pickup: { start: 1978, end: 1995 },    // Pre-Tacoma compact pickup
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
        Bronco: { start: 1966, end: 2024 },
        Expedition: { start: 1997, end: 2024 },
        Taurus: { start: 1986, end: 2019 },
        'F-250': { start: 1999, end: 2024 },
        Transit: { start: 2010, end: 2024 },    // FIXED: was 2015, KG has 2010
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
        Malibu: { start: 1964, end: 2024 },
        Tahoe: { start: 1995, end: 2024 },
        Suburban: { start: 1935, end: 2024 },
        Impala: { start: 1958, end: 2020 },
        Traverse: { start: 2009, end: 2024 },
        Colorado: { start: 2004, end: 2024 },
        Trax: { start: 2013, end: 2024 },        // FIXED: was 2015, KG has 2013
        Blazer: { start: 1969, end: 2024 },
        Camaro: { start: 1967, end: 2024 },
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
        Juke: { start: 2011, end: 2024 },
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
        Accent: { start: 1995, end: 2024 },
        Tiburon: { start: 1997, end: 2008 },
        Azera: { start: 2006, end: 2017 },
        Genesis: { start: 2009, end: 2016 },      // Hyundai Genesis sedan (before Genesis brand split)
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
        Mirage: { start: 1985, end: 2024 },       // 2014+ is new Mirage
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
        SLK: { start: 1997, end: 2016 },         // SLK (later SLC)
        SLC: { start: 2016, end: 2020 },
        CLS: { start: 2006, end: 2023 },
        'ML-Class': { start: 1998, end: 2015 },   // M-Class SUV
        'GL-Class': { start: 2007, end: 2016 },
        GLK: { start: 2010, end: 2015 },          // Before GLC
        CLA: { start: 2014, end: 2024 },
        'B-Class': { start: 2014, end: 2019 },
        'AMG GT': { start: 2016, end: 2024 },
        'G-Class': { start: 1979, end: 2024 },    // G-Wagon
        GLS: { start: 2017, end: 2024 },
        Metris: { start: 2016, end: 2024 },
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
        // ADDED
        GTI: { start: 1983, end: 2024 },
        'New Beetle': { start: 1998, end: 2011 },
        Eurovan: { start: 1992, end: 2003 },
        CC: { start: 2009, end: 2017 },
        Eos: { start: 2007, end: 2016 },
        Routan: { start: 2009, end: 2013 },
        Phaeton: { start: 2004, end: 2006 },
        Rabbit: { start: 1975, end: 1984 },       // Pre-Golf in US
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
        Q4: { start: 2022, end: 2024 },           // Q4 e-tron
        e_tron: { start: 2019, end: 2024 },
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
        S90: { start: 1998, end: 2024 },          // FIXED: was 2017, KG has 1998 (S90 Mk1)
        V40: { start: 2000, end: 2019 },           // FIXED: was 2013, KG has 2000 (V40 Mk1)
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
        'XJ': { start: 1982, end: 2019 },         // XJ (all generations)
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
        ForTwo: { start: 1998, end: 2024 },
        ForFour: { start: 2004, end: 2024 },
    },
    // ── US LEGACY / OTHER ──────────────────────────────────────────────
    Jeep: {
        'Grand Cherokee': { start: 1993, end: 2024 },
        Wrangler: { start: 1986, end: 2024 },     // FIXED: was 1987, KG has 1986
        Cherokee: { start: 1982, end: 2024 },     // FIXED: was 1984, KG has 1982
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
        // ADDED: Dodge was completely missing
        Ram: { start: 1981, end: 2024 },          // Note: Ram is now separate brand but still in Dodge historically
        Charger: { start: 1966, end: 2024 },
        Challenger: { start: 1970, end: 2024 },
        Durango: { start: 1998, end: 2024 },
        Caravan: { start: 1984, end: 2020 },
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
        '300': { start: 1999, end: 2024 },        // FIXED: was 2005, KG has 1999 (LH-body 300M)
        Pacifica: { start: 2004, end: 2024 },     // FIXED: was 2017, KG has 2004 (crossover)
        'Town and Country': { start: 1990, end: 2016 },
        Voyager: { start: 2000, end: 2024 },      // FIXED: was 2020, KG has 2000
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
        Hummer: { start: 2022, end: 2024 },       // EV Hummer
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
        Allure: { start: 2005, end: 2010 },       // Canada market
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
        Aviator: { start: 2003, end: 2024 },
        Corsair: { start: 2020, end: 2024 },
        MKZ: { start: 2007, end: 2020 },
        // ADDED
        'Town Car': { start: 1981, end: 2011 },
        Continental: { start: 1982, end: 2002 },
        'Mark VII': { start: 1984, end: 1992 },
        'Mark VIII': { start: 1993, end: 1998 },
        MKX: { start: 2007, end: 2018 },          // Became Nautilus
        Nautilus: { start: 2019, end: 2024 },
        MKS: { start: 2009, end: 2016 },
        MKT: { start: 2010, end: 2019 },
        MKC: { start: 2015, end: 2019 },          // Became Corsair
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
        TL: { start: 1996, end: 2014 },           // WAS MISSING — major gap
        RL: { start: 1996, end: 2012 },
        RLX: { start: 2014, end: 2020 },
        Legend: { start: 1986, end: 1995 },
        CL: { start: 1997, end: 2003 },
        RSX: { start: 2002, end: 2006 },
        ZDX: { start: 2010, end: 2013 },
        ILX: { start: 2013, end: 2022 },
        CDX: { start: 2017, end: 2021 },          // China market
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
        'Trans Am': { start: 1969, end: 2002 },   // Variant of Firebird
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
        'Grand Marquis': { start: 1982, end: 2011 }, // FIXED: was 1983, KG has 1982
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
    // ── SAAB — restored since has KG data ──────────────────────────────
    // Note: Saab was deliberately removed ("defunct 2012, 0 GSC impressions")
    // Keeping removed unless GSC data shows traffic
};
```

---

## 5. Key Recommendations

### Immediate Priority (High Traffic Impact)
1. **Add Dodge brand** — Neon, Stratus, Viper, Avenger, Journey, Caliber, Dakota are all high-traffic
2. **Add Acura TL** (1996–2014) — was the best-selling Acura for many years
3. **Add Toyota Sequoia** (2001–2024) — full-size SUV completely absent
4. **Add Chrysler PT Cruiser** (2001–2010) — extremely popular, many still on road
5. **Add Honda Prelude** (1982–2001) — 24 KG entries, popular for DIY mechanics
6. **Add VW GTI** (1983–2024) — enthusiast favorite, high search traffic
7. **Add BMW M3/M5** — searched by enthusiasts for repair guides
8. **Add Lexus LS/GS** — common luxury vehicles needing service
9. **Fix Chrysler 300 start year** (2005→1999)
10. **Fix Chrysler Pacifica start year** (2017→2004)

### Mercedes Make Name Issue
The knowledge graph uses "Mercedes Benz" (with space) while vehicles.ts uses "Mercedes". Verify what the site routes use — if slug comparison is case-insensitive and space-insensitive, it may work. If not, add alias matching.

### Mazda 3/6 False Positives
The "year range mismatch" for Mazda 3 and 6 are false positives — the KG entries from the 1980s–90s are old Mazda 323/626/Capella models that were sometimes internally coded as "3" or "6". The current vehicles.ts ranges (2004 for Mazda 3, 2003 for Mazda 6) are correct for the modern nameplates.

---

*Generated by vehicle gap analysis script — `/home/lyndon/lab/analyze-vehicles.js`*
