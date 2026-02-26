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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-cyan-400">Loading...</div>
            </div>
        );
    }

    if (user) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-20">
            <AuthForm onAuthSuccess={() => router.push(redirectTo)} />
        </div>
    );
}

// useSearchParams requires Suspense boundary in Next.js app router
export default function AuthPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-cyan-400">Loading...</div>
            </div>
        }>
            <AuthPageInner />
        </Suspense>
    );
}
