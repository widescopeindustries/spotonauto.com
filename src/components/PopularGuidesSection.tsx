'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Battery, Wrench, Droplets, Zap, Settings2, Wind,
    Lightbulb, Flame, Thermometer, CircleDot, ChevronRight
} from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────
// Sourced from top Google Search Console impression queries.
// Each entry maps directly to a /repair/[year]/[make]/[model]/[task] URL.

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    battery: <Battery className="w-4 h-4" />,
    belt: <Settings2 className="w-4 h-4" />,
    oil: <Droplets className="w-4 h-4" />,
    alternator: <Zap className="w-4 h-4" />,
    starter: <CircleDot className="w-4 h-4" />,
    brakes: <Flame className="w-4 h-4" />,
    headlight: <Lightbulb className="w-4 h-4" />,
    thermostat: <Thermometer className="w-4 h-4" />,
    'water pump': <Wind className="w-4 h-4" />,
    spark: <Zap className="w-4 h-4" />,
};

interface GuideEntry {
    label: string;          // Display text
    year: string;
    make: string;           // URL slug (lowercase)
    model: string;          // URL slug (lowercase, hyphenated)
    task: string;           // URL slug
    category: string;       // For tab filtering
    badge?: string;         // Optional label e.g. "Most Searched"
    difficulty: 'Easy' | 'Intermediate' | 'Advanced';
    time: string;
}

const POPULAR_GUIDES: GuideEntry[] = [
    // Battery — top impression cluster (bmw x3, bmw x5, Corolla, etc.)
    { label: 'BMW X3 Battery Location & Replacement', year: '2013', make: 'bmw', model: 'x3', task: 'battery-replacement', category: 'battery', badge: 'Most Searched', difficulty: 'Easy', time: '20 min' },
    { label: 'BMW X5 Battery Location & Replacement', year: '2009', make: 'bmw', model: 'x5', task: 'battery-replacement', category: 'battery', difficulty: 'Easy', time: '25 min' },
    { label: 'Toyota Corolla Battery Replacement', year: '2013', make: 'toyota', model: 'corolla', task: 'battery-replacement', category: 'battery', difficulty: 'Easy', time: '15 min' },
    { label: 'Honda CR-V Battery Replacement', year: '2012', make: 'honda', model: 'cr-v', task: 'battery-replacement', category: 'battery', difficulty: 'Easy', time: '15 min' },
    { label: 'Honda Pilot Battery Location', year: '2010', make: 'honda', model: 'pilot', task: 'battery-replacement', category: 'battery', difficulty: 'Easy', time: '15 min' },
    { label: 'Kia Sorento Battery Replacement', year: '2013', make: 'kia', model: 'sorento', task: 'battery-replacement', category: 'battery', difficulty: 'Easy', time: '20 min' },
    { label: 'Toyota Sienna Battery Replacement', year: '2014', make: 'toyota', model: 'sienna', task: 'battery-replacement', category: 'battery', difficulty: 'Easy', time: '15 min' },
    { label: 'Chevy Impala Battery Replacement', year: '2008', make: 'chevrolet', model: 'impala', task: 'battery-replacement', category: 'battery', difficulty: 'Easy', time: '15 min' },
    // Serpentine Belt — huge impression driver
    { label: '2009 BMW X5 Serpentine Belt Diagram', year: '2009', make: 'bmw', model: 'x5', task: 'serpentine-belt-replacement', category: 'belt', badge: 'Top Click', difficulty: 'Easy', time: '20 min' },
    { label: '2013 Nissan Rogue Serpentine Belt', year: '2013', make: 'nissan', model: 'rogue', task: 'serpentine-belt-replacement', category: 'belt', difficulty: 'Easy', time: '20 min' },
    { label: 'Honda Odyssey Serpentine Belt', year: '2013', make: 'honda', model: 'odyssey', task: 'serpentine-belt-replacement', category: 'belt', difficulty: 'Easy', time: '20 min' },
    { label: 'Subaru Forester Serpentine Belt', year: '2011', make: 'subaru', model: 'forester', task: 'serpentine-belt-replacement', category: 'belt', difficulty: 'Easy', time: '20 min' },
    { label: 'Nissan Versa Serpentine Belt', year: '2012', make: 'nissan', model: 'versa', task: 'serpentine-belt-replacement', category: 'belt', difficulty: 'Easy', time: '20 min' },
    { label: '2007 Nissan Pathfinder Belt Diagram', year: '2007', make: 'nissan', model: 'pathfinder', task: 'serpentine-belt-replacement', category: 'belt', difficulty: 'Easy', time: '20 min' },
    { label: 'Ford Fusion Serpentine Belt', year: '2013', make: 'ford', model: 'fusion', task: 'serpentine-belt-replacement', category: 'belt', difficulty: 'Easy', time: '20 min' },
    { label: 'Chevy Silverado Serpentine Belt', year: '2012', make: 'chevrolet', model: 'silverado', task: 'serpentine-belt-replacement', category: 'belt', difficulty: 'Easy', time: '20 min' },
    // Oil Change
    { label: 'BMW X3 Oil Change', year: '2013', make: 'bmw', model: 'x3', task: 'oil-change', category: 'oil', badge: 'Popular', difficulty: 'Easy', time: '30 min' },
    { label: 'BMW X5 Oil Change', year: '2009', make: 'bmw', model: 'x5', task: 'oil-change', category: 'oil', difficulty: 'Easy', time: '35 min' },
    { label: 'Chevy Tahoe Oil Change', year: '2010', make: 'chevrolet', model: 'tahoe', task: 'oil-change', category: 'oil', difficulty: 'Easy', time: '30 min' },
    { label: 'Honda Odyssey Oil Change', year: '2002', make: 'honda', model: 'odyssey', task: 'oil-change', category: 'oil', difficulty: 'Easy', time: '30 min' },
    { label: 'Ford Explorer Oil Change', year: '2016', make: 'ford', model: 'explorer', task: 'oil-change', category: 'oil', difficulty: 'Easy', time: '30 min' },
    // Alternator
    { label: 'BMW X5 Alternator Replacement', year: '2009', make: 'bmw', model: 'x5', task: 'alternator-replacement', category: 'alternator', difficulty: 'Intermediate', time: '1.5 hrs' },
    { label: 'Toyota Corolla Alternator Replacement', year: '2003', make: 'toyota', model: 'corolla', task: 'alternator-replacement', category: 'alternator', difficulty: 'Intermediate', time: '1.5 hrs' },
    { label: 'Honda Odyssey Alternator Replacement', year: '2010', make: 'honda', model: 'odyssey', task: 'alternator-replacement', category: 'alternator', difficulty: 'Intermediate', time: '2 hrs' },
    { label: 'Nissan Rogue Alternator Replacement', year: '2013', make: 'nissan', model: 'rogue', task: 'alternator-replacement', category: 'alternator', difficulty: 'Intermediate', time: '1.5 hrs' },
    { label: 'Subaru Crosstrek Alternator', year: '2015', make: 'subaru', model: 'crosstrek', task: 'alternator-replacement', category: 'alternator', difficulty: 'Intermediate', time: '1.5 hrs' },
    { label: 'Hyundai Santa Fe Alternator', year: '2013', make: 'hyundai', model: 'santa-fe', task: 'alternator-replacement', category: 'alternator', difficulty: 'Intermediate', time: '2 hrs' },
    // Starter
    { label: 'Honda Pilot Starter Replacement', year: '2007', make: 'honda', model: 'pilot', task: 'starter-replacement', category: 'starter', difficulty: 'Intermediate', time: '1.5 hrs' },
    { label: '2008 Nissan Pathfinder Starter', year: '2008', make: 'nissan', model: 'pathfinder', task: 'starter-replacement', category: 'starter', difficulty: 'Intermediate', time: '1.5 hrs' },
    { label: 'Kia Soul Starter Replacement', year: '2012', make: 'kia', model: 'soul', task: 'starter-replacement', category: 'starter', difficulty: 'Intermediate', time: '1.5 hrs' },
    { label: 'Chevy Equinox Starter Location', year: '2010', make: 'chevrolet', model: 'equinox', task: 'starter-replacement', category: 'starter', difficulty: 'Intermediate', time: '1.5 hrs' },
    { label: 'Kia Optima Starter Replacement', year: '2012', make: 'kia', model: 'optima', task: 'starter-replacement', category: 'starter', difficulty: 'Intermediate', time: '1.5 hrs' },
    { label: 'Jeep Cherokee Starter Replacement', year: '2001', make: 'jeep', model: 'cherokee', task: 'starter-replacement', category: 'starter', difficulty: 'Intermediate', time: '1.5 hrs' },
    // Headlight
    { label: 'BMW X3 Headlight Bulb Replacement', year: '2012', make: 'bmw', model: 'x3', task: 'headlight-bulb-replacement', category: 'headlight', difficulty: 'Easy', time: '30 min' },
    { label: 'Nissan Pathfinder Headlight Bulb', year: '2008', make: 'nissan', model: 'pathfinder', task: 'headlight-bulb-replacement', category: 'headlight', difficulty: 'Easy', time: '20 min' },
    { label: 'Subaru Crosstrek Headlight Replacement', year: '2015', make: 'subaru', model: 'crosstrek', task: 'headlight-bulb-replacement', category: 'headlight', difficulty: 'Easy', time: '20 min' },
    { label: 'Honda CR-V Headlight Bulb Guide', year: '2012', make: 'honda', model: 'cr-v', task: 'headlight-bulb-replacement', category: 'headlight', difficulty: 'Easy', time: '20 min' },
    { label: 'Toyota Tundra Headlight Replacement', year: '2010', make: 'toyota', model: 'tundra', task: 'headlight-bulb-replacement', category: 'headlight', difficulty: 'Easy', time: '20 min' },
    // Water Pump
    { label: 'BMW X3 Water Pump Replacement', year: '2013', make: 'bmw', model: 'x3', task: 'water-pump-replacement', category: 'water pump', difficulty: 'Advanced', time: '3 hrs' },
    { label: 'BMW X5 Water Pump Replacement', year: '2009', make: 'bmw', model: 'x5', task: 'water-pump-replacement', category: 'water pump', difficulty: 'Advanced', time: '3 hrs' },
    { label: 'Toyota Prius Water Pump', year: '2013', make: 'toyota', model: 'prius', task: 'water-pump-replacement', category: 'water pump', difficulty: 'Advanced', time: '3 hrs' },
    { label: 'Honda Odyssey Water Pump', year: '2013', make: 'honda', model: 'odyssey', task: 'water-pump-replacement', category: 'water pump', difficulty: 'Advanced', time: '3 hrs' },
    { label: 'Chevy Malibu Water Pump', year: '2012', make: 'chevrolet', model: 'malibu', task: 'water-pump-replacement', category: 'water pump', difficulty: 'Advanced', time: '2.5 hrs' },
    // Thermostat
    { label: 'BMW X3 Thermostat Replacement', year: '2013', make: 'bmw', model: 'x3', task: 'thermostat-replacement', category: 'thermostat', difficulty: 'Intermediate', time: '1.5 hrs' },
    { label: 'Kia Soul Thermostat Location', year: '2012', make: 'kia', model: 'soul', task: 'thermostat-replacement', category: 'thermostat', difficulty: 'Intermediate', time: '1.5 hrs' },
    { label: 'Nissan Altima Thermostat Replacement', year: '2013', make: 'nissan', model: 'altima', task: 'thermostat-replacement', category: 'thermostat', difficulty: 'Intermediate', time: '1.5 hrs' },
    { label: 'Toyota RAV4 Thermostat Location', year: '2010', make: 'toyota', model: 'rav4', task: 'thermostat-replacement', category: 'thermostat', difficulty: 'Intermediate', time: '1.5 hrs' },
    { label: 'Chevy Malibu Thermostat Replacement', year: '2012', make: 'chevrolet', model: 'malibu', task: 'thermostat-replacement', category: 'thermostat', difficulty: 'Intermediate', time: '1.5 hrs' },
    // Spark Plugs
    { label: 'Honda Odyssey Spark Plug Replacement', year: '2013', make: 'honda', model: 'odyssey', task: 'spark-plug-replacement', category: 'spark', difficulty: 'Intermediate', time: '1 hr' },
    { label: 'Kia Soul Spark Plug Replacement', year: '2012', make: 'kia', model: 'soul', task: 'spark-plug-replacement', category: 'spark', difficulty: 'Easy', time: '45 min' },
    { label: 'Subaru Crosstrek Spark Plugs', year: '2015', make: 'subaru', model: 'crosstrek', task: 'spark-plug-replacement', category: 'spark', difficulty: 'Easy', time: '45 min' },
    { label: 'Nissan Sentra Spark Plug Replacement', year: '2012', make: 'nissan', model: 'sentra', task: 'spark-plug-replacement', category: 'spark', difficulty: 'Easy', time: '45 min' },
    // Brakes
    { label: 'BMW X3 Rear Brake Pad Replacement', year: '2013', make: 'bmw', model: 'x3', task: 'brake-pad-replacement', category: 'brakes', difficulty: 'Intermediate', time: '1.5 hrs' },
    { label: 'BMW X5 Brake Pad Replacement', year: '2009', make: 'bmw', model: 'x5', task: 'brake-pad-replacement', category: 'brakes', difficulty: 'Intermediate', time: '1.5 hrs' },
    { label: 'Chevy Tahoe Brake Pad Replacement', year: '2010', make: 'chevrolet', model: 'tahoe', task: 'brake-pad-replacement', category: 'brakes', difficulty: 'Intermediate', time: '1.5 hrs' },
    { label: 'Toyota Tundra Brake Pad Replacement', year: '2010', make: 'toyota', model: 'tundra', task: 'brake-pad-replacement', category: 'brakes', difficulty: 'Intermediate', time: '1.5 hrs' },
    { label: 'Honda Fit Brake Pad Replacement', year: '2012', make: 'honda', model: 'fit', task: 'brake-pad-replacement', category: 'brakes', difficulty: 'Intermediate', time: '1.5 hrs' },
];

// ─── Tab Config ───────────────────────────────────────────────────────────────

const TABS = [
    { key: 'all', label: 'All Guides' },
    { key: 'battery', label: 'Battery' },
    { key: 'belt', label: 'Serpentine Belt' },
    { key: 'oil', label: 'Oil Change' },
    { key: 'alternator', label: 'Alternator' },
    { key: 'starter', label: 'Starter' },
    { key: 'brakes', label: 'Brakes' },
    { key: 'headlight', label: 'Headlight' },
    { key: 'thermostat', label: 'Thermostat' },
    { key: 'water pump', label: 'Water Pump' },
    { key: 'spark', label: 'Spark Plugs' },
];

const DIFFICULTY_COLORS: Record<string, string> = {
    Easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    Intermediate: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    Advanced: 'text-red-400 bg-red-400/10 border-red-400/30',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PopularGuidesSection() {
    const [activeTab, setActiveTab] = useState('all');
    const [showAll, setShowAll] = useState(false);

    const filtered = activeTab === 'all'
        ? POPULAR_GUIDES
        : POPULAR_GUIDES.filter(g => g.category === activeTab);

    const displayed = showAll ? filtered : filtered.slice(0, 12);

    return (
        <section id="popular-guides" className="relative py-20 px-4">
            {/* Background accents */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-4">
                        <Wrench className="w-3.5 h-3.5" />
                        Free DIY Repair Guides
                    </span>
                    <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">
                        Popular <span className="text-cyan-400">Repair Guides</span>
                    </h2>
                    <p className="text-gray-400 max-w-xl mx-auto font-body text-lg">
                        Step-by-step instructions with tools, parts lists, and diagrams —
                        for the most searched repairs on the road today.
                    </p>
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2 justify-center mb-10">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setShowAll(false); }}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-body font-semibold transition-all duration-200 border ${activeTab === tab.key
                                    ? 'bg-cyan-500 text-black border-cyan-500 shadow-[0_0_20px_rgba(0,212,255,0.4)]'
                                    : 'bg-white/5 text-gray-400 border-white/10 hover:border-cyan-500/40 hover:text-cyan-400'
                                }`}
                        >
                            {tab.key !== 'all' && (
                                <span className={activeTab === tab.key ? 'text-black' : 'text-cyan-500'}>
                                    {CATEGORY_ICONS[tab.key]}
                                </span>
                            )}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Guide Cards Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                    {displayed.map((guide, i) => {
                        const href = `/repair/${guide.year}/${guide.make}/${guide.model}/${guide.task}`;
                        return (
                            <Link
                                key={i}
                                href={href}
                                className="group relative flex flex-col p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.06] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,212,255,0.08)]"
                            >
                                {guide.badge && (
                                    <span className="absolute top-3 right-3 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                        {guide.badge}
                                    </span>
                                )}

                                {/* Category icon */}
                                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:bg-cyan-500/20 transition-colors">
                                    {CATEGORY_ICONS[guide.category] ?? <Wrench className="w-4 h-4" />}
                                </div>

                                <h3 className="font-body font-semibold text-white text-sm leading-snug mb-3 group-hover:text-cyan-100 transition-colors">
                                    {guide.label}
                                </h3>

                                <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[guide.difficulty]}`}>
                                            {guide.difficulty}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-mono">{guide.time}</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-cyan-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Show More / Count */}
                <div className="text-center">
                    {!showAll && filtered.length > 12 && (
                        <button
                            onClick={() => setShowAll(true)}
                            className="px-6 py-3 rounded-full border border-cyan-500/40 text-cyan-400 font-body font-semibold text-sm hover:bg-cyan-500/10 hover:border-cyan-500 transition-all duration-200 mr-4"
                        >
                            Show all {filtered.length} guides →
                        </button>
                    )}
                    <p className="inline text-gray-600 font-body text-sm">
                        {filtered.length} guides available
                        {activeTab !== 'all' ? ` for ${TABS.find(t => t.key === activeTab)?.label}` : ''} ·
                        <Link href="/guides" className="text-cyan-500 hover:text-cyan-400 ml-1 transition-colors">
                            Browse all repairs →
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
}
