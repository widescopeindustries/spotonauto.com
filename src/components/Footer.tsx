'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu, Zap, Car, BookOpen, Shield, Mail, MessageSquare } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="relative border-t border-cyan-500/10 bg-black/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

                    {/* Brand */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <Cpu className="w-6 h-6 text-cyan-400" />
                            <span className="font-display font-bold text-lg tracking-wider text-white">
                                SPOTON<span className="text-cyan-400">AUTO</span>
                            </span>
                        </div>
                        <p className="font-body text-sm text-gray-500 leading-relaxed mb-4">
                            AI-powered auto repair guides. Save $200–$500 per repair with step-by-step instructions tailored to your exact vehicle.
                        </p>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-black bg-cyan-400 px-3 py-1.5 rounded-full">
                            100% Free
                        </span>
                    </div>

                    {/* Tools */}
                    <div>
                        <h3 className="font-display font-bold text-sm text-white uppercase tracking-widest mb-4">Tools</h3>
                        <ul className="space-y-3">
                            {[
                                { href: '/diagnose', label: 'AI Diagnostic Chat', icon: Zap, accent: true },
                                { href: '/guides', label: 'Repair Guides', icon: BookOpen },
                                { href: '/parts', label: 'Parts Finder', icon: Car },
                                { href: '/cel', label: 'Check Engine Light', icon: Shield },
                                { href: '/codes', label: 'DTC Code Lookup', icon: BookOpen },
                                { href: '/community', label: 'Community Forum', icon: MessageSquare },
                            ].map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-2 font-body text-sm transition-colors ${item.accent
                                                ? 'text-amber-400 hover:text-amber-300'
                                                : 'text-gray-400 hover:text-cyan-400'
                                            }`}
                                    >
                                        <item.icon className="w-3.5 h-3.5" />
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Popular Guides */}
                    <div>
                        <h3 className="font-display font-bold text-sm text-white uppercase tracking-widest mb-4">Popular Guides</h3>
                        <ul className="space-y-3">
                            {[
                                { href: '/repair/2013/bmw/x3/battery-replacement', label: 'BMW X3 Battery' },
                                { href: '/repair/2009/bmw/x5/serpentine-belt-replacement', label: 'BMW X5 Serpentine Belt' },
                                { href: '/repair/2013/toyota/corolla/oil-change', label: 'Toyota Corolla Oil Change' },
                                { href: '/repair/2009/honda/fit/brake-rotor-replacement', label: 'Honda Fit Brake Rotors' },
                                { href: '/repair/2013/nissan/rogue/serpentine-belt-replacement', label: 'Nissan Rogue Belt' },
                                { href: '/guides', label: 'Browse All 57 Guides →' },
                            ].map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="font-body text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="font-display font-bold text-sm text-white uppercase tracking-widest mb-4">Company</h3>
                        <ul className="space-y-3">
                            {[
                                { href: '/about', label: 'About Us' },
                                { href: '/auth', label: 'Sign In / Sign Up' },
                                { href: '/privacy', label: 'Privacy Policy' },
                                { href: '/terms', label: 'Terms of Service' },
                                { href: '/contact', label: 'Contact Us' },
                            ].map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="font-body text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-6 pt-4 border-t border-white/5">
                            <a
                                href="mailto:support@spotonauto.com"
                                className="flex items-center gap-2 text-sm text-gray-500 hover:text-cyan-400 transition-colors"
                            >
                                <Mail className="w-3.5 h-3.5" />
                                support@spotonauto.com
                            </a>
                        </div>
                    </div>
                </div>

                {/* SDVOSB Branding */}
                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="font-body text-sm" style={{ color: '#D4A017' }}>
                        🇺🇸 A Widescope Industries LLC Company — SDVOSB Certified | Service-Disabled Veteran-Owned Small Business
                    </p>
                    <a href="https://www.veteranownedbusiness.com" target="_blank" rel="noopener noreferrer" className="inline-block mt-4">
                        <img
                            src="https://www.veteranownedbusiness.com/images/banner_links/SDVOSB-Member-Badge-Horizontal.jpg"
                            alt="Veteran Owned Business Directory, Get your free listing, now!"
                            width={200}
                            height={40}
                            loading="lazy"
                            decoding="async"
                            style={{ maxWidth: '200px', height: 'auto' }}
                        />
                    </a>
                </div>

                {/* Bottom bar */}
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="font-body text-xs text-gray-600">
                        © {new Date().getFullYear()} SpotOn Auto. All rights reserved. AI-generated content is for informational purposes only.
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-700 font-mono">Powered by Gemini 2.0</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-gray-600 font-mono">All Systems Operational</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
