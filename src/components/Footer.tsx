import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-black/80 backdrop-blur-md border-t border-white/10 py-8 mt-auto">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-gray-500 text-sm font-mono">
                    &copy; {new Date().getFullYear()} AI Auto Repair. All rights reserved.
                </div>
                <div className="flex gap-6">
                    <Link href="/privacy" className="text-gray-400 hover:text-brand-cyan text-sm transition-colors font-sans">
                        Privacy Policy
                    </Link>
                    <Link href="/terms" className="text-gray-400 hover:text-brand-cyan text-sm transition-colors font-sans">
                        Terms of Service
                    </Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
