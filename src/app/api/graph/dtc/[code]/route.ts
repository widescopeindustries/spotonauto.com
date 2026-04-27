import { NextRequest, NextResponse } from 'next/server';
import { getDTCGraphData } from '@/lib/graphQueries';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  try {
    const data = await getDTCGraphData(upperCode, 8);
    if (!data) {
      return NextResponse.json({ error: 'DTC not found in graph' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('[api/graph/dtc] error:', error);
    return NextResponse.json({ error: 'Graph query failed' }, { status: 500 });
  }
}
