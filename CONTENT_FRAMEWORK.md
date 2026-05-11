# Corpus-First Content Framework

> Last updated: 2026-05-08
>
> This document governs how ALL content is created for AllOEMManuals.
> Read it before writing any repair profile, tool page, or vehicle hub.

## 1. The One Rule

**Every spec, capacity, torque value, labor hour, part number, and procedure step must be traceable to the CHARM or LEMON corpus — or to the `manual_embeddings` PostgreSQL table.**

If the corpus has no data for a vehicle+task combination, we do NOT fill the gap with "general automotive knowledge," "common fitment," or "typically." We mark it as `corpus-data-unavailable` and skip it.

**Why:** The entire product thesis is "factory manual verified." One generic torque spec destroys trust. One hallucinated fluid capacity can cause engine damage. The site competes on accuracy, not volume.

---

## 2. What the Corpuses Actually Provide

### CHARM (1982–2013, ~25K vehicles)

| Data Type | Location in Tree | Quality | Coverage |
|---|---|---|---|
| **DTC Codes** | `/Repair and Diagnosis/A L L Diagnostic Trouble Codes/` | Excellent | All vehicles |
| **Wiring Diagrams** | `/Repair and Diagnosis/Diagrams/` | Excellent | All vehicles |
| **Component R&I** | Component leaf pages | Good | Most components |
| **Torque Specs** | Inline in procedures, `/Specifications/` | Moderate | Spotty |
| **Labor Times** | `/Parts and Labor/` | Excellent | Most vehicles |
| **Fluid Capacities** | `/Maintenance/Fluids/` | **Poor** | Mostly 404 |
| **TSBs** | `/Technical Service Bulletins/` | Moderate | Some have content |

### LEMON (1960–2025, ~280K vehicles)

| Data Type | Location in Tree | Quality | Coverage |
|---|---|---|---|
| **DTC Codes** | `/Repair and Diagnosis/A L L Diagnostic Trouble Codes/` | Excellent | All vehicles |
| **Wiring Diagrams** | `/Repair and Diagnosis/Diagrams/` | Excellent | All vehicles |
| **Component R&I** | Component leaf pages | Excellent | Full procedures with images |
| **Torque Specs** | `/Quick Lookups/Common Specs & Procedures/`, `/Specifications/` | Good | Better than CHARM |
| **Labor Times** | `/Parts and Labor/` | Excellent | Standard/warranty hours, skill levels |
| **Fluid Capacities** | `/Quick Lookups/Fluids/` | **Excellent** | Real HTML tables with capacities |
| **Quick Lookups** | `/Quick Lookups/` | Good | Common specs, component locations |

### PostgreSQL `manual_embeddings` (1.8M rows)

| Data Type | Source | Quality |
|---|---|---|
| **Section previews** | CHARM pages | Good — 400-char content snippets |
| **Path structure** | CHARM tree | Exact — make/year/model/section/task |
| **Vector search** | OpenAI embeddings | Good for finding relevant sections |

---

## 3. Content Types & Their Corpus Requirements

### Tool Pages (`/tools/{slug}`)

Tool pages answer "what is the spec?" They require **exact factory numbers.**

| Tool Type | Required Corpus Data | Source Path |
|---|---|---|
| `oil-type` | Capacity, viscosity, spec number | `Quick Lookups/Fluids/` → Engine Oil row |
| `coolant-type` | Capacity, spec name, mix ratio | `Quick Lookups/Fluids/` → Engine Coolant row |
| `tire-size` | OEM tire sizes by trim | Not in corpus — use `validated-vehicles.json` or skip |
| `battery-location` | Location, group size, CCA | `Quick Lookups/Electrical Component Locations/`, `Parts and Labor/` |
| `wiper-blade-size` | Blade lengths | **Not in corpus** — mark as unavailable |
| `serpentine-belt` | Belt routing, tensioner type | Component-level Service and Repair pages |
| `headlight-bulb` | Bulb type | `Lighting and Horns/` component pages |
| `spark-plug-type` | Plug type, gap, torque | `Engine, Cooling and Exhaust/` → spark plug pages |
| `fluid-capacity` | All fluid capacities | `Quick Lookups/Fluids/` table |
| `transmission-fluid-type` | ATF spec, capacity | `Quick Lookups/Fluids/` → Transmission Fluid row |

**Rule:** If the Fluids table has no row for the fluid type, the tool page does NOT get a generation entry for that spec. No guessing.

### Repair Profiles (`vehicle-repair-profiles.json`)

Repair profiles answer "how do I do the job?" They require **factory procedures, torque specs, and labor times.**

| Task | Required Corpus Data | Source Path |
|---|---|---|
| `oil-change` | Drain plug torque, oil capacity, filter torque | `Quick Lookups/Fluids/` + component R&I page |
| `brake-pad-replacement` | Caliper bolt torque, pad spec | `Brakes and Traction Control/` component pages |
| `spark-plug-replacement` | Plug type, gap, torque, coil bolt torque | `Engine, Cooling and Exhaust/` component pages |
| `serpentine-belt-replacement` | Belt routing, tensioner release direction | Component R&I pages, under-hood sticker |
| `battery-replacement` | Location, group size, hold-down torque | `Parts and Labor/` + component pages |
| `thermostat-replacement` | Housing bolt torque, thermostat temp | `Engine, Cooling and Exhaust/` component pages |
| `headlight-bulb-replacement` | Bulb type, access method | `Lighting and Horns/` component pages |
| `alternator-replacement` | Bolt torque, access notes, B+ torque | `Starting and Charging/` component pages |
| `starter-replacement` | Bolt torque, shim notes | `Starting and Charging/` component pages |
| `radiator-replacement` | Capacity, drain plug location, hose clamp torque | `Engine, Cooling and Exhaust/` component pages |

**Rule:** Every bullet in `supportNote.bullets` must cite a corpus source. Format: `[CORPUS:CHARM]` or `[CORPUS:LEMON]` at the end of the bullet.

### Vehicle Hubs (`/vehicles/{year}/{make}/{model}/`)

Vehicle hubs aggregate factory data. They require:
- DTC codes from corpus (via `manual_embeddings` or graph)
- Systems list from corpus
- Repair profiles ( corpus-backed only)
- Maintenance links (to tool pages)

---

## 4. The Mining Pipeline

### Layer 1: VPS Batch Miners (Run on 116.202.210.109)

These scripts run directly against `127.0.0.1:8080` and the local PostgreSQL instance. They are the ONLY scripts allowed to query the corpus.

```
/data/lemon-manuals/           ← LMDB backend files
  ├── lemon/index.json         ← 280K vehicle manifests
  ├── charm/index.json         ← 25K vehicle manifests
  └── backend at :8080         ← Serves HTML pages

/scripts/miners/               ← NEW: VPS-side miners
  ├── mine-fluids.mjs          ← Crawls Quick Lookups/Fluids/
  ├── mine-labor.mjs           ← Crawls Parts and Labor/
  ├── mine-torque.mjs          ← Crawls Specifications/
  ├── mine-dtcs.mjs            ← Extracts DTC codes
  ├── mine-locations.mjs       ← Crawls Locations/ pages
  └── mine-procedures.mjs      ← Crawls Service and Repair leaf pages

/data/mined/                   ← NEW: Structured output
  ├── fluids/
  │   └── {make}-{year}-{model}.json
  ├── labor/
  │   └── {make}-{year}-{model}.json
  ├── torque/
  │   └── {make}-{year}-{model}.json
  ├── dtcs/
  │   └── {make}-{year}-{model}.json
  └── locations/
      └── {make}-{year}-{model}.json
```

**Each miner outputs a JSON file per vehicle containing only extracted corpus data — no generic templates, no hallucinations.**

### Layer 2: Sync to Local Dev

```bash
# From local machine
rsync -avz root@116.202.210.109:/data/mined/ ./scripts/mined-output/
```

### Layer 3: Local Content Assembly

```
/scripts/assemblers/
  ├── build-tool-pages.mjs     ← Reads mined/fluids/ → generates tool pages
  ├── build-repair-profiles.mjs ← Reads mined/ → generates profiles
  └── build-vehicle-hubs.mjs   ← Reads mined/ + embeddings → generates hubs
```

**Assemblers are NOT allowed to invent data. They can only:**
1. Read mined JSON
2. Reformat corpus data into page structures
3. Write natural-language wrappers around exact corpus values
4. Mark missing data as `corpus-data-unavailable`

---

## 5. Quality Gates

### Gate 1: Corpus Coverage Check

Before generating ANY content for a vehicle+task:

```javascript
function hasCorpusData(year, make, model, task) {
  const fluids = loadMinedFluids(make, year, model);
  const labor = loadMinedLabor(make, year, model);
  const torque = loadMinedTorque(make, year, model);
  
  // Each task defines its minimum required data
  const requirements = TASK_DATA_REQUIREMENTS[task];
  return requirements.every(req => {
    if (req.source === 'fluids') return fluids?.some(f => req.fluidType.includes(f.fluidType));
    if (req.source === 'labor') return labor?.length > 0;
    if (req.source === 'torque') return torque?.some(t => req.component.includes(t.component));
    return false;
  });
}
```

If `hasCorpusData` returns `false`, do NOT generate the page/profile. Log it as `uncovered` and move on.

### Gate 2: Source Attribution

Every generated page must include a `sources` array:

```json
{
  "sources": [
    { "corpus": "LEMON", "path": "/Toyota/2015/Camry LE/Repair and Diagnosis/Quick Lookups/Fluids/", "section": "Engine Oil" },
    { "corpus": "LEMON", "path": "/Toyota/2015/Camry LE/Parts and Labor/Engine/Oil Filter Replacement", "section": "Labor Times" }
  ]
}
```

### Gate 3: Human-Readable Verification Note

Every tool page and repair profile must display:

> **Factory Manual Source:** Data extracted from LEMON Manuals service manual archive. Last verified: {date}.

### Gate 4: Diff Against Generic Templates

Before saving generated content, diff it against the old GENERIC_TEMPLATES. If a field matches the generic template exactly (word-for-word), reject it — it means the corpus data wasn't used.

---

## 6. The "No Generic Knowledge" Rule (Detailed)

### What IS Allowed

- Reading the corpus HTML and extracting exact values
- Summarizing factory procedures in plain language
- Converting units (mm → inches) with clear labeling
- Cross-referencing multiple corpus pages for the same vehicle
- Using the `VEHICLE_PRODUCTION_YEARS` data for year ranges and generation names

### What is NOT Allowed

- "Most X use Y spec" — unless the corpus explicitly states "All models use Y"
- "Typically around Z quarts" — use the exact corpus capacity
- "Common upgrade: aftermarket part ABC" — unless the corpus mentions it
- Generic tool lists ("socket wrench set, drain pan") — use the corpus Special Tools Required list
- Generic warnings ("allow engine to cool") — use the corpus Service Precautions
- Any content with phrases like "generally," "usually," "most models," "common fit"

### The Exception: Navigation & Context

Generic knowledge IS allowed for:
- How to navigate the site ("Click the Brakes section")
- Safety context ("Wear eye protection when working under a vehicle")
- Tool identification ("A 3/8-inch drive ratchet is a standard tool")
- Unit conversion explanations

But NEVER for specs, capacities, torques, part numbers, or procedures.

---

## 7. Handling Missing Corpus Data

### Option A: Skip (Preferred)

If the corpus has no data for a vehicle+task, do not create the page. The 1,778 query targets are a wishlist, not a mandate. A smaller site with 300 verified pages beats a 3,000-page site with 2,700 generic ones.

### Option B: Mark as "Coming Soon"

Create the page shell with:
- Vehicle header
- "Factory manual data is being extracted for this vehicle. Check back soon."
- Related links to vehicles with verified data
- NO specs, NO procedures, NO generic filler

### Option C: Partial Data

If the corpus has SOME data (e.g., fluid capacity but no torque spec), generate the page with ONLY the verified fields. Leave the missing fields blank or marked `[Data not found in factory manual]`.

---

## 8. Tool Page Generation Rules

### From Fluids Tables

The LEMON Fluids table has these columns:
```
Fluid Type | Application | (empty) | Standard | Metric | Fluid Spec | Notes | S/H
```

**Rule:** Every generation entry in a tool page must map 1:1 to a row in the Fluids table.

**Example — Correct:**
```javascript
{
  name: '6th Gen (2020-2024)',
  years: '2020-2024',
  specs: {
    'Coolant Spec': 'SUBARU Super Coolant',      // ← from Fluid Spec column
    'Capacity': '9.50 QTS. (8.99 L)',            // ← from Standard + Metric columns
    'Mix Ratio': '50/50 distilled water',        // ← from Notes column or generic if blank
  }
}
```

**Example — Incorrect:**
```javascript
{
  specs: {
    'Coolant Spec': 'SUBARU Super Coolant or equivalent',  // ← "or equivalent" is invented
    'Capacity': 'About 9.5 quarts',                        // ← "About" is invented
    'Mix Ratio': 'Typically 50/50',                        // ← "Typically" is invented
  }
}
```

### From Parts and Labor

Labor Times table format:
```
Operation | Standard Hours | Warranty Hours | Skill Level | Notes
```

**Rule:** If a tool page includes labor time, it must come from this table.

---

## 9. Repair Profile Generation Rules

### supportNote.bullets

Each bullet must be a specific, corpus-backed claim.

**Correct:**
- "Drain plug torque is 18 lb-ft (25 N·m) per the Camry factory service manual. [CORPUS:LEMON]"
- "Oil capacity is 4.6 quarts with filter for the 2.5L engine. [CORPUS:LEMON]"

**Incorrect:**
- "Most Camrys take about 4.5 quarts of oil."
- "Torque the drain plug to around 20 lb-ft."
- "Use a 14 mm socket for the drain plug." (unless corpus confirms)

### faq.answer

The FAQ answer must cite corpus data directly.

**Correct:**
> "The 2020 Subaru Outback 2.5L requires SUBARU Super Coolant with a total system capacity of 9.50 quarts (8.99 L), per the LEMON factory service manual Fluids table."

**Incorrect:**
> "Most Subaru Outbacks use a blue coolant and hold about 2 gallons."

---

## 10. Directory Structure (Proposed)

```
/home/lyndon/projects/spotonauto.com/
├── scripts/
│   ├── miners/                    # NEW — VPS-side corpus miners
│   │   ├── mine-fluids.mjs
│   │   ├── mine-labor.mjs
│   │   ├── mine-torque.mjs
│   │   ├── mine-dtcs.mjs
│   │   ├── mine-locations.mjs
│   │   ├── mine-procedures.mjs
│   │   └── lib/
│   │       ├── lmdb-client.mjs    # Shared fetch + parse utilities
│   │       ├── table-parser.mjs   # HTML table → JSON
│   │       └── index-iterator.mjs # Iterate LEMON/CHARM indexes
│   │
│   ├── mined-output/              # NEW — Synced from VPS /data/mined/
│   │   ├── fluids/
│   │   ├── labor/
│   │   ├── torque/
│   │   ├── dtcs/
│   │   └── locations/
│   │
│   ├── assemblers/                # NEW — Local content builders
│   │   ├── build-tool-pages.mjs
│   │   ├── build-repair-profiles.mjs
│   │   └── build-vehicle-hubs.mjs
│   │
│   ├── content-machine/           # EXISTING — to be retired or refactored
│   │   ├── generate-profiles.mjs  # Refactor to use mined-output/
│   │   └── ...
│   │
│   └── validators/                # NEW — Quality gates
│       ├── check-corpus-coverage.mjs
│       ├── diff-generic.mjs
│       └── validate-sources.mjs
│
├── src/data/
│   ├── tools-pages.ts             # Hand-crafted tool pages (corpus-verified only)
│   ├── vehicle-repair-profiles.json # Generated from assemblers/
│   └── mined-index.json           # NEW — Coverage map of what the corpus has
│
└── CONTENT_FRAMEWORK.md           # This document
```

---

## 11. Immediate Next Steps

1. **Build the VPS miners** — Start with `mine-fluids.mjs` (proven working) and `mine-labor.mjs` (high value)
2. **Run a pilot batch** — Mine all Toyota, Honda, Ford, Chevrolet vehicles for 2010-2024
3. **Sync to local** — `rsync /data/mined/` to `scripts/mined-output/`
4. **Rewrite the assemblers** — Replace GENERIC_TEMPLATES with mined JSON readers
5. **Purge non-corpus profiles** — Delete the 18 profiles I just generated from memory
6. **Regenerate from mined data** — Build new profiles using ONLY corpus-extracted values

---

## 12. Appendix: Why This Matters

Google's Helpful Content Update (2023+) and subsequent core updates explicitly penalize sites that "summarize what others have to say without adding value." A repair profile that says "torque to around 20 lb-ft" is summarizing. A profile that says "torque to 18 lb-ft per the factory service manual" is adding value.

The competitive moat is not volume. It is **verifiable accuracy at scale.**
