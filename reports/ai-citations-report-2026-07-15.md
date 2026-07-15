# AI Citations & Affiliate Revenue Correlation Report

- **Report date:** 2026-07-15
- **Audit source:** ai-citations-audit-2026-07-15.json
- **Production base URL:** https://alloemmanuals.com
- **Total AI citations (sampled queries):** 1,616
- **Unique queries analyzed:** 50

## Executive Summary

Bing AI Performance data shows 1,616 citations across 50 sampled queries.
Commercial and maintenance-spec queries dominate the citation volume and carry the strongest affiliate intent.
There are currently **0 non-200 mapped URLs** and **0 pages missing local data** — these represent the fastest-win fixes.

## Citation Trend Context

- Total citations grew from ~40/day in early May to a peak of ~2,000/day around July 8–9.
- July 12–13 pulled back to ~1,200/day. Continue watching this series in the daily monitor.
- Bing is now the primary revenue-bearing search channel; protecting these AI-citation URLs is critical.

## Query Cluster Analysis

| Cluster | Queries | Citations | Share | Affiliate CTR Assumption | Est. Clicks | Est. Ordered Revenue |
|--------|--------:|----------:|------:|-------------------------:|------------:|---------------------:|
| Commercial / Parts Funnel | 5 | 363 | 22.5% | 22.0% | 80 | $247.19 |
| Maintenance Specs (oil, coolant, fluids, tires) | 37 | 1,038 | 64.2% | 12.0% | 125 | $385.56 |
| Repair Procedures | 5 | 154 | 9.5% | 8.0% | 12 | $38.13 |
| Diagnostic / DTC | 1 | 21 | 1.3% | 3.0% | 1 | $1.95 |
| Hub / Generic | 2 | 40 | 2.5% | 3.0% | 1 | $3.71 |

## Affiliate Baseline

Amazon affiliate tracking ID `aiautorepair-20` (Jan 01 – Jul 09 2026):
- **Clicks:** 928
- **Ordered items:** 82
- **Conversion rate:** 8.84%
- **Ordered revenue:** $2,872.48
- **Total earnings:** $106.33
- **Revenue per click:** $3.10
- **Earnings per click:** $0.11

> The revenue estimates above assume AI-citation traffic converts at the same rate as overall organic affiliate traffic. Actual AI-referred traffic may convert differently; update assumptions as GA4/Amazon attribution data improves.

## Top Cited Queries & Mapped URLs

| Citations | % Cited | Query | Mapped URL | Status |
|----------:|--------:|-------|------------|--------|
| 203 | 26.36% | amazon auto parts by vehicle make and model | /blog/amazon-auto-parts-by-vehicle-year-and-type | 200 |
| 194 | 45.33% | toyota fluid capacities | /guides/toyota | 200 +noindex |
| 105 | 44.87% | amazon auto parts by vehicle year and type | /blog/amazon-auto-parts-by-vehicle-year-and-type | 200 |
| 84 | 33.07% | porsche cayenne battery location | /repair/2024/porsche/cayenne/battery-replacement | 200 |
| 69 | 33.5% | toyota sienna tire size | /maintenance/2024/toyota/sienna/tire-size | 200 |
| 63 | 56.25% | how to change belt tensioner pulley on 2012 fiat 500c convertible | /repair/2012/fiat/500c/serpentine-belt-replacement | 200 |
| 55 | 14.75% | 2022 chevy equinox oil capacity | /maintenance/2022/chevrolet/equinox/oil-type | 200 |
| 42 | 50% | 2017 porsche cayenne battery location | /repair/2017/porsche/cayenne/battery-replacement | 200 |
| 40 | 28.17% | bmw x1 battery location | /repair/2024/bmw/x1/battery-replacement | 200 |
| 36 | 52.94% | volvo s60 battery replacement | /repair/2024/volvo/s60/battery-replacement | 200 |
| 33 | 30.28% | ford focus oil type chart | /maintenance/2018/ford/focus/oil-type | 200 |
| 32 | 100% | what color should the coolant be for pt cruiser 2008? | /maintenance/2008/chrysler/pt-cruiser/coolant-type | 200 |
| 30 | 16.13% | bmw x3 battery location | /repair/2024/bmw/x3/battery-replacement | 200 |
| 30 | 46.15% | ford ecosport ses wheel size | /maintenance/2022/ford/ecosport/tire-size | 200 |
| 29 | 39.73% | how to flush a 2015 ford taurus | /repair/2015/ford/taurus/coolant-flush | 200 |
| 29 | 32.58% | 2025 jeep compass tire size | /maintenance/2024/jeep/compass/tire-size | 200 |
| 28 | 25% | what oil does a defender take | /maintenance/2024/land-rover/defender/oil-type | 200 |
| 27 | 23.48% | mazda cx-5 coolant fl22 | /maintenance/2024/mazda/cx-5/coolant-type | 200 |
| 27 | 21.95% | subaru outback tire size | /maintenance/2024/subaru/outback/tire-size | 200 |
| 22 | 18.64% | all wiring diagrams | /wiring | 200 |
| 21 | 12.5% | p0108 07 ford mustang | /codes/P0108 | 200 |
| 21 | 31.82% | ford focus oil type | /maintenance/2018/ford/focus/oil-type | 200 |
| 20 | 33.33% | nissan titan tire size | /maintenance/2024/nissan/titan/tire-size | 200 |
| 19 | 40.43% | honda element tire size | /maintenance/2011/honda/element/tire-size | 200 |
| 19 | 27.54% | ford ranger oil capacity chart | /maintenance/2024/ford/ranger/oil-type | 200 |

## Recommended Actions

1. **Deploy the missing data pages.** The non-200 / missing-data URLs above were filled in `src/data/tools-pages.ts` and `src/data/vehicles.ts`. Build and deploy to make them live.
2. **Prioritize commercial queries.** `amazon auto parts by vehicle...` queries are pure affiliate intent; ensure the parts funnel CTAs are visible and tracking IDs are intact.
3. **Protect maintenance-spec pages.** Battery location, tire size, oil/coolant capacity, and fluid charts are the most-cited informational queries. Keep them 200, fast, and free of over-broad noindex.
4. **Watch the July 12–13 pullback.** The daily monitor now tracks AI-citation URL health in `scripts/seo-reports/monitor-ai-citations.jsonl`. Any renewed drop in citations should trigger a status check.
5. **Add DTC vehicle-code coverage.** `/vehicles/2007/ford/mustang/codes/P0108` returned 404. If vehicle-specific code pages are not yet built, route high-citation DTC queries to the generic `/codes/P0108` page and add cross-links.
6. **Revisit make-guide noindex policy.** `/guides/toyota` and `/guides/ford` are cited but carry noindex. They are valuable AI citation landing pages; consider allowing index if content is robust.

## Files Generated / Updated

- `scripts/ai-citations-audit.mjs` — maps queries to URLs, checks production status, writes gaps.
- `scripts/seo-reports/ai-citations-audit-2026-07-15.json` — full audit results.
- `scripts/seo-reports/ai-citations-gaps.json` — latest actionable gaps.
- `scripts/seo-daily-monitor.mjs` — now includes AI-citation URL health watch.
- `scripts/seo-reports/monitor-ai-citations.jsonl` — daily 200/noindex log.
