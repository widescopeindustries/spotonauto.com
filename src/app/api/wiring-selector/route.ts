import { NextResponse } from 'next/server';

import { getWiringSelectorData } from '@/lib/wiringCoverage';

export async function GET() {
  return NextResponse.json(getWiringSelectorData(), {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
