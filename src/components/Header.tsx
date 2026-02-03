'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Cpu, ShoppingCart, Wrench, Search } from 'lucide-react';

const Header: React.FC = () => {
    const router = useRouter();

    return (
        <header className="w-full glass-strong border-b border-cyan-500/20 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <div
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => router.push('/')}
                    >
                        <div className="relative w-10 h-10 flex items-center justify-center">
                            <div className="absolute inset-0 bg-cyan-500/20 rounded-lg animate-pulse-glow" />
                            <Cpu className="w-6 h-6 text-cyan-400 relative z-10" />
                        </div>
                        <span className="font-display font-bold text-xl tracking-wider text-white group-hover:text-cyan-400 transition-colors">
                            SPOTON<span className="text-cyan-400">AUTO</span>
                        </span>
                    </div>

                    {/* Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <a
                            href="#features"
                            className="font-body text-sm text-gray-300 hover:text-cyan-400 transition-colors relative group"
                        >
                            Features
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full" />
                        </a>
                        <a
                            href="#how-it-works"
                            className="font-body text-sm text-gray-300 hover:text-cyan-400 transition-colors relative group"
                        >
                            How It Works
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full" />
                        </a>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex items-center gap-4">
                        {/* Shop Parts */}
                        <button
                            onClick={() => router.push('/parts')}
                            className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            <span className="hidden md:inline font-body text-sm font-semibold">Parts</span>
                        </button>

                        {/* Diagnose CTA */}
                        <button
                            onClick={() => router.push('/diagnose')}
                            className="btn-cyber-primary flex items-center gap-2 py-2 px-4"
                        >
                            <Search className="w-4 h-4" />
                            <span className="font-display text-xs tracking-wider">DIAGNOSE</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
