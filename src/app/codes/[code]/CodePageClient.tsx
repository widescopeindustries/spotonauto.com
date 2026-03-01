'use client';

import React from 'react';
import Link from 'next/link';
import type { DTCCode } from '@/data/dtc-codes-data';
import AdUnit from '@/components/AdUnit';

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    low: { label: 'Low Severity', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    medium: { label: 'Medium Severity', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    high: { label: 'High Severity', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    critical: { label: 'Critical', color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500/40' },
};

const LIKELIHOOD_BADGE: Record<string, string> = {
    likely: 'bg-green-500/10 text-green-400 border-green-500/30',
    possible: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    unlikely: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'antigravity-20';

export default function CodePageClient({ code }: { code: DTCCode }) {
    const sev = SEVERITY_CONFIG[code.severity] || SEVERITY_CONFIG.medium;

    return (
        <section className="py-16 px-4 max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href="/" className="hover:text-cyan-400 transition">Home</Link>
                <span>/</span>
                <Link href="/codes" className="hover:text-cyan-400 transition">DTC Codes</Link>
                <span>/</span>
                <span className="text-white font-mono">{code.code}</span>
            </nav>

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-3xl md:text-4xl font-bold">
                        <span className="text-cyan-400 font-mono">{code.code}</span>
                    </h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${sev.bg} ${sev.color} ${sev.border}`}>
                        {sev.label}
                    </span>
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">{code.title}</h2>
                <p className="text-sm text-gray-400">{code.affectedSystem} System</p>
            </div>

            {/* Quick Answer Box — featured snippet target */}
            <div className="mb-8 bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-6">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2">What Does {code.code} Mean?</h3>
                <p className="text-white text-lg leading-relaxed">{code.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Common Fix</p>
                        <p className="text-white font-semibold text-sm">{code.commonFix}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Estimated Cost (DIY)</p>
                        <p className="text-white font-semibold text-sm">{code.estimatedCostRange}</p>
                    </div>
                </div>
            </div>

            {/* Symptoms */}
            <div className="mb-8 bg-white/[0.03] border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Symptoms</h3>
                <ul className="space-y-2">
                    {code.symptoms.map((s, i) => (
                        <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                            <span className="text-amber-400 mt-0.5 shrink-0">⚠️</span>
                            {s}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Common Causes */}
            <div className="mb-8 bg-white/[0.03] border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Common Causes</h3>
                <div className="space-y-3">
                    {code.commonCauses.map((c, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <span className="text-gray-300 text-sm">{c.cause}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${LIKELIHOOD_BADGE[c.likelihood]}`}>
                                {c.likelihood}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Diagnostic Steps */}
            <div className="mb-8 bg-white/[0.03] border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">How to Diagnose {code.code}</h3>
                <ol className="space-y-3">
                    {code.diagnosticSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center mt-0.5">
                                {i + 1}
                            </span>
                            <span className="text-gray-300 text-sm">{step}</span>
                        </li>
                    ))}
                </ol>
            </div>

            {/* Ad placement */}
            <AdUnit slot="code-after-diagnosis" />

            {/* OBD2 Scanner CTA */}
            <div className="mb-8 bg-amber-500/5 border border-amber-500/20 rounded-xl p-6 text-center">
                <p className="text-amber-200 text-sm mb-3">Need to read or clear this code?</p>
                <a
                    href={`https://www.amazon.com/s?k=obd2+scanner+bluetooth&i=automotive&tag=${AMAZON_TAG}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-black text-sm font-bold rounded-lg hover:bg-amber-400 transition"
                >
                    Shop OBD2 Scanners on Amazon →
                </a>
            </div>

            {/* Repair link */}
            {code.repairTaskSlug && (
                <div className="mb-8 bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-6 text-center">
                    <p className="text-cyan-200 text-sm mb-3">Ready to fix it yourself?</p>
                    <Link
                        href={`/repair/2024/toyota/camry/${code.repairTaskSlug}`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black text-sm font-bold rounded-lg hover:bg-cyan-400 transition"
                    >
                        View Step-by-Step Repair Guide →
                    </Link>
                    <p className="text-gray-600 text-xs mt-2">Select your exact vehicle for a personalized guide</p>
                </div>
            )}

            {/* Related Codes */}
            {code.relatedCodes.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4">Related Codes</h3>
                    <div className="flex flex-wrap gap-2">
                        {code.relatedCodes.map(rc => (
                            <Link
                                key={rc}
                                href={`/codes/${rc.toLowerCase()}`}
                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-cyan-400 font-mono text-sm hover:border-cyan-500/40 transition"
                            >
                                {rc}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* FAQ */}
            <section className="mb-12">
                <h3 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h3>
                <dl className="space-y-4">
                    {code.faq.map((f, i) => (
                        <div key={i} className="bg-white/[0.03] rounded-xl border border-white/10 overflow-hidden">
                            <dt className="px-5 py-4 font-semibold text-white">{f.q}</dt>
                            <dd className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">{f.a}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            {/* Ad after FAQ */}
            <AdUnit slot="code-after-faq" format="horizontal" />

            {/* Bottom CTA */}
            <div className="text-center py-8 border-t border-white/10 mt-8">
                <p className="text-gray-400 mb-4">Need a diagnosis for your specific vehicle?</p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition text-lg"
                >
                    Start Free AI Diagnosis →
                </Link>
                <p className="text-gray-600 text-sm mt-3">100% Free — No signup required</p>
            </div>
        </section>
    );
}
