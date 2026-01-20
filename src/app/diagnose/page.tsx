'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DiagnosticChat from '@/components/DiagnosticChat';
import SEOHead from '@/components/seo/SEOHead';

export default function DiagnosticPage() {
    const router = useRouter();

    return (
        <>
            <SEOHead
                title="Antigravity Diagnostic Core"
                description="AI-powered diagnostic chat assistant."
            />
            <div className="p-4 md:p-8 flex flex-col items-center w-full min-h-[calc(100vh-80px)]">
                <h1 className="text-2xl font-mono text-neon-cyan mb-8 tracking-widest uppercase">
                    SYSTEM DIAGNOSTICS
                </h1>
                <DiagnosticChat />

                <div className="mt-8 flex flex-col items-center gap-4">
                    <button
                        onClick={() => router.push('/')}
                        className="text-gray-500 hover:text-neon-cyan font-mono text-xs tracking-widest uppercase transition-colors"
                    >
                        End Diagnosis
                    </button>
                    
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                         <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                         <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">Secure & Private Session</span>
                    </div>
                </div>
            </div>
        </>
    );
}
