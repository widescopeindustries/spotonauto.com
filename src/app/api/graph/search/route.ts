import { NextRequest, NextResponse } from 'next/server';
import { searchGraphProcedures } from '@/lib/graphQueries';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || '10'), 50);

  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 });
  }

  try {
    const results = await searchGraphProcedures(q, limit);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('[api/graph/search] error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
