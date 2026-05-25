# AllOEMManuals Memory

This file is the durable project memory for future Codex runs in this repo.
Update it when product decisions, traps, or standing preferences change.

## Current State Snapshot (2026-05-19 — Post Full Audit)

### Domain & Traffic
- **Primary domain:** `alloemmanuals.com` (purchased 2026-05-07, ~12 days old)
- **Legacy domain:** `spotonauto.com` → 301 redirects to `alloemmanuals.com` (nginx + Next.js)
- **Google index:** 278,787 pages discovered, 447 excluded by noindex, 64 server errors
- **Homepage SERP:** US position 11.7 (page 2); international positions 4-7
- **Bing Search:** 160 clicks, 3K impressions, 5.32% CTR
- **Bing AI/Copilot citations:** 736 citations, 43 unique pages cited daily
- **ChatGPT referrals:** 17 sessions in GA4
- **Amazon Associates:** Already generating commissions
- **GA4 property:** `G-KS1JPX0V7P` (alloemmanuals.com) — GSC linked
- **spotonauto.com GA4:** Archive only. Was receiving misrouted alloemmanuals traffic due to hardcoded fallback ID (`G-WNFX6CY9RN`). Fixed 2026-05-14.

### Deploy System (2026-05-19)
- **Primary:** VPS auto-deploy watcher (`auto-deploy.timer` polls GitHub every 60s, builds locally, restarts service)
- **CI:** GitHub Actions runs `Verify Build` only (TypeScript + build check)
- **Old GitHub Actions VPS deploy:** Removed (was failing due to `rm -rf .next` race conditions)

### Full Audit Summary (conducted 2026-05-19)
See comprehensive audit section at bottom of this file for full details.
**Top critical findings:**
- **OpenAI crawling 47,813 requests in 7 hours** — 55% of all traffic. Mostly `_rsc` internal URLs (now blocked in robots.txt).
- **syslogd burning 99.9% CPU** — rsyslog stuck in infinite loop since ~05:25. ✅ Fixed (killed PID 1112362).
- **Stray Next.js process on port 3000** — old `spotonauto-web` ghost process wasting 175MB RAM. ✅ Fixed (killed PID 1139226).
- **No `error.tsx` anywhere** — uncaught errors may inject unintended noindex. ✅ Fixed (added `src/app/error.tsx`).
- **robots.txt / sitemap contradictions** — `/guides/` and `/symptoms/` in sitemap but disallowed AND noindex. ✅ Fixed (removed from sitemap).
- **PostgreSQL shared_buffers = 128MB** on 62GB server — severely under-provisioned.
- **No automated backups** — zero PostgreSQL, Neo4j, or file backups anywhere.
- **Maintenance pages 404ing** — `/maintenance/2010/toyota/camry/oil-type` returns 404 (data lookup failure, not build issue).
- **Wiring pages returning 502** — 17 wiring URLs hit 502 in last 7 hours (LMDB backend timeout).
- **SSL expires Aug 5** — 78 days remaining.

### Recent Deploys (2026-05-19)
1. **Noindex crisis FIXED** — Reverted noindex on generic `/tools/` pages (oil-type, coolant-type, tire-size, battery-location, wiper-blade-size, serpentine-belt). These pages were getting 32-736 AI citations each; noindexing them would have destroyed citation equity. Vehicle-specific `/maintenance/...` pages coexist and compete naturally.
2. **New maintenance pages deployed** — `spark-plug-type` and `transmission-fluid-type` vehicle-specific maintenance pages (corpus-backed, 404 if no data). Joins existing: oil-type, coolant-type, tire-size, battery-location, wiper-blade-size, serpentine-belt.
3. **Maintenance hub expanded** — Now shows 8 spec cards (oil, coolant, tire, battery, wipers, belt, spark plugs, trans fluid). Each card only appears when data is available.
4. **Affiliate monetization** — Added Amazon affiliate blocks to battery-location, wiper-blade-size, and serpentine-belt pages (they were missing affiliate links). All maintenance pages now monetize.
5. **Cross-linking** — "Other specs" nav on every maintenance page links to all sibling pages for the same vehicle. Reduces bounce rate by keeping users in the vehicle bubble.
6. **Maintenance landing page** — `/maintenance` now exists with links to popular makes/models. Added to sitemap.
7. **Vehicle hub links** — `MAINTENANCE_TOOL_TYPES` already routes tool type cards to `/maintenance/{year}/{make}/{model}/{toolType}` instead of generic `/tools/`.
8. **IndexNow submission** — Submitted new maintenance URLs to Bing/Google via IndexNow.
9. **SSH key auth** — Set up ed25519 key-based auth for VPS deploy. No more password/fail2ban issues.

### Earlier Deploys (2026-05-14)
- Manuel AI chat rebrand, brand consistency fix, schema validation, auto-generated FAQs, generic text filter, BreadcrumbList schema, GA4 tracking fix

### Infrastructure
- **VPS:** `116.202.210.109` / IPv6 `2a01:4f8:2200:3291::2`
- **SSH:** Key-based auth (`~/.ssh/id_ed25519`) working. IPv6 preferred; IPv4 port 22 sometimes blocked by fail2ban.
- **Next.js:** Port 3002, `alloemmanuals-web.service`
- **nginx cache:** `alloemmanuals_cache` (1GB, 1h TTL). Cache already warmed to ~900 files.
- **Deploy process:** `rsync` local `/home/lyndon/projects/spotonauto.com/` to VPS `/root/spotonauto.com/` → `bash scripts/deploy-production.sh` on VPS (handles npm ci, build, service restart, healthcheck)
- **Nginx cache clear:** `rm -rf /var/cache/nginx/alloemmanuals/* && nginx -s reload`
- **LMDB backend:** `127.0.0.1:8080` on VPS — sole data source

### LLM API Status (2026-05-14)
- **OpenAI:** ✅ WORKING — GPT-4o-mini primary, API key active. Response time ~2-3s.
- **Gemini:** Quota exhausted (429)
- **Kimi:** 401 unauthorized
- **Local fallback (Ollama):** `qwen2.5:3b` at `127.0.0.1:11434` — fallback only (`OLLAMA_PRIMARY=0`). Very slow on VPS (60s+), do NOT use as primary.

### Content Pipeline
- **Corpus tool pages:** 3,714 deployed (LEMON fluids data)
- **Repair profiles:** 298 generated, 1,778 query-targets remain unprocessed
- **All LLM content generation paused** until API quota restored

## Product Direction

- Brand is `AllOEMManuals`.
- `charm.li`, `Operation CHARM`, `lemon-manuals.la`, and `lemon-manuals.org.ua` are **irrelevant third-party properties**. We have zero relationship with them and zero reason to ever contact, reference, or fetch from them.
- The data we host is our own factory manual archive. Refer to it as `factory manual archive`, `manual archive`, or `factory service manual archive`.

## External Sources Ban (2026-05-11)

- **NEVER fetch data from `charm.li`, `lemon-manuals.la`, `lemon-manuals.org.ua`, or any external domain.**
- These public websites are **not** sources of truth. They are mirrors, redirects, or irrelevant third-party hosts.
- The **ONLY** source of truth for all manual data is the self-hosted VPS LMDB backend (`localhost:8080`, or `CHARM_ARCHIVE_BASE` / `GRAPH_BACKEND_BASE_URL` when configured).
- Code must not contain fallback URLs to external manual sites. The `ALLOW_DIRECT_CHARM_FALLBACK` env var and the `workers/charm-proxy/` worker have been removed.
- If the VPS backend returns 404, the data is simply not available. Do not attempt to "fill in" from external sites.

## UI Direction

- Homepage direction is matte black with blue/white text.
- Prefer a softened graphite / charcoal dark theme over true black on primary entry surfaces.
  - homepage and exact vehicle command-center pages should feel calmer and more mainstream, not harsh or “raven black”
  - keep the dark identity, but use deep gray shells with near-black cards/panels where contrast is needed
- Avoid the old starfield / particle-background look on the homepage.
- Favor calmer, more flowing section transitions over noisy sci-fi effects.
- Keep the tone intentional and restrained, not gimmicky.

## Critical SEO / Crawl Safety Rules (2026-05-14)

- **NEVER add redirect URLs to `src/app/sitemap.ts`.**
  - Forbidden: `/cel`, `/privacy`, `/terms` (they return 308 redirects).
  - Allowed: `/codes`, `/privacy-policy`, `/terms-of-service`.
  - Redirects in sitemaps trigger Bing/Google duplicate-content penalties.
- **IndexNow mode switched to streaming (2026-05-16):** All scripts (`submit-indexnow.js`, `indexnow-backfill.js`, `indexnow-recent-audit.js`) now use individual GET requests per URL instead of batch POST with `urlList`. 150ms delay between URLs. This addresses the Bing Webmaster Tools "batch mode" warning.
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
- **`/vehicles/sitemap.xml` is ENABLED** — was re-enabled 2026-05-11 after fixing `PROFILE_MAP` bug and missing tone classes. Contains ~9,854 vehicle hub URLs.
- **The `index-lmdb-vectors.ts` indexer MUST run on the VPS.**
  - Port 8080 is firewalled; running from your local machine will fail.
- **NEVER submit IndexNow for 30 days from 2026-04-26.** Let Bing forget the spam. Still valid as of 2026-05-14.

## Vehicle Hub Performance (Fixed 2026-05-12)
- `buildVehicleLaneData()` DTC loop was O(n²) — pre-computed Maps reduced it 2,500ms → ~50ms
- `getVehicleGraphData()` Neo4j queries parallelized — 800ms → ~200ms
- Vehicle hub TTFB: **~1s cold / ~200ms warm** (down from 21–38s)
- nginx proxy cache deployed for dynamic pages — cached responses serve in **<1ms**

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
- **Auto-generated FAQs:** `buildToolFaqs()` in `src/app/tools/[slug]/page.tsx` creates 2-4 unique Q&As per page from tool type + specs. Prevents generic template text from poisoning SERP snippets.

## GA4 / Analytics Traps (2026-05-14)
- **AnalyticsScripts.tsx uses `CANONICAL_HOST` gate:** `if (window.location.hostname !== CANONICAL_HOST) return;` — blocks tracking on non-canonical hosts. `CANONICAL_HOST = 'alloemmanuals.com'`.
- **3-second delay was filtering 40-60% of organic traffic.** Reduced to 500ms 2026-05-14. Monitor bounce-rate correlation.
- **Old fallback GA4 ID `G-WNFX6CY9RN` was spotonauto property.** Always verify `NEXT_PUBLIC_GA_MEASUREMENT_ID` env var is set before builds.
- **TrackingScript.tsx fires `page_view_custom`** (not standard `page_view`) via `requestIdleCallback`. Enhanced measurement must be ON in GA4 to see standard `page_view` events.

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
- **IPv6 SSH to VPS is currently failing** (`Permission denied` on `2a01:4f8:2200:3291::2`). Use IPv4 `116.202.210.109` for all deploys.
- **systemd WorkingDirectory trap:** `alloemmanuals-web.service` has `WorkingDirectory=/root/spotonauto.com/` but the build may run in `/root/alloemmanuals.com/`. After any build, sync `.next/` to the service's WorkingDirectory or the old build will keep being served. Also, `systemctl restart` can hang if the old `next-server` process doesn't exit cleanly — use `kill -9` on the stale PID if `status` shows `deactivating (final-sigterm)`.
- **CRITICAL — Nginx cache poisoning with Tollbit bot redirects (2026-05-25):**
  - The Nginx `proxy_cache_key` does NOT include User-Agent. If a bot 302 redirect gets cached, ALL users receive the redirect for the cache TTL (up to 1h). This caused a full-site outage on 2026-05-25.
  - **Fix applied:** Added `map $http_user_agent $is_ai_bot` in `/etc/nginx/sites-enabled/alloemmanuals.com` that matches all Tollbit-forwarded bot UAs, plus `proxy_no_cache $is_ai_bot` / `proxy_cache_bypass $is_ai_bot` so bot requests always bypass the Nginx proxy cache. Also removed 302 from all `proxy_cache_valid` directives as a safety net.
  - **NEVER add 302 back to `proxy_cache_valid`** while Tollbit middleware is active. Any cached 302 can poison the cache for human visitors.
  - If the Nginx config is ever regenerated or overwritten, the `$is_ai_bot` map and cache bypass directives MUST be re-added or Tollbit redirects will take the site down again.

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
- **Vehicle hub generic text suppression:** `getConciseQuickAnswer()` now returns `null` for generic template text. Vehicle hub specs cards skip rendering when no real data exists. This prevents Google from using filler sentences as SERP snippets.
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
- **Tollbit Bot Paywall Integration & Nginx Cache Bypass:**
  - AI bot monetization / denial policy is enforced at Next.js Edge Middleware (`src/middleware.ts`) level.
  - Monetization-eligible bots (such as ChatGPT/Claude search agents) requesting site URLs (including `/robots.txt` and `/sitemap.xml`) are redirected via `302 Found` to the Tollbit host (`tollbit.alloemmanuals.com`) to be authenticated/metered.
  - Nginx is configured to bypass/disable caching (`proxy_cache off;`) for `/robots.txt` and sitemap paths (using `location = /robots.txt` and `location ~* /sitemap` in `/etc/nginx/sites-enabled/alloemmanuals.com`). This prevents Nginx from caching 302 redirects globally and serving them to search engines (like Googlebot) or standard users.
  - The middleware overrides caching on sitemaps/robots to set `Vary: Accept-Encoding, User-Agent`. This allows Cloudflare to cache user-agent partitioned versions of sitemaps and bypass/redirect correctly for bots, while robots.txt has cache-control set to `no-store, no-cache, must-revalidate` to prevent any edge caching of the robots file.
## Working Norms

- This repo is often dirty with unrelated local edits. Stage only task-relevant files.
- If production deploys must exclude unrelated local work, build a clean deploy bundle from `git archive HEAD` and overlay only the task-relevant files before `railway up`.
- For TypeScript changes, verify with `npx tsc --noEmit`.
- The root app `tsconfig.json` should exclude `workers/`; the Cloudflare worker is its own TypeScript project and should be checked separately.
- Prefer direct, user-visible fixes over speculative refactors.


## Corpus Deep-Dive Knowledge (2026-05-08)

### The Two Corpuses

**CHARM corpus** — The older factory manual archive (1982–2013)
- Coverage: 1982–2013 (some makes to 2014)
- ~24,935 vehicle manifests, 52 makes
- Data: 548GB images.mtbl + 34GB pages.mtbl + 5MB index.json

**LEMON corpus** — The expanded factory manual archive (1960–2025)
- Coverage: 1960–2025
- ~279,988 vehicle manifests, 65 makes
- Data: 481GB images.mtbl + 31GB pages.mtbl + 142MB index.json
- Contains ALL CHARM manuals plus 2014+ content
- Finer granularity: trim levels, transmission types, VIN codes

**Format:** Both use mtbl (sorted string table) — compressed key-value.
- CHARM keys = paths; values = `SPECIAL_/` or `fileID,timestamp`
- LEMON keys include `bulletin_hash_TYPE` pattern
- Backend binary: `lemon-website-linux-x86_64-musl` serves both on localhost:8080
- Both corpuses are hosted **exclusively** on the VPS. No external fetching.

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

**Source of truth:** The VPS LMDB backend (`localhost:8080`) is the only runtime data source. Do not test against, reference, or fetch from any public manual website.

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

## Recent Changes (2026-05-14)

### Manuel — AI Factory Mechanic (Deployed 2026-05-14)
- **Full rebrand:** Generic "AI Technician" → "Manuel — Your Factory-Trained AI Mechanic" across all touchpoints.
- **System prompt:** Manuel speaks like a real mechanic ("amigo", "boss", "the book calls for..."). Proactive, step-by-step factory flowcharts. Always asks year/make/model first.
- **UI updates:** Chat header, greetings, disclaimers, placeholder text all Manuel-branded. Voice input enabled (Web Speech API).
- **Homepage:** Diagnostic section now "Talk to Manuel" with voice-first positioning. Entry paths, testimonials, footer, CEL page, repair CTAs all say "Ask Manuel".
- **SEO:** `/diagnose` title → "Manuel — AI Factory Mechanic | Diagnose Your Car with OEM Data | AllOEMManuals".
- **Chat API:** OpenAI GPT-4o-mini is primary provider (~2-3s response). Fixed critical bug where `OLLAMA_PRIMARY=1` caused 60s+ timeouts.
- **Voice input:** Rebuilt from click-to-toggle to push-to-hold. Hold mic button → speak → release to send. Waveform animation + real-time interim transcription + clear error messages (permission denied, no-speech, network). Uses pointer events for desktop + mobile.
- **CRITICAL FIX:** `LOCAL_DATABASE_URL` was **commented out** in `.env.local` on the VPS. Manuel had zero access to the 1.8M-row factory manual database. Uncommented and verified — corpus search now returns real OEM sections (e.g. 5 sections for "2010 Toyota Camry P0420").

### SERP CTR & Snippet Quality Improvements
- **Auto-generated FAQs:** 3,713 tool pages now have unique Q&A (was: identical "Where is this data from?" on every page). FAQPage schema eligibility for rich snippets.
- **Generic text filter:** `isGenericTemplateText()` detects template filler sentences and suppresses them from page content and schema. Prevents weak snippets like "uses synthetic motor oil — typically 0W-20 for newer models..."
- **BreadcrumbList schema:** Added to vehicle hubs (`/vehicles/{year}/{make}/{model}`) for proper URL breadcrumb display in SERPs.
- **Brand consistency:** Eliminated all remaining `SpotOn Auto` references from titles, descriptions, and schema (10 files).
- **Schema validation:** Fixed `MonetaryAmount` range strings (`value: '30-180'`) → proper `minValue`/`maxValue`.
- **GA4 fix:** Measurement ID updated to `G-KS1JPX0V7P`, loading delay reduced 3s → 500ms, GSC property linked.

### SERP CTR & Crawl Budget Improvements (2026-05-08)

- **Tool page titles now include the quick answer** (e.g. "VW Tiguan Coolant: G12evo/G13 Pink (50/50 Mix) | AllOEMManuals") to stand out in positions 6–12 where 95 of 122 impressions currently get 0% CTR.
- **Tool pages now link to `/maintenance/{year}/{make}/{model}/`** via a "View Factory Specs" CTA above the nav, driving internal link equity to maintenance hubs.
- **Vehicle variant URL redirects added** in `src/app/vehicles/[year]/[make]/[model]/page.tsx`:
  - Detects corpus variant paths like `/vehicles/2011/ford/ranger-2d-pickup-extra-cab` using `VEHICLE_PRODUCTION_YEARS` prefix matching.
  - Redirects to clean hub `/vehicles/{year}/{make}/{model}/` with 307 (Next.js `redirect()` default).
- **Old `alloemmanuals.com` variant sitemaps deleted** from `public/vehicles/sitemap/`. These contained 112K+ wrong-domain variant URLs that were leaking crawl budget.
- **Domain redirect added**: `alloemmanuals.com` and `www.alloemmanuals.com` → `alloemmanuals.com` in `next.config.js`.
- **Google Indexing API script created**: `scripts/push-maintenance-indexing.mjs` pushes maintenance hub + spec pages via `URL_UPDATED`. Supports `--from-tools`, `--from-db`, and `--urls` modes.
- **Do NOT run IndexNow submissions until after 2026-05-26** (30-day cooldown from April spam blast).

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


---

## Auto-Deploy System (2026-05-19)

**Primary deploy mechanism:** VPS-based git watcher (replaces GitHub Actions SSH deploy).

### Why Auto-Deploy?
GitHub Actions SSH deploys were failing because:
1. `rm -rf .next` failed when the running Next.js process held files open
2. Concurrent builds (GitHub Actions + auto-deploy) caused "Another next build process is already running"
3. SSH/rsync added complexity and race conditions

### Architecture
```
GitHub push → origin/main
                    │
                    ▼
        ┌───────────────────────┐
        │ auto-deploy.timer     │  (every 60s)
        │   systemd timer       │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ auto-deploy.service   │  (oneshot)
        │   /usr/local/bin/     │
        │   auto-deploy.sh      │
        └───────────┬───────────┘
                    │
        ┌───────────┴───────────┐
        │ 1. git fetch origin   │
        │ 2. Compare HEAD       │
        │ 3. git reset --hard   │
        │ 4. npm ci             │
        │ 5. npm run build      │
        │ 6. systemctl restart  │
        │ 7. Healthcheck        │
        └───────────────────────┘
```

### Files
- `deploy/auto-deploy.sh` — watcher script with `flock` lockfile to prevent concurrent runs
- `deploy/auto-deploy.service` — systemd oneshot service unit
- `deploy/auto-deploy.timer` — systemd timer (60s interval)
- `scripts/deploy-production.sh` — build script with backup/rollback on failure

### Rollback Behavior
The deploy script backs up `.next` to `.next.backup` before building. If `npm run build` fails or the healthcheck fails, it restores the backup and restarts the service.

### GitHub Actions
CI still runs `Verify Build` on every push to catch TypeScript/build errors. The VPS deploy step was removed — auto-deploy handles production deploys.

### Manual Trigger
```bash
ssh root@116.202.210.109
systemctl start auto-deploy.service
```

### Logs
```bash
journalctl -u auto-deploy.service -f
journalctl -u alloemmanuals-web -f
```

---

## Hetzner Infrastructure Recommendations (2026-05-19)

### Current Hardware
| Component | Spec | Notes |
|-----------|------|-------|
| CPU | 16 shared vCPUs | Load avg 1-3, not current bottleneck |
| RAM | 62 GB | 37GB used (Neo4j 23.7GB + LMDB 10.8GB + PG 16GB + Next.js) |
| Root disk | 938 GB RAID-1 NVMe (md1) | Fast, only 7% used |
| Data disk | 3.5 TB SATA SSD (`sda1`) | **Bottleneck** — LMDB 1.3TB lives here |

### Disk I/O Benchmark (dd iflag=direct)
| Test | SATA (/data) | NVMe (/root) | Ratio |
|------|-------------|--------------|-------|
| Sequential read | 399 MB/s | 973 MB/s | 2.4x |
| 4K read | 134 MB/s | 285 MB/s | 2.1x |
| **Random 4K IOPS** | ~10-50K | **100-500K** | **10-50x** |

The LMDB backend does heavy random 4K reads. Moving it from SATA to NVMe would be the single biggest performance gain.

### Recommended Upgrades (ranked by impact)

#### 🔴 P0 — Do This Week
1. **Add 2TB NVMe Volume + Move LMDB**
   - Order Hetzner NVMe Volume (€20-30/mo for 2TB)
   - Move `/data` LMDB data to NVMe
   - Expected result: 5-10x faster manual page lookups, reduced TTFB
   - **Cost:** ~€25/mo | **Impact:** Massive

2. **Hetzner Object Storage for Backups**
   - Currently backups live on the same server disk
   - If server dies, backups die too
   - Set up `s3cmd` or rclone to sync `/data/backups/` to Hetzner Object Storage
   - **Cost:** ~€5/mo for 500GB | **Impact:** Critical data safety

#### 🟡 P1 — This Month
3. **Upgrade to Dedicated vCPU**
   - Current shared vCPUs may be throttled during bot traffic spikes
   - 68% of all traffic is bots (OpenAI alone = 58%)
   - Dedicated vCPU = consistent latency under load
   - **Cost:** ~€30-50/mo more | **Impact:** High

4. **Cloudflare Pro or Hetzner CDN**
   - Site is served from Germany. Global users (US, Asia) get 200-400ms+ latency.
   - CDN would cache static assets (`/_next/static/`, images) at edge locations
   - **Cost:** Cloudflare Pro $20/mo or Hetzner CDN ~€10/mo | **Impact:** High for global UX

#### 🟢 P2 — Next Quarter
5. **More RAM (96-128 GB)**
   - 62GB is adequate now but Neo4j alone uses 23.7GB
   - As the corpus grows and more embeddings are added, RAM will become tight
   - **Cost:** ~€40-80/mo more | **Impact:** Medium

6. **Separate Build Server (or GitHub Actions build + artifact push)**
   - Currently auto-deploy builds ON the production server
   - Build consumes 2-3 CPU cores for 2-3 minutes = user-facing slowdown
   - Better: Build in CI or on a separate build instance, then push `.next` artifact
   - **Cost:** €0 (use GitHub Actions + rsync) or ~€10/mo for small build box | **Impact:** Medium

### Quick Win (Free, Do Now)
Move the nginx cache and PostgreSQL WAL to NVMe:
```bash
# Move nginx cache from /var/cache/nginx (root NVMe) — already there, good
# Move PostgreSQL data? No, it's small (8.9GB) and already on NVMe root
# The ONLY thing on SATA is /data (LMDB + backups)
```

**Action:** Order a 2TB Hetzner NVMe Volume, mount it at `/data-nvme`, migrate LMDB, update `lemon-manuals.service` to point to new path.

---

## Comprehensive A-Z Audit (2026-05-19)

Audited by: Kimi Code CLI across 6 parallel agents + direct live site testing.
Scope: Live site, VPS infrastructure, codebase, databases, nginx logs, SSL/DNS, bot traffic.

---

### 1. TRAFFIC & BOT ANALYSIS (Nginx Access Logs)

**Time window:** Current log = 7 hours (00:00–07:00 May 19). 87,830 total requests.

#### Status Code Distribution
| Code | Count | % |
|------|-------|---|
| 200 | 78,534 | 89.4% |
| 308 | 5,074 | 5.8% |
| 404 | 2,081 | 2.4% |
| 429 | 1,507 | 1.7% |
| 502 | 130 | 0.15% |
| 500 | 55 | 0.06% |
| 301 | 114 | 0.13% |
| 400 | 156 | 0.18% |
| 499 | 71 | 0.08% |

#### Bot Traffic Breakdown (7 hours)
| Operator | Requests | % of Total |
|----------|----------|------------|
| **OpenAI** | **47,813** | **54.4%** |
| Amazon | 1,461 | 1.7% |
| Semrush | 1,047 | 1.2% |
| Bing | 889 | 1.0% |
| Moz | 693 | 0.8% |
| Anthropic | 633 | 0.7% |
| Google | 495 | 0.6% |
| Apple | 452 | 0.5% |
| Meta | 307 | 0.3% |
| Majestic | 191 | 0.2% |
| Perplexity | 10 | 0.01% |
| Ahrefs | 1 | 0.001% |

**Critical:** OpenAI is the dominant traffic source. It crawled 46,512 unique URLs in 7 hours, many of which were Next.js `_rsc` internal payload URLs. `Disallow: /*?_rsc=` and `/*?_rsc=*` added to robots.txt 2026-05-19.

#### Top 20 404s (All Traffic)
| Path | Hits | Note |
|------|------|------|
| `/favicon.ico` | 42 | Should serve 200 now (favicon deployed) |
| `/wp-admin/install.php?step=1` | 33 | WordPress probe attacks |
| `/apple-touch-icon.png` | 23 | iOS requests |
| `/apple-touch-icon-precomposed.png` | 13 | iOS requests |
| `/maintenance/2010/toyota/camry/oil-type` | 4 | **BUG — page returns 404** |
| Various `/tools/...` | 3-5 each | Non-existent tool pages (bot guesses) |

#### Top 20 URLs (All Traffic)
| Path | Hits |
|------|------|
| `/api/generate-guide` | 1,022 |
| `/robots.txt` | 486 |
| `/` | 198 |
| `/_next/static/css/35d7ea13da595721.css` | 85 |
| `/icon.svg` | 77 |
| Various `_next/static/...` | 70-76 each |

#### 500/502 Errors
- **17 wiring URLs returned 502** — LMDB backend timing out on wiring diagram requests
- **3 API wiring endpoints returned 500** — `/api/wiring?action=diagrams&make=...`
- **2 tool pages returned 502** — `/tools/pontiac-grand-am-transmission-fluid-type`

---

### 2. LIVE SITE PERFORMANCE

| Page | Status | TTFB | Total | Size |
|------|--------|------|-------|------|
| `/` | 200 | 0.86s | 0.86s | 77KB |
| `/vehicles/2010/toyota/camry` | 200 | 0.79s | 0.80s | 21KB |
| `/repair/2008/nissan/pathfinder/battery-replacement` | 200 | 1.37s | **2.49s** | 323KB |
| `/maintenance/2010/toyota/camry/oil-type` | **404** | 0.78s | 0.78s | 38KB |
| `/codes/P0420` | 200 | 0.79s | 1.54s | 193KB |
| `/wiring/2010/toyota/camry` | **404** | 0.78s | 1.03s | 69KB |
| `/tools/toyota-camry-oil-type` | 200 | 0.76s | 1.32s | 185KB |
| `/diagnose` | 200 | **1.71s** | **2.05s** | 98KB |
| `/sitemap.xml` | 200 | 0.67s | 0.67s | 21KB |
| `/robots.txt` | 200 | 0.53s | 0.53s | 204B |

**Notes:**
- Repair guide TTFB 1.37s (corpus data fetch + Neo4j query).
- Diagnose TTFB 1.71s (slowest — loads chat UI + vehicle selector).
- Maintenance oil-type 404s (data lookup failure in `fetchMaintenanceData`).
- Wiring hub 404s (no hub page at `/wiring/{y}/{m}/{model}` — only system-specific pages exist).

---

### 3. SEO TECHNICAL AUDIT

#### robots.ts
```
Disallow: /admin/
Disallow: /api/internal/
Disallow: /community/*?page=
Disallow: /manual/hyperlink/
Disallow: /guides/
Disallow: /repairs/
Disallow: /symptoms/
Disallow: /tools/type/
Disallow: /manual-navigator
Disallow: /*?_rsc=
Disallow: /*?_rsc=*
```

**Fixed 2026-05-19:** Removed `/repair`, `/manual`, `/parts` from disallow (were blocking ALL vehicle-specific pages under those prefixes). Generic landing pages already have `noindex` meta tags.

**Contradictions found:**
- `/guides/` and `/symptoms/` are in the main sitemap but disallowed in robots.txt AND set to `noindex`. Triple contradiction wastes crawl budget.

#### Sitemaps
| Sitemap | URLs | Status |
|---------|------|--------|
| `/sitemap.xml` (main) | ~1,850 + guides + symptoms | Dynamic |
| `/repair/sitemap.xml` | ~103,554 | Static index → 11 chunks |
| `/wiring/sitemap.xml` | ~171,456 | Static index → 18 chunks |
| `/vehicles/sitemap.xml` | ~100K+ | Dynamic (all Y/M/M combos) |
| `/codes/sitemap.xml` | ~300 | Dynamic |
| `/manual/sitemap.xml` | 82 makes | Dynamic |

#### Noindex Patterns
22 page groups have explicit noindex. All are intentional generic/thin pages EXCEPT:
- `/repair/[year]/[make]/[model]/[task]` — conditional noindex if `!hasRealContent` (good)
- `/repair/[year]/[make]/[model]` — conditional noindex if `NOINDEX_MAKES` or non-US model

**Critical gap:** Zero `error.tsx` files anywhere in `src/app/`. Next.js may inject `<meta name="robots" content="noindex">` on uncaught errors.

#### Schema Markup
| Page Type | Schema |
|-----------|--------|
| Homepage | Organization, LocalBusiness, WebSite, SearchAction |
| Repair Task | FAQPage, BreadcrumbList, HowTo |
| Vehicle Hub | FAQPage, BreadcrumbList, CollectionPage |
| Codes | FAQPage, BreadcrumbList, Article |
| Maintenance | FAQPage, BreadcrumbList, Question microdata |
| Tools | FAQPage, BreadcrumbList |

**Missing:** Product schema on affiliate links, Vehicle schema on hubs, AggregateRating.

#### Canonical URLs
- ✅ Excellent consistency — all dynamic pages use `slugifyRoutePart()` + `permanentRedirect()` for non-canonical slugs.
- ❌ `/diagnose/live` missing canonical.

#### Metadata Coverage
- 31 files implement `generateMetadata()`
- Missing: `contact/page.tsx`, `repair/test-interactive/page.tsx`

---

### 4. INFRASTRUCTURE HEALTH

#### System (VPS `116.202.210.109`)
| Metric | Value |
|--------|-------|
| OS | Ubuntu 24.04.4 LTS |
| Kernel | 6.8.0-100-generic |
| CPU | 16 cores |
| RAM | 62 GB (27 used, 35 available) |
| Load | 2.17 (moderate) |
| Uptime | 31 days |
| Root disk | 938 GB / 55 GB used (7%) |
| Data disk (`/data`) | 3.5 TB / 1.3 TB used (38%) |

#### Services
| Service | Status | Port | Notes |
|---------|--------|------|-------|
| alloemmanuals-web | ✅ Active | 3002 | Next.js 16.2.4, 208MB RAM |
| nginx | ✅ Active | 80/443 | 18 workers, 56MB RAM |
| postgresql | ✅ Active | 5432 | 16.13 |
| neo4j | ✅ Active | 7474/7687 | 23.7GB RAM (!) |
| LMDB backend | ✅ Active | 8080 | 10.8GB RAM |
| ollama | ✅ Active | 11434 | qwen2.5:3b, 522MB |
| **spotonauto-web (OLD)** | ⚠️ **GHOST** | **3000** | **175MB RAM waste** |

#### SSL Certificates
| Domain | Expiry | Days Left |
|--------|--------|-----------|
| alloemmanuals.com + www | 2026-08-05 | 78 |
| spotonauto.com + www | 2026-07-23 | 65 |

#### Firewall (UFW)
- 22, 80, 443, 51413 (transmission), 5432 ALLOW
- 9091 DENY
- 8080 DENY (LMDB only localhost)

#### Critical Infrastructure Issues
1. **syslogd PID 1112362 consuming 99.9% CPU** — rsyslog stuck in infinite loop since ~05:25. `action-0-builtin:omfile` suspended/resumed thousands of times per second.
2. **Stray Next.js on port 3000** — `spotonauto-web.service` disabled in systemd but process still running.
3. **4 failed systemd units** — `alloemmanuals-indexer`, `spotonauto-graph-backbone-full`, `spotonauto-graph-backbone-sweep`, `transmission-daemon`.
4. **Port 8086** — unknown `python3` service (`lemon_proxy.py`). Purpose unclear.
5. **No backups** — zero automated backups for PostgreSQL, Neo4j, or files.

---

### 5. DATABASE HEALTH

#### PostgreSQL (`spotonauto`)
| Metric | Value |
|--------|-------|
| Version | 16.13 |
| Size | 8.9 GB |
| Connections | 6 / 100 |
| **shared_buffers** | **128 MB** ⚠️ (should be 4–8 GB on 62GB server) |
| pg_stat_statements | ❌ Not installed |
| Backups | ❌ None |

**Tables:**
| Table | Size | Rows |
|-------|------|------|
| manual_embeddings | 6,142 MB | 1,835,283 |
| kb_documents | 2,701 MB | 433,052 |
| kb_entities | 67 MB | 229,541 |
| kb_edges | 39 MB | 105,037 |

#### Neo4j
| Metric | Value |
|--------|-------|
| Version | 2026.03.1 Community |
| Memory | 23.7 GB (peak 28.6 GB) |
| Heap | 16 GB |
| Data | 6.3 GB |
| Auth | Enabled but **password not in any .env file** |
| cypher-shell access | ❌ Blocked (unauthorized) |

#### LMDB Backend
| Metric | Value |
|--------|-------|
| Binary | `lemon-website-linux-x86_64-musl` |
| Listen | 127.0.0.1:8080 |
| Memory | 10.8 GB |
| Data | 1.3 TB total (542 GB CHARM + LEMON) |
| Health | Returns 415 on `/` but process alive |

---

### 6. CODEBASE QUALITY

- **TypeScript:** ✅ Zero errors (`npx tsc --noEmit` clean)
- **TODO/FIXME:** ✅ Zero found
- **Console statements:** ~11 `console.warn/error` in production server code (low severity)
- **Backup file clutter:** `src/app/repair_page_backup.tsx.bak` exists

---

### 7. SECURITY HEADERS (All Present)

- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security: max-age=63072000
- Cross-Origin-Opener-Policy: same-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- Content-Security-Policy: Comprehensive (script-src includes unsafe-inline/unsafe-eval for Next.js)

---

### 8. CRITICAL ACTION ITEMS (Prioritized)

#### 🔴 P0 — Fix Immediately
1. **Fix maintenance page 404s** — `/maintenance/2010/toyota/camry/oil-type` returns 404 because `fetchMaintenanceData()` returns null for this vehicle. Debug data pipeline. `fetchMaintenanceData` calls CHARM backend at `127.0.0.1:8080`; backend HAS data for 2010 Toyota Camry but `listVariants` or `fetchText` may be failing silently.
2. **PostgreSQL shared_buffers → 4GB+** — currently 128MB on 62GB server.
3. **Set up automated PostgreSQL backups** — daily `pg_dump` to `/data/backups/`.

#### 🟡 P1 — This Week
4. **Add `pg_stat_statements`** extension for query diagnostics.
5. **Document Neo4j password** — currently unknown, cypher-shell blocked.
6. **Fix wiring 502 errors** — 17 wiring URLs hitting LMDB backend timeouts.
7. **Add metadata to `contact/page.tsx`** — missing title/description.
8. **Noindex `repair/test-interactive/page.tsx`** — test page should not be indexed.
9. **Remove `repair_page_backup.tsx.bak`** — repo clutter.
10. **Add Product schema** to affiliate links (Amazon/Topdon) for rich snippets.

#### 🟢 P2 — Next Sprint
11. **Add Vehicle schema** (`schema.org/Vehicle`) to vehicle hub pages.
12. **Bundle analyzer** — check for bloat in `_next/static/chunks`.
13. **Investigate `lemon_proxy.py` on port 8086** — unknown service.
14. **SSL renewal automation** — certbot renews Aug 5, verify auto-renewal works.

#### ✅ Completed During This Audit
- ~~Kill rsyslog infinite loop~~ — Killed PID 1112362. Load dropped from 2.17 to 0.73.
- ~~Kill stray Next.js on port 3000~~ — Killed PID 1139226. Freed 175MB RAM.
- ~~Add `error.tsx`~~ — Added `src/app/error.tsx` to prevent noindex injection.
- ~~Fix robots.txt / sitemap contradiction~~ — Removed `/guides/`, `/symptoms/`, `/repair`, `/parts`, `/tools`, `/wiring`, `/manual` and sub-pages from sitemap.
- ~~Add `/api/generate-guide` to robots.txt disallow~~ — Prevents bot hammering.
- ~~Block .env scanning attacks~~ — Added nginx `deny` for IPs `185.177.72.38`/`185.177.72.56` and `location ~* /\.env { return 444; }`.
- ~~Add apple-touch-icon.png~~ — Copied to `public/apple-touch-icon.png` for iOS Safari.
- ~~Fix deploy-production.sh~~ — Stops service BEFORE `rm -rf .next`. Adds backup/rollback.
- ~~Create auto-deploy watcher~~ — `auto-deploy.timer` + `auto-deploy.service` polls GitHub every 60s.
- ~~Remove VPS deploy from GitHub Actions~~ — CI now only verifies build; auto-deploy handles production.

---
