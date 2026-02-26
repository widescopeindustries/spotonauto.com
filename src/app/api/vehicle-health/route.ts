export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getVehicleNHTSAData } from '@/services/nhtsaService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year  = searchParams.get('year')  ?? '';
  const make  = searchParams.get('make')  ?? '';
  const model = searchParams.get('model') ?? '';

  if (!year || !make || !model) {
    return NextResponse.json({ error: 'Missing year, make, or model' }, { status: 400 });
  }

  try {
    const data = await getVehicleNHTSAData(year, make, model);
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch {
    return NextResponse.json(
      { recalls: [], complaints: { topIssues: [], totalCount: 0, mostCommonComponent: null }, hasActiveRecalls: false, fetchedAt: new Date().toISOString() },
      { status: 200 } // always 200 — let UI degrade gracefully
    );
  }
}
