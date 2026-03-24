# Bubba Graph — The Human-Readable Knowledge Graph
*March 24, 2026*

## What Is Bubba Graph

Bubba Graph is a dedicated agent/pipeline whose sole job is to know the entire SpotOnAuto corpus inside and out — every diagnostic flow, every wiring diagram, every procedure, every DTC — and arrange it into a graph that is:

- **Intuitive** — organized by what a car owner experiences, not by how engineers categorized it
- **Traversable** — every node connects to related nodes via typed edges
- **Deliverable** — pre-computed JSON slices served from Cloudflare edge, sub-50ms worldwide
- **Indexable** — every slice is a unique URL that Google can crawl and rank
- **Searchable** — semantic search via embeddings, exact search via code/part number
- **Instantly retrievable** — no server-side rendering at request time, everything pre-built

## Current State of the Data

### What Exists
- **55.9GB Squashfs archive** (`lmdb-pages.sqsh`) — the entire corpus (all HTML pages)
- **24,935 vehicle variants** cataloged in `vehicle-index.json`
- **Graph schema v1** — 10 node types, 12 edge types (well-designed, ready to use)
- **Pipeline scripts** (01-scout, 02-process-bundle, 03-bulk-pipeline) — scaffolded, partially tested
- **11 vehicles processed** into JSON so far (sample: 2008 Camry = 13,184 pages, 13,916 images)
- **KG pipeline scripts** (01-register-vehicles, 02-extract-content, 03-parallel-extract, 04-index-by-vehicle)
- **~348GB free disk** on the Dell Latitude

### What's Missing
- The sqsh isn't mounted — need to mount it to access the raw HTML pages
- Only 11 of 24,935 vehicles have been processed into JSON
- No graph nodes or edges have been created yet
- No graph slices have been pre-computed
- No semantic embeddings exist yet
- The pipeline exists but hasn't been run at scale

## Bubba Graph Architecture

### Layer 1: Corpus Extraction (Raw Data → Structured JSON)
```
lmdb-pages.sqsh (55.9GB)
  ↓ mount + extract
Per-vehicle JSON bundles
  - Each vehicle: ~13K pages of HTML
  - Extracted: sections, breadcrumbs, DTCs, part numbers, torque specs, labor times, images, cross-refs
  - Already have scripts for this (02-process-bundle.js)
```

### Layer 2: Graph Construction (Structured JSON → Nodes + Edges)
```
Per-vehicle JSON bundles
  ↓ classify + deduplicate + link
Graph Database (JSON files, one per node type)
  - Vehicle nodes (24,935)
  - System nodes (~50-80 canonical systems)
  - Subsystem nodes (~500-1000)
  - Procedure nodes (~2-5M unique, after dedup)
  - DTC nodes (~10-50K unique codes with content)
  - Diagram nodes (~500K-1M unique images after dedup)
  - Part nodes (~100K+ unique parts)
  - Specification nodes (torque values, capacities, etc.)
  - Edges: APPLIES_TO, BELONGS_TO_SYSTEM, RELATED_DTC, REFERENCES_DIAGRAM, etc.
```

### Layer 3: Flow Generation (Nodes + Edges → Diagnostic Flows)
```
Graph nodes + edges
  ↓ traversal engine
Pre-computed diagnostic flows
  - Code flows: P0420 on 2007 Camry → causes → diagnostic steps → repairs → parts
  - Symptom flows: "overheats in traffic" → probable components → tests → repairs
  - System flows: 2010 Acura TL Electrical → all components → all procedures
  - Each flow = a JSON slice ready to serve as a page
```

### Layer 4: Human Translation (Technical Flows → Plain English)
```
Pre-computed diagnostic flows (technical)
  ↓ AI narration pass
Human-readable diagnostic guides
  - "Your catalytic converter isn't cleaning exhaust well enough" instead of "Catalyst system efficiency below threshold bank 1"
  - "Find the 4-wire connector behind the exhaust, about 12 inches past the catalytic converter" instead of "O2 sensor connector C205 pins 3-4"
  - Cached alongside the technical data
```

### Layer 5: Edge Delivery (Human-Readable Flows → Cloudflare)
```
Human-readable diagnostic guides
  ↓ upload to Cloudflare R2 + KV
Edge-delivered pages
  - Static JSON in KV, HTML rendered client-side or via Workers
  - Sub-50ms worldwide
  - Every page is a unique URL: /flow/p0420/2007/toyota/camry
  - Every page has affiliate links, related diagrams, repair procedures
```

## The Two Paths Through the Graph

### Path A: User Knows What's Wrong (Direct Navigation)
```
User selects: 2010 Acura TL → Electrical System
  ↓
Graph query: vehicle:acura:2010:tl → HAS_SYSTEM → system:electrical
  ↓
Shows all electrical subsystems (Charging, Starting, Lighting, Power Windows, etc.)
  ↓
User picks: Charging System
  ↓
Graph query: subsystem:charging-system → CONTAINS → [alternator, battery, voltage regulator, wiring]
  ↓
Each component links to:
  - Repair procedure (with labor time + difficulty)
  - Wiring diagram (with clickable regions)
  - Related DTCs (P0562, P0622, etc.)
  - Parts needed (with affiliate links)
  - Specifications (output voltage, belt tension, etc.)
```

### Path B: User Doesn't Know What's Wrong (AI-Guided)
```
User describes: "My battery keeps dying overnight"
  ↓
AI maps to graph: symptom:parasitic-drain
  ↓
Graph traversal: symptom → INDICATES → [components with parasitic draw potential]
  ↓
AI generates diagnostic flow:
  1. "Let's check if something is draining your battery while the car is off"
  2. "You'll need a multimeter" [tool link]
  3. "Disconnect the negative battery cable and put the meter in series" [diagram link: battery circuit]
  4. "Reading above 50mA? Pull fuses one at a time until the draw drops" [fuse box diagram link]
  5. "The fuse that drops the reading tells you which circuit has the drain"
  6. "If it's fuse F12 (Interior Lights), check the door switches" [procedure link + part links]
  ↓
Each step has: diagram, procedure reference, part links, next step options
```

## Implementation: Bubba Graph Agent

### What Bubba Graph Does
Bubba Graph is an agent (can be a cron job, a dedicated session, or an on-demand worker) that:

1. **Knows the corpus** — has indexed the entire 55.9GB sqsh and can answer "what do we have for a 2008 Camry alternator?"
2. **Builds the graph incrementally** — processes vehicles one at a time, extracts nodes/edges, deduplicates
3. **Generates flows** — traverses the graph to create diagnostic flows for every vehicle × code/symptom combination
4. **Translates to human language** — runs an AI pass over technical content to make it accessible
5. **Deploys to edge** — pushes completed slices to Cloudflare KV/R2
6. **Maintains freshness** — can re-process vehicles, update edges, add new flows

### Processing Pipeline (Per Vehicle)

```
1. Mount sqsh, locate vehicle bundle
2. Extract all HTML pages → structured JSON
   - Classify each page: procedure, DTC, wiring, specification, parts list
   - Extract: title, breadcrumb path, system assignment, images, DTCs mentioned, parts mentioned, specs
3. Create/update graph nodes
   - Vehicle node (or find existing)
   - System nodes (normalize to canonical names)
   - Procedure nodes (content-hash for dedup)
   - DTC nodes (code + content hash)
   - Diagram nodes (image hash for dedup)
   - Part nodes, Spec nodes, FuseRelay nodes
4. Create edges
   - APPLIES_TO (content → vehicle)
   - BELONGS_TO_SYSTEM (content → system)
   - RELATED_DTC (procedure ↔ DTC)
   - REFERENCES_DIAGRAM (procedure/DTC → diagram)
   - REQUIRES_PART (procedure → part)
   - IMAGE_MAP_LINK (diagram → DTC/procedure, from oxe-region hotspots)
   - SHARES_CONTENT (vehicle ↔ vehicle, from shared content hashes)
5. Generate flow slices for this vehicle
   - One slice per DTC on this vehicle
   - One slice per system on this vehicle
   - One slice per common symptom mapped to this vehicle's components
6. AI narration pass on flow slices
7. Upload completed slices to Cloudflare
```

### Estimated Scale
- 24,935 vehicles × ~13K pages each = ~324M total pages
- After content-hash dedup: estimate 12-15M unique procedure/DTC/diagram nodes
- After compression: 12-15GB total graph data
- Processing time at 12.8 sec/vehicle: ~3.7 days sequential, ~9 hours with 10 parallel workers
- Final Cloudflare bill: ~$20-25/month for R2 + KV

## Priority Order

### Phase 1: Mount + Bulk Extract (Days 1-3)
- Mount lmdb-pages.sqsh
- Run bulk pipeline across all 24,935 vehicles
- Output: per-vehicle JSON bundles in /home/lyndon/lab/processed/

### Phase 2: Graph Construction (Days 4-7)
- Process all vehicle JSONs into graph nodes + edges
- Content-hash deduplication across vehicles
- System name normalization
- Output: graph database files (JSON-lines or SQLite)

### Phase 3: Flow Generation (Days 8-10)
- Build traversal engine
- Generate diagnostic flows for top 1,000 vehicles (by search traffic)
- Output: pre-computed flow JSON slices

### Phase 4: Human Translation + Deploy (Days 11-14)
- AI narration pass on flows
- Upload to Cloudflare R2/KV
- Wire into SpotOnAuto Next.js app as new page routes
- Output: live pages at /flow/[code]/[year]/[make]/[model]

### Phase 5: Scale + Iterate (Ongoing)
- Process remaining vehicles
- Add semantic search via embeddings
- Build interactive diagram viewer (click component → see related)
- Connect community forum threads to graph nodes
- Add user-submitted symptom → graph feedback loop

## The Moat

When Bubba Graph is complete, SpotOnAuto will have:
- **Millions of unique, deeply useful pages** that no other site can replicate
- **Every page connected to related pages** via the graph (infinite internal linking)
- **Every page monetizable** via contextual affiliate links (parts, tools)
- **Sub-50ms load times worldwide** via edge delivery
- **AI that traverses real data** instead of hallucinating

This is not a content site. It's a **knowledge engine** with a monetization layer.
