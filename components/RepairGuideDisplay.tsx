
import React, { useState } from 'react';
import type { RepairGuide } from '../types';
import { AlertIcon, WrenchIcon, ListIcon, CheckCircleIcon, ShoppingCartIcon, ExternalLinkIcon } from './Icons';
import { generatePartLinks, generateToolLinks } from '../services/affiliateService';

interface RepairGuideDisplayProps {
    guide: RepairGuide;
    onReset: () => void;
}

enum Tab {
    Guide,
    ToolsParts,
    Safety,
    Sources
}

const RepairGuideDisplay: React.FC<RepairGuideDisplayProps> = ({ guide, onReset }) => {
    return (
        <div className="w-full max-w-6xl mx-auto bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in ring-1 ring-white/5">
            <header className="relative p-8 border-b border-white/10 overflow-hidden group">
                {/* Header Background Glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/20 transition-all duration-1000"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-2 drop-shadow-sm">
                            {guide.title}
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-bold border border-blue-500/30 uppercase tracking-wider">
                                {guide.vehicle}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onReset}
                        className="px-6 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm uppercase tracking-widest transition-all hover:scale-105 hover:shadow-lg active:scale-95"
                    >
                        New Diagnostic
                    </button>
                </div>
            </header>

            <main className="p-6 md:p-10 space-y-12">

                {/* SAFETY ALERTS - Redesigned */}
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

                {/* CONSOLIDATED PARTS & TOOLS */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* TOOLS CARD */}
                    <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] transition-colors">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 uppercase tracking-widest">
                            <WrenchIcon className="text-blue-400 w-5 h-5" />
                            Required Tools
                        </h2>
                        <ul className="space-y-2">
                            {guide.tools?.map((tool, index) => {
                                const links = generateToolLinks(tool);
                                return (
                                    <li key={index} className="group flex items-center justify-between p-3 rounded-lg bg-black/20 border border-transparent hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-3">
                                            <CheckCircleIcon className="w-4 h-4 text-emerald-500/80" />
                                            <span className="text-gray-200 font-medium">{tool}</span>
                                        </div>
                                        {links.map((link, i) => (
                                            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 text-blue-400 hover:text-white transition-opacity">
                                                <ExternalLinkIcon className="w-4 h-4" />
                                            </a>
                                        ))}
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    {/* PARTS CARD */}
                    <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] transition-colors relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 uppercase tracking-widest">
                            <ShoppingCartIcon className="text-blue-400 w-5 h-5" />
                            Required Parts
                        </h2>
                        <ul className="space-y-3">
                            {guide.parts?.map((part, index) => {
                                const links = generatePartLinks(part, guide.vehicle);
                                return (
                                    <li key={index} className="flex flex-col gap-2 p-3 bg-black/20 rounded-lg border border-white/5">
                                        <span className="text-gray-100 font-bold">{part}</span>
                                        <div className="flex gap-2">
                                            {links.map((link, i) => (
                                                <a
                                                    key={i}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-100 hover:text-white px-3 py-2 rounded text-xs font-bold uppercase transition-all"
                                                >
                                                    Purchase
                                                </a>
                                            ))}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                        <div className="mt-6 text-center">
                            <a
                                href={`https://www.amazon.com/s?k=${encodeURIComponent(guide.vehicle + ' maintenance parts')}&tag=${import.meta.env.VITE_AMAZON_AFFILIATE_TAG || 'aiautorepai04-20'}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-blue-400 text-sm font-bold hover:text-white transition-colors"
                            >
                                Browse All Parts <ExternalLinkIcon className="w-3 h-3" />
                            </a>
                        </div>
                    </section>
                </div>

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
                                    {/* Stop Number Column */}
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
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                                                    <div className="w-16 h-16 rounded-full border-2 border-gray-700 border-t-blue-500 animate-spin mb-4 opacity-50"></div>
                                                    <span className="text-xs font-mono uppercase tracking-widest opacity-50">Generating Visual...</span>
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
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">References & Data Sources</h3>
                        <div className="flex flex-wrap gap-3">
                            {guide.sources.map((source, index) => (
                                <a key={index} href={source.uri} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-gray-400 hover:text-white transition-all flex items-center gap-2">
                                    <ExternalLinkIcon className="w-3 h-3" /> {source.title}
                                </a>
                            ))}
                        </div>
                    </footer>
                )}

            </main>
        </div>
    );
};


export default RepairGuideDisplay;