/**
 * Cloudflare Worker — Bot Gate for alloemmanuals.com
 * Route: alloemmanuals.com/*
 *
 * Policy (zero-free for non-referral bots):
 * - ALLOW: Search engines + citation bots that send human traffic.
 * - BLOCK (403): Known malicious scrapers / SEO tools.
 * - PAYWALL (402): EVERYTHING else automated. No free previews. No grace period.
 *   Vehicle pages redirect to the clean /api/data/ training feed so bots buy structured
 *   markdown instead of scraping noisy HTML.
 * - HUMANS: Pass through.
 */

/* ─────────────── Lists ─────────────── */

const ALLOW_LIST = [
  'Googlebot','Bingbot','Googlebot-Mobile','Googlebot-Image','Googlebot-Video',
  'Googlebot-News','AdsBot-Google','Mediapartners-Google','BingPreview','MicrosoftPreview',
  'DuckDuckBot','DuckAssistBot','ChatGPT-User',
  // Affiliate / ad verification crawlers (must access site to approve programs)
  'Impact.com Agent','Impact','Rakuten','CJ Affiliate','Commission Junction',
  'ShareASale','Awin','Partnerize','Skimlinks','VigLink','Sovrn',
];

const MALICIOUS_BOTS = [
  'AhrefsBot','SemrushBot','DotBot','MJ12bot','DataForSeoBot',
  'webzio','webzio-extended','Screaming Frog','Sitebulb','Turnitin','Copyscape',
  'CCBot','Bytespider','YouBot','Diffbot',
  'Sogou','Baiduspider','YandexBot','YandexRenderResources',
];

const PAYWALL_LIST = [
  // OpenAI
  'GPTBot','OAI-SearchBot',
  // Anthropic
  'ClaudeBot','Claude-Web','anthropic','Claude-SearchBot',
  // Perplexity
  'PerplexityBot','Perplexity-User',
  // Big tech AI crawlers
  'Amazonbot','Applebot','Meta-ExternalAgent','Meta-ExternalFetcher',
  'Meta-WebIndexer','FacebookBot',
  // Social / video platforms
  'TikTok Spider','TikTokSpider','Snapbot',
  // Additional AI / data aggregators
  'Google-Extended','GoogleOther','GoogleOther-Image','GoogleOther-Video',
  'CommonCrawl','CCBot','Cohere','Crawlspace','Brightbot','KangarooBot',
  'ImagesiftBot','OmniBot','PanguBot','PetalBot','VelenPublicWebCrawler',
  'iaskspider','ICC-Crawler','GingerCrawler','Linguee Bot',
  'Magellan','Sidetrade','Simpple','SiteAuditBot','Timpibot','Yetibot',
  'Zyte','Scrapy','AlexaWebSearch',
  // LLM platform crawlers
  'LLM-User','AI2Bot','OAI-SearchBot-Log','OAI-SearchBot-Preview','OAI-SearchBot-User',
];

// Rate-limit buckets for 429 hammer protection (still 402 floor)
const RATE_LIMIT_BOTS = {
  'meta-externalagent': 5,
  'facebookbot': 5,
  'claude-searchbot': 5,
  'claudebot': 5,
  'gptbot': 5,
  'oai-searchbot': 5,
  'perplexitybot': 5,
  'amazonbot': 5,
  'applebot': 5,
  'google-extended': 5,
  'googleother': 5,
};

// ASNs observed pulling large volumes of HTML with spoofed browser UAs.
// Search-engine UAs from these ASNs are still allowed via ALLOW_LIST.
const BANDWIDTH_THEFT_ASNS = {
  45102: 'Alibaba (US) Technology Co., Ltd.',
  150436: 'Byteplus Pte. Ltd.',
  45899: 'VNPT Corp',
  14061: 'DigitalOcean, LLC',
  // 8075 Microsoft left out intentionally — Bing crawlers use it.
};

/* ─────────────── Helpers ─────────────── */

function normalizeUA(request) {
  return (request.headers.get('User-Agent') || '').toLowerCase().trim();
}

function isAllowedBot(ua) {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  for (const a of ALLOW_LIST) {
    if (lower.includes(a.toLowerCase())) return true;
  }
  return false;
}

function isMaliciousBot(ua) {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  for (const b of MALICIOUS_BOTS) {
    if (lower.includes(b.toLowerCase())) return true;
  }
  return false;
}

function isPaywalledBot(ua) {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  for (const p of PAYWALL_LIST) {
    if (lower.includes(p.toLowerCase())) return true;
  }
  return false;
}

function isGenericBot(ua) {
  if (!ua) return false; // empty UA alone is not reliable bot evidence
  if (/bot|crawl|spider|scraper/i.test(ua)) {
    const browserSig = /chrome|safari|firefox|edge/i.test(ua);
    if (!browserSig) return true;
  }
  return false;
}

function getRateLimitKey(ua) {
  if (!ua) return null;
  for (const [bot, limit] of Object.entries(RATE_LIMIT_BOTS)) {
    if (ua.includes(bot)) return { bot, limit };
  }
  return null;
}

async function checkRateLimit(request, limit) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / 60) * 60;
  const cacheKey = `https://ratelimit.alloemmanuals.com/${ip}/${windowStart}`;
  const cache = caches.default;

  const cached = await cache.match(new Request(cacheKey));
  let count = 0;
  if (cached) {
    count = parseInt(await cached.text()) || 0;
  }

  count++;
  if (count > limit) return false;

  await cache.put(new Request(cacheKey), new Response(count.toString(), {
    headers: { 'Cache-Control': 'max-age=60' },
  }));
  return true;
}

function toApiDataUrl(url) {
  const path = url.pathname;

  // /vehicles/{year}/{make}/{model}[/codes/{code}]
  const vehiclesMatch = path.match(/^\/vehicles\/(\d{4})\/([^/]+)\/([^/]+)(?:\/codes\/[^/]+)?$/);
  if (vehiclesMatch) {
    const [, year, make, model] = vehiclesMatch;
    return `/api/data/${year}/${make}/${model}`;
  }

  // /repair/{year}/{make}/{model}/{task}
  const repairMatch = path.match(/^\/repair\/(\d{4})\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (repairMatch) {
    const [, year, make, model, task] = repairMatch;
    return `/api/data/${year}/${make}/${model}/repairs/${task}`;
  }

  // /maintenance/{year}/{make}/{model}/{specType}
  const maintenanceMatch = path.match(/^\/maintenance\/(\d{4})\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (maintenanceMatch) {
    const [, year, make, model] = maintenanceMatch;
    return `/api/data/${year}/${make}/${model}/specs`;
  }

  return null;
}

function build402Markdown(url) {
  const apiEquivalent = toApiDataUrl(url);
  const apiPath = apiEquivalent || '/api/data/{year}/{make}/{model}';
  return `# Payment Required — AI Training Feed

We repackage our factory manual corpus two ways. For automated training crawlers, both are paid products.

## Option 1: Human Site (HTML)

HTML, navigation, affiliate links for parts and tools on every page. Built for humans. For AI crawlers, this costs $0.01/page and you will be parsing HTML, stripping nav, and filtering affiliate noise.

## Option 2: AI Training Feed (Clean Markdown)

The same underlying data, repackaged specifically for AI consumption — cheaper to ingest and cleaner to train on:

- **Clean markdown** — no HTML parsing required
- **Zero affiliate links** — no noise in your training data
- **No ads, no nav, no site chrome** — content only
- **Structured sections** — hierarchical markdown with clear headings
- **300,000+ vehicles** (1960–2025)
- **OEM excerpts, torque specs, DTC codes, wiring diagrams, diagnostic flowcharts, repair procedures**
- **Knowledge graphs** linking components, codes, and procedures

## Pricing
- **Standard:** $0.01 USDC per page
- **Volume (100K+ pages/month):** $0.005 per page
- **Enterprise (1M+ pages/month):** $0.001 per page

## How to Pay

### Option A: Stripe (Real Money, Immediate)
1. Visit https://alloemmanuals.com/for-ai for details and sample data
2. Buy credits at https://alloemmanuals.com/api/stripe/checkout?pack=starter
3. Complete checkout
4. Your API key will be shown after payment
5. Include your key: Authorization: Bearer <api_key>

### Option B: x402 (Agent-Native, Solana Devnet)
1. Visit https://alloemmanuals.com/.well-known/acp.json for payment discovery
2. Use x402 exact scheme on Solana devnet
3. Include payment token in Authorization header

## Recommended Endpoint
- \`${apiPath}\`

*Search engines and citation bots that send referral traffic are exempt. Citation required. No resale. Enterprise licensing available.*
`;
}

function build402Response(url, preferMarkdown = false) {
  const isApi = url?.pathname?.startsWith('/api/');
  const apiEquivalent = toApiDataUrl(url);
  const premiumApi = apiEquivalent
    ? `https://alloemmanuals.com${apiEquivalent}`
    : 'https://alloemmanuals.com/api/premium-repair-data';

  if (preferMarkdown || apiEquivalent) {
    return new Response(build402Markdown(url), {
      status: 402,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'X-Payment-Required': 'stripe,x402',
        'Accept-Payment': 'stripe,x402',
        'Link': `<https://alloemmanuals.com/.well-known/acp.json>; rel="payment", <${premiumApi}>; rel="premium-api"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  const body = {
    error: 'Payment Required',
    message: 'Automated access to this content requires payment. Search engines and citation bots that send referral traffic are exempt. Visit https://alloemmanuals.com/.well-known/acp.json for payment options.',
    policy: 'ai-train=licensed, search=yes, ai-input=licensed',
    payment_discovery: 'https://alloemmanuals.com/.well-known/acp.json',
    premium_api: premiumApi,
    payment_options: [
      {
        protocol: 'x402',
        scheme: 'exact',
        price: '$0.01',
        asset: 'USDC',
        network: 'solana-devnet',
        per: 'page',
        volume_discounts: {
          '100000': '$0.005',
          '1000000': '$0.001',
        },
      },
      {
        protocol: 'stripe',
        model: 'credits',
        price: '$0.01',
        per: 'page',
        info_url: 'https://alloemmanuals.com/for-ai',
        checkout_url: 'https://alloemmanuals.com/api/stripe/checkout',
        account_url: 'https://alloemmanuals.com/api/account',
      },
    ],
    preview: {
      title: 'AllOEMManuals — Factory Repair Data for 300K+ Vehicles',
      description: 'OEM technical data covering 300,000+ vehicles (1960–2025). Torque specs, fluid capacities, wiring diagrams, DTC codes, diagnostic flowcharts, and step-by-step repair procedures.',
      coverage: '300,000+ vehicles across CHARM (1982–2014) and LEMON (1960s–2025) corpuses.',
      formats: ['text/markdown'],
      sample_endpoints: [
        '/api/data/2010/toyota/camry',
        '/api/data/2010/toyota/camry/repairs/oil-change',
        '/api/data/2010/toyota/camry/dtc',
        '/api/data/2010/toyota/camry/specs',
      ],
    },
  };
  return new Response(JSON.stringify(body), {
    status: 402,
    headers: {
      'Content-Type': 'application/json',
      'X-Payment-Required': 'stripe,x402',
      'Accept-Payment': 'stripe,x402',
      'Link': `<https://alloemmanuals.com/.well-known/acp.json>; rel="payment", <${premiumApi}>; rel="premium-api"`,
      'Cache-Control': 'no-store',
    },
  });
}

function build429Response() {
  const body = {
    error: 'Too Many Requests',
    message: 'Crawl rate exceeded. Reduce frequency or visit https://alloemmanuals.com/.well-known/acp.json for payment options.',
  };
  return new Response(JSON.stringify(body), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': '60',
      'Cache-Control': 'no-store',
    },
  });
}

function build403Response() {
  return new Response('Forbidden', {
    status: 403,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function isBandwidthTheftAsn(request) {
  const asn = request.cf?.asn;
  if (!asn) return false;
  return BANDWIDTH_THEFT_ASNS.hasOwnProperty(asn);
}

/* ─────────────── Main ─────────────── */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ── 1. Static assets & discovery endpoints pass through (no bot gate) ──
    if (
      url.pathname.startsWith('/_next/') ||
      url.pathname.startsWith('/static/') ||
      url.pathname === '/favicon.ico' ||
      url.pathname === '/robots.txt' ||
      url.pathname === '/llms.txt' ||
      url.pathname === '/openapi.json' ||
      url.pathname === '/auth.md' ||
      url.pathname.startsWith('/for-ai') ||
      url.pathname.includes('sitemap') ||
      url.pathname.startsWith('/.well-known/')
    ) {
      return fetch(request);
    }

    const ua = normalizeUA(request);
    const acceptHeader = request.headers.get('Accept') || '';

    // ── 2. Allowed bots (search + citation) pass through ──
    if (isAllowedBot(ua)) {
      return fetch(request);
    }

    // ── 3. Known bandwidth-theft ASNs → 403 ──
    // These data centers pull GBs/day of HTML with spoofed browser UAs.
    // Allowed-bot UAs are already handled above, so real search crawlers are safe.
    if (isBandwidthTheftAsn(request)) {
      return build403Response();
    }

    // ── 4. Malicious / SEO scrapers → 403 ──
    if (isMaliciousBot(ua)) {
      return build403Response();
    }

    // ── 4. Known AI / data crawlers → redirect to clean feed or 402 ──
    if (isPaywalledBot(ua)) {
      // Still rate-limit for 429 hammer protection, but floor is 402
      const rl = getRateLimitKey(ua);
      if (rl) {
        const allowed = await checkRateLimit(request, rl.limit);
        if (!allowed) return build429Response();
      }

      // If they hit a vehicle page, redirect them to the clean paid feed
      const apiDataUrl = toApiDataUrl(url);
      if (apiDataUrl) {
        return new Response(null, {
          status: 307,
          headers: {
            'Location': `https://alloemmanuals.com${apiDataUrl}`,
            'X-Robots-Tag': 'noindex, nofollow, noarchive',
            'Cache-Control': 'no-store',
            'X-Bot-Policy': 'paywalled-training-crawler-redirect-to-feed',
          },
        });
      }

      const acceptHeader = request.headers.get('Accept') || '';
      return build402Response(url, acceptHeader.includes('text/markdown'));
    }

    // ── 5. Markdown negotiation — ONLY for non-bots ──
    // Bots must not bypass gating via Accept: text/markdown
    if (acceptHeader.includes('text/markdown')) {
      if (isGenericBot(ua)) {
        // Any bot-shaped thing asking for markdown = 402
        return build402Response(url);
      }
      // Genuine agent/human requesting markdown — pass with cache bypass
      const modifiedRequest = new Request(request, {
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          'Cache-Control': 'no-store',
          'CF-Cache-Status': 'BYPASS',
        },
      });
      return fetch(modifiedRequest, { cf: { cacheTtl: 0 } });
    }

    // ── 6. Cloudflare Bot Management (if available on plan) ──
    const botScore = request.cf?.botManagement?.score;
    if (botScore !== undefined && botScore < 30) {
      return build402Response(url);
    }
    const threatScore = request.cf?.threatScore;
    if (threatScore !== undefined && threatScore > 10) {
      return build402Response(url);
    }

    // ── 7. Generic bot catch-all → 402 (not 403) ──
    // Unknown automated traffic gets paywalled, not blocked,
    // because it might be a legitimate crawler willing to pay.
    if (isGenericBot(ua)) {
      const apiDataUrl = toApiDataUrl(url);
      if (apiDataUrl) {
        return new Response(null, {
          status: 307,
          headers: {
            'Location': `https://alloemmanuals.com${apiDataUrl}`,
            'X-Robots-Tag': 'noindex, nofollow, noarchive',
            'Cache-Control': 'no-store',
            'X-Bot-Policy': 'paywalled-bot-redirect-to-feed',
          },
        });
      }
      const acceptHeader = request.headers.get('Accept') || '';
      return build402Response(url, acceptHeader.includes('text/markdown'));
    }

    // ── 8. Everything else = human / allowed ──
    return fetch(request);
  },
};
