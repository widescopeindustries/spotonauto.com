'use client';

import { useState } from 'react';

interface CoverageWaitlistProps {
    vehicleName: string;
    year: number;
}

export default function CoverageWaitlist({ vehicleName, year }: CoverageWaitlistProps) {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    if (year >= 1982 && year <= 2013) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email || loading) return;
        setLoading(true);
        try {
            await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, vehicle: vehicleName, year }),
            });
        } catch {
            // Don't block the page on failure
        } finally {
            setSubmitted(true);
            setLoading(false);
        }
    }

    if (submitted) {
        return (
            <div className="mt-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-center">
                <p className="text-sm text-cyan-300">You&apos;re on the list. We&apos;ll email you when verified OEM data is available for your {vehicleName}.</p>
            </div>
        );
    }

    return (
        <div className="mt-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
            <p className="text-sm font-semibold text-cyan-200 mb-1">Want verified factory data for your {vehicleName}?</p>
            <p className="text-xs text-gray-400 mb-3">Join the waitlist — we&apos;ll notify you when OEM coverage expands to your vehicle.</p>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="shrink-0 rounded-lg bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/30 transition disabled:opacity-50"
                >
                    {loading ? '...' : 'Notify me'}
                </button>
            </form>
        </div>
    );
}
