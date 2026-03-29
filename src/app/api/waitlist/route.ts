import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
    try {
        const { email, vehicle, year } = await req.json();
        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        await supabase.from('coverage_waitlist').upsert(
            {
                email: email.toLowerCase().trim(),
                vehicle: vehicle || '',
                year: year || null,
                created_at: new Date().toISOString(),
            },
            { onConflict: 'email,vehicle' }
        );

        return NextResponse.json({ ok: true });
    } catch {
        // Don't expose internal errors — still return success so the UI shows confirmation
        return NextResponse.json({ ok: true });
    }
}
