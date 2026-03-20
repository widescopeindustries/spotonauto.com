# SpotOnAuto 30/60/90-Day Execution Plan

## Current Position

- Search visibility is improving at the site level but the repair SEO backbone is still not recovered.
- Last 28 days in Search Console vs prior 28 days:
  - clicks: `411` vs `173`
  - impressions: `36,725` vs `18,938`
  - avg position: `11.44` vs `12.11`
- Repair recovery scoreboard remains weak versus the late-February baseline:
  - impressions/day: `537.0` vs `4,730.6`
  - organic sessions/day: `9.0` vs `52.0`
  - avg position: `51.7` vs `8.0`
- Paid traffic currently carries the asset:
  - Cross-network: `2,370` sessions
  - Organic Search: `465` sessions
- Infrastructure is sound:
  - VPS manual backbone healthy with `82,588` indexed sections
  - knowledge graph audits clean at large scale

## 30 Days

- Fix crawl/index hygiene.
  - Keep utility/auth/personal routes out of the index.
  - Remove accidental SEO value leaks into `/auth` and similar pages.
- Tighten sitemap freshness and submission hygiene.
  - Ensure all sitemap `lastmod` values reflect current deploy/build state.
  - Re-submit the repair winners sitemap after each meaningful content/indexing push.
- Work the existing winners set instead of expanding surface area.
  - Primary KPI: winners-set indexed rate from `49.1%` to `85%+`.
  - Secondary KPI: late-Feb repair baseline recovery from `11.4%` to `30%+`.
- Improve trust on top dropped repair URLs.
  - Re-crawl, validate canonicals, confirm 200s, confirm internal links, confirm sitemap presence.
- Tighten measurement.
  - Validate GA4 page and event coverage weekly.
  - Separate paid, organic, and monetization reporting in one weekly dashboard.

## 60 Days

- Turn repair winners into clusters.
  - Build tighter exact-vehicle hub -> repair -> tool/spec/manual link loops.
  - Expand from validated winner URLs into adjacent exact-vehicle variants only after indexing trust improves.
- Improve monetization yield.
  - Raise affiliate click-through on guide sessions with better placement and higher-fit part/tool blocks.
  - Primary KPI: affiliate clicks per 100 guide generations.
- Clean thin or misaligned surfaces.
  - Reduce effort on low-traction sections like wiring until repair SEO shows durable lift.
  - Review oddball inventory that attracts junk impressions from invalid year/make/model combinations.

## 90 Days

- Scale only what proves recovery.
  - Expand graph-driven hubs and adjacent repair coverage from pages already earning impressions and clicks.
- Push portfolio quality upward.
  - Add stronger structured data coverage and clearer hub-page summaries.
  - Build a repeatable recovery loop: inspect -> fix -> submit -> validate -> expand.
- Portfolio targets.
  - Organic sessions become the primary growth engine rather than paid cross-network.
  - Repair pages, not auth/utility pages, dominate organic entrances.
  - Monetization and guide usage move together instead of diverging.

## Immediate Priorities

1. Auth and personal utility routes must stay out of the index.
2. Repair winners indexing trust must improve before new surface expansion.
3. Sitemap freshness must reflect live state.
4. Weekly reporting must distinguish portfolio growth from paid inflation.
