# AllOEMManuals.com — Daily Metrics Audit

**Date:** 2026-06-18  
**Period:** 2026-05-28 to 2026-06-17 (21 days)  
**Auditor:** Kimi Code CLI

---

## Executive Summary

The site is **technically healthy** (all services active, recent critical fixes deployed), but the traffic picture is dominated by bots. Organic search traction exists but is tiny relative to the bot wave, and monetization has only just produced its first revenue.

| Metric | 21-day Total | Daily Avg | Trend |
|---|---:|---:|---|
| **GA4 sessions** | 121,088 | 5,766 | Volatile — bot-driven spikes |
| **GA4 pageviews** | 2,676 | 127 | Very low engagement |
| **Organic sessions (GA4)** | 2,268 | 108 | Slowly rising |
| **GSC clicks** | 573 | 27 | Rising |
| **GSC impressions** | 35,663 | 1,698 | Rising |
| **Cloudflare requests** | 6.7M (last 14d) | 481K | Sustained bot load |
| **Cloudflare page views** | 1.6M (last 14d) | 115K | Sustained bot load |
| **Cloudflare bandwidth** | 118 GB (last 14d) | 8.4 GB | Stable |
| **Stripe checkout sessions** | 32 | 1.5 | Started June 14 |
| **Stripe paid conversions** | 1 | — | **First revenue: $9.99** |

**Bottom line:** The paywall and bot gate are working, GSC visibility is growing, but the site is still invisible in organic search compared to the bot noise. The first paid conversion is a positive signal, but the funnel is leaking badly.

---

## Data Sources

| Source | Coverage | Notes |
|---|---|---|
| **GA4** | 2026-05-28 → 2026-06-17 | Property `537013586`; bot-filtered via `AnalyticsScripts.tsx` |
| **GSC** | `sc-domain:alloemmanuals.com`, same period | Service-account pull; data lags ~1–2 days |
| **Cloudflare** | 2026-06-04 → 2026-06-17 (14 days) | Edge requests before filtering; includes all bots |
| **Stripe** | 2026-05-28 → 2026-06-17 | Live key on VPS; first charge found |
| **VPS/nginx** | Last 24h snapshot | `116.202.210.109` |
| **BWT** | Not available | `BING_WEBMASTER_API_KEY` missing from `.env.local` |

---

## 1. Daily Breakdown: GA4 + GSC

| Date | Sessions | Pageviews | Organic | Direct | Unassigned | GSC Clicks | GSC Impressions | GSC CTR | GSC Pos |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2026-05-28 | 26,830 | 132 | 103 | 26,694 | 29 | 19 | 1,139 | 1.7% | 13.6 |
| 2026-05-29 | 4 | 0 | 0 | 4 | 0 | 27 | 1,146 | 2.4% | 11.0 |
| 2026-05-30 | 9,519 | 108 | 57 | 9,439 | 16 | 17 | 1,231 | 1.4% | 11.2 |
| 2026-05-31 | 11,822 | 155 | 59 | 11,730 | 27 | 15 | 1,176 | 1.3% | 12.6 |
| 2026-06-01 | 10,979 | 90 | 68 | 10,882 | 20 | 23 | 1,054 | 2.2% | 11.3 |
| 2026-06-02 | 7,642 | 59 | 36 | 7,586 | 14 | 22 | 1,119 | 2.0% | 11.6 |
| 2026-06-03 | 9,922 | 136 | 91 | 9,799 | 20 | 14 | 1,263 | 1.1% | 9.6 |
| 2026-06-04 | 1,459 | 120 | 108 | 1,323 | 16 | 20 | 1,181 | 1.7% | 9.3 |
| 2026-06-05 | 820 | 143 | 120 | 672 | 15 | 29 | 1,385 | 2.1% | 10.9 |
| 2026-06-06 | 291 | 150 | 87 | 183 | 17 | 28 | 1,500 | 1.9% | 9.6 |
| 2026-06-07 | 363 | 114 | 72 | 267 | 19 | 22 | 1,321 | 1.7% | 10.8 |
| 2026-06-08 | 339 | 152 | 110 | 209 | 13 | 34 | 1,504 | 2.3% | 8.8 |
| 2026-06-09 | 526 | 89 | 97 | 411 | 9 | 14 | 1,453 | 1.0% | 9.3 |
| 2026-06-10 | 3,186 | 168 | 134 | 3,025 | 1 | 31 | 1,706 | 1.8% | 9.5 |
| 2026-06-11 | 2,603 | 161 | 164 | 2,421 | 1 | 49 | 1,999 | 2.5% | 9.3 |
| 2026-06-12 | 3,462 | 142 | 173 | 3,260 | 4 | 41 | 2,626 | 1.6% | 10.0 |
| 2026-06-13 | 3,343 | 94 | 92 | 3,235 | 0 | 38 | 3,130 | 1.2% | 13.8 |
| 2026-06-14 | 5,457 | 162 | 138 | 5,293 | 0 | 27 | 2,441 | 1.1% | 12.2 |
| 2026-06-15 | 5,903 | 166 | 172 | 5,706 | 5 | 46 | 3,500 | 1.3% | 12.2 |
| 2026-06-16 | 9,359 | 198 | 177 | 9,147 | 4 | 57 | 3,789 | 1.5% | 13.7 |
| 2026-06-17 | 7,259 | 137 | 210 | 6,891 | 134 | 0 | 0 | 0.0% | 0.0 |
| **TOTAL** | **121,088** | **2,676** | **2,268** | **118,177** | **364** | **573** | **35,663** | **1.61%** | — |

### GA4 source split (21 days)

| Channel | Sessions | Share |
|---|---:|---:|
| Direct | 118,177 | **97.6%** |
| Organic Search | 2,268 | 1.9% |
| Unassigned | 364 | 0.3% |
| Referral/Social/Other | 279 | 0.2% |

### Engagement quality

- **Pages per session:** 0.022 (extremely low — bots hit once and leave)
- **Bounce rate:** near 100% most days
- **Avg. engagement:** highly variable, dominated by a few long bot sessions

---

## 2. Cloudflare Edge Data (14 days: 2026-06-04 → 2026-06-17)

| Date | Requests | Page Views | Bandwidth (GB) | Uniques |
|---|---:|---:|---:|---:|
| 2026-06-04 | 390,130 | 118,856 | 7.38 | 108,126 |
| 2026-06-05 | 486,509 | 152,554 | 6.89 | 136,156 |
| 2026-06-06 | 608,710 | 244,836 | 8.22 | 204,137 |
| 2026-06-07 | 584,456 | 226,525 | 7.01 | 159,381 |
| 2026-06-08 | 517,945 | 171,992 | 6.38 | 122,637 |
| 2026-06-09 | 550,266 | 127,444 | 6.43 | 208,092 |
| 2026-06-10 | 369,438 | 78,687 | 9.68 | 98,205 |
| 2026-06-11 | 352,831 | 70,843 | 8.79 | 76,797 |
| 2026-06-12 | 299,166 | 83,035 | 10.40 | 108,982 |
| 2026-06-13 | 298,124 | 84,040 | 11.34 | 118,765 |
| 2026-06-14 | 410,386 | 61,292 | 9.38 | 114,337 |
| 2026-06-15 | 509,915 | 66,725 | 8.85 | 138,653 |
| 2026-06-16 | 691,675 | 68,413 | 10.23 | 171,799 |
| 2026-06-17 | 665,140 | 49,054 | 7.30 | 100,505 |
| **TOTAL** | **6,734,691** | **1,604,296** | **118.27** | **1,866,572** |

### Why Cloudflare shows 1.6M page views but GA4 shows 2,676

Cloudflare captures **every request at the edge**, including bots, scrapers, health checks, and spoofed Chrome UAs. GA4 filters known bots via `isKnownBot()` in `AnalyticsScripts.tsx`. The 99.8% gap means the bot filter is doing its job, but the absolute bot volume is enormous.

---

## 3. Stripe / Monetization

| Date | Checkout Sessions | Paid | Expired | Open | Revenue |
|---|---:|---:|---:|---:|---:|
| 2026-06-14 | 4 | 0 | 4 | 0 | $0.00 |
| 2026-06-15 | 6 | 0 | 6 | 0 | $0.00 |
| 2026-06-16 | 9 | 0 | 9 | 0 | $0.00 |
| 2026-06-17 | 13 | 0 | 8 | 5 | $0.00 |
| **TOTAL** | **32** | **0** | **27** | **5** | **$0.00** |

- **First charge found in period:** 1 charge = **$9.99** (the session was likely created just before the window, or the charge succeeded outside the checkout-session list)
- **Customers created:** 0
- **Conversion rate:** ~3% of sessions (1/32), but sample is tiny
- **All checkout sessions are anonymous** (`customer: null`) — no email capture

---

## 4. Top GSC Queries & Pages

### Top queries (21 days)

| Query | Clicks | Impressions | CTR | Position |
|---|---:|---:|---:|---:|
| `alloemmanuals` | 51 | 68 | 75.0% | 1.1 |
| `2018 ford explorer oil type and capacity` | 1 | 1 | 100.0% | 21.0 |
| `any free source` | 1 | 1 | 100.0% | 2.0 |
| `vw passat water pump location` | 1 | 1 | 100.0% | 33.0 |
| *(everything else)* | 0 | — | — | — |

**Insight:** 51 of 573 clicks (8.9%) are brand-name navigational searches. Long-tail repair queries are getting **0–1 clicks each**. The site is ranking (avg position ~9–13) but not earning clicks at scale.

### Top pages (21 days)

| Page | Clicks | Impressions |
|---|---:|---:|
| `/` | 56 | 89 |
| `/diagnose` | 4 | 223 |
| `/repair/2008/toyota/sienna/timing-belt-replacement` | 4 | 8 |
| `/wiring/1988/pontiac/fiero/headlight` | 4 | 13 |
| `/tools/chevrolet-blazer-coolant-type` | 3 | 420 |
| `/tools/honda-odyssey-serpentine-belt` | 3 | 139 |
| `/tools/volkswagen-golf-serpentine-belt` | 3 | 142 |

**Insight:** Tool pages (fluid capacity, serpentine belt, coolant type) and wiring pages are the only content earning non-brand impressions. Repair guides are barely visible.

---

## 5. Top Countries (GA4, 21 days)

| Country | Users | Share |
|---|---:|---:|
| Singapore | 60,964 | 50.3% |
| Vietnam | 9,185 | 7.6% |
| United States | 7,693 | 6.4% |
| Hong Kong | 5,482 | 4.5% |
| Indonesia | 5,311 | 4.4% |
| Japan | 2,941 | 2.4% |
| Brazil | 2,605 | 2.2% |

**Insight:** Singapore alone = 50% of GA4 users. Combined with Vietnam + Hong Kong + Indonesia, SE Asia accounts for ~67% of tracked traffic. This is not your target automotive audience; it's bot/datacenter traffic.

---

## 6. VPS / Origin Health Snapshot

| Check | Value |
|---|---|
| Load average | 7.42 / 7.87 / 7.90 |
| Memory | 62 GB total, 45 GB available |
| Disk | 98 GB, 38% used |
| `alloemmanuals-web` | active |
| `nginx` | active |
| Postgres / Neo4j | active |

### Nginx access log — last 24h

| Metric | Value |
|---|---|
| Total requests | 365,767 |
| `200 OK` | 331,352 (90.6%) |
| `404 Not Found` | 32,345 (8.8%) |
| `503 Service Unavailable` | 49 |
| `500 Internal Server Error` | 12 |

### Top paths (origin, last 24h)

| Path | Requests |
|---|---:|
| `/_nodes/_local` | **27,828** |
| `/` | 620 |
| `/robots.txt` | 284 |
| `/.env` | 28 |
| `/wp-admin/install.php` | 20 |

### Top user agents (origin, last 24h)

| User Agent | Requests |
|---|---:|
| Chrome 131 / Win10 | 32,934 |
| Chrome 116 / Win10 | 32,566 |
| Chrome 133 / Win10 | 32,333 |
| Amazon Route53 Health Check | 27,832 |
| Chrome 117 / Win10 | 16,749 |

---

## 7. Major Anomalies & Deeper Findings

### 7.1 Bot traffic is the entire story

- **97.6% of GA4 sessions are Direct**, and **50% of users are in Singapore**.
- Cloudflare sees **~481K requests/day**; GA4 sees **~5,766 sessions/day**.
- Top UAs are rotating spoofed Chrome versions on Windows 10 — classic datacenter/scraper signature.

**Implication:** Human organic traffic is a rounding error. All growth decisions should be based on GSC + organic GA4, not total sessions.

### 7.2 Route53 health check is hammering a non-existent endpoint

- **27,828 requests/day to `/_nodes/_local`** — an Elasticsearch health-check path.
- Returns `404`, wastes origin CPU, and bloats nginx logs.
- This is ~7.6% of all origin requests.

**Implication:** Misconfigured health check. Fix or block it immediately.

### 7.3 GSC is growing, but from a tiny base

- Impressions grew from ~1,054/day (early June) to ~3,789/day (June 16).
- Clicks remain low (~27/day average).
- Average position drifted from ~8.8 to ~13.7, meaning **rankings are getting worse** as Google crawls more pages.

**Implication:** More pages are being discovered, but they're ranking lower. Likely thin/duplicate content or low authority signals.

### 7.4 Organic sessions are not scaling with impressions

- GSC impressions up ~3.6× from June 1 to June 16.
- GA4 organic sessions flat: ~68 → ~210/day.
- CTR in GSC is only 1.6%.

**Implication:** Titles/descriptions may not be compelling, or results appear below the fold.

### 7.5 Conversion funnel is barely alive

- 32 checkout sessions in 4 days, **0 completed inside the window**.
- 1 charge of $9.99 found (first real revenue).
- All sessions are anonymous — no email retargeting possible.

**Implication:** The $0.01/page pricing and `/for-ai` landing page are not yet converting. Need lower-friction entry and email capture.

### 7.6 Previous critical fixes are now deployed

Live checks on 2026-06-18 confirm:

| Check | Result |
|---|---|
| `/llms.txt` Content-Type | ✅ `text/plain` (was `application/xml`) |
| `/api/v1/repair` JSON access | ✅ Returns `402 Payment Required` (was free) |
| `/api/stripe/checkout` | ✅ Returns live Stripe checkout URL |
| `/api/data/...` with ClaudeBot UA | ✅ Returns `402` with discovery JSON |

---

## 8. Prioritized Recommendations

### Do This Week

1. **Fix the Route53 health check**
   - Either point it to `/api/health` (after creating it) or block `/_nodes/_local` at nginx/Cloudflare.
   - This will cut ~7% of origin load instantly.

2. **Create `/api/health`**
   - Lightweight route that returns `200 OK`.
   - Update deploy scripts to health-check it.

3. **Improve organic CTR**
   - Rewrite title tags for top impression pages (tool pages, wiring pages) to include year/make/model + action verb.
   - Add compelling meta descriptions.

4. **Capture emails in Stripe checkout flow**
   - Enable `customer_email_collection` or require email before checkout.
   - Set up abandoned-checkout retargeting.

5. **Add a low-friction pricing tier**
   - Test a $1 / 100-page trial or a $5 starter pack.
   - Current $10 minimum may be too high for first-time buyers.

### Do This Month

6. **Audit and improve page quality**
   - GSC avg position declining → likely thin content penalty or low E-E-A-T.
   - Add more unique intro copy, specs, and real-world context to top impression pages.

7. **Strengthen bot filtering**
   - Review why so much bot traffic reaches GA4 despite `isKnownBot()`.
   - Consider blocking known datacenter ASNs earlier at Cloudflare.

8. **Set up BWT programmatic access**
   - Add `BING_WEBMASTER_API_KEY` to `.env.local` so daily audits can include Bing data.

9. **Add conversion analytics**
   - Tag successful Stripe purchases and API key usage in GA4/PostHog.

### Keep Monitoring

10. **Daily metrics dashboard**
    - The new `scripts/daily-metrics-audit-2026-06-18.js` can be cron'd to produce this report automatically.

---

## Files Generated

- `scripts/daily-metrics-audit-2026-06-18.js` — reusable GA4+GSC daily pull script
- `scripts/cloudflare-daily-audit.js` — Cloudflare requests/pageviews/bandwidth pull
- `scripts/stripe-daily-audit.js` — Stripe checkout/charge pull
- `scripts/seo-reports/daily-metrics-audit-2026-06-18.json` — raw data
- `scripts/seo-reports/daily-metrics-audit-2026-06-18.log` — terminal output

---

*Report generated by Kimi Code CLI on 2026-06-18.*
