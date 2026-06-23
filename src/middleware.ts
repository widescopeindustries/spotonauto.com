import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CANONICAL_HOST, isCanonicalHost, isIndexableHost, isLegacyRedirectHost, isPreviewHost, normalizeHost } from '@/lib/host';
import { x402Proxy } from '@/lib/x402';
import { extractBearerToken, isStripeApiKeyFormat } from '@/lib/apiKey';

const ALLOWED_ORIGINS = [
  'https://alloemmanuals.com',
  'https://www.alloemmanuals.com',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
];

function applyCrawlerHeaders(response: NextResponse, shouldNoindexHost: boolean, isRobots: boolean, isLlmsTxt: boolean) {
  response.headers.set('Vary', 'Accept-Encoding, User-Agent');
  if (isRobots || isLlmsTxt) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Content-Type', 'text/plain; charset=utf-8');
  } else {
    response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    response.headers.set('Content-Type', 'application/xml; charset=utf-8');
  }
  if (shouldNoindexHost) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  return response;
}

/**
 * Unified edge middleware — handles host normalization, legacy redirects,
 * crawler headers, CORS gating, and comma-containing URL cleanup.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = normalizeHost(request.headers.get('x-forwarded-host') || request.headers.get('host'));
  const shouldNoindexHost = !isCanonicalHost(host) && isPreviewHost(host);
  const isRootOrNestedSitemap = pathname === '/sitemap.xml' || pathname.endsWith('/sitemap.xml');
  const isNestedSitemapChunk = pathname.includes('/sitemap/') && pathname.endsWith('.xml');
  const isRobots = pathname === '/robots.txt';
  const isLlmstxt = pathname === '/llms.txt';
  const isCrawlerEndpoint = isRootOrNestedSitemap || isNestedSitemapChunk || isRobots || isLlmstxt;
  const isLocal =
    host.includes('localhost') ||
    host.includes('127.0.0.1') ||
    process.env.NODE_ENV === 'development';

  // 1. Legacy host redirect
  if (isLegacyRedirectHost(host)) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  // 2. Robots.txt on non-indexable hosts
  if (pathname === '/robots.txt' && !isIndexableHost(host)) {
    return new NextResponse('User-agent: *\nDisallow: /\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
      },
    });
  }

  // 3. Crawler endpoints - force plain cache/Vary semantics
  if (isCrawlerEndpoint) {
    return applyCrawlerHeaders(NextResponse.next(), shouldNoindexHost, isRobots, isLlmstxt);
  }

  // 4. Markdown negotiation for AI agents
  const acceptHeader = request.headers.get('accept') || '';
  const wantsMarkdown = acceptHeader.includes('text/markdown');
  if (wantsMarkdown && pathname === '/') {
    const markdown = `# AllOEMManuals — Factory Repair Data for 300K+ Vehicles

**AllOEMManuals** is the single answer for every automotive repair question.
We provide factory service manual data for 300,000+ vehicles covering
torque specs, fluid capacities, wiring diagrams, DTC codes, diagnostic
flowcharts, and repair procedures.

## Quick Links

- **Vehicle Hub**: \`/vehicles/{year}/{make}/{model}\`
- **Repair Guide**: \`/repair/{year}/{make}/{model}/{task}\`
- **DTC Lookup**: \`/api/graph/dtc/{code}\`
- **API Catalog**: \`/.well-known/api-catalog\`
- **MCP Server**: \`/.well-known/mcp/server-card.json\`
- **Agent Skills**: \`/.well-known/agent-skills/index.json\`

## Agent Discovery

- **API Catalog** (RFC 9727): \`/.well-known/api-catalog\`
- **MCP Server Card**: \`/.well-known/mcp/server-card.json\`
- **Agent Skills**: \`/.well-known/agent-skills/index.json\`
- **ACP Discovery**: \`/.well-known/acp.json\`
- **UCP Profile**: \`/.well-known/ucp\`
- **Auth.md**: \`/auth.md\`

## Payment

Premium data available via **x402** on Solana devnet (mainnet-ready).
Endpoint: \`/api/premium-repair-data\`
Price: $0.01 USDC per request.
`;
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Vary': 'Accept',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  // 5. Rewrite repair requests from JSON requests to the API
  const repairMatch = pathname.match(/^\/repair\/(\d{4})\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (repairMatch) {
    const [, rYear, rMake, rModel, rTask] = repairMatch;
    const wantsJson = request.headers.get('accept')?.toLowerCase().includes('application/json');

    if (wantsJson) {
      // Rewrite to the internal Next.js origin to avoid proxying through the
      // public HTTPS host (which causes TLS/SNI errors when Next.js tries to
      // fetch itself via localhost with the alloemmanuals.com certificate).
      const apiUrl = new URL('http://127.0.0.1:3002/api/v1/repair');
      apiUrl.searchParams.set('year', rYear);
      apiUrl.searchParams.set('make', rMake);
      apiUrl.searchParams.set('model', rModel);
      apiUrl.searchParams.set('task', rTask);

      console.log(`[Middleware] Rewriting ${pathname} to ${apiUrl.pathname}${apiUrl.search} for JSON request`);

      const rewriteResponse = NextResponse.rewrite(apiUrl);
      rewriteResponse.headers.set('Vary', 'Accept');
      rewriteResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      return rewriteResponse;
    }
  }

  // 6. Payment gating for premium API routes (must run before CORS)
  const isX402Gated =
    pathname === '/api/premium-repair-data' ||
    pathname.startsWith('/api/data/') ||
    pathname === '/api/v1/repair';

  // Stripe-format API keys bypass x402 entirely; the route handler validates the key and deducts credit.
  if (isX402Gated && isStripeApiKeyFormat(extractBearerToken(request))) {
    return NextResponse.next();
  }

  if (x402Proxy && isX402Gated) {
    // Use .then() to avoid TypeScript strict-mode issues with async middleware
    return x402Proxy(request).then((x402Response) => {
      // Enrich bare 402 responses from x402 middleware with payment discovery
      if (x402Response.status === 402) {
        const isDataFeed = pathname.startsWith('/api/data/');
        const body = {
          error: 'Payment Required',
          message: 'Automated access to this content requires payment. Visit https://alloemmanuals.com/.well-known/acp.json for payment options.',
          policy: 'ai-train=licensed, search=yes, ai-input=licensed',
          payment_discovery: 'https://alloemmanuals.com/.well-known/acp.json',
          premium_api: isDataFeed
            ? `https://alloemmanuals.com${pathname}`
            : 'https://alloemmanuals.com/api/premium-repair-data',
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
          preview: isDataFeed
            ? {
                title: 'AI Training Feed — Clean Markdown Vehicle Data',
                description: 'Structured, de-humanized factory manual data with no affiliate links, no navigation, and no ads. Raw markdown served — no HTML parsing needed. Ideal for model training and RAG grounding.',
                coverage: '300K+ vehicles (1960–2025)',
                formats: ['text/markdown'],
                benefits: [
                  'No HTML parsing required',
                  'Zero affiliate links or ads',
                  'Structured markdown with clear sections',
                  'OEM excerpts from factory service manuals',
                  'Knowledge graphs linking components, codes, and procedures',
                ],
                sample_endpoints: [
                  '/api/data/2010/toyota/camry',
                  '/api/data/2010/toyota/camry/repairs/oil-change',
                  '/api/data/2010/toyota/camry/dtc',
                  '/api/data/2010/toyota/camry/specs',
                ],
              }
            : undefined,
        };
        const wantsMarkdown = acceptHeader.includes('text/markdown');
        if (wantsMarkdown || isDataFeed) {
          const mdBody = `# Payment Required — AI Training Feed

This content is available in two forms. Human visitors can browse the HTML site for free. Automated crawlers and AI trainers must license the data.

## Option 1: Human Site (Free for Human Browsers)

HTML, navigation, affiliate links for parts and tools on every page. Built for humans to read and click. Free for browsers.

## Option 2: AI Training Feed (Paid — For Automated Crawlers)

The same factory manual corpus, repackaged for AI consumption:

- **Clean markdown** — no HTML parsing required
- **Zero affiliate links** — no noise in your training data
- **No ads, no nav, no site chrome** — content only
- **Structured sections** — hierarchical markdown with clear headings
- **300,000+ vehicles** (1960–2025)

## Pricing
- **Standard:** $0.01 per page
- **Volume (100K+ pages/month):** $0.005 per page
- **Enterprise (1M+ pages/month):** $0.001 per page

## Pay with Stripe (Real Money)
1. Visit https://alloemmanuals.com/for-ai for details and sample data
2. Buy credits at https://alloemmanuals.com/api/stripe/checkout?pack=starter
3. Complete checkout
4. Your API key will be shown after payment
5. Include your key: \`Authorization: Bearer <api_key>\`

## Pay with x402 (Agent-Native, Devnet)
1. Visit https://alloemmanuals.com/.well-known/acp.json for payment discovery
2. Use x402 exact scheme on Solana devnet
3. Include payment token in Authorization header

## Sample Endpoints
- \`/api/data/{year}/{make}/{model}\` — Full vehicle hub
- \`/api/data/{year}/{make}/{model}/repairs/{task}\` — Repair guide
- \`/api/data/{year}/{make}/{model}/dtc\` — Diagnostic codes
- \`/api/data/{year}/{make}/{model}/specs\` — Factory specs

*Citation required. No resale. Enterprise licensing available.*
`;
          return new NextResponse(mdBody, {
            status: 402,
            headers: {
              'Content-Type': 'text/markdown; charset=utf-8',
              'X-Payment-Required': 'stripe,x402',
              'Link': '<https://alloemmanuals.com/.well-known/acp.json>; rel="payment"',
              'Cache-Control': 'no-store',
              'Accept-Payment': 'stripe,x402',
            },
          });
        }
        return NextResponse.json(body, {
          status: 402,
          headers: {
            'Content-Type': 'application/json',
            'X-Payment-Required': 'stripe,x402',
            'Link': '<https://alloemmanuals.com/.well-known/acp.json>; rel="payment"',
            'Cache-Control': 'no-store',
            'Accept-Payment': 'stripe,x402',
          },
        });
      }
      // x402 payment succeeded; mark request as paid so route handlers skip Stripe credit gate.
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('X-Payment-Verified', 'x402');
      return NextResponse.next({ request: { headers: requestHeaders } });
    }).catch((err: any) => {
      console.error('[middleware] x402 proxy error:', err);
      return NextResponse.json(
        { error: 'Payment verification unavailable', message: err?.message || 'Unknown error' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      );
    });
  }

  const response = NextResponse.next();

  if (shouldNoindexHost) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  // 7. Agent discovery Link headers on homepage
  if (pathname === '/') {
    response.headers.set(
      'Link',
      [
        '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
        '</.well-known/mcp/server-card.json>; rel="mcp-server-card"; type="application/json"',
        '</.well-known/agent-skills/index.json>; rel="agent-skills"; type="application/json"',
        '</.well-known/acp.json>; rel="acp-discovery"; type="application/json"',
        '</.well-known/ucp>; rel="ucp-profile"; type="application/json"',
        '</auth.md>; rel="auth"; type="text/markdown"',
        '</openapi.json>; rel="openapi"; type="application/json"',
        '</.well-known/oauth-authorization-server>; rel="oauth-authorization-server"; type="application/json"',
        '</.well-known/openid-configuration>; rel="openid-configuration"; type="application/json"',
      ].join(', ')
    );
  }

  // 8. API routes - block external origins
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!origin && referer) {
      const refererOrigin = new URL(referer).origin;
      if (!ALLOWED_ORIGINS.includes(refererOrigin)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
  }

  // 9. Comma-containing URL cleanup
  if (pathname.includes(',')) {
    const cleanPath = pathname.replace(/,/g, '').replace(/--+/g, '-');
    if (cleanPath !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = cleanPath;
      return NextResponse.redirect(url, 301);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
