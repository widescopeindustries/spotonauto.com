'use client';

import React, { useState, useEffect, useRef, startTransition } from 'react';
import Link from 'next/link';
import { ChevronDown, Cpu, Menu, X, History, LogOut, Zap, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSelector from '@/components/LanguageSelector';
import { useT } from '@/lib/translations';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
    const toolsMenuRef = useRef<HTMLDivElement | null>(null);
    const t = useT();

    const desktopNavItems = [
        { key: 'nav.guides', href: '/guides' },
        { key: 'nav.community', href: '/community' },
    ];

    const toolsMenuItems = [
        {
            label: 'Wiring Diagrams',
            href: '/wiring',
            description: 'Jump straight to vehicle-system diagram clusters.',
        },
        {
            label: t('nav.codes'),
            href: '/codes',
            description: 'Trouble-code pages connected to repairs, symptoms, and wiring.',
        },
        {
            label: 'Repair Hub',
            href: '/repair',
            description: 'Browse graph-driven repair and symptom entry points.',
        },
        {
            label: t('nav.parts'),
            href: '/parts',
            description: 'Compare parts before teardown or ordering.',
        },
    ];

    const mobileNavItems = [
        { label: t('nav.guides'), href: '/guides' },
        { label: 'Wiring Diagrams', href: '/wiring' },
        { label: t('nav.codes'), href: '/codes' },
        { label: 'Repair Hub', href: '/repair' },
        { label: t('nav.parts'), href: '/parts' },
        { label: t('nav.community'), href: '/community' },
    ];

    useEffect(() => {
        let ticking = false;
        let last = false;

        const update = () => {
            ticking = false;
            const next = window.scrollY > 50;
            if (next !== last) {
                last = next;
                startTransition(() => setIsScrolled(next));
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
        if (!isToolsMenuOpen) return;

        const handlePointerDown = (event: MouseEvent) => {
            if (!toolsMenuRef.current?.contains(event.target as Node)) {
                setIsToolsMenuOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsToolsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isToolsMenuOpen]);

    const handleLogout = async () => {
        await logout();
        setIsMobileMenuOpen(false);
        setIsToolsMenuOpen(false);
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
                    <nav aria-label="Main navigation" className="hidden md:flex items-center gap-5">
                        {desktopNavItems.map((item) => (
                            <Link
                                key={item.key}
                                href={item.href}
                                className="font-body text-sm text-gray-300 hover:text-cyan-400 transition-colors relative group"
                            >
                                {t(item.key)}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full" />
                            </Link>
                        ))}
                        <div
                            ref={toolsMenuRef}
                            className="relative"
                        >
                            <button
                                type="button"
                                onClick={() => setIsToolsMenuOpen((open) => !open)}
                                className="flex items-center gap-1.5 font-body text-sm text-gray-300 hover:text-cyan-400 transition-colors"
                                aria-haspopup="menu"
                                aria-expanded={isToolsMenuOpen}
                            >
                                <span>Tools</span>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isToolsMenuOpen && (
                                <div
                                    className="absolute left-1/2 top-full mt-4 w-[22rem] -translate-x-1/2 rounded-2xl border border-cyan-500/20 bg-black/95 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                                    role="menu"
                                    aria-label="Tools"
                                >
                                    <div className="mb-2 px-3 pt-2">
                                        <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/80">Quick access</p>
                                        <p className="mt-2 text-sm text-gray-400">Move directly into wiring, codes, repair hubs, and parts without losing the scroll.</p>
                                    </div>
                                    <div className="space-y-1">
                                        {toolsMenuItems.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className="block rounded-xl border border-transparent px-3 py-3 transition-all hover:border-cyan-500/25 hover:bg-cyan-500/10"
                                                role="menuitem"
                                                onClick={() => setIsToolsMenuOpen(false)}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="font-body text-sm font-semibold text-white">{item.label}</span>
                                                    <span className="text-[10px] uppercase tracking-[0.18em] text-cyan-300/70">Open</span>
                                                </div>
                                                <p className="mt-1 text-xs leading-5 text-gray-400">{item.description}</p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </nav>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        <LanguageSelector />
                        <Link
                            href="/diagnose"
                            className="btn-cyber flex items-center gap-2 py-2 px-4 hover:scale-105 active:scale-95 transition-transform duration-200"
                        >
                            <Zap className="w-4 h-4" />
                            <span className="text-xs">{t('nav.diagnose')}</span>
                        </Link>
                        <Link
                            href="/second-opinion"
                            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <Shield className="w-4 h-4" />
                            <span className="font-body text-sm">{t('nav.secondOpinion')}</span>
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
                        onClick={() => {
                            setIsMobileMenuOpen(!isMobileMenuOpen);
                            setIsToolsMenuOpen(false);
                        }}
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
                    <div className="rounded-2xl border border-cyan-500/15 bg-black/20 p-4">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/80">Tools</p>
                        <p className="mt-2 text-xs leading-5 text-gray-400">Fast paths for users who came for wiring, codes, repair hubs, or parts.</p>
                    </div>
                    {mobileNavItems.map((item) => (
                        <Link
                            key={item.href}
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
                            <span className="text-sm text-gray-500">{t('nav.guideLanguage')}</span>
                        </div>
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
        </header>
    );
};

export default Header;
