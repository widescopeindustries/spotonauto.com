'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cpu, Car, Menu, X, History, LogOut, Zap, Shield, Bookmark } from 'lucide-react';
import { trackBookmarkClick } from '@/lib/analytics';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSelector from '@/components/LanguageSelector';
import { useT } from '@/lib/translations';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [bookmarkHint, setBookmarkHint] = useState<string | null>(null);
    const t = useT();

    useEffect(() => {
        let ticking = false;
        let last = false;

        const update = () => {
            ticking = false;
            const next = window.scrollY > 50;
            if (next !== last) {
                last = next;
                setIsScrolled(next);
            }
        };

        const handleScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!bookmarkHint) return;
        const timer = window.setTimeout(() => setBookmarkHint(null), 2500);
        return () => window.clearTimeout(timer);
    }, [bookmarkHint]);

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
                    <Link
                        href="/"
                        className="flex items-center gap-2 transition-transform duration-200 hover:scale-105 active:scale-95"
                        aria-label="SpotOnAuto Home"
                    >
                        <div className="relative w-10 h-10 flex items-center justify-center">
                            <div className="absolute inset-0 bg-cyan-500/20 rounded-lg animate-pulse-glow" />
                            <Cpu className="w-6 h-6 text-cyan-400 relative z-10" />
                        </div>
                        <span className="font-display font-bold text-xl tracking-wider text-white">
                            SPOTON<span className="text-cyan-400">AUTO</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
                        {[
                            { key: 'nav.features', href: '/#features' },
                            { key: 'nav.howItWorks', href: '/#how-it-works' },
                            { key: 'nav.guides', href: '/guides' },
                            { key: 'nav.codes', href: '/codes' },
                            { key: 'nav.community', href: '/community' },
                        ].map((item) => (
                            <Link
                                key={item.key}
                                href={item.href}
                                className="font-body text-sm text-gray-300 hover:text-cyan-400 transition-colors relative group"
                            >
                                {t(item.key)}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full" />
                            </Link>
                        ))}
                    </nav>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        <button
                            onClick={() => {
                                trackBookmarkClick(window.location.pathname);
                                const key = navigator.userAgent.toLowerCase().includes('mac') ? 'Cmd' : 'Ctrl';
                                setBookmarkHint(`Press ${key}+D to bookmark this page`);
                            }}
                            className="flex items-center gap-1.5 text-gray-300 hover:text-cyan-400 transition-all duration-200 hover:scale-105 active:scale-95"
                            title="Bookmark this page"
                            aria-label="Bookmark this page"
                        >
                            <Bookmark className="w-4 h-4" />
                            <span className="font-body text-sm">{t('nav.bookmark') || 'Bookmark'}</span>
                        </button>
                        <LanguageSelector />
                        <Link
                            href="/diagnose"
                            className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <Zap className="w-4 h-4" />
                            <span className="font-body text-sm">{t('nav.diagnose')}</span>
                        </Link>
                        <Link
                            href="/second-opinion"
                            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <Shield className="w-4 h-4" />
                            <span className="font-body text-sm">{t('nav.secondOpinion')}</span>
                        </Link>
                        <Link
                            href="/parts"
                            className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <Car className="w-4 h-4" />
                            <span className="font-body text-sm">{t('nav.parts')}</span>
                        </Link>

                        {user ? (
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/history"
                                    className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-all duration-200 hover:scale-105 active:scale-95"
                                >
                                    <History className="w-4 h-4" />
                                    <span className="font-body text-sm">{t('nav.history')}</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="btn-cyber flex items-center gap-2 py-2 px-4 hover:scale-105 active:scale-95 transition-transform duration-200"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="text-xs">{t('nav.logout')}</span>
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/auth"
                                className="btn-cyber hover:scale-105 active:scale-95 transition-transform duration-200"
                            >
                                {t('nav.signIn')}
                            </Link>
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

            {/* Mobile Menu */}
            <nav
                aria-label="Mobile navigation"
                className={`md:hidden glass-strong border-t border-cyan-500/20 overflow-hidden transition-all duration-300 ease-in-out ${
                    isMobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="px-4 py-6 space-y-4">
                    {[
                        { key: 'nav.features', href: '/#features' },
                        { key: 'nav.howItWorks', href: '/#how-it-works' },
                        { key: 'nav.repairGuides', href: '/guides' },
                        { key: 'nav.codes', href: '/codes' },
                        { key: 'nav.community', href: '/community' },
                    ].map((item) => (
                        <Link
                            key={item.key}
                            href={item.href}
                            className="block font-body text-gray-300 hover:text-cyan-400 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {t(item.key)}
                        </Link>
                    ))}

                    <div className="pt-4 border-t border-cyan-500/20 space-y-3">
                        <div className="flex items-center gap-2 text-gray-300 mb-2">
                            <LanguageSelector />
                            <span className="text-sm text-gray-500">{t('nav.guideLanguage')}</span>
                        </div>
                        <button
                            onClick={() => {
                                trackBookmarkClick(window.location.pathname);
                                const key = navigator.userAgent.toLowerCase().includes('mac') ? 'Cmd' : 'Ctrl';
                                setBookmarkHint(`Press ${key}+D to bookmark this page`);
                                setIsMobileMenuOpen(false);
                            }}
                            className="flex items-center gap-2 text-gray-300 w-full"
                        >
                            <Bookmark className="w-4 h-4" />
                            <span className="font-body">{t('nav.bookmark') || 'Bookmark'}</span>
                        </button>
                        <Link
                            href="/diagnose"
                            onClick={() => { setIsMobileMenuOpen(false); }}
                            className="flex items-center gap-2 text-amber-400 w-full font-semibold"
                        >
                            <Zap className="w-4 h-4" />
                            <span className="font-body">{t('nav.diagnoseMycar')}</span>
                        </Link>
                        <Link
                            href="/second-opinion"
                            onClick={() => { setIsMobileMenuOpen(false); }}
                            className="flex items-center gap-2 text-cyan-400 w-full font-semibold"
                        >
                            <Shield className="w-4 h-4" />
                            <span className="font-body">{t('nav.secondOpinion')}</span>
                        </Link>
                        <Link
                            href="/parts"
                            onClick={() => { setIsMobileMenuOpen(false); }}
                            className="flex items-center gap-2 text-gray-300"
                        >
                            <Car className="w-4 h-4" />
                            <span className="font-body">{t('nav.partsFinder')}</span>
                        </Link>

                        {user ? (
                            <>
                                <Link
                                    href="/history"
                                    onClick={() => { setIsMobileMenuOpen(false); }}
                                    className="flex items-center gap-2 text-gray-300 w-full"
                                >
                                    <History className="w-4 h-4" />
                                    <span className="font-body">{t('nav.myHistory')}</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="btn-cyber w-full flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    {t('nav.logout')}
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/auth"
                                onClick={() => { setIsMobileMenuOpen(false); }}
                                className="btn-cyber block w-full text-center"
                            >
                                {t('nav.signUp')}
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {bookmarkHint && (
                <div className="fixed top-20 right-4 z-[70] rounded-lg border border-cyan-500/30 bg-black/85 px-3 py-2 text-xs text-cyan-200 shadow-lg">
                    {bookmarkHint}
                </div>
            )}
        </header>
    );
};

export default Header;
