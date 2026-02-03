'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Car, Menu, X } from 'lucide-react';

const Header: React.FC = () => {
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                isScrolled ? 'glass-strong' : 'bg-transparent'
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
                    <div className="hidden md:flex items-center gap-8">
                        {['Features', 'How It Works', 'Testimonials'].map((item) => (
                            <motion.a
                                key={item}
                                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                                className="font-body text-sm text-gray-300 hover:text-cyan-400 transition-colors relative group"
                                whileHover={{ y: -2 }}
                            >
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full" />
                            </motion.a>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        <motion.button
                            onClick={() => router.push('/parts')}
                            className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-colors"
                            whileHover={{ scale: 1.05 }}
                        >
                            <Car className="w-4 h-4" />
                            <span className="font-body text-sm">Parts</span>
                        </motion.button>
                        <motion.button
                            className="btn-cyber"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Login / Sign Up
                        </motion.button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
                            {['Features', 'How It Works', 'Testimonials'].map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                                    className="block font-body text-gray-300 hover:text-cyan-400 transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item}
                                </a>
                            ))}
                            <div className="pt-4 border-t border-cyan-500/20 space-y-3">
                                <button
                                    onClick={() => {
                                        router.push('/parts');
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="flex items-center gap-2 text-gray-300"
                                >
                                    <Car className="w-4 h-4" />
                                    <span className="font-body">Parts</span>
                                </button>
                                <button className="btn-cyber w-full">Login / Sign Up</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
};

export default Header;
