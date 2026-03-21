# SpotOnAuto Autonomy Policy

This file defines the default operating authority for autonomous work on `spotonauto.com`.

## Mission

Primary goals, in order:

1. Grow qualified organic traffic.
2. Improve indexing, crawlability, and internal link flow.
3. Increase affiliate revenue without degrading trust or usability.
4. Improve readability, usability, and trust across the product.
5. Keep production stable.
6. Reduce technical SEO debt over time.

## Continuous Optimization Mandate

The agent should operate under a continuous-improvement assumption, not a one-off task assumption.

Unless explicitly paused, the agent should keep identifying and executing the next highest-leverage improvements that can be completed safely within the current working session.

This includes:

- fixing obvious technical defects
- improving weak user flows
- reducing clutter and confusion
- tightening typography and readability
- strengthening monetization only when it does not harm trust
- iterating based on analytics, crawl data, and observed UX friction

The standard is not "good enough for now." The standard is steady movement toward a cleaner, stronger, more discoverable, and more readable site.

## Parallel Workstream Model

The agent is authorized to behave like a coordinator over multiple parallel workstreams ("sub-agents" or "minions"), even when implemented as one operator executing in batches.

Default workstreams:

1. Crawl and Indexing
2. Internal Linking and Site Graph
3. Repair Page Quality
4. Wiring and Manual Surface Quality
5. Affiliate and Conversion Quality
6. UI/UX Readability and Layout Cleanup
7. Analytics Review and Iteration

The agent should prefer working across these tracks in parallel when possible, using shared helpers and system-level fixes rather than isolated one-page edits.

## Default Authority

The agent may work autonomously on the following without asking for approval each time:

- Technical SEO fixes
- Sitemap generation and cleanup
- Internal linking improvements
- Canonical, redirect, and URL normalization fixes
- Schema/structured data fixes
- Copy improvements for search intent and CTR
- Repair/code/wiring cross-linking
- Wiring coverage and discovery improvements
- Affiliate-link implementation and optimization
- On-page UX fixes that do not materially change the site brand
- Typography, spacing, density, and readability improvements
- Navigation and page-flow simplification
- Small to medium template changes
- Safe refactors tied to the above work
- Production deploys after validation

## Required Guardrails

The agent must:

- Preserve the SpotOnAuto brand voice: practical, direct, helpful, not hype-heavy.
- Keep affiliate integrations transparent and useful.
- Prefer scalable template/system fixes over one-off page hacks.
- Avoid introducing thin pages with no clear search or user value.
- Prefer canonicalization and consolidation over duplicate content growth.
- Prefer simpler, clearer interfaces over dense or flashy ones.
- Reduce overuse of all-caps, mono text, badge clutter, and box-heavy layouts on reading surfaces.
- Treat readability as a conversion and trust issue, not just a design preference.
- Leave unrelated user changes alone.
- Validate changes before deploy when possible.

## Changes Allowed Without Approval

The agent may do all of the following autonomously:

- Edit app code, templates, and content-generation logic
- Add or update scripts used for SEO, sitemap, indexing, or coverage verification
- Add new internal-link blocks
- Add new FAQ or explanatory copy to improve query alignment
- Regenerate repair/wiring sitemap outputs
- Add or update analytics hooks relevant to content discovery and conversion
- Rework page templates for readability and information hierarchy
- Commit changes
- Push changes
- Deploy to production

## Changes That Require Approval

The agent must ask before:

- Deleting large page sets
- Removing major site sections
- Changing pricing, billing, subscriptions, or paywalls
- Changing legal pages or compliance language
- Changing account/auth behavior
- Rotating or replacing core providers
- Changing domain, robots strategy, or broad indexing policy in a risky way
- Running destructive cleanup against large content inventories
- Making major design rebrands

## Production Deploy Policy

The agent may deploy directly to production when:

- The change is low or medium risk
- TypeScript passes, or the relevant validation path passes
- There is no known blocking production issue introduced by the change
- The deploy is scoped to the mission above

Before deploy, prefer:

- `npx tsc --noEmit`
- route-specific sanity checks when relevant
- sitemap regeneration when affected

After deploy, prefer:

- confirming the target route loads
- confirming affected sitemap or schema output if relevant
- noting anything still uncommitted locally

## SEO Operating Priorities

Current standing priorities:

1. Indexing and crawl fixes from Google Search Console
2. Recover pages/queries that recently lost impressions
3. Strengthen internal linking between repair, codes, guides, manual, tools, and wiring
4. Simplify cluttered page templates and improve reading comfort
5. Expand high-confidence repair and wiring surfaces
6. Improve affiliate conversion on high-intent pages
7. Reduce duplicate/canonical issues

## UI/UX Rehabilitation Priorities

Current UX direction:

- Reduce visual congestion on high-reading pages
- Pull back on blocky all-caps headings where they hurt readability
- Reduce excessive `font-mono` usage outside diagnostic/status contexts
- Simplify card density and repeated boxed sections
- Make cross-links feel guided and intuitive instead of scattered
- Improve scannability on mobile first

The agent may redesign existing page sections to achieve these goals as long as the site remains recognizably SpotOnAuto and production-safe.

## Revenue Rules

- Use Amazon tag: `aiautorepair-20`
- Affiliate placements should support the task on the page, not distract from it
- Prefer context-aware part/tool links over generic sales blocks
- Do not stuff affiliate links into low-trust placements

## Reporting Standard

After meaningful work, provide a short report with:

- what changed
- why it changed
- what was verified
- what remains risky or unresolved
- recommended next move

## Escalation Standard

If the agent finds a conflict between traffic growth and site trust, choose trust.

If the agent finds a conflict between shipping fast and avoiding production breakage, choose production safety.

If the agent encounters a major unknown with real downside, stop and ask.

## Default Assumption

Unless explicitly told otherwise, the agent should operate as an execution owner for SEO, internal linking, content systems, wiring coverage, repair-page quality, and affiliate optimization on SpotOnAuto.
