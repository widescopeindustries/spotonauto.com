# SpotOnAuto Full Audit — May 1, 2026

**Auditor:** Kimi Code CLI  
**Date:** 2026-05-01  
**Property:** spotonauto.com (apex canonical)  
**Status:** Deep Recovery Mode

---

## 1. Executive Summary

SpotOnAuto is a Next.js 16 auto-repair guide platform with a dark cyber-aesthetic, heavy analytics instrumentation, and a massive content backend (177K manual sections, 232K graph nodes). The site is technically sophisticated but **trapped in SEO recovery hell** after two disasters:

1. **Google migration collapse** (Feb 28–Mar 1): Canonical flip destroyed trust. Impressions went 6,800/day → 0.
2. **Bing IndexNow spam** (Mar 28): 740K URLs bulk-submitted. Bing throttled authority. Copilot citations dropped from 10.7K → near zero.

**Current recovery progress:** ~3% of pre-disaster organic traffic. The manual backbone has fully recovered (176K sections, 61 makes, 32 years), but the SEO trust signal has not. Meanwhile, user-facing pages still contain developer language, broken features, and confusing navigation that kills conversion.

---

## 2. Daily Metrics Dashboard

### Search Console (Google)

| Metric | Pre-Disaster Baseline | Current (7-day avg) | % of Baseline |
|--------|----------------------|---------------------|---------------|
| **Impressions/day** | 4,731 | 141 | **3.0%** |
| **Clicks/day** | ~15-20 | ~4 | **~20%** |
| **Avg Position** | 8.0 | 16.5 | Worse |
| **Best recent day** | — | 182 (Apr 25) | 3.8% |

### Google Analytics 4

| Metric | Pre-Disaster Baseline | Current (7-day avg) | % of Baseline |
|--------|----------------------|---------------------|---------------|
| **Organic sessions/day** | 52 | 6.3 | **9.6%** |
| **Total sessions/day** | ~200-300 | ~170 | ~85% |
| **Organic share** | ~25% | ~3-10% | Collapsed |

### Recent Daily Breakdown

| Date | GSC Impr | GSC Clicks | GSC Pos | GA Organic | GA Total | Organic Share |
|------|----------|------------|---------|------------|----------|---------------|
| Apr 17 | 122 | 3 | 25.0 | 70 | 227 | 30.8% |
| Apr 18 | 120 | 3 | 21.5 | 64 | 176 | 36.4% |
| Apr 19 | 108 | 5 | 21.4 | 60 | 224 | 26.8% |
| Apr 20 | 127 | 6 | 19.0 | 84 | 231 | 36.4% |
| Apr 21 | 138 | 4 | 19.5 | 87 | 231 | 37.7% |
| Apr 22 | 106 | 1 | 20.8 | 74 | 187 | 39.6% |
| Apr 23 | 129 | 2 | 19.2 | 94 | 172 | 54.7% |
| Apr 24 | 169 | 2 | 15.3 | 6 | 134 | 4.5% |
| Apr 25 | 182 | 6 | 18.2 | 12 | 238 | 5.0% |
| Apr 26 | 129 | 5 | 15.2 | 4 | 217 | 1.8% |
| Apr 27 | 142 | 7 | 14.5 | 7 | 203 | 3.4% |
| Apr 28 | 130 | 1 | 13.6 | 10 | 102 | 9.8% |
| Apr 29 | — | — | — | 2 | 95 | 2.1% |
| Apr 30 | — | — | — | 3 | 317 | 0.9% |

**Interpretation:** Total sessions are recovering (direct + referral), but **organic search is dead.** The late-April volatility (Apr 24–28 spike to 169–182 impressions) is likely Bing re-crawling, not Google recovery. GA organic dropping to 2–3 sessions/day means Google has almost completely stopped sending traffic.

### Graph Analytics (Knowledge Graph Click-Through)

| Surface | Group | Impressions | Clicks | CTR |
|---------|-------|-------------|--------|-----|
| repair | spec | 4 | 2 | **50.0%** |
| repair | manual | 6 | 0 | 0.0% |
| repair | symptom | 5 | 0 | 0.0% |
| repair | dtc | 4 | 0 | 0.0% |
| repair | tool | 4 | 0 | 0.0% |

**Interpretation:** The knowledge graph is healthy (232K nodes, 558K edges) but almost nobody sees it. The only clicks come from spec pages.

### Lost Pages (Former Traffic Drivers Now at Zero)

| URL | Pre-Disaster Impr/Day | Current |
|-----|----------------------|---------|
| /repair/2013/honda/cr-v/spark-plug-replacement | 28 | **0** |
| /repair/2013/toyota/corolla/starter-replacement | 20 | **0** |
| /repair/1996/honda/odyssey/alternator-replacement | 17 | **0** |
| /repair/2007/subaru/outback/water-pump-replacement | 17 | **0** |
| /repair/2012/hyundai/elantra/spark-plug-replacement | 16 | **0** |
| /repair/1999/honda/civic/water-pump-replacement | 15 | **0** |
| /repair/2008/hyundai/elantra/thermostat-replacement | 13 | **0** |
| /repair/2009/kia/optima/cabin-air-filter-replacement | 13 | **0** |
| /repair/2010/toyota/corolla/spark-plug-replacement | 13 | **0** |
| /repair/2013/honda/cr-v/oil-change | 13 | **0** |

These were real, working pages with verified search demand. They are now invisible.

---

## 3. Infrastructure & Data Health

### Manual Backbone (The SEO Foundation)

| Metric | Apr 26 (Skill Snapshot) | May 1 (Current) | Change |
|--------|------------------------|-----------------|--------|
| Sections | 1,402 | **176,967** | +12,518% |
| Makes | 2 | **61** | +2,950% |
| Years | 21 | **32** | +52% |
| Make-Years | — | **1,241** | — |
| Status | Recovering | **Healthy** | ✅ |

**Verdict:** The backbone is fully repopulated. This is a massive win. The `index-lmdb-vectors.ts` script (skipping Gemini embeddings) worked.

### Graph Database

- **232,221 nodes** | **558,356 edges** | **186,018 snapshots**
- Surfaces: vehicle (209K), wiring (214K), code (337), symptom (74)
- Status: Healthy, no issues

### Server Security (Just Hardened)

| Layer | Status |
|-------|--------|
| UFW Firewall | ✅ Active (deny incoming, allow outgoing) |
| Auto security updates | ✅ Enabled |
| DNS | ✅ Cloudflare DNS-over-TLS |
| ICMP redirects | ✅ Hardened |
| Kernel ptr restrict | ✅ Level 2 |
| Old kernels | ✅ Cleaned (kept current + 1) |

---

## 4. Live Page Audit

### ✅ Working Well

| Page | Status | Notes |
|------|--------|-------|
| `/` (Homepage) | 200 | Vehicle picker, trust signals, live demo. Copy still has developer language in places. |
| `/repair` | 200 | Functional hub. Symptom clusters, popular guides, vehicle hubs all load. |
| `/codes/p0420` | 200 | **Best page on the site.** Clear structure, OEM procedures, FAQs, related resources. |
| `/codes/` | 200 | ~170 code listings. Good index page. |
| `/guides/` | 200 | Make directory. Static, fast. |
| `/guides/honda` | 200 | **Fixed since March audit.** Now shows model list. |
| `/second-opinion` | 200 | **Fixed since March audit.** Quote Shield form loads. |
| `/about` | 200 | Thin but honest. SDVOSB credentials. |
| `/tools/...` | 200 | Thousands of tool pages (oil type, battery location, etc.). Thin but indexed. |

### 🔴 Broken or Empty

| Page | Status | Issue | Severity |
|------|--------|-------|----------|
| `/manual` | 200 | **"Unable to load the service manual database right now."** Core promise broken. | 🔴 Critical |
| `/community` | 200 | Only footer renders. **0 threads, 0 replies** across all 8 categories. Ghost town in nav. | 🔴 Critical |
| `/wiring` | 200 | No functional static picker. Claims 148K diagrams but gives no path to them. | 🟡 High |
| `/parts` | 200 | Thin. Only brake categories show. Rest is generic Amazon copy. | 🟡 High |
| `/vehicles/2013/honda/civic` | 404 | Backbone is healthy but `/vehicles/` pages still 404. `vehicles/sitemap.xml` disabled in robots.ts. | 🔴 Critical |
| `/vehicles/sitemap.xml` | 200 | **Sitemap exists and has content**, but is **commented out in robots.ts** so Google doesn't discover it. | 🔴 Critical |

### 🟡 Functional but Problematic

| Page | Issue |
|------|-------|
| `/cel` | Competes with `/codes` for same audience. Both in nav vicinity. |
| `/diagnose` | Third entry point for AI diagnosis (home + /cel + /diagnose). Redundant. |
| `/repair` vs `/repairs` | Still nearly identical per March audit. No 301 merge done. |
| `/codes/p0420` | Still shows "Canonical symptom paths" and "Knowledge Paths from This Code" — developer SEO terms. |
| `/repairs/brake-pad-replacement` | Opportunity scores (141, 132, 125) visible on symptom cards — internal metrics exposed to users. |

---

## 5. Design & UX Assessment

### Visual Identity

- **Theme:** Dark cyber/auto aesthetic — cyan `#00d4ff` on near-black `#050505`
- **Effects:** Glassmorphism, glow shadows, radial gradients, particle backgrounds
- **Typography:** Orbitron (display/headings), Rajdhani/Inter (body)
- **Mobile:** Aggressively strips animations and glows for performance

**Verdict:** The look is cohesive and memorable. It screams "tech-forward auto repair." But it may alienate older DIYers who expect a cleaner, more trustworthy repair site (think RepairPal or AutoZone, not Tron).

### Navigation

**Desktop Header:** VIN Decoder | Diagnose | Guides | Codes  
**Mobile Menu:** Factory Manuals | Repair Guides | Wiring Diagrams | Codes | Diagnose  
**Footer:** 4-column grid with tools, popular repairs, company links

**Problems:**
1. **10+ nav items** across primary + secondary + footer. Too many paths.
2. **"Guides" links to `/repair`** — confusing label/URL mismatch.
3. **Community** is in the sitemap (priority 0.7, daily) but is a ghost town.
4. **No clear primary CTA.** Is it "diagnose," "find a guide," or "check a code"?

### Content Quality Issues

From the March audit, many of these **still exist**:

| Page | Developer Language Still Visible |
|------|----------------------------------|
| `/` | "Vehicle-first repair routing," "above-the-fold client bundle" |
| `/wiring` | "Off the main thread," "heavy browser" |
| `/diagnose` | "Diagnostic Core" (page title), "heavier diagnostic runtime" |
| `/codes/p0420` | "Canonical symptom paths," "Knowledge Paths from This Code" |
| `/repairs/...` | "Opportunity score 141" on symptom cards |

**Bottom line:** The site still reads like a sprint demo to investors, not a product for car owners.

---

## 6. SEO & Traffic Analysis

### Sitemap Architecture

| Sitemap | Status | Approx URLs |
|---------|--------|-------------|
| `/sitemap.xml` | ✅ Active | ~500 (static + tools + guides + symptoms) |
| `/codes/sitemap.xml` | ✅ Active | ~170 |
| `/community/sitemap.xml` | ✅ Active | Threads (but forum is empty) |
| `/repair/sitemap.xml` | ✅ Active | Chunked child sitemaps |
| `/repair/winners/sitemap.xml` | ✅ Active | Winner recrawl set |
| `/manual/sitemap.xml` | ✅ Active | 82 makes |
| `/wiring/sitemap.xml` | ✅ Active | Wiring SEO entries |
| `/vehicles/sitemap.xml` | ❌ **Disabled in robots.ts** | Unknown (exists but hidden) |

**Critical miss:** `/vehicles/sitemap.xml` is the biggest SEO surface on the site (potentially 100K+ year/make/model URLs). The sitemap files exist. The backbone is healthy. But robots.ts tells Google to ignore it.

### robots.txt Rules

```
Disallow: /admin/
Disallow: /api/internal/
Disallow: /community/*?page=
Disallow: /manual/hyperlink/
```

These are fine. No issues.

### Canonical/Redirect Stability

- `www.sotonauto.com` → 308 redirect to apex ✅
- Apex is canonical ✅
- **DO NOT TOUCH THIS.** Any change here triggers another migration disaster.

### Analytics Stack

| Tool | ID | Status |
|------|-----|--------|
| Google Analytics 4 | `G-WNFX6CY9RN` | ✅ Active |
| Microsoft Clarity | `wk5l41apgb` | ✅ Active |
| Ahrefs | Deferred load | ✅ Active |
| VWO | Optional | Not configured |

Event tracking is **exceptionally deep** (1,218 lines in `analytics.ts`):
- Scroll depth (25%, 50%, 75%, 100%)
- Time on page (30s, 60s, 120s, 300s)
- Click tracking via `data-track-click`
- Form submit tracking
- Impression tracking via IntersectionObserver
- UTM persistence

**Verdict:** You are tracking everything. But with ~6 organic sessions/day, there's almost nothing to track. The analytics infrastructure is built for 5,000+ daily users, not 6.

---

## 7. Conversion & Business Effectiveness

### What Is SpotOnAuto Supposed To Do?

1. **Primary:** Get organic traffic from people searching car repair info
2. **Secondary:** Convert them to AI diagnosis, email capture, or affiliate clicks (Amazon/TOPDON)
3. **Tertiary:** Build authority for Microsoft Copilot citations

### Current Effectiveness Score

| Goal | Grade | Why |
|------|-------|-----|
| Organic traffic | **F** | 3% of baseline. 6 sessions/day. |
| Content depth | **B** | P0420 page is excellent. Codes are solid. Repair guides exist. |
| Content discoverability | **D** | Vehicles sitemap hidden. Wiring page broken. Manual page broken. |
| Trust/credibility | **C** | SDVOSB badge is strong. But developer language undermines professionalism. Empty community hurts. |
| Conversion to diagnosis | **C** | Multiple entry points but no clear funnel. Email capture exists. |
| Affiliate monetization | **D** | Parts page is thin. Amazon links on code pages are generic ("Shop on Amazon"). No vehicle-specific part recommendations. |
| Copilot citations | **F** | 12,400/mo claimed on About, but actual citations near zero post-Bing penalty. |

### Revenue Path Analysis

Current monetization:
1. **Amazon Associates** — Generic product links on code pages
2. **TOPDON referral** — Scanner product cards
3. **Email list** — Maintenance schedule capture
4. **Pro upgrade** — "1 check remaining today" on second-opinion

**Problem:** None of these are vehicle-specific. A user on the P0420 page sees generic "OBD2 scanner" and "battery tester" links. They don't see "Catalytic converter for 2013 Honda CR-V" or "Downstream O2 sensor for your car." The affiliate opportunity is massively underutilized.

---

## 8. Prioritized Action Plan

### 🔴 P0 — Do This Week (SEO Recovery Critical Path)

1. **Re-enable `/vehicles/sitemap.xml` in `robots.ts`**
   - The backbone is healthy (176K sections, 61 makes, 32 years).
   - The sitemap files already exist.
   - This is the single biggest SEO lever on the site. Every day it's disabled is lost authority.
   - **Before doing this:** Run `npm run smoke:prod` to verify `/vehicles/` pages return 200, not 404.

2. **Fix `/manual` page database error**
   - "Unable to load the service manual database right now" destroys trust.
   - Either fix the DB connection or redirect `/manual` to `/repair` until it's working.

3. **Hide `/community` from nav and sitemap until seeded**
   - 0 threads across 8 categories is worse than no forum.
   - Remove from sitemap, remove from mobile nav, keep the route live but unlinked.
   - Seed 10–15 starter threads before re-adding.

### 🟡 P1 — Do This Month (UX & Conversion)

4. **Strip all developer/internal language from user-facing pages**
   - "Canonical symptom paths" → "Related symptoms"
   - "Knowledge Paths from This Code" → "What this code means for your car"
   - "Opportunity score 141" → Remove entirely
   - "Off the main thread" / "above-the-fold client bundle" / "client bundle" → Remove entirely
   - This is the fastest trust win.

5. **Consolidate diagnosis entry points**
   - Homepage, `/diagnose`, and `/cel` all do the same thing.
   - Pick one primary path. Make the others soft-redirect or clearly secondary.
   - Recommendation: Make `/diagnose` the canonical. Merge `/cel` content into `/codes` as a "CEL? Start here" banner.

6. **Make `/wiring` functional in static render**
   - Add a year/make/model picker that works without JS.
   - Or at minimum, list top makes with links to wiring sub-pages.
   - Current page is a promise with no delivery mechanism.

7. **Improve affiliate relevance**
   - On code pages, show vehicle-specific part recommendations (not generic scanners).
   - On repair guide pages, embed exact parts for that year/make/model/task.
   - This is where the money lives.

### 🟢 P2 — Do Next Quarter (Growth & Authority)

8. **Merge `/repair` and `/repairs`**
   - Pick `/repair` as canonical. 301 `/repairs/*` → `/repair/*`.
   - Update all internal links.

9. **Build a real `/parts` page**
   - Current page is an Amazon disclaimer with brake categories.
   - Minimum viable: vehicle-specific part lookup that deep-links to Amazon with fitment.

10. **Re-seed Copilot citations**
    - Bing trust is the blocker.
    - Publish 2–3 high-authority, original-data pieces (e.g., "Most Common P0420 Causes by Make: 2025 Analysis").
    - Get 3–5 backlinks from auto forums/Reddit.
    - Wait 3–6 weeks for Bing to re-evaluate.

11. **A/B test homepage headline**
    - Current: "Time To Silence Your Check Engine Light" (techy, narrow)
    - Test: "Free Repair Guides for Your Exact Car" (clear, broad)
    - The current headline filters out everyone who doesn't have a CEL on.

---

## 9. Recovery Timeline Projection

| Milestone | Timeline | Trigger |
|-----------|----------|---------|
| Vehicles sitemap re-enabled | **This week** | Deploy + verify smoke tests |
| Bing duplicate-content warning clears | **2–4 weeks** | Zero new IndexNow spam + healthy crawl |
| Google re-processes vehicle pages | **4–8 weeks** | Sitemap discovery + backbone content |
| Copilot citations return | **6–12 weeks** | Bing trust recovery + backlink signals |
| Pre-disaster impressions (4,700/day) | **3–6 months** | Sustained content quality + authority rebuild |
| Pre-disaster organic sessions (52/day) | **2–4 months** | Usually follows impressions by 4–8 weeks |

**Key risk:** If you bulk-submit URLs via IndexNow again, reset the clock by 2–4 months.

---

*End of audit. This document should be reviewed alongside `SITE-AUDIT.md` (March 24) and the SpotOnAuto skill memory for full disaster history.*
