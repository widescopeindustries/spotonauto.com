# SpotOnAuto Implementation Blueprint

## Objective

Turn SpotOnAuto into the category-defining OEM-grounded repair intelligence platform for long-tail vehicle, wiring, and diagnostic workflows.

The goal is not just traffic recovery. The goal is to build one system where:

- the corpus is the source of truth,
- retrieval is reliable,
- SEO compounds from real knowledge assets,
- and monetization grows from user trust instead of pageviews alone.

## North Star

SpotOnAuto should become the best answer on the internet for:

- exact year-make-model-task repair questions,
- OEM-grounded wiring and manual lookups,
- code and symptom diagnosis workflows,
- and “what do I do next” decision support for DIYers and small shops.

## Strategic Principles

1. Canonical truth over clever growth hacks
2. Corpus-first retrieval over live HTML dependency
3. Durable landing pages over one-off generated answers
4. User trust over volume
5. Product monetization over ad dependence

## Layer 1: Technical Sovereignty

### Objective

Stop leaking crawl equity, index signals, and analytics integrity.

### Decisions

- Canonical host: `https://spotonauto.com`
- Legacy host: `https://www.spotonauto.com` redirects permanently to apex
- Preview hosts: non-indexable, no analytics
- All canonical, sitemap, and internal URLs point directly to apex

### Work Items

1. Fix canonical generation on dynamic manual routes
2. Enforce preview-host `X-Robots-Tag: noindex, nofollow`
3. Serve `robots.txt` as `Disallow: /` on preview hosts
4. Stop analytics execution on preview and legacy hosts
5. Audit sitemap and canonical parity weekly

### Success Metrics

- Zero indexed preview URLs
- Zero malformed canonicals on sampled dynamic pages
- Zero internal host redirects
- Analytics contains only production-host traffic

## Layer 2: Knowledge Backbone Consolidation

### Objective

Make the KG server the actual backbone rather than a fragile upstream dependency.

### Architecture Target

- LMDB/CHARM mirror on the KG server remains the raw corpus store
- local PostgreSQL on the KG server becomes the canonical retrieval store
- SpotOnAuto app reads retrieval through a single local service boundary
- Live HTML fetch becomes fallback and refresh path, not primary runtime dependency

### Work Items

1. Pick one vector store and retire split-brain writes
2. Normalize raw pages into structured documents:
   - corpus path
   - vehicle identity
   - system
   - section title
   - extracted text
   - diagram/image references
   - source freshness
3. Rebuild the indexing pipeline against local Postgres
4. Add model and variant disambiguation to retrieval filters
5. Add retrieval quality scoring and fallback order
6. Add health reporting:
   - corpus freshness
   - embedding coverage
   - retrieval latency
   - failure rate
   - top empty-query classes

### Success Metrics

- More than 95% of guide generations can be served from stored corpus documents
- Retrieval p95 under 500ms before LLM generation
- Variant mismatch rate trending down
- Daily indexing and health jobs complete without manual intervention

## Layer 3: Unified Knowledge Graph

### Objective

Turn manuals, wiring, codes, repairs, and community into one connected system.

### Canonical Entity Model

- Vehicle: year, make, model, engine, trim
- Task: repair action
- System: brakes, charging, cooling, starting, etc.
- Symptom: noise, light, failure mode
- Code: DTC
- Source document: OEM manual section, wiring diagram, NHTSA data, verified community answer

### Work Items

1. Define stable IDs for vehicle-task-system combinations
2. Attach every repair page to:
   - manual sections
   - wiring entries
   - code relationships
   - community threads where relevant
3. Generate related-links modules from entity relationships instead of static guesses
4. Expose provenance on every answer surface

### Success Metrics

- Higher page depth per session on search landings
- Higher recovery of formerly winning repair URLs
- Lower bounce on long-tail entry pages

## Layer 4: Search Surface Expansion

### Objective

Publish the moat in forms that search engines and answer engines can rank.

### Primary Surface Families

1. Repair pages
2. Wiring system pages
3. Manual section pages
4. DTC code pages
5. Spec pages
6. Vehicle/model hubs

### Work Items

1. Build make/model/system hubs from the knowledge graph
2. Add durable top-query templates for high-value repair clusters
3. Link repair pages to exact wiring and manual evidence
4. Add breadcrumb, HowTo, QAPage, and relevant article schema where accurate
5. Expand high-intent pages first:
   - oil change
   - brake pads and rotors
   - alternator
   - battery
   - thermostat
   - starter
   - serpentine belt
   - water pump
   - high-volume DTCs

### Success Metrics

- Active organic repair pages with impressions per day
- Median position on target clusters
- Non-homepage share of organic entrances

## Layer 5: Trust and UX

### Objective

Make SpotOnAuto feel verifiable, specific, and safe to act on.

### Work Items

1. Show source provenance on guides and diagnostic answers
2. Expose confidence and coverage state
3. Add exact vehicle fit messaging everywhere
4. Create “why this answer” panels with supporting evidence
5. Add reviewer and update metadata to top pages

### Success Metrics

- Higher conversion from organic landings to guide interactions
- Lower abandonment on diagnostic flows
- Stronger repeat usage for saved vehicles and garage flows

## Layer 6: Revenue Architecture

### Objective

Monetize the knowledge moat with defensible product value.

### Consumer

- Free: browse, basic guide access, lightweight diagnostic assistance
- Pro: PDF export, saved garage, advanced diagnostic sessions, source-backed deep dives
- Pro Plus: heavier usage, richer exports, premium history/workflow features

### Commerce

- High-intent parts and tools on repair pages
- Better retailer mix over time, not Amazon-only

### B2B

- Shop and fleet plans
- Team accounts
- API and data licensing later

### Revenue Metrics

- Visitor to workflow start
- Workflow start to sign-up
- Sign-up to paid
- Affiliate revenue per 1,000 qualified repair sessions
- MRR from consumers and B2B separately

## Execution Sequence

### Phase 0: Stability

- Fix host, canonical, preview indexing, analytics contamination
- Validate sitemap and crawl hygiene

### Phase 1: Backbone

- Consolidate retrieval store
- Rebuild indexing pipeline around one source of truth
- Add health and quality telemetry

### Phase 2: Knowledge Graph

- Create stable vehicle-task-system entities
- Attach repair, wiring, manual, and code surfaces together

### Phase 3: Search Growth

- Expand durable high-intent templates
- Publish make/model/system hubs
- Improve interlinking and evidence modules

### Phase 4: Product and Monetization

- Turn on real pricing and packaging
- Add pro features that map to real user need
- Add shop and fleet offering

## Weekly KPI Scoreboard

Track these every week:

- Organic clicks
- Repair impressions per day
- Active repair pages with impressions
- Median repair position
- Returning winner URLs
- Retrieval success rate
- Retrieval p95 latency
- Empty-result rate
- Affiliate clicks
- Workflow starts
- Sign-ups
- Paid conversions

## Immediate Build Order

1. Technical sovereignty fixes
2. Retrieval architecture decision and migration
3. Corpus observability
4. Knowledge graph linking layer
5. Search surface expansion
6. Product monetization activation

## Standard for Every New Feature

Before shipping anything new, answer these:

1. Does it strengthen the corpus as the source of truth?
2. Does it improve trust for the user?
3. Does it compound search, product, or revenue?
4. Does it create new operational fragility?

If the answer to the first three is not yes, it does not ship.
