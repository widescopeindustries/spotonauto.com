import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = [
    'https://spotonauto.com',
    'https://www.spotonauto.com',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Crawler endpoints — force plain cache/Vary semantics (no RSC vary headers)
    // so search engines consistently parse robots + sitemap responses.
    const isRootOrNestedSitemap =
        pathname === '/sitemap.xml' || pathname.endsWith('/sitemap.xml');
    const isRepairSitemapChunk =
        pathname.startsWith('/repair/sitemap/') && pathname.endsWith('.xml');
    const isRobots = pathname === '/robots.txt';

    if (isRootOrNestedSitemap || isRepairSitemapChunk || isRobots) {
        const response = NextResponse.next();
        response.headers.set('Vary', 'Accept-Encoding');
        response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
        if (isRobots) {
            response.headers.set('Content-Type', 'text/plain; charset=utf-8');
        } else {
            response.headers.set('Content-Type', 'application/xml; charset=utf-8');
        }
        return response;
    }

    // API routes — block external origins
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

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/api/:path*',
        '/robots.txt',
        '/sitemap.xml',
        '/:path*/sitemap.xml',
        '/repair/sitemap/:path*',
    ],
};
