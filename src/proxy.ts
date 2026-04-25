import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CANONICAL_HOST, isCanonicalHost, isIndexableHost, isLegacyRedirectHost, isPreviewHost, normalizeHost } from '@/lib/host';

const ALLOWED_ORIGINS = [
    'https://spotonauto.com',
    'https://www.spotonauto.com',
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

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const host = normalizeHost(request.headers.get('x-forwarded-host') || request.headers.get('host'));
    const shouldNoindexHost = !isCanonicalHost(host) && isPreviewHost(host);
    const isRootOrNestedSitemap =
        pathname === '/sitemap.xml' || pathname.endsWith('/sitemap.xml');
    const isNestedSitemapChunk =
        pathname.includes('/sitemap/') && pathname.endsWith('.xml');
    const isRobots = pathname === '/robots.txt';
    const isCrawlerEndpoint = isRootOrNestedSitemap || isNestedSitemapChunk || isRobots;

    if (isLegacyRedirectHost(host)) {
        const url = request.nextUrl.clone();
        url.protocol = 'https:';
        url.host = CANONICAL_HOST;
        return NextResponse.redirect(url, 308);
    }

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

    // Crawler endpoints - force plain cache/Vary semantics (no RSC vary headers)
    // so search engines consistently parse robots + sitemap responses.
    if (isCrawlerEndpoint) {
        return applyCrawlerHeaders(NextResponse.next(), shouldNoindexHost, isRobots);
    }

    const response = NextResponse.next();

    if (shouldNoindexHost) {
        response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    }

    // API routes - block external origins
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

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
