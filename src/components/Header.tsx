'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Car, Menu, X, History, LogOut, Bluetooth, Zap, DollarSign, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Header: React.FC = () => {
    const router = useRouter();
    const { user, logout, loading } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        await logout();
        setIsMobileMenuOpen(false);
    };

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'glass-strong' : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <motion.div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => router.push('/')}
                        whileHover={{ scale: 1.05 }}
                    >
                        <div className="relative w-10 h-10 flex items-center justify-center">
                            <div className="absolute inset-0 bg-cyan-500/20 rounded-lg animate-pulse-glow" />
                            <Cpu className="w-6 h-6 text-cyan-400 relative z-10" />
                        </div>
                        <span className="font-display font-bold text-xl tracking-wider text-white">
                            SPOTON<span className="text-cyan-400">AUTO</span>
                        </span>
                    </motion.div>

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
                        {/* Pricing — highlighted */}
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
                        <motion.button
                            onClick={() => router.push('/diagnose')}
                            className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
                            whileHover={{ scale: 1.05 }}
                        >
                            <Zap className="w-4 h-4" />
                            <span className="font-body text-sm">Diagnose</span>
                        </motion.button>
                        <motion.button
                            onClick={() => router.push('/scanner')}
                            className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-colors"
                            whileHover={{ scale: 1.05 }}
                        >
                            <Bluetooth className="w-4 h-4" />
                            <span className="font-body text-sm">Scanner</span>
                        </motion.button>
                        <motion.button
                            onClick={() => router.push('/parts')}
                            className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-colors"
                            whileHover={{ scale: 1.05 }}
                        >
                            <Car className="w-4 h-4" />
                            <span className="font-body text-sm">Parts</span>
                        </motion.button>

                        {!loading && (
                            <>
                                {user ? (
                                    <div className="flex items-center gap-3">
                                        {/* Free plan upgrade nudge */}
                                        {user.tier === 'free' && (
                                            <motion.button
                                                onClick={() => router.push('/pricing')}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/20 transition-all"
                                                whileHover={{ scale: 1.05 }}
                                            >
                                                <Zap className="w-3 h-3 text-amber-400" />
                                                <span className="text-amber-400 text-xs font-semibold">Free Plan</span>
                                                <ArrowRight className="w-3 h-3 text-amber-400" />
                                            </motion.button>
                                        )}
                                        <motion.button
                                            onClick={() => router.push('/history')}
                                            className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-colors"
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <History className="w-4 h-4" />
                                            <span className="font-body text-sm">History</span>
                                        </motion.button>
                                        <motion.button
                                            onClick={handleLogout}
                                            className="btn-cyber flex items-center gap-2 py-2 px-4"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span className="text-xs">Logout</span>
                                        </motion.button>
                                    </div>
                                ) : (
                                    <motion.button
                                        onClick={() => router.push('/auth')}
                                        className="btn-cyber"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Sign In
                                    </motion.button>
                                )}
                            </>
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
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden glass-strong border-t border-cyan-500/20"
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
                                {/* Diagnose — primary mobile CTA */}
                                <button
                                    onClick={() => { router.push('/diagnose'); setIsMobileMenuOpen(false); }}
                                    className="flex items-center gap-2 text-amber-400 w-full font-semibold"
                                >
                                    <Zap className="w-4 h-4" />
                                    <span className="font-body">Diagnose My Car</span>
                                </button>
                                {/* Pricing */}
                                <button
                                    onClick={() => { router.push('/pricing'); setIsMobileMenuOpen(false); }}
                                    className="flex items-center gap-2 text-cyan-400 w-full font-semibold"
                                >
                                    <DollarSign className="w-4 h-4" />
                                    <span className="font-body">Pricing & Plans</span>
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

                                {!loading && (
                                    <>
                                        {user ? (
                                            <>
                                                {/* Mobile free plan upgrade nudge */}
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
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
};

export default Header;
