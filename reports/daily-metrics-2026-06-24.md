# alloemmanuals.com Daily Metrics — 2026-06-24

- Generated: 2026-06-25T13:51:03.475Z
- Source: Local repo (SSH to VPS)

## Profit Proxy

**Score: -1,570**

Formula: Revenue×10 + GSC clicks×50 + organic sessions×5 + cacheRatio×30000 − 404s×0.5 − 5xx×50 − bot 200s×0.2

## Traffic (nginx)

| Metric | Value |
|--------|-------|
| Total requests | 325,432 |
| Unique IPs | 6,046 |
| Bandwidth | 8.59 GB |
| 200 OK | 269,400 (82.8%) |
| 404 Not Found | 6,631 (2.04%) |
| 444 Dropped | 45,131 |
| 5xx Errors | 12 |
| Bot hits | 939 |
| Search-bot hits | 16,614 |
| Bot 200s | 832 (25.69 MB) |
| Paywall 402s | 0 |

### Top 404 paths

| Count | Path |
|-------|------|
| 9 | /apple-touch-icon-precomposed.png |
| 8 | /ipfs/bafkreicyqcbhpicbos7ev4mrxofwqx6hvvge7pahpta6xuspr44crai5by |
| 8 | /.env |
| 7 | /tools/honda-crv-coolant-type |
| 6 | /wp-json/gravitysmtp/v1/tests/mock-data?page=gravitysmtp-settings |
| 6 | /.well-known/assetlinks.json |
| 5 | /vehicles/2010/cadillac/sts-rwd-v8-4.6l/codes/b0012 |
| 5 | /core/.env |
| 5 | /backend/.env |
| 5 | /app/.env |

## Cloudflare Edge

| Metric | Value |
|--------|-------|
| Requests | 422,695 |
| Page views | 57,881 |
| Bandwidth | 10.71 GB |
| Cache ratio | 4.3% |
| Threats | 0 |
| Uniques | 124,078 |

## GA4

| Metric | Value |
|--------|-------|
| Sessions | 5,253 |
| Active users | 5,302 |
| New users | 5,305 |
| Page views | 152 |
| Organic sessions | 246 |
| Avg duration | 8s |
| Bounce rate | 96.6% |

## GSC

| Metric | Value |
|--------|-------|
| Impressions | 0 |
| Clicks | 0 |
| CTR | 0.00% |
| Avg position | 0.0 |

## Revenue

| Metric | Value |
|--------|-------|
| API customers | 0 |
| Transactions | 0 |
| Total revenue | $0.00 |
| Today revenue | $0.00 |

## Infrastructure

| Metric | Value |
|--------|-------|
| DB size | 10 GB |
| Manual embeddings | 1,835,283 |
| Repair profiles | 25,779 |
| Nginx cache | 286.94 MB |
| Disk used | 33.16 GB / 97.81 GB |
| SSL expiry | 2026-08-18 |
| Next.js service | active |

## Lagging Metrics

- **[HIGH] 5xx errors**: 12 (target 0)
  - Search engines and users hit broken pages
- **[HIGH] 404 rate**: 2.04% (target < 0.5%)
  - Wasted crawl budget + origin load on broken/non-existent URLs
- **[MEDIUM] Cloudflare cache ratio**: 4.3% (target > 30%)
  - Too many requests hit origin; cache rules or TTL can be tuned
