import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { WrenchIcon, UserIcon, LogoutIcon, BookOpenIcon } from './Icons';

interface HeaderProps {
    onAuthClick: () => void;
    onHistoryClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAuthClick, onHistoryClick }) => {
    const { user, logout } = useAuth();

    return (
        <header className="w-full bg-black/50 backdrop-blur-sm border-b border-brand-cyan/30 p-4 flex justify-between items-center flex-shrink-0 sticky top-0 z-50">
            <div className="flex items-center gap-2">
                <WrenchIcon className="w-8 h-8 text-brand-cyan" />
                <span className="text-xl font-bold text-white hidden sm:inline uppercase tracking-wider">
                    AI Auto Repair
                </span>
            </div>
            <div className="flex items-center gap-4">
                {user ? (
                    <>
                         <button 
                            onClick={onHistoryClick} 
                            className="flex items-center gap-2 text-gray-300 hover:text-brand-cyan font-semibold transition-colors"
                            aria-label="Repair History"
                        >
                            <BookOpenIcon className="w-6 h-6"/>
                            <span className="hidden md:inline">History</span>
                        </button>
                        <div className="h-6 border-l border-brand-cyan/30"></div>
                        <div className="flex items-center gap-2">
                            <UserIcon className="w-6 h-6 text-gray-300" />
                            <span className="font-semibold text-gray-200 hidden md:inline">{user.email}</span>
                        </div>
                        <button 
                            onClick={logout} 
                            className="flex items-center gap-2 text-gray-300 hover:text-brand-cyan font-semibold transition-colors"
                            aria-label="Logout"
                        >
                            <LogoutIcon className="w-6 h-6"/>
                            <span className="hidden md:inline">Logout</span>
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={onAuthClick}
                        className="bg-brand-cyan text-black font-bold py-2 px-6 rounded-lg hover:bg-brand-cyan-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-brand-cyan transition-all"
                    >
                       Login / Sign Up
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
