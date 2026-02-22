'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/**
 * OAuth Callback page — handles the redirect from Google after sign-in.
 *
 * Supabase sends users here with a `code` param (PKCE flow).
 * The supabase-js client automatically exchanges it for a session
 * when `detectSessionInUrl` is true (the default), so we just need
 * to wait for the auth state change and then redirect home.
 */
export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        // supabase-js picks up the `code` from the URL automatically.
        // Listen for the session to be established, then redirect.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                subscription.unsubscribe();
                router.replace('/');
            }
        });

        // Safety fallback: if no SIGNED_IN fires within 5s, redirect home anyway
        const timeout = setTimeout(() => {
            subscription.unsubscribe();
            router.replace('/');
        }, 5000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] gap-4">
            <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-cyan-400 font-mono text-sm tracking-widest animate-pulse">AUTHENTICATING...</p>
        </div>
    );
}
