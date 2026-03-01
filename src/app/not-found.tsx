'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Wrench, Car, Search, ArrowLeft, BookOpen } from 'lucide-react';

const POPULAR_GUIDES = [
    { href: '/repair/2013/bmw/x3/battery-replacement', label: 'BMW X3 Battery Replacement' },
    { href: '/repair/2009/bmw/x5/serpentine-belt-replacement', label: 'BMW X5 Serpentine Belt' },
    { href: '/repair/2013/toyota/corolla/oil-change', label: 'Toyota Corolla Oil Change' },
    { href: '/repair/2009/honda/fit/brake-rotor-replacement', label: 'Honda Fit Brake Rotors' },
    { href: '/repair/2012/honda/cr-v/battery-replacement', label: 'Honda CR-V Battery' },
    { href: '/repair/2013/nissan/rogue/serpentine-belt-replacement', label: 'Nissan Rogue Belt' },
];

export default function NotFound() {
    const router = useRouter();
    const [dots, setDots] = useState('');

    useEffect(() => {
        const iv = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
        return () => clearInterval(iv);
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-2xl w-full text-center relative z-10">
                {/* Error Code */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-400 font-mono text-xs tracking-widest uppercase">Signal Lost</span>
                    </div>
                    <div className="font-display font-black text-[120px] leading-none text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-transparent select-none">
                        404
                    </div>
                </motion.div>

                {/* Message */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-10"
                >
                    <h1 className="font-display font-bold text-2xl text-white mb-3">
                        Page Not Found
                    </h1>
                    <p className="font-body text-gray-400 max-w-md mx-auto">
                        This page doesn't exist or was moved. Let's get you back on the road — try one of these instead:
                    </p>
                </motion.div>

                {/* Quick action buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10"
                >
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-cyan-500 hover:bg-cyan-400 rounded-xl font-bold text-black transition-all"
                    >
                        <Zap className="w-5 h-5" />
                        Start AI Diagnosis
                    </button>
                    <button
                        onClick={() => router.push('/guides')}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold text-white transition-all"
                    >
                        <BookOpen className="w-5 h-5" />
                        Browse Repair Guides
                    </button>
                    <button
                        onClick={() => router.push('/diagnose')}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 rounded-xl font-semibold text-amber-400 transition-all"
                    >
                        <Search className="w-5 h-5" />
                        AI Diagnostic Chat
                    </button>
                    <button
                        onClick={() => router.push('/guides')}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold text-white transition-all"
                    >
                        <BookOpen className="w-5 h-5" />
                        Browse Repair Guides
                    </button>
                </motion.div>

                {/* Popular Guides */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-left"
                >
                    <h2 className="font-display font-bold text-sm text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-cyan-400" />
                        Popular Repair Guides
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-2">
                        {POPULAR_GUIDES.map((guide) => (
                            <Link
                                key={guide.href}
                                href={guide.href}
                                className="flex items-center gap-2 p-3 rounded-lg hover:bg-white/5 text-gray-400 hover:text-cyan-400 transition-all text-sm group"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/40 group-hover:bg-cyan-400 transition-colors flex-shrink-0" />
                                {guide.label}
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* Back button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={() => router.back()}
                    className="mt-8 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mx-auto"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Go back to previous page
                </motion.button>
            </div>
        </div>
    );
}
