'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, Suspense } from 'react';
import AuthForm from '@/components/AuthForm';

function AuthPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading } = useAuth();

    // Honour ?redirect= param so pricing → auth → pricing flow works
    const redirectTo = searchParams.get('redirect') || '/';

    useEffect(() => {
        if (!loading && user) {
            router.push(redirectTo);
        }
    }, [user, loading, router, redirectTo]);

    // If already logged in and we know it, show nothing (redirect fires above)
    if (!loading && user) {
        return null;
    }

    // Always show the auth form — never block on loading state.
    // If user is already logged in, the useEffect redirect will fire.
    // Showing "Loading..." was causing the page to hang when Supabase import was slow.
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-20">
            <AuthForm onAuthSuccess={() => router.push(redirectTo)} redirectAfter={redirectTo} />
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center px-4 py-20">
                <div className="animate-pulse text-cyan-400">Loading...</div>
            </div>
        }>
            <AuthPageInner />
        </Suspense>
    );
}
