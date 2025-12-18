
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
    Safety
}

const RepairGuideDisplay: React.FC<RepairGuideDisplayProps> = ({ guide, onReset }) => {
    const [activeTab, setActiveTab] = useState<Tab>(Tab.Guide);

    const TabButton = ({ tab, label, icon }: { tab: Tab, label: string, icon: React.ReactNode }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-3 font-bold rounded-lg transition-all duration-200 uppercase text-sm tracking-wider ${activeTab === tab
                ? 'bg-brand-cyan text-black shadow-glow-cyan'
                : 'text-brand-cyan-light hover:bg-brand-cyan/20'
                }`}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );

    return (
        <div className="w-full max-w-5xl mx-auto bg-black/50 backdrop-blur-sm border border-brand-cyan/30 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <header className="p-6 border-b border-brand-cyan/30">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-white uppercase tracking-wider">{guide.title}</h1>
                        <p className="text-lg text-brand-cyan font-semibold">{guide.vehicle}</p>
                    </div>
                    <button onClick={onReset} className="text-sm font-semibold text-brand-cyan hover:underline">New Search</button>
                </div>
            </header>

            <nav className="p-4 flex gap-2 border-b border-brand-cyan/30 sticky top-0 z-10 bg-black/80 backdrop-blur-sm">
                <TabButton tab={Tab.Guide} label="Guide" icon={<ListIcon className="w-5 h-5" />} />
                <TabButton tab={Tab.ToolsParts} label="Tools & Parts" icon={<WrenchIcon className="w-5 h-5" />} />
                <TabButton tab={Tab.Safety} label="Safety" icon={<AlertIcon className="w-5 h-5" />} />
            </nav>

            <main className="p-6 md:p-8">
                {activeTab === Tab.Guide && (
                    <div className="space-y-8">
                        {guide.steps.map((step) => (
                            <div key={step.step} className="grid md:grid-cols-2 gap-6 items-start border-b border-brand-cyan/30 pb-8 last:border-b-0">
                                <div className="md:sticky md:top-24">
                                    <h3 className="flex items-center text-xl font-bold text-brand-cyan mb-3">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-cyan text-black font-bold mr-3">{step.step}</span>
                                        Instruction
                                    </h3>
                                    <p className="text-gray-200 leading-relaxed">{step.instruction}</p>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-black rounded-lg p-4 min-h-[250px] border border-brand-cyan/30">
                                    {step.imageUrl ? (
                                        <img src={step.imageUrl} alt={`Illustration for step ${step.step}`} className="rounded-md object-contain max-w-full h-auto" />
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            <p>Illustration could not be generated for this step.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === Tab.ToolsParts && (
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest"><WrenchIcon className="text-brand-cyan" />Tools Needed</h2>
                            <ul className="space-y-3">
                                {guide.tools.map((tool, index) => {
                                    const links = generateToolLinks(tool);
                                    return (
                                        <li key={index} className="flex items-center justify-between gap-3 text-gray-200 p-2 hover:bg-white/5 rounded transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <CheckCircleIcon className="text-brand-cyan flex-shrink-0" />
                                                <span>{tool}</span>
                                            </div>
                                            {links.map((link, i) => (
                                                <a
                                                    key={i}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="opacity-0 group-hover:opacity-100 text-brand-cyan text-xs flex items-center gap-1 hover:underline transition-opacity"
                                                >
                                                    <ExternalLinkIcon className="w-3 h-3" /> Get this
                                                </a>
                                            ))}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest"><ShoppingCartIcon className="text-brand-cyan" />Parts List</h2>
                            <ul className="space-y-4">
                                {guide.parts.map((part, index) => {
                                    const links = generatePartLinks(part, guide.vehicle);
                                    return (
                                        <li key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white/5 rounded-lg border border-brand-cyan/20 hover:border-brand-cyan/50 hover:bg-brand-cyan/5 transition-all duration-300">
                                            <div className="flex items-center gap-3 text-gray-200">
                                                <div className="w-2 h-2 rounded-full bg-brand-cyan shadow-glow-cyan" />
                                                <span className="font-medium">{part}</span>
                                            </div>
                                            {links.map((link, i) => (
                                                <a
                                                    key={i}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 bg-brand-cyan text-black px-5 py-2.5 rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-cyan-500/50"
                                                >
                                                    <ShoppingCartIcon className="w-4 h-4" />
                                                    BUY NOW
                                                </a>
                                            ))}
                                        </li>
                                    );
                                })}
                            </ul>
                            <div className="mt-8 p-4 bg-brand-cyan/10 border border-brand-cyan/30 rounded-xl text-center">
                                <p className="text-sm text-gray-300 mb-4 font-medium italic">Support our free guides by using our links!</p>
                                <a
                                    href={`https://www.amazon.com/s?k=${encodeURIComponent(guide.vehicle + ' maintenance parts')}&tag=${process.env.AMAZON_AFFILIATE_TAG || 'antigravity-20'}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-brand-cyan border-2 border-brand-cyan px-6 py-3 rounded-full font-bold hover:bg-brand-cyan hover:text-black transition-all"
                                >
                                    SHOP ALL PARTS FOR THIS CAR <ExternalLinkIcon className="w-4 h-4" />
                                </a>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-6 text-center leading-relaxed">
                                <span className="font-bold text-gray-400">Affiliate Disclosure:</span> As an Amazon Associate I earn from qualifying purchases. This means we may receive a small commission if you buy through our links, at no extra cost to you.
                            </p>
                        </div>
                    </div>
                )}
                {activeTab === Tab.Safety && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest"><AlertIcon className="text-red-500" />Safety Warnings</h2>
                        <ul className="space-y-3">
                            {guide.safetyWarnings.map((warning, index) => (
                                <li key={index} className="flex items-start gap-3 p-4 bg-red-900/30 border-l-4 border-red-500 rounded-r-lg">
                                    <AlertIcon className="text-red-500 flex-shrink-0 mt-1" />
                                    <span className="text-red-200">{warning}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </main>
        </div>
    );
};

export default RepairGuideDisplay;