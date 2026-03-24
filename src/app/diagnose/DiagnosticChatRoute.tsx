'use client';

import dynamic from 'next/dynamic';

const DiagnosticChat = dynamic(() => import('@/components/DiagnosticChat'), {
    ssr: false,
    loading: () => (
        <div className="flex min-h-[420px] w-full max-w-3xl items-center justify-center rounded-xl border border-neon-cyan/20 bg-black/70 px-6 text-center text-sm text-cyan-100/80">
            Initializing diagnostic core...
        </div>
    ),
});

export default function DiagnosticChatRoute() {
    return <DiagnosticChat />;
}
