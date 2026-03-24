import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const envStatus = {
        url_set: !!url,
        url_value: url?.slice(0, 40),
        key_set: !!key,
        key_prefix: key?.slice(0, 20),
        url_is_placeholder: url === 'your_supabase_url',
    };

    let queryResult = null;
    if (url && key && url !== 'your_supabase_url') {
        const sb = createClient(url, key);
        const { data, error } = await sb
            .from('forum_categories')
            .select('id, slug')
            .eq('slug', 'engine-electrical')
            .single();
        queryResult = { data, error: error ? { message: error.message, code: error.code, hint: error.hint } : null };
    }

    return NextResponse.json({ envStatus, queryResult });
}
