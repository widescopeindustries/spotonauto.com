'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { DTC_CODES } from '@/data/dtc-codes-data';

const SEVERITY_COLORS: Record<string, string> = {
    low: 'text-green-400 bg-green-500/10 border-green-500/30',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    high: 'text-red-400 bg-red-500/10 border-red-500/30',
    critical: 'text-red-500 bg-red-500/20 border-red-500/40',
};

export default function CodesIndex({ systems }: { systems: string[] }) {
    const [search, setSearch] = useState('');
    const [activeSystem, setActiveSystem] = useState<string | null>(null);

    const filtered = useMemo(() => {
        let codes = DTC_CODES;
        if (activeSystem) {
            codes = codes.filter(c => c.affectedSystem === activeSystem);
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            codes = codes.filter(c =>
                c.code.toLowerCase().includes(q) ||
                c.title.toLowerCase().includes(q) ||
                c.affectedSystem.toLowerCase().includes(q)
            );
        }
        return codes;
    }, [search, activeSystem]);

    return (
        <>
            {/* Search */}
            <div className="max-w-xl mx-auto mb-8">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value.toUpperCase())}
                    placeholder="Search codes (e.g. P0420, misfire, catalytic)"
                    className="w-full bg-white/5 border border-cyan-500/30 rounded-xl px-5 py-4 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 uppercase tracking-wider"
                />
            </div>

            {/* System filter chips */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
                <button
                    onClick={() => setActiveSystem(null)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition ${
                        !activeSystem
                            ? 'bg-cyan-500 text-black border-cyan-500'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:border-cyan-500/30'
                    }`}
                >
                    All ({DTC_CODES.length})
                </button>
                {systems.map(sys => {
                    const count = DTC_CODES.filter(c => c.affectedSystem === sys).length;
                    return (
                        <button
                            key={sys}
                            onClick={() => setActiveSystem(activeSystem === sys ? null : sys)}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition ${
                                activeSystem === sys
                                    ? 'bg-cyan-500 text-black border-cyan-500'
                                    : 'bg-white/5 text-gray-400 border-white/10 hover:border-cyan-500/30'
                            }`}
                        >
                            {sys} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Results count */}
            <p className="text-center text-gray-500 text-sm mb-6">
                {filtered.length} code{filtered.length !== 1 ? 's' : ''} found
            </p>

            {/* Code grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-6xl mx-auto">
                {filtered.map(code => (
                    <Link
                        key={code.code}
                        href={`/codes/${code.code.toLowerCase()}`}
                        className="group flex flex-col p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 transition"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-cyan-400 font-bold text-sm">{code.code}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${SEVERITY_COLORS[code.severity]}`}>
                                {code.severity}
                            </span>
                        </div>
                        <h3 className="text-white text-sm font-semibold mb-1 group-hover:text-cyan-300 transition line-clamp-2">
                            {code.title}
                        </h3>
                        <p className="text-gray-500 text-xs mt-auto">{code.affectedSystem} &middot; {code.estimatedCostRange}</p>
                    </Link>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-400 text-lg mb-2">No codes found</p>
                    <p className="text-gray-600 text-sm">Try a different search term or clear the filter.</p>
                </div>
            )}
        </>
    );
}
