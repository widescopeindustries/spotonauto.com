import { NextRequest, NextResponse } from 'next/server';
import { diagnoseWithGraph } from '@/lib/graphQueries';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dtc, year, make, model, limit = 6 } = body;

    if (!dtc || !/^[A-Z]\d{4}$/i.test(dtc)) {
      return NextResponse.json({ error: 'Invalid DTC code' }, { status: 400 });
    }

    const data = await diagnoseWithGraph(
      dtc.toUpperCase(),
      year ? Number(year) : undefined,
      make,
      model,
      Number(limit)
    );

    if (!data) {
      return NextResponse.json({ error: 'No graph data for this DTC' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[api/graph/diagnose] error:', error);
    return NextResponse.json({ error: 'Diagnosis query failed' }, { status: 500 });
  }
}
