# Exact-Fit Graph Blueprint

## Core Rule
SpotOnAuto should behave like an exact-fit lookup engine, not a broad repair encyclopedia.

A page is successful when it can answer a specific automotive question for a specific vehicle configuration, then route the user cleanly to the next exact step.

## Canonical Answer Hierarchy
1. Exact OEM manual section or exact repair page
2. Exact vehicle hub page for disambiguation and routing
3. Symptom page for problem-to-solution mapping
4. Wiring and code pages as diagnostic bridges
5. Selector pages only when the vehicle or configuration is still unknown

## What This Means In Practice
- Generic repair task pages should be selector or browse pages, not final answer pages.
- Exact year/make/model/engine pages should carry the real answer load.
- Manual pages should remain the evidence and authority layer.
- The graph should route users from symptom to exact vehicle to exact repair or exact manual section.

## Page Roles
### Symptom Pages
- Purpose: turn vague complaints into a precise repair path.
- Must prioritize exact repair pages and exact vehicle pages.
- Should not present generic task hubs as if they are the answer.

### Vehicle Hub Pages
- Purpose: disambiguate the vehicle and route to the exact answer pages.
- Should lead with exact repairs, then wiring, then manual, then codes and tools.

### Exact Repair Pages
- Purpose: be the public-facing answer page for a specific repair on a specific vehicle.
- Should be linked from symptoms, vehicle hubs, codes, and manual excerpts.
- Should include exact parts, tools, and OEM evidence.

### Manual Pages
- Purpose: be the authority layer and the underlying procedure source.
- Should answer the question with OEM detail and should be discoverable through exact vehicle and repair pages.

### Wiring and Code Pages
- Purpose: support diagnosis and route into exact repair pages.
- Should be bridges, not endpoints.

### Selector Pages
- Purpose: catch uncertain users and force the exact vehicle/configuration choice.
- Should not pretend to be the final answer when the user needs a specific fitment.

## Graph Rules
- Exact-fit nodes outrank generic category nodes.
- Symptom hubs should surface exact repair pages first.
- Vehicle hubs should surface exact repair pages first, then wiring/manual bridges.
- Manual links should stay strong on repair pages because they add trust and answer depth.
- Generic browse pages should exist, but only as navigation aids.

## Content Rules
- Use year, make, model, and engine wherever needed.
- Use A/C, trim, drivetrain, and configuration details when they change the answer.
- Match real search phrasing: diagram, routing, location, capacity, torque spec, procedure, replacement.
- Do not rely on broad topic pages to answer exact-fit queries.

## SEO Goal
Make every query family resolve to one best canonical answer page, then use the graph to explain and support that answer from multiple angles.

## Monetization Goal
Attach parts, tools, and consumables to the exact answer pages, not to generic category pages.
