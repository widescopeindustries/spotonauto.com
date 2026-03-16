# Wiring Indexing Plan

This is the execution brief for turning SpotOnAuto wiring diagrams into an offline indexed asset that can power stable UX and static SEO pages.

## Goal

Build a deterministic wiring dataset separated by:

- `year`
- `make`
- `model`
- `variant`
- `system`
- `diagram`

Then use that dataset to generate static wiring landing pages and system clusters that do not depend on live archive scraping at request time.

## Why The Current Approach Breaks

Current wiring pages still depend on live archive fetches for:

- variant discovery
- diagram index discovery
- diagram image fetches

That causes three classes of failures:

- archive/network outage becomes a broken selector
- model-to-variant matching is fuzzy and unstable
- static SEO pages still rely on live upstream fetches during render

The fix is to crawl once, normalize once, save once, and serve locally.

## Recommended Architecture

Do not start with embeddings.

For wiring, the first win is a deterministic structured index, not semantic retrieval.

### Core Outputs

1. `src/data/wiring-vehicle-index.json`
- vehicle-level coverage
- `year -> make -> model -> variants`
- used by selectors and validation

2. `src/data/wiring-variant-map.json`
- exact resolved mapping from `year/make/model` to one or more archive variants
- avoids runtime fuzzy matching

3. `src/data/wiring-diagram-index.ndjson`
- one row per diagram entry
- large enough that NDJSON is safer than a giant nested JSON blob

4. `src/data/wiring-system-summary.json`
- aggregated counts and top systems per vehicle
- used by static hub pages

5. `src/data/wiring-page-manifest.json`
- explicit list of static SEO pages to generate

### Diagram Record Shape

Each diagram row should look like:

```json
{
  "year": 2002,
  "make": "Lincoln",
  "model": "Continental",
  "variant": "Continental V8-4.6L DOHC VIN 9",
  "system": "Power Distribution",
  "componentPath": "Power Distribution > Fuse Panel",
  "diagramName": "Fuse Panel Layout",
  "diagramSlug": "fuse-panel-layout",
  "sourcePath": "/Lincoln/2002/Continental%20V8-4.6L%20DOHC%20VIN%209/Repair%20and%20Diagnosis/Power%20Distribution/Diagrams/Fuse%20Panel%20Layout/",
  "diagramUrl": "https://data.spotonauto.com/...",
  "imageCount": 2,
  "keywords": ["fuse panel", "power distribution", "battery feed"],
  "searchText": "2002 Lincoln Continental fuse panel layout power distribution battery feed",
  "lastVerifiedAt": "2026-03-12T00:00:00.000Z"
}
```

## The Crew

Treat these as 10 workstreams.

### 1. Coverage Harvester
- Crawl make/year/variant directories.
- Save raw coverage and crawl checkpoints.
- Reuse the `verify-wiring-coverage.mjs` approach, but expand it to full diagram extraction.

### 2. Variant Resolver
- Convert archive variants into stable `year/make/model -> variant[]` mappings.
- Persist exact matches instead of redoing fuzzy resolution at runtime.
- Support one model mapping to multiple engine variants.

### 3. Taxonomy Normalizer
- Normalize system names and component paths.
- Map noisy archive folder names into stable internal categories.
- Example: `Charging System`, `Generator`, and `Alternator` should roll up cleanly.

### 4. Diagram Extractor
- Pull every `Diagrams/` link under `Repair and Diagnosis`.
- Extract image counts and title metadata.
- Store source path and normalized display fields.

### 5. Vehicle Packager
- Aggregate records into vehicle hubs:
  - total diagram count
  - top systems
  - available variants
  - best canonical variant labels

### 6. Static SEO Generator
- Build pages from local index artifacts, not live fetches.
- Generate:
  - `/wiring/[year]/[make]/[model]`
  - `/wiring/[year]/[make]/[model]/[system]`
- Only generate per-diagram pages if the title quality is strong enough.

### 7. Internal Linking
- Cross-link wiring pages to:
  - repair guides
  - DTC pages
  - manual sections
  - symptom pages
- This is what makes the SEO cluster compound instead of sitting isolated.

### 8. Image Strategy
- Decide whether to:
  - keep image fetches live-on-click, or
  - pre-index image URLs and dimensions, or
  - mirror critical diagrams locally
- Recommendation: pre-index metadata first, mirror later only for high-value clusters.

### 9. Quality Gate
- Add validation checks:
  - duplicate diagram URL detection
  - empty system rejection
  - impossible year/make/model records
  - per-vehicle minimum counts
- Build a reject log instead of silently dropping bad rows.

### 10. Operations + Refresh
- Support resumable incremental recrawls.
- Reverify stale records on a schedule.
- Keep a failure report for makes/years that started timing out or changed structure.

## Static SEO Rollout

### Phase 1: Vehicle Hubs

Generate:

- `/wiring/2002/lincoln/continental`

Each page should include:

- coverage summary
- available systems
- matched variants
- counts
- links into system pages

This is the lowest-risk long-tail expansion.

### Phase 2: System Cluster Pages

Generate:

- `/wiring/2002/lincoln/continental/starter`
- `/wiring/2002/lincoln/continental/alternator`
- `/wiring/2002/lincoln/continental/fuel-pump`

These pages should render purely from local indexed diagram records.

### Phase 3: Individual Diagram Pages

Only do this after title normalization is good enough.

Generate pages like:

- `/wiring/2002/lincoln/continental/power-distribution/fuse-panel-layout`

This is where the SEO surface gets huge, but it also creates the most duplication risk if naming is sloppy.

## Build Order

### Step 1
Create a new crawler:

- `scripts/index-wiring-diagrams.mjs`

Responsibilities:

- enumerate makes, years, variants
- extract diagram links
- emit NDJSON and summary JSON artifacts
- save checkpoints for resume

### Step 2
Create a local data access layer:

- `src/lib/wiringIndex.ts`

Responsibilities:

- load index artifacts
- resolve vehicles
- return systems for a vehicle
- return diagrams for a vehicle/system
- return related pages for internal linking

### Step 3
Change the wiring selector to use local `vehicle-index` and `variant-map` only.

No live archive dependency for selector state.

### Step 4
Refactor static SEO pages to use the local wiring index, not `fetchWiringVariants()` and `fetchWiringDiagramIndex()` at render time.

### Step 5
Add a vehicle hub route:

- `src/app/wiring/[year]/[make]/[model]/page.tsx`

### Step 6
Expand sitemap generation from `wiring-page-manifest.json`.

## Data Storage Recommendation

Use local build artifacts first.

- JSON for compact summary files
- NDJSON for the large diagram corpus

Do not put the first version in Supabase.

Reason:

- static generation wants local deterministic data
- debugging crawler quality is easier with files
- the page layer should not block on database reads if this becomes thousands of pages

Database can come later for analytics or editorial tooling.

## Immediate Constraints

### Archive availability
- The live wiring archive is currently a hard dependency and can fail outright.
- We have already seen network reachability failures from this environment.

### Variant quality
- Model names and archive variants do not map 1:1.
- We need a persisted exact-variant map, not request-time guessing.

### Page count
- Current verified wiring coverage is already large enough for a meaningful static rollout.
- Approximate starting set:
  - hundreds of vehicles
  - thousands of system pages

That is enough to ship before diagram-level pages.

## What I Recommend Building Next

1. `scripts/index-wiring-diagrams.mjs`
2. `src/lib/wiringIndex.ts`
3. `src/data/wiring-variant-map.json`
4. vehicle hub route generation
5. static system pages fully backed by local data

## Decision

The correct strategy is:

- offline crawl
- exact variant map
- local structured index
- static vehicle and system pages
- live image fetch only as a secondary concern

That gives us a stable selector, durable SEO pages, and a wiring corpus that is actually hard to find elsewhere.
