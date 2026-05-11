# AllOEMManuals Memory

This file is the durable project memory for future Codex runs in this repo.
Update it when product decisions, traps, or standing preferences change.

## Product Direction

- Brand is `AllOEMManuals`.
- Do not attribute authorship to `Operation CHARM` or `charm.li`. They were distributors/hosts, not the author.
- When referring to that corpus or live retrieval source, use `factory manual archive`, `manual archive`, or `factory service manual archive`.

## UI Direction

- Homepage direction is matte black with blue/white text.
- Prefer a softened graphite / charcoal dark theme over true black on primary entry surfaces.
  - homepage and exact vehicle command-center pages should feel calmer and more mainstream, not harsh or “raven black”
  - keep the dark identity, but use deep gray shells with near-black cards/panels where contrast is needed
- Avoid the old starfield / particle-background look on the homepage.
- Favor calmer, more flowing section transitions over noisy sci-fi effects.
- Keep the tone intentional and restrained, not gimmicky.

## Critical SEO / Crawl Safety Rules (2026-04-26)

- **NEVER add redirect URLs to `src/app/sitemap.ts`.**
  - Forbidden: `/cel`, `/privacy`, `/terms` (they return 308 redirects).
  - Allowed: `/codes`, `/privacy-policy`, `/terms-of-service`.
  - Redirects in sitemaps trigger Bing/Google duplicate-content penalties.
- **CRITICAL BUG (fixed 2026-04-26): `scripts/submit-indexnow.js` fell back to full mode when git was unavailable.**
  - Production server has no `.git` directory (excluded from rsync deploy).
  - Old `package.json` start script auto-ran the submitter on every boot.
  - Every boot → git fails → "fallback to full mode" → **300K+ URLs submitted**.
  - This is the root cause of the 740K March 28 spam blast.
  - **Fix:** Script now aborts when git is unavailable. `--full` must be explicitly requested.
- **NEVER submit more than 500 URLs/day via IndexNow. NEVER run `submit-indexnow.js --full`.**
  - `--full` mode submits every URL from every sitemap. This is a nuclear option.
  - Only submit small batches (<100) of verified changed URLs.
- **NO IndexNow submissions allowed for 30 days from 2026-04-26.** Let Bing forget the spam.
- **NEVER auto-submit IndexNow on server boot.**
  - Removed from `package.json` start script on 2026-04-26.
- **NEVER submit `/vehicles/...` URLs via IndexNow until `npm run health:manual-backbone` reports >1 make and >1 year.**
  - Empty `manual_embeddings` causes vehicle pages to 404, which destroys domain trust.
- **`/vehicles/sitemap.xml` is DISABLED in `robots.ts` until backbone recovery.**
  - Re-enable only after `health:manual-backbone` shows meaningful coverage.
- **The `index-lmdb-vectors.ts` indexer MUST run on the VPS.**
  - Port 8080 is firewalled; running from your local machine will fail.

## Corpus-First Content Framework (Built 2026-05-08)

- **Rule:** Every spec, capacity, torque value, and fluid type must be traceable to the CHARM/LEMON corpus or `manual_embeddings` PG table.
- **Miners live on VPS** (`116.202.210.109`) at `/root/alloemmanuals.com/scripts/miners/`:
  - `mine-fluids.mjs` — extracts Fluids tables from LEMON `Quick Lookups/Fluids/`
  - `mine-torque.mjs` — extracts torque specs from `Specifications Index/`
  - `mine-labor.mjs` — extracts labor times from `Parts and Labor/`
  - `mine-dtcs.mjs` — extracts DTC codes from `A L L Diagnostic Trouble Codes/`
  - `lib/lmdb-client.mjs` — shared fetch + parse utilities
- **Mined data lives on VPS** at `/data/mined/{fluids,labor,torque,dtcs}/` as one JSON per vehicle.
- **Assembler lives on VPS** at `/root/alloemmanuals.com/scripts/assemblers/build-tool-pages.mjs`:
  - Reads `/data/mined/fluids/*.json` + LEMON index for clean model names
  - Groups by make/model, merges consecutive years with identical specs
  - Outputs `/data/assembled/corpus-tool-pages.json`
- **Integration:** `src/data/tool-machine.ts` loads corpus JSON at build time and returns corpus-backed `ToolPage[]`. Falls back to legacy templates only if corpus is missing.
- **Precedence:** `HAND_CRAFTED` in `tools-pages.ts` > corpus pages > legacy templates.
- **Current coverage (2015-2024):**
  - Toyota: 1,867 vehicles, Honda: 835, Ford: 5,726, Chevrolet: 4,846, Hyundai: 802, Subaru: 515, Nissan-Datsun: 1,472, Volkswagen: 961, BMW: 1,019, Mercedes-Benz: 1,045
  - Total: ~19,088 vehicle fluid records → 3,714 corpus-backed tool pages
- **Sync workflow:** `rsync -avz root@116.202.210.109:/data/assembled/corpus-tool-pages.json src/data/corpus/`

## Known Technical Traps

- Do not reintroduce delayed provider remounting in `src/components/Providers.tsx`.
  That remount was causing scroll resets back to the top while users were moving down the page.
- Next.js 16 now expects the request interception file to live at `src/proxy.ts` and export a `proxy` function.
  `src/middleware.ts` still works today but emits a deprecation warning during build.
- Diagnostic chat now has browser-local persistent thread memory.
  Preserve resume behavior and the explicit `New thread` reset unless intentionally replacing that system.
- Railway targeting is easy to misread for this repo.
  - as of `2026-03-21`, live `alloemmanuals.com` is attached to Railway project `reliable-bravery` / service `reliable-bravery`
  - the separate Railway project `sweet-endurance` also deploys this repo but is not the live custom-domain target
  - before assuming a Railway deploy is live, check `railway status --json` and confirm `domains.customDomains` contains `alloemmanuals.com`
- GA4 realtime snapshots with heavy `direct / (none)` concentration and large Singapore-style city clusters are not reliable SEO recovery proof.
  Use GSC daily visibility plus GA4 organic sessions / landing pages for recovery reads.

## Current Durable Changes

- Homepage is now explicitly moving toward a simpler vehicle-first front door in `src/app/ClientHome.tsx`.
  - the primary landing-page job is to get users into the exact year/make/model hub quickly
  - `year -> make -> model` should feel like the main route, not one option among many stacked sections
  - fallback entry paths like wiring, codes, and diagnosis should remain visible but secondary
  - if query families become clear in Search Console, the homepage can surface a restrained lower-page cluster section keyed to those real DIY lanes
    - keep it below the primary vehicle-first flow
    - use it to reinforce clusters already showing traction, such as lighting, brakes, battery, fluids, and filters
    - prefer category pages plus a few exact-query examples over a giant “popular guides” wall
  - if repeated exact year/make/model demand becomes obvious in Search Console, the homepage can also surface a restrained lower-page command-center strip for those exact vehicles
    - keep this below the main vehicle selector and below the first fallback entry section
    - use it to route users into command centers that are already showing multi-intent demand, not as a generic “popular vehicles” wall
- Exact year/make/model pages are now the intended place for richer option density.
  - `src/app/repair/[year]/[make]/[model]/page.tsx` should read like a vehicle command center, not a generic SEO landing page
  - the exact vehicle hub should expose the main spokes users care about: repairs, wiring, symptoms, codes, specs/tools, and OEM manual paths
  - near the top of the hub, prioritize a clear DIY-first lane for the jobs normal owners actually attempt:
    - headlights / lighting, including tail lights
    - battery / starting
    - brakes
    - oil and fluids, including transmission fluid and coolant
    - filters / tune-up
  - those quick-start links should drive into the exact vehicle repair guides because the one-off guide pages already carry the deeper tool, parts, fitment, and consumable-buying support
  - if complexity is added, prefer adding it to the exact vehicle hub rather than pushing it back onto the homepage
- Header now exposes a fast `Tools` path with `Wiring Diagrams` promoted in primary navigation so wiring-intent users do not have to rely on deep homepage scroll.
  - main implementation lives in `src/components/Header.tsx`
- Wiring is now a primary acquisition and conversion surface, not a buried utility page.
  - exact wiring pages in `src/app/wiring/[year]/[make]/[model]/[system]/page.tsx` should push users toward the next step: exact vehicle hub, likely repair guides, and likely code pages
  - wiring funnel measurement now matters alongside raw diagram opens:
    - `wiring_diagram_open`
    - `vehicle_hub_enter`
    - `repair_guide_open`
- Homepage hero and dashboard now expose above-the-fold tool shortcuts, including vehicle-aware wiring links when a user locks year/make/model.
  - main implementation lives in:
    - `src/app/ClientHome.tsx`
    - `src/components/HolographicDashboard.tsx`
- Manual/archive sanitization lives in:
  - `src/services/geminiService.ts`
  - `scripts/index-lmdb-vectors.ts`
  - `src/app/api/generate-guide/route.ts`
  - `src/app/charm-repair/page.tsx`
  - `src/components/CharmLiVehicleSelector.tsx`
- Diagnostic memory lives in:
  - `src/services/diagnosticMemory.ts`
  - `src/components/DiagnosticChat.tsx`
  - `src/app/diagnose/page.tsx`
  - `src/services/apiClient.ts`
- Vehicle identity and knowledge graph normalization is in progress:
  - canonical user-facing vehicle order is `year -> make -> model`
  - selectors were moved toward year-first flow
  - `src/lib/vehicleIdentity.ts` is the shared canonical vehicle identity layer
  - `src/lib/knowledgeGraph.ts` is the shared node/edge identity layer
  - `src/lib/knowledgeGraphExport.ts` is the shared serialized graph export layer
  - graph-producing modules now attach stable `nodeId` / `edgeId` metadata:
    - `src/lib/repairKnowledgeGraph.ts`
    - `src/lib/manualSectionLinks.ts`
    - `src/lib/diagnosticCrossLinks.ts`
  - graph-heavy surfaces now emit a machine-readable export snapshot:
    - `src/app/repair/[year]/[make]/[model]/[task]/page.tsx`
    - `src/app/repair/[year]/[make]/[model]/page.tsx`
    - `src/app/wiring/[year]/[make]/[model]/[system]/page.tsx`
    - `src/app/codes/[code]/CodePageClient.tsx`
  - `src/lib/vehicleHubGraph.ts` builds graph-driven exact-vehicle hubs from canonical IDs
  - exact vehicle hubs now also surface shared symptom spokes and task-backed code fallbacks so the graph can traverse through shared concepts without forcing users to think cross-vehicle
  - `src/lib/vehicleHubLinks.ts` builds canonical vehicle-hub back-links from code and wiring surfaces
  - exact repair guides now link back to the year/make/model hub, and model guide pages link into a representative exact-vehicle hub
  - code pages now emit graph-driven exact vehicle hub links
  - exact wiring pages now emit graph-driven exact vehicle hub links and a direct hub CTA
  - current Search Console enrichment priority is:
    - cluster level: lighting first, then brakes, battery, oil/fluids, and filters
    - coverage-backed exact-vehicle hubs to actively push right now: `2004 Acura TSX`, `2008 Honda Civic`
    - watchlist family demand to revisit once coverage is real: `Jeep Grand Cherokee`, `Ford Escape`, `Ford Fusion`, `Nissan Altima`, `Ford Explorer`, `Jeep Cherokee`, `Nissan Rogue`, `Toyota Tacoma`, `Hyundai Elantra`, `Kia Optima`, `Hyundai Tucson`
    - `npm run analytics:command-centers` is the combined weekly command-center report:
      - it pulls current GSC exact-repair page visibility, current GA4 organic exact-repair sessions, and the latest 24-hour GSC query snapshot
      - it writes `scripts/seo-reports/command-center-opportunities-YYYY-MM-DD.json` and `.md`
      - homepage command-center cards should follow the coverage-backed shortlist from that report, not raw weekly page breakouts or uncovered vehicle watchlist demand
  - graph-priority helpers now also surface report-backed orphan symptom hubs and orphan code pages:
    - `src/lib/graphPriorityLinks.ts`
  - repair category pages now reinforce report-backed symptom hubs, support-gap exact repair pages, and priority code pages:
    - `src/app/repairs/[task]/page.tsx`
  - exact repair pages now reinforce report-backed symptom hubs and priority code pages in addition to vehicle/code/wiring graph links:
    - `src/app/repair/[year]/[make]/[model]/[task]/page.tsx`
  - symptom hubs now reinforce priority orphan/underlinked code pages in addition to exact repair support gaps:
    - `src/app/symptoms/[symptom]/page.tsx`
  - repair sitemap generation now includes exact vehicle hub URLs under `/repair/{year}/{make}/{model}`
  - wiring sitemap production state as of `2026-03-21`:
    - public `/wiring/sitemap.xml` rewrites to `src/app/api/wiring-xml-index/route.ts`
    - public `/wiring/sitemap/{id}.xml` rewrites to `src/app/api/wiring-xml/[id]/route.ts`
    - `src/lib/static-xml.ts` serves the generated XML files from disk with XML cache headers
    - wiring sitemap chunk size is `10000`; current public set is `17` chunks, with `/wiring/sitemap/16.xml` holding `8413` URLs
    - keep `npm run smoke:prod` checking `/wiring/sitemap/16.xml`, not just the sitemap index, because partial/stale public flips can make the index look healthy while later chunks still fail
  - SpotOn Auto Search Console submissions should use:
    - credential file `~/Desktop/_credentials/gen-lang-client-0236137325-629b7b811bc1.json`
    - service account `spotonauto@gen-lang-client-0236137325.iam.gserviceaccount.com`
    - the unrelated `~/Desktop/_credentials/static-dock-486114-g9-f8a997de0021.json` credential does not have permission on `sc-domain:alloemmanuals.com`
  - `scripts/generate-graph-link-suggestions.ts` writes graph-derived internal-link suggestions to `scripts/seo-reports/`
  - `npm run seo:graph-link-suggestions` currently emits JSON + CSV suggestions grouped by `guide-model`, `code`, and `wiring` source surfaces
  - node metadata is canonical; relation copy belongs on edges in the export model
  - `scripts/audit-knowledge-graph.ts` audits canonical graph snapshots for code, wiring, and vehicle surfaces
  - `npm run audit:knowledge-graph` currently passes with:
    - no dangling edges
    - no node conflicts
    - no edge conflicts
  - Cloudflare KV is no longer part of the runtime stack
  - manual embeddings now live on the local KG-server Postgres instance
  - the current next step is to finish the local-only cutover, then keep burning down the remaining underlinked nodes from the daily graph-priority report
  - auth and personal history utility routes should remain non-indexable
  - sitemap freshness should come from `src/lib/sitemap.ts` or `SITEMAP_LAST_MOD`, not hard-coded stale dates
  - `scripts/internal-link-audit.js` should fail loudly if seed fetches fail instead of silently reporting zero discovered links
  - wiring selector coverage should not import the full `src/data/wiring-coverage.json` into a client component
  - `src/lib/wiringCoverage.ts` is the server-only helper that derives the lightweight selector payload for `/wiring`
  - the interactive diagram viewer in `src/app/wiring/WiringDiagramLibrary.tsx` now overlays a slim vertical `AllOEMManuals.com` edge watermark on diagram images so printed/screenshot schematics retain the brand without obscuring the drawing
  - `src/lib/wiringData.ts` now needs to tolerate model-bucket paths that are not the final engine variant.
    - if a direct `/Repair and Diagnosis/` path fails, or resolves to an empty diagram bucket, the server should re-resolve the best matching variant from the year page and retry before giving up
    - this specifically matters for `Dodge or Ram Truck`-style entries where `RAM 3500 Truck 2WD` is a model bucket and the real diagrams live under engine-specific children
  - AI runtime can now fall back from Gemini to OpenAI for guide generation, vehicle info, diagnostic chat, homepage chat, and second-opinion flows when Gemini is missing or quota-limited
  - deploys that rely on the fallback need `OPENAI_API_KEY` set in the runtime environment
## Working Norms

- This repo is often dirty with unrelated local edits. Stage only task-relevant files.
- If production deploys must exclude unrelated local work, build a clean deploy bundle from `git archive HEAD` and overlay only the task-relevant files before `railway up`.
- For TypeScript changes, verify with `npx tsc --noEmit`.
- The root app `tsconfig.json` should exclude `workers/`; the Cloudflare worker is its own TypeScript project and should be checked separately.
- Prefer direct, user-visible fixes over speculative refactors.


## Corpus Deep-Dive Knowledge (2026-05-08)

### The Two Corpuses

**CHARM (charm.li)** — Operation CHARM, "Collection of High-quality Auto Repair Manuals"
- Coverage: 1982–2013 (some makes to 2014)
- ~24,935 vehicle manifests, 52 makes
- Data: 548GB images.mtbl + 34GB pages.mtbl + 5MB index.json
- Hosted in Ukraine (Kyiv), nginx, .li TLD (Liechtenstein)
- Now shows LEMON redirect banner but all manual pages still serve
- Torrent download available (~700GB)
- Contact: operation-charm@tuta.io

**LEMON (lemon-manuals.la / lemon-manuals.org.ua)** — "Spiritual successor to CHARM"
- Coverage: 1960–2025
- ~279,988 vehicle manifests, 65 makes
- Data: 481GB images.mtbl + 31GB pages.mtbl + 142MB index.json
- Contains ALL CHARM manuals plus 2014+ content
- Finer granularity: trim levels, transmission types, VIN codes
- Launched April 5, 2026

**Format:** Both use mtbl (sorted string table) — compressed key-value.
- CHARM keys = paths; values = `SPECIAL_/` or `fileID,timestamp`
- LEMON keys include `bulletin_hash_TYPE` pattern
- Backend binary: `lemon-website-linux-x86_64-musl` serves both on localhost:8080

### Site Tree Structure (both CHARM and LEMON)

```
/{make}/{year}/{model engine}/
  ├── Repair and Diagnosis/
  │   ├── A L L Diagnostic Trouble Codes (DTC)/
  │   ├── Relays and Modules/
  │   ├── Sensors and Switches/
  │   ├── Maintenance/
  │   ├── Engine, Cooling and Exhaust/
  │   ├── Powertrain Management/
  │   ├── Transmission and Drivetrain/
  │   ├── Brakes and Traction Control/
  │   ├── Starting and Charging/
  │   ├── Power and Ground Distribution/
  │   ├── Steering and Suspension/
  │   ├── Heating and Air Conditioning/
  │   ├── Restraints and Safety Systems/
  │   ├── Accessories and Optional Equipment/
  │   ├── Body and Frame/
  │   ├── Cruise Control/
  │   ├── Instrument Panel, Gauges and Warning Indicators/
  │   ├── Lighting and Horns/
  │   ├── Windows and Glass/
  │   ├── Wiper and Washer Systems/
  │   ├── Service Precautions/
  │   ├── Application and ID/
  │   ├── Locations/
  │   ├── Diagrams/
  │   ├── Specifications/
  │   ├── Technical Service Bulletins/
  │   ├── Diagnostic Trouble Codes/
  │   └── Tools and Equipment/
  ├── Parts and Labor/
  │   └── (parallel tree with Labor Times + Parts Information)
  ├── (Download .zip for offline use)
  └── (Download .zip with better file names)
```

### Content Types That Actually Render

| Type | Location | Example | Status |
|---|---|---|---|
| **Service and Repair** | Component leaf pages | Oil Filter Replacement | ✅ Rich step-by-step with images, torque specs |
| **Description and Operation** | Component leaf pages | MAF sensor theory, DTC references | ✅ Text + images |
| **DTC Code Charts** | `/A L L Diagnostic Trouble Codes/Testing and Inspection/{P|B|C|U} Code Charts/{code}/` | P0101, P0300, B2191 | ✅ **Diagnostic flow chart images** + circuit description + wiring diagrams. This is where electrical diagnosis lives. |
| **Locations** | Component leaf pages | "LF of engine compartment, on air intake duct" | ✅ Short text |
| **Diagrams** | Various tree paths | Wiring diagrams, electrical schematics, connector views | ✅ Image-based. Some have clickable `oxe-region` hotspots linking to related pages. |
| **Specifications** | Various tree paths | Torque specs, capacities, mechanical standards | ✅ Tables when present |
| **Testing and Inspection** | System-level paths (e.g. Powertrain Mgmt) | Symptom diagnostics, component tests | ⚠️ Often 404 at component level. Exists at broader system level. |
| **Maintenance/Fluids** | Maintenance tree | Oil capacity, coolant type, service intervals | ❌ Mostly 404 on CHARM. **LEMON has real Fluids pages with capacity tables.** |
| **TSBs** | Technical Service Bulletins tree | Bulletin text, supersession notices | ⚠️ Some have content, many are folder shells |

### Critical Discovery: Diagnostic Flow Charts Are CODE-DRIVEN

The factory diagnostic logic does NOT live under component pages. It lives under **DTC pages**.

**Example path:**
```
/Chevrolet/1998/S10/T10 Blazer 4WD V6-4.3L VIN W/
  Repair and Diagnosis/
    A L L Diagnostic Trouble Codes ( DTC )/
      Testing and Inspection/
        P Code Charts/
          P0101/
```

The P0101 page contains:
1. Multiple diagnostic chart images (flow charts with if-then branches)
2. Wiring diagram images
3. Circuit description text
4. Clickable `oxe-region` hotspots on images linking to next steps

A human technician starts with the code, not the component. So must our pages.

### Parts and Labor — The Service Writer's Layer

**This is NOT a mirror of Repair and Diagnosis.** It is a separate data layer for estimating and invoicing.

**Labor Times table format:**
| Operation | Standard Hours | Warranty Hours | Skill Level | Notes |
|---|---|---|---|---|
| Replace | 2.0 | 0.9 | B | |
| Diagnose/Test | 1.0 | 0.5 | B | |
| With AC, Add | 0.5 | 0.2 | B | |
| Long Block | 18.3 | 0.0 | B | Includes R&I engine and transfer all components |

- **Standard Hours** = what a shop charges (retail/flag rate)
- **Manufacturer Warranty Hours** = what the dealer gets paid under warranty
- **Skill Level** = A/B/C/D (A=master, B=experienced, C=general, D=apprentice)
- **Notes** = inclusions, exclusions, add-on logic

**Parts Information table format:**
| Part | Mfg | OEM # | Price | Notes |
|---|---|---|---|---|
| Water Pump | GMO | 12532550 | $0.00 | Contact dealer for current price |
| Oil Filter | GMO | 25171377 | $0.00 | |

**Real examples from 1998 Blazer 4WD V6-4.3L:**
- Oil Filter Replace: 0.3 hrs std / 0.3 warranty, Skill C, "Filter Only" + 0.2 hrs to change oil
- Water Pump Replace: 2.0 hrs std / 0.9 warranty, Skill B
- Engine Complete Assembly (auto trans): 11.8 hrs std / 10.3 warranty, Skill B

### Image System

- Images served from `/{make}/{year}/{model}/images/{dataset}/{collection}/{id}/`
- CHARM example: `/images/DM12Q313/gm10/38019402/`
- Image stores: 500GB+ each corpus
- CHARM images in PostgreSQL currently reference dead localhost URLs
- LEMON uses `/images25/{ID}/` pattern
- Images have clickable regions (`<a class='oxe-region'>`) for interactive diagnostics

### Tree Navigation Quirks

- **Folder nodes** (`li-folder` class) have `name=` but NO `href=` — they expand to show children
- **Leaf nodes** have both `href=` and `name=` — these are the actual content pages
- Some nodes have `href=` but still 404 (data structure includes paths without extracted content)
- **Multiple paths can point to the same content** — the tree has redundancy by design
- Make aliases exist: `Dodge` → `Dodge and Ram`, `Nissan` → `Nissan-Datsun`
- URL encoding uses `%28`/`%29` for parentheses

### Vehicle Granularity Variance

| Make | Example Path |
|---|---|
| Toyota | `Camry L4-2.4L (2AZ-FE)` — model + engine code |
| Honda | `Accord L4-2.4L` — model + engine displacement |
| BMW | `325i Sedan (E46) L6-2.5L (M54)` — body code + variant + engine |
| Chevrolet | `Blazer 4WD V6-4.3L VIN W` — VIN code included |
| Audi | `A4 Quattro Sedan (8E2) L4-2.0L Turbo (BPG)` — platform + body + engine |

### LEMON Advantages Over CHARM (2014+)

- **Quick Lookups** — Common Specs & Procedures
- **Fluids** — Actual capacity tables with OEM spec numbers
- **Labor Times** — Embedded in Parts and Labor
- **Specifications Index** — Torque values organized by system
- **Full Removal/Installation procedures** — Real step-by-step with images
- **Hybrid/Electric drive systems** — New categories for modern vehicles

### Content Gap Reality Check

- **CHARM (1982-2013):** Strong on DTCs, wiring, TSBs, component R&I. Weak on consumer maintenance guides (oil change steps, fluid capacities). Maintenance tree has many 404s.
- **LEMON (2014+):** Has real consumer-facing content — Fluids pages with exact capacities, Quick Lookups, full R&I procedures.
- **For 1982-2013 maintenance tasks:** Need to extract from component-level Service and Repair pages (e.g., Oil Filter R&I under Engine Lubrication) rather than Maintenance tree.

### Translation Layer Vision

The product is NOT a manual browser. It is a **translation layer**:

**Input:** Factory manual technical prose + diagrams + specs + labor times + parts
**Output:** Consumer-friendly repair guide that reads like a knowledgeable friend walking you through it

**Every page must include:**
- Estimated time (from Parts and Labor)
- Skill level (from Parts and Labor)
- Parts needed with OEM numbers (from Parts and Labor)
- Tools needed (extracted from "Special Tools Required" sections)
- Torque specs (from Specifications or inline in Service and Repair)
- Fluid capacities (from LEMON Fluids pages or Maintenance specs)
- Step-by-step procedure (from Service and Repair, translated)
- Factory images (from manual image store)
- Affiliate links to buy parts/tools

**SEO pages to generate:**
- `/2015/toyota/camry-le/oil-change` — exact vehicle + task
- `/codes/p0101` — DTC code pages
- `/2015/toyota/camry-le/torque-specs` — spec reference pages
- `/2015/toyota/camry-le/fluids` — fluid capacity pages
- `/symptoms/rough-idle` — symptom hub pages

### Deployment Architecture

| Component | Location | Notes |
|---|---|---|
| **VPS** | `116.202.210.109` | Ubuntu, 62GB RAM, `/data` = 3.5TB disk |
| **LMDB Backend** | `127.0.0.1:8080` on VPS | Serves BOTH corpuses. This is the source of truth. |
| **Production Next.js** | `/root/alloemmanuals.com/` on VPS | Port 3002. Live site. |
| **Dev Next.js** | `/home/lyndon/projects/alloemmanuals.com/` | Local development copy. |
| **PostgreSQL** | VPS `spotonauto` DB | `manual_embeddings` = 1.8M rows (CHARM 1982-2013) |

**Critical distinction:** The public charm.li website is a **mirror/redirect**. The real complete data lives on the VPS LMDB backend (`localhost:8080`). Paths that 404 on charm.li may resolve perfectly on the VPS backend. Always test against `localhost:8080` on the VPS, not charm.li.

### Local Development Assets

| Asset | Location |
|---|---|
| CHARM index | `/data/lemon-manuals/charm/index.json` |
| LEMON index | `/data/lemon-manuals/lemon/index.json` |
| CHARM pages mtbl | `/data/lemon-manuals/charm/pages.mtbl` (34GB) |
| LEMON pages mtbl | `/data/lemon-manuals/lemon/pages.mtbl` (31GB) |
| CHARM images mtbl | `/data/lemon-manuals/charm/images.mtbl` (548GB) |
| LEMON images mtbl | `/data/lemon-manuals/lemon/images.mtbl` (481GB) |
| Backend binary | `lemon-website-linux-x86_64-musl` on VPS port 8080 |
| Existing miners | `scripts/mine-lemon-fluids.mjs`, `mine-lemon-specs.mjs` |

### Key Scripts and Tools

- `mine-lemon-fluids.mjs` — Crawls LEMON `:8080` for `/Fluids/` pages, parses `clsArticleTable` HTML tables
- `mine-lemon-specs.mjs` — Crawls LEMON HTML tree, extracts torque specs from Specifications Index
- `charmParser.ts` — Fetches HTML from LMDB backend, handles make aliases, 404 parent recovery
- `manualEmbeddingsStore.ts` — PostgreSQL access, `findManualSectionsByTerms()` (queries entire make+year then filters client-side — known performance issue)
- mtbl Rust tools compiled from `lemon-website-source.tar.gz` — can dump keys/values directly

## Recent Changes (2026-05-08)

### SERP CTR & Crawl Budget Improvements

- **Tool page titles now include the quick answer** (e.g. "VW Tiguan Coolant: G12evo/G13 Pink (50/50 Mix) | AllOEMManuals") to stand out in positions 6–12 where 95 of 122 impressions currently get 0% CTR.
- **Tool pages now link to `/maintenance/{year}/{make}/{model}/`** via a "View Factory Specs" CTA above the nav, driving internal link equity to maintenance hubs.
- **Vehicle variant URL redirects added** in `src/app/vehicles/[year]/[make]/[model]/page.tsx`:
  - Detects corpus variant paths like `/vehicles/2011/ford/ranger-2d-pickup-extra-cab` using `VEHICLE_PRODUCTION_YEARS` prefix matching.
  - Redirects to clean hub `/vehicles/{year}/{make}/{model}/` with 307 (Next.js `redirect()` default).
- **Old `spotonauto.com` variant sitemaps deleted** from `public/vehicles/sitemap/`. These contained 112K+ wrong-domain variant URLs that were leaking crawl budget.
- **Domain redirect added**: `spotonauto.com` and `www.spotonauto.com` → `alloemmanuals.com` in `next.config.js`.
- **Google Indexing API script created**: `scripts/push-maintenance-indexing.mjs` pushes maintenance hub + spec pages via `URL_UPDATED`. Supports `--from-tools`, `--from-db`, and `--urls` modes.

### Content Factory Provider Update

- **OpenAI removed from content factory** (`scripts/content-machine/generate-profiles.mjs`). OpenAI is now reserved for live user chat ONLY.
- **Kimi is primary**, with **Gemini fallback** for batch repair profile generation.
- **All three providers currently quota-blocked** (2026-05-08):
  - OpenAI: $10.59 spent, 10,000 RPD limit hit.
  - Kimi: account suspended — insufficient balance.
  - Gemini: free tier exhausted (`RESOURCE_EXHAUSTED` on `gemini-2.0-flash`).
- **1,778 query-targets remain unprocessed** (298 profiles exist in `vehicle-repair-profiles.json`). Resume generation after recharging any provider.
- **Moonshot API base URL corrected** from `https://api.moonshot.cn/v1` → `https://api.moonshot.ai/v1` across:
  - `scripts/content-machine/generate-profiles.mjs`
  - `src/services/geminiService.ts`
  - `src/app/api/chat/route.ts`
