# alloemmanuals.com Daily Metrics — 2026-06-25

- Generated: 2026-06-25T14:05:28.992Z
- Source: Local repo (SSH to VPS)

## Profit Proxy

**Score: -21,493**

Formula: Revenue×10 + GSC clicks×50 + organic sessions×5 + cacheRatio×30000 − 404s×0.5 − 5xx×50 − bot 200s×0.2

## Traffic (nginx)

| Metric | Value |
|--------|-------|
| Total requests | 425,768 |
| Unique IPs | 13,439 |
| Bandwidth | 10.33 GB |
| 200 OK | 386,896 (90.9%) |
| 404 Not Found | 4,213 (0.99%) |
| 444 Dropped | 30,281 |
| 5xx Errors | 406 |
| Bot hits | 650 |
| Search-bot hits | 11,529 |
| Bot 200s | 571 (17.73 MB) |
| Paywall 402s | 0 |

### Top 404 paths

| Count | Path |
|-------|------|
| 15 | / |
| 10 | /api/v1/courses?per_page=2 |
| 7 | /ipfs/bafkreicyqcbhpicbos7ev4mrxofwqx6hvvge7pahpta6xuspr44crai5by |
| 5 | /robots.txt |
| 5 | /classwithtostring.php |
| 5 | /apple-touch-icon-precomposed.png |
| 5 | /admin.php |
| 4 | /officialsite |
| 4 | /ioxi-o.php |
| 4 | /Alvin9999/https/fanfan1.net/daohang |

## Cloudflare Edge

| Metric | Value |
|--------|-------|
| Requests | 457,390 |
| Page views | 48,597 |
| Bandwidth | 11.99 GB |
| Cache ratio | 2.8% |
| Threats | 0 |
| Uniques | 182,888 |

## GA4

| Metric | Value |
|--------|-------|
| Sessions | 7,332 |
| Active users | 7,196 |
| New users | 7,205 |
| Page views | 26 |
| Organic sessions | 39 |
| Avg duration | 2s |
| Bounce rate | 100.0% |

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
| Repair profiles | 25,789 |
| Nginx cache | 504.89 MB |
| Disk used | 33.38 GB / 97.81 GB |
| SSL expiry | 2026-08-18 |
| Next.js service | active |

## Lagging Metrics

- **[HIGH] 5xx errors**: 406 (target 0)
  - Search engines and users hit broken pages
- **[HIGH] 404 rate**: 0.99% (target < 0.5%)
  - Wasted crawl budget + origin load on broken/non-existent URLs
- **[MEDIUM] Cloudflare cache ratio**: 2.8% (target > 30%)
  - Too many requests hit origin; cache rules or TTL can be tuned
