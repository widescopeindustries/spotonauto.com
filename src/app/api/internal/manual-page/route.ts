import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { fetchManualPage } from '@/lib/manualService';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store, max-age=0' };
function decode(value: string) { try { return decodeURIComponent(value); } catch { return value; } }

/** Called only by the loopback delivery gateway, before response headers commit. */
export async function GET(request: NextRequest) {
  const supplied = Buffer.from(request.headers.get('x-manual-internal-key') || '');
  const expected = Buffer.from(process.env.MANUAL_INTERNAL_KEY || '');
  if (!expected.length || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return new NextResponse('Not found', { status: 404, headers });
  }
  const path = request.nextUrl.searchParams.get('path') || '';
  if (!/^\/manual(?:\/|$)/.test(path) || path.includes('?') || path.length > 16384) {
    return NextResponse.json({ status: 400 }, { status: 400, headers });
  }
  const segments = path.replace(/^\/manual\/?/, '').split('/').filter(Boolean).map(decode).map(decode);
  if (!segments.length) return NextResponse.json({ status: 200 }, { headers });
  if (segments.some(segment => segment.toLowerCase().startsWith('hyperlink'))) {
    return NextResponse.json({ status: 410 }, { headers });
  }
  try {
    const page = await fetchManualPage(segments);
    return NextResponse.json({ status: page.status }, { headers });
  } catch {
    return NextResponse.json({ status: 503 }, { status: 503, headers });
  }
}
