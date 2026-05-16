import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Redirect old comma-containing URLs to clean hyphenated versions.
 * Fixes vehicle slugs like /vehicles/2007/chrysler/pacifica-touring,-fwd
 * → /vehicles/2007/chrysler/pacifica-touring-fwd
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only process paths that contain commas
  if (!pathname.includes(',')) {
    return NextResponse.next();
  }

  const cleanPath = pathname
    .replace(/,/g, '')
    .replace(/--+/g, '-');

  if (cleanPath !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = cleanPath;
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/vehicles/:path*',
    '/repair/:path*',
    '/wiring/:path*',
    '/maintenance/:path*',
    '/tools/:path*',
  ],
};
