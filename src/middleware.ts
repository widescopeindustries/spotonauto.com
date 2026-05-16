import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CANONICAL_HOST, isCanonicalHost, isIndexableHost, isLegacyRedirectHost, isPreviewHost, normalizeHost } from '@/lib/host';

const ALLOWED_ORIGINS = [
  'https://alloemmanuals.com',
  'https://www.alloemmanuals.com',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
];

function applyCrawlerHeaders(response: NextResponse, shouldNoindexHost: boolean, isRobots: boolean) {
  response.headers.set('Vary', 'Accept-Encoding');
  response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  if (shouldNoindexHost) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  if (isRobots) {
    response.headers.set('Content-Type', 'text/plain; charset=utf-8');
  } else {
    response.headers.set('Content-Type', 'application/xml; charset=utf-8');
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
  const isCrawlerEndpoint = isRootOrNestedSitemap || isNestedSitemapChunk || isRobots;

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
    return applyCrawlerHeaders(NextResponse.next(), shouldNoindexHost, isRobots);
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

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
