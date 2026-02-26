'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Suspense } from 'react';

/**
 * OAuth Callback page — handles the redirect from Google after sign-in.
 *
 * Supabase sends users here with a `code` param (PKCE flow).
 * The supabase-js client automatically exchanges it for a session
 * when `detectSessionInUrl` is true (the default).
 *
 * After auth, we redirect to:
 *   1. The `?redirect=` query param if present
 *   2. localStorage `auth_redirect` if set (saved before Google OAuth)
 *   3. Home `/` as fallback
 */
function AuthCallbackInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Resolve redirect target — check query param first, then localStorage fallback
        const paramRedirect = searchParams.get('redirect');
        const storedRedirect = typeof window !== 'undefined'
            ? localStorage.getItem('auth_redirect')
            : null;
        const redirectTo = paramRedirect || storedRedirect || '/';

        // Clean up stored redirect
        if (storedRedirect) localStorage.removeItem('auth_redirect');

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                subscription.unsubscribe();
                router.replace(redirectTo);
            }
        });

        // Safety fallback: if no SIGNED_IN fires within 5s, redirect anyway
        const timeout = setTimeout(() => {
            subscription.unsubscribe();
            router.replace(redirectTo);
        }, 5000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] gap-4">
            <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-cyan-400 font-mono text-sm tracking-widest animate-pulse">AUTHENTICATING...</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] gap-4">
                <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                <p className="text-cyan-400 font-mono text-sm tracking-widest animate-pulse">AUTHENTICATING...</p>
            </div>
        }>
            <AuthCallbackInner />
        </Suspense>
    );
}
