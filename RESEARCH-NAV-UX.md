# SpotOnAuto — Navigation & UX Research
*Bubba Research | March 24, 2026*

---

## Overview

This document analyzes the navigation and information architecture of the best auto repair / DIY mechanic websites. Each site was fetched directly. The goal: find what works so SpotOnAuto can build the cleanest, most effective nav for its specific content mix (148K wiring diagrams, 60K repair guides, 3K vehicle pages, DTC codes, AI chat, forum, parts finder).

---

## Site-by-Site Analysis

---

### 1. RepairPal.com

**URL:** repairpal.com  
**Top-Level Nav Items:** 4 primary (Find Repair Location, Get an Estimate, Check for Recalls, Your Car) + Car Research + For Business = **6 total**, but only 4 show as primary CTAs.

**Entry Method:** BOTH — vehicle-first AND problem-first  
- Vehicle-first: "Your Car" dropdown → select make/model → see problems, estimates, maintenance
- Problem-first: Symptoms Guide, OBD-II Codes, Common Problems — all accessible without picking a vehicle

**Primary User Flows:**
1. **Find a shop:** Homepage → "Get an Estimate" → enter zip + vehicle → browse repair costs → book shop
2. **Diagnose a problem:** Homepage → "Your Car" → Troubleshooting → Symptoms Guide → pick symptom → quiz-based narrowing → suggested repairs
3. **Look up a code:** Homepage → Your Car → OBD-II Codes → search code → plain-English explanation + cost to fix

**Symptom Guide:** Exceptional UX. Organizes by what the user *experiences* (smell, sound, feel, warning light). Offers troubleshooting *quizzes* — interactive Q&A that narrows down the problem without requiring technical knowledge. Uses language like "car won't start" not "cranking failure."

**Language:** Almost entirely plain English. "Get an Estimate" not "Request a Quote." "Common Problems" not "Known Defects." "Troubleshooting Guide" with quizzes that ask "Does it crank?" not "Is the starter engaging?"

**Mobile Nav:** Hamburger menu. Primary CTAs (Find Shop, Get Estimate) surface as bold buttons even on mobile. Vehicle selector is a prominent dropdown.

**Footer Mega-Links:** Organized into four groups: Getting Started, Learn About Your Car, For Business, About RepairPal. Very clean.

**What Makes It Work:**
- Dual-entry (vehicle OR problem) — no dead end
- Interactive quizzes for symptom diagnosis (no jargon required)
- Clear "what it costs" always available
- Every page has cross-links to adjacent resources (estimate → find shop → symptoms)

---

### 2. AutoZone.com/DIY

**URL:** autozone.com/diy  
**Top-Level Nav Items:** AutoZone's main nav is product-focused. The DIY section is a **blog-style subsite** not well-integrated into the main nav. Top-level categories on the DIY page: Batteries, Brakes, Fluids, Filters, Engine, Electrical — organized by **part category**, not by problem or vehicle.

**Entry Method:** Problem-first (by part/symptom category). NOT vehicle-first.  
- You find an article like "How to Replace Brake Pads and Rotors" — it's generic, not vehicle-specific
- Vehicle specificity happens at point-of-purchase (the "add vehicle" feature in the main store)

**Primary User Flow:**
1. Homepage → DIY section → browse by category (Battery, Brakes, etc.) → read article → "buy the part" CTA links to AutoZone store

**Featured/Popular Posts prominently highlighted:** "How to Change Brake Pads," "How to Dispose of Car Batteries," "How Much Does It Cost to Replace Brakes?" — these are the high-traffic queries people actually search.

**Language:** Mix. The articles themselves are plain English ("Grab your tools and let's get started!"). Categories use technical-ish names (Brakes, Battery) but these are universally understood.

**Mobile Nav:** The store's universal "add vehicle" widget appears on mobile. DIY blog content is mobile-responsive with card layout.

**Key Insight:** AutoZone's DIY section is primarily a **content marketing play** to drive parts purchases. Every article ends with a "buy this part" link. The UX is optimized for "I know what I need to do" — not for diagnosis.

**Gap:** No symptom-based entry. No "I don't know what's wrong." No vehicle-first browsing of repair content.

---

### 3. Haynes (us.haynes.com)

**URL:** us.haynes.com  
**Top-Level Nav Items:** Not directly enumerable from fetch, but the homepage is organized around a **vehicle finder widget** as the dominant hero element.

**Entry Method:** Vehicle-FIRST, exclusively.  
- Hero is a multi-field form: Your Vehicle Type → Make → Model → Year → Sub-Model (optional) → Engine (optional)
- Alternative inputs: license plate or VIN
- Once vehicle selected → find your manual

**Primary User Flow:**
1. Homepage → Enter vehicle (Make/Model/Year) → Find manual → Buy or access digital manual → Navigate repair chapters within manual

**Structure:** Haynes organizes **by vehicle**, then within the vehicle: by **chapter** (Engine, Transmission, Brakes, Electrical, etc.). Classic workshop manual structure.

**Language:** Technical but accessible. "DIY Experts Since 1960" — positions as authoritative. Blog content uses plain English ("How to change your oil in 5 steps").

**Mobile Nav:** Vehicle finder is first and prominent on mobile. Clean form UI.

**What Makes It Work:**
- The vehicle selector as hero = zero ambiguity about where to start
- Multi-input options (VIN, license plate, or year/make/model) accommodate different user contexts
- "Shop Popular Makes" quick-picks below the form reduce typing

**Gap:** Once you're inside a manual, navigation is linear (chapters). Cross-linking between vehicles or issues is limited.

---

### 4. CarComplaints.com

**URL:** carcomplaints.com  
**Top-Level Nav Items:** ~5 (Add a Complaint, Search Complaints, Top 20 Worst Vehicles, Lemon Law Information, Car Problem Resources)

**Entry Method:** BOTH — but primarily vehicle-first for browsing, problem-first for searching  
- URL structure: `/Make/Model/Year/` — very clean hierarchy
- Also: Search bar for problem keywords
- Also: "Top 20 Worst Vehicles" and "Recent Problem Trends" for discovery

**Primary User Flow:**
1. Vehicle-first: Homepage → pick make (e.g., Toyota) → pick model (Camry) → see problems by year with bar graphs showing complaint frequency → click specific problem → read complaints
2. Problem-first: Search "transmission slipping" → find vehicles with this issue

**Unique UX Feature:** **Data visualization as navigation.** The vehicle problem page shows a bar chart with complaints per model year — you can instantly see "the 2007 was a disaster." This turns raw complaint data into actionable visual navigation. No other site does this as well.

**Language:** Complaint-driven. Users submit in their own words ("my car dies randomly at stoplights"). CarComplaints doesn't sanitize this — it's authentic, searchable, and relatable. Problem categories are plain English: "Engine," "Transmission," "Electrical."

**Mobile Nav:** The complaint listing pages appear to render as simple text lists on mobile. An iPhone-optimized subdomain (m.carcomplaints.com) exists — shows awareness of mobile traffic but may be dated.

**What Makes It Work:**
- Clean URL hierarchy (`/Toyota/Camry/2007/`) — extremely SEO-friendly and intuitive
- Visual data (bar charts) as navigation tool
- Crowdsourced content means diverse, real-world language that matches search queries
- "Worst vehicles" and trend pages create viral/editorial content that attracts new users

---

### 5. FIXD App / fixdapp.com

**URL:** fixdapp.com  
**Top-Level Nav:** The homepage is primarily a product landing page (selling the FIXD hardware sensor). Secondary content is the blog/DTC lookup.

**Entry Method:** Problem-first, specifically **code-first**  
- "Decode over 7000 check engine lights in seconds"
- Enter a DTC code (P0420, P0133, etc.) → get plain-English explanation

**Primary User Flow:**
1. User has a check engine light → googles the code → lands on FIXD's DTC article (e.g., "P0420 — Catalyst System Efficiency Below Threshold")
2. Article explains: What this code means in plain English, common causes ranked by likelihood, cost to fix, DIY difficulty level
3. Upsell: Buy the FIXD sensor / Premium app to get "Confirmed Fix" data from their anonymized user network

**DTC Content Structure (what makes it great):**
- Code meaning in one sentence of plain English
- Severity indicator (is it safe to drive?)
- Common causes, ranked
- Estimated repair cost range
- DIY difficulty level (Beginner/Intermediate/Advanced)
- Step-by-step fix instructions
- "Top makes/models affected by this code" (great for long-tail SEO)

**Language:** Radically plain English. "Translate car problems into plain English. No car knowledge needed." — this is their brand promise. They never write "oxygen sensor upstream bank 1" without immediately explaining "that means the sensor that reads exhaust fumes before the catalytic converter."

**Mobile Nav:** The FIXD app IS mobile — the whole product is phone-based. The website is responsive but the real UX is in the app.

**Blog Organization:** Posts organized by: DIY Repair (how-to guides), Code explanations (P-codes), Part guides. No vehicle-first organization — it's all symptom/code-first.

**What Makes It Work:**
- "What does this code mean?" is one of the highest-volume auto searches on Google
- Plain English as a brand differentiator
- Severity ratings reduce user anxiety ("Can I drive my car?")
- Real-world confirmed fix data from sensor network (proprietary moat)

---

### 6. JustAnswer (justanswer.com/car)

**URL:** justanswer.com/car  
**Top-Level Nav Items:** 3 visible on auto section (Ask a Question, Browse Questions, Meet the Experts)

**Entry Method:** Problem-first, no structure required.  
This is the "I DON'T KNOW WHAT'S WRONG" site. Users just... type their problem in natural language.

**Primary User Flow:**
1. Homepage → Big text box "Describe your car problem" → Type "My 2007 Honda Civic makes a grinding noise when I brake" → Matched to an available mechanic → Get answer (pay-per-question model)
2. Browse existing answered questions by searching keywords

**Unique UX Pattern:** Featured answered questions on the homepage. Format: "[Question about specific vehicle]" → Expert answer summary → link to full thread. This is both social proof AND organic SEO content.

**Question examples shown:**
- "I have a 2014 Jeep Cherokee and I have a P1B13-00 fault code..."
- "Check hybrid light on 2015 Toyota Camry after tough day slogging through snow..."
- "I have a 2015 Escape 2.0 eco I have a battery light on and not charging..."

These read exactly like real user language — no sanitization.

**Language:** Whatever the user speaks. The platform works because the *expert* translates, not the interface.

**Mobile Nav:** Minimalist. The big question box is front and center on mobile. No complex navigation needed — just "describe your problem."

**What Makes It Work:**
- Zero barrier to entry — no vehicle selector, no category picking
- Natural language input (AI-adjacent before AI was mainstream)
- Massive SEO from thousands of indexed answered questions
- Expert credibility (certifications, satisfied customer counts displayed prominently)

**Gap for SpotOnAuto:** This model requires live experts. SpotOnAuto can replicate the "just describe it" entry with AI chat, and the "browse answered questions" pattern with a community forum.

---

### 7. 1AAuto.com

**URL:** 1aauto.com  
**Top-Level Nav Items:** Primarily a parts store. Key nav: Search by Vehicle, Catalog/Parts, Videos/Repair Help, Articles.

**Entry Method:** Vehicle-FIRST, dominant.  
- Hero: "Choose your vehicle" — the vehicle selector is the primary UI element
- "Search by Vehicle and/or Part" — explicit dual-entry
- Once vehicle is selected, content (parts, videos, articles) is filtered to that vehicle

**Repair Video Library (the gold standard):**
- Articles page: `/content_articles` — organized by:
  - **Car Knowledge 101** (conceptual — what is a control arm?)
  - **Troubleshooting and How-To Help** (organized by part: Wheel Hubs, Brakes, Suspension, Electrical, etc.)
  - **Part-Specific Knowledge** (deep dives: timing belt vs chain, etc.)
- Videos: Linked from parts product pages — "Watch our video on how to replace this part on your [specific year/make/model]"

**URL Pattern for Videos:** `/videos/[Make]/[Model]/[Year]/[repair-type]` — vehicle-specific and SEO-friendly

**What Sets 1A Apart:** Their YouTube channel (1A Auto) has ~4M subscribers. The website is effectively a gateway to YouTube content + parts purchases. Every how-to article links to a video. This creates a content loop: user searches for "how to replace wheel bearing 2008 Honda Accord" → 1A Auto video ranks → user clicks through to buy the part.

**Language:** Plain, instructional English. "Thousands of how-to auto repair videos to guide you step-by-step through your repair." Accessible to beginners.

**Mobile:** Responsive. Vehicle selector prominent. Video thumbnails in card layout.

**What Makes It Work:**
- Vehicle-first filtering means content is always relevant (no "this might not apply to your car")
- Part + video + article bundled together on product pages = complete DIY package
- YouTube presence drives massive free traffic

---

### 8. RealOEM.com

**Status:** Site blocked (403/Cloudflare). Based on known behavior and web data:

**What RealOEM Does:**
- OEM BMW parts catalog with interactive diagrams
- Navigation: Select vehicle by chassis code → select assembly group → see illustrated parts diagram → click any part to see OEM part number + price/availability
- URL pattern: `/bmw/diagrams/[chassis-code]/[group]`

**UX Philosophy:** Precision over accessibility. The navigation is organized exactly as BMW engineers organized the parts — by assembly group (Engine, Fuel, Gearbox, Axles, etc.). It's technical but consistent and logical for the target audience (enthusiast/mechanic crowd).

**What Makes It Work:**
- Every page is a visual diagram — navigation IS the content
- Part numbers link directly to pricing and availability
- No login required for browsing
- Extremely fast, sparse design — zero marketing noise

**Lesson for SpotOnAuto:** For wiring diagrams specifically, diagram-as-navigation (visual-first browsing) is the ideal UX. Let users click on components within a diagram rather than navigating menus.

---

### 9. Bonus — FIXD Blog / DTC Content Pages (deeper look)

FIXD's blog reveals their content architecture for DTC codes:

**URL pattern:** `/blog/[dtc-code]` (e.g., `/blog/p0420`)  
**Redirects to:** Landing pages that sell the sensor + DIY repair packs

**Content pattern on each DTC page:**
1. Code in plain English (H1: "P0420: Catalyst System Efficiency Below Threshold")
2. "What does this mean?" — 1-2 plain English sentences
3. Is it safe to drive? (YES/NO/CONDITIONAL with color coding)
4. Possible causes (ranked by likelihood)
5. How to fix (DIY steps or "take it to a shop")
6. Cost estimate
7. Call to action (buy sensor, see confirmed fixes)

**"Top Makes and Models" articles:** FIXD creates pages like "Top Makes and Models with DTC P0133" — showing which cars most commonly trigger each code. This is brilliant SEO: it captures people searching "[make] [model] P0133" because the page literally lists popular makes.

---

## Cross-Site Patterns & Observations

### Entry Methods Used Across Sites

| Site | Vehicle-First | Problem-First | Code-First | Natural Language |
|------|--------------|---------------|------------|-----------------|
| RepairPal | ✅ | ✅ | ✅ | Partial (quiz) |
| AutoZone DIY | ❌ | ✅ (category) | ❌ | ❌ |
| Haynes | ✅ (only) | ❌ | ❌ | ❌ |
| CarComplaints | ✅ | ✅ (search) | ❌ | ❌ |
| FIXD | ❌ | ✅ | ✅ (primary) | ❌ |
| JustAnswer | ❌ | ✅ (only) | Partial | ✅ (primary) |
| 1A Auto | ✅ (primary) | ✅ (articles) | ❌ | ❌ |
| RealOEM | ✅ (only) | ❌ | ❌ | ❌ |

**Winner for dual-entry UX:** RepairPal. They never trap a user in one path.

### Navigation Item Counts (top-level)

| Site | Top Nav Items | Notes |
|------|--------------|-------|
| RepairPal | 4-6 | Mega-dropdown for "Your Car" |
| AutoZone DIY | 5-6 (DIY subsite) | Part category tabs |
| Haynes | ~5 | Vehicle finder is the hero |
| CarComplaints | 5 | Minimal, editorial-style |
| FIXD | 3-4 | Product landing page style |
| JustAnswer | 3 | Minimal, question-focused |
| 1A Auto | 4-5 | Store + content hybrid |

**Consensus:** 4-6 top-level nav items is the sweet spot. More = overwhelming. Less = hidden content.

### Language Patterns

All top-performing sites use **plain English** as a competitive advantage:
- "What does this code mean?" not "DTC explanation"
- "Car won't start" not "cranking failure / no-start condition"
- "Estimate how much this repair costs" not "labor and parts pricing"
- "Is it safe to drive?" not "severity assessment"
- Time/cost indicators: "Takes 30 minutes," "Saves $200" — concrete value framing

### Mobile Nav Approaches

- **Vehicle selector as hero** (Haynes, 1A Auto, AutoZone store): Works best when users know their vehicle
- **Search box as hero** (JustAnswer, FIXD): Works best for code/symptom entry
- **Hamburger + sticky CTA** (RepairPal): Hides complexity while keeping key action visible
- **Card-based article browsing** (AutoZone DIY, FIXD blog): Clean mobile pattern for content-heavy sites

---

## Synthesis: Best Practices for SpotOnAuto

### Best Practice #1: DUAL ENTRY — Vehicle-First AND Problem-First, Always

**The single most important pattern from this research.**

Every top site either offers dual entry or suffers for not having it. The two fundamental user mental models:

- **"I have a 2003 Ford F-150 and I want to find everything about it"** → Vehicle-first
- **"My car is making a grinding noise when I turn"** → Problem-first  
- **"I got a P0420 code"** → Code-first
- **"I don't know what's wrong, help me figure it out"** → AI chat / natural language

SpotOnAuto should surface **all four paths** on the homepage, not just one. The homepage hero should be a **vehicle selector + search bar side by side**, with secondary entry points below for DTC lookup and AI chat.

**Recommended Homepage Hero:**
```
[Choose Your Vehicle: Year ▼ Make ▼ Model ▼]  [Search by symptom, code, or keyword 🔍]

— or —

[🤖 Ask AI: "My car is making a noise when I brake..."]   [🔢 Look up a DTC code: P____]
```

---

### Best Practice #2: VEHICLE CONTEXT IS KING — Lock It In, Filter Everything

**The best sites make vehicle selection sticky.** Once a user says "I have a 2005 Toyota Camry," every subsequent page should:
- Filter wiring diagrams to that vehicle
- Surface relevant repair guides
- Show relevant DTC codes
- Pre-filter the parts finder

This is what 1A Auto does well. This is what Haynes does. This is what AutoZone's store does with "add vehicle."

**For SpotOnAuto:** Implement a persistent vehicle selector/banner. When selected:
- It should appear on every page (sticky header element)
- All 148K wiring diagrams should filter to that vehicle
- All 60K repair guides should filter to that vehicle
- The vehicle page (one of 3K) becomes the user's "home base"

The vehicle page hub structure should be:
```
Toyota Camry (2003)
├── Wiring Diagrams (X available)
├── Repair Guides (X available)  
├── Common Problems / DTC Codes
├── Community Forum threads
└── Parts (affiliate links)
```

---

### Best Practice #3: PLAIN ENGLISH EVERYTHING — Especially for Entry Points

**Every barrier to entry should speak the user's language, not the mechanic's.**

SpotOnAuto's biggest challenge with 148K wiring diagrams and 60K repair guides is that this content is inherently technical. The navigation must translate.

**Wrong way:**
- "EWD Index" (Electrical Wiring Diagram Index)
- "DTC Fault Code Reference"
- "ETCS-i Throttle Control"

**Right way:**
- "Wiring Diagrams" (full stop — everyone understands this)
- "Check Engine Light Codes" 
- "Look Up a Code"
- "Repair Guides"

**On content pages themselves:**
- Every wiring diagram page: "What does this diagram show?" — one plain sentence
- Every DTC code page: Lead with "What this means for you" before technical details
- Difficulty ratings: Beginner / Weekend Warrior / Professional (not "Level 1/2/3")
- Time estimates: "About 2 hours" on every repair guide

**FIXD is the model here.** Their entire brand is "we translate car problems into plain English." SpotOnAuto should adopt this framing: *SpotOnAuto explains your car in plain English.*

---

### Best Practice #4: THE VEHICLE PAGE AS THE CONTENT HUB

**RepairPal, 1A Auto, and CarComplaints all converge on this pattern:** a vehicle-specific page that aggregates all available content for that make/model/year.

SpotOnAuto has 3K vehicle pages. These should be the most powerful pages on the site — pulling together:

```
/vehicles/toyota/camry/2003/
├── Hero: Vehicle overview (reliability, common issues)
├── Wiring Diagrams → grid of available diagrams
├── Repair Guides → top guides for this vehicle
├── Known Problems → DTC codes most common on this car
├── Community → recent forum threads about this car
├── Parts → affiliate parts with "fits your 2003 Camry" confirmation
└── "Ask AI about my 2003 Camry" → scoped AI chat
```

**CarComplaints does the visual data well** — show bar charts of common problems by year. Users find this navigation in itself (the 2007 model had way more problems than the 2006).

**URL structure should be clean and consistent:**
- `/vehicles/[make]/[model]/[year]/` — for vehicle pages
- `/wiring/[make]/[model]/[year]/[system]/` — for wiring diagrams
- `/repair/[make]/[model]/[year]/[system]/` — for repair guides
- `/codes/[dtc-code]/` — for DTC pages (+ optionally `/codes/[dtc-code]/[make]/[model]/`)

---

### Best Practice #5: DTC CODE PAGES THAT CONVERT AND RANK

**Every DTC code is a Google search.** FIXD has figured this out. Each code should have its own page with:

1. **H1: Code + Plain English name** — "P0420: Catalyst System Efficiency Below Threshold (Catalytic Converter)"
2. **What it means** — 2 sentences, no jargon
3. **Is it safe to drive?** — YES / DRIVE CAREFULLY / NO — color coded, prominent
4. **Most likely causes** — ranked, with links to repair guides
5. **Estimated repair cost** — even if approximate
6. **DIY vs Shop recommendation** — based on difficulty
7. **Wiring diagrams that may be relevant** (SpotOnAuto's unique asset)
8. **Community forum threads about this code** — "What others found"
9. **Ask AI** — "Ask SpotOnAuto AI about this code on my specific car"

**FIXD's "top makes/models" sub-articles are SEO gold** — SpotOnAuto should replicate: `/codes/p0420/toyota-camry/` as vehicle-specific code pages, cross-linked from both the code page and the vehicle page.

---

## Recommended Nav Structure for SpotOnAuto

### Top-Level Navigation (desktop, ≤6 items)

```
[SpotOnAuto Logo]   My Car ▼   Wiring Diagrams   Repair Guides   Look Up a Code   AI Diagnosis   [Search 🔍]   [Forum]
```

Breaking it down:

**1. My Car (mega-dropdown)**
- Opens vehicle selector if not set
- If vehicle set: shows "My 2003 Toyota Camry" → links to vehicle hub page
- Quick links: Recent diagrams, saved guides, parts I've viewed

**2. Wiring Diagrams**
- Browsable by: Make → Model → Year → System
- OR: search by system name ("power windows," "fuel injection")
- Highlights: 148K diagrams, 1982-2013 coverage
- Entry: requires vehicle selection (prompt if not set)

**3. Repair Guides**
- Browsable by: System/Category (Engine, Brakes, Electrical, Suspension, etc.)
- OR: filter by your vehicle
- 60K guides — surface the most popular, most recently updated

**4. Look Up a Code**
- Prominent search: [Enter code: P____] [Go]
- Popular codes quick-links below (P0420, P0300, P0171, P0128, etc.)
- Browse by system (Powertrain / Body / Chassis / Network)

**5. AI Diagnosis**
- "Describe what's happening with your car"
- Big text input, vehicle context auto-applied if set
- Positioned as "not sure what's wrong? Start here"

**6. [Search icon]**
- Universal search across all content types
- Results surfaced with type labels: [Diagram] [Guide] [Code] [Forum]

**Forum:** In top nav or as a sub-item under "Community." Don't bury it — forum content is long-tail SEO gold and builds community. But it's secondary to the four core tools.

---

### Mobile Nav (hamburger)

On mobile, the hamburger opens a full-screen menu with:

```
[🚗 My Car: 2003 Toyota Camry]  (tap to change)

Quick Actions:
[⚡ Look Up a Code]    [🤖 Ask AI]

Browse:
— Wiring Diagrams
— Repair Guides
— Check Engine Codes
— Community Forum
— Find Parts

[🔍 Search everything]
```

The vehicle context should persist at the TOP of mobile menus — users shouldn't have to re-enter their car on every page.

---

### Homepage Structure (above the fold → below fold)

```
ABOVE FOLD:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Hero headline: "Fix Your Car. Actually Understand It."]

[Vehicle Selector: Year ▼  Make ▼  Model ▼  → Go]
OR  [🔍 Search by symptom, part, or DTC code]

[Quick entry: 🔢 Look Up Code | 🤖 Ask AI | 📋 Repair Guides | 🔌 Wiring Diagrams]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BELOW FOLD (after vehicle selected OR for non-logged visitors):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Most searched codes this week: P0420, P0300, P0171...]
[Popular Repair Guides: Brakes, Oil Change, Timing Belt...]
[Popular Vehicle Pages: Toyota Camry, Honda Accord, Ford F-150...]
[From the Forum: Recent discussions]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## What SpotOnAuto Should NOT Do

Based on this research, avoid these anti-patterns:

1. **Don't make users pick a category before getting to content** — Always offer search as an escape hatch
2. **Don't use technical jargon in navigation labels** — "EWD" means nothing to most users; "Wiring Diagrams" is clear
3. **Don't hide the AI chat** — It's a differentiator. Surface it prominently, not buried in a footer
4. **Don't separate wiring diagrams from repair guides at the navigation level** — Users don't know which they need; let the vehicle page hub surface both
5. **Don't require account creation to browse** — RepairPal, 1A Auto, FIXD all let users get value immediately; login is for saving/preferences only
6. **Don't build a flat article structure** — 60K repair guides and 148K diagrams need hierarchical URLs and filtering, not an infinite scroll blog
7. **Don't make the forum its own silo** — Forum content should surface on vehicle pages and code pages (e.g., "5 people with a 2003 Camry asked about P0420")

---

## SpotOnAuto's Unique Moat — Lean Into It

Most sites have repair guides OR parts OR DTC codes. SpotOnAuto's specific combination is genuinely rare:

**148K wiring diagrams (1982-2013)** — Almost nobody else has this at scale for older vehicles. For pre-1996 vehicles especially, wiring diagrams are very hard to find online. This is a major SEO and utility moat.

**The integrated play:**
- User searches "1989 Toyota Pickup wiring diagram"
- Lands on SpotOnAuto wiring page
- Sees relevant repair guide for that system
- Sees community discussion about common wiring issues on that truck
- AI chat available to help interpret the diagram
- Parts affiliate links for components mentioned in the diagram

No other site connects these dots for vintage/older vehicles. The navigation should make this connection **explicit and easy** — not something the user has to discover.

---

## Summary: The 5 Non-Negotiable UX Principles

1. **Dual Entry Always** — Vehicle selector + keyword search, always coexisting. Never trap the user in one path.

2. **Sticky Vehicle Context** — Once a user sets their vehicle, it follows them everywhere and filters everything. This turns 148K diagrams from overwhelming to personal.

3. **Plain English at Every Door** — Navigation labels, page titles, code explanations — all written for someone who knows nothing about cars but owns one.

4. **Vehicle Hub Pages as the Content Center of Gravity** — Each of the 3K vehicle pages should be the best page on the internet for that specific vehicle. Pull in diagrams, guides, codes, forum threads, parts. This is SpotOnAuto's version of RepairPal's vehicle page.

5. **4-6 Top Nav Items Max, with AI as a Primary CTA** — The AI diagnostic chat is a genuine differentiator. Most competitors don't have it. It handles the "I don't know what's wrong" path that JustAnswer monetizes with human experts. SpotOnAuto can offer it for free (or freemium) at scale.

---

*Research conducted March 24, 2026. Sites fetched directly: RepairPal, AutoZone DIY, Haynes, CarComplaints, FIXD, JustAnswer Auto, 1A Auto. RealOEM blocked by Cloudflare (403); analysis based on known UX patterns and prior knowledge. ChiltonDIY domain no longer active.*
