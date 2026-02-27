'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface ProBadgeProps {
    onClick?: () => void;
    size?: 'sm' | 'md';
    className?: string;
}

const ProBadge: React.FC<ProBadgeProps> = ({ onClick, size = 'sm', className = '' }) => {
    const router = useRouter();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            router.push('/pricing');
        }
    };

    const sizeStyles = size === 'sm'
        ? 'text-[10px] px-1.5 py-0.5'
        : 'text-xs px-2 py-1';

    return (
        <button
            onClick={handleClick}
            className={`
                inline-flex items-center gap-1
                ${sizeStyles}
                font-bold uppercase tracking-wider
                bg-gradient-to-r from-cyan-400 to-amber-400
                text-gray-900
                rounded
                cursor-pointer
                transition-all duration-200
                hover:from-cyan-300 hover:to-amber-300
                hover:shadow-[0_0_12px_rgba(6,182,212,0.5)]
                active:scale-95
                ${className}
            `}
            aria-label="Upgrade to Pro for full access"
        >
            PRO
        </button>
    );
};

export default ProBadge;
