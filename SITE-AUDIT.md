# SpotOnAuto Site Audit
**Date:** March 24, 2026  
**Auditor:** Bubba Research  
**Context:** Site owner reported "the site is confusing as hell." This audit is brutally honest.

---

## Executive Summary

The site has serious problems in three categories:
1. **Developer language left in user-facing copy** — multiple pages read like internal engineering notes, not a product for car owners
2. **Broken or empty pages** — several core pages render nothing or fail outright
3. **Severe redundancy** — `/repair` and `/repairs` are nearly identical; `/guides` and `/repairs` serve overlapping purposes; `/cel` and `/codes` compete for the same traffic

The navigation alone has **10 items** (6 primary + 4 secondary). A normal user has no idea what's different between "Guides," "Repair Hub," "Repairs," "Diagnose My Car," and "2nd Opinion."

---

## Navigation Audit

### Top Nav Items (counted)
Primary bar: **Guides | Wiring Diagrams | Codes | Repair Hub | Parts | Community** = **6 items**  
Secondary/utility bar: **Diagnose My Car | 2nd Opinion | History | Sign In** = **4 items**  
**Total: 10 nav items**

### Problem
There is also a hidden "quick access" section visible in the nav markup that reads:
> *"Fast paths into repair, wiring, codes, and community without waiting on extra UI state."*

**That's a developer comment. It's showing up as navigable text.** Users don't know what "UI state" means and shouldn't have to read it.

### Nav Confusion
- "Guides" vs "Repair Hub" vs "Repairs" — three items that all mean "repair guides"
- "Codes" vs "CEL" — two separate pages targeting the same check-engine-light audience
- "Diagnose My Car" vs "2nd Opinion" — unclear difference to a new visitor

---

## Page-by-Page Audit

---

### 1. Homepage (`/`)
**Status:** 200 OK  
**What it shows:** A vehicle picker (year/make/model), some category cards (Lighting, Brakes, Battery, Fluids, Filters), and popular vehicle hubs.

**Developer/internal language visible on page:**
- *"Vehicle-first repair routing"* — This is a developer architecture label, not a headline.
- *"Why this route is faster"* — Developer explanation of a design decision, not user copy.
- *"The homepage now keeps the first interaction path focused on year, make, and model. VIN decode, symptom-first diagnosis, and deeper AI flows still exist, but they no longer sit inside the first above-the-fold client bundle."* — **This is a literal developer changelog entry showing up as user-facing body copy.** A car owner has no idea what "above-the-fold client bundle" means.
- *"Why this is lighter — The hero now ships a smaller vehicle picker instead of the full VIN and diagnosis dashboard. The heavier flows still exist, but they only load when you actually need them."* — Same problem. Sounds like a sprint review note, not a website.
- *"Primary route — Choose year, make, and model to unlock the exact vehicle hub and related routes."* — The label "Primary route" is internal language.

**What's broken:** The vehicle picker appears to work (links to `/repair`), but much of the surrounding copy is incomplete or developer placeholder text rather than compelling user-facing content.

**What's redundant:** The homepage hero links to `/repair` which then replicates essentially the same category cards (Lighting, Brakes, Battery, Fluids, Filters). Same content, two pages.

---

### 2. `/guides`
**Status:** 200 OK  
**What it shows:** A list of makes (Acura, Audi, BMW... Toyota, Volkswagen, Volvo). That's it — just 40+ make links. No intro text, no context for what "guides" means vs "repair hub."

**Developer language:** None obviously visible in the rendered content.

**What's broken:** 
- `/guides/honda` → **returns only the SDVOSB footer text and nothing else.** Blank page. Clicking Honda from the guides directory takes you to an empty screen with just the veteran-owned business badge. This is a hard dead end.
- `/guides/honda/cr-v` **works** (200), but `/guides/honda/cr-v/2013` → **404.** The year-level URL under `/guides/` doesn't exist.

**What's redundant:** Functionally overlaps with `/repairs` which is also a browse-by-make, browse-by-category index. Same audience, different URL, unclear distinction.

---

### 3. `/wiring`
**Status:** 200 OK  
**What it shows:** Almost nothing. A heading ("Factory electrical archive") and three bullets. No actual wiring diagrams. No search interface visible in the static render. No way to find a 2008 Toyota Camry wiring diagram without clicking through something that may or may not load.

**Developer language:**
- *"Open the interactive wiring browser only when you need it"* — This is a UX architecture rationale, not a page headline.
- *"This keeps the wiring landing page lighter on mobile."* — Developer performance justification shown as body copy.
- *"The heavy browser stays off the main thread until the user intentionally opens the diagram flow."* — "Off the main thread" is a JavaScript performance concept. It has zero meaning to a car owner.

**What's broken:**
- `/wiring/toyota/camry` → **404.** Trying to deep-link to wiring by make/model fails.
- `/wiring/toyota/camry/2008` → **404.** No wiring diagram pages exist at these URLs.
- The page gives no indication of how to actually find a wiring diagram. There's no visible search box, no links to makes, nothing. It's essentially a blank placeholder with developer notes.

**Critical issue:** If wiring diagrams are a core value proposition, this page is completely non-functional from a user standpoint.

---

### 4. `/codes`
**Status:** 200 OK  
**What it shows:** A list of ~170 OBD2 codes (P0010 through apparently P05xx+). Each links to `/codes/[code]`. This is the most functional page on the site.

**Developer language:** None obvious in the rendered listing.

**What's redundant:** `/cel` exists as a parallel entry point for the same check-engine-light audience. Two separate pages competing for the same user and same search intent.

**What works well:** `/codes/p0420` is a solid page — explains the code, symptoms, causes, diagnosis steps, cost range, FAQs. **One exception:**
- *"Canonical symptom paths"* appears as a section label. "Canonical" is an SEO/developer term. Users would expect something like "Related symptoms" or "What you might notice."
- *"Knowledge Paths from This Code"* — also internal-sounding framing.

**Gap:** Only 170 codes listed out of 300+ promised in the page intro ("300+ diagnostic trouble codes explained"). There's a visible mismatch between the marketing claim and actual content.

---

### 5. `/repair`
**Status:** 200 OK  
**What it shows:** A hub page with links to `/diagnose`, `/symptoms`, `/repairs` (plural), and `/parts`. Then lists of popular repair guides and vehicle hubs. Essentially a landing page that points you *elsewhere*.

**Developer language:**
- *"This page is built to get you to the right instructions without extra category hopping."* — Describing UI intent, not selling anything to the user.
- Section headers like *"Open a vehicle-specific guide right away"* and *"Start with the repairs drivers handle most often"* are passable, but the copy is wooden.

**What's redundant:** `/repair` and `/repairs` are **nearly identical.** Both show the same five category cards (Lighting, Brakes, Battery, Fluids, Filters), same popular vehicle hubs, same popular guides. The difference: `/repair` has a preamble paragraph; `/repairs` has the full alphabetical category list. A user hitting either one has no idea which is the "real" page.

**Navigation confusion:** `/repair` (singular) is labeled "Repair Hub" in the nav. `/repairs` (plural) is only accessible by drilling into `/repair`. Neither page explains the difference.

---

### 6. `/repairs`
**Status:** 200 OK  
**What it shows:** Identical category cards to `/repair`, plus a long alphabetical list of repair types (Oil Change, Brake Pad Replacement... 45+ categories).

**Developer language:**
- *"This page is meant to move you from a broad job like brakes, batteries, filters, fluids, or lighting into the right year-make-model walkthrough without extra searching."* — Explaining the page's design intent to the user.
- Symptom hub cards on the brake pad sub-page show **"Opportunity score 141"** — this is an internal SEO metric that should never appear in user-facing copy. A car owner searching "squeaky brakes" does not need to know the opportunity score is 141.

**What's redundant:** See `/repair` above. These two pages should be one.

---

### 7. `/parts`
**Status:** 200 OK  
**What it shows:** A thin placeholder. Just says "Find the best deals on OEM and aftermarket parts for your vehicle on Amazon." Then three generic benefit bullets (Great Prices, Huge Selection, Fast Shipping — all Amazon attributes, nothing SpotOnAuto-specific). A "Start AI Diagnosis" button that links back to the homepage.

**What's broken:** There are no actual parts listed. No part categories. No fitment lookup. The page is an empty stub with an Amazon Associate disclosure and nothing else. The "Browse by Category" section header appears but the content beneath it is absent (rendered as just the header with nothing under it).

**What's redundant:** The page promises an AI parts list via the homepage link, which is circular and confusing. Parts are also promoted on individual repair guide pages.

**User experience:** A user who clicks "Parts" expecting to find parts for their car hits a blank page. This is a dead end.

---

### 8. `/community`
**Status:** 200 OK  
**What it shows:** Eight forum categories (Oil Changes & Fluids, Engine & Electrical, Brakes & Suspension, Tires & Wheels, Body & Interior, Heating & Cooling, Transmission & Drivetrain, General Discussion). Every single one shows: **"0 threads, 0 replies."**

**What's broken:** The forum is completely empty. Not a single post. Not a single reply. This is a ghost town.

**What's redundant:** An empty forum in the nav takes up a valuable slot and creates a terrible first impression. It implies the site has no community whatsoever.

**Recommendation:** Either populate it (even with seeded starter threads) or remove it from the nav entirely until it has real activity.

---

### 9. `/diagnose`
**Status:** 200 OK  
**What it shows:** A vehicle picker (Year / Make / Model), an optional problem description box, and a "Free — No credit card required" tagline. The actual AI diagnostic chat presumably loads after you enter the session.

**Developer language:**
- *"The heavier diagnostic runtime only loads after you enter the session."* — This is a performance architecture note explaining lazy loading. A user doesn't need to know this. They just want to describe their car problem.
- Page title is "Diagnostic Core | AI Car Problem Diagnosis" — "Diagnostic Core" sounds like a backend service name.

**What's redundant:** 
- Very similar to the homepage vehicle picker — the homepage *also* offers AI diagnosis
- `/cel` also offers AI diagnosis entry
- `/second-opinion` appears to be another diagnosis entry point

Three separate paths to essentially the same AI chat.

---

### 10. `/second-opinion`
**Status:** 200 OK (but renders nearly blank)  
**What it shows:** Almost nothing. The only content extracted is the footer/SDVOSB badge:  
> *"A Widescope Industries LLC Company — SDVOSB Certified | Service-Disabled Veteran-Owned Small Business"*

**What's broken:** The page content either failed to render or hasn't been built. No form, no description of what a "second opinion" means, no functionality visible. This is effectively a **blank page** — yet it sits in the top navigation.

**Critical issue:** "2nd Opinion" is in the main nav, links to a page that shows nothing. This destroys credibility.

---

### 11. `/cel`
**Status:** 200 OK  
**What it shows:** A landing page for check engine light lookup. Includes testimonials (Mike R., Sarah K., James T.), a cost comparison (Mechanic $100-150 vs SpotOn FREE), and a list of common codes. Cleaner and more marketing-focused than `/codes`.

**What's redundant:** Directly competes with `/codes` for the same check-engine-light audience. Two separate pages with overlapping purpose:
- `/codes` = directory of all OBD2 codes
- `/cel` = marketing-focused entry point for CEL help, with AI diagnosis CTA

These could be unified or at least clearly differentiated. Right now users who find one will also find the other and won't know which to use.

**What works:** The testimonials and savings comparison are the most human, user-friendly copy on the entire site. This page has the right energy — it just shouldn't be isolated from the rest.

---

### 12. `/about`
**Status:** 200 OK  
**What it shows:** Company description, SDVOSB certification, mission statement, and four "Why Choose Us" bullets. Claims "57+ Repair Guides" in the library.

**What's inconsistent:** The site claims 300+ DTC codes on `/codes` but only "57+ Repair Guides" here. These numbers don't appear to be dynamically updated — they're just static claims that may become stale.

**What's missing:** No team page, no story, no credibility beyond the military affiliation. The about page is minimal.

---

### 13. `/manual`
**Status:** 200 OK (but renders blank)  
**What it shows:** Only the SDVOSB footer badge — same problem as `/second-opinion`. The page title says "Factory Service Manuals | 82 Makes, 1982-2013" which is promising, but the actual content doesn't render.

**What's broken:** This is another **blank page** in or near the nav. Factory manuals are a real search term with real demand. Having a page that promises them but shows nothing is a missed opportunity and damages trust.

---

## Navigation Flows Tested

### Flow 1: Find 2013 Honda CR-V Brake Pad Replacement

| Step | URL | Result |
|------|-----|--------|
| Start | `/` | Homepage loads, vehicle picker visible |
| → Guides | `/guides` | Make list loads |
| → Honda | `/guides/honda` | **BLANK PAGE** — dead end |
| → Alternative via /guides/honda/cr-v | `/guides/honda/cr-v` | Works — shows model page |
| → 2013 year-level | `/guides/honda/cr-v/2013` | **404** |
| → Via repair hub | `/repair/2013/honda/cr-v` | Works — vehicle hub loads |
| → Brake pad guide | `/repair/2013/honda/cr-v/brake-pad-replacement` | Not tested (assumed works based on hub links) |

**Verdict:** The guide path through `/guides` is broken. Honda is a top-10 make. Clicking Honda from the guides directory hits a blank page. The working path (`/repair/[year]/[make]/[model]`) is not obvious from the navigation — you have to know the URL structure.

### Flow 2: Find Wiring Diagrams for 2008 Toyota Camry

| Step | URL | Result |
|------|-----|--------|
| Click "Wiring Diagrams" in nav | `/wiring` | Page loads but shows almost nothing |
| Try direct URL | `/wiring/toyota/camry` | **404** |
| Try year-level | `/wiring/toyota/camry/2008` | **404** |

**Verdict:** There is no functional path to wiring diagrams on the site. The `/wiring` page says diagrams exist (coverage from 1982-2013) but provides no working links and no search interface in the static render. If the interface only loads via JavaScript interaction, it's invisible to search engines and useless to users who don't know to click something.

### Flow 3: Look Up Code P0420

| Step | URL | Result |
|------|-----|--------|
| Click "Codes" in nav | `/codes` | Lists codes |
| Find P0420 in list | `/codes/p0420` | **Works well** |

**Verdict:** This is the one functional end-to-end flow. The P0420 page is the best content on the site — clear, useful, well-structured. The only issue is developer language ("Canonical symptom paths," "Knowledge Paths from This Code").

---

## Developer/Internal Language — Complete Hit List

These phrases appear in user-facing copy and should never be visible to a car owner:

| Page | Developer Language Found |
|------|--------------------------|
| `/` | "Vehicle-first repair routing" |
| `/` | "Why this route is faster" |
| `/` | "The homepage now keeps the first interaction path focused on year, make, and model. VIN decode, symptom-first diagnosis, and deeper AI flows still exist, but they no longer sit inside the first above-the-fold client bundle." |
| `/` | "Why this is lighter — The hero now ships a smaller vehicle picker instead of the full VIN and diagnosis dashboard. The heavier flows still exist, but they only load when you actually need them." |
| `/` | "Primary route" (as a section label) |
| Nav (all pages) | "Fast paths into repair, wiring, codes, and community without waiting on extra UI state." |
| `/wiring` | "Open the interactive wiring browser only when you need it" |
| `/wiring` | "This keeps the wiring landing page lighter on mobile." |
| `/wiring` | "The heavy browser stays off the main thread until the user intentionally opens the diagram flow." |
| `/diagnose` | "The heavier diagnostic runtime only loads after you enter the session." |
| `/diagnose` | Page title: "Diagnostic Core" |
| `/repair/2013/honda/cr-v` | "Exact Vehicle Command Center" (section heading) |
| `/repair/2013/honda/cr-v` | "One canonical page for your exact vehicle." |
| `/repair/2013/honda/cr-v` | "canonical vehicle identity" (in footer section) |
| `/repair/2013/honda/cr-v` | "Canonical graph blocks grounded in the exact 2013 Honda CR-V identity. These groups are exported in machine-readable form for audit and future hub generation." |
| `/guides/honda/cr-v` | "Tier-1 winner repair pages for the Honda CR-V" |
| `/guides/honda/cr-v` | "These exact repair pages are in the recovery lane already. Keep them linked from the model cluster so authority flows into the pages with the best current ranking potential." |
| `/guides/honda/cr-v` | "[Winner sitemap](/repair/winners/sitemap.xml)" — links to internal sitemap |
| `/repairs/brake-pad-replacement` | "Opportunity score 141" (and 132, 125) on symptom cards |
| `/repairs/brake-pad-replacement` | "These are the strongest report-backed symptom entry points for this repair family. Keeping them prominent helps route plain-English demand into exact repair pages faster." |
| `/codes/p0420` | "Canonical symptom paths" (section label) |
| `/codes/p0420` | "Knowledge Paths from This Code" |

**Bottom line: The site reads like a developer's Notion doc was copy-pasted into production.** The engineering rationale, SEO strategy notes, and architecture decisions are all visible to end users.

---

## Broken / Empty Pages Summary

| URL | Status | Issue |
|-----|--------|-------|
| `/wiring` | 200 but nearly empty | No usable content; developer notes only |
| `/wiring/toyota/camry` | 404 | No make-level wiring pages |
| `/wiring/toyota/camry/2008` | 404 | No year-level wiring pages |
| `/second-opinion` | 200 but blank | No content renders |
| `/manual` | 200 but blank | No content renders; only footer shows |
| `/guides/honda` | 200 but blank | Only footer renders; dead end from guides directory |
| `/guides/honda/cr-v/2013` | 404 | No year-level guide pages under /guides/ |
| `/repairs/brake-pad-replacement/honda/cr-v/2013` | 404 | Vehicle-specific repair pages don't exist under /repairs/ |
| `/parts` | 200 but empty | "Browse by Category" shows nothing |
| `/community` | 200 | 0 threads, 0 replies across all 8 categories |

---

## Redundancy Map

These pages serve overlapping purposes and create confusion:

| Pages | Problem |
|-------|---------|
| `/repair` + `/repairs` | Nearly identical content; both in navigation; different URL, same purpose |
| `/guides` + `/repairs` + `/repair` | All three are "find a repair guide" entry points |
| `/cel` + `/codes` | Same audience (check engine light); different tone; both in nav vicinity |
| `/diagnose` + `/cel` + `/` (homepage) | All three offer AI diagnosis entry |
| `/second-opinion` | Unclear how this differs from `/diagnose`; currently blank anyway |
| `/guides/honda/cr-v` + `/repair/2013/honda/cr-v` | Overlapping vehicle pages; one model-level, one year-level |

---

## Summary Scorecard

| Area | Grade | Notes |
|------|-------|-------|
| Navigation clarity | F | 10 nav items, 3 near-duplicate repair entry points |
| Page content quality | D | Developer notes visible as body copy on 8+ pages |
| Broken pages | D | 4 pages blank or 404 on core flows |
| Empty community | D | 0 posts in forum |
| Parts page | F | Essentially a placeholder with Amazon disclosure |
| Wiring diagrams | F | No usable path to any wiring diagram |
| Code lookup | B | Works; good content on individual code pages |
| Diagnosis flow | C | Works but confusingly duplicated across 3 pages |
| About page | C | Thin but honest |
| Homepage | D | Developer notes embedded in copy; unclear what to do |

---

## Priority Fixes (Ranked)

1. **Strip all developer/internal language from every page immediately.** It's the single biggest trust destroyer. The `cr-v` model page alone has 4+ internal notes visible to users.
2. **Fix `/second-opinion` and `/manual`** — they're in or near the nav and render blank. Either build them or redirect them.
3. **Merge `/repair` and `/repairs`** — pick one URL, 301 the other. Right now they're the same page with different addresses.
4. **Fix `/guides/honda` (and all other make-level guide pages)** — blank pages are dead ends from a core nav item.
5. **Remove or seed `/community`** — a forum with 0 posts is worse than no forum. Either hide it from the nav or seed 10-15 starter threads.
6. **Build the `/parts` page** or remove it from the nav. A blank page with an Amazon Associate disclaimer is not a feature.
7. **Consolidate check engine light entry points** — pick either `/cel` or `/codes` as the primary; link between them clearly instead of splitting the audience.
8. **Fix wiring diagram discoverability** — the `/wiring` page should show a functional make/model picker. If it requires JS to load, the static fallback must still be useful.
9. **Reduce the nav to 5-6 items max** — every redundant item adds to confusion.

---

*End of audit. Written for the owner, not filtered for comfort.*
