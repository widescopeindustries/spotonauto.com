# AllOEMManuals.com — Paywall & Stripe Interaction Audit

**Date range:** 2026-06-10 00:00 UTC – 2026-06-17 14:58 CEST  
**Auditor:** Kimi Code CLI  
**Data sources:** Stripe API, Cloudflare GraphQL Analytics, VPS nginx logs, Postgres credit ledger

---

## Executive Summary

The paywall is **actively intercepting bots and crawlers at scale** but has generated **zero paid conversions** in the last 7 days.

| Metric | Value |
|---|---|
| Total Cloudflare requests | **3,251,658** |
| Page views | **540,964** |
| Bandwidth | **77.97 GB** |
| `402 Payment Required` responses | **361,886** |
| `307` redirects to paid feed | **44,918** |
| `403` blocked responses | **241,410** |
| Stripe checkout sessions created | **27** |
| Stripe charges / conversions | **0** |
| API credit customers | **0** |
| API credit transactions | **0** |

**Bottom line:** The infrastructure is working as designed — bots are being told to pay, search engines can crawl HTML, and checkout sessions are being created — but no buyer has completed payment yet.

---

## 1. Stripe Activity (Last 7 Days)

### 1.1 Account Snapshot

- **Account:** Widescope Industries LLC
- **Timezone:** America/Chicago
- **Statement descriptor:** WIDESCOPE LLC
- **Payouts:** Manual, 2-day delay
- **Mode:** Live (`sk_live_...`)

### 1.2 Events

**Total events:** 18

| Timestamp (UTC) | Event Type | Object ID |
|---|---|---|
| 1781631531 | checkout.session.expired | cs_live_a13fYrFJI4D6Wz0AXXiPntASKcrLP9MEG0wxFuvP9esZrbV1Q4XVoZMT0q |
| 1781631530 | checkout.session.expired | cs_live_a11E2pq4PZNDrVu9IBNzvhg36FLTKUTKAo30FyCe6jFTcTdZU8XR7F8zfH |
| 1781631529 | checkout.session.expired | cs_live_a1O7PxHzBGM3d9AS5Psm8JkQuz23KtEQpf7LquvIupGTZnfYudq5RzTYVB |
| 1781631528 | checkout.session.expired | cs_live_a1ZIeoiI0p1M8bpYL0AetB8b7fDWfmqEknlxp3JBv1oD6JcGNbl1Fa42SP |
| 1781631500 | checkout.session.expired | cs_live_a1zCMmt262BTfUOXCzMa2z72Bq4XTU4eogmMiVvlO4cOyBq3t7q76y6JOG |
| 1781586485 | checkout.session.expired | cs_live_a1axVrX1Vt2PBaNpvf1OybF9uErFCTEn6DMn8u9fqQ7CxsR5m6Ozto5itM |
| 1781530720 | checkout.session.expired | cs_live_a1KQouqBZ8jbhd4cF8FO2bfmI1wFTF3oQY7Hc5IslMBZkv0fgZiSPwdX6P |
| 1781530486 | checkout.session.expired | cs_live_a1Gih1zLmI6btWsOLCNeP7xTBYcSCgWr7GVCjxKZHuZbG20qQ4WxAnfEoq |
| 1781494951 | checkout.session.expired | cs_live_a1h2361uaxtucuIuHIiC46u6UqCYZP9xb8VcVfl31XbPmE0zuWfxa5N0Ax |
| 1781488818 | checkout.session.expired | cs_live_a1vYCFQ4y1IijAmipm6C3rxk7U6PwHcLLyrwd3ppBeUlyFWgA605Wy4URP |
| 1781402388 | price.created | price_1Ti3KyFHOW0K7xmhinSJuO0X |
| 1781402388 | product.created | prod_UhSFBYpM6S15L5 |
| 1781402387 | price.created | price_1Ti3KxFHOW0K7xmhwnL1aTt1 |
| 1781402387 | product.created | prod_UhSF35Q0cQewxQ |
| 1781402387 | price.created | price_1Ti3KxFHOW0K7xmhNtqkiqjJ |
| 1781402387 | product.created | prod_UhSFrLrjBeUy7b |
| 1781402387 | price.created | price_1Ti3KwFHOW0K7xmhUjsnMqx9 |
| 1781402386 | product.created | prod_UhSFHpz146m5Y8 |

**Interpretation:**
- 10 expired checkout sessions — people/agents started checkout but did not pay.
- 8 product/price creation events — these are the 4 credit packs being set up in Stripe.
- **Zero `checkout.session.completed`, `charge.succeeded`, `payment_intent.succeeded`, or `invoice.paid` events.**

### 1.3 Checkout Sessions

**Total sessions created:** 27  
**Open/unpaid:** 17  
**Expired:** 10  
**Paid:** 0

| Pack | Count | Total Value if Paid |
|---|---|---|
| starter ($10) | 13 | $130 |
| growth ($50) | 4 | $200 |
| scale ($200) | 4 | $800 |
| enterprise ($1,000) | 6 | $6,000 |
| **Total** | **27** | **$7,130** |

**Sample open sessions (most recent):**

| Created (UTC) | Session ID | Pack | Amount |
|---|---|---|---|
| 1781700679 | cs_live_a1LduZMU7QylIGRPsc6CQamRUkr9aUG4f8dpbTc9cXxlrlRlrdHpTEXIAj | starter | $10.00 |
| 1781700142 | cs_live_a1lCM9MYkgCVmQfukX2VNmAMsGkPCfLaswWOF2xbwzvqIuHHgQyoTYUvDD | starter | $10.00 |
| 1781699976 | cs_live_a1AZ1T3IxmKkc4BqQvQIEldTk5ziqgtWe93FTSOsahZOlrggAoeRjOZ7VA | starter | $10.00 |
| 1781699939 | cs_live_a1lgn8hwynx7DXsmLxbbGyjxWiYotuALaV05FVoZySbvul0na1tiH9aL46 | enterprise | $1,000.00 |
| 1781699939 | cs_live_a1tsi5fVjLFtqGbqnvIZwHsYYBOfKMaUtTWtybmrI92BueXeFyXQpSU9qm | scale | $200.00 |

All sessions have `customer: null` and `payment_status: unpaid`, meaning buyers did not provide email or payment details.

### 1.4 Charges, Payment Intents, Customers

| Resource | Count |
|---|---|
| Charges | 0 |
| Payment Intents | 0 |
| Customers created | 0 |
| Refunds | 0 |
| Disputes | 0 |

### 1.5 Webhooks

**VPS nginx logs:** 3 POST requests to `/api/stripe/webhook`, all returned `200 28`.  
**Stripe events:** No webhook events in the last 7 days (the 18 events are API-level, not webhook deliveries).  
**Interpretation:** The webhook endpoint is reachable and responding, but there is no meaningful traffic because no payments have completed.

### 1.6 Postgres Credit Ledger

| Table | Rows |
|---|---|
| `api_customers` | 0 |
| `api_credit_transactions` | 0 |

No credit balances, no debit history, no API keys issued.

---

## 2. Cloudflare Edge Paywall Activity (Last 7 Days)

Cloudflare handles the bulk of bot gating **before requests reach the origin**. The Worker returns 402/403/307 at the edge.

### 2.1 Response Status Code Summary

| Status | Count | Interpretation |
|---|---|---|
| 200 | 2,276,393 | Successful HTML/API responses |
| 402 | 361,886 | Payment required (paywalled bots / unpaid API) |
| 403 | 241,410 | Blocked (malicious bots / bandwidth theft ASNs) |
| 302 | 170,685 | Redirects (likely www→apex or other) |
| 429 | 61,518 | Rate limited |
| 404 | 49,302 | Not found |
| 307 | 44,918 | Redirect paywalled bots to `/api/data/...` feed |
| 301 | 19,942 | Permanent redirects |
| 500 | 6,091 | Server errors |
| 502 | 1,789 | Bad gateway |
| 503 | 51 | Service unavailable |

### 2.2 Daily Traffic & 402 Volume

| Date | Total Requests | Page Views | 402s | Bandwidth |
|---|---|---|---|---|
| 2026-06-10 | 369,438 | 78,687 | unknown* | 10.40 GB |
| 2026-06-11 | 352,831 | 70,843 | unknown* | 9.43 GB |
| 2026-06-12 | 299,166 | 83,035 | unknown* | 11.17 GB |
| 2026-06-13 | 298,124 | 84,040 | unknown* | 12.17 GB |
| 2026-06-14 | 410,386 | 61,292 | unknown* | 10.07 GB |
| 2026-06-15 | 509,915 | 66,725 | unknown* | 9.50 GB |
| 2026-06-16 | 691,675 | 68,413 | unknown* | 10.99 GB |
| 2026-06-17 | 320,123 | 27,929 | unknown* | 4.24 GB |
| **Total** | **3,251,658** | **540,964** | **361,886** | **77.97 GB** |

*402 total is for the full 7-day window; per-day status breakdown was not queried separately.

### 2.3 Estimated Bot Activity

- **361,886 402s** ≈ **51,700 payment-required responses per day**.
- **44,918 307s** = bots redirected to the clean `/api/data/...` feed.
- **241,410 403s** = outright blocked bots (SEO scrapers, bandwidth-theft ASNs, etc.).
- Total gated/blocked interactions: **~648,000** (20% of all Cloudflare requests).

### 2.4 Origin (nginx) 402/307/403 Detail

Only a small fraction of paywall interactions reach the origin:

| Status | Origin Count | Cloudflare Count | Origin % |
|---|---|---|---|
| 402 | 112 | 361,886 | 0.03% |
| 307 | 155 | 44,918 | 0.35% |
| 403 | 47 | 241,410 | 0.02% |

This confirms the Cloudflare Worker is doing almost all the gating.

### 2.5 Top Origin 402 Paths

| Count | Path |
|---|---|
| 46 | `/api/v1` |
| 18 | `/api/data/2010/toyota/camry` |
| 5 | `/api/premium-repair-data?year=2010&make=toyota&model=camry&task=brake-pad-replacement` |
| 5 | `/api/premium-repair-data` |
| 4 | `/repair/2010/toyota/camry/brake-pad-replacement` |
| 3 | `/api/data/1983/toyota/supra/repairs/water-pump-replacement` |
| 2 | `/api/v1/repair?year=2010&make=toyota&model=camry&task=brake-pad-replacement` |
| multiple | `/api/data/*.env` probing attacks |

### 2.6 Top Origin 402 User Agents

| Count | User Agent |
|---|---|
| 42 | `Mozilla/5.0 (compatible; AgentReadinessScanner/1.0; +https://isitagentready.com)` |
| 28 | `curl/8.5.0` |
| 20 | `curl/8.7.1` |
| 6 | `Mozilla/5.0` |
| 3 | `Mozilla/5.0 (compatible; Googlebot/2.1; ...)` |
| 2 | `Googlebot/2.1` |
| 1 | `Mozilla/5.0 (compatible; Bingbot/2.1; ...)` |
| 1 | `Bingbot/2.0` |

**Note:** AgentReadinessScanner is a third-party tool that grades how "agent-ready" a site is. It is hitting the paywalled endpoints intentionally and receiving 402s, which is correct behavior.

---

## 3. What the Paywall Did (Narrative)

### 3.1 Bots Probed, Got Told to Pay

Over 648,000 bot/crawler requests were intercepted by the paywall. The majority received a `402 Payment Required` response with discovery headers pointing to:
- Stripe checkout (`/api/stripe/checkout?pack=...`)
- x402 ACP discovery (`/.well-known/acp.json`)
- AI Training Feed info (`https://alloemmanuals.com/for-ai`)

### 3.2 Some Bots Were Redirected to the Clean Feed

44,918 requests from known training crawlers (ClaudeBot, GPTBot, etc.) hitting HTML vehicle/repair pages were **307-redirected** to the corresponding `/api/data/{year}/{make}/{model}` endpoint, where they again hit the 402 paywall.

### 3.3 Malicious/Bandwidth-Theft Bots Were Blocked

241,410 requests were flatly 403'd. These include known SEO scrapers, datacenter ASNs (Alibaba, Byteplus, VNPT, DigitalOcean) spoofing browser UAs, and other disallowed crawlers.

### 3.4 Search Engines Crawled HTML Freely

Googlebot and Bingbot requests to HTML pages (`/vehicles/...`, `/repair/...`) were allowed through (200). Requests to the paid `/api/data/...` feed from search bots correctly received 402, because the feed is a paid product, not a search-indexable page.

### 3.5 Humans/Agents Started Checkout But Did Not Convert

27 checkout sessions were created, totaling $7,130 in potential revenue if all had converted. All sessions remain unpaid or expired. No payment method was entered.

---

## 4. Security & Observations

### 4.1 Probing / Attack Traffic

Several `/api/data/*.env` requests were observed in origin 402 logs:
- `/api/data/wp-config.env`
- `/api/data/site.env`
- `/api/data/settings.yml`
- `/api/data/log.env`

These are automated scanners looking for leaked environment files. They received 402 because the path matched `/api/data/...`. No actual env files were exposed.

### 4.2 No Successful Bypass Attempts

- No API keys exist in the database, so no Stripe-credit access has occurred.
- No x402 payment proofs have been submitted (no completed Stripe payments, no on-chain x402 facilitator logs available).

### 4.3 Webhook Health

The Stripe webhook endpoint is live and returned 200 for the 3 requests Stripe sent (likely test/health-check pings). No `checkout.session.completed` events fired, so the webhook handler has not processed any real purchases.

---

## 5. Recommendations

1. **Conversion funnel is the bottleneck.** 51K+ daily 402s and 27 checkout starts but 0 conversions suggests the pricing, messaging, or checkout flow is not compelling. Consider:
   - A lower-friction $1 trial pack.
   - A clearer `/for-ai` landing page with examples.
   - Email capture for abandoned checkout sessions.

2. **Track abandoned checkouts.** Stripe sessions expire after 24 hours. Set up retargeting or email for users who created a session but didn't pay.

3. **Distinguish scanner traffic from real buyers.** AgentReadinessScanner and curl probes dominate origin 402s. Cloudflare handles these fine, but origin logs are noisy.

4. **Monitor x402 separately.** This audit focused on Stripe because x402 is devnet and no on-chain activity was observed. If x402 mainnet goes live, add Solana transaction monitoring.

5. **Add conversion analytics.** Tag successful checkout completions and feed accesses in GA4/PostHog to measure real buyer behavior.

---

## 6. Data Retention Notes

- Stripe data was queried live via API and is not stored in this report beyond the summary counts.
- Cloudflare analytics are aggregate and do not include individual IP addresses or full request bodies.
- Postgres query confirmed zero rows in credit ledger tables.

---

*Report generated by Kimi Code CLI on 2026-06-17 using live Stripe, Cloudflare, VPS, and Postgres data.*
