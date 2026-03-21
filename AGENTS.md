# SpotOnAuto Memory

This file is the durable project memory for future Codex runs in this repo.
Update it when product decisions, traps, or standing preferences change.

## Product Direction

- Brand is `SpotOn Auto`.
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

## Known Technical Traps

- Do not reintroduce delayed provider remounting in `src/components/Providers.tsx`.
  That remount was causing scroll resets back to the top while users were moving down the page.
- Diagnostic chat now has browser-local persistent thread memory.
  Preserve resume behavior and the explicit `New thread` reset unless intentionally replacing that system.

## Current Durable Changes

- Homepage is now explicitly moving toward a simpler vehicle-first front door in `src/app/ClientHome.tsx`.
  - the primary landing-page job is to get users into the exact year/make/model hub quickly
  - `year -> make -> model` should feel like the main route, not one option among many stacked sections
  - fallback entry paths like wiring, codes, and diagnosis should remain visible but secondary
  - if query families become clear in Search Console, the homepage can surface a restrained lower-page cluster section keyed to those real DIY lanes
    - keep it below the primary vehicle-first flow
    - use it to reinforce clusters already showing traction, such as lighting, battery, fluids, and filters
    - prefer category pages plus a few exact-query examples over a giant “popular guides” wall
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
  - graph-priority helpers now also surface report-backed orphan symptom hubs and orphan code pages:
    - `src/lib/graphPriorityLinks.ts`
  - repair category pages now reinforce report-backed symptom hubs, support-gap exact repair pages, and priority code pages:
    - `src/app/repairs/[task]/page.tsx`
  - exact repair pages now reinforce report-backed symptom hubs and priority code pages in addition to vehicle/code/wiring graph links:
    - `src/app/repair/[year]/[make]/[model]/[task]/page.tsx`
  - symptom hubs now reinforce priority orphan/underlinked code pages in addition to exact repair support gaps:
    - `src/app/symptoms/[symptom]/page.tsx`
  - repair sitemap generation now includes exact vehicle hub URLs under `/repair/{year}/{make}/{model}`
  - `scripts/generate-graph-link-suggestions.ts` writes graph-derived internal-link suggestions to `scripts/seo-reports/`
  - `npm run seo:graph-link-suggestions` currently emits JSON + CSV suggestions grouped by `guide-model`, `code`, and `wiring` source surfaces
  - node metadata is canonical; relation copy belongs on edges in the export model
  - `scripts/audit-knowledge-graph.ts` audits canonical graph snapshots for code, wiring, and vehicle surfaces
  - `npm run audit:knowledge-graph` currently passes with:
    - no dangling edges
    - no node conflicts
    - no edge conflicts
  - Cloudflare KV remains a helper index, not the canonical corpus store
  - VPS-backed manual embeddings remain the real retrieval backbone
  - current next step is to push the same report-backed prioritization deeper into homepage and diagnostic entry surfaces, then keep burning down the remaining underlinked nodes from the daily graph-priority report
  - auth and personal history utility routes should remain non-indexable
  - sitemap freshness should come from `src/lib/sitemap.ts` or `SITEMAP_LAST_MOD`, not hard-coded stale dates
  - `scripts/internal-link-audit.js` should fail loudly if seed fetches fail instead of silently reporting zero discovered links
  - wiring selector coverage should not import the full `src/data/wiring-coverage.json` into a client component
  - `src/lib/wiringCoverage.ts` is the server-only helper that derives the lightweight selector payload for `/wiring`
  - the interactive diagram viewer in `src/app/wiring/WiringDiagramLibrary.tsx` now overlays a slim vertical `SpotOnAuto.com` edge watermark on diagram images so printed/screenshot schematics retain the brand without obscuring the drawing
  - `src/lib/wiringData.ts` now needs to tolerate model-bucket paths that are not the final engine variant.
    - if a direct `/Repair and Diagnosis/` path fails, or resolves to an empty diagram bucket, the server should re-resolve the best matching variant from the year page and retry before giving up
    - this specifically matters for `Dodge or Ram Truck`-style entries where `RAM 3500 Truck 2WD` is a model bucket and the real diagrams live under engine-specific children
  - AI runtime can now fall back from Gemini to OpenAI for guide generation, vehicle info, diagnostic chat, homepage chat, and second-opinion flows when Gemini is missing or quota-limited
  - deploys that rely on the fallback need `OPENAI_API_KEY` set in the runtime environment
## Working Norms

- This repo is often dirty with unrelated local edits. Stage only task-relevant files.
- For TypeScript changes, verify with `npx tsc --noEmit`.
- Prefer direct, user-visible fixes over speculative refactors.
