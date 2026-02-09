'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu } from 'lucide-react';
import { FadeInUp } from './MotionWrappers';

const Footer: React.FC = () => {
    return (
        <footer className="relative py-12 border-t border-cyan-500/10">
            <FadeInUp className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Cpu className="w-6 h-6 text-cyan-400" />
                        <span className="font-display font-bold text-lg tracking-wider text-white">
                            SPOTON<span className="text-cyan-400">AUTO</span>
                        </span>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-6">
                        <Link
                            href="/guides"
                            className="font-body text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                        >
                            Repair Guides
                        </Link>
                        <Link
                            href="/privacy"
                            className="font-body text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="/terms"
                            className="font-body text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                        >
                            Terms of Service
                        </Link>
                        <Link
                            href="/contact"
                            className="font-body text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                        >
                            Contact
                        </Link>
                    </div>

                    {/* Copyright */}
                    <div className="font-body text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} SpotOn Auto. All rights reserved.
                    </div>
                </div>
            </FadeInUp>
        </footer>
    );
};

export default Footer;
