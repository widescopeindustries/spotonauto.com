import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = [
    'https://spotonauto.com',
    'https://www.spotonauto.com',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Sitemap routes — override Vary header to prevent RSC cache poisoning
    if (pathname.includes('/sitemap/') && pathname.endsWith('.xml')) {
        const response = NextResponse.next();
        response.headers.set('Vary', 'Accept-Encoding');
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
    matcher: ['/api/:path*', '/repair/sitemap/:path*', '/:path*/sitemap/:file*'],
};
