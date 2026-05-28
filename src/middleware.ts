import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CANONICAL_HOST, isCanonicalHost, isIndexableHost, isLegacyRedirectHost, isPreviewHost, normalizeHost } from '@/lib/host';

const ALLOWED_ORIGINS = [
  'https://alloemmanuals.com',
  'https://www.alloemmanuals.com',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
];

const DEFAULT_TOLLBIT_FORWARD_BOTS = [
  'meta-webindexer',
  'claude-searchbot',
  'claudesearchbot',
  'duckassistbot',
  'chatgpt-user',
  'oai-searchbot',
  'gptbot',
  'claudebot',
  'claude-web',
  'claude-user',
  'claudeuser',
  'claudeweb',
  'anthropic-ai',
  'bytespider',
  'ccbot',
  'cohere-ai',
  'perplexitybot',
  'perplexity-user',
  'amazonbot',
  'amzn-searchbot',
  'youbot',
  'diffbot',
  'meta-externalagent',
  'timpibot',
  'applebot',
  'google-extended',
  'applebot-extended',
  'facebookbot',
  'meta-externalfetcher',
  'imagesiftbot',
  'omgili',
  'omgilibot',
  'petalbot',
  'meta-',
  'facebookexternalhit',
];

const DEFAULT_HARD_BLOCK_BOTS: string[] = [
  // Major AI search engines scraping for free (not via Tollbit)
  'gptbot',
  'anthropic-ai',
  'claudebot',
  'googlebot',
  'bingbot',
  'yahoobot',
  'duckduckbot',
  'perplexitybot',
  'perplexity-user',
];

function parseBotList(value: string | undefined, fallback: string[]) {
  if (!value) return fallback;
  const parsed = value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : fallback;
}

function matchesBot(userAgent: string, botTokens: string[]) {
  return botTokens.some((token) => userAgent.includes(token));
}

function applyCrawlerHeaders(response: NextResponse, shouldNoindexHost: boolean, isRobots: boolean) {
  response.headers.set('Vary', 'Accept-Encoding, User-Agent');
  if (isRobots) {
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
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
  const tollbitHost = (process.env.TOLLBIT_HOST || 'tollbit.alloemmanuals.com').toLowerCase();
  const tollbitForwardBots = parseBotList(process.env.TOLLBIT_FORWARD_BOTS, DEFAULT_TOLLBIT_FORWARD_BOTS);
  const hardBlockBots = parseBotList(process.env.HARD_BLOCK_AI_BOTS, DEFAULT_HARD_BLOCK_BOTS);
  const shouldNoindexHost = !isCanonicalHost(host) && isPreviewHost(host);
  const isRootOrNestedSitemap = pathname === '/sitemap.xml' || pathname.endsWith('/sitemap.xml');
  const isNestedSitemapChunk = pathname.includes('/sitemap/') && pathname.endsWith('.xml');
  const isRobots = pathname === '/robots.txt';
  const isCrawlerEndpoint = isRootOrNestedSitemap || isNestedSitemapChunk || isRobots;

  // 1. Legacy host redirect
  if (isLegacyRedirectHost(host)) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  // 1.5 AI bot monetization/denial policy: paywall-capable bots forward to TollBit,
  // non-paying AI bots are hard blocked. Skip this logic on TollBit host itself.
  const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '';
  const isTollbitIp = clientIp === '52.22.183.94' || clientIp === '3.220.109.109';
  const isLocal =
    host.includes('localhost') ||
    host.includes('127.0.0.1') ||
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    process.env.NODE_ENV === 'development';

  const hasRawTollbitToken =
    request.headers.has('tollbittoken') ||
    request.headers.has('x-tollbit-token') ||
    request.headers.has('x-tollbit-key') ||
    request.headers.has('signature') ||
    request.headers.has('signature-input') ||
    request.headers.has('authorization');

  // Verify that if a token is present, it actually came from Tollbit's proxy IP
  const hasTollbitToken = hasRawTollbitToken && (isTollbitIp || isLocal);

  const isTollbitCrawler = userAgent.includes('tollbot');

  if (isTollbitCrawler) {
    const allHeaders = Array.from(request.headers.entries()).map(([k, v]) => `${k}: ${v}`).join(' | ');
    console.log(`[tollbot debug] Request to ${pathname} from ${clientIp}. All Headers: ${allHeaders}`);
  }

  // 1.52. Tollbit's own crawler (tollbot/1.0 from 52.22.183.94) fetching content
  // to serve to paying AI consumers — let it through, do NOT redirect back to Tollbit.
  if (isTollbitCrawler || isTollbitIp) {
    const tollbitKey = request.headers.get('x-tollbit-key') || request.headers.get('tollbittoken') || request.headers.get('signature')?.slice(0, 16) || 'ip-verified';
    console.log(`[TOLLBIT_AUDIT] path=${pathname} bot=${userAgent.slice(0, 60)} ip=${clientIp} token=${tollbitKey}`);
    console.log(`[TOLLBIT_AUDIT_DETAIL] type=full path=${pathname}`);
    const res = NextResponse.next();
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    if (shouldNoindexHost) {
      res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    }
    return res;
  }

  // 1.55. Audit log all verified paid/Tollbit requests to systemd journal
  if (hasTollbitToken || host === tollbitHost) {
    const tollbitKey = request.headers.get('x-tollbit-key') || request.headers.get('tollbittoken') || request.headers.get('signature')?.slice(0, 16) || 'N/A';
    console.log(`[TOLLBIT_AUDIT] path=${pathname} bot=${userAgent.slice(0, 60)} ip=${clientIp} token=${tollbitKey}`);
  }

  if (host !== tollbitHost && !hasTollbitToken && !isCrawlerEndpoint) {
    if (matchesBot(userAgent, tollbitForwardBots)) {
      const tollbitUrl = request.nextUrl.clone();
      tollbitUrl.protocol = 'https:';
      tollbitUrl.host = tollbitHost;
      tollbitUrl.port = '';
      const redirectResponse = NextResponse.redirect(tollbitUrl, 302);
      redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      return redirectResponse;
    }

    if (matchesBot(userAgent, hardBlockBots) && !isCrawlerEndpoint) {
      return new NextResponse('Forbidden', {
        status: 403,
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
  }

  // Helper to apply Tollbit headers and prevent caching on successful proxy responses
  const applyTollbitResponseHeaders = (res: NextResponse) => {
    if (isTollbitIp || isTollbitCrawler || hasTollbitToken) {
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    }
    return res;
  };

  // 2. Robots.txt on non-indexable hosts
  if (pathname === '/robots.txt' && !isIndexableHost(host) && host !== tollbitHost) {
    return applyTollbitResponseHeaders(new NextResponse('User-agent: *\nDisallow: /\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
      },
    }));
  }

  // 3. Crawler endpoints - force plain cache/Vary semantics
  if (isCrawlerEndpoint) {
    return applyTollbitResponseHeaders(applyCrawlerHeaders(NextResponse.next(), shouldNoindexHost, isRobots));
  }

  // 3.5. Rewrite repair requests from verified bots or JSON requests to the API
  const repairMatch = pathname.match(/^\/repair\/(\d{4})\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (repairMatch) {
    const [, rYear, rMake, rModel, rTask] = repairMatch;
    const isBot = matchesBot(userAgent, tollbitForwardBots);
    const wantsJson = request.headers.get('accept')?.toLowerCase().includes('application/json');
    const isAuthorized = hasTollbitToken || host === tollbitHost || isLocal;

    if (isAuthorized && (isBot || wantsJson)) {
      const apiUr = request.nextUrl.clone();
      apiUr.pathname = '/api/v1/repair';
      apiUr.searchParams.set('year', rYear);
      apiUr.searchParams.set('make', rMake);
      apiUr.searchParams.set('model', rModel);
      apiUr.searchParams.set('task', rTask);

      console.log(`[Middleware] Rewriting ${pathname} to ${apiUr.pathname}${apiUr.search} for bot/JSON request`);

      const rewriteResponse = NextResponse.rewrite(apiUr);
      return applyTollbitResponseHeaders(rewriteResponse);
    }
  }

  const response = NextResponse.next();

  if (shouldNoindexHost) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  // 4. API routes - block external origins
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

  // 5. Comma-containing URL cleanup
  if (pathname.includes(',')) {
    const cleanPath = pathname.replace(/,/g, '').replace(/--+/g, '-');
    if (cleanPath !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = cleanPath;
      return NextResponse.redirect(url, 301);
    }
  }

  return applyTollbitResponseHeaders(response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
