import { getToolPage, TOOL_PAGES } from '@/data/tools-pages';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const slug = request.nextUrl.searchParams.get('slug');
    if (!slug) {
        return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }
    const page = getToolPage(slug);
    return NextResponse.json({
        slug,
        found: !!page,
        totalPages: TOOL_PAGES.length,
        title: page?.title ?? null,
    });
}
