
import React, { useState } from 'react';
import type { RepairGuide } from '../types';
import { AlertIcon, WrenchIcon, ListIcon, CheckCircleIcon, ShoppingCartIcon } from './Icons';
import { generatePartLinks } from '../services/affiliateService';

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
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest"><WrenchIcon className="text-brand-cyan" />Tools</h2>
                            <ul className="space-y-2">
                                {guide.tools.map((tool, index) => (
                                    <li key={index} className="flex items-center gap-3 text-gray-200">
                                        <CheckCircleIcon className="text-brand-cyan flex-shrink-0" />
                                        <span>{tool}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest"><WrenchIcon className="text-brand-cyan" />Parts</h2>
                            <ul className="space-y-4">
                                {guide.parts.map((part, index) => {
                                    const links = generatePartLinks(part, guide.vehicle);
                                    return (
                                        <li key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-brand-cyan/50 transition-colors">
                                            <div className="flex items-center gap-3 text-gray-200">
                                                <CheckCircleIcon className="text-brand-cyan flex-shrink-0" />
                                                <span className="font-medium">{part}</span>
                                            </div>
                                            {links.map((link, i) => (
                                                <a
                                                    key={i}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 bg-brand-cyan text-black px-4 py-2 rounded-md font-bold text-sm hover:bg-brand-cyan-light transition-colors"
                                                >
                                                    <ShoppingCartIcon className="w-4 h-4" />
                                                    Buy on {link.provider}
                                                </a>
                                            ))}
                                        </li>
                                    );
                                })}
                            </ul>
                            <p className="text-xs text-gray-500 mt-4 italic">
                                *As an Amazon Associate I earn from qualifying purchases. Prices and availability may vary.
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