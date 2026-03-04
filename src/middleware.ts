import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = [
    'https://spotonauto.com',
    'https://www.spotonauto.com',
];

/**
 * Block external origins from hitting /api/* routes.
 * Browser requests from the site include Origin or Referer headers
 * that match our domain. External scripts/curl won't match.
 */
export function middleware(request: NextRequest) {
    // Only guard API routes
    if (!request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    // Allow requests with no origin/referer (server-side calls, same-origin fetch in some browsers)
    // but block if they come from a foreign origin
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!origin && referer) {
        const refererOrigin = new URL(referer).origin;
        if (!ALLOWED_ORIGINS.includes(refererOrigin)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};
