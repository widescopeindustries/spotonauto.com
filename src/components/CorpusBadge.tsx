'use client';

interface CorpusBadgeProps {
    year: number;
    vehicleName: string;
}

export default function CorpusBadge({ year }: CorpusBadgeProps) {
    const isOem = year >= 1982 && year <= 2013;

    if (isOem) {
        return (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5">
                <svg className="h-4 w-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <span className="text-sm text-emerald-300">
                    <span className="font-semibold">Verified OEM data</span>
                    <span className="text-emerald-400/70"> — sourced from the factory service manual</span>
                </span>
            </div>
        );
    }

    return (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div className="flex-1">
                    <p className="text-sm text-amber-200">
                        <span className="font-semibold">AI-generated guide</span> — we don&apos;t have factory manual data for this vehicle yet. This content should be verified against your owner&apos;s manual.
                    </p>
                    <p className="mt-1.5 text-xs text-amber-300/60">
                        Our verified OEM coverage currently spans 1982–2013 model years. We&apos;re actively working to expand.
                    </p>
                </div>
            </div>
        </div>
    );
}
