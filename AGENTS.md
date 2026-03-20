# SpotOnAuto Memory

This file is the durable project memory for future Codex runs in this repo.
Update it when product decisions, traps, or standing preferences change.

## Product Direction

- Brand is `SpotOn Auto`.
- Do not attribute authorship to `Operation CHARM` or `charm.li`. They were distributors/hosts, not the author.
- When referring to that corpus or live retrieval source, use `factory manual archive`, `manual archive`, or `factory service manual archive`.

## UI Direction

- Homepage direction is matte black with blue/white text.
- Avoid the old starfield / particle-background look on the homepage.
- Favor calmer, more flowing section transitions over noisy sci-fi effects.
- Keep the tone intentional and restrained, not gimmicky.

## Known Technical Traps

- Do not reintroduce delayed provider remounting in `src/components/Providers.tsx`.
  That remount was causing scroll resets back to the top while users were moving down the page.
- Diagnostic chat now has browser-local persistent thread memory.
  Preserve resume behavior and the explicit `New thread` reset unless intentionally replacing that system.

## Current Durable Changes

- Homepage hero/start flow was rewritten toward the matte-black direction in `src/app/ClientHome.tsx` and `src/app/globals.css`.
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
  - `src/lib/vehicleHubLinks.ts` builds canonical vehicle-hub back-links from code and wiring surfaces
  - exact repair guides now link back to the year/make/model hub, and model guide pages link into a representative exact-vehicle hub
  - code pages now emit graph-driven exact vehicle hub links
  - exact wiring pages now emit graph-driven exact vehicle hub links and a direct hub CTA
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
  - current next step is to expand graph-driven hubs beyond the first exact-vehicle surface and use the same export to power stronger related-page/internal-link generation
  - auth and personal history utility routes should remain non-indexable
  - sitemap freshness should come from `src/lib/sitemap.ts` or `SITEMAP_LAST_MOD`, not hard-coded stale dates
  - `scripts/internal-link-audit.js` should fail loudly if seed fetches fail instead of silently reporting zero discovered links
  - wiring selector coverage should not import the full `src/data/wiring-coverage.json` into a client component
  - `src/lib/wiringCoverage.ts` is the server-only helper that derives the lightweight selector payload for `/wiring`
  - AI runtime can now fall back from Gemini to OpenAI for guide generation, vehicle info, diagnostic chat, homepage chat, and second-opinion flows when Gemini is missing or quota-limited
  - deploys that rely on the fallback need `OPENAI_API_KEY` set in the runtime environment
## Working Norms

- This repo is often dirty with unrelated local edits. Stage only task-relevant files.
- For TypeScript changes, verify with `npx tsc --noEmit`.
- Prefer direct, user-visible fixes over speculative refactors.
