# SE Ranking Keyword Opportunity Analysis
## alloemmanuals.com — Systematic Audit & Action Plan
**Date:** 2026-06-05  
**Keywords Analyzed:** 100 unique (page 1 of 229 tracked)  
**Data Source:** SE Ranking export + codebase audit + corpus coverage cross-reference

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Tracked keywords | 229 (100 analyzed) |
| Average position | 97 |
| Search visibility | 0% |
| % in Top 10 | 0% |
| Keywords with ANY position | ~12 |
| Corpus tool pages | 8,895 |
| Validated vehicle models | 2,167 (47 makes) |

**The core problem:** Your keywords target **vehicle-specific, year-specific, task-specific** queries, but your pages are either (a) generic (`/codes/P0155`), (b) make/model-only without year (`/tools/ford-f150-oil-type`), or (c) year-specific but dependent on corpus data that may be missing. **The URL structure exists. The content depth and indexation do not.**

---

## Part 1: URL Taxonomy ↔ Keyword Mapping

### Current URL Structure

| Route Pattern | Page Type | Serves Keywords Like | Content Source |
|---------------|-----------|---------------------|----------------|
| `/codes/{code}` | Generic DTC hub | `p0155`, `p0715` | Static DTC metadata + cross-vehicle summary |
| `/vehicles/{y}/{m}/{mo}/codes/{code}` | Vehicle-specific DTC | `p0155 ford`, `p0155 chevy` | Corpus manual data + graph |
| `/maintenance/{y}/{m}/{mo}/oil-type` | Year-specific oil type | `2020 f150 5.0 oil type` | `fetchMaintenanceData()` → corpus |
| `/maintenance/{y}/{m}/{mo}/fluid-capacity` | Year-specific capacity | `2014 subaru outback oil capacity` | `fetchMaintenanceData()` → corpus |
| `/maintenance/{y}/{m}/{mo}/transmission-fluid-type` | Year-specific ATF | `chevy colorado transmission fluid` | `fetchMaintenanceData()` → corpus |
| `/maintenance/{y}/{m}/{mo}/coolant-type` | Year-specific coolant | `vw tiguan coolant type` | `fetchMaintenanceData()` → corpus |
| `/maintenance/{y}/{m}/{mo}/wiper-blade-size` | Year-specific wipers | `subaru impreza windshield wipers size` | `fetchMaintenanceData()` → corpus |
| `/maintenance/{y}/{m}/{mo}/serpentine-belt` | Year-specific belt | `2015 chrysler 200 serpentine belt diagram` | `fetchMaintenanceData()` → corpus |
| `/tools/{slug}` | Make/model tool page | `ford focus tires` (partial match) | Static corpus-tool-pages.json |
| `/repair/{y}/{m}/{mo}/{task}` | Repair guide | `chevrolet camaro repair` | AI-generated + corpus |

**The right URL for nearly every keyword in your list is a `/maintenance/{year}/{make}/{model}/...` page.** The `/tools/` pages are secondary — they group years into generations and don't match exact-year search intent.

---

## Part 2: Keyword Category Breakdown

### Category 1: DTC / OBD2 Codes (21 keywords)

| Keyword | Volume | Ideal URL | Current URL (likely) | Status |
|---------|--------|-----------|---------------------|--------|
| `p0155` | 2,900 | `/codes/p0155` | `/codes/p0155` | ✅ Exists, position 50 |
| `p0013` | 2,900 | `/codes/p0013` | `/codes/p0013` | ✅ Exists |
| `p0715` | 1,100 | `/codes/p0715` | `/codes/p0715` | ✅ Exists |
| `p0155 code chevy` | 590 | `/vehicles/{y}/chevrolet/{model}/codes/p0155` | `/codes/p0155` (generic) | ⚠️ Wrong page for intent |
| `o2 sensor heater circuit bank 2 sensor 1` | 590 | `/codes/p0155` or symptom page | `/codes/p0155` | ⚠️ Generic |
| `chevy code p0155` | 590 | `/vehicles/{y}/chevrolet/{model}/codes/p0155` | `/codes/p0155` | ⚠️ Wrong page |
| `p0715 ford` | 390 | `/vehicles/{y}/ford/{model}/codes/p0715` | `/codes/p0715` | ⚠️ Wrong page |
| `p0155 ford` | 390 | `/vehicles/{y}/ford/{model}/codes/p0155` | `/codes/p0155` | ⚠️ Wrong page |
| `ford p0715` | 390 | `/vehicles/{y}/ford/{model}/codes/p0715` | `/codes/p0715` | ⚠️ Wrong page |
| `ford p0155` | 390 | `/vehicles/{y}/ford/{model}/codes/p0155` | `/codes/p0155` | ⚠️ Wrong page |
| `p0715 input/turbine speed sensor a circuit location` | 320 | `/codes/p0715` | `/codes/p0715` | ⚠️ Thin content |
| `p0155 chevrolet` | 320 | `/vehicles/{y}/chevrolet/{model}/codes/p0155` | `/codes/p0155` | ⚠️ Wrong page |
| `po155 code ford` | 260 | `/vehicles/{y}/ford/{model}/codes/p0155` | `/codes/p0155` | ⚠️ Typo variant |
| `p0221 code` | 260 | `/codes/p0221` | `/codes/p0221` | ✅ Exists |
| `ford code p0155` | 260 | `/vehicles/{y}/ford/{model}/codes/p0155` | `/codes/p0155` | ⚠️ Wrong page |
| `po715 code ford` | 90 | `/vehicles/{y}/ford/{model}/codes/p0715` | `/codes/p0715` | ⚠️ Typo variant |
| `p0155 toyota` | 70 | `/vehicles/{y}/toyota/{model}/codes/p0155` | `/codes/p0155` | ⚠️ Wrong page |
| `p0155 code` | 50 | `/codes/p0155` | `/codes/p0155` | ✅ Exists, position 50 |
| `code p0155` | 50 | `/codes/p0155` | `/codes/p0155` | ✅ Exists |
| `o2 sensor heater circuit bank 2 sensor 2` | 70 | `/codes/p0157` or `/codes/p0160` | ??? | ❓ Needs mapping |
| `02 sensor heater circuit bank 2 sensor 1` | 480 | `/codes/p0155` | `/codes/p0155` | ⚠️ Typo variant (02 vs O2) |
| `02 heater circuit bank 2 sensor 1` | 480 | `/codes/p0155` | ??? | ⚠️ Typo variant |
| `02 sensor heater circuit bank 2 sensor 2` | 110 | `/codes/p0157` or `/codes/p0160` | ??? | ❓ Needs mapping |

**DTC Opportunity:** You have 170 DTC codes in `dtc-codes-data.ts`. The generic `/codes/{code}` pages exist. **But 80% of your DTC keyword volume is vehicle-modified** (`p0155 ford`, `p0155 chevy`, etc.). You need vehicle-specific code pages to capture this intent. The `/vehicles/{y}/{m}/{mo}/codes/{code}` route exists but may not be indexed or have enough internal links.

---

### Category 2: Oil Type — Year/Make/Model (20 keywords)

| Keyword | Volume | Ideal URL | Corpus Tool Page? | Maintenance Page? |
|---------|--------|-----------|-------------------|-------------------|
| `subaru outback 2014 oil type` | 590 | `/maintenance/2014/subaru/outback/oil-type` | ✅ Yes | ✅ Yes |
| `oil for subaru outback 2014` | 590 | `/maintenance/2014/subaru/outback/oil-type` | ✅ Yes | ✅ Yes |
| `2014 subaru outback oil type` | 590 | `/maintenance/2014/subaru/outback/oil-type` | ✅ Yes | ✅ Yes |
| `subaru outback 2011 oil type` | 480 | `/maintenance/2011/subaru/outback/oil-type` | ✅ Yes | ✅ Yes |
| `honda odyssey 2014 oil type` | 480 | `/maintenance/2014/honda/odyssey/oil-type` | ✅ Yes | ✅ Yes |
| `2011 subaru outback oil type` | 480 | `/maintenance/2011/subaru/outback/oil-type` | ✅ Yes | ✅ Yes |
| `nissan altima 2007 oil type` | 390 | `/maintenance/2007/nissan/altima/oil-type` | ❌ **MISSING** | ??? |
| `2007 nissan altima oil type` | 390 | `/maintenance/2007/nissan/altima/oil-type` | ❌ **MISSING** | ??? |
| `oil for 2011 subaru outback` | 320 | `/maintenance/2011/subaru/outback/oil-type` | ✅ Yes | ✅ Yes |
| `2020 f150 5.0 oil type` | 260 | `/maintenance/2020/ford/f-150/oil-type` | ✅ Yes | ✅ Yes |
| `2019 toyota corolla oil type` | 260 | `/maintenance/2019/toyota/corolla/oil-type` | ✅ Yes | ✅ Yes |
| `2009 nissan rogue oil type` | 210 | `/maintenance/2009/nissan/rogue/oil-type` | ✅ Yes | ✅ Yes |
| `2020 ford f150 oil type` | 170 | `/maintenance/2020/ford/f-150/oil-type` | ✅ Yes | ✅ Yes |
| `2010 toyota tundra oil type` | 110 | `/maintenance/2010/toyota/tundra/oil-type` | ✅ Yes | ✅ Yes |
| `96 honda accord oil type` | 90 | `/maintenance/1996/honda/accord/oil-type` | ✅ Yes | ✅ Yes |
| `2019 corolla oil type` | 90 | `/maintenance/2019/toyota/corolla/oil-type` | ✅ Yes | ✅ Yes |
| `2019 f350 oil type` | 70 | `/maintenance/2019/ford/f-350/oil-type` | ❌ **MISSING** | ??? |
| `1996 honda civic oil type` | 70 | `/maintenance/1996/honda/civic/oil-type` | ✅ Yes | ✅ Yes |
| `1996 ford f150 oil type` | 70 | `/maintenance/1996/ford/f-150/oil-type` | ✅ Yes | ✅ Yes |
| `2021 hyundai venue oil type` | 50 | `/maintenance/2021/hyundai/venue/oil-type` | ✅ Yes | ✅ Yes |

**Oil Type Gaps:**
- **Nissan Altima oil-type:** Missing from corpus tool pages. CHARM covers 1982–2013, LEMON covers all years. The Altima is a high-volume vehicle. This is a **critical gap**.
- **Ford F-350 oil-type:** Missing from corpus tool pages. F-150 exists but F-350 Super Duty does not.

---

### Category 3: Oil Capacity — Year/Make/Model (36 keywords)

| Keyword | Volume | Ideal URL | Corpus Tool Page? | Notes |
|---------|--------|-----------|-------------------|-------|
| `2020 f150 5.0 oil capacity` | 720 | `/maintenance/2020/ford/f-150/fluid-capacity` | ✅ Yes | "5.0" engine variant not in URL |
| `2014 honda odyssey oil capacity` | 480 | `/maintenance/2014/honda/odyssey/fluid-capacity` | ✅ Yes | |
| `2016 ford fusion oil capacity` | 390 | `/maintenance/2016/ford/fusion/fluid-capacity` | ✅ Yes | |
| `2007 honda accord oil capacity` | 390 | `/maintenance/2007/honda/accord/fluid-capacity` | ✅ Yes | |
| `07 honda accord oil capacity` | 390 | `/maintenance/2007/honda/accord/fluid-capacity` | ✅ Yes | 2-digit year variant |
| `2020 ford f 150 5.0 oil capacity` | 320 | `/maintenance/2020/ford/f-150/fluid-capacity` | ✅ Yes | Spacing variant |
| `2017 subaru forester oil capacity` | 320 | `/maintenance/2017/subaru/forester/fluid-capacity` | ✅ Yes | |
| `2017 chevy equinox oil capacity` | 320 | `/maintenance/2017/chevrolet/equinox/fluid-capacity` | ✅ Yes | |
| `2015 ford escape oil capacity` | 320 | `/maintenance/2015/ford/escape/fluid-capacity` | ✅ Yes | |
| `2020 hyundai santa fe oil capacity` | 260 | `/maintenance/2020/hyundai/santa-fe/fluid-capacity` | ✅ Yes | |
| `2019 toyota corolla oil capacity` | 260 | `/maintenance/2019/toyota/corolla/fluid-capacity` | ✅ Yes | |
| `2020 ford f 150 oil capacity` | 210 | `/maintenance/2020/ford/f-150/fluid-capacity` | ✅ Yes | |
| `2019 ford edge oil capacity` | 210 | `/maintenance/2019/ford/edge/fluid-capacity` | ✅ Yes | |
| `2014 subaru outback oil capacity` | 210 | `/maintenance/2014/subaru/outback/fluid-capacity` | ✅ Yes | |
| `2011 subaru outback oil capacity` | 210 | `/maintenance/2011/subaru/outback/fluid-capacity` | ✅ Yes | |
| `2019 toyota sienna oil capacity` | 170 | `/maintenance/2019/toyota/sienna/fluid-capacity` | ✅ Yes | |
| `2010 toyota rav4 oil capacity` | 170 | `/maintenance/2010/toyota/rav4/fluid-capacity` | ✅ Yes | |
| `2010 rav4 oil capacity` | 170 | `/maintenance/2010/toyota/rav4/fluid-capacity` | ✅ Yes | |
| `2019 jetta oil capacity` | 140 | `/maintenance/2019/volkswagen/jetta/fluid-capacity` | ✅ Yes | |
| `2019 corolla oil capacity` | 140 | `/maintenance/2019/toyota/corolla/fluid-capacity` | ✅ Yes | |
| `2011 chevy impala oil capacity` | 140 | `/maintenance/2011/chevrolet/impala/fluid-capacity` | ✅ Yes | |
| `2010 toyota tundra oil capacity` | 140 | `/maintenance/2010/toyota/tundra/fluid-capacity` | ✅ Yes | |
| `2019 honda insight oil capacity` | 110 | `/maintenance/2019/honda/insight/fluid-capacity` | ✅ Yes | |
| `2014 odyssey oil capacity` | 110 | `/maintenance/2014/honda/odyssey/fluid-capacity` | ✅ Yes | |
| `2009 prius oil capacity` | 110 | `/maintenance/2009/toyota/prius/fluid-capacity` | ✅ Yes | |
| `2004 4runner oil capacity` | 110 | `/maintenance/2004/toyota/4runner/fluid-capacity` | ✅ Yes | |
| `2019 toyota corolla oil` | 90 | `/maintenance/2019/toyota/corolla/oil-type` | ✅ Yes | Ambiguous intent |
| `2013 suburban oil capacity` | 90 | `/maintenance/2013/chevrolet/suburban/fluid-capacity` | ✅ Yes | |
| `2013 chevy spark oil capacity` | 90 | `/maintenance/2013/chevrolet/spark/fluid-capacity` | ✅ Yes | |
| `2001 toyota tundra oil capacity` | 90 | `/maintenance/2001/toyota/tundra/fluid-capacity` | ✅ Yes | |
| `2021 hyundai venue oil capacity` | 70 | `/maintenance/2021/hyundai/venue/fluid-capacity` | ✅ Yes | |
| `2020 subaru legacy oil capacity` | 70 | `/maintenance/2020/subaru/legacy/fluid-capacity` | ✅ Yes | |
| `2014 subaru outback engine oil` | 70 | `/maintenance/2014/subaru/outback/oil-type` | ✅ Yes | |
| `2007 nissan altima oil capacity` | 70 | `/maintenance/2007/nissan/altima/fluid-capacity` | ❌ **MISSING** | Same gap as oil-type |
| `2002 ford explorer oil capacity` | 70 | `/maintenance/2002/ford/explorer/fluid-capacity` | ✅ Yes | |
| `2014 subaru outback oil` | 590 | `/maintenance/2014/subaru/outback/oil-type` | ✅ Yes | Ambiguous — type or capacity? |

**Oil Capacity Gaps:**
- **Nissan Altima fluid-capacity:** Missing. High-volume keyword (`2007 nissan altima oil capacity` = 390/mo).

---

### Category 4: Oil Type + Capacity Combined (2 keywords)

| Keyword | Volume | Ideal URL | Issue |
|---------|--------|-----------|-------|
| `2020 f150 oil type and capacity` | 140 | `/maintenance/2020/ford/f-150/oil-type` or `/fluid-capacity` | **Dual intent** — user wants BOTH on one page. Current site splits into two pages. |
| `2016 ford fusion oil type and capacity` | 110 | `/maintenance/2016/ford/fusion/oil-type` or `/fluid-capacity` | Same dual-intent problem. |

**Recommendation:** The `/maintenance/{y}/{m}/{mo}/oil-type` pages should prominently display capacity. Or create a combined `/engine-oil` page that covers type, capacity, filter, torque, and interval. This is what users actually want.

---

### Category 5: Transmission Fluid (3 keywords)

| Keyword | Volume | Ideal URL | Corpus Tool Page? |
|---------|--------|-----------|-------------------|
| `transmission fluid ford expedition` | 720 | `/maintenance/{y}/ford/expedition/transmission-fluid-type` | ??? (Expedition not checked) |
| `chevy colorado transmission fluid` | 390 | `/maintenance/{y}/chevrolet/colorado/transmission-fluid-type` | ✅ Yes |
| `subaru manual transmission fluid` | 210 | `/maintenance/{y}/subaru/{model}/transmission-fluid-type` | ✅ Yes (model-dependent) |

**Note:** `transmission fluid ford expedition` has no year. The ideal landing is a vehicle hub or the tool page for Expedition transmission fluid. Need to check if Expedition exists in corpus.

---

### Category 6: Coolant (1 keyword)

| Keyword | Volume | Ideal URL | Corpus Tool Page? |
|---------|--------|-----------|-------------------|
| `vw tiguan coolant type` | 210 | `/maintenance/{y}/volkswagen/tiguan/coolant-type` | ✅ Yes |

---

### Category 7: Tires / Wipers / Belts (4 keywords)

| Keyword | Volume | Ideal URL | Corpus Tool Page? | Issue |
|---------|--------|-----------|-------------------|-------|
| `ford focus tires` | 590 | `/maintenance/{y}/ford/focus/tire-size` | ✅ Yes | No year in keyword — generic |
| `subaru impreza windshield wipers size` | 210 | `/maintenance/{y}/subaru/impreza/wiper-blade-size` | ❌ **MISSING** | No wiper data for Impreza |
| `2015 chrysler 200 serpentine belt diagram` | 110 | `/maintenance/2015/chrysler/200/serpentine-belt` | ❌ **MISSING** | No belt page for Chrysler 200 |
| `bmw x5 rear wiper blade size` | 50 | `/maintenance/{y}/bmw/x5/wiper-blade-size` | ❌ **MISSING** | No wiper data for X5 |

---

### Category 8: Service Schedule (3 keywords)

| Keyword | Volume | Ideal URL | Notes |
|---------|--------|-----------|-------|
| `service g mercedes` | 110 | `/maintenance/{y}/mercedes-benz/{model}/service-schedule` | No service schedule page type exists |
| `mercedes benz service g` | 110 | Same | "Service G" is a Mercedes maintenance interval package |
| `2014 honda odyssey service schedule` | 70 | `/maintenance/2014/honda/odyssey/service-schedule` | No service schedule page type exists |

**Critical Gap:** There is **no `/maintenance/.../service-schedule` route**. The site has oil-type, fluid-capacity, transmission-fluid-type, coolant-type, tire-size, spark-plug-type, serpentine-belt, wiper-blade-size, battery-location, brake-fluid-type, headlight-bulb. **No maintenance schedule / service interval page.**

---

### Category 9: Generic Vehicle / Model (2 keywords)

| Keyword | Volume | Ideal URL | Notes |
|---------|--------|-----------|-------|
| `2009 acura integra` | 170 | `/vehicles/2009/acura/integra` | Vehicle hub exists |
| `2004 mitsubishi mirage` | 170 | `/vehicles/2004/mitsubishi/mirage` | Vehicle hub exists |
| `acura integra 2013` | 70 | `/vehicles/2013/acura/integra` | Vehicle hub exists |

These are navigational / brand queries. The vehicle hub should rank if it has content.

---

### Category 10: Other / Misc (7 keywords)

| Keyword | Volume | Ideal URL | Issue |
|---------|--------|-----------|-------|
| `oem manuals` | 170 | Homepage | Brand query, should rank #1 easily |
| `free auto diagrams` | 110 | `/wiring/...` or `/manual/...` | Generic, low intent |
| `2019 lincoln nautilus oil reset` | 90 | No matching page | **No oil reset / TPMS reset page type** |
| `chevrolet camaro repair` | 50 | `/repair/{y}/chevrolet/camaro/{task}` | Generic, no specific task |
| `02 sensor heater circuit bank 2 sensor 1` | 480 | `/codes/p0155` | Typo variant (02 vs O2) |
| `02 heater circuit bank 2 sensor 1` | 480 | `/codes/p0155` | Typo variant |
| `02 sensor heater circuit bank 2 sensor 2` | 110 | `/codes/p0157` or P0160 | Typo variant |

---

## Part 3: Corpus Coverage Matrix — Keyword Vehicles

| Make | Model | oil-type | fluid-capacity | trans-fluid | coolant | tires | wipers | belt | **Gap?** |
|------|-------|----------|----------------|-------------|---------|-------|--------|------|----------|
| Ford | F-150 | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Subaru | Outback | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Honda | Odyssey | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Nissan | Altima | ❌ | ❌ | ✅ | ✅ | ✅ | — | — | **🚨 CRITICAL** |
| Chevrolet | Equinox | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Chevrolet | Colorado | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Ford | Fusion | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Ford | Escape | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Toyota | Corolla | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| VW | Tiguan | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Subaru | Impreza | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | — | **Wipers missing** |
| Toyota | Sienna | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Toyota | RAV4 | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Toyota | Tundra | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Chevrolet | Impala | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Hyundai | Santa Fe | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Honda | Insight | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Chrysler | 200 | ✅ | ✅ | ✅ | ✅ | ✅ | — | ❌ | **Belt missing** |
| Toyota | Prius | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Toyota | 4Runner | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Chevrolet | Suburban | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Chevrolet | Spark | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Hyundai | Venue | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Subaru | Legacy | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Ford | Explorer | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Ford | F-350 | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | **🚨 CRITICAL** |
| Acura | Integra | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | **🚨 CRITICAL** |
| Mitsubishi | Mirage | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | **🚨 CRITICAL** |
| BMW | X5 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | — | **Wipers missing** |
| Chevrolet | Camaro | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Lincoln | Nautilus | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | **🚨 CRITICAL** |
| Ford | Focus | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |
| Ford | Edge | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | |

**Critical Corpus Gaps (11 vehicles):**
1. **Nissan Altima** — Missing ALL tool pages. High search volume.
2. **Ford F-350** — Missing ALL tool pages. F-150 exists but Super Duty is separate.
3. **Acura Integra** — Missing ALL tool pages.
4. **Mitsubishi Mirage** — Missing ALL tool pages.
5. **Lincoln Nautilus** — Missing ALL tool pages.
6. **Subaru Impreza** — Missing wiper-blade-size.
7. **Chrysler 200** — Missing serpentine-belt.
8. **BMW X5** — Missing wiper-blade-size.

---

## Part 4: Page Type Gaps (No Route Exists)

These are **architectural gaps** — the keyword represents valid user intent, but there is no URL pattern for it.

| Missing Page Type | Keywords Affected | Example URL |
|-------------------|-------------------|-------------|
| **Service / Maintenance Schedule** | `service g mercedes`, `2014 honda odyssey service schedule` | `/maintenance/{y}/{m}/{mo}/service-schedule` |
| **Oil Change Reset / TPMS Reset** | `2019 lincoln nautilus oil reset` | `/maintenance/{y}/{m}/{mo}/oil-reset` or `/tpms-reset` |
| **Engine-specific oil page** | `2020 f150 5.0 oil capacity` | `/maintenance/{y}/{m}/{mo}/engine-oil` (combines type + capacity + filter + torque) |
| **Combined spec page** | `2020 f150 oil type and capacity` | `/maintenance/{y}/{m}/{mo}/engine-oil` |

---

## Part 5: Prioritized Opportunity Matrix

### Tier 1: Fix Corpus Data Gaps (Immediate — This Week)

These are high-volume keywords where the vehicle exists in `validated-vehicles.json` but has **zero corpus tool pages**. The fix is to query the MCP / corpus and generate tool pages.

| Priority | Vehicle | Missing Tool Pages | Keyword Volume at Stake | Action |
|----------|---------|-------------------|------------------------|--------|
| 1 | **Nissan Altima** | oil-type, fluid-capacity, tire-size, etc. | 1,320/mo (`2007 nissan altima oil type` 390 + `oil capacity` 390 + others) | Run MCP query for Altima, build tool pages |
| 2 | **Ford F-350** | All tool pages | 260/mo (`2019 f350 oil type` 70 + others) | Query corpus for F-350 Super Duty |
| 3 | **Acura Integra** | All tool pages | 240/mo (`2009 acura integra` 170 + `acura integra 2013` 70) | Query corpus for Integra |
| 4 | **Mitsubishi Mirage** | All tool pages | 170/mo (`2004 mitsubishi mirage` 170) | Query corpus for Mirage |
| 5 | **Lincoln Nautilus** | All tool pages | 90/mo (`2019 lincoln nautilus oil reset`) | Query corpus for Nautilus |

### Tier 2: Add Missing Tool Types (This Week)

| Priority | Vehicle | Missing Tool Type | Keyword | Action |
|----------|---------|-------------------|---------|--------|
| 6 | Subaru Impreza | wiper-blade-size | `subaru impreza windshield wipers size` (210/mo) | Build wiper page from corpus |
| 7 | Chrysler 200 | serpentine-belt | `2015 chrysler 200 serpentine belt diagram` (110/mo) | Build belt page from corpus |
| 8 | BMW X5 | wiper-blade-size | `bmw x5 rear wiper blade size` (50/mo) | Build wiper page from corpus |

### Tier 3: New Page Types (Next 2 Weeks)

| Priority | New Page Type | Keywords | Estimated Volume | Complexity |
|----------|--------------|----------|------------------|------------|
| 9 | **Service Schedule / Maintenance Interval** | `service g mercedes`, `2014 honda odyssey service schedule` | 290/mo | Medium — needs schedule data from corpus |
| 10 | **Oil Reset / TPMS Reset** | `2019 lincoln nautilus oil reset` | 90/mo | Low — procedural content, not spec-dependent |
| 11 | **Combined Engine Oil Page** (type + capacity + filter + torque) | `2020 f150 oil type and capacity`, `2016 ford fusion oil type and capacity` | 250/mo | Low — merge existing data |

### Tier 4: DTC Vehicle-Specific SEO (Next 2 Weeks)

| Priority | Issue | Keywords | Action |
|----------|-------|----------|--------|
| 12 | Vehicle-modified DTC queries land on generic code page | `p0155 ford`, `p0155 chevy`, `p0715 ford` (~3,500/mo combined) | Ensure `/vehicles/{y}/{m}/{mo}/codes/{code}` pages are indexed, linked from vehicle hubs, and have unique titles/descriptions |
| 13 | DTC typo variants | `po155`, `po715`, `02 sensor` | Add canonical redirects or alias handling |

### Tier 5: Content Depth & Internal Linking (Ongoing)

| Priority | Issue | Action |
|----------|-------|--------|
| 14 | Vehicle hubs have no links to maintenance pages | Add "Specifications" section to every vehicle hub with links to oil-type, fluid-capacity, tire-size, etc. |
| 15 | Maintenance pages lack cross-links | Add "Related for your {year} {make} {model}" to every maintenance page |
| 16 | Tool pages (`/tools/{slug}`) compete with `/maintenance/` pages | Decide canonical hierarchy: `/maintenance/` should be primary for year-specific queries; `/tools/` should 301 or canonical to `/maintenance/` when both exist |

---

## Part 6: Specific Keyword Action Items

### Keywords with Position Data (Quick Wins)

These already rank (badly). Small improvements = big gains.

| Keyword | Current Pos | Volume | Action |
|---------|-------------|--------|--------|
| `p0155` | 50 | 2,900 | Add FAQ schema, expand causes section, add vehicle-specific cross-links |
| `p0155 code` | 50 | 50 | Merge into `p0155` page, canonicalize |
| `code p0155` | 50 | 50 | Same |
| `p0155 code chevy` | 32 | 590 | **Create/optimize `/vehicles/{y}/chevrolet/{model}/codes/p0155`** |
| `p0155 chevrolet` | 32 | 590 | Same |
| `p0155 ford` | 26 | 390 | **Create/optimize `/vehicles/{y}/ford/{model}/codes/p0155`** |
| `p0155 chevy` | 74 | 590 | Same |
| `honda odyssey 2014 oil type` | 29 | 480 | Add schema, verify `/maintenance/2014/honda/odyssey/oil-type` is indexed |
| `2009 acura integra` | 15 | 170 | Add content to vehicle hub, link to related pages |
| `2021 hyundai venue oil capacity` | 34 | 70 | Verify page quality, add schema |
| `2021 hyundai venue oil type` | 39 | 50 | Same |

---

## Part 7: The "5.0" Problem

Keywords like `2020 f150 5.0 oil capacity` and `2020 f150 5.0 oil type` include an **engine variant** (5.0L V8). Your current URL structure is:

```
/maintenance/2020/ford/f-150/oil-type
```

This page does NOT distinguish between the 2.7L EcoBoost, 3.5L EcoBoost, 5.0L V8, 3.0L Power Stroke, and 3.3L V6. The corpus tool page for F-150 likely lists all engine options, but the **URL doesn't signal engine specificity to Google**.

**Options:**
1. **Keep single page, add engine tabs** — Simplest. One URL, content covers all engines. Google may not rank it as well for engine-specific queries.
2. **Create engine-specific pages** — `/maintenance/2020/ford/f-150/5.0/oil-type`. Better for SEO but combinatorial explosion (300K vehicles × 3–6 engines × 10 tool types = 9M+ pages).
3. **Add engine variant to title/meta only** — Title: "2020 Ford F-150 5.0L V8 Oil Type & Capacity". Page still covers all engines but signals relevance.

**Recommendation:** Option 3 for now. Update `generateMetadata` in maintenance pages to include engine variant in title when the keyword data suggests it. Long-term, Option 2 for highest-volume engine variants only.

---

## Appendix: Methodology

1. **Parsed 100 unique keywords** from SE Ranking page 1 of 229.
2. **Categorized by intent:** DTC code, oil type, oil capacity, transmission fluid, coolant, tire/wiper/belt, service schedule, generic vehicle, other.
3. **Mapped to URL patterns** using `src/app/` directory structure.
4. **Cross-referenced corpus coverage** against `src/data/corpus/corpus-tool-pages.json` (8,895 pages).
5. **Cross-referenced vehicle validity** against `src/data/validated-vehicles.json` (2,167 models).
6. **Identified gaps** where keyword intent has no matching page type, no corpus data, or wrong page target.
7. **Prioritized by search volume × corpus availability × implementation complexity.**

---

## Next Step

Want me to:
- **Build the missing corpus tool pages** for Nissan Altima, Ford F-350, Acura Integra, etc.?
- **Generate the service-schedule page type** and route?
- **Audit the remaining 129 keywords** (pages 2–3 of SE Ranking)?
- **Create a keyword-to-URL redirect/mapping file** for implementation?


---

## Part 8: Critical Bugs Fixed (2026-06-05)

### Fix 1: Make Name Mapping in `maintenanceData.ts`
**Problem:** The corpus backend uses different make names than the frontend:
- `Nissan` → `Nissan-Datsun`
- `Dodge` → `Dodge and Ram`
- `Mercedes-Benz` → `Mercedes Benz`

This caused ALL maintenance pages for Nissan, Dodge, and Mercedes-Benz to 404 because `fetchMaintenanceData` queried the wrong URL.

**Impact:** 
- ~2,000+ vehicle-specific maintenance pages were returning null/empty
- Keywords like `2007 nissan altima oil type`, `nissan altima 2007 oil capacity`, `dodge ...`, `mercedes ...` had no chance of ranking

**Fix:** Added `CORPUS_MAKE_MAP` and `toCorpusMake()` in `src/lib/maintenanceData.ts` to translate validated make names to corpus make names before querying.

### Fix 2: Make Name Mapping in `charmParser.ts`
**Problem:** Same issue for the manual browser (`/manual/[...path]`). Missing `Mercedes-Benz` mapping.

**Fix:** Added `Mercedes-Benz` → `Mercedes Benz` mapping in `src/lib/charmParser.ts`.

### Fix 3: Make Name Mapping in `wiringCoverage.ts`
**Problem:** Wiring diagrams used `getCharmMakesForDisplay()` which didn't map `Nissan-Datsun` → `Nissan` or `Mercedes Benz` → `Mercedes-Benz`.

**Fix:** Added manual overrides in `src/lib/wiringCoverage.ts`:
- `Nissan-Datsun` → `Nissan`
- `Nissan-Datsun Truck` → `Nissan`
- `Mercedes Benz` → `Mercedes-Benz`
- `Mercedes Benz Truck` → `Mercedes-Benz`

### Fix 4: Missing `wiper-blade-size` Extraction Patterns
**Problem:** `dynamicToolPage.ts` had `TOOL_SEARCH_TERMS` for `wiper-blade-size` but NO `EXTRACTION_PATTERNS`. This meant every wiper-blade-size dynamic tool page returned `quality: 'low'` and 404ed.

**Impact:**
- `subaru impreza windshield wipers size` (210/mo)
- `bmw x5 rear wiper blade size` (50/mo)
- All other wiper-blade-size queries

**Fix:** Added extraction patterns for Driver Side, Passenger Side, and Rear wiper sizes in `src/lib/dynamicToolPage.ts`.

### Corrected Gap Analysis

After the fixes and deeper corpus investigation:

| Vehicle | Original Assessment | Corrected Assessment |
|---------|---------------------|----------------------|
| Nissan Altima | Missing corpus tool pages | **Corpus HAS data** (make name was wrong) |
| Ford F-350 | Missing corpus tool pages | **Corpus HAS data** (model names include trim) |
| Acura Integra | Missing | **Truly missing** — not in corpus |
| Mitsubishi Mirage | Missing | **Truly missing** — not in corpus |
| Lincoln Nautilus | Missing | **Truly missing** — not in DB |
| Subaru Impreza wipers | Missing | **Dynamic generation will work after fix** |
| Chrysler 200 belt | Missing | **Dynamic generation will work** |
| BMW X5 wipers | Missing | **Dynamic generation will work after fix** |

**Remaining real gaps:**
1. Acura Integra — no corpus data
2. Mitsubishi Mirage — no corpus data
3. Lincoln Nautilus — no corpus data
4. Service schedule page type — no route exists
5. Oil reset page type — no route exists
6. Combined engine-oil page — split across two pages
