'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Cpu, Car, Menu, X, History, LogOut, Bluetooth, Zap, DollarSign, ArrowRight, BookOpen, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUsageStatus } from '@/lib/usageTracker';
import LanguageSelector from '@/components/LanguageSelector';

const Header: React.FC = () => {
    const router = useRouter();
    const { user, logout, loading } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [guideUsage, setGuideUsage] = useState<{ used: number; limit: number } | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Load usage stats for free users (client-side only)
    useEffect(() => {
        if (typeof window !== 'undefined' && user?.tier === 'free') {
            const usage = getUsageStatus();
            // Always show for free users so they know their limit
            setGuideUsage(usage.guides);
        } else {
            setGuideUsage(null);
        }
    }, [user]);

    const handleLogout = async () => {
        await logout();
        setIsMobileMenuOpen(false);
    };

    return (
        <header
            className={`header-slide-in fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                isScrolled ? 'glass-strong' : 'bg-transparent'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <div
                        className="flex items-center gap-2 cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
                        onClick={() => router.push('/')}
                    >
                        <div className="relative w-10 h-10 flex items-center justify-center">
                            <div className="absolute inset-0 bg-cyan-500/20 rounded-lg animate-pulse-glow" />
                            <Cpu className="w-6 h-6 text-cyan-400 relative z-10" />
                        </div>
                        <span className="font-display font-bold text-xl tracking-wider text-white">
                            SPOTON<span className="text-cyan-400">AUTO</span>
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        {[
                            { label: 'Features', href: '/#features' },
                            { label: 'How It Works', href: '/#how-it-works' },
                            { label: 'Guides', href: '/guides' },
                        ].map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="font-body text-sm text-gray-300 hover:text-cyan-400 transition-colors relative group"
                            >
                                {item.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full" />
                            </Link>
                        ))}
                        <Link
                            href="/pricing"
                            className="font-body text-sm text-cyan-400 hover:text-cyan-300 transition-colors relative group font-semibold"
                        >
                            Pricing
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full" />
                        </Link>
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        <LanguageSelector />
                        <button
                            onClick={() => router.push('/diagnose')}
                            className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <Zap className="w-4 h-4" />
                            <span className="font-body text-sm">Diagnose</span>
                        </button>
                        <button
                            onClick={() => router.push('/second-opinion')}
                            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <Shield className="w-4 h-4" />
                            <span className="font-body text-sm">2nd Opinion</span>
                        </button>
                        <button
                            onClick={() => router.push('/scanner')}
                            className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <Bluetooth className="w-4 h-4" />
                            <span className="font-body text-sm">Scanner</span>
                        </button>
                        <button
                            onClick={() => router.push('/parts')}
                            className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <Car className="w-4 h-4" />
                            <span className="font-body text-sm">Parts</span>
                        </button>

                        {user ? (
                            <div className="flex items-center gap-3">
                                {user.tier === 'free' && guideUsage && (
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                                        guideUsage.used >= guideUsage.limit
                                            ? 'bg-amber-500/10 border-amber-500/40'
                                            : 'bg-gray-800/60 border-gray-700/50'
                                    }`}>
                                        <BookOpen className={`w-3 h-3 ${
                                            guideUsage.used >= guideUsage.limit ? 'text-amber-400' : 'text-gray-400'
                                        }`} />
                                        <span className={`text-xs ${
                                            guideUsage.used >= guideUsage.limit ? 'text-amber-400' : 'text-gray-400'
                                        }`}>
                                            {guideUsage.used >= guideUsage.limit
                                                ? '1 free guide used'
                                                : '1 free guide left'}
                                        </span>
                                    </div>
                                )}
                                {user.tier === 'free' && (
                                    <button
                                        onClick={() => router.push('/pricing')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/20 transition-all duration-200 hover:scale-105 active:scale-95"
                                    >
                                        <Zap className="w-3 h-3 text-amber-400" />
                                        <span className="text-amber-400 text-xs font-semibold">Free Plan</span>
                                        <ArrowRight className="w-3 h-3 text-amber-400" />
                                    </button>
                                )}
                                <button
                                    onClick={() => router.push('/history')}
                                    className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-all duration-200 hover:scale-105 active:scale-95"
                                >
                                    <History className="w-4 h-4" />
                                    <span className="font-body text-sm">History</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="btn-cyber flex items-center gap-2 py-2 px-4 hover:scale-105 active:scale-95 transition-transform duration-200"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="text-xs">Logout</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => router.push('/auth')}
                                className="btn-cyber hover:scale-105 active:scale-95 transition-transform duration-200"
                            >
                                Sign In
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu — CSS-only show/hide, no Framer Motion */}
            <div
                className={`md:hidden glass-strong border-t border-cyan-500/20 overflow-hidden transition-all duration-300 ease-in-out ${
                    isMobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="px-4 py-6 space-y-4">
                    {[
                        { label: 'Features', href: '/#features' },
                        { label: 'How It Works', href: '/#how-it-works' },
                        { label: 'Repair Guides', href: '/guides' },
                    ].map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="block font-body text-gray-300 hover:text-cyan-400 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {item.label}
                        </Link>
                    ))}

                    <div className="pt-4 border-t border-cyan-500/20 space-y-3">
                        <div className="flex items-center gap-2 text-gray-300 mb-2">
                            <LanguageSelector />
                            <span className="text-sm text-gray-500">Guide language</span>
                        </div>
                        <button
                            onClick={() => { router.push('/diagnose'); setIsMobileMenuOpen(false); }}
                            className="flex items-center gap-2 text-amber-400 w-full font-semibold"
                        >
                            <Zap className="w-4 h-4" />
                            <span className="font-body">Diagnose My Car</span>
                        </button>
                        <button
                            onClick={() => { router.push('/pricing'); setIsMobileMenuOpen(false); }}
                            className="flex items-center gap-2 text-cyan-400 w-full font-semibold"
                        >
                            <DollarSign className="w-4 h-4" />
                            <span className="font-body">Pricing & Plans</span>
                        </button>
                        <button
                            onClick={() => { router.push('/second-opinion'); setIsMobileMenuOpen(false); }}
                            className="flex items-center gap-2 text-cyan-400 w-full font-semibold"
                        >
                            <Shield className="w-4 h-4" />
                            <span className="font-body">2nd Opinion</span>
                        </button>
                        <button
                            onClick={() => { router.push('/parts'); setIsMobileMenuOpen(false); }}
                            className="flex items-center gap-2 text-gray-300"
                        >
                            <Car className="w-4 h-4" />
                            <span className="font-body">Parts Finder</span>
                        </button>
                        <button
                            onClick={() => { router.push('/scanner'); setIsMobileMenuOpen(false); }}
                            className="flex items-center gap-2 text-gray-300"
                        >
                            <Bluetooth className="w-4 h-4" />
                            <span className="font-body">OBD-II Scanner</span>
                        </button>

                        {user ? (
                                    <>
                                        {user.tier === 'free' && guideUsage && (
                                            <div className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg border ${
                                                guideUsage.used >= guideUsage.limit
                                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                                    : 'bg-gray-800/40 border-gray-700/30 text-gray-400'
                                            }`}>
                                                <BookOpen className="w-4 h-4" />
                                                <span className="text-sm">
                                                    {guideUsage.used >= guideUsage.limit
                                                        ? 'Free guide used — upgrade for full access'
                                                        : '1 free full-access guide this month'}
                                                </span>
                                            </div>
                                        )}
                                        {user.tier === 'free' && (
                                            <button
                                                onClick={() => { router.push('/pricing'); setIsMobileMenuOpen(false); }}
                                                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold"
                                            >
                                                <Zap className="w-4 h-4" />
                                                <span>Upgrade to Pro — $9.99/mo</span>
                                                <ArrowRight className="w-4 h-4 ml-auto" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { router.push('/history'); setIsMobileMenuOpen(false); }}
                                            className="flex items-center gap-2 text-gray-300 w-full"
                                        >
                                            <History className="w-4 h-4" />
                                            <span className="font-body">My History</span>
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="btn-cyber w-full flex items-center justify-center gap-2"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => { router.push('/auth'); setIsMobileMenuOpen(false); }}
                                        className="btn-cyber w-full"
                                    >
                                        Sign In / Sign Up
                                    </button>
                                )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
