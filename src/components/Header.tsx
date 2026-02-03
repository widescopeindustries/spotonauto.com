'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { WrenchIcon, UserIcon, LogoutIcon, BookOpenIcon, ShoppingCartIcon } from './Icons';
import { useRouter } from 'next/navigation';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const router = useRouter();

    return (
        <header className="w-full bg-black/60 backdrop-blur-md border-b border-white/10 p-4 flex justify-between items-center flex-shrink-0 sticky top-0 z-50 shadow-glass">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="absolute inset-0 bg-brand-cyan blur-md opacity-20 animate-pulse-slow"></div>
                    <WrenchIcon className="w-8 h-8 text-brand-cyan relative z-10" />
                </div>
                <span className="text-xl font-bold text-white hidden sm:inline uppercase tracking-widest font-sans text-glow cursor-pointer" onClick={() => router.push('/')}>
                    SpotOn Auto
                </span>
            </div>
            <div className="flex items-center gap-4">
                {/* Shop Parts - Always visible */}
                <button
                    onClick={() => router.push('/parts')}
                    className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-semibold transition-all duration-300 hover:scale-105"
                    aria-label="Shop Parts"
                >
                    <ShoppingCartIcon className="w-5 h-5"/>
                    <span className="hidden md:inline font-mono text-sm">Parts</span>
                </button>
                <div className="h-6 border-l border-white/10"></div>
                {user ? (
                    <>
                         <button
                            onClick={() => router.push('/history')}
                            className="flex items-center gap-2 text-gray-400 hover:text-brand-cyan font-semibold transition-all duration-300 hover:scale-105"
                            aria-label="Repair History"
                        >
                            <BookOpenIcon className="w-5 h-5"/>
                            <span className="hidden md:inline font-mono text-sm">History</span>
                        </button>
                        <div className="h-6 border-l border-white/10"></div>
                        <div className="flex items-center gap-2 group">
                            <UserIcon className="w-5 h-5 text-gray-400 group-hover:text-neon-purple transition-colors" />
                            <span className="font-semibold text-gray-300 hidden md:inline font-mono text-sm group-hover:text-white transition-colors">{user.email}</span>
                        </div>
                        <button 
                            onClick={logout} 
                            className="flex items-center gap-2 text-gray-400 hover:text-red-400 font-semibold transition-all duration-300"
                            aria-label="Logout"
                        >
                            <LogoutIcon className="w-5 h-5"/>
                            <span className="hidden md:inline font-mono text-sm">Logout</span>
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={() => router.push('/auth')}
                        className="bg-brand-cyan/10 border border-brand-cyan/50 text-brand-cyan font-bold py-2 px-6 rounded-lg hover:bg-brand-cyan hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-brand-cyan transition-all duration-300 shadow-glow-cyan"
                    >
                       Login / Sign Up
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
