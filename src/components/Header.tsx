'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Cpu, Car, Menu, X, History, LogOut, Zap, Shield, Bookmark } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSelector from '@/components/LanguageSelector';
import { useT } from '@/lib/translations';

const Header: React.FC = () => {
    const router = useRouter();
    const { user, logout, loading } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const t = useT();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
                            { key: 'nav.features', href: '/#features' },
                            { key: 'nav.howItWorks', href: '/#how-it-works' },
                            { key: 'nav.guides', href: '/guides' },
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
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        <button
                            onClick={() => {
                                const key = navigator.userAgent.toLowerCase().includes('mac') ? 'Cmd' : 'Ctrl';
                                alert(`Press ${key}+D to bookmark this page`);
                            }}
                            className="flex items-center gap-1.5 text-gray-300 hover:text-cyan-400 transition-all duration-200 hover:scale-105 active:scale-95"
                            title="Bookmark this page"
                        >
                            <Bookmark className="w-4 h-4" />
                            <span className="font-body text-sm">{t('nav.bookmark') || 'Bookmark'}</span>
                        </button>
                        <LanguageSelector />
                        <button
                            onClick={() => router.push('/diagnose')}
                            className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <Zap className="w-4 h-4" />
                            <span className="font-body text-sm">{t('nav.diagnose')}</span>
                        </button>
                        <button
                            onClick={() => router.push('/second-opinion')}
                            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <Shield className="w-4 h-4" />
                            <span className="font-body text-sm">{t('nav.secondOpinion')}</span>
                        </button>
                        <button
                            onClick={() => router.push('/parts')}
                            className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <Car className="w-4 h-4" />
                            <span className="font-body text-sm">{t('nav.parts')}</span>
                        </button>

                        {user ? (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => router.push('/history')}
                                    className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-all duration-200 hover:scale-105 active:scale-95"
                                >
                                    <History className="w-4 h-4" />
                                    <span className="font-body text-sm">{t('nav.history')}</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="btn-cyber flex items-center gap-2 py-2 px-4 hover:scale-105 active:scale-95 transition-transform duration-200"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="text-xs">{t('nav.logout')}</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => router.push('/auth')}
                                className="btn-cyber hover:scale-105 active:scale-95 transition-transform duration-200"
                            >
                                {t('nav.signIn')}
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

            {/* Mobile Menu */}
            <div
                className={`md:hidden glass-strong border-t border-cyan-500/20 overflow-hidden transition-all duration-300 ease-in-out ${
                    isMobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="px-4 py-6 space-y-4">
                    {[
                        { key: 'nav.features', href: '/#features' },
                        { key: 'nav.howItWorks', href: '/#how-it-works' },
                        { key: 'nav.repairGuides', href: '/guides' },
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
                                const key = navigator.userAgent.toLowerCase().includes('mac') ? 'Cmd' : 'Ctrl';
                                alert(`Press ${key}+D to bookmark this page`);
                                setIsMobileMenuOpen(false);
                            }}
                            className="flex items-center gap-2 text-gray-300 w-full"
                        >
                            <Bookmark className="w-4 h-4" />
                            <span className="font-body">{t('nav.bookmark') || 'Bookmark'}</span>
                        </button>
                        <button
                            onClick={() => { router.push('/diagnose'); setIsMobileMenuOpen(false); }}
                            className="flex items-center gap-2 text-amber-400 w-full font-semibold"
                        >
                            <Zap className="w-4 h-4" />
                            <span className="font-body">{t('nav.diagnoseMycar')}</span>
                        </button>
                        <button
                            onClick={() => { router.push('/second-opinion'); setIsMobileMenuOpen(false); }}
                            className="flex items-center gap-2 text-cyan-400 w-full font-semibold"
                        >
                            <Shield className="w-4 h-4" />
                            <span className="font-body">{t('nav.secondOpinion')}</span>
                        </button>
                        <button
                            onClick={() => { router.push('/parts'); setIsMobileMenuOpen(false); }}
                            className="flex items-center gap-2 text-gray-300"
                        >
                            <Car className="w-4 h-4" />
                            <span className="font-body">{t('nav.partsFinder')}</span>
                        </button>

                        {user ? (
                            <>
                                <button
                                    onClick={() => { router.push('/history'); setIsMobileMenuOpen(false); }}
                                    className="flex items-center gap-2 text-gray-300 w-full"
                                >
                                    <History className="w-4 h-4" />
                                    <span className="font-body">{t('nav.myHistory')}</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="btn-cyber w-full flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    {t('nav.logout')}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => { router.push('/auth'); setIsMobileMenuOpen(false); }}
                                className="btn-cyber w-full"
                            >
                                {t('nav.signUp')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
