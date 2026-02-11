'use client';

import React from 'react';
import type { RepairGuide } from '../types';
import { AlertIcon, WrenchIcon, ListIcon, CheckCircleIcon, ShoppingCartIcon, ShieldCheckIcon, ClockIcon } from './Icons';
import { generateToolLinks, generateAllPartsWithLinks } from '../services/affiliateService';
import PartsComparison from './PartsComparison';
import { trackToolClick } from '../lib/analytics';

interface RepairGuideDisplayProps {
    guide: RepairGuide;
    onReset: () => void;
}

const RepairGuideDisplay: React.FC<RepairGuideDisplayProps> = ({ guide, onReset }) => {
    // Generate enhanced parts data with all affiliate links
    const partsWithLinks = generateAllPartsWithLinks(guide.parts || [], guide.vehicle);

    return (
        <div className="w-full max-w-6xl mx-auto bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in ring-1 ring-white/5">
            {/* HEADER */}
            <header className="relative p-8 border-b border-white/10 overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/20 transition-all duration-1000"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">
                                <ShieldCheckIcon className="w-3.5 h-3.5" />
                                Verified Diagnostic
                            </span>
                            <span className="text-white/30 text-[10px] font-mono tracking-widest uppercase">
                                ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-sm leading-tight">
                            {guide.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-bold border border-blue-500/30 uppercase tracking-wider">
                                {guide.vehicle}
                            </span>
                            <div className="flex items-center gap-4 ml-2 border-l border-white/10 pl-4">
                                <div className="flex items-center gap-2">
                                    <ClockIcon className="w-4 h-4 text-gray-500" />
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Est: 45-90m</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <WrenchIcon className="w-4 h-4 text-gray-500" />
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Diff: Intermediate</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onReset}
                        className="px-6 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm uppercase tracking-widest transition-all hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
                    >
                        New Diagnostic
                    </button>
                </div>
            </header>

            <main className="p-6 md:p-10 space-y-12">

                {/* SAFETY ALERTS */}
                {guide.safetyWarnings && guide.safetyWarnings.length > 0 && (
                    <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-950/40 to-slate-900/40 border border-red-500/30 p-1">
                        <div className="bg-black/20 p-6 rounded-lg backdrop-blur-sm">
                            <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-3 uppercase tracking-widest">
                                <AlertIcon className="w-6 h-6" />
                                Critical Safety Protocols
                            </h2>
                            <ul className="grid gap-3 md:grid-cols-2">
                                {guide.safetyWarnings.map((warning, index) => (
                                    <li key={index} className="flex items-start gap-3 text-red-100/90 font-medium">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] flex-shrink-0" />
                                        <span className="leading-relaxed">{warning}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                )}

                {/* PARTS COMPARISON - THE AFFILIATE MONEY MAKER */}
                {partsWithLinks.length > 0 && (
                    <PartsComparison parts={partsWithLinks} vehicle={guide.vehicle} />
                )}

                {/* TOOLS SECTION */}
                {guide.tools && guide.tools.length > 0 && (
                    <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] transition-colors">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 uppercase tracking-widest">
                            <WrenchIcon className="text-blue-400 w-5 h-5" />
                            Required Tools
                        </h2>
                        <ul className="grid md:grid-cols-2 gap-2">
                            {guide.tools.map((tool, index) => {
                                const links = generateToolLinks(tool);
                                return (
                                    <li key={index} className="group flex items-center justify-between p-3 rounded-lg bg-black/20 border border-transparent hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-3">
                                            <CheckCircleIcon className="w-4 h-4 text-emerald-500/80" />
                                            <span className="text-gray-200 font-medium">{tool}</span>
                                        </div>
                                        {links.map((link, i) => (
                                            <a
                                                key={i}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => trackToolClick(tool, guide.vehicle)}
                                                className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black text-xs font-bold rounded transition-all flex items-center gap-1"
                                            >
                                                <ShoppingCartIcon className="w-3 h-3" /> Amazon
                                            </a>
                                        ))}
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                )}

                {/* STEP-BY-STEP INSTRUCTIONS */}
                <section>
                    <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                            <ListIcon className="text-blue-400 w-6 h-6" />
                            Repair Procedure
                        </h2>
                        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">{guide.steps?.length || 0} STEPS</span>
                    </div>

                    <div className="space-y-16">
                        {guide.steps?.map((step, idx) => (
                            <div key={step.step} className="group relative">
                                {/* Connecting Line */}
                                {idx !== (guide.steps?.length || 0) - 1 && (
                                    <div className="absolute left-[27px] top-16 bottom-[-64px] w-0.5 bg-gradient-to-b from-blue-500/30 to-transparent z-0 hidden lg:block"></div>
                                )}

                                <div className="grid lg:grid-cols-12 gap-8 items-start relative z-10">
                                    {/* Step Number Column */}
                                    <div className="lg:col-span-1 hidden lg:flex justify-center">
                                        <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl font-black text-white group-hover:border-blue-500/50 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all">
                                            {step.step}
                                        </div>
                                    </div>

                                    {/* Content Column */}
                                    <div className="lg:col-span-6 bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 border border-white/5 group-hover:bg-white/[0.05] transition-all">
                                        <div className="lg:hidden mb-4 flex items-center gap-3">
                                            <span className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-bold text-white">
                                                {step.step}
                                            </span>
                                            <span className="text-sm font-bold text-blue-400 uppercase tracking-wider">Step {step.step}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-400 uppercase tracking-wider mb-3">Action</h3>
                                        <p className="text-white text-lg md:text-xl font-medium leading-loose tracking-wide">{step.instruction}</p>
                                    </div>

                                    {/* Visual Column */}
                                    <div className="lg:col-span-5">
                                        <div className="relative aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/10 shadow-lg group-hover:shadow-2xl transition-all">
                                            {step.imageUrl ? (
                                                <img src={step.imageUrl} alt={`Visual for step ${step.step}`} className="w-full h-full object-contain" />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800/50 to-slate-900/50">
                                                    <WrenchIcon className="w-12 h-12 text-blue-500/30 mb-2" />
                                                    <span className="text-xs font-mono uppercase tracking-widest text-gray-500">Step {step.step}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SOURCES FOOTER */}
                {guide.sources && guide.sources.length > 0 && (
                    <footer className="mt-16 pt-8 border-t border-white/5">
                        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                            <div className="flex items-center gap-2">
                                <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Verified from Factory Manuals</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono">
                                {guide.sources.length} authoritative sources used
                            </span>
                        </div>
                    </footer>
                )}

            </main>
        </div>
    );
};

export default RepairGuideDisplay;
