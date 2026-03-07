import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveDtcFlowchart } from '@/lib/dtcFlowchart';

const RESPONSE_CACHE = 's-maxage=21600, stale-while-revalidate=86400';

export async function GET(request: NextRequest) {
  const codeRaw = request.nextUrl.searchParams.get('code') || '';
  const code = codeRaw.trim().toUpperCase();

  if (!/^[A-Z][0-9A-Z]{4}$/.test(code)) {
    return NextResponse.json(
      { error: 'Invalid code format' },
      { status: 400, headers: { 'Cache-Control': RESPONSE_CACHE } }
    );
  }

  try {
    const flow = await fetchLiveDtcFlowchart(code);
    return NextResponse.json(
      { flow },
      { headers: { 'Cache-Control': RESPONSE_CACHE } }
    );
  } catch {
    return NextResponse.json(
      { flow: null },
      { status: 200, headers: { 'Cache-Control': RESPONSE_CACHE } }
    );
  }
}
